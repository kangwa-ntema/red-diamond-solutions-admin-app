// src/services/api.js
import axios from 'axios';
import { toast } from 'react-toastify'; // IMPORTANT: Ensure react-toastify is installed and configured in your App.jsx

// IMPORTANT: Configure this baseURL to match your backend server's URL.
// This API_BASE_URL should point to the root of your backend, e.g., 'http://localhost:5000'.
// It's recommended to use an environment variable for this.
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL; // Using Vite's env variable prefix

// Create an Axios instance with base URL and credentials
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Crucial for sending and receiving httpOnly cookies
});

// --- Helper function for consistent error handling ---
const handleApiError = (error, defaultMessage) => {
    if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
    }
    if (error.message) {
        throw new Error(error.message);
    }
    throw new Error(defaultMessage);
};


// --- Axios Interceptors (Simplified for HTTP-only Cookies) ---

// No request interceptor needed for adding token if using httpOnly cookies,
// as the browser handles sending the cookie automatically.
// The `Authorization` header with `Bearer` token is typically for stateless JWTs
// stored on the client side, which contradicts httpOnly cookies.

// Response interceptor to handle 401 Unauthorized errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('401 Unauthorized response received by API interceptor. Session likely expired.');
            // We can't remove an httpOnly cookie from here directly.
            // The AuthContext will handle clearing its internal state (localStorage 'currentUser').
            toast.error("Your session has expired or is invalid. Please log in again.");
            // You might want to trigger a logout event here if your AuthContext isn't watching for it.
            // A simple way is to dispatch a custom event or, better, let AuthContext try `verifyToken`
            // periodically or on route changes, which will fail if the cookie is bad.
        }
        return Promise.reject(error); // Re-throw the error for component-specific handling
    }
);


// --- Authentication & User Profile Endpoints ---

/**
 * Handles user login.
 * @param {string} username - User's username.
 * @param {string} password - User's password.
 * @returns {Promise<Object>} - Contains user data and token on success.
 */
export const loginUser = async (username, password) => {
    try {
        const response = await api.post('/api/admin/login', { username, password });
        // Expected response data: { message, user: { id, username, role } }
        // The cookie for authentication is set by the backend here.
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred during login.");
    }
};

/**
 * Handles user logout.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const logoutUser = async () => {
    try {
        const response = await api.get('/api/admin/logout');
        // The backend should clear the httpOnly cookie here.
        return response.data; // Expected: { message }
    } catch (error) {
        handleApiError(error, "An unknown error occurred during logout.");
    }
};

/**
 * Verifies the current session's validity with the backend.
 * This is crucial when using httpOnly cookies, as the token isn't accessible on the client.
 * @returns {Promise<Object>} - Contains verification status (e.g., { isValid: boolean, user: {...} }).
 */
export const verifyToken = async () => {
    try {
        // This endpoint would typically just return the user data if the httpOnly cookie is valid,
        // or a 401/403 if it's invalid/expired (handled by interceptor).
        const response = await api.get('/api/admin/verify-session'); // Adjust endpoint as per your backend
        return { isValid: true, user: response.data.user }; // Assuming backend sends user data on success
    } catch (error) {
        // If the backend returns an error (e.g., 401), this means the session is not valid.
        // The interceptor might have shown a toast, but we should return isValid: false for AuthContext.
        return { isValid: false, user: null };
    }
};

/**
 * Allows a logged-in user to change their own password.
 * @param {string} currentPassword - The user's current password.
 * @param {string} newPassword - The new password.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const changeMyPassword = async (currentPassword, newPassword) => {
    try {
        const response = await api.put('/api/admin/change-password', { currentPassword, newPassword });
        return response.data; // Expected: { message }
    } catch (error) {
        handleApiError(error, "An unknown error occurred while changing password.");
    }
};

// --- User Management Specific Endpoints ---

/**
 * Allows a superadmin to register a new user (admin, employee, or client).
 * @param {Object} userData - Contains username, password, role, firstName, lastName, email, employeeId, isActive.
 * @returns {Promise<Object>} - Contains success message and new user data.
 */
export const registerEmployeeUser = async (userData) => {
    try {
        const response = await api.post('/api/admin/users/register-employee', userData);
        return response.data; // Expected: { message, user: { ... } }
    } catch (error) {
        handleApiError(error, "An unknown error occurred during user registration.");
    }
};

/**
 * Fetches a list of all users, with optional filtering.
 * @param {Object} [filters={}] - Optional filters like { role: 'admin', isActive: true }.
 * @returns {Promise<Object>} - Contains { users: [...], overallSummary: { ... } }.
 */
export const getAllUsers = async (filters = {}) => {
    try {
        const response = await api.get('/api/admin/users', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching users.");
    }
};

/**
 * Fetches a single user's details by ID.
 * @param {string} id - The ID of the user to fetch.
 * @returns {Promise<Object>} - The user object (without password).
 */
export const getUserById = async (id) => {
    try {
        const response = await api.get(`/api/admin/users/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching user details.");
    }
};

/**
 * Updates a user's details (by admin/superadmin).
 * @param {string} id - The ID of the user to update.
 * @param {Object} userData - The fields to update (e.g., username, role, isActive).
 * @returns {Promise<Object>} - The updated user object.
 */
export const updateUser = async (id, userData) => {
    try {
        const response = await api.put(`/api/admin/users/${id}`, userData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating user.");
    }
};

/**
 * Allows an admin/superadmin to change another user's password.
 * @param {string} id - The ID of the user whose password to change.
 * @param {string} newPassword - The new password.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const changeUserPasswordAdmin = async (id, newPassword) => {
    try {
        const response = await api.put(`/api/admin/users/change-password/${id}`, { newPassword });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while changing user password.");
    }
};

/**
 * Deletes a user record by ID (superadmin only).
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<Object>} - Contains a success message.
 */
export const deleteUser = async (id) => {
    try {
        const response = await api.delete(`/api/admin/users/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting user.");
    }
};


// --- CLIENT-RELATED ENDPOINTS ---

/**
 * Fetches a list of all clients, with optional filtering by status (e.g., 'active', 'inactive').
 * @param {Object} [filters={}] - Optional filters like { status: 'active' }.
 * @returns {Promise<Object>} - Contains { clients: [...], overallSummary: { ... } }.
 * @Note: Assumes backend client routes are under `/api/clients`, not `/api/admin/clients`.
 */
export const getAllClients = async (filters = {}) => {
    try {
        const response = await api.get('/api/clients', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching clients.");
    }
};

/**
 * Fetches clients who do not have an active loan.
 * @returns {Promise<Object>} Response data containing eligible clients.
 * @Note: Assumes backend client routes are under `/api/clients?exclude_active_loan_clients=true`.
 */
export const getEligibleClients = async () => {
    try {
        const response = await api.get('/api/clients?exclude_active_loan_clients=true');
        return response.data; // Axios wraps the response in a 'data' property
    } catch (error) {
        handleApiError(error, 'Failed to fetch eligible clients.');
    }
};


/**
 * Fetches a single client's details by ID.
 * @param {string} clientId - The ID of the client to fetch.
 * @returns {Promise<Object>} - The client object.
 * @Note: Assumes backend client routes are under `/api/clients/:id`, not `/api/admin/clients/:id`.
 */
export const getClientById = async (clientId) => {
    try {
        const response = await api.get(`/api/clients/${clientId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching client details.");
    }
};

/**
 * Adds a new client.
 * @param {Object} clientData - The client's details (e.g., name, phone, address, etc.).
 * @returns {Promise<Object>} - The newly created client object.
 * @Note: Assumes backend client routes are under `/api/clients`.
 */
export const addClient = async (clientData) => {
    try {
        const response = await api.post('/api/clients', clientData);
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
 * @Note: Assumes backend client routes are under `/api/clients/:id`.
 */
export const updateClient = async (clientId, clientData) => {
    try {
        const response = await api.put(`/api/clients/${clientId}`, clientData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating client.");
    }
};

/**
 * Deletes a client record by ID.
 * @param {string} clientId - The ID of the client to delete.
 * @returns {Promise<Object>} - Contains a success message.
 * @Note: Assumes backend client routes are under `/api/clients/:id`.
 */
export const deleteClient = async (clientId) => {
    try {
        const response = await api.delete(`/api/clients/${clientId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting client.");
    }
};


// --- LOAN-RELATED ENDPOINTS ---

/**
 * Fetches a list of all loans, with optional filtering by status (e.g., 'active', 'overdue').
 * @param {Object} [filters={}] - Optional filters like { status: 'active' }.
 * @returns {Promise<Object>} - Contains { loans: [...], overallSummary: { ... } }.
 * @Note: Assumes backend loan routes are under `/api/loans`.
 */
export const getAllLoans = async (filters = {}) => {
    try {
        const response = await api.get('/api/loans', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching loans.");
    }
};

/**
 * Fetches a single loan's details by ID.
 * @param {string} loanId - The ID of the loan to fetch.
 * @returns {Promise<Object>} - The loan object.
 * @Note: Assumes backend loan routes are under `/api/loans/:id`.
 */
export const getLoanById = async (loanId) => {
    try {
        const response = await api.get(`/api/loans/${loanId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while fetching loan details.");
    }
};

/**
 * Adds a new loan.
 * @param {Object} loanData - The loan's details.
 * @returns {Promise<Object>} - The newly created loan object.
 * @Note: Assumes backend loan routes are under `/api/loans`.
 */
export const addLoan = async (loanData) => {
    try {
        const response = await api.post('/api/loans', loanData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while adding a new loan.");
    }
};

/**
 * Updates an existing loan's details.
 * @param {string} loanId - The ID of the loan to update.
 * @param {Object} loanData - The fields to update.
 * @returns {Promise<Object>} - The updated loan object.
 * @Note: Assumes backend loan routes are under `/api/loans/:id`.
 */
export const updateLoan = async (loanId, loanData) => {
    try {
        const response = await api.put(`/api/loans/${loanId}`, loanData);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while updating loan.");
    }
};

/**
 * Deletes a loan record by ID.
 * @param {string} loanId - The ID of the loan to delete.
 * @returns {Promise<Object>} - Contains a success message.
 * @Note: Assumes backend loan routes are under `/api/loans/:id`.
 */
export const deleteLoan = async (loanId) => {
    try {
        const response = await api.delete(`/api/loans/${loanId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "An unknown error occurred while deleting loan.");
    }
};


// --- PAYMENT-RELATED ENDPOINTS ---

/**
 * Fetches payments for a specific loan by its ID.
 * @param {string} loanId - The ID of the loan to fetch payments for.
 * @returns {Promise<Array>} - An array of payment objects.
 * @Note: Assumes backend payments for loan routes are under `/api/payments/loan/:loanId`.
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


// --- ACCOUNTING/TRANSACTION-RELATED ENDPOINTS ---

/**
 * Fetches the overall accounting summary (total debits, credits, net cash flow, unique transaction types).
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Object>} - Contains overall summary data.
 * @Note: Assumes backend accounting summary routes are under `/api/transactions/summary`.
 */
export const getAccountingSummary = async (filters = {}) => {
    try {
        const response = await api.get('/api/transactions/summary', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch overall accounting summary.");
    }
};

/**
 * Fetches the accounting summary by transaction type.
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Object>} - Contains type-specific summary data.
 * @Note: Assumes backend accounting type summary routes are under `/api/transactions/type-summary`.
 */
export const getAccountingTypeSummary = async (filters = {}) => {
    try {
        const response = await api.get('/api/transactions/type-summary', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch transaction type summary.");
    }
};

/**
 * Fetches the total loans receivable (sum of outstanding loan balances).
 * @returns {Promise<Object>} - Contains { totalLoansReceivable: number }.
 * @Note: Assumes backend loans receivable summary route is under `/api/loans/summary-financials`.
 */
export const getLoansReceivableSummary = async () => {
    try {
        const response = await api.get('/api/loans/summary-financials');
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch total loans receivable.");
    }
};

/**
 * Fetches a list of all transactions with optional filtering.
 * @param {Object} [filters={}] - Optional filters like { type, startDate, endDate }.
 * @returns {Promise<Array>} - An array of transaction objects.
 * @Note: Assumes backend transactions list route is under `/api/transactions`.
 */
export const getTransactions = async (filters = {}) => {
    try {
        const response = await api.get('/api/transactions', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch transactions list.");
    }
};