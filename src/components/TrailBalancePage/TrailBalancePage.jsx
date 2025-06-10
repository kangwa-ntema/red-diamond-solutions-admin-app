import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../../utils/authUtils'; // Adjust path as needed
import { toast } from 'react-toastify'; // For notifications
import './TrailBalancePage.css'; // Common CSS for accounting pages

/**
 * @component TrialBalancePage
 * @description Displays a Trial Balance report, summarizing all account balances
 * at a specific point in time and verifying debits equal credits.
 */
const TrialBalancePage = () => {
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // State to store the fetched trial balance data
    const [trialBalanceData, setTrialBalanceData] = useState(null);
    // State for filtering by end date
    const [filterEndDate, setFilterEndDate] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Trial Balance data ---
    const fetchTrialBalance = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/loginForm');
            toast.error('Authentication required to view trial balance.');
            return;
        }

        try {
            let url = `${BACKEND_URL}/api/reports/trial-balance`;
            // Add endDate filter if specified
            if (filterEndDate) {
                url += `?endDate=${filterEndDate}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/loginForm');
                toast.error('Authentication expired or unauthorized. Please log in again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch trial balance data.');
            }

            const data = await response.json();
            setTrialBalanceData(data);
        } catch (err) {
            console.error("TrialBalancePage: Error fetching trial balance:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error fetching trial balance: ${err.message || "Network error"}`);
            setTrialBalanceData(null); // Clear previous data on error
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL, navigate, filterEndDate]); // Re-fetch when filterEndDate changes

    // Initial fetch on component mount and when filterEndDate changes
    useEffect(() => {
        fetchTrialBalance();
    }, [fetchTrialBalance]);

    // Handle filter application
    const handleApplyFilter = () => {
        fetchTrialBalance(); // Trigger re-fetch with current filter state
    };

    // Handle clearing filter
    const handleClearFilter = () => {
        setFilterEndDate('');
        // fetchTrialBalance will be called by useEffect due to state change
    };

    if (loading && !trialBalanceData) { // Only show full loading if no data yet
        return <div className="trialBalanceContainer loading">Loading Trial Balance...</div>;
    }

    if (error && !trialBalanceData) { // Only show global error if no data could be loaded
        return <div className="trialBalanceContainer error">Error: {error}</div>;
    }

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
                    />
                </div>
                <div className="filterButtons">
                    <button onClick={handleApplyFilter} className="applyFiltersBtn" disabled={loading}>Apply Date</button>
                    <button onClick={handleClearFilter} className="clearFiltersBtn" disabled={loading}>Clear Date</button>
                </div>
            </div>

            {/* Trial Balance Report Display */}
            {!trialBalanceData ? (
                <div className="trialBalanceMessage">No trial balance data found. Please select a date.</div>
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
