// src/services/clientActivityApi.js
import api, { handleApiError } from '../axiosInstance';

/**
 * Fetches activity logs for a specific client.
 * @param {string} clientId - The ID of the client.
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Array>} - An array of client activity log entries.
 */
export const getClientActivityLogs = async (clientId, filters = {}) => {
    try {
        const response = await api.get(`/api/client-activity/${clientId}`, { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch client activity logs.");
    }
};

/**
 * Adds a new manual note to a client's activity log.
 * @param {string} clientId - The ID of the client to add the note for.
 * @param {Object} noteData - The note details (description, optional activityDate).
 * @returns {Promise<Object>} - The newly created activity log entry.
 */
export const addClientNote = async (clientId, noteData) => {
    try {
        const response = await api.post(`/api/client-activity/${clientId}/add-note`, noteData);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to add client note.");
    }
};

/**
 * Deletes a specific client activity log entry.
 * @param {string} activityId - The ID of the activity log entry to delete.
 * @returns {Promise<Object>} - Success message.
 */
export const deleteClientActivity = async (activityId) => {
    try {
        const response = await api.delete(`/api/client-activity/${activityId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to delete client activity log entry.");
    }
};
