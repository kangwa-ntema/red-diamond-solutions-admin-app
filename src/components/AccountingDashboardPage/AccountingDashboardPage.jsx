import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../../utils/authUtils"; // Utility for authentication
import "./AccountingDashboardPage.css"; // Dedicated CSS for styling
import { toast } from "react-toastify"; // For displaying notifications

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

  // NEW State for total loans receivable (sum of outstanding loan balances)
  const [totalLoansReceivable, setTotalLoansReceivable] = useState(0);

  // State for the list of individual transactions
  const [transactions, setTransactions] = useState([]);

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
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

      const token = getToken(); // Retrieve authentication token

      // If no token, redirect to login
      if (!token) {
        console.error(
          "AccountingDashboardPage: No authentication token found. Redirecting to login."
        );
        clearAuthData();
        navigate("/");
        return;
      }

      // Helper to construct URL with query parameters
      const buildUrl = (baseUrl, params) => {
        const query = new URLSearchParams(params).toString();
        return `${baseUrl}?${query}`;
      };

      try {
        // 1. Fetch Overall Transaction Summary (Debits, Credits, Net Flow)
        const summaryUrl = buildUrl(`${BACKEND_URL}/api/transactions/summary`, {
          startDate: startDate,
          endDate: endDate,
        });
        const summaryResponse = await fetch(summaryUrl, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!summaryResponse.ok) {
          const errorData = await summaryResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch overall summary."
          );
        }
        const summaryData = await summaryResponse.json();
        setOverallSummary(summaryData);
        console.log("Overall Transaction Summary:", summaryData);

        // 2. Fetch Type Summary (e.g., Total Payments, Total Disbursements)
        const typeSummaryUrl = buildUrl(
          `${BACKEND_URL}/api/transactions/type-summary`,
          {
            startDate: startDate,
            endDate: endDate,
          }
        );
        const typeSummaryResponse = await fetch(typeSummaryUrl, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!typeSummaryResponse.ok) {
          const errorData = await typeSummaryResponse.json();
          throw new Error(errorData.message || "Failed to fetch type summary.");
        }
        const typeSummaryData = await typeSummaryResponse.json();
        setTypeSummary(typeSummaryData);
        console.log("Type Summary:", typeSummaryData);

        // 3. Fetch Total Loans Receivable (New Endpoint)
        const loansReceivableUrl = `${BACKEND_URL}/api/loans/summary-financials`; // No date filters here, it's a current snapshot
        const loansReceivableResponse = await fetch(loansReceivableUrl, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!loansReceivableResponse.ok) {
          const errorData = await loansReceivableResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch loans receivable summary."
          );
        }
        const loansReceivableData = await loansReceivableResponse.json();
        setTotalLoansReceivable(loansReceivableData.totalLoansReceivable);
        console.log(
          "Total Loans Receivable:",
          loansReceivableData.totalLoansReceivable
        );

        // 4. Fetch Detailed Transactions List
        const transactionsUrl = buildUrl(`${BACKEND_URL}/api/transactions`, {
          type: type,
          startDate: startDate,
          endDate: endDate,
        });
        const transactionsResponse = await fetch(transactionsUrl, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!transactionsResponse.ok) {
          const errorData = await transactionsResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch transactions list."
          );
        }
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
        console.log("Transactions List:", transactionsData);
      } catch (err) {
        console.error("Error fetching accounting data:", err);
        setError(err.message || "Network error or server unavailable.");
        toast.error(
          `Error loading accounting data: ${err.message || "Network error"}`
        );
        // If authentication issue, redirect
        if (
          err.message.includes("Authentication expired") ||
          err.message.includes("unauthorized")
        ) {
          clearAuthData();
          navigate("/loginForm");
        }
      } finally {
        setLoading(false); // Set loading to false once all fetches are complete
      }
    },
    [BACKEND_URL, navigate]
  ); // Dependencies for useCallback: backend URL and navigate function

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
        <Link to="/mainDashboard" className="journalEntryBackLink">
                        {"<"} Back to Main Dashboard
                    </Link>
        <h1 className="accountingHeadline">Accounting Overview</h1>
        <li className="mainDashboardNavLink">
          <Link to="/accounts">Chart Of Accounts</Link>
        </li>
        <li className="mainDashboardNavLink">
          <Link to="/journal-entries">Journal Entries</Link>
        </li>
        <section className="summaryCardsGrid">
          <div className="summaryCard totalDebits">
            <h3>Total Disbursements</h3>
            <p>ZMW {overallSummary.totalDebits.toFixed(2)}</p>
          </div>
          <div className="summaryCard totalCredits">
            <h3>Total Payments Received</h3> {/* Updated label for clarity */}
            <p>ZMW {overallSummary.totalCredits.toFixed(2)}</p>
          </div>
          <div className="summaryCard netCashFlow">
            <h3>Net Cash Flow (Transactions)</h3>{" "}
            {/* Updated label for clarity */}
            <p>ZMW {overallSummary.netCashFlow.toFixed(2)}</p>
          </div>
          {/* NEW: Card for Total Loans Receivable */}
          <div className="summaryCard loansReceivable">
            <h3>Total Loans Receivable</h3>
            <p>ZMW {totalLoansReceivable.toFixed(2)}</p>
          </div>
        </section>

        <section className="typeSummarySection">
          <h2>Summary by Transaction Type</h2>
          {Object.keys(typeSummary).length > 0 ? (
            <div className="typeSummaryGrid">
              {Object.entries(typeSummary).map(([type, amount]) => (
                <div key={type} className="typeSummaryCard">
                  <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>{" "}
                  {/* Capitalize type */}
                  <p>ZMW {amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>
              No transaction type summaries available for the selected period.
            </p>
          )}
        </section>

        <section className="transactionsListSection">
          <h2>Transaction History</h2>
          <div className="filterControls">
            <div className="filterGroup">
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
            <div className="filterGroup">
              <label htmlFor="filterStartDate">Start Date:</label>
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
              <label htmlFor="filterEndDate">End Date:</label>
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

          {transactions.length > 0 ? (
            <div className="transactionsTableContainer">
              <table className="transactionsTable">
                <thead>
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
                        {t.loan ? t.loan._id.substring(0, 8) + "..." : "N/A"}
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
    </div>
  );
};

export default AccountingDashboardPage;
