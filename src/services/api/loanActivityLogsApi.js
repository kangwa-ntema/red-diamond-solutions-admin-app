// frontend/src/services/api/loanActivityLogsApi.js
import axios from '../axiosInstance'; // Assuming your configured axios instance with interceptors
import { handleApiError } from '../axiosInstance'; // Import handleApiError

const API_URL = '/api/loan-activity-logs'; // Your backend API base URL for loan activity logs

/**
 * Fetches activity logs for a specific loan.
 * @param {string} loanId The ID of the loan to fetch logs for.
 * @returns {Promise<Array>} A promise that resolves to an array of loan activity log entries.
 */
export const getLoanActivityLogs = async (loanId) => {
  try {
    const response = await axios.get(`${API_URL}/loan/${loanId}`);
    return response.data; // Assuming backend directly returns an array
  } catch (error) {
    handleApiError(error, 'Error fetching loan activity logs:');
    // You might want to throw a custom error or handle it more gracefully
    throw error; // Re-throw to allow component to catch and set error state
  }
};

/**
 * Adds a new note to a loan's activity log.
 * @param {string} loanId The ID of the loan to add the note to.
 * @param {Object} noteData The note details (e.g., { message: "Note content", action: "Note Added" }).
 * @returns {Promise<Object>} A promise that resolves to the new activity log entry.
 */
export const addLoanNote = async (loanId, noteData) => {
  try {
    const response = await axios.post(`${API_URL}/note/${loanId}`, noteData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error adding loan note:');
    throw error; // Re-throw for error handling in component
  }
};

/**
 * Deletes a specific loan activity log entry.
 * @param {string} activityId The ID of the activity log entry to delete.
 * @returns {Promise<Object>} A promise that resolves to a success message.
 */
export const deleteLoanActivity = async (activityId) => {
  try {
    const response = await axios.delete(`${API_URL}/${activityId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error deleting loan activity:');
    throw error; // Re-throw for error handling in component
  }
};
