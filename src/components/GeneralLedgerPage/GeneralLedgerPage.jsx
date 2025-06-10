import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../../utils/authUtils'; // Adjust path as needed
import { toast } from 'react-toastify'; // For notifications
import './GeneralLedgerPage.css'; // Common CSS for accounting pages

/**
 * @component GeneralLedgerPage
 * @description Displays the General Ledger for a selected account,
 * allowing users to view all transactions affecting that account within a specified date range.
 */
const GeneralLedgerPage = () => {
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // State for available accounts (for the dropdown)
    const [accounts, setAccounts] = useState([]);
    // State for the selected account and its ledger data
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [ledgerData, setLedgerData] = useState(null); // Stores the fetched ledger data (account, openingBalance, transactions, closingBalance)
    // State for filtering
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch all accounts for the dropdown ---
    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/login');
            toast.error('Authentication required to fetch accounts.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/accounts`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/login');
                toast.error('Authentication expired or unauthorized. Please log in again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch accounts.');
            }

            const data = await response.json();
            setAccounts(data.sort((a, b) => a.accountCode.localeCompare(b.accountCode)));
            if (data.length > 0) {
                setSelectedAccountId(data[0]._id); // Select the first account by default
            }
        } catch (err) {
            console.error("GeneralLedgerPage: Error fetching accounts for dropdown:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error fetching accounts: ${err.message || "Network error"}`);
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL, navigate]);

    // --- Fetch General Ledger data for the selected account and date range ---
    const fetchGeneralLedger = useCallback(async () => {
        if (!selectedAccountId) return; // Don't fetch if no account is selected

        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/loginForm');
            toast.error('Authentication required to view general ledger.');
            return;
        }

        try {
            let url = `${BACKEND_URL}/api/accounts/${selectedAccountId}/ledger?`;
            if (filterStartDate) url += `startDate=${filterStartDate}&`;
            if (filterEndDate) url += `endDate=${filterEndDate}&`;
            url = url.slice(0, -1); // Remove trailing '&' or '?'

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
                throw new Error(errorData.message || 'Failed to fetch general ledger data.');
            }

            const data = await response.json();
            setLedgerData(data);
        } catch (err) {
            console.error("GeneralLedgerPage: Error fetching general ledger:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error fetching ledger: ${err.message || "Network error"}`);
            setLedgerData(null); // Clear previous data on error
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL, navigate, selectedAccountId, filterStartDate, filterEndDate]);

    // Initial fetch of accounts on component mount
    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    // Fetch ledger data whenever selectedAccountId or filter dates change
    useEffect(() => {
        if (selectedAccountId) {
            fetchGeneralLedger();
        }
    }, [selectedAccountId, fetchGeneralLedger]);


    const handleApplyFilters = () => {
        fetchGeneralLedger(); // Trigger re-fetch with current filter states
    };

    const handleClearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        // fetchGeneralLedger will be called by useEffect due to state changes if selectedAccountId is set
    };

    const selectedAccountDetails = accounts.find(acc => acc._id === selectedAccountId);

    return (
        <div className="generalLedgerContainer">
            <Link to="/transactions" className="generalLedgerBackLink">
                {"<"} Back to Main Dashboard
            </Link>
            <h1 className="generalLedgerHeadline">General Ledger</h1>

            <div className="ledgerControls">
                <div className="formGroup">
                    <label htmlFor="accountSelect">Select Account:</label>
                    <select
                        id="accountSelect"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        disabled={loading && !accounts.length}
                    >
                        {loading && accounts.length === 0 ? (
                            <option value="">Loading Accounts...</option>
                        ) : accounts.length === 0 ? (
                            <option value="">No Accounts Available</option>
                        ) : (
                            accounts.map(account => (
                                <option key={account._id} value={account._id}>
                                    {account.accountCode} - {account.accountName} ({account.accountType})
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="filterGroup">
                    <label htmlFor="filterStartDate">Start Date:</label>
                    <input
                        type="date"
                        id="filterStartDate"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                </div>
                <div className="filterGroup">
                    <label htmlFor="filterEndDate">End Date:</label>
                    <input
                        type="date"
                        id="filterEndDate"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                </div>
                <div className="filterButtons">
                    <button onClick={handleApplyFilters} className="applyFiltersBtn" disabled={loading || !selectedAccountId}>Apply Filters</button>
                    <button onClick={handleClearFilters} className="clearFiltersBtn" disabled={loading || !selectedAccountId}>Clear Filters</button>
                </div>
            </div>

            {loading && selectedAccountId && !ledgerData ? (
                <div className="ledgerMessage">Loading ledger data for {selectedAccountDetails?.accountName || 'selected account'}...</div>
            ) : error ? (
                <div className="ledgerErrorMessage">Error: {error}</div>
            ) : !selectedAccountId ? (
                <div className="ledgerMessage">Please select an account to view its ledger.</div>
            ) : !ledgerData || !ledgerData.transactions || ledgerData.transactions.length === 0 ? (
                <div className="ledgerMessage">No transactions found for {selectedAccountDetails?.accountName || 'this account'} in the selected period.</div>
            ) : (
                <div className="generalLedgerDetails">
                    <h2>Ledger for: {ledgerData.account.accountName} ({ledgerData.account.accountCode})</h2>
                    <p><strong>Account Type:</strong> {ledgerData.account.accountType}</p>
                    <p><strong>Normal Balance:</strong> {ledgerData.account.normalBalance}</p>
                    <p className="openingBalance"><strong>Opening Balance:</strong> ZMW {ledgerData.openingBalance.toFixed(2)}</p>

                    <div className="ledgerTableContainer">
                        <table className="ledgerTable">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Journal Entry</th>
                                    <th>Description</th>
                                    <th>Debit (ZMW)</th>
                                    <th>Credit (ZMW)</th>
                                    <th>Running Balance (ZMW)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledgerData.transactions.map((transaction, index) => (
                                    <tr key={index}>
                                        <td data-label="Date">{new Date(transaction.entryDate).toLocaleDateString()}</td>
                                        <td data-label="Journal Entry">
                                            <Link to={`/journal-entries/${transaction.journalEntryId}`} className="ledgerJELink">
                                                {transaction.entryNumber || transaction.journalEntryId.substring(0, 8)}...
                                            </Link>
                                        </td>
                                        <td data-label="Description">
                                            {transaction.description}
                                            {transaction.lineDescription && ` (${transaction.lineDescription})`}
                                        </td>
                                        <td data-label="Debit" className="ledgerDebit">
                                            {transaction.debit > 0 ? transaction.debit.toFixed(2) : ''}
                                        </td>
                                        <td data-label="Credit" className="ledgerCredit">
                                            {transaction.credit > 0 ? transaction.credit.toFixed(2) : ''}
                                        </td>
                                        <td data-label="Running Balance" className={`runningBalance ${transaction.runningBalance < 0 ? 'negative' : ''}`}>
                                            {transaction.runningBalance.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="5"><strong>Closing Balance:</strong></td>
                                    <td className={`closingBalance ${ledgerData.closingBalance < 0 ? 'negative' : ''}`}>
                                        <strong>ZMW {ledgerData.closingBalance.toFixed(2)}</strong>
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

export default GeneralLedgerPage;
