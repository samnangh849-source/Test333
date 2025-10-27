
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import Spinner from '../components/common/Spinner';
import { WEB_APP_URL } from '../constants';
import { analyzeReportData, generateProductDescription } from '../services/geminiService';
import GeminiButton from '../components/common/GeminiButton';
import { User } from '../types';

type AdminView = 'dashboard' | 'orders' | 'reports' | 'config';

const AdminDashboard: React.FC = () => {
    const { loginAs, currentUser, geminiAi } = useContext(AppContext);
    const [currentView, setCurrentView] = useState<AdminView>('dashboard');
    const [loading, setLoading] = useState(false);
    const [adminData, setAdminData] = useState<any>(null);
    
    useEffect(() => {
        const loadAdminData = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${WEB_APP_URL}?action=getAllSheetDataForAdmin`);
                if (!response.ok) throw new Error('Could not fetch admin data.');
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.message);
                setAdminData(result.data);
            } catch (error) {
                console.error("Failed to load admin dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        loadAdminData();
    }, []);
    
    const Sidebar = () => (
         <aside className="w-16 md:w-64 bg-gray-800 text-gray-300 flex-shrink-0 p-2 md:p-4 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-6 hidden md:block">Admin Panel</h2>
            <nav className="admin-sidebar-nav flex flex-col space-y-2">
                {(Object.keys(viewConfig) as AdminView[]).map(view => {
                    const { label, icon } = viewConfig[view];
                    return (
                        <a 
                            href="#" 
                            key={view}
                            onClick={(e) => { e.preventDefault(); setCurrentView(view); }}
                            className={`flex items-center p-3 rounded-md ${currentView === view ? 'active' : ''}`}
                            title={label}
                        >
                            {icon}
                            <span className="ml-4 hidden md:block">{label}</span>
                        </a>
                    );
                })}
            </nav>
        </aside>
    );

    const DashboardView = () => {
        const stats = [
            { label: 'អ្នកប្រើប្រាស់', value: adminData.users.length, icon: '👤' },
            { label: 'ក្រុម (Teams)', value: adminData.teams.length, icon: '👥' },
            { label: 'ផលិតផល', value: adminData.products.length, icon: '🛍️' },
            { label: 'អ្នកដឹកជញ្ជូន', value: adminData.drivers.length, icon: '🚚' },
            { label: 'គណនីធនាគារ', value: adminData.bankAccounts.length, icon: '🏦' }
        ];
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map(stat => (
                    <div key={stat.label} className="page-card flex items-center p-6">
                        <div className="text-4xl mr-6">{stat.icon}</div>
                        <div>
                            <p className="text-4xl font-bold text-white">{stat.value}</p>
                            <p className="text-gray-400">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const ConfigView = () => {
        const manageableSheets: Record<string, string> = {
            'users': 'អ្នកប្រើប្រាស់', 'products': 'ផលិតផល', 'teams': 'ក្រុម', 'locations': 'ទីតាំង',
            'shippingMethods': 'វិធីដឹកជញ្ជូន', 'drivers': 'អ្នកដឹកជញ្ជូន', 'bankAccounts': 'គណនីធនាគារ',
            'phoneCarriers': 'ក្រុមហ៊ុនទូរស័ព្ទ', 'telegramTemplates': 'គំរូសារ Telegram',
        };
        const [activeSheet, setActiveSheet] = useState('users');
        const [searchTerm, setSearchTerm] = useState('');
        
        const data = adminData[activeSheet] || [];
        const headers = data.length > 0 ? Object.keys(data[0]) : [];

        const filteredData = data.filter((row: any) => 
            Object.values(row).some(value => 
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );

        return (
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <div className="page-card p-4">
                        <nav className="flex flex-col space-y-1">
                            {Object.keys(manageableSheets).map(key => (
                                <a href="#" key={key} onClick={e => {e.preventDefault(); setActiveSheet(key)}} className={`p-3 rounded-md text-gray-300 hover:bg-gray-700 ${activeSheet === key ? 'bg-gray-700 font-semibold' : ''}`}>
                                    {manageableSheets[key]}
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
                <div className="md:col-span-3">
                    <div className="page-card">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-blue-400">{manageableSheets[activeSheet]}</h2>
                            <button className="btn btn-secondary text-sm">បន្ថែមថ្មី</button>
                        </div>
                        <input type="text" placeholder="ស្វែងរក..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="form-input mb-4"/>
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        {headers.map(h => <th key={h}>{h}</th>)}
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row: any, index: number) => (
                                        <tr key={index}>
                                            {headers.map(h => <td key={h} className="max-w-xs truncate">{String(row[h])}</td>)}
                                            <td className="whitespace-nowrap">
                                                <button className="action-btn text-yellow-400 hover:text-yellow-600 p-1">✏️</button>
                                                <button className="action-btn text-red-400 hover:text-red-600 p-1">🗑️</button>
                                                {activeSheet === 'users' && row['UserName'] !== currentUser?.UserName && (
                                                    <button onClick={() => loginAs(row as User)} className="action-btn text-blue-400 hover:text-blue-600 p-1" title={`Login as ${row['UserName']}`}>👤</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        )
    };
    
    const ReportsView = () => {
        const [analysis, setAnalysis] = useState('');
        const [isAnalyzing, setIsAnalyzing] = useState(false);
        const [reportData, setReportData] = useState<any>(null);

        useEffect(() => {
            const fetchReports = async () => {
                try {
                    const res = await fetch(`${WEB_APP_URL}?action=getReportData`);
                    const result = await res.json();
                    if(result.status === 'success') setReportData(result.data);
                } catch(e) { console.error(e); }
            };
            fetchReports();
        }, []);

        const handleAnalyze = async () => {
            if (!geminiAi || !reportData) return;
            setIsAnalyzing(true);
            setAnalysis('');
            const result = await analyzeReportData(geminiAi, reportData);
            setAnalysis(result);
            setIsAnalyzing(false);
        };
        
        return (
            <div>
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-blue-400">Reports View</h2>
                     {geminiAi && reportData && (
                        <GeminiButton onClick={handleAnalyze} isLoading={isAnalyzing}>
                            Analyze with Gemini
                        </GeminiButton>
                     )}
                 </div>
                 {isAnalyzing && <div className="flex items-center space-x-2"><Spinner/> <p>Gemini is analyzing...</p></div>}
                 {analysis && (
                     <div className="page-card bg-blue-900/20 border-blue-700 mt-4">
                         <h3 className="font-bold text-lg text-blue-300 mb-2">Gemini Analysis</h3>
                         <pre className="text-gray-300 whitespace-pre-wrap font-sans">{analysis}</pre>
                     </div>
                 )}
                <p className="text-gray-400 mt-4">(Detailed report tables and charts would be implemented here.)</p>
            </div>
        )
    };

    const viewConfig = {
        dashboard: { label: 'ទិន្នន័យសង្ខេប', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
        orders: { label: 'ប្រតិបត្តិការណ៍', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
        reports: { label: 'របាយការណ៍', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
        config: { label: 'ការគ្រប់គ្រង', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    };

    const renderView = () => {
        if (loading || !adminData) {
            return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
        }

        switch (currentView) {
            case 'dashboard': return <DashboardView />;
            case 'config': return <ConfigView />;
            case 'reports': return <ReportsView />;
            case 'orders': return <p>Orders view not implemented yet.</p>;
            default: return <div>Select a view</div>;
        }
    };

    return (
        <div className="flex h-full min-h-[calc(100vh-6rem)] w-full max-w-7xl mx-auto">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <h1 className="text-3xl font-bold text-white mb-6">{viewConfig[currentView].label}</h1>
                {renderView()}
            </main>
        </div>
    );
};

export default AdminDashboard;