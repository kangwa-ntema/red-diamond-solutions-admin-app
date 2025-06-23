// src/Pages/MainDashboardPage/AccountingManagementPage/TrialBalancePage/TrialBalancePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Import the centralized API functions for reports and error handling
import { getTrialBalanceReport } from '../../../../services/api/reportApi'; // Consolidated import for report API
import { handleApiError } from '../../../../services/axiosInstance'; // For consistent error handling

import './TrialBalancePage.css'; // Existing CSS for the page

/**
 * @component TrialBalancePage
 * @description Displays a Trial Balance report, summarizing all account balances
 * at a specific point in time and verifying debits equal credits.
 */
const TrialBalancePage = () => {
    const navigate = useNavigate(); // Hook for programmatic navigation

    // State to store the fetched trial balance data
    const [trialBalanceData, setTrialBalanceData] = useState(null);
    // State for filtering by end date. Initialized with an empty string,
    // so no report is fetched automatically until a date is chosen.
    const [filterEndDate, setFilterEndDate] = useState('');

    const [loading, setLoading] = useState(false); // Initial loading state set to false (awaiting user input)
    const [error, setError] = useState(null);

    // --- Memoized function to fetch Trial Balance data ---
    const fetchAndSetTrialBalance = useCallback(async () => {
        // Client-side validation: Only fetch if an end date is selected
        if (!filterEndDate) {
            setTrialBalanceData(null); // Clear any previously displayed data
            setError(null); // Clear any previous error message
            setLoading(false); // Ensure loading is off if no date is provided
            return;
        }

        setLoading(true); // Indicate loading has started
        setError(null);   // Clear any previous errors

        try {
            // Call the centralized report API function with the date as a filter object
            const data = await getTrialBalanceReport({ endDate: filterEndDate });
            setTrialBalanceData(data);
        } catch (err) {
            // Centralized error handler `handleApiError` will show a toast and potentially redirect.
            // We catch it here to update local state for displaying error message.
            console.error("TrialBalancePage: Error fetching trial balance:", err);
            handleApiError(err, "Failed to generate Trial Balance report."); // Re-throw to use toast and potential redirect
            setTrialBalanceData(null); // Clear previous data on error
            setError(err.message || "Failed to fetch trial balance data."); // Set local error for display
        } finally {
            setLoading(false); // Indicate loading has finished
        }
    }, [filterEndDate]); // Re-fetch whenever filterEndDate changes

    // Use useEffect to trigger fetching when filterEndDate changes (via useCallback dependency)
    useEffect(() => {
        fetchAndSetTrialBalance();
    }, [fetchAndSetTrialBalance]); // Dependency on the memoized function

    // `handleApplyFilter` now primarily exists to give feedback if date is missing,
    // as the `useEffect` already triggers the fetch when `filterEndDate` changes.
    const handleApplyFilter = () => {
        if (!filterEndDate) {
            toast.info('Please select an "as of" date to generate the report.');
        }
        // No direct fetch call needed here; setting filterEndDate will trigger the useEffect.
    };

    // Handle clearing the filter date
    const handleClearFilter = () => {
        setFilterEndDate(''); // Clearing the date will trigger fetchAndSetTrialBalance, which will clear the report
    };

    return (
        <div className="trialBalanceContainer">
            {/* Link back to the main accounting dashboard */}
            <Link to="/accounting" className="trialBalanceBackLink">
                {"<"} Back to Accounting Dashboard
            </Link>
            <h1 className="trialBalanceHeadline">Trial Balance</h1>

            {/* Filter Section */}
            <div className="trialBalanceFilters">
                <h3>Report Date Selection</h3>
                <div className="filterGroup">
                    <label htmlFor="filterEndDate">As of Date:</label>
                    <input
                        type="date"
                        id="filterEndDate"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        required
                        disabled={loading} // Disable input while loading
                    />
                </div>
                <div className="filterButtons">
                    <button
                        onClick={handleApplyFilter}
                        className="applyFiltersBtn"
                        disabled={loading || !filterEndDate} // Disable if loading or date is missing
                    >
                        Generate Report
                    </button>
                    <button
                        onClick={handleClearFilter}
                        className="clearFiltersBtn"
                        disabled={loading} // Disable while loading
                    >
                        Clear Date
                    </button>
                </div>
            </div>

            {/* Conditional Rendering for Loading, Error, and Data */}
            {loading ? (
                <div className="trialBalanceMessage">Generating Trial Balance...</div>
            ) : error ? (
                <div className="trialBalanceErrorMessage">Error: {error}</div>
            ) : !trialBalanceData ? (
                <div className="trialBalanceMessage">
                    Please select an 'as of' date above and click 'Generate Report'.
                </div>
            ) : (
                <div className="trialBalanceReport">
                    <h2>Trial Balance as of {new Date(trialBalanceData.reportDate).toLocaleDateString()}</h2>

                    <div className="balanceStatusMessage">
                        <p className={trialBalanceData.isBalanced ? 'balanced' : 'unbalanced'}>
                            {trialBalanceData.message}
                        </p>
                    </div>

                    <div className="trialBalanceTableContainer">
                        <table className="trialBalanceTable">
                            <thead>
                                <tr>
                                    <th>Account Code</th>
                                    <th>Account Name</th>
                                    <th>Account Type</th>
                                    <th className="text-right">Debit (ZMW)</th>
                                    <th className="text-right">Credit (ZMW)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trialBalanceData.accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">No accounts with balances found for this period.</td>
                                    </tr>
                                ) : (
                                    trialBalanceData.accounts.map(account => (
                                        <tr key={account._id}>
                                            <td data-label="Code">{account.accountCode}</td>
                                            <td data-label="Name">{account.accountName}</td>
                                            <td data-label="Type">{account.accountType}</td>
                                            <td data-label="Debit" className="text-right debit-column">
                                                {account.debitBalance > 0 ? account.debitBalance.toFixed(2) : ''}
                                            </td>
                                            <td data-label="Credit" className="text-right credit-column">
                                                {account.creditBalance > 0 ? account.creditBalance.toFixed(2) : ''}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className={trialBalanceData.isBalanced ? 'balanced-totals' : 'unbalanced-totals'}>
                                    <td colSpan="3" className="text-right"><strong>Total:</strong></td>
                                    <td className="text-right total-debits">
                                        <strong>ZMW {trialBalanceData.totalDebits.toFixed(2)}</strong>
                                    </td>
                                    <td className="text-right total-credits">
                                        <strong>ZMW {trialBalanceData.totalCredits.toFixed(2)}</strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrialBalancePage;
