import api from '../axiosInstance';
import { handleApiError } from './utils';

/**
 * Allows a superadmin to register a new user (admin, employee, or client).
 * @param {Object} userData - Contains username, password, role, firstName, lastName, email, employeeId, isActive.
 * @returns {Promise<Object>} - Contains success message and new user data.
 */
export const registerEmployeeUser = async (userData) => {
    try {
        const response = await api.post('/api/admin/users/register-employee', userData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred during user registration.");
    }
};

/**
 * Fetches a list of all users, with optional filtering.
 * @param {Object} [filters={}] - Optional filters like { role: 'admin', isActive: true }.
 * @returns {Promise<Object>} - Contains { users: [...], overallSummary: { ... } }.
 */
export const getAllUsers = async (filters = {}) => {
    try {
        const response = await api.get('/api/admin/users', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching users.");
    }
};

/**
 * Fetches a single user's details by ID.
 * @param {string} id - The ID of the user to fetch.
 * @returns {Promise<Object>} - The user object (without password).
 */
export const getUserById = async (id) => {
    try {
        const response = await api.get(`/api/admin/users/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching user details.");
    }
};

/**
 * Updates a user's details (by admin/superadmin).
 * @param {string} id - The ID of the user to update.
 * @param {Object} userData - The fields to update (e.g., username, role, isActive).
 * @returns {Promise<Object>} - The updated user object.
 */
export const updateUser = async (id, userData) => {
    try {
        const response = await api.put(`/api/admin/users/${id}`, userData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating user.");
    }
};

/**
 * Allows an admin/superadmin to change another user's password.
 * @param {string} id - The ID of the user whose password to change.
 * @param {string} newPassword - The new password.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const changeUserPasswordAdmin = async (id, newPassword) => {
    try {
        const response = await api.put(`/api/admin/users/change-password/${id}`, { newPassword });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while changing user password.");
    }
};

/**
 * Deletes a user record by ID (superadmin only).
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/api/admin/users/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting user.");
    }
};