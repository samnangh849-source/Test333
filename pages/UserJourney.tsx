
import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { Order, Product } from '../types';

interface UserJourneyProps {
   onBackToRoleSelect: () => void;
}

// A simple placeholder for now. This will be expanded into a multi-step form.
const UserJourney: React.FC<UserJourneyProps> = ({ onBackToRoleSelect }) => {
    const { currentUser, appData } = useContext(AppContext);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

     if (!currentUser) return null;

    const teams = (currentUser.Team || '').split(',').map(t => t.trim()).filter(Boolean);

    if (teams.length > 1 && !selectedTeam) {
        return (
             <div className="w-full max-w-4xl mx-auto page-card">
                <h2 className="text-2xl font-bold text-center mb-8 text-white">សូមជ្រើសរើសក្រុមដើម្បីបន្ត</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {teams.map(team => (
                        <button key={team} onClick={() => setSelectedTeam(team)} className="selection-button">
                            ក្រុម {team}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    // Set team automatically if there's only one
    if (teams.length === 1 && !selectedTeam) {
        setSelectedTeam(teams[0]);
    }

    return (
        <div className="w-full max-w-2xl mx-auto page-card">
            <h2 className="text-2xl font-bold text-center mb-4 text-white">
                Order Submission Flow
            </h2>
            <p className="text-center text-gray-400">
                Welcome, {currentUser.FullName}. You are on team {selectedTeam || 'N/A'}.
            </p>
            <p className="text-center mt-4 text-yellow-300">
                (The full multi-step order form would be implemented here.)
            </p>

            {teams.length > 1 && (
                 <div className="text-center mt-8">
                    <button onClick={() => setSelectedTeam(null)} className="btn btn-secondary">
                        ត្រឡប់ទៅជ្រើសរើសក្រុម
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserJourney;