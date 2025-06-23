// src/Pages/MainDashboardPage/UserManagementPage/RegisterUserForm/RegisterUserForm.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Corrected import: Now importing from the modular userApi service
import { registerEmployeeUser } from '../../../../services/api/'; // Path adjusted for modularity
import { toast } from 'react-toastify'; // Ensure toast is imported for notifications
import './RegisterUserForm.css'; // Import the new CSS file

/**
 * @component RegisterUserForm
 * @description A React component for registering new users (employees, admins, superadmins, clients).
 * This form is typically accessible only by 'superadmin' role.
 */
const RegisterUserForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'employee', // Default role for new registrations
        firstName: '',
        lastName: '',
        email: '',
        employeeId: '',
        isActive: true, // Default to active
    });
    const [loading, setLoading] = useState(false);
    // Using toast for messages, so local state for message/error can be simplified or removed
    // const [message, setMessage] = useState('');
    // const [error, setError] = useState('');
    const navigate = useNavigate();

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
        // setError('');   // No longer needed with toast

        try {
            const data = await registerEmployeeUser(formData);
            toast.success(data.message || 'User registered successfully!'); // Use toast for success
            // Clear form after successful registration
            setFormData({
                username: '',
                password: '',
                role: 'employee',
                firstName: '',
                lastName: '',
                email: '',
                employeeId: '',
                isActive: true,
            });
            // Redirect to user list after a short delay for toast to be seen
            setTimeout(() => navigate('/users'), 1500);
        } catch (err) {
            // handleApiError (from axiosInstance) typically handles displaying the toast error.
            // We just ensure the error is logged and reset loading state.
            toast.error(err.message || 'Failed to register user.'); // Show error using toast
            // setError(err.message || 'Failed to register user.'); // No longer needed with toast
            console.error("Registration failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registerUserFormContainer">
            <div className="registerUserFormContent">
                <Link to="/users" className="registerUserBackLink">
                    Back to User List
                </Link>
                <h2 className="registerUserHeadline">Register New User</h2>
                {/* Message/Error display can be handled entirely by react-toastify */}
                {/* {message && <p className="registerUserSuccessMessage">{message}</p>} */}
                {/* {error && <p className="registerUserErrorMessage">{error}</p>} */}
                <form onSubmit={handleSubmit} className="registerUserForm">
                    <div className="registerUserFormGroup">
                        <label htmlFor="username">Username:</label>
                        <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required disabled={loading} />
                    </div>
                    <div className="registerUserFormGroup">
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required disabled={loading} />
                    </div>
                    <div className="registerUserFormGroup">
                        <label htmlFor="role">Role:</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} required disabled={loading}>
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                            <option value="client">Client</option>
                        </select>
                    </div>
                    <div className="registerUserFormGroup">
                        <label htmlFor="firstName">First Name:</label>
                        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="registerUserFormGroup">
                        <label htmlFor="lastName">Last Name:</label>
                        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="registerUserFormGroup">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="registerUserFormGroup">
                        <label htmlFor="employeeId">Employee ID:</label>
                        <input type="text" id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleChange} disabled={loading} />
                    </div>
                    <div className="registerUserFormCheckboxGroup">
                        <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} disabled={loading} />
                        <label htmlFor="isActive">Is Active</label>
                    </div>
                    <button type="submit" disabled={loading} className="registerUserSubmitBtn">
                        {loading ? 'Registering...' : 'Register User'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterUserForm;
