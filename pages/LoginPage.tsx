
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App';
import Spinner from '../components/common/Spinner';
import { WEB_APP_URL } from '../constants';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{
        status: 'checking' | 'success' | 'error';
        message: string;
    }>({ status: 'checking', message: 'កំពុងពិនិត្យការតភ្ជាប់...' });
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const { login } = useContext(AppContext);

    useEffect(() => {
        const verifyWebAppUrl = async () => {
            if (!WEB_APP_URL || WEB_APP_URL.includes("AKfycbyPtAtOsZ3RwasV74Zi9fvCO0NgkGpnSnsTCe-4F4RgjB7ytX8y6He5ifSzyZo5Dj0o")) {
                setConnectionStatus({ status: 'error', message: 'URL មិនទាន់បានកំណត់រចនាសម្ព័ន្ធ។' });
                return;
            }
            try {
                const response = await fetch(`${WEB_APP_URL}?action=ping`);
                if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
                const data = await response.json();
                if (data.status === 'success' && data.message === 'pong') {
                    setConnectionStatus({ status: 'success', message: 'ការតភ្ជាប់ជោគជ័យ' });
                } else {
                    throw new Error('Invalid response from server.');
                }
            } catch (error) {
                console.error("Connection verification failed:", error);
                setConnectionStatus({ status: 'error', message: 'URL មិនត្រឹមត្រូវ ឬមិនដំណើរការ។' });
            }
        };
        verifyWebAppUrl();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${WEB_APP_URL}?action=getUsers`);
            if (!response.ok) throw new Error('Cannot connect to the server.');
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            
            const user = result.data.find((u: any) => u.UserName === username && u.Password == password);

            if (user) {
                login(user);
            } else {
                setError('ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ');
            }
        } catch (err: any) {
            setError('Login failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const ConnectionStatusIcon = () => {
        switch (connectionStatus.status) {
            case 'checking': return <Spinner size="sm" />;
            case 'success': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
            case 'error': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
        }
    };

    const statusClasses = {
        checking: 'bg-yellow-900/50 text-yellow-300',
        success: 'bg-green-900/50 text-green-300',
        error: 'bg-red-900/50 text-red-300'
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="page-card text-center">
                <div className={`text-sm rounded-lg p-3 mb-6 flex items-center justify-center space-x-2 ${statusClasses[connectionStatus.status]}`}>
                    <ConnectionStatusIcon />
                    <span className="font-medium">{connectionStatus.message}</span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">សូមស្វាគមន៍</h1>
                <p className="text-gray-400 mb-8 text-sm sm:text-base">សូមបញ្ចូលគណនីដើម្បីចូលប្រើប្រព័ន្ធ</p>
                
                <form onSubmit={handleLogin}>
                    <div className="space-y-6">
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ឈ្មោះគណនី" className="form-input text-center" required />
                        <div className="relative">
                            <input type={isPasswordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="ពាក្យសម្ងាត់" className="form-input text-center pr-10" required />
                            <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white">
                                {isPasswordVisible ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.126 2.454.364m-3.033 2.446a3 3 0 11-4.243 4.243m4.242-4.242l4.243 4.243M3 3l18 18" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <p className="text-red-400 mt-4 h-5">{error}</p>
                    <button type="submit" className="btn btn-primary w-full mt-8" disabled={loading || connectionStatus.status !== 'success'}>
                        {loading ? (
                            <>
                                <Spinner size="sm"/>
                                <span className="ml-2">កំពុងដំណើរការ...</span>
                            </>
                        ) : 'ចូលប្រើ'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;