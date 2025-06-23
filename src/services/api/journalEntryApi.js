// src/services/journalEntryApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

/**
 * Creates a new general journal entry.
 * @param {Object} entryData - The journal entry details.
 * @returns {Promise<Object>} - The newly created journal entry object.
 */
export const addJournalEntry = async (entryData) => { // Renamed from createJournalEntry for consistency
    try {
        const response = await api.post('/api/journal-entries', entryData); // Backend endpoint: /api/journal-entries
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while creating a journal entry.");
    }
};

/**
 * Fetches a list of all journal entries, with optional filtering.
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate, accountId, type }.
 * @returns {Promise<Array>} - An array of journal entry objects.
 */
export const getAllJournalEntries = async (filters = {}) => { // Renamed from getJournalEntries for consistency
    try {
        const response = await api.get('/api/journal-entries', { params: filters }); // Backend endpoint: /api/journal-entries
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching journal entries.");
    }
};

/**
 * Fetches a single journal entry's details by ID.
 * @param {string} id - The ID of the journal entry to fetch.
 * @returns {Promise<Object>} - The journal entry object.
 */
export const getJournalEntryById = async (id) => {
    try {
        const response = await api.get(`/api/journal-entries/${id}`); // Backend endpoint: /api/journal-entries/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching journal entry details.");
    }
};

/**
 * Updates an existing journal entry.
 * @param {string} id - The ID of the journal entry to update.
 * @param {Object} entryData - The updated data for the journal entry.
 * @returns {Promise<Object>} - The updated journal entry object.
 */
export const updateJournalEntry = async (id, entryData) => {
    try {
        const response = await api.put(`/api/journal-entries/${id}`, entryData); // Backend endpoint: /api/journal-entries/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating journal entry.");
    }
};

/**
 * Deletes a journal entry by ID.
 * @param {string} id - The ID of the journal entry to delete.
 * @returns {Promise<Object>} - Success message.
 */
export const deleteJournalEntry = async (id) => {
    try {
        const response = await api.delete(`/api/journal-entries/${id}`); // Backend endpoint: /api/journal-entries/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting journal entry.");
    }
};
