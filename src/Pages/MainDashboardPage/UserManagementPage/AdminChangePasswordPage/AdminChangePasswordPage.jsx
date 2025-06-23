// src/Pages/MainDashboardPage/UserManagementPage/AdminChangePasswordPage/AdminChangePasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
// Corrected import: Now importing from the modular userApi service
import { getUserById, changeUserPasswordAdmin } from '../../../../services/api/';
import { toast } from 'react-toastify'; // For notifications
import { Eye, EyeOff } from 'lucide-react'; // Import Eye icons for password toggle
import './AdminChangePasswordPage.css'; // Import a dedicated CSS file

/**
 * @component AdminChangePasswordPage
 * @description Allows an admin or superadmin to change another user's password.
 * The new password is set directly by the admin.
 * Includes show/hide password functionality.
 */
const AdminChangePasswordPage = () => {
    const { id } = useParams(); // Get user ID from the URL
    const navigate = useNavigate();
    const [username, setUsername] = useState(''); // To display whose password is being changed
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(true); // Initially loading as we fetch username
    const [error, setError] = useState(null); // Use null for no error, string for message

    // State for showing/hiding passwords
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    // Fetch user's username on component mount to display
    useEffect(() => {
        const fetchUserName = async () => {
            setLoading(true);
            setError(null);
            try {
                // Ensure ID is valid before fetching
                if (!id) {
                    setError("User ID is missing in the URL.");
                    setLoading(false);
                    return;
                }
                const data = await getUserById(id);
                setUsername(data.username); // Assuming data directly contains the user object
            } catch (err) {
                // handleApiError (from axiosInstance) should have already displayed a toast and handled redirect if necessary
                setError(err.message || "Failed to fetch user details."); // Extract message consistently
                console.error("Error fetching user for password change:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) { // Only fetch if ID is available
            fetchUserName();
        } else {
            setLoading(false); // If no ID, stop loading immediately
            setError("User ID is missing in the URL.");
        }
    }, [id]); // Depend on ID to re-fetch if URL parameter changes

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        if (newPassword !== confirmNewPassword) {
            setError('New password and confirm password do not match.');
            toast.error('New password and confirm password do not match.');
            return;
        }

        if (newPassword.length < 6) { // Example password policy
            setError('New password must be at least 6 characters long.');
            toast.error('New password must be at least 6 characters long.');
            return;
        }

        setLoading(true); // Set loading for the API call
        try {
            // Call the changeUserPasswordAdmin from the userApi service
            await changeUserPasswordAdmin(id, newPassword);
            toast.success(`Password for ${username} updated successfully!`); // Use toast for success
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => navigate('/users'), 1500); // Redirect back to user list after toast
        } catch (err) {
            // handleApiError (from axiosInstance) should have already displayed toast and handled redirect
            setError(err.message || 'Failed to change user password.'); // Extract message consistently
            console.error("Error changing user password:", err);
        } finally {
            setLoading(false);
        }
    };

    // Conditional rendering for loading and error states (improved presentation)
    if (loading) {
        return <div className="adminChangePasswordContainer"><div className="adminChangePasswordMessage">Loading user details...</div></div>;
    }

    if (error && !username) { // Only show global error if username couldn't be loaded at all
        return <div className="adminChangePasswordContainer"><div className="adminChangePasswordErrorMessage">Error: {error}</div></div>;
    }

    // If no username found (e.g., invalid ID from URL after initial load)
    if (!username && !loading) {
        return <div className="adminChangePasswordContainer"><div className="adminChangePasswordMessage">User not found or invalid ID.</div></div>;
    }

    return (
        <div className="adminChangePasswordContainer">
            <Link to="/users" className="adminChangePasswordBackLink">Back to User List</Link>
            <h2 className="adminChangePasswordHeadline">Change Password for: {username}</h2>

            {/* Local error message display (e.g., password mismatch) */}
            {error && <p className="adminChangePasswordErrorMessage">{error}</p>}

            <form onSubmit={handleSubmit} className="adminChangePasswordForm">
                <div className="adminChangePasswordFormGroup">
                    <label htmlFor="newPassword">New Password:</label>
                    <div className="password-input-wrapper"> {/* Wrapper for input and icon */}
                        <input
                            type={showNewPassword ? "text" : "password"}
                            id="newPassword"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <span
                            className="password-toggle-icon"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                </div>
                <div className="adminChangePasswordFormGroup">
                    <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                    <div className="password-input-wrapper"> {/* Wrapper for input and icon */}
                        <input
                            type={showConfirmNewPassword ? "text" : "password"}
                            id="confirmNewPassword"
                            name="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <span
                            className="password-toggle-icon"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        >
                            {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                </div>
                <button type="submit" disabled={loading} className="adminChangePasswordSubmitBtn">
                    {loading ? 'Changing...' : 'Change Password'}
                </button>
            </form>
        </div>
    );
};

export default AdminChangePasswordPage;
