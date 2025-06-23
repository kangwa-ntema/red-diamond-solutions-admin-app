// src/services/paymentApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

/**
 * Fetches payments for a specific loan by its ID.
 * @param {string} loanId - The ID of the loan to fetch payments for.
 * @returns {Promise<Array>} - An array of payment objects.
 */
export const getPaymentsByLoanId = async (loanId) => {
    try {
        const response = await api.get(`/api/payments/loan/${loanId}`); // Backend endpoint: /api/payments/loan/:loanId
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching loan payments.");
    }
};

/**
 * Records a manual payment for a specific loan.
 * @param {Object} paymentData - The payment details (e.g., loanId, amount, date, method, notes).
 * @returns {Promise<Object>} - Contains success message or payment details.
 */
export const recordPayment = async (paymentData) => {
    try {
        // paymentData should already contain loanId, amount, date, method, notes
        const response = await api.post(`/api/payments`, paymentData); // Backend endpoint: /api/payments
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while recording manual payment.");
    }
};

/**
 * Initiates an electronic payment (e.g., USSD push via a mobile money service).
 * @param {Object} paymentData - Contains loanId, amount, paymentMethod, phoneNumber, clientName, clientEmail.
 * @returns {Promise<Object>} - Contains transaction reference or success message.
 */
export const initiateElectronicPayment = async (paymentData) => {
    try {
        const response = await api.post(`/api/payments/initiate`, paymentData); // Backend endpoint: /api/payments/initiate
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while initiating electronic payment.");
    }
};

// Note: The webhook route for payments (`/api/payments/webhook`) is handled directly by the backend
// and does not require a frontend API function call. 

