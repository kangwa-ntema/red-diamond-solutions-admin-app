// src/pages/ChangeMyPasswordPage.js
// This component replaces your original ChangePasswordForm.js
import React, { useState } from 'react';
import { changeMyPassword } from '../../../../services/api';
import { useNavigate, Link } from 'react-router-dom';

const ChangeMyPasswordPage = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmNewPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        if (newPassword.length < 6) { // Basic client-side validation
            setError('New password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            const data = await changeMyPassword(currentPassword, newPassword);
            setMessage(data.message);
            // Clear form fields on success
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            // Optionally redirect after a short delay
            // setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            setError(err || 'Failed to change password.');
            console.error("Change password failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Link to="/mainDashboard" style={{ display: 'inline-block', marginBottom: '20px', padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Back to Dashboard</Link>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Change Your Password</h2>
            {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Current Password:</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>New Password:</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Confirm New Password:</label>
                    <input
                        type="password"
                        name="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        disabled={loading}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1.1em', marginTop: '10px' }}>
                    {loading ? 'Changing...' : 'Change Password'}
                </button>
            </form>
        </div>
    );
};

export default ChangeMyPasswordPage;