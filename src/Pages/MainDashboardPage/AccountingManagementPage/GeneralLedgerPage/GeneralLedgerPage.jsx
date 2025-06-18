import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAccounts, getGeneralLedger } from '../../../../services/api/accountingApi'; // Adjust path as needed
import './GeneralLedgerPage.css';

/**
 * @component GeneralLedgerPage
 * @description Displays the General Ledger for a selected account,
 * allowing users to view all transactions affecting that account within a specified date range.
 */
const GeneralLedgerPage = () => {
    const navigate = useNavigate();

    // State for available accounts (for the dropdown)
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [accountsError, setAccountsError] = useState(null);

    // State for the selected account and its ledger data
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [ledgerData, setLedgerData] = useState(null);
    const [ledgerLoading, setLedgerLoading] = useState(false); // Starts false, only loads after account selection
    const [ledgerError, setLedgerError] = useState(null);

    // State for filtering
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // --- Effect to fetch all accounts on component mount ---
    useEffect(() => {
        const fetchAllAccounts = async () => {
            setAccountsLoading(true);
            setAccountsError(null);
            try {
                const data = await getAccounts();
                setAccounts(data.sort((a, b) => a.accountCode.localeCompare(b.accountCode)));
                if (data.length > 0) {
                    setSelectedAccountId(data[0]._id); // Select the first account by default
                }
            } catch (err) {
                // handleApiError in accountingApi should have already shown toast and redirected if needed
                setAccountsError(err.message || "Failed to load accounts.");
            } finally {
                setAccountsLoading(false);
            }
        };

        fetchAllAccounts();
    }, []); // Empty dependency array means this runs once on mount

    // --- Effect to fetch General Ledger data when selectedAccount or filters change ---
    const fetchAndSetLedger = useCallback(async () => {
        if (!selectedAccountId) {
            setLedgerData(null); // Clear ledger if no account is selected
            return;
        }

        setLedgerLoading(true);
        setLedgerError(null);
        try {
            const data = await getGeneralLedger(selectedAccountId, filterStartDate, filterEndDate);
            setLedgerData(data);
        } catch (err) {
            // handleApiError in accountingApi should have already shown toast and redirected if needed
            setLedgerError(err.message || "Failed to load ledger data.");
            setLedgerData(null); // Clear previous data on error
        } finally {
            setLedgerLoading(false);
        }
    }, [selectedAccountId, filterStartDate, filterEndDate]); // Dependencies for re-fetching

    useEffect(() => {
        fetchAndSetLedger();
    }, [fetchAndSetLedger]); // Trigger fetch when dependencies of fetchAndSetLedger change


    const handleApplyFilters = () => {
        // No need to call fetchGeneralLedger directly, useEffect will react to state changes
        // The state changes (filterStartDate, filterEndDate) will trigger fetchAndSetLedger via its dependency array
    };

    const handleClearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        // fetchAndSetLedger will be called by useEffect due to state changes
    };

    // Find details of the currently selected account for display
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
                        disabled={accountsLoading} // Disable while accounts are loading
                    >
                        {accountsLoading ? (
                            <option value="">Loading Accounts...</option>
                        ) : accountsError ? (
                            <option value="">Error loading accounts</option>
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
                        disabled={ledgerLoading} // Disable filters while ledger is loading
                    />
                </div>
                <div className="filterGroup">
                    <label htmlFor="filterEndDate">End Date:</label>
                    <input
                        type="date"
                        id="filterEndDate"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        disabled={ledgerLoading} // Disable filters while ledger is loading
                    />
                </div>
                <div className="filterButtons">
                    <button onClick={handleApplyFilters} className="applyFiltersBtn" disabled={ledgerLoading || !selectedAccountId}>Apply Filters</button>
                    <button onClick={handleClearFilters} className="clearFiltersBtn" disabled={ledgerLoading || !selectedAccountId}>Clear Filters</button>
                </div>
            </div>

            {/* Conditional Rendering for Loading, Error, and Data */}
            {accountsLoading && <div className="ledgerMessage">Loading accounts...</div>}
            {accountsError && <div className="ledgerErrorMessage">Error loading accounts: {accountsError}</div>}
            {(!selectedAccountId && !accountsLoading && !accountsError) && (
                 <div className="ledgerMessage">Please select an account to view its ledger.</div>
            )}

            {selectedAccountId && (
                <>
                    {ledgerLoading && <div className="ledgerMessage">Loading ledger data for {selectedAccountDetails?.accountName || 'selected account'}...</div>}
                    {ledgerError && <div className="ledgerErrorMessage">Error loading ledger: {ledgerError}</div>}

                    {ledgerData && ledgerData.transactions && ledgerData.transactions.length > 0 ? (
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
                    ) : (ledgerData && ledgerData.transactions && ledgerData.transactions.length === 0 && !ledgerLoading && !ledgerError) && (
                        <div className="ledgerMessage">No transactions found for {selectedAccountDetails?.accountName || 'this account'} in the selected period.</div>
                    )}
                </>
            )}
        </div>
    );
};

export default GeneralLedgerPage;