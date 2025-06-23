// src/Pages/MainDashboardPage/LoansManagementPage/ViewLoanPage/ViewLoanPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import RecordPaymentModal from "../../LoansManagementPage/RecordPaymentModal/RecordPaymentModal";
import "./ViewLoanPage.css";
import { toast } from "react-toastify";

import { getLoanById, deleteLoan, addLoan } from "../../../../services/api/loanApi";
import { getClientById } from "../../../../services/api/clientApi";
import { getPaymentsByLoanId } from "../../../../services/api/paymentApi";

const ViewLoanPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loan, setLoan] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canRenew, setCanRenew] = useState(false);
    const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [modalAction, setModalAction] = useState(null);
    const [modalMessage, setModalMessage] = useState('');

    const getLoanDisplayStatusText = (loanData) => {
        if (!loanData) return "N/A";

        if (loanData.balanceDue <= 0) {
            return "Paid";
        }

        if (loanData.status === "default") {
            return "Defaulted";
        }

        const now = new Date();
        // Ensure dueDate is parsed correctly without appending 'T00:00:00'
        const dueDate = new Date(loanData.dueDate); 
        if (isNaN(dueDate.getTime())) { // Add a check for invalid date parsing
            console.warn("Invalid dueDate for status check:", loanData.dueDate);
            return loanData.status; // Fallback to original status or 'N/A'
        }

        if (dueDate < now && loanData.balanceDue > 0) {
            return "Overdue";
        }

        return loanData.status;
    };

    const getLoanDisplayStatusClass = (loanData) => {
        if (!loanData) return "";

        if (loanData.balanceDue <= 0) {
            return "paid";
        }

        if (loanData.status === "default") {
            return "default";
        }

        const now = new Date();
        // Ensure dueDate is parsed correctly without appending 'T00:00:00'
        const dueDate = new Date(loanData.dueDate);
        if (isNaN(dueDate.getTime())) { // Add a check for invalid date parsing
            return ""; // Fallback to empty class
        }

        if (dueDate < now && loanData.balanceDue > 0) {
            return "overdue";
        }

        return loanData.status;
    };

    const loadLoanAndPayments = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const loanData = await getLoanById(id);
            if (!loanData.client || !loanData.client._id) {
                throw new Error("Client details not found for this loan. It might have been deleted or data is inconsistent.");
            }
            setLoan(loanData);

            const paymentsResponse = await getPaymentsByLoanId(id);
            // Corrected to handle direct array response from backend
            setPayments(paymentsResponse || []); 

            const clientSummaryData = await getClientById(loanData.client._id);
            const clientLoanSummaryForRenewal = clientSummaryData.clientLoanSummary;

            const currentLoanEligibleForRenewal =
                loanData.status === "paid" || loanData.status === "default";

            let hasOtherOutstandingLoans = false;
            if (loanData.status === "active" || loanData.status === "overdue") {
                hasOtherOutstandingLoans = clientLoanSummaryForRenewal.activeLoans + clientLoanSummaryForRenewal.overdueLoans + clientLoanSummaryForRenewal.defaultedLoans > 1;
            } else {
                hasOtherOutstandingLoans = clientLoanSummaryForRenewal.activeLoans + clientLoanSummaryForRenewal.overdueLoans + clientLoanSummaryForRenewal.defaultedLoans > 0;
            }

            setCanRenew(currentLoanEligibleForRenewal && !hasOtherOutstandingLoans);

        } catch (err) {
            console.error("LoanDetailsPage: Error loading data:", err);
            setError(err.message || "Failed to load loan details or payments.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadLoanAndPayments();
        }
    }, [id, loadLoanAndPayments]);

    const handlePaymentRecorded = () => {
        toast.success("Payment recorded successfully!");
        setShowRecordPaymentModal(false);
        loadLoanAndPayments();
    };

    const confirmDeleteAction = () => {
        if (!loan) return;
        setModalAction('deleteLoan');
        setModalMessage(`Are you sure you want to delete this loan for "${loan.client?.firstName} ${loan.client?.lastName}"? This action cannot be undone.`);
        setShowConfirmModal(true);
    };

    const confirmRenewAction = () => {
        if (!canRenew) {
            toast.info(
                "This loan cannot be renewed under current conditions (e.g., outstanding balance or other active loans). Ensure it's Paid or Defaulted and no other active loans exist for this client."
            );
            return;
        }
        if (!loan) return;
        setModalAction('renewLoan');
        setModalMessage(`Are you sure you want to renew this loan for "${loan.client?.firstName} ${loan.client?.lastName}"? This will create a new loan with similar details.`);
        setShowConfirmModal(true);
    };

    const executeConfirmedAction = async () => {
        setShowConfirmModal(false);
        setLoading(true);

        try {
            if (modalAction === 'deleteLoan' && loan) {
                await deleteLoan(id);
                toast.success("Loan deleted successfully!");
                navigate("/loans");
            } else if (modalAction === 'renewLoan' && loan && canRenew) {
                const loanAmount = parseFloat(loan.loanAmount);
                const interestRate = parseFloat(loan.interestRate);
                const loanTerm = parseInt(loan.loanTerm);
                const termUnit = loan.termUnit;

                // Assuming simple interest calculation for renewal. Adjust if more complex.
                // It's crucial that `loan.interestAmount` is correctly calculated on backend
                // or consistently calculated here.
                const newInterestAmount = (loanAmount * (interestRate / 100) * (termUnit === 'months' ? loanTerm : 1));
                const newTotalRepaymentAmount = (loanAmount + parseFloat(newInterestAmount));
                const newBalanceDue = newTotalRepaymentAmount;

                const today = new Date();
                let newDueDateCalc = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                switch (termUnit) {
                    case "days":
                        newDueDateCalc.setDate(today.getDate() + loanTerm);
                        break;
                    case "weeks":
                        newDueDateCalc.setDate(today.getDate() + loanTerm * 7);
                        break;
                    case "months":
                        const originalDayMonth = today.getDate();
                        newDueDateCalc = new Date(today.getFullYear(), today.getMonth() + loanTerm, originalDayMonth);
                        if (newDueDateCalc.getMonth() !== ((today.getMonth() + loanTerm) % 12)) {
                            // If the day rolls over to the next month (e.g., Feb 30th -> Mar 2nd),
                            // set to the last day of the target month.
                            newDueDateCalc = new Date(today.getFullYear(), today.getMonth() + loanTerm + 1, 0);
                        }
                        break;
                    case "years":
                        const originalDayYear = today.getDate();
                        const originalMonthYear = today.getMonth();
                        newDueDateCalc = new Date(today.getFullYear() + loanTerm, originalMonthYear, originalDayYear);
                        if (newDueDateCalc.getMonth() !== originalMonthYear) {
                            // If the day rolls over to the next month (e.g., Feb 29th in leap year to Mar 1st in non-leap year),
                            // set to the last day of the target month.
                            newDueDateCalc = new Date(today.getFullYear() + loanTerm, originalMonthYear + 1, 0);
                        }
                        break;
                    default:
                        break;
                }
                const newDueDate = newDueDateCalc.toISOString().split("T")[0];


                const newLoanData = {
                    client: loan.client._id,
                    loanAmount: loanAmount,
                    interestRate: interestRate,
                    loanTerm: loanTerm,
                    termUnit: termUnit,
                    startDate: new Date().toISOString().split("T")[0],
                    dueDate: newDueDate,
                    paymentsMade: 0,
                    balanceDue: parseFloat(newBalanceDue.toFixed(2)),
                    totalRepaymentAmount: parseFloat(newTotalRepaymentAmount.toFixed(2)),
                    interestAmount: parseFloat(newInterestAmount.toFixed(2)),
                    status: "pending",
                    description: `Renewal of Loan ID: ${loan._id} (previous status: ${loan.status})`,
                    collateralType: loan.collateralType || '',
                    collateralValue: loan.collateralValue === "" ? null : parseFloat(loan.collateralValue),
                    collateralDescription: loan.collateralDescription || '',
                };

                const response = await addLoan(newLoanData);
                toast.success("Loan renewed successfully! New loan created.");
                navigate(`/loans/${response._id}`);
            }
        } catch (err) {
            console.error(`Error performing action (${modalAction}):`, err);
            toast.error(`Failed to complete action: ${err.message || 'Please try again.'}`);
            setError(err.message || 'Action failed due to a network error.');
        } finally {
            setLoading(false);
            setModalAction(null);
        }
    };


    if (loading) {
        return <div className="loadingSpinner">Loading loan details...</div>;
    }

    if (error) {
        return <div className="errorContainer">Error: {error}</div>;
    }

    if (!loan) {
        return (
            <div className="noDataContainer">
                Loan not found or details could not be loaded.
            </div>
        );
    }

    const clientName = `${loan.client?.firstName || ''} ${loan.client?.lastName || ''}`.trim() || "N/A";
    const clientEmail = loan.client?.email || "N/A";
    const clientPhone = loan.client?.phone || "N/A";
    const clientNrc = loan.client?.nrc || "N/A";


    return (
        <div className="loanDetailsPageContainer">
            <Link to="/loans" className="loanDetailsBackLink">
                Back to Loans List
            </Link>
            <h1 className="loanDetailsHeadline">Loan Details</h1>
            <section className="loanDetailsSection">
                <div className="loanDetailsContent">
                    <div className="loanDetailsContentClient">
                        <h2>Loan for {clientName}</h2>
                        <div className="loanDetailGrid">
                            <div className="loanDetailItem">
                                <span className="loanDetailLabel"> Loan ID: {" "}</span>
                                <span className="loanDetailValue">{loan._id}</span>
                            </div>
                            <div className="loanDetailItem">
                                <span className="loanDetailLabel"> Client Email: {" "}</span>
                                <span className="loanDetailValue">{clientEmail}</span>
                            </div>
                            <div className="loanDetailItem">
                                <span className="loanDetailLabel"> Client Phone: {" "}</span>
                                <span className="loanDetailValue">{clientPhone}</span>
                            </div>
                            <div className="loanDetailItem">
                                <span className="loanDetailLabel"> Client NRC: {" "}</span>
                                <span className="loanDetailValue">{clientNrc}</span>
                            </div>
                        </div>
                    </div>
                    <div className="loanDetailsContentLoan">
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel"> Loan Amount: {" "}</span>
                            <span className="loanDetailValue">
                                ZMW {loan.loanAmount.toFixed(2)}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel"> Interest Rate: {" "}</span>
                            <span className="loanDetailValue">{loan.interestRate}%</span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel"> Loan Term: {" "}</span>
                            <span className="loanDetailValue">
                                {loan.loanTerm} {loan.termUnit}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel"> Start Date: {" "}</span>
                            {/* FIX: Removed 'T00:00:00' as backend dates are likely already proper date strings */}
                            <span className="loanDetailValue">
                                {new Date(loan.startDate).toLocaleDateString()} 
                            </span>{" "}
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel"> Due Date: {" "}</span>
                            {/* FIX: Removed 'T00:00:00' as backend dates are likely already proper date strings */}
                            <span className="loanDetailValue">
                                {new Date(loan.dueDate).toLocaleDateString()} 
                            </span>{" "}
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel">
                                {" "}
                                Total Repayment: {" "}
                            </span>
                            <span className="loanDetailValue">
                                ZMW {loan.totalRepaymentAmount.toFixed(2)}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel"> Payments Made: {" "}</span>
                            <span className="loanDetailValue">
                                ZMW {loan.paymentsMade.toFixed(2)}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <p
                                className={`balanceDue ${
                                    loan.balanceDue > 0 ? "outstanding" : "paid"
                                }`}
                            ></p>
                            <span className="loanDetailValue">
                                Balance Due: ZMW {loan.balanceDue.toFixed(2)}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel">Status: </span>
                            <span
                                className={`loanStatusTag ${getLoanDisplayStatusClass(loan)}`}
                            >
                                {getLoanDisplayStatusText(loan)}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel">Description: {" "}</span>
                            <span className="loanDetailValue">
                                {loan.description || "N/A"}
                            </span>
                        </div>
                    </div>
                    <div className="loanDetailsContentCollateral">
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel">Collateral Type: {" "}</span>
                            <span className="loanDetailValue">
                                {loan.collateralType || "N/A"}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel">
                                Collateral Value: {" "}
                            </span>
                            <span className="loanDetailValue">
                                ZMW{" "}
                                {loan.collateralValue
                                    ? loan.collateralValue.toFixed(2)
                                    : "0.00"}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel">
                                Collateral Description: {" "}
                            </span>
                            <span className="loanDetailValue">
                                {loan.collateralDescription || "N/A"}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel">Recorded At: {" "}</span>
                            <span className="loanDetailValue">
                                {new Date(loan.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="loanDetailItem">
                            <span className="loanDetailLabel">Last Updated: {" "}</span>
                            <span className="loanDetailValue">
                                {new Date(loan.updatedAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="loanActions">
                    <button
                        onClick={() => setShowRecordPaymentModal(true)}
                        className="recordPaymentBtn"
                        disabled={loan.balanceDue <= 0 || loan.status === "default" || loading}
                    >
                        Record Payment
                    </button>
                    <Link to={`/loans/edit/${loan._id}`}>
                        <button className="editLoanBtn" disabled={loading}>Edit Loan</button>
                    </Link>
                    {/* NEW BUTTON: Link to Loan Activity Log Page */}
                    <Link to={`/loans/${loan._id}/loan-activity-logs`}>
                        <button className="viewActivityLogBtn" disabled={loading}>View Activity Log</button>
                    </Link>
                    <button
                        onClick={confirmRenewAction}
                        className="renewLoanBtn"
                        disabled={!canRenew || loading}
                        title={
                            canRenew
                                ? "Renew this loan"
                                : "Client has an outstanding loan or loan is not yet eligible for renewal (must be Paid or Defaulted)."
                        }
                    >
                        Renew Loan
                    </button>
                    <button onClick={confirmDeleteAction} className="deleteLoanBtn" disabled={loading}>
                        Delete Loan
                    </button>
                </div>
            </section>

            <div className="paymentsSection">
                <h3>Payment History</h3>
                {payments.length === 0 ? (
                    <p className="noPaymentsMessage">
                        No payments recorded for this loan yet.
                    </p>
                ) : (
                    <div className="paymentTableContainer">
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
                                {payments.map((payment) => (
                                    <tr key={payment._id}>
                                        {/* FIX: Removed 'T00:00:00' for payment date as well */}
                                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                                        <td>ZMW {payment.amount.toFixed(2)}</td>
                                        <td>{payment.method}</td>
                                        <td>
                                            <span
                                                className={`paymentStatusTag ${payment.status.toLowerCase()}`}
                                            >
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td>
                                            {payment.recordedBy ? payment.recordedBy.username : "N/A"}
                                        </td>
                                        <td>{payment.notes || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showRecordPaymentModal && (
                <RecordPaymentModal
                    loanId={loan._id}
                    clientId={loan.client._id}
                    clientName={clientName}
                    clientPhoneNumber={clientPhone}
                    clientEmail={clientEmail}
                    currentBalanceDue={loan.balanceDue}
                    onClose={() => setShowRecordPaymentModal(false)}
                    onPaymentRecorded={handlePaymentRecorded}
                />
            )}

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <h3>Confirm Action</h3>
                        <p>{modalMessage}</p>
                        <div className="modalActions">
                            <button onClick={executeConfirmedAction} className="modalConfirmBtn" disabled={loading}>Confirm</button>
                            <button onClick={() => setShowConfirmModal(false)} className="modalCancelBtn" disabled={loading}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewLoanPage;
