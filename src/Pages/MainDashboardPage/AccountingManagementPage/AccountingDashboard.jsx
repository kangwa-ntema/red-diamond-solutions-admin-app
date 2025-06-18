// src/pages/AccountingDashboardPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify"; // For displaying notifications
import { useAuth } from "../../../context/AuthContext"; // Import useAuth hook
import {
    getAccountingSummary,
    getAccountingTypeSummary,
    getLoansReceivableSummary,
    getTransactions,
    getJournalEntries, // <<<--- IMPORT THIS
} from "../../../services/api/accountingApi"; // Import the new API functions

import "./AccountingDashboardPage.css"; // Dedicated CSS for styling

/**
 * @component AccountingDashboardPage
 * @description Displays an overview of the application's financial accounting,
 * including overall summaries of debits and credits, transaction counts by type,
 * and a detailed list of all transactions with filtering capabilities.
 * It fetches data from the backend's transaction API.
 */
const AccountingDashboardPage = () => {
    // State for overall financial summary (total debits, credits, net flow)
    const [overallSummary, setOverallSummary] = useState({
        totalDebits: 0,
        totalCredits: 0,
        netCashFlow: 0,
        uniqueTransactionTypes: [],
    });

    // State for summary by transaction type (e.g., total payments, total disbursements)
    const [typeSummary, setTypeSummary] = useState({});

    // State for total loans receivable (sum of outstanding loan balances)
    const [totalLoansReceivable, setTotalLoansReceivable] = useState(0);

    // State for the list of individual transactions
    const [transactions, setTransactions] = useState([]);

    // <<<--- NEW STATE FOR JOURNAL ENTRIES
    const [journalEntries, setJournalEntries] = useState([]);

    // States for filtering
    const today = new Date().toISOString().split("T")[0]; // Current date for default end date
    const oneMonthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toISOString()
        .split("T")[0]; // Default start date
    const [filterType, setFilterType] = useState(""); // Filter by 'disbursement', 'payment', etc.
    const [filterStartDate, setFilterStartDate] = useState(oneMonthAgo); // Date range start
    const [filterEndDate, setFilterEndDate] = useState(today); // Date range end

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { isAuthenticated, logout, hasRole } = useAuth(); // Use the useAuth hook

    /**
     * @function fetchAccountingData
     * @description Fetches all necessary accounting data (overall summary, type summary, transactions list)
     * from the backend. This function is memoized using useCallback to prevent unnecessary re-creation.
     * @param {string} type - Optional transaction type to filter the list.
     * @param {string} startDate - Optional start date for filtering.
     * @param {string} endDate - Optional end date for filtering.
     */
    const fetchAccountingData = useCallback(
        async (type = "", startDate = "", endDate = "") => {
            setLoading(true); // Set loading to true at the start of data fetching
            setError(null); // Clear any previous errors

            if (!isAuthenticated) {
                console.error(
                    "AccountingDashboardPage: Not authenticated. Redirecting to login."
                );
                logout(); // Clear auth data and redirect
                navigate("/");
                return;
            }

            try {
                const dateFilters = { startDate, endDate };
                const transactionFilters = { type, startDate, endDate };
                // You might want separate filters for journal entries if they differ
                const journalEntryFilters = { startDate, endDate };

                // 1. Fetch Overall Transaction Summary
                const summaryData = await getAccountingSummary(dateFilters);
                setOverallSummary(summaryData);
                console.log("Overall Transaction Summary:", summaryData);

                // 2. Fetch Type Summary
                const typeSummaryData = await getAccountingTypeSummary(dateFilters);
                setTypeSummary(typeSummaryData);
                console.log("Type Summary:", typeSummaryData);

                // 3. Fetch Total Loans Receivable
                const loansReceivableData = await getLoansReceivableSummary();
                setTotalLoansReceivable(loansReceivableData.totalLoansReceivable);
                console.log(
                    "Total Loans Receivable:",
                    loansReceivableData.totalLoansReceivable
                );

                // 4. Fetch Detailed Transactions List
                const transactionsData = await getTransactions(transactionFilters);
                setTransactions(transactionsData);
                console.log("Transactions List:", transactionsData);

                // <<<--- 5. FETCH JOURNAL ENTRIES
                const journalEntriesData = await getJournalEntries(journalEntryFilters);
                setJournalEntries(journalEntriesData);
                console.log("Journal Entries List:", journalEntriesData);

            } catch (err) {
                console.error("Error fetching accounting data:", err);
                setError(err || "Network error or server unavailable."); // Error message is direct from handleApiError

                toast.error(
                    `Error loading accounting data: ${err || "Network error"}`
                );

                // Check for authentication-related errors (e.g., token expired, unauthorized)
                if (
                    (typeof err === 'string' && (err.includes("Authentication expired") || err.includes("Unauthorized") || err.includes("Forbidden"))) ||
                    (err instanceof Error && err.message.includes("Authentication expired")) // For caught Error objects
                ) {
                    toast.error("Session expired or unauthorized. Please log in again.");
                    logout();
                    navigate("/");
                }
            } finally {
                setLoading(false); // Set loading to false once all fetches are complete
            }
        },
        [isAuthenticated, navigate, logout] // Dependencies for useCallback
    );

    // useEffect to call fetchAccountingData on component mount and when filters change
    useEffect(() => {
        fetchAccountingData(filterType, filterStartDate, filterEndDate);
    }, [fetchAccountingData, filterType, filterStartDate, filterEndDate]); // Re-fetch when filters change

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === "filterType") {
            setFilterType(value);
        } else if (name === "filterStartDate") {
            setFilterStartDate(value);
        } else if (name === "filterEndDate") {
            setFilterEndDate(value);
        }
    };

    // Conditional rendering for loading and error states
    if (loading) {
        return (
            <div className="accountingDashboardContainer accountingLoading">
                Loading accounting data...
            </div>
        );
    }

    if (error) {
        return (
            <div className="accountingDashboardContainer accountingErrorMessage">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="accountingDashboardContainer">
            <div className="accountingDashboardContent">
                <div className="accountingDashboardHeading">
                    <Link to="/mainDashboard" className="accountingDashboardBackLink">
                        Back to Main Dashboard
                    </Link>
                    <h1 className="accountingHeadline">Accounting Overview</h1>
                </div>
                <main className="accountingDashboard">
                    {/* Navigation Panel - Consider adding role-based access if specific accounting pages are restricted */}
                    <div className="accountingDashboardPanel">
                        {hasRole(["superadmin", "admin", "employee"]) && ( // Example: Only show if user has relevant roles
                            <>
                                <Link to="/accounts">
                                    <li className="accountingDashboardNavLink">Chart Of Accounts</li>
                                </Link>
                                <Link to="/journal-entries">
                                    <li className="accountingDashboardNavLink">Journal Entries</li>
                                </Link>
                                <Link to="/general-ledger">
                                    <li className="accountingDashboardNavLink">General Ledger</li>
                                </Link>
                                <Link to="/reports">
                                    <li className="accountingDashboardNavLink">Trial Balance</li>
                                </Link>
                                <Link to="/income-statement">
                                    <li className="accountingDashboardNavLink">Income Statement</li>
                                </Link>
                                <Link to="/balance-sheet">
                                    <li className="accountingDashboardNavLink">Balance Sheet</li>
                                </Link>
                            </>
                        )}
                    </div>
                    <div className="accountingSummerContainer">
                        <section className="accountingSummaryCardsGrid">
                            <div className="accountingSummaryCard totalDebits">
                                <h3 className="accountingSummaryCardTitle">
                                    Total Disbursements
                                </h3>
                                <p className="accountingSummaryCardValue">
                                    ZMW {overallSummary.totalDebits.toFixed(2)}
                                </p>
                            </div>
                            <div className="accountingSummaryCard totalCredits">
                                <h3 className="accountingSummaryCardTitle">
                                    Total Payments Received
                                </h3>
                                <p className="accountingSummaryCardValue">
                                    ZMW {overallSummary.totalCredits.toFixed(2)}
                                </p>
                            </div>
                            <div className="accountingSummaryCard netCashFlow">
                                <h3 className="accountingSummaryCardTitle">
                                    Net Cash Flow (Transactions)
                                </h3>
                                <p className="accountingSummaryCardValue">
                                    ZMW {overallSummary.netCashFlow.toFixed(2)}
                                </p>
                            </div>
                            {/* NEW: Card for Total Loans Receivable */}
                            <div className="accountingSummaryCard loansReceivable">
                                <h3 className="accountingSummaryCardTitle">
                                    Total Loans Receivable
                                </h3>
                                <p className="accountingSummaryCardValue">
                                    ZMW {totalLoansReceivable.toFixed(2)}
                                </p>
                            </div>
                        </section>

                        <section className="accountingTypeSummarySection">
                            <h2 className="accountingTypeSummaryHeadline">
                                Summary by Transaction Type
                            </h2>
                            {Object.keys(typeSummary).length > 0 ? (
                                <div className="accountingTypeSummarySubHeadline">
                                    {Object.entries(typeSummary).map(([type, amount]) => (
                                        <div key={type} className="accountingTypeSummaryCard">
                                            <h4 className="accountingTypeSummaryCardTitle">
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </h4>
                                            <p className="accountingTypeSummaryCardValue">
                                                ZMW {amount.toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>
                                    No transaction type summaries available for the selected
                                    period.
                                </p>
                            )}
                        </section>

                        {/* --- NEW SECTION FOR JOURNAL ENTRIES --- */}
                        <section className="journalEntriesListSection">
                            <h2 className="journalEntriesListTitle">Recent Journal Entries</h2>
                            {journalEntries.length > 0 ? (
                                <div className="journalEntriesTableContainer">
                                    <table className="journalEntriesTable">
                                        <thead className="journalEntriesTableHead">
                                            <tr>
                                                <th>Date</th>
                                                <th>Description</th>
                                                <th>Recorded By</th>
                                                <th>Number of Lines</th>
                                                <th>Actions</th> {/* For view/edit */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {journalEntries.map((entry) => (
                                                <tr key={entry._id}>
                                                    <td>{entry.entryDate}</td>
                                                    <td>{entry.description}</td>
                                                    <td>{entry.recordedByUsername || 'N/A'}</td>
                                                    <td>{entry.lines.length}</td>
                                                    <td>
                                                        {/* Link to view individual journal entry if you have a detail page */}
                                                        <Link to={`/journal-entries/${entry._id}`} className="viewJournalEntryLink">View</Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No journal entries found for the selected filters.</p>
                            )}
                        </section>
                        {/* --- END NEW SECTION --- */}

                        <section className="transactionsListSection">
                            <h2 className="transactionsListTitle">Transaction History</h2>
                            <div className="transactionsFilterControls">
                                <div className="transactionsFilterGroup">
                                    <label htmlFor="filterType">Filter by Type:</label>
                                    <select
                                        id="filterType"
                                        name="filterType"
                                        value={filterType}
                                        onChange={handleFilterChange}
                                        className="filterSelect"
                                    >
                                        <option value="">All Types</option>
                                        {/* Populate options from uniqueTransactionTypes in overallSummary or hardcode if types are fixed */}
                                        {overallSummary.uniqueTransactionTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="accountingDateFilterGroup">
                                    <div className="filterGroup">
                                        <label htmlFor="filterStartDate">Start Date: </label>
                                        <input
                                            type="date"
                                            id="filterStartDate"
                                            name="filterStartDate"
                                            value={filterStartDate}
                                            onChange={handleFilterChange}
                                            className="filterInput"
                                        />
                                    </div>
                                    <div className="filterGroup">
                                        <label htmlFor="filterEndDate">End Date: </label>
                                        <input
                                            type="date"
                                            id="filterEndDate"
                                            name="filterEndDate"
                                            value={filterEndDate}
                                            onChange={handleFilterChange}
                                            className="filterInput"
                                        />
                                    </div>
                                </div>
                            </div>

                            {transactions.length > 0 ? (
                                <div className="transactionsTableContainer">
                                    <table className="transactionsTable">
                                        <thead className="transactionsTableHead">
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Amount (ZMW)</th>
                                                <th>Direction</th>
                                                <th>Status</th>
                                                <th>Client</th>
                                                <th>Loan ID</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((t) => (
                                                <tr key={t._id}>
                                                    <td>{t.date}</td>
                                                    <td>
                                                        <span className={`transactionTypeTag ${t.type}`}>
                                                            {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>{t.amount.toFixed(2)}</td>
                                                    <td>
                                                        <span
                                                            className={`transactionDirectionTag ${t.direction}`}
                                                        >
                                                            {t.direction.charAt(0).toUpperCase() +
                                                                t.direction.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`transactionStatusTag ${t.status?.toLowerCase()}`}
                                                        >
                                                            {t.status || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td>{t.clientName}</td>
                                                    <td>
                                                        {t.loan
                                                            ? t.loan._id.substring(0, 8) + "..."
                                                            : "N/A"}
                                                    </td>
                                                    <td>{t.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No transactions found for the selected filters.</p>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AccountingDashboardPage;