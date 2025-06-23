// src/Pages/MainDashboardPage/AccountingManagementDashboard/AccountingManagementDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify"; // For displaying notifications
import { useAuth } from "../../../../context/AuthContext"; // Import useAuth hook
import {
    getTransactionsSummary,
    getTransactionsTypeSummary,
    getLoansReceivableSummary,
    getTransactions,
    getAllJournalEntries,
} from "../../../../services/api/"; // Corrected import path from services/api/accountingApi to services/accountingApi



import "./AccountingManagementDashboard.css"; // Dedicated CSS for styling

/**
 * @component AccountingManagementDashboard
 * @description Displays an overview of the application's financial accounting,
 * including overall summaries of debits and credits, transaction counts by type,
 * and a detailed list of all transactions with filtering capabilities.
 * It fetches data from the backend's transaction API.
 */
const AccountingManagementDashboard = () => {
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

    // State for journal entries
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
    const [loading, setLoading] = useState(true); // For initial page load
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { isAuthenticated, logout, hasRole } = useAuth(); // Use the useAuth hook

    /**
     * @function fetchAccountingData
     * @description Fetches all necessary accounting data (overall summary, type summary, transactions list, journal entries)
     * from the backend. This function is memoized using useCallback to prevent unnecessary re-creation.
     * @param {string} type - Optional transaction type to filter the list.
     * @param {string} startDate - Optional start date for filtering.
     * @param {string} endDate - Optional end date for filtering.
     */
    const fetchAccountingData = useCallback(
        async (type = "", startDate = "", endDate = "") => {
            setLoading(true); // Set loading to true at the start of data fetching
            setError(null); // Clear any previous errors

            // Authentication check: If not authenticated, rely on global interceptor to redirect.
            // No explicit logout/navigate here, as axios interceptor should manage.
            // However, a console error remains useful for debugging.
            if (!isAuthenticated) {
                console.warn("AccountingDashboardPage: User not authenticated. Relying on global interceptor for redirect.");
                setLoading(false); // Ensure loading is turned off even if not authenticated
                return;
            }

            try {
                const dateFilters = { startDate, endDate };
                const transactionFilters = { type, startDate, endDate };
                const journalEntryFilters = { startDate, endDate };

                // 1. Fetch Overall Transaction Summary
                const summaryData = await getTransactionsSummary(dateFilters);
                setOverallSummary(summaryData);
                console.log("Overall Transaction Summary:", summaryData);

                // 2. Fetch Type Summary
                const typeSummaryData = await getTransactionsTypeSummary(dateFilters);
                setTypeSummary(typeSummaryData);
                console.log("Type Summary:", typeSummaryData);

                // 3. Fetch Total Loans Receivable
                const loansReceivableData = await getLoansReceivableSummary();
                setTotalLoansReceivable(loansReceivableData.totalLoansReceivable);
                console.log("Total Loans Receivable:", loansReceivableData.totalLoansReceivable);

                // 4. Fetch Detailed Transactions List
                const transactionsData = await getTransactions(transactionFilters);
                setTransactions(transactionsData);
                console.log("Transactions List:", transactionsData);

                // 5. FETCH JOURNAL ENTRIES
                const journalEntriesData = await getAllJournalEntries(journalEntryFilters);
                setJournalEntries(journalEntriesData);
                console.log("Journal Entries List:", journalEntriesData);

            } catch (err) {
                console.error("Error fetching accounting data:", err);
                // `err.message` is expected from the centralized API handler (`handleApiError`)
                const errorMessage = err.message || "Network error or server unavailable.";
                setError(errorMessage);
                toast.error(`Error loading accounting data: ${errorMessage}`);

                // The global Axios interceptor should handle authentication expiration.
                // This block is for additional client-side logic if needed, but primary redirect is global.
                if (errorMessage.includes("Authentication expired") || errorMessage.includes("Unauthorized") || errorMessage.includes("Forbidden")) {
                    // Optional: You could specifically clear local auth state if not already handled by interceptor's logout()
                    // logout(); // This is redundant if the interceptor already calls it
                    // navigate("/"); // This is redundant if the interceptor already calls it
                }
            } finally {
                setLoading(false); // Set loading to false once all fetches are complete
            }
        },
        [isAuthenticated] // Dependencies for useCallback. `navigate` and `logout` removed as their actions are handled globally.
    );

    // useEffect to call fetchAccountingData on component mount and when filters change
    useEffect(() => {
        // Only fetch data if isAuthenticated. This prevents unnecessary calls and errors if not logged in.
        // The global interceptor will handle the actual unauthorized redirect.
        if (isAuthenticated) {
            fetchAccountingData(filterType, filterStartDate, filterEndDate);
        } else {
            setLoading(false); // If not authenticated, stop loading state
            // Optionally set an error here if you want a specific message for unauthenticated access to this page
            setError("You must be logged in to view this page.");
            toast.error("You must be logged in to view this page.");
        }
    }, [fetchAccountingData, filterType, filterStartDate, filterEndDate, isAuthenticated]); // Re-fetch when filters or auth status change

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
                    {/* <div className="accountingDashboardPanel">
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
                    </div> */}
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
                                        disabled={loading} // Disable filters when loading
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
                                            disabled={loading} // Disable filters when loading
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
                                            disabled={loading} // Disable filters when loading
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
                                                    <td>{new Date(t.date).toLocaleDateString()}</td> {/* Format date */}
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
                                                    {/* Display client name, assuming it's available in the transaction object */}
                                                    <td>{t.clientName || 'N/A'}</td>
                                                    <td>
                                                        {t.loan
                                                            ? t.loan._id.substring(0, 8) + "..."
                                                            : "N/A"}
                                                    </td>
                                                    <td>{t.description || 'N/A'}</td>
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

export default AccountingManagementDashboard;
