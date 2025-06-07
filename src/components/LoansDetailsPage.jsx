import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils.js'; // Added .js extension
import RecordPaymentModal from '../components/RecordPaymentModal.jsx'; // Added .jsx extension
import './LoansDetailsPage.css'; // Added .css extension
import { toast } from 'react-toastify'; // Import toast for notifications

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
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // Helper function to fetch all loan details and payments
    const fetchLoanAndPayments = async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            console.error('LoanDetailsPage: No authentication token found. Redirecting to login.');
            clearAuthData();
            navigate('/');
            return;
        }

        try {
            // Fetch loan details
            const loanResponse = await fetch(`${BACKEND_URL}/api/loans/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
            });
            const loanData = await loanResponse.json();

            if (!loanResponse.ok) {
                throw new Error(loanData.message || 'Failed to fetch loan details.');
            }

            // Check if client data is present and valid after population
            if (!loanData.client || !loanData.client._id) {
                throw new Error('client details not found for this loan. It might have been deleted.');
            }

            setLoan(loanData);

            // Fetch payments for this loan
            const paymentsResponse = await fetch(`${BACKEND_URL}/api/payments/loan/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
            });
            const paymentsData = await paymentsResponse.json();

            if (!paymentsResponse.ok) {
                throw new Error(paymentsData.message || 'Failed to fetch payments for this loan.');
            }
            setPayments(paymentsData);

            // Determine if loan can be renewed (e.g., if it's paid or defaulted and no other active loans for client)
            // This logic will need to be refined based on your specific renewal rules
            // For now, let's assume it can be renewed if the loan is 'paid' or 'default' and the client has no other active loans
            const clientLoansResponse = await fetch(`${BACKEND_URL}/api/clients/${loanData.client._id}?loanStatus=active`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
            });
            const clientLoansData = await clientLoansResponse.json();

            // Check if there are other active loans for this client, excluding the current loan if it's active.
            // A loan can be renewed if it's paid/defaulted AND the client has no other active loans.
            const hasOtherActiveLoans = clientLoansData.loans.filter(
                (l) => l.status === 'active' && l._id !== loanData._id
            ).length > 0;

            const currentLoanEligibleForRenewal = (loanData.status === 'paid' || loanData.status === 'default');

            setCanRenew(currentLoanEligibleForRenewal && !hasOtherActiveLoans);

        } catch (err) {
            console.error('LoanDetailsPage: Error in fetchLoanAndPayments:', err);
            setError(err.message);
            toast.error(`Failed to load loan details: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoanAndPayments();
    }, [id, BACKEND_URL, navigate]); // Depend on 'id' to refetch when URL param changes

    // Callback for when a payment is recorded successfully
    const handlePaymentRecorded = () => {
        toast.success("Payment recorded successfully!");
        setShowRecordPaymentModal(false); // Close the modal
        fetchLoanAndPayments(); // Re-fetch loan and payments data to update UI
    };

    const handleDeleteLoan = async () => {
        if (!window.confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
            return;
        }

        const token = getToken();
        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/loans/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete loan.');
            }

            toast.success('Loan deleted successfully!');
            navigate('/loans'); // Redirect to loans list after deletion
        } catch (err) {
            console.error('Error deleting loan:', err);
            toast.error(`Error deleting loan: ${err.message}`);
            setLoading(false);
        }
    };

    const handleRenewLoan = async () => {
        if (!canRenew) {
            toast.info("This loan cannot be renewed under current conditions (e.g., outstanding balance or other active loans).");
            return;
        }

        if (!window.confirm('Are you sure you want to renew this loan? This will create a new loan for the client.')) {
            return;
        }

        setLoading(true);
        const token = getToken();

        try {
            // Fetch the client's current details and the loan's last details to pre-fill new loan
            const currentLoanDetails = await (await fetch(`${BACKEND_URL}/api/loans/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            })).json();

            const newLoanData = {
                client: currentLoanDetails.client._id, // Assuming client is populated
                loanAmount: currentLoanDetails.loanAmount, // Example: renew with same amount
                interestRate: currentLoanDetails.interestRate,
                loanTerm: currentLoanDetails.loanTerm,
                termUnit: currentLoanDetails.termUnit,
                startDate: new Date().toISOString().split('T')[0], // New start date
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + currentLoanDetails.loanTerm)).toISOString().split('T')[0], // Example new due date
                paymentsMade: 0,
                balanceDue: currentLoanDetails.totalRepaymentAmount, // Start with full repayment amount
                totalRepaymentAmount: currentLoanDetails.totalRepaymentAmount,
                status: 'pending', // New loan starts as pending
                description: `Renewal of Loan ID: ${currentLoanDetails._id}`,
                collateralType: currentLoanDetails.collateralType,
                collateralValue: currentLoanDetails.collateralValue,
                collateralDescription: currentLoanDetails.collateralDescription,
            };

            const response = await fetch(`${BACKEND_URL}/api/loans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newLoanData),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to renew loan.');
            }

            toast.success('Loan renewed successfully! New loan created.');
            // Optionally, update the old loan's status to 'renewed' or similar if you track that
            // For now, simply navigate to the new loan's details
            navigate(`/loans/${data._id}`);

        } catch (err) {
            console.error('Error renewing loan:', err);
            toast.error(`Error renewing loan: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return <div className="loadingSpinner">Loading loan details...</div>;
    }

    if (error) {
        return <div className="errorContainer">Error: {error}</div>;
    }

    if (!loan) {
        return <div className="noDataContainer">Loan not found or details could not be loaded.</div>;
    }

    // Safely access client details
    const clientName = loan.client?.name || 'N/A';
    const clientEmail = loan.client?.email || 'N/A';
    const clientPhone = loan.client?.phone || 'N/A';
    const clientNrc = loan.client?.nrc || 'N/A';


    return (
        <div className="loanDetailsPageContainer">
            <Link to="/loans" className="loanDetailsBackLink">
                {"<"} Back to Loans List
            </Link>
            <h1 className="loanDetailsHeadline">Loan Details</h1>

            {successMessage && <div className="successMessage">{successMessage}</div>}

            <div className="loanDetailsCard">
                <h2>Loan for {clientName}</h2>
                <div className="loanDetailGrid">
                    <p><strong>Loan ID:</strong> {loan._id}</p>
                    <p><strong>client Email:</strong> {clientEmail}</p>
                    <p><strong>client Phone:</strong> {clientPhone}</p>
                    <p><strong>client NRC:</strong> {clientNrc}</p>
                    <p><strong>Loan Amount:</strong> ZMW {loan.loanAmount.toFixed(2)}</p>
                    <p><strong>Interest Rate:</strong> {loan.interestRate}%</p>
                    <p><strong>Loan Term:</strong> {loan.loanTerm} {loan.termUnit}</p>
                    <p><strong>Start Date:</strong> {new Date(loan.startDate).toLocaleDateString()}</p>
                    <p><strong>Due Date:</strong> {new Date(loan.dueDate).toLocaleDateString()}</p>
                    <p><strong>Total Repayment:</strong> ZMW {loan.totalRepaymentAmount.toFixed(2)}</p>
                    <p><strong>Payments Made:</strong> ZMW {loan.paymentsMade.toFixed(2)}</p>
                    <p className={`balanceDue ${loan.balanceDue > 0 ? 'outstanding' : 'paid'}`}>
                        <strong>Balance Due:</strong> ZMW {loan.balanceDue.toFixed(2)}
                    </p>
                    <p><strong>Status:</strong> <span className={`loanStatusTag ${loan.status}`}>{loan.status}</span></p>
                    <p><strong>Description:</strong> {loan.description || 'N/A'}</p>
                    <p><strong>Collateral Type:</strong> {loan.collateralType || 'N/A'}</p>
                    <p><strong>Collateral Value:</strong> ZMW {loan.collateralValue ? loan.collateralValue.toFixed(2) : '0.00'}</p>
                    <p><strong>Collateral Description:</strong> {loan.collateralDescription || 'N/A'}</p>
                    <p><strong>Recorded At:</strong> {new Date(loan.createdAt).toLocaleString()}</p>
                    <p><strong>Last Updated:</strong> {new Date(loan.updatedAt).toLocaleString()}</p>
                </div>

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
                        title={canRenew ? "Renew this loan" : "Client has an active loan or loan is not yet eligible for renewal."}
                    >
                        Renew Loan
                    </button>
                    <button onClick={handleDeleteLoan} className="deleteLoanBtn">Delete Loan</button>
                </div>
            </div>

            <div className="paymentsSection">
                <h3>Payment History</h3>
                {payments.length === 0 ? (
                    <p className="noPaymentsMessage">No payments recorded for this loan yet.</p>
                ) : (
                    <table className="paymentsTable">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Recorded By</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(payment => (
                                <tr key={payment._id}>
                                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                                    <td>ZMW {payment.amount.toFixed(2)}</td>
                                    <td>{payment.method}</td>
                                    <td><span className={`paymentStatusTag ${payment.status.toLowerCase()}`}>{payment.status}</span></td>
                                    <td>{payment.recordedBy ? payment.recordedBy.username : 'N/A'}</td>
                                    <td>{payment.notes || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Record Payment Modal */}
            {showRecordPaymentModal && (
                <RecordPaymentModal
                    loanId={loan._id}
                    clientId={loan.client._id}
                    clientName={loan.client.name}
                    clientPhoneNumber={loan.client.phone} // Pass client's primary phone
                    clientEmail={loan.client.email} // Pass client's email
                    currentBalanceDue={loan.balanceDue}
                    onClose={() => setShowRecordPaymentModal(false)}
                    onPaymentRecorded={handlePaymentRecorded}
                />
            )}
        </div>
    );
};

export default LoanDetailsPage;
