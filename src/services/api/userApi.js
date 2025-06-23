// src/services/userApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

/**
 * Registers a new employee/admin user by a superadmin.
 * @param {Object} userData - User details (username, password, role, firstName, lastName, email, employeeId, isActive).
 * @returns {Promise<Object>} - Details of the newly registered user.
 */
export const registerEmployeeUser = async (userData) => {
    try {
        const response = await api.post('/api/admin/users/register-employee', userData); // Backend endpoint: /api/admin/users/register-employee
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to register new user.");
    }
};

/**
 * Fetches a list of all users, with optional filtering.
 * @param {Object} [filters={}] - Optional filters like { role: 'admin', isActive: true }.
 * @returns {Promise<Object>} - Contains an array of users and an overall summary.
 */
export const getAllUsers = async (filters = {}) => {
    try {
        const response = await api.get('/api/admin/users', { params: filters }); // Backend endpoint: /api/admin/users
        return response.data; // Backend now sends { users, overallSummary }
    } catch (error) {
        handleApiError(error, "Failed to fetch users.");
    }
};

/**
 * Fetches a single user by ID. Accessible by superadmin and admin.
 * @param {string} id - The ID of the user to fetch.
 * @returns {Promise<Object>} - Details of the user.
 */
export const getUserById = async (id) => {
    try {
        const response = await api.get(`/api/admin/users/${id}`); // Backend endpoint: /api/admin/users/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch user details.");
    }
};

/**
 * Updates an existing user's details. Accessible by superadmin and admin.
 * @param {string} id - The ID of the user to update.
 * @param {Object} userData - The updated user data.
 * @returns {Promise<Object>} - Updated user details.
 */
export const updateUser = async (id, userData) => {
    try {
        const response = await api.put(`/api/admin/users/${id}`, userData); // Backend endpoint: /api/admin/users/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to update user.");
    }
};

/**
 * Allows superadmin/admin to change another user's password.
 * @param {string} userId - The ID of the user whose password is to be changed.
 * @param {string} newPassword - The new password for the user.
 * @returns {Promise<Object>} - Success message.
 */
export const changeUserPasswordAdmin = async (userId, newPassword) => {
    try {
        const response = await api.put(`/api/admin/users/change-password/${userId}`, { newPassword }); // Backend endpoint: /api/admin/users/change-password/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to reset user's password.");
    }
};

/**
 * Deletes a user by ID. Accessible only by superadmin.
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<Object>} - Success message.
 */
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/api/admin/users/${id}`); // Backend endpoint: /api/admin/users/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to delete user.");
    }
};
