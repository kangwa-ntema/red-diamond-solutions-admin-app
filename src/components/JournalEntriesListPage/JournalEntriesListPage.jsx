import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../../utils/authUtils"; // Adjust path as needed
import { toast } from "react-toastify"; // For notifications
import "./JournalEntriesListPage.css"; // Common CSS for journal entry pages

/**
 * @component JournalEntriesListPage
 * @description Displays a list of all journal entries with filtering capabilities.
 * Allows navigation to individual journal entry details.
 */
const JournalEntriesListPage = () => {
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

  const fetchJournalEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    if (!token) {
      clearAuthData();
      navigate("/landingPage");
      toast.error("Authentication required to fetch journal entries.");
      return;
    }

    try {
      let url = `${BACKEND_URL}/api/journal-entries?`;
      if (filterStartDate) url += `startDate=${filterStartDate}&`;
      if (filterEndDate) url += `endDate=${filterEndDate}&`;
      if (filterAccountId) url += `accountId=${filterAccountId}&`;
      if (filterRelatedDocumentType)
        url += `type=${filterRelatedDocumentType}&`;
      url = url.slice(0, -1); // Remove trailing '&' or '?'

      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        clearAuthData();
        navigate("/landingPage");
        toast.error(
          "Authentication expired or unauthorized. Please log in again."
        );
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch journal entries."
        );
      }

      const data = await response.json();
      setJournalEntries(data);
    } catch (err) {
      console.error(
        "JournalEntriesListPage: Error fetching journal entries:",
        err
      );
      setError(err.message || "Network error or server unavailable.");
      toast.error(
        `Error fetching journal entries: ${err.message || "Network error"}`
      );
    } finally {
      setLoading(false);
    }
  }, [
    BACKEND_URL,
    navigate,
    filterStartDate,
    filterEndDate,
    filterAccountId,
    filterRelatedDocumentType,
  ]);

  // Fetch accounts for the filter dropdown
  const fetchAccountsForFilter = useCallback(async () => {
    const token = getToken();
    if (!token) return; // Don't proceed if no token

    try {
      const response = await fetch(`${BACKEND_URL}/api/accounts`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAccounts(
          data.sort((a, b) => a.accountCode.localeCompare(b.accountCode))
        );
      } else {
        console.error(
          "Failed to fetch accounts for filter:",
          await response.json()
        );
      }
    } catch (err) {
      console.error("Error fetching accounts for filter:", err);
    }
  }, [BACKEND_URL]);

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

      <Link to="/journal-entries/add" className="">
        <div className="addJournalEntryListBtn">+ Create New Journal Entry</div>
      </Link>
        </div>

      {/* Filter Section */}
      <div className="journalEntryListFilters">
        <h3 className="journalEntryListFiltersHeadline">
          Filter Journal Entries
        </h3>
        <div className="journalEntryListFilterGroup">
          <div className="journalEntryListFilterGroupElement">
            <label htmlFor="filterStartDate">Start Date:{" "}</label>
            <input
              type="date"
              id="filterStartDate"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div className="journalEntryListFilterGroupElement">
            <label htmlFor="filterEndDate">End Date:</label>
            <input
              type="date"
              id="filterEndDate"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
          <div className="journalEntryListFilterGroupElement">
            <label htmlFor="filterAccountId">Account:</label>
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
            <label htmlFor="filterRelatedDocumentType">Document Type:</label>
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
          <div className="filterButtons">
            <button onClick={handleApplyFilters} className="applyFiltersBtn">
              Apply Filters
            </button>
            <button onClick={handleClearFilters} className="clearFiltersBtn">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Journal Entries Table */}
      {journalEntries.length === 0 && !loading ? (
        <p className="noEntriesMessage">
          No journal entries found matching your criteria.
        </p>
      ) : (
        <div className="journalEntriesTableContainer">
          <table className="journalEntriesTable">
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
                        } (ID: ${entry.relatedDocument.id?.substring(0, 8)}...)`
                      : "N/A"}
                  </td>
                  <td data-label="Recorded By">
                    {entry.recordedByUsername || "N/A"}
                  </td>
                  <td data-label="Actions" className="journalEntryActionsCell">
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
  );
};

export default JournalEntriesListPage;
