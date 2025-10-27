
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User } from './types';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import RoleSelectionPage from './pages/RoleSelectionPage';
import UserJourney from './pages/UserJourney';
import Header from './components/common/Header';
import ImpersonationBanner from './components/common/ImpersonationBanner';
import Spinner from './components/common/Spinner';
import { WEB_APP_URL } from './constants';

declare global {
    interface Window {
        Html5Qrcode: any;
    }
}

// Mock environment variable for demonstration
// In a real environment, this would be set through a build process or server-side injection.
if (!process.env.API_KEY) {
    process.env.API_KEY = "YOUR_GEMINI_API_KEY"; // Replace with a placeholder or handle appropriately
}

export const AppContext = React.createContext<{
    currentUser: User | null;
    originalAdminUser: User | null;
    appData: any;
    login: (user: User) => void;
    logout: () => void;
    loginAs: (targetUser: User) => void;
    returnToAdmin: () => void;
    refreshData: () => Promise<void>;
    geminiAi: GoogleGenAI | null;
}>({
    currentUser: null,
    originalAdminUser: null,
    appData: {},
    login: () => {},
    logout: () => {},
    loginAs: () => {},
    returnToAdmin: () => {},
    refreshData: async () => {},
    geminiAi: null
});

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(null);
    const [appData, setAppData] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [appState, setAppState] = useState<'login' | 'role_selection' | 'user_journey' | 'admin_dashboard'>('login');
    const [geminiAi, setGeminiAi] = useState<GoogleGenAI | null>(null);
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const flare = document.querySelector('.flare-light');
            if (flare) {
                (flare as HTMLElement).style.setProperty('--x', `${e.clientX}px`);
                (flare as HTMLElement).style.setProperty('--y', `${e.clientY}px`);
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        const CACHE_KEY = 'appDataCache';
        const CACHE_DURATION = 3600 * 1000; // 1 hour

        try {
            const cachedDataString = localStorage.getItem(CACHE_KEY);
            let needsFetching = true;

            if (cachedDataString && !forceRefresh) {
                const cachedData = JSON.parse(cachedDataString);
                if (new Date().getTime() - cachedData.timestamp < CACHE_DURATION) {
                    setAppData(cachedData.data);
                    needsFetching = false;
                }
            }

            if (needsFetching) {
                const [staticResponse, usersResponse] = await Promise.all([
                    fetch(`${WEB_APP_URL}?action=getStaticData`),
                    fetch(`${WEB_APP_URL}?action=getUsers`)
                ]);

                if (!staticResponse.ok || !usersResponse.ok) throw new Error('Could not fetch app data.');
                
                const staticResult = await staticResponse.json();
                const usersResult = await usersResponse.json();

                if (staticResult.status !== 'success' || usersResult.status !== 'success') throw new Error('Failed to parse app data.');

                const combinedData = { ...staticResult.data, users: usersResult.data };
                setAppData(combinedData);
                localStorage.setItem(CACHE_KEY, JSON.stringify({ data: combinedData, timestamp: new Date().getTime() }));
            }
        } catch (error) {
            console.error("Data Fetching Error:", error);
            logout();
        } finally {
            setLoading(false);
        }
    }, []);

    const determineAppState = useCallback((user: User, isImpersonating: boolean) => {
        if (isImpersonating) {
            setAppState('user_journey');
            return;
        }

        const teams = (user.Team || '').split(',').map(t => t.trim()).filter(Boolean);
        if (user.IsSystemAdmin) {
            if (teams.length > 0) {
                setAppState('role_selection');
            } else {
                setAppState('admin_dashboard');
            }
        } else {
            setAppState('user_journey');
        }
    }, []);

    const checkSession = useCallback(async () => {
        setLoading(true);
        try {
            const originalAdminSessionString = localStorage.getItem('originalAdminSession');
            const sessionDataString = localStorage.getItem('orderAppSession');

            if (sessionDataString) {
                const sessionData = JSON.parse(sessionDataString);
                const now = new Date().getTime();
                const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;

                if (now - sessionData.timestamp > sevenDaysInMillis) {
                    logout();
                } else {
                    const user = sessionData.user;
                    setCurrentUser(user);
                    await fetchData();
                    let isImpersonating = false;
                    if (originalAdminSessionString) {
                        setOriginalAdminUser(JSON.parse(originalAdminSessionString).user);
                        isImpersonating = true;
                    }
                    determineAppState(user, isImpersonating);
                }
            }
        } catch (error) {
            console.error("Session check failed:", error);
            logout(); // Clear corrupted session
        } finally {
            setLoading(false);
        }
    }, [fetchData, determineAppState]);

    useEffect(() => {
        checkSession();
        if (process.env.API_KEY && process.env.API_KEY !== "YOUR_GEMINI_API_KEY") {
             setGeminiAi(new GoogleGenAI({apiKey: process.env.API_KEY}));
        } else {
            console.warn("Gemini API key is not configured. AI features will be disabled.");
        }
    }, [checkSession]);

    const login = (user: User) => {
        const sessionData = { user, timestamp: new Date().getTime() };
        localStorage.setItem('orderAppSession', JSON.stringify(sessionData));
        setCurrentUser(user);
        fetchData(true).then(() => {
            determineAppState(user, false);
        });
    };

    const logout = () => {
        localStorage.removeItem('orderAppSession');
        localStorage.removeItem('originalAdminSession');
        localStorage.removeItem('appDataCache');
        setCurrentUser(null);
        setOriginalAdminUser(null);
        setAppData({});
        setAppState('login');
    };
    
    const loginAs = (targetUser: User) => {
        if (!currentUser || !currentUser.IsSystemAdmin) return;
        
        const adminSession = { user: currentUser, timestamp: new Date().getTime() };
        localStorage.setItem('originalAdminSession', JSON.stringify(adminSession));
        
        const userSession = { user: targetUser, timestamp: new Date().getTime() };
        localStorage.setItem('orderAppSession', JSON.stringify(userSession));
        
        setOriginalAdminUser(currentUser);
        setCurrentUser(targetUser);
        setAppState('user_journey');
    };

    const returnToAdmin = () => {
        const adminSessionString = localStorage.getItem('originalAdminSession');
        if (!adminSessionString) { logout(); return; }

        const adminSession = JSON.parse(adminSessionString);
        localStorage.setItem('orderAppSession', JSON.stringify(adminSession));
        localStorage.removeItem('originalAdminSession');

        setCurrentUser(adminSession.user);
        setOriginalAdminUser(null);
        setAppState('admin_dashboard');
    };

    const refreshData = async () => {
        await fetchData(true);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen">
                     <div className="page-card inline-flex flex-col items-center">
                        <Spinner size="lg"/>
                        <p className="font-semibold text-lg mt-4">កំពុងទាញយកទិន្នន័យ...</p>
                     </div>
                </div>
            );
        }

        switch (appState) {
            case 'login':
                return <LoginPage />;
            case 'role_selection':
                return <RoleSelectionPage onSelect={(role) => setAppState(role)} />;
            case 'admin_dashboard':
                return <AdminDashboard />;
            case 'user_journey':
                return <UserJourney onBackToRoleSelect={() => setAppState('role_selection')} />;
            default:
                return <LoginPage />;
        }
    };
    
    return (
        <AppContext.Provider value={{ currentUser, originalAdminUser, appData, login, logout, loginAs, returnToAdmin, refreshData, geminiAi }}>
            <div className="min-h-screen w-full">
                {originalAdminUser && <ImpersonationBanner />}
                {currentUser && <Header onBackToRoleSelect={() => setAppState('role_selection')} />}
                <main className={`w-full transition-all duration-500 ${currentUser ? `pt-24 pb-8 px-2 sm:px-4 ${originalAdminUser ? 'mt-10' : ''}` : 'flex items-center justify-center min-h-screen p-2 sm:p-4'}`}>
                   {renderContent()}
                </main>
            </div>
        </AppContext.Provider>
    );
};

export default App;