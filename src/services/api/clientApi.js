// src/services/clientApi.js
import api, { handleApiError } from '../axiosInstance'; // Import the configured Axios instance and error handler

/**
 * Fetches a list of all clients, with optional filtering by status (e.g., 'active', 'inactive').
 * @param {Object} [filters={}] - Optional filters like { status: 'active', exclude_active_loan_clients: true }.
 * @returns {Promise<Object>} - Contains { clients: [...], overallSummary: { ... } }.
 */
export const getAllClients = async (filters = {}) => {
    try {
        const response = await api.get('/api/clients', { params: filters }); // Backend endpoint: /api/clients
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching clients.");
    }
};

/**
 * Fetches clients who do not have an active loan.
 * @returns {Promise<Object>} Response data containing eligible clients.
 */
export const getEligibleClients = async () => {
    try {
        // It's more robust to pass query parameters via the `params` object in Axios.
        const response = await api.get('/api/clients', { params: { exclude_active_loan_clients: true } }); // Backend endpoint: /api/clients?exclude_active_loan_clients=true
        return response.data;
    } catch (error) {
        handleApiError(error, 'Failed to fetch eligible clients.');
    }
};

/**
 * Fetches a single client's details by ID.
 * @param {string} clientId - The ID of the client to fetch.
 * @returns {Promise<Object>} - The client object.
 */
export const getClientById = async (clientId) => {
    try {
        const response = await api.get(`/api/clients/${clientId}`); // Backend endpoint: /api/clients/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching client details.");
    }
};

/**
 * Adds a new client.
 * @param {Object} clientData - The client's details (e.g., name, phone, address, etc.).
 * @returns {Promise<Object>} - The newly created client object.
 */
export const addClient = async (clientData) => {
    try {
        const response = await api.post('/api/clients', clientData); // Backend endpoint: /api/clients
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while adding a new client.");
    }
};

/**
 * Updates a client's details.
 * @param {string} clientId - The ID of the client to update.
 * @param {Object} clientData - The fields to update.
 * @returns {Promise<Object>} - The updated client object.
 */
export const updateClient = async (clientId, clientData) => {
    try {
        const response = await api.put(`/api/clients/${clientId}`, clientData); // Backend endpoint: /api/clients/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating client.");
    }
};

/**
 * Deletes a client record by ID.
 * @param {string} clientId - The ID of the client to delete.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const deleteClient = async (clientId) => {
    try {
        const response = await api.delete(`/api/clients/${clientId}`); // Backend endpoint: /api/clients/:id
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting client.");
    }
};
