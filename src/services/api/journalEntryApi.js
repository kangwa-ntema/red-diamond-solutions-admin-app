import api from '../axiosInstance';
import { handleApiError } from './utils';

/**
 * Fetches a list of all journal entries with optional filtering.
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate, accountId, type }.
 * @returns {Promise<Array>} - An array of journal entry objects.
 */
export const getJournalEntries = async (filters = {}) => {
    try {
        const response = await api.get('/api/journal-entries', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch journal entries.");
    }
};

// Add getJournalEntryById, createJournalEntry, updateJournalEntry, deleteJournalEntry here too.
// (Copy them from the accountingApi.js example above if you choose this option)

// ... (other imports like api, handleApiError)

// ... existing functions like getAccountingSummary, getTransactions, getJournalEntries

/**
 * Fetches a single journal entry by ID.
 * @param {string} id - The ID of the journal entry to fetch.
 * @returns {Promise<Object>} - The journal entry object.
 */
export const getJournalEntryById = async (id) => {
    try {
        const response = await api.get(`/api/journal-entries/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch journal entry details.");
    }
};

/**
 * Creates a new journal entry.
 * @param {Object} journalEntryData - The data for the new journal entry.
 * @returns {Promise<Object>} - The created journal entry object.
 */
export const createJournalEntry = async (journalEntryData) => {
    try {
        const response = await api.post('/api/journal-entries', journalEntryData);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to create journal entry.");
    }
};

/**
 * Updates an existing journal entry.
 * @param {string} id - The ID of the journal entry to update.
 * @param {Object} journalEntryData - The updated data for the journal entry.
 * @returns {Promise<Object>} - The updated journal entry object.
 */
export const updateJournalEntry = async (id, journalEntryData) => {
    try {
        const response = await api.put(`/api/journal-entries/${id}`, journalEntryData);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to update journal entry.");
    }
};