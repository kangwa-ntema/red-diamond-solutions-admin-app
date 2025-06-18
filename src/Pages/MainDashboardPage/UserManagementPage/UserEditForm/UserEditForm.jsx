// src/pages/UserEditForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserById, updateUser } from '../../../../services/api';

const UserEditForm = () => {
    const { id } = useParams(); // Get user ID from the URL
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        role: '',
        firstName: '',
        lastName: '',
        email: '',
        employeeId: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getUserById(id);
                // Populate form with fetched data
                setFormData({
                    username: data.username,
                    role: data.role,
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    employeeId: data.employeeId || '',
                    isActive: data.isActive,
                });
            } catch (err) {
                setError(err || "Failed to fetch user data.");
                console.error("Error fetching user data for edit:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id]); // Re-fetch if ID changes

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            await updateUser(id, formData);
            setMessage('User updated successfully!');
            setTimeout(() => navigate('/users'), 1500); // Redirect to user list
        } catch (err) {
            setError(err || 'Failed to update user.');
            console.error("Error updating user:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading user data...</div>;
    if (error) return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Link to="/users" style={{ display: 'inline-block', marginBottom: '20px', padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Back to User List</Link>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Edit User: {formData.username}</h2>
            {message && <p style={{ color: 'green', textAlign: 'center' }}>{message}</p>}
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Role:</label>
                    <select name="role" value={formData.role} onChange={handleChange} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                        <option value="client">Client</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>First Name:</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Last Name:</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Employee ID:</label>
                    <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} style={{ transform: 'scale(1.2)' }} />
                    <label htmlFor="isActive">Is Active</label>
                </div>
                <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1.1em', marginTop: '10px' }}>
                    {loading ? 'Updating...' : 'Update User'}
                </button>
            </form>
        </div>
    );
};

export default UserEditForm;