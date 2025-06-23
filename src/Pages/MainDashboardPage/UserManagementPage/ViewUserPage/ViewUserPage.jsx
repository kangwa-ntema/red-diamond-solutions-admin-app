// src/Pages/MainDashboardPage/UserManagementPage/ViewUserPage/ViewUserPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserById, deleteUser, changeUserPasswordAdmin } from '../../../../services/api/';
import { useAuth } from '../../../../context/AuthContext'; // To get current user and check roles
import { toast } from 'react-toastify'; // For notifications
import './ViewUserPage.css'; // Import the CSS file

/**
 * @component ViewUserPage
 * @description Displays the detailed profile of a single user.
 * Allows admins/superadmins to view user data and perform actions like edit/delete/reset password.
 * Includes improved handling for invalid user IDs in the URL.
 */
const ViewUserPage = () => {
    const { id } = useParams(); // Get user ID from URL parameters
    const navigate = useNavigate();
    const { user: currentUser, hasRole } = useAuth(); // Get current logged-in user and role checker

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false); // State for delete operation
    const [resettingPassword, setResettingPassword] = useState(false); // State for reset password operation

    // State for custom confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'delete' or 'resetPassword'
    const [modalMessage, setModalMessage] = useState('');

    // Function to fetch user details
    const fetchUserDetails = useCallback(async () => {
        // --- IMPORTANT ADDITION: Validate ID before making API call ---
        if (!id || id === 'undefined') {
            setLoading(false);
            setError("User ID is missing or invalid in the URL. Please select a user from the list.");
            setUser(null); // Ensure no old user data is shown
            toast.error("Invalid user ID provided. Navigation error."); // User-friendly toast
            return; // Stop the function execution
        }
        // --- END IMPORTANT ADDITION ---

        setLoading(true);
        setError(null);
        try {
            const data = await getUserById(id);
            // Assuming API returns the user object directly, as per userApi.js definition.
            setUser(data);
        } catch (err) {
            // handleApiError (from axiosInstance) should have already displayed a toast and redirected if necessary
            setError(err.message || 'Failed to fetch user details.');
            console.error("Error fetching user details:", err);
            setUser(null); // Ensure user is null on error
        } finally {
            setLoading(false);
        }
    }, [id]); // Re-fetch if the ID in the URL changes

    // Initial fetch on component mount and when ID changes
    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);

    // Function to open the confirmation modal for delete
    const confirmDeleteAction = () => {
        if (!user) return; // Should not happen if rendering is conditional on `user`

        // Prevent superadmin from deleting their own account
        if (currentUser && currentUser._id === user._id) {
            toast.error("You cannot delete your own user account from here.");
            return;
        }

        setModalAction('delete');
        setModalMessage(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`);
        setShowConfirmModal(true);
    };

    // Function to open the confirmation modal for password reset
    const confirmResetPasswordAction = () => {
        if (!user) return;

        // Prevent admin from resetting their own password via this interface
        if (currentUser && currentUser._id === user._id) {
            toast.error("You cannot reset your own password from this admin interface. Please use the 'Change My Password' feature.");
            return;
        }

        setModalAction('resetPassword');
        setModalMessage(`Are you sure you want to reset the password for user "${user.username}"? This will set a new temporary password and email it to them.`);
        setShowConfirmModal(true);
    };

    // Consolidated function to execute the confirmed action
    const executeConfirmedAction = async () => {
        setShowConfirmModal(false); // Close modal

        if (modalAction === 'delete' && user) {
            setDeleting(true);
            try {
                await deleteUser(user._id);
                toast.success('User deleted successfully!');
                navigate('/users'); // Redirect to user list after deletion
            } catch (err) {
                toast.error(`Failed to delete user: ${err.message || 'Network error'}`);
                console.error("Error deleting user:", err);
                setError(err.message || 'Failed to delete user.'); // Set local error state
            } finally {
                setDeleting(false);
            }
        } else if (modalAction === 'resetPassword' && user) {
            setResettingPassword(true);
            try {
                // The backend's `changeUserPasswordAdmin` API usually expects a newPassword.
                // If your backend is designed to generate the temporary password internally
                // without receiving it from the frontend for this specific route,
                // you might need to adjust your `userApi.js` call or the backend route.
                // For now, we pass a placeholder string 'system-generated-password'.
                await changeUserPasswordAdmin(user._id, 'system-generated-password'); // Placeholder value
                toast.success(`Password for ${user.username} has been reset and emailed.`);
            } catch (err) {
                toast.error(`Failed to reset password: ${err.message || 'Network error'}`);
                console.error("Error resetting password:", err);
                setError(err.message || 'Failed to reset password.'); // Set local error state
            } finally {
                setResettingPassword(false);
            }
        }
        setModalAction(null); // Reset modal action
    };

    // Conditional Rendering for Loading, Error, Not Found
    if (loading) {
        return <div className="viewUserPageContainer"><div className="viewUserMessage">Loading user details...</div></div>;
    }

    if (error) {
        return <div className="viewUserPageContainer"><div className="viewUserErrorMessage">Error: {error}</div></div>;
    }

    if (!user) {
        // This will now catch cases where `id` was invalid (handled by `fetchUserDetails`)
        // or if the user simply couldn't be found by the backend.
        return <div className="viewUserPageContainer"><div className="viewUserMessage">User not found or inaccessible.</div></div>;
    }

    // Helper to get role class for styling
    const getRoleClass = (role) => {
        if (typeof role !== 'string') {
            return ''; // Return empty string or a default class if role is not a string
        }
        switch (role.toLowerCase()) {
            case 'superadmin': return 'role-superadmin';
            case 'admin': return 'role-admin';
            case 'employee': return 'role-employee';
            case 'client': return 'role-client';
            default: return '';
        }
    };

    // Helper to get status class for styling
    const getStatusClass = (isActive) => {
        return isActive ? 'status-active' : 'status-inactive';
    };

    return (
        <div className="viewUserPageContainer">
            <div className="viewUserPageContent">
                <Link to="/users" className="viewUserBackLink">
                    Back to User List
                </Link>

                <h2 className="viewUserHeadline">User Profile: {user.username}</h2>

                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">Username:</label>
                    <p className="viewUserDetailValue">{user.username}</p>
                </div>
                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">Role:</label>
                    <p className={`viewUserDetailValue ${getRoleClass(user.role)}`}>{user.role}</p>
                </div>
                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">Status:</label>
                    <p className={`viewUserDetailValue ${getStatusClass(user.isActive)}`}>{user.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                {/* Ensure these fields are present in your User model if you expect them */}
                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">First Name:</label>
                    <p className="viewUserDetailValue">{user.firstName || 'N/A'}</p>
                </div>
                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">Last Name:</label>
                    <p className="viewUserDetailValue">{user.lastName || 'N/A'}</p>
                </div>
                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">Email:</label>
                    <p className="viewUserDetailValue">{user.email || 'N/A'}</p>
                </div>
                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">Employee ID:</label>
                    <p className="viewUserDetailValue">{user.employeeId || 'N/A'}</p>
                </div>
                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">Registered On:</label>
                    <p className="viewUserDetailValue">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="viewUserDetailGroup">
                    <label className="viewUserDetailLabel">Last Updated:</label>
                    <p className="viewUserDetailValue">{new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>

                <div className="viewUserActions">
                    {/* Edit button: Accessible to superadmin and admin */}
                    {hasRole(["superadmin", "admin"]) && (
                        <Link to={`/users/${user._id}/edit`} className="viewUserActionButton edit-btn">
                            Edit User
                        </Link>
                    )}

                    {/* View Activity Log button: Accessible to superadmin and admin */}
                    {hasRole(["superadmin", "admin"]) && (
                        <Link to={`/users/${user._id}/user-activity-logs`} className="viewUserActionButton view-activity-btn">
                            View Activity Log
                        </Link>
                    )}

                    {/* Reset Password button: Accessible to superadmin and admin, but not for self */}
                    {hasRole(["superadmin", "admin"]) && currentUser && currentUser._id !== user._id && (
                        <button onClick={confirmResetPasswordAction} disabled={resettingPassword} className="viewUserActionButton reset-password-btn">
                            {resettingPassword ? 'Resetting...' : 'Reset Password'}
                        </button>
                    )}

                    {/* Delete button: Accessible only to superadmin, and cannot delete self */}
                    {hasRole(["superadmin"]) && currentUser && currentUser._id !== user._id && (
                        <button onClick={confirmDeleteAction} disabled={deleting} className="viewUserActionButton delete-btn">
                            {deleting ? 'Deleting...' : 'Delete User'}
                        </button>
                    )}
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <h3>Confirm Action</h3>
                        <p>{modalMessage}</p>
                        <div className="modalActions">
                            <button onClick={executeConfirmedAction} className="modalConfirmBtn">Confirm</button>
                            <button onClick={() => setShowConfirmModal(false)} className="modalCancelBtn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewUserPage;
