import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTrialBalance } from '../../../../services/api/accountingApi'; // Adjust path as needed
import './TrialBalancePage.css';

/**
 * @component TrialBalancePage
 * @description Displays a Trial Balance report, summarizing all account balances
 * at a specific point in time and verifying debits equal credits.
 */
const TrialBalancePage = () => {
    const navigate = useNavigate(); // Still needed for the Link component and potential manual navigation (though handled by API now)

    // State to store the fetched trial balance data
    const [trialBalanceData, setTrialBalanceData] = useState(null);
    // State for filtering by end date
    const [filterEndDate, setFilterEndDate] = useState('');

    const [loading, setLoading] = useState(true); // Initial loading state set to true
    const [error, setError] = useState(null);

    // --- Effect to fetch Trial Balance data ---
    // Use useCallback to memoize the fetch function, preventing unnecessary re-renders
    const fetchAndSetTrialBalance = useCallback(async () => {
        setLoading(true); // Indicate loading has started
        setError(null);   // Clear any previous errors
        try {
            const data = await getTrialBalance(filterEndDate);
            setTrialBalanceData(data);
        } catch (err) {
            // The handleApiError in accountingApi.js should already show a toast
            // and handle unauthorized redirects. We catch it here to update local error state.
            console.error("TrialBalancePage: Error fetching trial balance:", err);
            setError(err.message || "Network error or server unavailable.");
            setTrialBalanceData(null); // Clear previous data on error
        } finally {
            setLoading(false); // Indicate loading has finished
        }
    }, [filterEndDate]); // Re-fetch whenever filterEndDate changes

    // Initial fetch on component mount and subsequent fetches when filterEndDate changes (via its dependency)
    useEffect(() => {
        fetchAndSetTrialBalance();
    }, [fetchAndSetTrialBalance]);

    // Handle filter application - now just a dummy to show button functionality
    const handleApplyFilter = () => {
        // Changing filterEndDate state will automatically trigger the useEffect.
        // No direct call to fetchAndSetTrialBalance needed here.
        // This function primarily exists to be hooked to the "Apply Date" button.
    };

    // Handle clearing filter
    const handleClearFilter = () => {
        setFilterEndDate(''); // Setting to empty string will re-trigger useEffect with no date filter
    };

    return (
        <div className="trialBalanceContainer">
            <Link to="/transactions" className="trialBalanceBackLink">
                {"<"} Back to Main Dashboard
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
                        disabled={loading} // Disable input while loading
                    />
                </div>
                <div className="filterButtons">
                    <button onClick={handleApplyFilter} className="applyFiltersBtn" disabled={loading}>Apply Date</button>
                    <button onClick={handleClearFilter} className="clearFiltersBtn" disabled={loading}>Clear Date</button>
                
                </div>
            </div>

            {/* Conditional Rendering for Loading, Error, and Data */}
            {loading && !trialBalanceData ? (
                <div className="trialBalanceMessage">Loading Trial Balance...</div>
            ) : error ? (
                <div className="trialBalanceErrorMessage">Error: {error}</div>
            ) : !trialBalanceData ? (
                <div className="trialBalanceMessage">No trial balance data found. Please select a date or check your filters.</div>
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