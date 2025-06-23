    // src/services/authApi.js
    import api, { handleApiError } from '../axiosInstance'; // Correct import from centralized axiosInstance

    /**
     * Handles user login.
     * @param {string} username - User's username.
     * @param {string} password - User's password.
     * @returns {Promise<Object>} - Contains user data on success (backend sets httpOnly cookie).
     */
    export const loginUser = async (username, password) => {
        try {
            const response = await api.post('/api/admin/login', { username, password }); // Backend endpoint: /api/admin/login
            return response.data;
        } catch (error) {
            // handleApiError will throw, so no need for a redundant throw here
            handleApiError(error, "An unknown error occurred during login.");
        }
    };

    /**
     * Handles user logout.
     * @returns {Promise<Object>} - Contains a success message.
     */
    export const logoutUser = async () => {
        try {
            const response = await api.get('/api/admin/logout'); // Backend endpoint: /api/admin/logout
            return response.data;
        } catch (error) {
            handleApiError(error, "An unknown error occurred during logout.");
        }
    };

    /**
     * Verifies the current session's validity with the backend.
     * This is crucial when using httpOnly cookies, as the token isn't accessible on the client.
     * @returns {Promise<Object>} - Contains verification status (e.g., { isValid: boolean, user: {...} }).
     */
    export const verifyToken = async () => {
        try {
            // Corrected backend endpoint from '/api/admin/verify-session' to '/api/admin/me'
            const response = await api.get('/api/admin/me'); // Backend endpoint: /api/admin/me
            return { isValid: true, user: response.data.data }; // Assuming backend sends user data in 'data' field
        } catch (error) {
            // For verifyToken, the global interceptor already handles 401 redirection/toast.
            // We simply return isValid: false for AuthContext to update its state.
            // No need to call handleApiError here as it would show a redundant toast or redirect again.
            console.error("Session verification failed:", error); // Log the error but don't toast/redirect again
            return { isValid: false, user: null };
        }
    };

    /**
     * Allows a logged-in user to change their own password.
     * @param {string} currentPassword - The user's current password.
     * @param {string} newPassword - The new password.
     * @returns {Promise<Object>} - Contains a success message.
     */
    export const changeMyPassword = async (currentPassword, newPassword) => {
        try {
            const response = await api.put('/api/admin/updatepassword', { currentPassword, newPassword }); // Backend endpoint: /api/admin/change-password
            return response.data;
        } catch (error) {
            handleApiError(error, "An unknown error occurred while changing password.");
        }
    };

    /**
     * Handles forgot password request (sends reset email).
     * @param {string} email - The user's email address.
     * @returns {Promise<Object>} - Contains a success message.
     */
    export const forgotPassword = async (email) => {
        try {
            const response = await api.post('/api/admin/forgotpassword', { email }); // Backend endpoint: /api/admin/forgotpassword
            return response.data;
        } catch (error) {
            handleApiError(error, "Failed to send password reset email.");
        }
    };

    /**
     * Resets user password using a provided reset token.
     * @param {string} resetToken - The password reset token from the email.
     * @param {string} newPassword - The new password.
     * @returns {Promise<Object>} - Contains a success message.
     */
    export const resetPassword = async (resetToken, newPassword) => {
        try {
            const response = await api.put(`/api/admin/resetpassword/${resetToken}`, { newPassword }); // Backend endpoint: /api/admin/resetpassword/:resetToken
            return response.data;
        } catch (error) {
            handleApiError(error, "Failed to reset password.");
        }
    };
