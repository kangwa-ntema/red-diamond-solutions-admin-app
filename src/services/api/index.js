// src/services/index.js

// This file acts as a "barrel" to re-export all your API functions,
// so you can import them cleanly from a single point.

export * from './authApi';
export * from './userApi';
export * from './userActivityApi'; // NEW: Export user activity log API functions
export * from './clientApi';
export * from './loanApi';
export * from './loanActivityLogsApi'; // NEW: Export loan activity log API functions
export * from './paymentApi';
export * from './accountApi'; // For Chart of Accounts and General Ledger
export * from './journalEntryApi'; // For Journal Entries
export * from './reportApi'; // For financial reports like Trial Balance, Income Statement, Balance Sheet
export * from './transactionApi'; // For general transaction listing and summaries
export * from './clientActivityApi'; // NEW: Export client activity API functions

// Note: 'axiosInstance' and 'handleApiError' are internal to the API modules,
// they are not typically re-exported from the top-level barrel file.
// Components should interact with the exported functions, not the underlying Axios instance directly.
