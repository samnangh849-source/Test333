
import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import Modal from './Modal';
import Spinner from './Spinner';
import { WEB_APP_URL } from '../../constants';

interface EditProfileModalProps {
    onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
    const { currentUser, refreshData } = useContext(AppContext);
    const [fullName, setFullName] = useState(currentUser?.FullName || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profilePicUrl, setProfilePicUrl] = useState(currentUser?.ProfilePictureURL || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!fullName) {
            setError('សូមបំពេញឈ្មោះពេញ។');
            return;
        }

        if (password !== confirmPassword) {
            setError('ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ។');
            return;
        }
        
        setLoading(true);

        const payload = {
            action: 'updateUserProfile',
            username: currentUser?.UserName,
            fullName,
            newPassword: password,
            profilePictureURL: profilePicUrl,
        };

        try {
            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.message);
            
            await refreshData();
            onClose();
            alert('Profile បានកែសម្រួលដោយជោគជ័យ។');

        } catch (err: any) {
            setError(err.message || 'ការកែសម្រួលមានបញ្ហា។');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">កែសម្រួល Profile</h2>
                <button onClick={onClose} className="text-2xl text-gray-500 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">ឈ្មោះគណនី</label>
                    <input type="text" value={currentUser?.UserName || ''} className="form-input bg-gray-800 cursor-not-allowed" readOnly />
                </div>
                <div>
                    <label htmlFor="edit-fullname" className="block text-sm font-medium text-gray-400 mb-2">ឈ្មោះពេញ</label>
                    <input type="text" id="edit-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="form-input" required />
                </div>
                 <div>
                    <label htmlFor="edit-profile-picture-url" className="block text-sm font-medium text-gray-400 mb-2">URL រូបភាព Profile</label>
                    <input type="text" id="edit-profile-picture-url" value={profilePicUrl} onChange={(e) => setProfilePicUrl(e.target.value)} className="form-input" placeholder="បិទភ្ជាប់ URL រូបភាព" />
                </div>
                <div>
                    <label htmlFor="edit-password" className="block text-sm font-medium text-gray-400 mb-2">ពាក្យសម្ងាត់ថ្មី (ទុកឲ្យនៅទំនេរ បើមិនប្តូរ)</label>
                    <input type="password" id="edit-password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" />
                </div>
                 <div>
                    <label htmlFor="edit-confirm-password" className="block text-sm font-medium text-gray-400 mb-2">បញ្ជាក់ពាក្យសម្ងាត់ថ្មី</label>
                    <input type="password" id="edit-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input" />
                </div>
                {error && <p className="text-red-400 mt-2 h-5">{error}</p>}
                <div className="flex justify-end pt-4 space-x-4">
                    <button type="button" onClick={onClose} className="btn btn-secondary">បោះបង់</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <Spinner size="sm" /> : 'រក្សាទុក'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProfileModal;