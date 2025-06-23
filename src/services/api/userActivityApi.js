// frontend/src/services/api/userActivityApi.js
import api, { handleApiError } from '../axiosInstance';

const API_URL = '/api/user-activity-logs';

/**
 * Fetches activity logs for a specific user.
 * @param {string} userId - The ID of the user to fetch logs for.
 * @returns {Promise<Array>} A promise that resolves to an array of user activity log entries.
 */
export const getUserActivityLogs = async (userId) => {
  try {
    const response = await api.get(`${API_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error fetching user activity logs:');
    throw error; // Re-throw to allow component to catch and set error state
  }
};

/**
 * Adds a new manual note to a user's activity log.
 * @param {string} userId - The ID of the user to add the note for.
 * @param {Object} noteData - The note details (e.g., { message: "Note content", action: "Note Added" }).
 * @returns {Promise<Object>} The newly created activity log entry.
 */
export const addUserNote = async (userId, noteData) => {
  try {
    const response = await api.post(`${API_URL}/note/${userId}`, noteData);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error adding user note:');
    throw error; // Re-throw for error handling in component
  }
};

/**
 * Deletes a specific user activity log entry.
 * @param {string} activityId - The ID of the activity log entry to delete.
 * @returns {Promise<Object>} Success message.
 */
export const deleteUserActivity = async (activityId) => {
  try {
    const response = await api.delete(`${API_URL}/${activityId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error deleting user activity:');
    throw error; // Re-throw for error handling in component
  }
};
