import api from '../axiosInstance';
import { handleApiError } from './utils';

/**
 * Fetches payments for a specific loan by its ID.
 * @param {string} loanId - The ID of the loan to fetch payments for.
 * @returns {Promise<Array>} - An array of payment objects.
 */
export const getPaymentsByLoanId = async (loanId) => {
    try {
        const response = await api.get(`/api/payments/loan/${loanId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching loan payments.");
    }
};

/**
 * Records a manual payment for a specific loan.
 * @param {string} loanId - The ID of the loan for which payment is being recorded.
 * @param {Object} paymentData - The payment details (e.g., amount, date, method, notes, clientId).
 * @returns {Promise<Object>} - Contains success message or payment details.
 */
export const recordPayment = async (loanId, paymentData) => {
    try {
        const response = await api.post(`/api/payments`, paymentData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while recording manual payment.");
    }
};

/**
 * Initiates an electronic payment via Airtel Money.
 * @param {Object} paymentData - Contains loanId, amount, phoneNumber, clientName, clientEmail.
 * @returns {Promise<Object>} - Contains transaction reference or success message.
 */
export const initiateAirtelMoneyPayment = async (paymentData) => {
    try {
        const response = await api.post(`/api/payments/initiate`, paymentData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while initiating Airtel Money payment.");
    }
};