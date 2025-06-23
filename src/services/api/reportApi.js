// src/services/reportApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

/**
 * Generates a Trial Balance report for a specific period (as of a specific date).
 * @param {Object} [filters={}] - Optional filters like { endDate: 'YYYY-MM-DD' }.
 * @returns {Promise<Object>} - Contains report data including accounts, totals, and balance status.
 */
export const getTrialBalanceReport = async (filters = {}) => { // Renamed from getTrialBalance for consistency
    try {
        const response = await api.get('/api/reports/trial-balance', { params: filters }); // Backend endpoint: /api/reports/trial-balance
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to generate Trial Balance report.");
    }
};

/**
 * Generates an Income Statement (Profit & Loss) for a specified period.
 * @param {Object} filters - Required filters: { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }.
 * @returns {Promise<Object>} - Contains report data including revenues, expenses, and net income.
 */
export const getIncomeStatementReport = async (filters) => { // Renamed from getIncomeStatement for consistency
    if (!filters.startDate || !filters.endDate) {
        throw new Error("Start date and end date are required for the Income Statement.");
    }
    try {
        const response = await api.get('/api/reports/income-statement', { params: filters }); // Backend endpoint: /api/reports/income-statement
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to generate Income Statement report.");
    }
};

/**
 * Generates a Balance Sheet report as of a specified date.
 * @param {Object} [filters={}] - Optional filters like { asOfDate: 'YYYY-MM-DD' }.
 * @returns {Promise<Object>} - Contains report data including assets, liabilities, equity, and balance status.
 */
export const getBalanceSheetReport = async (filters = {}) => { // Renamed from getBalanceSheet for consistency
    try {
        const response = await api.get('/api/reports/balance-sheet', { params: filters }); // Backend endpoint: /api/reports/balance-sheet
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to generate Balance Sheet report.");
    }
};
