// src/pages/AdminChangePasswordPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserById, changeUserPasswordAdmin } from '../services/api';

const AdminChangePasswordPage = () => {
    const { id } = useParams(); // Get user ID from the URL
    const navigate = useNavigate();
    const [username, setUsername] = useState(''); // To display whose password is being changed
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Fetch user's username on component mount to display
    useEffect(() => {
        const fetchUserName = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getUserById(id);
                setUsername(data.username);
            } catch (err) {
                setError(err || "Failed to fetch user details.");
                console.error("Error fetching user for password change:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserName();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmNewPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            await changeUserPasswordAdmin(id, newPassword);
            setMessage(`Password for ${username} updated successfully!`);
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => navigate('/users'), 1500); // Redirect back to user list
        } catch (err) {
            setError(err || 'Failed to change user password.');
            console.error("Error changing user password:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading user details...</div>;
    if (error && !username) return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>Error: {error}</div>; // Only show error if username not loaded

    return (
        <div style={{ padding: '20px', maxWidth: '500px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Link to="/users" style={{ display: 'inline-block', marginBottom: '20px', padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Back to User List</Link>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Change Password for: {username}</h2>
            {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>New Password:</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
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

export default AdminChangePasswordPage;