import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../utils/authUtils";
/* import "./LoansDashboard.css"; */ // CSS import commented out

const LoansDashboard = () => {
    const [loans, setLoans] = useState([]);
    const [filteredLoans, setFilteredLoans] = useState([]); // State to hold filtered loans
    const [overallSummary, setOverallSummary] = useState({
        totalLoans: 0,
        totalActiveLoans: 0,
        totalPaidLoans: 0,
        totalOverdueLoans: 0,
        totalPendingLoans: 0,
        totalDefaultLoans: 0,
    });
    const [currentFilter, setCurrentFilter] = useState('all'); // State for current filter

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
                console.error("LoansDashboard: No authentication token found. Redirecting to login.");
                clearAuthData();
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/loans`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                });

                if (response.status === 401 || response.status === 403) {
                    console.error("LoansDashboard: Authentication expired or invalid. Logging out.");
                    clearAuthData();
                    navigate("/login");
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch loan data.");
                }

                const { loans: fetchedLoans } = await response.json(); // Only destructure loans

                setLoans(fetchedLoans); // Store all fetched loans
                setFilteredLoans(fetchedLoans); // Initially show all loans

                // Calculate summary from fetchedLoans
                const newSummary = {
                    totalLoans: fetchedLoans.length,
                    totalActiveLoans: fetchedLoans.filter(loan => loan.status === 'active').length,
                    totalPaidLoans: fetchedLoans.filter(loan => loan.status === 'paid').length,
                    totalOverdueLoans: fetchedLoans.filter(loan => loan.status === 'overdue').length,
                    totalPendingLoans: fetchedLoans.filter(loan => loan.status === 'pending').length,
                    totalDefaultLoans: fetchedLoans.filter(loan => loan.status === 'default').length,
                };
                setOverallSummary(newSummary);

            } catch (err) {
                console.error("LoansDashboard: Error fetching loan data:", err);
                setError(err.message || "Network error or server unavailable.");
            } finally {
                setLoading(false);
            }
        };

        fetchLoans();
    }, [navigate, BACKEND_URL]);

    // --- Handle Filter Change ---
    useEffect(() => {
        if (currentFilter === 'all') {
            setFilteredLoans(loans);
        } else {
            setFilteredLoans(loans.filter(loan => loan.status === currentFilter));
        }
    }, [currentFilter, loans]); // Re-filter when filter changes or original loans data changes

    // No need for handleDelete or handleEdit functions as buttons are removed

    if (loading) {
        return <div>Loading loans...</div>;
    }

    if (error) {
        return <div style={{ color: "red" }}>Error: {error}</div>;
    }

    return (
        <div>
            <Link to="/dashboard">
                {"<"} Back to Main Dashboard
            </Link>

            <h1>Loans Overview</h1>

            {/* Overall Loan Summary Section */}
            <div>
                <h2>Loan Summaries by Status</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <button onClick={() => setCurrentFilter('all')} style={{ padding: '10px', cursor: 'pointer' }}>
                        All Loans ({overallSummary.totalLoans})
                    </button>
                    <button onClick={() => setCurrentFilter('active')} style={{ padding: '10px', cursor: 'pointer' }}>
                        Active Loans ({overallSummary.totalActiveLoans})
                    </button>
                    <button onClick={() => setCurrentFilter('paid')} style={{ padding: '10px', cursor: 'pointer' }}>
                        Paid Loans ({overallSummary.totalPaidLoans})
                    </button>
                    <button onClick={() => setCurrentFilter('overdue')} style={{ padding: '10px', cursor: 'pointer' }}>
                        Overdue Loans ({overallSummary.totalOverdueLoans})
                    </button>
                    <button onClick={() => setCurrentFilter('pending')} style={{ padding: '10px', cursor: 'pointer' }}>
                        Pending Loans ({overallSummary.totalPendingLoans})
                    </button>
                    <button onClick={() => setCurrentFilter('default')} style={{ padding: '10px', cursor: 'pointer' }}>
                        Default Loans ({overallSummary.totalDefaultLoans})
                    </button>
                </div>
            </div>

            {/* Action Buttons (Add New Loan) */}
            <div>
                <Link to="/loans/add">
                    <button>Add New Loan</button>
                </Link>
            </div>

            {/* Detailed Loans List Section */}
            <div>
                <h2>{currentFilter === 'all' ? 'All Loans' : `${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)} Loans`} List</h2>
                {filteredLoans.length === 0 ? (
                    <p>No {currentFilter === 'all' ? '' : currentFilter} loans found. Add a new loan!</p>
                ) : (
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Loan ID</th>
                                    <th>Customer Name</th>
                                    <th>Loan Amount (ZMW)</th>
                                    <th>Start Date</th> {/* Changed from Loan Date */}
                                    <th>Due Date</th>
                                    <th>Interest Rate (%)</th>
                                    <th>Status</th>
                                    <th>Balance Due (ZMW)</th>
                                    <th>Actions</th> {/* Still present for View Details */}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLoans.map((loan) => (
                                    <tr key={loan._id}>
                                        <td>{loan._id.substring(0, 8)}...</td>
                                        <td>{loan.customerName || 'N/A'}</td>
                                        <td>ZMW{loan.loanAmount.toFixed(2)}</td>
                                        <td>{loan.startDate}</td> {/* Use startDate */}
                                        <td>{loan.dueDate}</td>
                                        <td>{loan.interestRate}%</td>
                                        <td>{loan.status}</td>
                                        <td>ZMW{loan.balanceDue.toFixed(2)}</td>
                                        <td>
                                            <Link to={`/loans/${loan._id}`}>
                                                View Details
                                            </Link>
                                            {/* Edit and Delete buttons removed as per request */}
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

export default LoansDashboard;