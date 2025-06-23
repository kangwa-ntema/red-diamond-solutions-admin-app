// frontend/src/services/api/accountActivityApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

const API_URL = '/api/account-activity-logs'; // Backend API base URL for account activity logs

/**
 * Fetches activity logs for a specific account.
 * @param {string} accountId The ID of the account to fetch logs for.
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Array>} A promise that resolves to an array of account activity log entries.
 */
export const getAccountActivityLogs = async (accountId, filters = {}) => {
  try {
    const response = await api.get(`${API_URL}/account/${accountId}`, { params: filters });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch account activity logs.");
  }
};

/**
 * Adds a new manual note to an account's activity log.
 * @param {string} accountId - The ID of the account to add the note for.
 * @param {Object} noteData - The note details (description).
 * @returns {Promise<Object>} - The newly created activity log entry.
 */
export const addAccountNote = async (accountId, noteData) => {
  try {
    const response = await api.post(`${API_URL}/note/${accountId}`, noteData);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to add account note.");
  }
};

/**
 * Deletes a specific account activity log entry (e.g., a manual note).
 * @param {string} activityId - The ID of the activity log entry to delete.
 * @returns {Promise<Object>} - Success message.
 */
export const deleteAccountActivity = async (activityId) => {
  try {
    const response = await api.delete(`${API_URL}/${activityId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to delete account activity log.");
  }
};
