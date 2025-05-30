import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils';
import './LoansList.css'; // Ensure this CSS file is present and linked

const LoansList = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // New state variables for totals
    const [totalBalanceDue, setTotalBalanceDue] = useState(0);
    const [totalPaymentsMade, setTotalPaymentsMade] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // --- Fetch Loan Data ---
    const fetchLoanData = async (filterStatus = 'all') => {
        console.log('LoansList: fetchLoanData called with filterStatus:', filterStatus);
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            console.error('LoansList: No authentication token found. Redirecting to login.');
            clearAuthData();
            navigate('/login');
            return;
        }

        let url = `${BACKEND_URL}/api/loans`;
        if (filterStatus && filterStatus !== 'all') {
            url += `?status=${filterStatus}`;
        }
        console.log('LoansList: Fetching loans from URL:', url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                console.error('LoansList: Authentication expired or invalid. Logging out.');
                clearAuthData();
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                console.error('LoansList: Failed to fetch loan data. Server response:', errorData);
                throw new Error(errorData.message || 'Failed to fetch loan data.');
            }

            // Expecting an object with 'loans' and 'totals'
            const data = await response.json();
            console.log('LoansList: Successfully fetched loan data:', data);

            setLoans(data.loans);
            setTotalBalanceDue(data.totals.totalBalanceDue);
            setTotalPaymentsMade(data.totals.totalPaymentsMade);

        } catch (err) {
            console.error("LoansList: Error fetching loan data:", err);
            setError(err.message || "Network error or server unavailable.");
        } finally {
            setLoading(false);
            console.log('LoansList: Loan data fetch finished.');
        }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const statusFromUrl = queryParams.get('status');
        const filterToApply = statusFromUrl || 'all';
        console.log('LoansList: useEffect - statusFromUrl:', statusFromUrl, 'filterToApply:', filterToApply);
        fetchLoanData(filterToApply);

    }, [navigate, BACKEND_URL, location.search]);

    // Helper to format dates nicely
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // --- Handle Payment ---
    const handlePayment = async (loanId, currentBalanceDue) => {
        const paymentInput = prompt(`Enter payment amount (current balance: $${parseFloat(currentBalanceDue).toFixed(2)}):`);
        if (paymentInput === null || paymentInput.trim() === '') {
            alert('Payment cancelled or no amount entered.');
            return;
        }

        const paymentAmount = parseFloat(paymentInput);

        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            alert('Please enter a valid positive number for the payment amount.');
            return;
        }

        if (paymentAmount > currentBalanceDue + 0.01) {
            alert(`Payment amount ($${paymentAmount.toFixed(2)}) cannot significantly exceed the current balance due ($${currentBalanceDue.toFixed(2)}).`);
            return;
        }

        const token = getToken();
        if (!token) {
            alert("Authentication required to process a payment.");
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/loans/${loanId}/pay`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ paymentAmount })
            });

            if (response.ok) {
                alert('Payment processed successfully!');
                const queryParams = new URLSearchParams(location.search);
                const statusFromUrl = queryParams.get('status');
                fetchLoanData(statusFromUrl || 'all');
            } else if (response.status === 401 || response.status === 403) {
                alert("Authentication expired or unauthorized. Please log in again.");
                clearAuthData();
                navigate('/login');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to process payment.');
            }
        } catch (err) {
            console.error("Error processing payment:", err);
            setError(err.message || "Network error or server unavailable during payment.");
        }
    };

    // --- Handle Delete Loan ---
    const handleDelete = async (loanId) => {
        if (window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
            const token = getToken();
            if (!token) {
                alert("Authentication required to delete a loan.");
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/loans/${loanId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                });

                if (response.ok) {
                    alert('Loan deleted successfully!');
                    const queryParams = new URLSearchParams(location.search);
                    const statusFromUrl = queryParams.get('status');
                    fetchLoanData(statusFromUrl || 'all');
                } else if (response.status === 401 || response.status === 403) {
                    alert("Authentication expired or unauthorized. Please log in again.");
                    clearAuthData();
                    navigate('/login');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete loan.');
                }
            } catch (err) {
                console.error("Error deleting loan:", err);
                setError(err.message || "Failed to delete loan.");
            }
        }
    };

    // --- Handle Edit Loan Navigation ---
    const handleEdit = (loanId) => {
        navigate(`/loans/edit/${loanId}`);
    };

    // --- Render Logic ---
    if (loading) {
        return <div className="loans-list-loading">Loading loans...</div>;
    }

    if (error) {
        return <div className="loans-list-error" style={{ color: "red" }}>Error: {error}</div>;
    }

    const queryParams = new URLSearchParams(location.search);
    const statusFromUrl = queryParams.get('status');
    const pageTitle = statusFromUrl ? `${statusFromUrl.charAt(0).toUpperCase() + statusFromUrl.slice(1)} Loans` : 'All Loans';

    return (
        <div className="loans-list-container">
            <Link to="/loans" className="back-to-loans-dashboard-btn">
                {"<"} Back to Loans Dashboard
            </Link>
            <h1>{pageTitle}</h1>

            {/* Display Totals */}
            <div className="loan-totals-summary">
                <p><strong>Total Balance Due:</strong> ${totalBalanceDue.toFixed(2)}</p>
                <p><strong>Total Payments Made:</strong> ${totalPaymentsMade.toFixed(2)}</p>
            </div>

            {loans.length === 0 ? (
                <p className="no-loans-message">No {statusFromUrl && statusFromUrl !== 'all' ? statusFromUrl : ''} loans found. Why not add a new loan?</p>
            ) : (
                <div className="table-responsive">
                    <table className="loans-table">
                        <thead>
                            <tr>
                                <th>Loan ID</th>
                                <th>Client Name</th>
                                <th>Client Email</th>
                                <th>Amount</th>
                                <th>Balance Due</th>
                                <th>Payments Made</th>
                                <th>Interest Rate</th>
                                <th>Term</th>
                                <th>Start Date</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map((loan) => (
                                <tr key={loan._id}>
                                    <td>{loan._id.substring(0, 8)}...</td>
                                    <td>{loan.customer ? loan.customer.name : 'N/A'}</td>
                                    <td>{loan.customer ? loan.customer.email : 'N/A'}</td>
                                    <td>${loan.loanAmount ? parseFloat(loan.loanAmount).toFixed(2) : '0.00'}</td>
                                    <td className="balance-due-cell">
                                        ${loan.balanceDue ? parseFloat(loan.balanceDue).toFixed(2) : '0.00'}
                                    </td>
                                    <td>${loan.paymentsMade ? parseFloat(loan.paymentsMade).toFixed(2) : '0.00'}</td>
                                    <td>{loan.interestRate}%</td>
                                    <td>{loan.loanTerm} {loan.termUnit}</td>
                                    <td>{formatDate(loan.startDate)}</td>
                                    <td>{formatDate(loan.dueDate)}</td>
                                    <td>
                                        <span className={`loan-status ${loan.status.toLowerCase()}`}>
                                            {loan.status}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        {loan.status !== 'paid' && loan.balanceDue > 0 && (
                                            <button
                                                onClick={() => handlePayment(loan._id, loan.balanceDue)}
                                                className="make-payment-btn"
                                            >
                                                Pay
                                            </button>
                                        )}
                                        <button onClick={() => handleEdit(loan._id)} className="edit-loan-btn">Edit</button>
                                        <button onClick={() => handleDelete(loan._id)} className="delete-loan-btn">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Link to="/loans/add" className="add-new-loan-btn-link">
                <button className="add-new-loan-btn">Add New Loan</button>
            </Link>
        </div>
    );
};

export default LoansList;