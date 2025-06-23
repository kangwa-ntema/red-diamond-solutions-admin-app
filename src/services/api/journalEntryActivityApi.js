// frontend/src/services/api/journalEntryActivityApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

const API_URL = '/api/journal-entry-activity-logs'; // Backend API base URL for journal entry activity logs

/**
 * Fetches activity logs for a specific journal entry.
 * @param {string} journalEntryId The ID of the journal entry to fetch logs for.
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Array>} A promise that resolves to an array of journal entry activity log entries.
 */
export const getJournalEntryActivityLogs = async (journalEntryId, filters = {}) => {
  try {
    const response = await api.get(`${API_URL}/entry/${journalEntryId}`, { params: filters });
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch journal entry activity logs.");
  }
};

/**
 * Adds a new manual note to a journal entry's activity log.
 * @param {string} journalEntryId - The ID of the journal entry to add the note for.
 * @param {Object} noteData - The note details (description).
 * @returns {Promise<Object>} - The newly created activity log entry.
 */
export const addJournalEntryNote = async (journalEntryId, noteData) => {
  try {
    const response = await api.post(`${API_URL}/note/${journalEntryId}`, noteData);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to add journal entry note.");
  }
};

/**
 * Deletes a specific journal entry activity log entry (e.g., a manual note).
 * @param {string} activityId - The ID of the activity log entry to delete.
 * @returns {Promise<Object>} - Success message.
 */
export const deleteJournalEntryActivity = async (activityId) => {
  try {
    const response = await api.delete(`${API_URL}/${activityId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Failed to delete journal entry activity log.");
  }
};
