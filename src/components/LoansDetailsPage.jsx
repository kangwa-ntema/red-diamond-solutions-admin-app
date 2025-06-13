import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../utils/authUtils.js"; // Added .js extension
import RecordPaymentModal from "../components/RecordPaymentModal.jsx"; // Added .jsx extension
import "./LoansDetailsPage.css"; // Added .css extension
import { toast } from "react-toastify"; // Import toast for notifications

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

  // Helper function to dynamically determine the loan's display status text
  const getLoanDisplayStatusText = (loanData) => {
    if (!loanData) return "N/A";

    // 1. Prioritize Paid if balance is zero or less
    if (loanData.balanceDue <= 0) {
      return "Paid";
    }

    // 2. Prioritize Default if explicitly marked by backend
    if (loanData.status === "default") {
      return "Defaulted";
    }

    // 3. Determine Overdue based on due date and outstanding balance
    const now = new Date();
    const dueDate = new Date(loanData.dueDate);
    if (dueDate < now && loanData.balanceDue > 0) {
      return "Overdue";
    }

    // 4. Otherwise, use the status provided by the backend (e.g., active, pending)
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

    return loanData.status; // Use backend status for active/pending
  };

  // Helper function to fetch all loan details and payments
  const fetchLoanAndPayments = async () => {
    setLoading(true);
    setError(null);
    const token = getToken();

    if (!token) {
      console.error(
        "LoanDetailsPage: No authentication token found. Redirecting to login."
      );
      clearAuthData();
      navigate("/landingPage");
      return;
    }

    try {
      // Fetch loan details
      const loanResponse = await fetch(`${BACKEND_URL}/api/loans/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      const loanData = await loanResponse.json();

      if (!loanResponse.ok) {
        throw new Error(loanData.message || "Failed to fetch loan details.");
      }

      // Check if client data is present and valid after population
      if (!loanData.client || !loanData.client._id) {
        throw new Error(
          "client details not found for this loan. It might have been deleted."
        );
      }

      setLoan(loanData);

      // Fetch payments for this loan
      const paymentsResponse = await fetch(
        `${BACKEND_URL}/api/payments/loan/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );
      const paymentsData = await paymentsResponse.json();

      if (!paymentsResponse.ok) {
        throw new Error(
          paymentsData.message || "Failed to fetch payments for this loan."
        );
      }
      setPayments(paymentsData);

      // Determine if loan can be renewed:
      // - The current loan must be 'paid' or 'default'.
      // - The client must not have any other 'active', 'overdue', or 'default' loans.
      const clientLoansResponse = await fetch(
        `${BACKEND_URL}/api/clients/${loanData.client._id}?exclude_active_loan_clients=true`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );
      const clientLoansData = await clientLoansResponse.json();

      // The 'exclude_active_loan_clients=true' filter returns clients WITHOUT active/overdue/default loans.
      // If the current client's ID is *not* in this list, it means they *do* have an active/overdue/default loan.
      // So, a client can renew if the current loan is eligible AND they don't have other active loans.
      // The `clientLoansData.clients` array will only contain the current client if they have NO outstanding loans.
      // If the current client is found in this list, it means they are currently eligible for a new loan.

      // To refine the renewal logic for this specific loan details page:
      // The loan can be renewed IF:
      // 1. Its status is 'paid' OR 'default'.
      // 2. The client associated with this loan has no other active, overdue, or defaulted loans.
      //    We can check this by seeing if the `clientLoanSummary` from the client's dashboard API
      //    (which gives full loan summary for the client) shows 0 for active/overdue/default,
      //    OR by using the `exclude_active_loan_clients` param on the client API.

      // Let's re-fetch the full client summary to accurately check for other active loans
      const clientSummaryResponse = await fetch(
        `${BACKEND_URL}/api/clients/${loanData.client._id}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
      const clientSummaryData = await clientSummaryResponse.json();
      const clientLoanSummaryForRenewal = clientSummaryData.clientLoanSummary;

      const currentLoanEligibleForRenewal =
        loanData.status === "paid" || loanData.status === "default";

      // Check if there are any outstanding loans for this client *other than the current one*
      // This is slightly complex because the client summary includes the current loan.
      // A more robust check might be:
      // total active/overdue/default loans for client - (1 if current loan is active/overdue/default) === 0
      const outstandingLoanStatuses = ["active", "overdue", "default"];
      const totalOutstandingClientLoans =
        clientLoanSummaryForRenewal.activeLoans +
        clientLoanSummaryForRenewal.overdueLoans +
        clientLoanSummaryForRenewal.defaultedLoans;

      let hasOtherOutstandingLoans = false;
      if (outstandingLoanStatuses.includes(loanData.status)) {
        // If the current loan is itself outstanding, check if there are other outstanding loans besides this one.
        hasOtherOutstandingLoans = totalOutstandingClientLoans > 1;
      } else {
        // If the current loan is not outstanding (e.g., pending or paid), any outstanding loans means others exist.
        hasOtherOutstandingLoans = totalOutstandingClientLoans > 0;
      }

      setCanRenew(currentLoanEligibleForRenewal && !hasOtherOutstandingLoans);
    } catch (err) {
      console.error("LoanDetailsPage: Error in fetchLoanAndPayments:", err);
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
    if (
      !window.confirm(
        "Are you sure you want to delete this loan? This action cannot be undone."
      )
    ) {
      return;
    }

    const token = getToken();
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/loans/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete loan.");
      }

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
    const token = getToken();

    try {
      // Fetch the client's current details and the loan's last details to pre-fill new loan
      const currentLoanDetails = await (
        await fetch(`${BACKEND_URL}/api/loans/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
      ).json();

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
        dueDate: new Date(
          new Date().setMonth(
            new Date().getMonth() + currentLoanDetails.loanTerm
          )
        )
          .toISOString()
          .split("T")[0], // Example new due date
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

      const response = await fetch(`${BACKEND_URL}/api/loans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newLoanData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to renew loan.");
      }

      toast.success("Loan renewed successfully! New loan created.");
      // Optionally, update the old loan's status to 'renewed' or similar if you track that
      // For now, simply navigate to the new loan's details
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
                <span className="loanDetailLabel"> Loan ID: {"  "}</span>
                <span className="loanDetailValue">{loan._id}</span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Client Email: {"  "}</span>
                <span className="loanDetailValue">{clientEmail}</span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Client Phone: {"  "}</span>
                <span className="loanDetailValue">{clientPhone}</span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Client NRC: {"  "}</span>
                <span className="loanDetailValue">{clientNrc}</span>
              </div>
            </div>
            </div>
            <div className="loanDetailsContentLoan">
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Loan Amount: {"  "}</span>
                <span className="loanDetailValue">
                  ZMW {loan.loanAmount.toFixed(2)}
                </span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Interest Rate: {"  "}</span>
                <span className="loanDetailValue">{loan.interestRate}%</span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Loan Term: {"  "}</span>
                <span className="loanDetailValue">
                  {loan.loanTerm} {loan.termUnit}
                </span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Start Date: {"  "}</span>
                <span className="loanDetailValue">
                  {new Date(loan.startDate).toLocaleDateString()}
                </span>{" "}
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Due Date: {"  "}</span>
                <span className="loanDetailValue">
                  {new Date(loan.dueDate).toLocaleDateString()}
                </span>{" "}
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel">
                  {" "}
                  Total Repayment: {"  "}
                </span>
                <span className="loanDetailValue">
                  ZMW {loan.totalRepaymentAmount.toFixed(2)}
                </span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel"> Payments Made: {"  "}</span>
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
                <span className="loanDetailLabel">Description: {"  "}</span>
                <span className="loanDetailValue">
                  {loan.description || "N/A"}
                </span>
              </div>
            </div>
            <div className="loanDetailsContentCollateral">
              <div className="loanDetailItem">
                <span className="loanDetailLabel">Collateral Type: {"  "}</span>
                <span className="loanDetailValue">
                  {loan.collateralType || "N/A"}
                </span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel">
                  Collateral Value: {"  "}
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
                  Collateral Description: {"  "}
                </span>
                <span className="loanDetailValue">
                  {loan.collateralDescription || "N/A"}
                </span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel">Recorded At: {"  "}</span>
                <span className="loanDetailValue">
                  {new Date(loan.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="loanDetailItem">
                <span className="loanDetailLabel">Last Updated: {"  "}</span>
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
              disabled={loan.balanceDue <= 0 || loan.status === "default"} // Disable if loan is paid or defaulted
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
      {successMessage && <div className="successMessage">{successMessage}</div>}

      {/* Record Payment Modal */}
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

export default LoanDetailsPage;
