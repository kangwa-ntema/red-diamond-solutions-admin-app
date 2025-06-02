import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils';
import './LoansDetailsPage.css';

const LoanDetailsPage = () => {
    const { id } = useParams();
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [canRenew, setCanRenew] = useState(false); // New state for conditional renew button
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
                // Fetch both loan details and customers without active loans concurrently
                const [loanResponse, customersResponse] = await Promise.all([
                    fetch(`${BACKEND_URL}/api/loans/${id}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` },
                        credentials: 'include',
                    }),
                    fetch(`${BACKEND_URL}/api/customers?status=no_active_loan`, { // Fetch customers who don't have active loans
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` },
                        credentials: 'include',
                    })
                ]);

                // Handle loan response
                if (loanResponse.status === 401 || loanResponse.status === 403) {
                    clearAuthData();
                    navigate('/login');
                    return;
                }
                if (!loanResponse.ok) {
                    const errorData = await loanResponse.json();
                    throw new Error(errorData.message || 'Failed to fetch loan details.');
                }
                const loanData = await loanResponse.json();
                setLoan(loanData);

                // Handle customers response
                if (customersResponse.status === 401 || customersResponse.status === 403) {
                    clearAuthData();
                    navigate('/login');
                    return;
                }
                if (!customersResponse.ok) {
                    const errorData = await customersResponse.json();
                    throw new Error(errorData.message || 'Failed to fetch customer list for renewal check.');
                }
                const allCustomersData = await customersResponse.json();
                const availableCustomers = allCustomersData.customers; // This list contains customers WITHOUT active loans

                // Determine if the current loan's customer can renew
                // The customer can renew if their ID is found in the list of available customers (i.e., they have no active loans)
                const customerId = loanData.customer?._id;
                const customerHasNoActiveLoan = availableCustomers.some(c => c._id === customerId);
                setCanRenew(customerHasNoActiveLoan);

            } catch (err) {
                console.error("LoanDetailsPage: Error in fetchLoanDetails:", err);
                setError(err.message || "Network error or server unavailable.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchLoanDetails();
        }
    }, [id, navigate, BACKEND_URL]);

    // --- Handle Delete Loan ---
    const handleDeleteLoan = async () => {
        // IMPORTANT: Replace window.confirm with a custom modal component for better UX
        if (window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
            const token = getToken();
            if (!token) {
                alert("Authentication required to delete this loan."); // Placeholder for custom modal
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
                    alert('Loan deleted successfully!'); // Placeholder for custom modal
                    navigate('/loans');
                } else if (response.status === 401 || response.status === 403) {
                    alert("Authentication expired or unauthorized. Please log in again."); // Placeholder
                    clearAuthData();
                    navigate('/login');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete loan.');
                }
            } catch (err) {
                console.error("Error deleting loan:", err);
                setError(err.message || "Failed to delete loan.");
                alert(`Error: ${err.message || "Failed to delete loan."}`); // Placeholder
            }
        }
    };

    // --- Handle Renew Loan ---
    const handleRenewLoan = () => {
        // IMPORTANT: Replace window.confirm with a custom modal component for better UX
        if (window.confirm('Are you sure you want to renew this loan? This will create a new loan based on current details with today\'s date.')) {
            if (!loan) {
                setError("No loan data available to renew.");
                return;
            }

            const today = new Date().toISOString().split('T')[0]; // Get today's date in ISO-MM-DD format

            // Prepare loan data for renewal
            const loanDataToRenew = {
                customer: loan.customer ? loan.customer._id : '', // Ensure customer is just the ID
                loanAmount: loan.loanAmount,
                interestRate: loan.interestRate,
                loanTerm: loan.loanTerm,
                termUnit: loan.termUnit,
                startDate: today, // Set start date to today
                paymentsMade: 0, // Reset payments made for a new loan
                balanceDue: '', // Will be recalculated on AddLoanPage
                totalRepaymentAmount: '', // Will be recalculated on AddLoanPage
                interestAmount: '', // Will be recalculated on AddLoanPage
                status: 'pending', // New loan starts as pending
                description: `Renewal of Loan ID: ${loan._id} - ${loan.description || ''}`.trim(),
                collateralType: loan.collateralType,
                collateralValue: loan.collateralValue,
                collateralDescription: loan.collateralDescription
            };

            // Navigate to the Add Loan page, passing the pre-populated data as state
            navigate('/loans/add', { state: { loanDataToRenew } });
        }
    };


    // --- Render Logic ---
    if (loading) {
        return <div className="loanDetailsPageContainer loanDetailsLoading">Loading loan details...</div>;
    }

    if (error && !successMessage) {
        return <div className="loanDetailsPageContainer loanDetailsError">Error: {error}</div>;
    }

    if (!loan) {
        return <div className="loanDetailsPageContainer loanDetailsNotFound">Loan not found.</div>;
    }

    return (
        <div className="loanDetailsPageContainer">
            <div className="loanDetailsPageContent">
                <Link to="/loans" className="loanDetailsBackLink">
                    {"<"} Back to Loans Overview
                </Link>

                <h1 className="loanDetailsHeadline">Loan Details: {loan.customer ? loan.customer.name : 'N/A'}</h1>

                {successMessage && <div className="loanDetailsSuccessMessage">{successMessage}</div>}
                {error && <div className="loanDetailsErrorMessage">{error}</div>}

                {/* Loan Information Section */}
                <section className="loanInfoSection">
                    <h2 className="loanInfoHeadline">Loan Information</h2>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Loan ID:</strong> {loan._id}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Customer Name:</strong> {loan.customer ? loan.customer.name : 'N/A'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Customer Email:</strong> {loan.customer ? loan.customer.email : 'N/A'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Customer Phone:</strong> {loan.customer ? (loan.customer.phone || 'N/A') : 'N/A'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Loan Amount:</strong> ZMW{loan.loanAmount ? parseFloat(loan.loanAmount).toFixed(2) : '0.00'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Interest Rate:</strong> {loan.interestRate ? parseFloat(loan.interestRate).toFixed(2) : '0'}%</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Interest Amount:</strong> ZMW{loan.interestAmount ? parseFloat(loan.interestAmount).toFixed(2) : '0.00'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Loan Term:</strong> {loan.loanTerm} {loan.termUnit}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Start Date:</strong> {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : 'N/A'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Due Date:</strong> {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Payments Made:</strong> ZMW{loan.paymentsMade ? parseFloat(loan.paymentsMade).toFixed(2) : '0.00'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Balance Due:</strong> ZMW{loan.balanceDue ? parseFloat(loan.balanceDue).toFixed(2) : '0.00'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Total Repayment Amount:</strong> ZMW{loan.totalRepaymentAmount ? parseFloat(loan.totalRepaymentAmount).toFixed(2) : '0.00'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Status:</strong> <span className={`loanStatus-${loan.status.toLowerCase()}`}>{loan.status || 'N/A'}</span></p>
                    {loan.description && <p className="loanDetailItem"><strong className="loanDetailLabel">Description:</strong> {loan.description}</p>}
                </section>

                {/* Collateral Details Section - Only render if any collateral info exists */}
                {(loan.collateralType || (loan.collateralValue && loan.collateralValue > 0) || loan.collateralDescription) && (
                    <section className="collateralInfoSection">
                        <h2 className="collateralInfoHeadline">Collateral Information</h2>
                        {loan.collateralType && <p className="loanDetailItem"><strong className="loanDetailLabel">Type:</strong> {loan.collateralType}</p>}
                        {(loan.collateralValue && loan.collateralValue > 0) && <p className="loanDetailItem"><strong className="loanDetailLabel">Estimated Value:</strong> ZMW{parseFloat(loan.collateralValue).toFixed(2)}</p>}
                        {loan.collateralDescription && <p className="loanDetailItem"><strong className="loanDetailLabel">Description:</strong> {loan.collateralDescription}</p>}
                    </section>
                )}

                {/* Actions for this specific loan */}
                <div className="loanActions">
                    <Link to={`/loans/edit/${loan._id}`}>
                        <button className="editLoanBtn">Edit Loan</button>
                    </Link>
                    {/* Renew Loan button is now conditionally disabled */}
                    <button
                        onClick={handleRenewLoan}
                        className="renewLoanBtn"
                        disabled={!canRenew} // Disable if customer has an active loan
                        title={canRenew ? "Renew this loan" : "Client has an active loan and cannot be renewed."} // Add a tooltip
                    >
                        Renew Loan
                    </button>
                    <button onClick={handleDeleteLoan} className="deleteLoanBtn">Delete Loan</button>
                </div>
            </div>
        </div>
    );
};

export default LoanDetailsPage;
