// src/services/loanApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

/**
 * Fetches a list of all loans, with optional filtering by status (e.g., 'active', 'overdue').
 * @param {Object} [filters={}] - Optional filters like { status: 'active' }.
 * @returns {Promise<Object>} - Contains { loans: [...], overallSummary: { ... } }.
 */
export const getAllLoans = async (filters = {}) => {
    try {
        const response = await api.get('/api/loans', { params: filters }); // Backend endpoint: /api/loans
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
        const response = await api.get(`/api/loans/${loanId}`); // Backend endpoint: /api/loans/:id
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
        const response = await api.post('/api/loans', loanData); // Backend endpoint: /api/loans
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
        const response = await api.put(`/api/loans/${loanId}`, loanData); // Backend endpoint: /api/loans/:id
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
        const response = await api.delete(`/api/loans/${loanId}`); // Backend endpoint: /api/loans/:id
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
        const response = await api.get('/api/loans/summary-financials'); // Backend endpoint: /api/loans/summary-financials
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch total loans receivable.");
    }
};

/**
 * Triggers the backend to update overdue loan statuses.
 * @returns {Promise<Object>} - Contains a message and count of updated loans.
 */
export const updateLoanStatuses = async () => {
    try {
        const response = await api.put('/api/loans/update-statuses'); // Backend endpoint: /api/loans/update-statuses
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to trigger loan status update.");
    }
};
