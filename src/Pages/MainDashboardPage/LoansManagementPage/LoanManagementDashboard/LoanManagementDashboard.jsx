import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext"; // Correct path to useAuth hook
import { getAllLoans } from "../../../../services/api/loanApi"; // Import the new API function
import "./LoanManagementDashboard.css"; // Ensure this CSS file is correctly imported

const LoansManagementDashboard = () => {
    const [loans, setLoans] = useState([]);
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
    const { isAuthenticated, hasRole } = useAuth();

    // Helper function to format dates for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            // Formats to YYYY-MM-DD (e.g., 2025-06-22)
            return date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return "Invalid Date";
        }
    };

    // --- Fetch Loans and Summaries (Refactored) ---
    // Using useCallback to memoize the fetch function and prevent unnecessary re-renders
    const fetchLoansData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Call the API function from services/loanApi.js
            const responseData = await getAllLoans(
                currentFilter !== "all" ? { status: currentFilter } : {}
            );

            setLoans(responseData.loans || []);
            setOverallSummary(
                responseData.overallSummary || {
                    totalLoans: 0,
                    totalActiveLoans: 0,
                    totalPaidLoans: 0,
                    totalOverdueLoans: 0,
                    totalPendingLoans: 0,
                    totalDefaultLoans: 0,
                }
            );
        } catch (err) {
            console.error("LoansDashboard: Error fetching loan data:", err);
            setError(err.message || "Network error or server unavailable.");
            setLoans([]); // Clear loans on error
            setOverallSummary({ // Reset summary on error
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
    }, [currentFilter]); // isAuthenticated is not directly used in the fetch logic here, so removed from dependencies.

    useEffect(() => {
        // Ensure authentication before fetching data
        if (!isAuthenticated) {
            // This case should ideally be handled by PrivateRoute,
            // but a defensive check here doesn't hurt.
            // toast.error("You must be logged in to view this page.");
            // navigate("/"); // Or wherever your login page is
            return;
        }
        fetchLoansData();
    }, [fetchLoansData, isAuthenticated, navigate]); // Add isAuthenticated and navigate as dependencies for the effect

    if (loading) {
        return <div className="loansDashboardContainer loansMessage">Loading loans...</div>;
    }

    if (error) {
        return (
            <div className="loansDashboardContainer loansErrorMessage">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="loansDashboardContainer">
            <div className="loansDashboardHeading">
                <Link to="/mainDashboard">
                    <button className="loansDashboardBackLink">
                        Back to Main Dashboard
                    </button>
                </Link>
                <h1 className="loansDashboardHeadline">LOANS OVERVIEW</h1>
                <h2 className="loanDashboardSubHeadline">SUMMARY</h2>
            </div>

            <div className="loansDashboard">
                <div className="loansDashboardPanelContainer">
                    <div className="loansDashboardPanel">
                        {/* Overall Loan Summary Section */}
                        {hasRole(["superadmin", "admin", "employee"]) && ( // Only show if user has relevant roles
                            <div className="loanActionButtons">
                                <Link to="/loans/add">
                                    <button className="addLoanButton">
                                        + Add New Loan
                                    </button>
                                </Link>
                            </div>
                        )}
                        <section className="loanSummarySection">
                            <div className="loanSummaryCards">
                                <div className="loanSummaryCard">
                                    <h3 className="loanSummaryCardTitle">
                                        Total Loans
                                    </h3>
                                    <p className="loanSummaryCardValue">
                                        {overallSummary.totalLoans}
                                    </p>
                                </div>
                                <div className="loanSummaryCard">
                                    <h3 className="loanSummaryCardTitle">
                                        Active Loans
                                    </h3>
                                    <p className="loanSummaryCardValue">
                                        {overallSummary.totalActiveLoans}
                                    </p>
                                </div>
                                <div className="loanSummaryCard">
                                    <h3 className="loanSummaryCardTitle">
                                        Paid Loans
                                    </h3>
                                    <p className="loanSummaryCardValue">
                                        {overallSummary.totalPaidLoans}
                                    </p>
                                </div>
                                <div className="loanSummaryCard">
                                    <h3 className="loanSummaryCardTitle">
                                        Overdue Loans
                                    </h3>
                                    <p className="loanSummaryCardValue">
                                        {overallSummary.totalOverdueLoans}
                                    </p>
                                </div>
                                <div className="loanSummaryCard">
                                    <h3 className="loanSummaryCardTitle">
                                        Pending Loans
                                    </h3>
                                    <p className="loanSummaryCardValue">
                                        {overallSummary.totalPendingLoans}
                                    </p>
                                </div>
                                <div className="loanSummaryCard">
                                    <h3 className="loanSummaryCardTitle">
                                        Defaulted Loans
                                    </h3>
                                    <p className="loanSummaryCardValue">
                                        {overallSummary.totalDefaultLoans}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="loansDashboardContent">
                    <h1 className="loansFilterBtnHeadline">Loans Filter Buttons</h1>
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
                        {(loans || []).length === 0 ? (
                            <p className="noLoansMessage">
                                No {currentFilter !== "all" ? `${currentFilter} ` : ""}loans
                                found.
                            </p>
                        ) : (
                            <div className="loansTableContainer">
                                <table className="loansTable">
                                    <thead className="loansTableHead">
                                        <tr>
                                            <th>Loan ID</th>
                                            <th>Client</th>
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
                                        {loans.map((loan) => (
                                            <tr key={loan._id}>
                                                <td>{loan._id.substring(0, 8)}...</td>
                                                <td>{loan.clientName || "N/A"}</td>
                                                <td>ZMW{loan.loanAmount.toFixed(2)}</td>
                                                {/* Apply the formatDate helper here */}
                                                <td>{formatDate(loan.startDate)}</td>
                                                <td>{formatDate(loan.dueDate)}</td>
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

export default LoansManagementDashboard;