import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../utils/authUtils";
import "./LoansDashboardPage.css"; // Ensure this CSS file is correctly imported
import { toast } from "react-toastify"; // Import toast for notifications

const LoansDashboardPage = () => {
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [overallSummary, setOverallSummary] = useState({
    totalLoans: 0,
    totalActiveLoans: 0,
    totalPaidLoans: 0,
    totalOverdueLoans: 0,
    totalPendingLoans: 0,
    totalDefaultLoans: 0,
  });
  const [currentFilter, setCurrentFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // --- Fetch Loans and Summaries ---
  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      setError(null);
      const token = getToken();

      if (!token) {
        console.error(
          "LoansDashboard: No authentication token found. Redirecting to login."
        );
        clearAuthData();
        navigate("/");
        return;
      }

      try {
        let url = `${BACKEND_URL}/api/loans`;
        if (currentFilter !== "all") {
          url += `?status=${currentFilter}`;
        }

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
          console.error(
            "LoansDashboard: Authentication expired or invalid. Logging out."
          );
          clearAuthData();
          navigate("/");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch loan data.");
        }

        const { loans, overallSummary } = await response.json();
        setLoans(loans);
        setFilteredLoans(loans);
        setOverallSummary(overallSummary);
      } catch (err) {
        console.error("LoansDashboard: Error fetching loan data:", err);
        setError(err.message || "Network error or server unavailable.");
        setFilteredLoans([]);
        setLoans([]);
        setOverallSummary({
          totalLoans: 0,
          totalActiveLoans: 0,
          totalPaidLoans: 0,
          totalOverdueLoans: 0,
          totalPendingLoans: 0,
          totalDefaultLoans: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [navigate, BACKEND_URL, currentFilter]);

  if (loading) {
    return <div className="loansDashboardContainer">Loading loans...</div>;
  }

  if (error) {
    return (
      <div className="loansDashboardContainer" style={{ color: "red" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="loansDashboardContainer">
      <div className="loansDashboardHeading">
        {" "}
        {/* New: Matches clientsDashboardHeading */}
        <Link to="/mainDashboard">
          <button className="loansDashboardBackLink">
            Back to Main Dashboard
          </button>
        </Link>
        <h1 className="loansDashboardHeadline">LOANS OVERVIEW</h1>
        <h2 className="loanSummaryHeadline">SUMMARY</h2>{" "}
        {/* Moved inside heading */}
      </div>

      <div className="loansDashboard">
        {" "}
        {/* New: Grid container, analogous to clientsDashboard */}
        <div className="loansDashboardPanel">
          {" "}
          {/* New: Left panel, analogous to clientsDashboardPanel */}
          {/* Overall Loan Summary Section */}
          <section className="loanSummarySection">
            <div className="loanSummaryCards">
              <div className="loanSummaryCard">
                <h3>Total Loans</h3>
                <p>{overallSummary.totalLoans}</p>
              </div>
              <div className="loanSummaryCard">
                <h3>Active Loans</h3>
                <p>{overallSummary.totalActiveLoans}</p>
              </div>
              <div className="loanSummaryCard">
                <h3>Paid Loans</h3>
                <p>{overallSummary.totalPaidLoans}</p>
              </div>
              <div className="loanSummaryCard">
                <h3>Overdue Loans</h3>
                <p>{overallSummary.totalOverdueLoans}</p>
              </div>
              <div className="loanSummaryCard">
                <h3>Pending Loans</h3>
                <p>{overallSummary.totalPendingLoans}</p>
              </div>
              <div className="loanSummaryCard">
                <h3>Defaulted Loans</h3>
                <p>{overallSummary.totalDefaultLoans}</p>
              </div>
            </div>
          </section>
          {/* Action Buttons (Add New Loan) */}
          <div className="loanActionButtons">
            <Link to="/loans/add">
              <button className="addLoanButton">Add New Loan</button>
            </Link>
          </div>
        </div>
        <div className="loansDashboardContent">
          {" "}
          {/* Existing: Right panel, analogous to clientsDashboardContent */}
          {/* Filter Buttons */}
          <div className="loanFilterButtons">
            <button
              onClick={() => setCurrentFilter("all")}
              className={
                currentFilter === "all"
                  ? "active-filter loanFilterButton"
                  : "loanFilterButton"
              }
            >
              All Loans
            </button>
            <button
              onClick={() => setCurrentFilter("active")}
              className={
                currentFilter === "active"
                  ? "active-filter loanFilterButton"
                  : "loanFilterButton"
              }
            >
              Active
            </button>
            <button
              onClick={() => setCurrentFilter("pending")}
              className={
                currentFilter === "pending"
                  ? "active-filter loanFilterButton"
                  : "loanFilterButton"
              }
            >
              Pending
            </button>
            <button
              onClick={() => setCurrentFilter("overdue")}
              className={
                currentFilter === "overdue"
                  ? "active-filter loanFilterButton"
                  : "loanFilterButton"
              }
            >
              Overdue
            </button>
            <button
              onClick={() => setCurrentFilter("default")}
              className={
                currentFilter === "default"
                  ? "active-filter loanFilterButton"
                  : "loanFilterButton"
              }
            >
              Default
            </button>
            <button
              onClick={() => setCurrentFilter("paid")}
              className={
                currentFilter === "paid"
                  ? "active-filter loanFilterButton"
                  : "loanFilterButton"
              }
            >
              Paid
            </button>
          </div>
          {/* Detailed Loans List Section */}
          <section className="loansListSection">
            <h2 className="loansListHeadline">
              {currentFilter !== "all" ? `${currentFilter} ` : ""}Loans
            </h2>
            {(filteredLoans || []).length === 0 ? (
              <p className="noLoansMessage">
                No {currentFilter !== "all" ? `${currentFilter} ` : ""}loans
                found.
              </p>
            ) : (
              <div className="loansTableContainer">
                <table className="loansTable">
                  <thead>
                    <tr>
                      <th>Loan ID</th>
                      <th>client</th>
                      <th>Amount (ZMW)</th>
                      <th>Loan Date</th>
                      <th>Due Date</th>
                      <th>Interest Rate (%)</th>
                      <th>Status</th>
                      <th>Balance Due (ZMW)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan) => (
                      <tr key={loan._id}>
                        <td>{loan._id.substring(0, 8)}...</td>
                        <td>{loan.clientName || "N/A"}</td>
                        <td>ZMW{loan.loanAmount.toFixed(2)}</td>
                        <td>{loan.startDate}</td>
                        <td>{loan.dueDate}</td>
                        <td>{loan.interestRate}%</td>
                        <td>
                          <span className={`loanStatus ${loan.status}`}>
                            {loan.status}
                          </span>
                        </td>
                        <td>ZMW{loan.balanceDue.toFixed(2)}</td>
                        <td className="loanActionsCell">
                          <Link
                            to={`/loans/${loan._id}`}
                            className="viewLoanDetailsLink"
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoansDashboardPage;
