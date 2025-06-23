// src/Pages/MainDashboardPage/UserManagementPage/UserEditForm/UserEditForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// Correct import from the modular userApi service
import { getUserById, updateUser } from '../../../../services/api/';
import { toast } from 'react-toastify'; // For notifications
import './UserEditForm.css'; // Import the new CSS file

/**
 * @component UserEditForm
 * @description Allows admins/superadmins to edit the details of an existing user.
 */
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
    const [loading, setLoading] = useState(true); // Initially loading as we fetch user data
    // Using toast for messages, so local state for message can be removed if not for persistent display
    // const [message, setMessage] = useState('');
    const [error, setError] = useState(null); // Use null for no error, string for message

    // Fetch user data on component mount
    const fetchUserData = useCallback(async () => {
        setLoading(true);
        setError(null); // Clear previous errors
        // setMessage(''); // Clear previous messages if using local message state
        try {
            const data = await getUserById(id);
            // Populate form with fetched data
            setFormData({
                username: data.username || '',
                role: data.role || '',
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                employeeId: data.employeeId || '',
                isActive: typeof data.isActive === 'boolean' ? data.isActive : true, // Ensure boolean
            });
        } catch (err) {
            // handleApiError (from axiosInstance) should have already displayed a toast and handled redirect if necessary
            setError(err.message || "Failed to fetch user data."); // Set local error state from message property
            console.error("Error fetching user data for edit:", err);
            setFormData({ // Clear form if data fetch fails
                username: '', role: '', firstName: '', lastName: '', email: '', employeeId: '', isActive: true,
            });
        } finally {
            setLoading(false);
        }
    }, [id]); // Re-fetch if ID changes

    useEffect(() => {
        if (id) {
            fetchUserData();
        }
    }, [id, fetchUserData]); // Depend on id and memoized fetchUserData

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
        // setMessage(''); // No longer needed with toast
        setError(null); // Clear previous errors

        try {
            await updateUser(id, formData);
            toast.success('User updated successfully!'); // Use toast for success message
            // setMessage('User updated successfully!'); // Removed, toast is sufficient
            // Optionally, clear form or redirect immediately
            setTimeout(() => navigate('/users'), 1500); // Redirect to user list after a short delay
        } catch (err) {
            // handleApiError (from axiosInstance) should have already displayed toast and handled redirect
            setError(err.message || 'Failed to update user.'); // Set local error state from message property
            console.error("Error updating user:", err);
        } finally {
            setLoading(false);
        }
    };

    // Conditional rendering for loading, error states
    if (loading) {
        return <div className="editUserFormContainer"><div className="editUserMessage">Loading user data...</div></div>;
    }

    if (error) {
        return <div className="editUserFormContainer"><div className="editUserErrorMessage">Error: {error}</div></div>;
    }

    // If user data is fetched but some critical fields are missing (unlikely if backend is good)
    // This condition might need refinement depending on what constitutes "not found" vs "empty data"
    if (!formData.username && !loading && !error) {
        return <div className="editUserFormContainer"><div className="editUserMessage">User data not found for editing or no username available.</div></div>;
    }

    return (
        <div className="editUserFormContainer">
            <div className="editUserFormContent">
                <Link to="/users" className="editUserBackLink">
                    Back to User List
                </Link>
                <h2 className="editUserHeadline">Edit User: {formData.username}</h2>

                {/* Messages for success or general error */}
                {/* {message && <p className="editUserSuccessMessage">{message}</p>} */}
                {error && <p className="editUserErrorMessage">{error}</p>} {/* Render local error here */}

                <form onSubmit={handleSubmit} className="editUserForm">
                    <div className="editUserFormGroup">
                        <label htmlFor="username">Username:</label>
                        <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required disabled={loading} />
                    </div>
                    <div className="editUserFormGroup">
                        <label htmlFor="role">Role:</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} required disabled={loading}>
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                            <option value="client">Client</option>
                        </select>
                    </div>
                    <div className="editUserFormGroup">
                        <label htmlFor="firstName">First Name:</label>
                        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="editUserFormGroup">
                        <label htmlFor="lastName">Last Name:</label>
                        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="editUserFormGroup">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="editUserFormGroup">
                        <label htmlFor="employeeId">Employee ID:</label>
                        <input type="text" id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="editUserFormCheckboxGroup">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} disabled={loading} />
                        <label htmlFor="isActive">Is Active</label>
                    </div>

                    <button type="submit" disabled={loading} className="editUserSubmitBtn">
                        {loading ? 'Updating...' : 'Update User'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserEditForm;
