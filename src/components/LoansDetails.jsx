import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils'; // Assuming authUtils.js exists

const LoanDetailsPage = () => {
    const { id } = useParams(); // Get the loan ID from the URL (e.g., /loans/:id)
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchLoanDetails = async () => {
            setLoading(true);
            setError(null);
            const token = getToken();

            if (!token) {
                console.error('LoanDetailsPage: No authentication token found. Redirecting to login.');
                clearAuthData();
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/loans/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include', // Important for sending cookies/auth headers
                });

                if (response.status === 401 || response.status === 403) {
                    console.error('LoanDetailsPage: Authentication expired or invalid. Logging out.');
                    clearAuthData();
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch loan details.');
                }

                const data = await response.json();
                setLoan(data); // Set the fetched loan data to state
            } catch (err) {
                console.error("LoanDetailsPage: Error fetching loan details:", err);
                setError(err.message || "Network error or server unavailable.");
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if an ID is present in the URL
        if (id) {
            fetchLoanDetails();
        }
    }, [id, navigate, BACKEND_URL]); // Dependencies: re-fetch if ID changes, or if navigate/BACKEND_URL change (unlikely)

    // --- Handle Delete Loan ---
    const handleDeleteLoan = async () => {
        if (window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
            const token = getToken();
            if (!token) {
                // Using alert for immediate feedback, consider a custom modal for better UX
                alert("Authentication required to delete this loan.");
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/loans/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                });

                if (response.ok) {
                    alert('Loan deleted successfully!'); // Using alert for immediate feedback
                    navigate('/loans'); // Redirect to the loans overview page
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
                alert(`Error: ${err.message || "Failed to delete loan."}`); // Provide user feedback
            }
        }
    };


    // --- Render Logic ---
    if (loading) {
        return <div>Loading loan details...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    // If loan is null after loading and no error, it means it wasn't found
    if (!loan) {
        return <div>Loan not found.</div>;
    }

    return (
        <div>
            <Link to="/loans">
                {"<"} Back to Loans Overview
            </Link>

            <h1>Loan Details: {loan.customer ? loan.customer.name : 'N/A'}</h1>

            {/* Loan Information Section */}
            <div>
                <h2>Loan Information</h2>
                <p><strong>Loan ID:</strong> {loan._id}</p>
                <p><strong>Customer Name:</strong> {loan.customer ? loan.customer.name : 'N/A'}</p>
                <p><strong>Customer Email:</strong> {loan.customer ? loan.customer.email : 'N/A'}</p>
                <p><strong>Customer Phone:</strong> {loan.customer ? (loan.customer.phone || 'N/A') : 'N/A'}</p>
                <p><strong>Loan Amount:</strong> ZMW{loan.loanAmount ? loan.loanAmount.toFixed(2) : '0.00'}</p>
                <p><strong>Interest Rate:</strong> {loan.interestRate ? loan.interestRate : '0'}%</p>
                <p><strong>Loan Term:</strong> {loan.loanTerm} {loan.termUnit}</p>
                <p><strong>Start Date:</strong> {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Due Date:</strong> {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Payments Made:</strong> ZMW{loan.paymentsMade ? loan.paymentsMade.toFixed(2) : '0.00'}</p>
                <p><strong>Balance Due:</strong> ZMW{loan.balanceDue ? loan.balanceDue.toFixed(2) : '0.00'}</p>
                <p><strong>Total Repayment Amount:</strong> ZMW{loan.totalRepaymentAmount ? loan.totalRepaymentAmount.toFixed(2) : '0.00'}</p>
                <p><strong>Status:</strong> {loan.status || 'N/A'}</p>
                {loan.description && <p><strong>Description:</strong> {loan.description}</p>}
            </div>

            {/* Collateral Details Section - Only render if any collateral info exists */}
            {(loan.collateralType || loan.collateralValue > 0 || loan.collateralDescription) && (
                <div>
                    <h2>Collateral Information</h2>
                    {loan.collateralType && <p><strong>Type:</strong> {loan.collateralType}</p>}
                    {loan.collateralValue > 0 && <p><strong>Estimated Value:</strong> ZMW{loan.collateralValue.toFixed(2)}</p>}
                    {loan.collateralDescription && <p><strong>Description:</strong> {loan.collateralDescription}</p>}
                </div>
            )}

            {/* Actions for this specific loan */}
            <div>
                <Link to={`/loans/edit/${loan._id}`}>
                    <button>Edit Loan</button>
                </Link>
                <button onClick={handleDeleteLoan} style={{ marginLeft: '10px' }}>Delete Loan</button>
            </div>
        </div>
    );
};

export default LoanDetailsPage;
