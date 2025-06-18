import api from '../axiosInstance';
import { handleApiError } from './utils';

/**
 * Adds a new accounting account.
 * @param {Object} accountData - The account details (e.g., accountCode, accountName, accountType).
 * @returns {Promise<Object>} - The newly created account object.
 */
export const addAccount = async (accountData) => {
    try {
        const response = await api.post('/api/accounts', accountData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while adding a new account.");
    }
};

/**
 * Updates an existing accounting account's details.
 * @param {string} accountId - The ID of the account to update.
 * @param {Object} accountData - The fields to update.
 * @returns {Promise<Object>} - The updated account object.
 */
export const updateAccount = async (accountId, accountData) => {
    try {
        const response = await api.put(`/api/accounts/${accountId}`, accountData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating an account.");
    }
};

/**
 * Fetches a list of all accounting accounts.
 * @param {Object} [filters={}] - Optional filters.
 * @returns {Promise<Array>} - An array of accounting account objects.
 */
export const getAccounts = async (filters = {}) => {
    try {
        const response = await api.get('/api/accounts', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch accounts list.");
    }
};

/**
 * Deletes an accounting account by ID.
 * @param {string} accountId - The ID of the account to delete.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const deleteAccount = async (accountId) => {
    try {
        const response = await api.delete(`/api/accounts/${accountId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting the account.");
    }
};