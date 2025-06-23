// src/services/accountApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

/**
 * Adds a new account to the Chart of Accounts.
 * @param {Object} accountData - The account details.
 * @returns {Promise<Object>} - The newly created account object.
 */
export const addAccount = async (accountData) => {
    try {
        const response = await api.post('/api/accounts', accountData); // Backend endpoint: /api/accounts
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while adding an account.");
    }
};

/**
 * Fetches all accounts in the Chart of Accounts.
 * @returns {Promise<Array>} - An array of account objects.
 */
export const getAllAccounts = async () => {
    try {
        const response = await api.get('/api/accounts'); // Backend endpoint: /api/accounts
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching accounts.");
    }
};

/**
 * Fetches a single account's details by ID.
 * @param {string} id - The ID of the account to fetch.
 * @returns {Promise<Object>} - The account object.
 */
export const getAccountById = async (id) => {
    try {
        const response = await api.get(`/api/accounts/${id}`); // Backend endpoint: /api/accounts/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching account details.");
    }
};

/**
 * Updates an existing account's details.
 * @param {string} id - The ID of the account to update.
 * @param {Object} accountData - The fields to update.
 * @returns {Promise<Object>} - The updated account object.
 */
export const updateAccount = async (id, accountData) => {
    try {
        const response = await api.put(`/api/accounts/${id}`, accountData); // Backend endpoint: /api/accounts/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating account.");
    }
};

/**
 * Deletes an account record by ID.
 * @param {string} id - The ID of the account to delete.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const deleteAccount = async (id) => {
    try {
        const response = await api.delete(`/api/accounts/${id}`); // Backend endpoint: /api/accounts/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting account.");
    }
};

/**
 * Fetches the General Ledger for a specific account.
 * @param {string} accountId - The ID of the account.
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Object>} - Contains account, openingBalance, transactions, and closingBalance.
 */
export const getGeneralLedger = async (accountId, filters = {}) => {
    try {
        const response = await api.get(`/api/accounts/${accountId}/ledger`, { params: filters }); // Backend endpoint: /api/accounts/:id/ledger
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching general ledger.");
    }
};
