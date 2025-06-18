import api from '../axiosInstance';
import { handleApiError } from './utils';

/**
 * Fetches a list of all loans, with optional filtering by status (e.g., 'active', 'overdue').
 * @param {Object} [filters={}] - Optional filters like { status: 'active' }.
 * @returns {Promise<Object>} - Contains { loans: [...], overallSummary: { ... } }.
 */
export const getAllLoans = async (filters = {}) => {
    try {
        const response = await api.get('/api/loans', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching loans.");
    }
};

/**
 * Fetches a single loan's details by ID.
 * @param {string} loanId - The ID of the loan to fetch.
 * @returns {Promise<Object>} - The loan object.
 */
export const getLoanById = async (loanId) => {
    try {
        const response = await api.get(`/api/loans/${loanId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching loan details.");
    }
};

/**
 * Adds a new loan.
 * @param {Object} loanData - The loan's details.
 * @returns {Promise<Object>} - The newly created loan object.
 */
export const addLoan = async (loanData) => {
    try {
        const response = await api.post('/api/loans', loanData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while adding a new loan.");
    }
};

/**
 * Updates an existing loan's details.
 * @param {string} loanId - The ID of the loan to update.
 * @param {Object} loanData - The fields to update.
 * @returns {Promise<Object>} - The updated loan object.
 */
export const updateLoan = async (loanId, loanData) => {
    try {
        const response = await api.put(`/api/loans/${loanId}`, loanData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating loan.");
    }
};

/**
 * Deletes a loan record by ID.
 * @param {string} loanId - The ID of the loan to delete.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const deleteLoan = async (loanId) => {
    try {
        const response = await api.delete(`/api/loans/${loanId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting loan.");
    }
};

/**
 * Fetches the total loans receivable (sum of outstanding loan balances).
 * @returns {Promise<Object>} - Contains { totalLoansReceivable: number }.
 */
export const getLoansReceivableSummary = async () => {
    try {
        const response = await api.get('/api/loans/summary-financials');
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch total loans receivable.");
    }
};