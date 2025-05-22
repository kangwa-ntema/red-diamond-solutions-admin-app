import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./ChangePasswordForm.css"; // You can create this CSS file later

   const ChangePasswordForm = () => {
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmNewPassword, setConfirmNewPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);
const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (newPassword !== confirmNewPassword) {
            setError('New password and confirmation do not match.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/change-password', {
                method: 'PUT', // Or POST, typically PUT for updating a resource
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Important for sending the JWT cookie
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (response.ok) {
                setSuccess('Password changed successfully! You will be redirected to login.');
                // Optional: force logout after password change for security
                setTimeout(() => {
                    navigate('/loginform');
                }, 2000);
            } else if (response.status === 401 || response.status === 403) {
                const errorData = await response.json();
                setError(errorData.message || 'Authentication required. Please log in.');
                navigate('/loginform');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to change password.');
            }
        } catch (err) {
            console.error("Error changing password:", err);
            setError('Network error or server unavailable.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-container">
            <h1>Change Password</h1>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="currentPassword">Current Password:</label>
                    <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password:</label>
                    <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                    <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
                </div>
                           
                <button type="submit" disabled={loading}>
                    {loading ? 'Changing...' : 'Change Password'}
                </button>

                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
            </form>
        </div>
    );
};

export default ChangePasswordForm;