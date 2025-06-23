// src/services/transactionApi.js
import api, { handleApiError } from '../axiosInstance'; // Corrected import from centralized axiosInstance

/**
 * Fetches the overall transactions summary (total debits, credits, net cash flow, unique transaction types).
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Object>} - Contains overall summary data.
 */
export const getTransactionsSummary = async (filters = {}) => { // Renamed for clarity
    try {
        const response = await api.get('/api/transactions/summary', { params: filters }); // Backend endpoint: /api/transactions/summary
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch overall transactions summary.");
    }
};

/**
 * Fetches the accounting summary by transaction type.
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Object>} - Contains type-specific summary data.
 */
export const getTransactionsTypeSummary = async (filters = {}) => { // Renamed for clarity
    try {
        const response = await api.get('/api/transactions/type-summary', { params: filters }); // Backend endpoint: /api/transactions/type-summary
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch transaction type summary.");
    }
};

/**
 * Fetches a list of all transactions with optional filtering.
 * @param {Object} [filters={}] - Optional filters like { type, startDate, endDate, clientId, loanId }.
 * @returns {Promise<Array>} - An array of transaction objects.
 */
export const getTransactions = async (filters = {}) => {
    try {
        const response = await api.get('/api/transactions', { params: filters }); // Backend endpoint: /api/transactions
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch transactions list.");
    }
};
