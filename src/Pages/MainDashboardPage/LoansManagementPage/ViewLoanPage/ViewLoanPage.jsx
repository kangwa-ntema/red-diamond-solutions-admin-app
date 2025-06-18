import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import RecordPaymentModal from "../../ClientManagementPage/RecordPaymentModal/RecordPaymentModal.jsx";
import "./ViewLoanPage.css";
import { toast } from "react-toastify";

// Import the specific API functions from your api.js file
import {
  getLoanById,
  getPaymentsByLoanId, // Assuming you'll add this to api.js as getPaymentsByLoanId
  getClientById, // You have getClientById, which fetches client details including loan summary
  deleteLoan,
  addLoan, // For renewing/creating a new loan
} from "../../../../services/api.js"; // Adjust the path if your api.js is elsewhere

const ViewLoanPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canRenew, setCanRenew] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  // Helper function to dynamically determine the loan's display status text
  const getLoanDisplayStatusText = (loanData) => {
    if (!loanData) return "N/A";

    if (loanData.balanceDue <= 0) {
      return "Paid";
    }

    if (loanData.status === "default") {
      return "Defaulted";
    }

    const now = new Date();
    const dueDate = new Date(loanData.dueDate);
    if (dueDate < now && loanData.balanceDue > 0) {
      return "Overdue";
    }

    return loanData.status;
  };

  // Helper function to determine the CSS class for the loan status
  const getLoanDisplayStatusClass = (loanData) => {
    if (!loanData) return "";

    if (loanData.balanceDue <= 0) {
      return "paid";
    }

    if (loanData.status === "default") {
      return "default";
    }

    const now = new Date();
    const dueDate = new Date(loanData.dueDate);
    if (dueDate < now && loanData.balanceDue > 0) {
      return "overdue";
    }

    return loanData.status;
  };

  // Combined fetch function for loan and payments
  const loadLoanAndPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch loan details using getLoanById from api.js
      const loanData = await getLoanById(id);
      if (!loanData.client || !loanData.client._id) {
        throw new Error(
          "Client details not found for this loan. It might have been deleted."
        );
      }
      setLoan(loanData);

      // Assuming you'll add a function like getPaymentsByLoanId to api.js
      // For now, let's create it explicitly if it's not there, or rename fetchLoanPayments
      // If it's not in api.js, you'll need to add this to api.js:
      // export const getPaymentsByLoanId = async (loanId) => {
      //   try {
      //     const response = await api.get(`/api/payments/loan/${loanId}`);
      //     return response.data;
      //   } catch (error) {
      //     handleApiError(error, "Failed to fetch payments for this loan.");
      //   }
      // };
      const paymentsResponse = await fetch(`/api/payments/loan/${id}`); // Fallback if not added to api.js yet
      const paymentsData = await paymentsResponse.json(); // For the direct fetch fallback
      setPayments(paymentsData);

      // Determine renewal eligibility using getClientById from api.js
      const clientSummaryData = await getClientById(loanData.client._id);
      const clientLoanSummaryForRenewal = clientSummaryData.clientLoanSummary; // Assuming this structure

      const currentLoanEligibleForRenewal =
        loanData.status === "paid" || loanData.status === "default";

      const outstandingLoanStatuses = ["active", "overdue", "default"];
      const totalOutstandingClientLoans =
        clientLoanSummaryForRenewal.activeLoans +
        clientLoanSummaryForRenewal.overdueLoans +
        clientLoanSummaryForRenewal.defaultedLoans;

      let hasOtherOutstandingLoans = false;
      if (outstandingLoanStatuses.includes(loanData.status)) {
        hasOtherOutstandingLoans = totalOutstandingClientLoans > 1;
      } else {
        hasOtherOutstandingLoans = totalOutstandingClientLoans > 0;
      }

      setCanRenew(currentLoanEligibleForRenewal && !hasOtherOutstandingLoans);
    } catch (err) {
      console.error("LoanDetailsPage: Error loading data:", err);
      setError(err.message);
      toast.error(`Failed to load loan details: ${err.message}`);
      // The Axios interceptor in api.js should handle 401 redirects,
      // but if an error bypasses it or is caught before it, we might navigate here.
      // However, with httpOnly cookies, `clearAuthData` is less relevant on the client side for actual cookie removal.
      // The interceptor's `toast.error` and an AuthContext reacting to `verifyToken` failure is usually sufficient.
      // If `getToken` was used here, it would be for a client-side stored token, which we're moving away from.
    } finally {
      setLoading(false);
    }
  }, [id, navigate]); // Removed BACKEND_URL and getToken as they are now handled by api.js

  useEffect(() => {
    loadLoanAndPayments();
  }, [loadLoanAndPayments]);

  // Callback for when a payment is recorded successfully
  const handlePaymentRecorded = () => {
    toast.success("Payment recorded successfully!");
    setShowRecordPaymentModal(false); // Close the modal
    loadLoanAndPayments(); // Re-fetch loan and payments data to update UI
  };

  const handleDeleteLoan = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this loan? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await deleteLoan(id); // Use deleteLoan from api.js
      toast.success("Loan deleted successfully!");
      navigate("/loans"); // Redirect to loans list after deletion
    } catch (err) {
      console.error("Error deleting loan:", err);
      toast.error(`Error deleting loan: ${err.message}`);
      setLoading(false);
    }
  };

  const handleRenewLoan = async () => {
    if (!canRenew) {
      toast.info(
        "This loan cannot be renewed under current conditions (e.g., outstanding balance or other active loans)."
      );
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to renew this loan? This will create a new loan for the client."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      // Fetch the client's current details and the loan's last details to pre-fill new loan
      const currentLoanDetails = await getLoanById(id); // Use getLoanById from api.js

      // Ensure the loan data is valid before proceeding
      if (
        !currentLoanDetails ||
        !currentLoanDetails.client ||
        !currentLoanDetails.client._id
      ) {
        throw new Error(
          "Could not retrieve current loan or client details for renewal."
        );
      }

      const newLoanData = {
        client: currentLoanDetails.client._id, // Assuming client is populated
        loanAmount: currentLoanDetails.loanAmount, // Example: renew with same amount
        interestRate: currentLoanDetails.interestRate,
        loanTerm: currentLoanDetails.loanTerm,
        termUnit: currentLoanDetails.termUnit,
        startDate: new Date().toISOString().split("T")[0], // New start date
        // Calculate due date based on current date + loan term
        dueDate: new Date(
          new Date().setMonth(
            new Date().getMonth() + currentLoanDetails.loanTerm
          )
        )
          .toISOString()
          .split("T")[0],
        paymentsMade: 0,
        balanceDue: (
          parseFloat(currentLoanDetails.loanAmount) *
          (1 + parseFloat(currentLoanDetails.interestRate) / 100) *
          parseFloat(currentLoanDetails.loanTerm)
        ).toFixed(2), // Calculate initial balance for new loan
        totalRepaymentAmount: (
          parseFloat(currentLoanDetails.loanAmount) *
          (1 + parseFloat(currentLoanDetails.interestRate) / 100) *
          parseFloat(currentLoanDetails.loanTerm)
        ).toFixed(2),
        status: "pending", // New loan starts as pending
        description: `Renewal of Loan ID: ${currentLoanDetails._id}`,
        collateralType: currentLoanDetails.collateralType,
        collateralValue: currentLoanDetails.collateralValue,
        collateralDescription: currentLoanDetails.collateralDescription,
      };

      const data = await addLoan(newLoanData); // Use addLoan from api.js

      toast.success("Loan renewed successfully! New loan created.");
      navigate(`/loans/${data._id}`);
    } catch (err) {
      console.error("Error renewing loan:", err);
      toast.error(`Error renewing loan: ${err.message}`);
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
    return (
      <div className="noDataContainer">
        Loan not found or details could not be loaded.
      </div>
    );
  }

  // Safely access client details
  const clientName = loan.client?.name || "N/A";
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
              <span className="loanDetailValue">
                {new Date(loan.startDate).toLocaleDateString()}
              </span>{" "}
            </div>
            <div className="loanDetailItem">
              <span className="loanDetailLabel"> Due Date: {" "}</span>
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
            disabled={loan.balanceDue <= 0 || loan.status === "default"}
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
            title={
              canRenew
                ? "Renew this loan"
                : "Client has an outstanding loan or loan is not yet eligible for renewal (must be Paid or Defaulted)."
            }
          >
            Renew Loan
          </button>
          <button onClick={handleDeleteLoan} className="deleteLoanBtn">
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
          clientName={loan.client.name}
          clientPhoneNumber={loan.client.phone}
          clientEmail={loan.client.email}
          currentBalanceDue={loan.balanceDue}
          onClose={() => setShowRecordPaymentModal(false)}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
};

export default ViewLoanPage;