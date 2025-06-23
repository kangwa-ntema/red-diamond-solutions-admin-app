// src/Pages/MainDashboardPage/UserManagementPage/ChangeMyPasswordPage/ChangeMyPasswordPage.jsx
import React, { useState } from 'react';
import { changeMyPassword } from '../../../../services/api/'; // Corrected import from modular authApi
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // For notifications
import { Eye, EyeOff } from 'lucide-react'; // Import Eye icons for password toggle
import './ChangeMyPasswordPage.css'; // Import a dedicated CSS file

/**
 * @component ChangeMyPasswordPage
 * @description Allows the currently logged-in user to change their own password.
 * Includes show/hide password functionality and enhanced error logging.
 */
const ChangeMyPasswordPage = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // State for showing/hiding passwords
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmNewPassword) {
            const mismatchError = 'New password and confirm password do not match.';
            setError(mismatchError);
            toast.error(mismatchError);
            return;
        }

        if (newPassword.length < 6) {
            const lengthError = 'New password must be at least 6 characters long.';
            setError(lengthError);
            toast.error(lengthError);
            return;
        }

        setLoading(true);
        try {
            const data = await changeMyPassword(currentPassword, newPassword);
            // --- NEW DEBUGGING LOG ---
            console.log("Backend response for changeMyPassword:", data);
            // --- END NEW DEBUGGING LOG ---
            toast.success(data.message || 'Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => navigate('/mainDashboard'), 1500);
        } catch (err) {
            // handleApiError (from axiosInstance) should have already displayed toast for API errors
            const errorMessage = err.message || 'Failed to change password.';
            setError(errorMessage);
            console.error("Change password failed:", err);
            // If the error message is specific, you can add a toast here for it if handleApiError is too generic
            // toast.error(`Error: ${errorMessage}`); // Uncomment if handleApiError doesn't provide sufficient toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="changeMyPasswordContainer">
            <Link to="/mainDashboard" className="changeMyPasswordBackLink">Back to Dashboard</Link>
            <h2 className="changeMyPasswordHeadline">Change Your Password</h2>
            {error && <p className="changeMyPasswordErrorMessage">{error}</p>}

            <form onSubmit={handleSubmit} className="changeMyPasswordForm">
                <div className="changeMyPasswordFormGroup">
                    <label htmlFor="currentPassword">Current Password:</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showCurrentPassword ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                        <span
                            className="password-toggle-icon"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                </div>
                <div className="changeMyPasswordFormGroup">
                    <label htmlFor="newPassword">New Password:</label>
                    <div className="password-input-wrapper">
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
                <div className="changeMyPasswordFormGroup">
                    <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                    <div className="password-input-wrapper">
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
                <button type="submit" disabled={loading} className="changeMyPasswordSubmitBtn">
                    {loading ? 'Changing...' : 'Change Password'}
                </button>
            </form>
        </div>
    );
};

export default ChangeMyPasswordPage;
