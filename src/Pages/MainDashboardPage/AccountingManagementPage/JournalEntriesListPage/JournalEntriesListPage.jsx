import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
// Removed: getToken, clearAuthData - Handled by Axios interceptor now
import { toast } from "react-toastify"; // For notifications
import "./JournalEntriesListPage.css"; // Common CSS for journal entry pages

// Import the centralized API functions
import { getJournalEntries } from "../../../../services/api/journalEntryApi"; // Or './journalEntryApi' if you created it
import { getAccounts } from "../../../../services/api/accountApi"; // For the accounts filter dropdown


/**
 * @component JournalEntriesListPage
 * @description Displays a list of all journal entries with filtering capabilities.
 * Allows navigation to individual journal entry details.
 */
const JournalEntriesListPage = () => {
    const navigate = useNavigate();
    // Removed: const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [journalEntries, setJournalEntries] = useState([]);
    const [accounts, setAccounts] = useState([]); // For account filter dropdown
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [filterAccountId, setFilterAccountId] = useState("");
    const [filterRelatedDocumentType, setFilterRelatedDocumentType] =
        useState("");

    /**
     * @function fetchJournalEntries
     * @description Fetches the list of all journal entries from the backend API,
     * applying current filter settings.
     * This now uses the centralized Axios instance, with 401 handling in the interceptor.
     */
    const fetchJournalEntries = useCallback(async () => {
        setLoading(true);
        setError(null);

        // No need for manual token checks or navigation here, Axios interceptor handles 401.
        // If the interceptor navigates away, this function won't complete or its state updates won't matter.

        try {
            const filters = {
                startDate: filterStartDate,
                endDate: filterEndDate,
                accountId: filterAccountId,
                type: filterRelatedDocumentType,
            };

            // Use the new API function with filters
            const data = await getJournalEntries(filters);
            setJournalEntries(data);
        } catch (err) {
            console.error(
                "JournalEntriesListPage: Error fetching journal entries:",
                err
            );
            // The handleApiError utility will throw a more specific error message.
            // The Axios interceptor might also show a toast for 401s.
            setError(err.message || "Failed to fetch journal entries. Please try again.");
            toast.error(`Error fetching journal entries: ${err.message || "Network error"}`);
        } finally {
            setLoading(false);
        }
    }, [
        filterStartDate,
        filterEndDate,
        filterAccountId,
        filterRelatedDocumentType,
        // Removed BACKEND_URL and navigate from dependencies as they are handled internally by the API layer
    ]);

    /**
     * @function fetchAccountsForFilter
     * @description Fetches the list of all accounting accounts for the filter dropdown.
     * Uses the centralized API service.
     */
    const fetchAccountsForFilter = useCallback(async () => {
        try {
            // Use the new getAccounts API function
            const data = await getAccounts();
            setAccounts(
                data.sort((a, b) => a.accountCode.localeCompare(b.accountCode))
            );
        } catch (err) {
            console.error("Error fetching accounts for filter:", err);
            // Again, toast might be shown by interceptor.
            // Consider if you want a specific toast here, or rely on the global one.
            toast.error(`Error loading accounts for filter: ${err.message || "Network error"}`);
        }
    }, []); // No external dependencies anymore

    useEffect(() => {
        fetchJournalEntries();
        fetchAccountsForFilter();
    }, [fetchJournalEntries, fetchAccountsForFilter]);

    // Handle filter application
    const handleApplyFilters = () => {
        fetchJournalEntries(); // Re-fetch data with current filter states
    };

    // Handle clearing filters
    const handleClearFilters = () => {
        setFilterStartDate("");
        setFilterEndDate("");
        setFilterAccountId("");
        setFilterRelatedDocumentType("");
        // fetchJournalEntries will be called by useEffect due to state changes
    };

    if (loading && journalEntries.length === 0) {
        return (
            <div className="journalEntryContainer loading">
                Loading journal entries...
            </div>
        );
    }

    if (error && journalEntries.length === 0) {
        return <div className="journalEntryContainer error">Error: {error}</div>;
    }

    return (
        <div className="journalEntryListContainer">
            <div className="journalEntryListHeading">
                <Link to="/transactions" className="journalEntryListBackLink">
                    Back to Main Dashboard
                </Link>
                <h1 className="journalEntryListHeadline">Journal Entries</h1>
                <div className="journalEntryListDashboard">
                    <div className="journalEntryListDashboardPanel">
                        <Link to="/journal-entries/add" className="">
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
                                        />
                                    </div>
                                    <div className="journalEntryListFilterGroupElement">
                                        <label htmlFor="filterEndDate">End Date: </label>
                                        <input
                                            type="date"
                                            id="filterEndDate"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="journalEntryListFilterGroupElement">
                                        <label htmlFor="filterAccountId">Account: </label>
                                        <select
                                            id="filterAccountId"
                                            value={filterAccountId}
                                            onChange={(e) => setFilterAccountId(e.target.value)}
                                        >
                                            <option value="">All Accounts</option>
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
                                        >
                                            <option value="">All Types</option>
                                            <option value="Loan">Loan</option>
                                            <option value="Payment">Payment</option>
                                            <option value="Invoice">Invoice</option>
                                            <option value="Bill">Bill</option>
                                            <option value="Transaction">General Transaction</option>
                                        </select>
                                    </div>
                                    <div className="journalEntryListFilterButtons">
                                        <button
                                            onClick={handleApplyFilters}
                                            className="applyFiltersBtn"
                                        >
                                            Apply Filters
                                        </button>
                                        <button
                                            onClick={handleClearFilters}
                                            className="clearFiltersBtn"
                                        >
                                            Clear Filters
                                        </button>
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
                                                {entry.entryNumber || entry._id.substring(0, 8)}
                                            </td>
                                            <td data-label="Date">
                                                {new Date(entry.entryDate).toLocaleDateString()}
                                            </td>
                                            <td data-label="Description">{entry.description}</td>
                                            <td data-label="Related Document">
                                                {entry.relatedDocument?.type
                                                    ? `${
                                                          entry.relatedDocument.type
                                                      } (ID: ${entry.relatedDocument.id?.substring(
                                                          0,
                                                          8
                                                      )}...)`
                                                    : "N/A"}
                                            </td>
                                            <td data-label="Recorded By">
                                                {entry.recordedByUsername || "N/A"}
                                            </td>
                                            <td
                                                data-label="Actions"
                                                className="journalEntryActionsCell"
                                            >
                                                <Link
                                                    to={`/journal-entries/${entry._id}`}
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
        </div>
    );
};

export default JournalEntriesListPage;