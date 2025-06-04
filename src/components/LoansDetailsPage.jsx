import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils.js'; // Added .js extension
import RecordPaymentModal from '../components/RecordPaymentModal.jsx'; // Added .jsx extension
import './LoansDetailsPage.css'; // Added .css extension

const LoanDetailsPage = () => {
    const { id } = useParams();
    const [loan, setLoan] = useState(null);
    const [payments, setPayments] = useState([]); // New state for payments
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [canRenew, setCanRenew] = useState(false);
    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false); // State for modal visibility

    const navigate = useNavigate();
    // Assuming this is a Vite project where import.meta.env is available
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; 

    // Helper function to fetch all loan details and payments
    const fetchLoanAndPayments = async () => {
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
            const [loanResponse, customersResponse, paymentsResponse] = await Promise.all([
                fetch(`${BACKEND_URL}/api/loans/${id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                }),
                fetch(`${BACKEND_URL}/api/customers?status=no_active_loan`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                }),
                fetch(`${BACKEND_URL}/api/payments/loan/${id}`, { // Fetch payments for this loan
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

            // Handle customers response for renew button logic
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
            const availableCustomers = allCustomersData.customers;
            const customerId = loanData.customer?._id;
            const customerHasNoActiveLoan = availableCustomers.some(c => c._id === customerId);
            setCanRenew(customerHasNoActiveLoan);

            // Handle payments response
            if (paymentsResponse.status === 401 || paymentsResponse.status === 403) {
                clearAuthData();
                navigate('/login');
                return;
            }
            if (!paymentsResponse.ok) {
                const errorData = await paymentsResponse.json();
                throw new Error(errorData.message || 'Failed to fetch payment history.');
            }
            const paymentsData = await paymentsResponse.json();
            setPayments(paymentsData);

        } catch (err) {
            console.error("LoanDetailsPage: Error in fetchLoanAndPayments:", err);
            setError(err.message || "Network error or server unavailable.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchLoanAndPayments();
        }
    }, [id, navigate, BACKEND_URL]);

    // --- Handle Delete Loan ---
    const handleDeleteLoan = async () => {
        if (window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
            const token = getToken();
            if (!token) {
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
                    alert('Loan deleted successfully!');
                    navigate('/loans');
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
                alert(`Error: ${err.message || "Failed to delete loan."}`);
            }
        }
    };

    // --- Handle Renew Loan ---
    const handleRenewLoan = () => {
        if (window.confirm('Are you sure you want to renew this loan? This will create a new loan based on current details with today\'s date.')) {
            if (!loan) {
                setError("No loan data available to renew.");
                return;
            }

            const today = new Date().toISOString().split('T')[0];

            const loanDataToRenew = {
                customer: loan.customer ? loan.customer._id : '',
                loanAmount: loan.loanAmount,
                interestRate: loan.interestRate,
                loanTerm: loan.loanTerm,
                termUnit: loan.termUnit,
                startDate: today,
                paymentsMade: 0,
                balanceDue: '',
                totalRepaymentAmount: '',
                interestAmount: '',
                status: 'pending',
                description: `Renewal of Loan ID: ${loan._id} - ${loan.description || ''}`.trim(),
                collateralType: loan.collateralType,
                collateralValue: loan.collateralValue,
                collateralDescription: loan.collateralDescription
            };

            navigate('/loans/add', { state: { loanDataToRenew } });
        }
    };

    // Callback for when a payment is successfully recorded
    const handlePaymentRecorded = () => {
        setShowRecordPaymentModal(false); // Close the modal
        setSuccessMessage('Payment recorded successfully!');
        // Re-fetch loan and payments to update the displayed data
        fetchLoanAndPayments();
        // Clear success message after a delay
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

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
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Start Date:</strong> {loan.startDate ? formatDate(loan.startDate) : 'N/A'}</p>
                    <p className="loanDetailItem"><strong className="loanDetailLabel">Due Date:</strong> {loan.dueDate ? formatDate(loan.dueDate) : 'N/A'}</p>
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

                {/* Payments History Section */}
                <section className="paymentsHistorySection">
                    <h2 className="paymentsHistoryHeadline">Payment History</h2>
                    {payments.length === 0 ? (
                        <p className="noPaymentsMessage">No payments recorded for this loan yet.</p>
                    ) : (
                        <div className="paymentsTableContainer">
                            <table className="paymentsTable">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Amount (ZMW)</th>
                                        <th>Method</th>
                                        <th>Recorded By</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map(payment => (
                                        <tr key={payment._id}>
                                            <td>{formatDate(payment.date)}</td>
                                            <td>{parseFloat(payment.amount).toFixed(2)}</td>
                                            <td>{payment.method}</td>
                                            <td>{payment.recordedBy ? payment.recordedBy.username : 'N/A'}</td>
                                            <td>{payment.notes || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Actions for this specific loan */}
                <div className="loanActions">
                    <button
                        onClick={() => setShowRecordPaymentModal(true)}
                        className="recordPaymentBtn"
                        disabled={loan.status === 'paid' || loan.status === 'default'} // Disable if loan is paid or defaulted
                    >
                        Record Payment
                    </button>
                    <Link to={`/loans/edit/${loan._id}`}>
                        <button className="editLoanBtn">Edit Loan</button>
                    </Link>
                    <button
                        onClick={handleRenewLoan}
                        className="renewLoanBtn"
                        disabled={!canRenew}
                        title={canRenew ? "Renew this loan" : "Client has an active loan and cannot be renewed."}
                    >
                        Renew Loan
                    </button>
                    <button onClick={handleDeleteLoan} className="deleteLoanBtn">Delete Loan</button>
                </div>
            </div>

            {/* Record Payment Modal */}
            {showRecordPaymentModal && (
                <RecordPaymentModal
                    loanId={loan._id}
                    customerId={loan.customer._id}
                    customerName={loan.customer.name}
                    currentBalanceDue={loan.balanceDue}
                    onClose={() => setShowRecordPaymentModal(false)}
                    onPaymentRecorded={handlePaymentRecorded}
                />
            )}
        </div>
    );
};

export default LoanDetailsPage;
