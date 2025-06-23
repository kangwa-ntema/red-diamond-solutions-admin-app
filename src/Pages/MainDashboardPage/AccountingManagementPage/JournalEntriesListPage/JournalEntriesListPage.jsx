// src/Pages/MainDashboardPage/AccountingManagementDashboard/JournalEntriesListPage/JournalEntriesListPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom"; // useNavigate removed as it's not directly used for redirection here
import { toast } from "react-toastify"; // For notifications
import "./JournalEntriesListPage.css"; // Common CSS for journal entry pages

// Import the centralized API functions from accountingApi
import {
    getAllJournalEntries, // Renamed from getJournalEntries for clarity consistent with other getAllX functions
    getAllAccounts, // For the accounts filter dropdown
} from "../../../../services/api/"; // Corrected import path

/**
 * @component JournalEntriesListPage
 * @description Displays a list of all journal entries with filtering capabilities.
 * Allows navigation to individual journal entry details.
 */
const JournalEntriesListPage = () => {
    // State for the list of journal entries fetched from the backend
    const [journalEntries, setJournalEntries] = useState([]);
    // State for the list of accounts to populate the filter dropdown
    const [accounts, setAccounts] = useState([]);
    // State to manage overall loading status for data fetching
    const [loading, setLoading] = useState(true);
    // State to store any error messages that occur during data fetching
    const [error, setError] = useState(null);

    // States for filtering journal entries
    const [filterStartDate, setFilterStartDate] = useState(""); // Start date for filtering (YYYY-MM-DD)
    const [filterEndDate, setFilterEndDate] = useState(""); // End date for filtering (YYYY-MM-DD)
    const [filterAccountId, setFilterAccountId] = useState(""); // Filter by specific account involved
    const [filterRelatedDocumentType, setFilterRelatedDocumentType] = useState(""); // Filter by related document type (e.g., 'Loan', 'Payment')

    /**
     * @function fetchJournalEntries
     * @description Fetches the list of all journal entries from the backend API,
     * applying current filter settings. This function uses the centralized API service.
     * Error handling and unauthorized redirects are managed by the Axios interceptor.
     */
    const fetchJournalEntries = useCallback(async () => {
        setLoading(true); // Set loading to true at the start of fetching
        setError(null);    // Clear any previous errors

        try {
            // Construct the filters object to pass to the API function
            const filters = {
                startDate: filterStartDate,
                endDate: filterEndDate,
                accountId: filterAccountId,
                type: filterRelatedDocumentType,
            };

            // Call the centralized API function to get journal entries
            const data = await getAllJournalEntries(filters);
            setJournalEntries(data); // Update state with the fetched entries
        } catch (err) {
            console.error("JournalEntriesListPage: Error fetching journal entries:", err);
            // The `handleApiError` utility (via `accountingApi`) will throw a more specific error message,
            // and the Axios interceptor might already show a toast for 401s.
            setError(err.message || "Failed to fetch journal entries. Please try again.");
            // Optionally, show a toast if the interceptor doesn't cover all desired cases.
            toast.error(`Error fetching journal entries: ${err.message || "Network error"}`);
        } finally {
            setLoading(false); // Set loading to false once fetching is complete (success or failure)
        }
    }, [
        filterStartDate,        // Dependency: Re-fetch when start date filter changes
        filterEndDate,          // Dependency: Re-fetch when end date filter changes
        filterAccountId,        // Dependency: Re-fetch when account ID filter changes
        filterRelatedDocumentType, // Dependency: Re-fetch when related document type filter changes
    ]);

    /**
     * @function fetchAccountsForFilter
     * @description Fetches the list of all accounting accounts from the backend for the filter dropdown.
     * This function uses the centralized API service.
     */
    const fetchAccountsForFilter = useCallback(async () => {
        try {
            // Call the centralized API function to get all accounts
            const data = await getAllAccounts();
            // Sort accounts by accountCode for a structured dropdown list
            setAccounts(data.sort((a, b) => a.accountCode.localeCompare(b.accountCode)));
        } catch (err) {
            console.error("JournalEntriesListPage: Error fetching accounts for filter:", err);
            toast.error(`Error loading accounts for filter: ${err.message || "Network error"}`);
        }
    }, []); // No external dependencies for this function

    // useEffect hook to trigger data fetching on component mount and when filter states change.
    useEffect(() => {
        fetchJournalEntries();      // Fetch journal entries with current filters
        fetchAccountsForFilter();   // Fetch accounts for the filter dropdown
    }, [fetchJournalEntries, fetchAccountsForFilter]); // Dependencies ensure these functions are called when needed

    /**
     * @function handleApplyFilters
     * @description Triggers a re-fetch of journal entries based on the currently set filter states.
     */
    const handleApplyFilters = () => {
        fetchJournalEntries(); // Manually trigger re-fetch
    };

    /**
     * @function handleClearFilters
     * @description Resets all filter states to their default (empty) values.
     * The `useEffect` hook will then automatically call `fetchJournalEntries` due to state changes.
     */
    const handleClearFilters = () => {
        setFilterStartDate("");
        setFilterEndDate("");
        setFilterAccountId("");
        setFilterRelatedDocumentType("");
        // No explicit fetch here, as useEffect will react to state changes.
    };

    // Conditional rendering for initial loading state
    if (loading && journalEntries.length === 0) {
        return (
            <div className="journalEntryListContainer loading">
                Loading journal entries...
            </div>
        );
    }

    // Conditional rendering for error state (if no data could be loaded initially)
    if (error && journalEntries.length === 0) {
        return <div className="journalEntryListContainer error">Error: {error}</div>;
    }

    return (
        <div className="journalEntryListContainer">
            <div className="journalEntryListHeading">
                {/* Link to the main accounting dashboard for consistent navigation */}
                <Link to="/accounting" className="journalEntryListBackLink">
                    Back to Accounting Dashboard
                </Link>
                <h1 className="journalEntryListHeadline">Journal Entries</h1>
                <div className="journalEntryListDashboard">
                    <div className="journalEntryListDashboardPanel">
                        {/* Button to navigate to the Add New Journal Entry page */}
                        <Link to="/accounting/journal-entries/add" className="addJournalEntryBtnLink">
                            <div className="addJournalEntryListBtn">
                                + Create New Journal Entry
                            </div>
                        </Link>
                        <div className="journalEntriesList">
                            {/* Filter Section */}
                            <div className="journalEntryListFilters">
                                <h3 className="journalEntryListFiltersHeadline">
                                    Filter Journal Entries
                                </h3>
                                <div className="journalEntryListFilterGroup">
                                    <div className="journalEntryListFilterGroupElement">
                                        <label htmlFor="filterStartDate">Start Date: </label>
                                        <input
                                            type="date"
                                            id="filterStartDate"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            className="filterInput"
                                            disabled={loading} // Disable filters when loading
                                        />
                                    </div>
                                    <div className="journalEntryListFilterGroupElement">
                                        <label htmlFor="filterEndDate">End Date: </label>
                                        <input
                                            type="date"
                                            id="filterEndDate"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            className="filterInput"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="journalEntryListFilterGroupElement">
                                        <label htmlFor="filterAccountId">Account: </label>
                                        <select
                                            id="filterAccountId"
                                            value={filterAccountId}
                                            onChange={(e) => setFilterAccountId(e.target.value)}
                                            className="filterSelect"
                                            disabled={loading}
                                        >
                                            <option value="">All Accounts</option>
                                            {/* Map through fetched accounts to create dropdown options */}
                                            {accounts.map((account) => (
                                                <option key={account._id} value={account._id}>
                                                    {account.accountCode} - {account.accountName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="journalEntryListFilterGroupElement">
                                        <label htmlFor="filterRelatedDocumentType">
                                            Document Type:{" "}
                                        </label>
                                        <select
                                            id="filterRelatedDocumentType"
                                            value={filterRelatedDocumentType}
                                            onChange={(e) => setFilterRelatedDocumentType(e.target.value)}
                                            className="filterSelect"
                                            disabled={loading}
                                        >
                                            <option value="">All Types</option>
                                            {/* Hardcoded common related document types */}
                                            <option value="Loan">Loan</option>
                                            <option value="Payment">Payment</option>
                                            <option value="Invoice">Invoice</option>
                                            <option value="Bill">Bill</option>
                                            <option value="Transaction">General Transaction</option>
                                            {/* Add more types as needed based on your application's integrations */}
                                        </select>
                                    </div>
                                    <div className="journalEntryListFilterButtons">
                                        <button
                                            onClick={handleApplyFilters}
                                            className="applyFiltersBtn"
                                            disabled={loading}
                                        >
                                            Apply Filters
                                        </button>
                                        <button
                                            onClick={handleClearFilters}
                                            className="clearFiltersBtn"
                                            disabled={loading}
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Journal Entries Table */}
                {journalEntries.length === 0 && !loading ? (
                    <p className="journalEntryListNoEntriesMessage">
                        No journal entries found matching your criteria.
                    </p>
                ) : (
                    <div className="journalEntriesListTableContainer">
                        <table className="journalEntriesListTable">
                            <thead>
                                <tr>
                                    <th>Entry No.</th>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Related Document</th>
                                    <th>Recorded By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {journalEntries.map((entry) => (
                                    <tr key={entry._id}>
                                        <td data-label="Entry No.">
                                            {entry.entryNumber || entry._id.substring(0, 8)} {/* Display entryNumber if available, else a snippet of ID */}
                                        </td>
                                        <td data-label="Date">
                                            {new Date(entry.entryDate).toLocaleDateString()} {/* Format date for display */}
                                        </td>
                                        <td data-label="Description">{entry.description}</td>
                                        <td data-label="Related Document">
                                            {/* Display related document type and a snippet of its ID if available */}
                                            {entry.relatedDocument?.type
                                                ? `${entry.relatedDocument.type} (ID: ${entry.relatedDocument.id?.substring(0, 8)}...)`
                                                : "N/A"}
                                        </td>
                                        <td data-label="Recorded By">
                                            {/* Display the username of the recorder */}
                                            {entry.recordedByUsername || "N/A"}
                                        </td>
                                        <td data-label="Actions" className="journalEntryActionsCell">
                                            {/* Link to view detailed information for the journal entry */}
                                            <Link
                                                to={`/accounting/journal-entries/${entry._id}`}
                                                className="viewJournalEntryBtn"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JournalEntriesListPage;
