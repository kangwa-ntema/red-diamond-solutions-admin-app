import api from '../axiosInstance';
import { handleApiError } from './utils';

/**
 * Fetches the overall accounting summary (total debits, credits, net cash flow, unique transaction types).
 * @param {Object} [filters={}] - Optional filters like { startDate, endDate }.
 * @returns {Promise<Object>} - Contains overall summary data.
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
 * Fetches a list of all transactions with optional filtering.
 * @param {Object} [filters={}] - Optional filters like { type, startDate, endDate }.
 * @returns {Promise<Array>} - An array of transaction objects.
 */
export const getTransactions = async (filters = {}) => {
    try {
        const response = await api.get('/api/transactions', { params: filters });
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to fetch transactions list.");
    }
};

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

/**
 * Deletes a journal entry by ID.
 * @param {string} id - The ID of the journal entry to delete.
 * @returns {Promise<Object>} - Success message.
 */
export const deleteJournalEntry = async (id) => {
    try {
        const response = await api.delete(`/api/journal-entries/${id}`);
        return response.data;
    } catch (error) {
        handleApiError(error, "Failed to delete journal entry.");
    }
};

// <<<--- ADD THIS FUNCTION TO accountingApi.js
/**
 * Fetches the total outstanding loans receivable.
 * This function assumes there's an endpoint like /api/loans/receivable-summary
 * or /api/transactions/loans-receivable-summary. Adjust the endpoint as needed.
 * @returns {Promise<Object>} - An object containing totalLoansReceivable.
 */
export const getLoansReceivableSummary = async () => {
    try {
        // You need to confirm the correct endpoint for this summary
        // It might be related to loans or transactions.
        const response = await api.get('/api/loans/summary-financials'); // Example endpoint
        return response.data;
    } catch (error) {
        // Use handleApiError if it's generic, or provide a specific message
        handleApiError(error, "Failed to fetch loans receivable summary.");
    }
};




/**
 * Fetches a list of all accounting accounts.
 * @param {Object} [filters={}] - Optional filters.
 * @returns {Promise<Array>} - An array of accounting account objects.
 */
export const getAccounts = async (filters = {}) => {
    try {
        const response = await api.get('/api/accounts', { params: filters });
        return response.data;
    } catch (error) {
        // IMPORTANT: Re-throw the error so the component can catch it and set its own error state,
        // after handleApiError has performed common actions like toast/redirect.
        throw handleApiError(error, "Failed to fetch accounts list.");
    }
};

/**
 * Fetches the general ledger data for a specific account.
 * @param {string} accountId - The ID of the account.
 * @param {string} [startDate] - Optional start date filter (YYYY-MM-DD).
 * @param {string} [endDate] - Optional end date filter (YYYY-MM-DD).
 * @returns {Promise<Object>} - The ledger data (account, openingBalance, transactions, closingBalance).
 */
export const getGeneralLedger = async (accountId, startDate, endDate) => {
    try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get(`/api/accounts/${accountId}/ledger`, { params });
        return response.data;
    } catch (error) {
        // IMPORTANT: Re-throw the error so the component can catch it and set its own error state,
        // after handleApiError has performed common actions like toast/redirect.
        throw handleApiError(error, "Failed to fetch general ledger data.");
    }
};

/**
 * Fetches the Trial Balance report.
 * @param {string} [endDate] - Optional end date filter (YYYY-MM-DD) for the report.
 * @returns {Promise<Object>} - The trial balance data (accounts, totalDebits, totalCredits, isBalanced, message, reportDate).
 */
export const getTrialBalance = async (endDate) => {
    try {
        const params = {};
        if (endDate) params.endDate = endDate;

        const response = await api.get('/api/reports/trial-balance', { params });
        return response.data;
    } catch (error) {
        // IMPORTANT: Re-throw the error so the component can catch it and set its own error state,
        // after handleApiError has performed common actions like toast/redirect.
        throw handleApiError(error, "Failed to fetch trial balance data.");
    }
};

/**
 * Fetches the Income Statement (Profit & Loss) report for a specified period.
 * @param {string} startDate - The start date (YYYY-MM-DD) for the report period.
 * @param {string} endDate - The end date (YYYY-MM-DD) for the report period.
 * @returns {Promise<Object>} - The income statement data (revenues, expenses, totalRevenue, totalExpenses, netIncome, reportPeriod).
 */
export const getIncomeStatement = async (startDate, endDate) => {
    try {
        // Validation for dates should ideally also happen on the backend
        if (!startDate || !endDate) {
            throw new Error('Both start and end dates are required to generate an Income Statement.');
        }
        if (new Date(startDate) > new Date(endDate)) {
            throw new Error('Start date cannot be after end date.');
        }

        const params = { startDate, endDate };
        const response = await api.get('/api/reports/income-statement', { params });
        return response.data;
    } catch (error) {
        // IMPORTANT: Re-throw the error so the component can catch it and set its own error state,
        // after handleApiError has performed common actions like toast/redirect.
        // handleApiError will also show a toast/log.
        throw handleApiError(error, "Failed to fetch income statement data.");
    }
};

/**
 * Fetches the Balance Sheet report as of a specified date.
 * @param {string} asOfDate - The date (YYYY-MM-DD) for which the balance sheet is generated.
 * @returns {Promise<Object>} - The balance sheet data (assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, isBalanced, message, reportDate).
 */
export const getBalanceSheet = async (asOfDate) => {
    try {
        // Client-side validation for the date
        if (!asOfDate) {
            throw new Error('An "as of" date is required to generate the Balance Sheet.');
        }

        const params = { asOfDate };
        const response = await api.get('/api/reports/balance-sheet', { params });
        return response.data;
    } catch (error) {
        // IMPORTANT: Re-throw the error so the component can catch it and set its own error state,
        // after handleApiError has performed common actions like toast/redirect.
        throw handleApiError(error, "Failed to fetch balance sheet data.");
    }
};