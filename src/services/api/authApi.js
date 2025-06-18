import api from '../axiosInstance';
import { handleApiError } from './utils';

/**
 * Handles user login.
 * @param {string} username - User's username.
 * @param {string} password - User's password.
 * @returns {Promise<Object>} - Contains user data and token on success.
 */
export const loginUser = async (username, password) => {
    try {
        const response = await api.post('/api/admin/login', { username, password });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred during login.");
    }
};

/**
 * Handles user logout.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const logoutUser = async () => {
    try {
        const response = await api.get('/api/admin/logout');
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred during logout.");
    }
};

/**
 * Verifies the current session's validity with the backend.
 * @returns {Promise<Object>} - Contains verification status (e.g., { isValid: boolean, user: {...} }).
 */
export const verifyToken = async () => {
    try {
        const response = await api.get('/api/admin/verify-session');
        return { isValid: true, user: response.data.user };
    } catch (error) {
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
        const response = await api.put('/api/admin/change-password', { currentPassword, newPassword });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while changing password.");
    }
};