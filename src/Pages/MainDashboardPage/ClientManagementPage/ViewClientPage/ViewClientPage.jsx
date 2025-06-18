import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify"; // Import toast for notifications

// Import API functions from your centralized api.js file
import {
  getClientById, // Assuming this can return client, loans, and summary
  getAllLoans, // To be used if getClientById doesn't return loans/summary directly
  deleteLoan,
  deleteClient,
} from "../../../../services/api";

// You no longer need these from utils/authUtils if using httpOnly cookies via api.js
// import { getToken, clearAuthData } from "../utils/authUtils";

import "./ViewClientPage.css"; // Import the new CSS file
import RecordPaymentModal from "../RecordPaymentModal/RecordPaymentModal"; // Import the RecordPaymentModal

const ViewClientPage = () => {
  const { id: clientId } = useParams();
  const navigate = useNavigate();

  // No longer needed if using centralized API calls with withCredentials
  // const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [client, setClient] = useState(null);
  const [clientLoans, setClientLoans] = useState([]);
  const [clientLoanSummary, setClientLoanSummary] = useState({
    totalLoans: 0,
    totalLoanAmount: 0,
    totalBalanceDue: 0,
    totalPaymentsMade: 0,
    activeLoans: 0,
    pendingLoans: 0,
    defaultedLoans: 0,
    paidLoans: 0,
    overdueLoans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loanFilterStatus, setLoanFilterStatus] = useState("all");

  // State for the RecordPaymentModal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);

  const fetchClientData = useCallback(
    async (filter = "all") => {
      setLoading(true);
      setError(null);

      // No need for getToken() or explicit token checks here.
      // The `api.js` instance handles `withCredentials: true`
      // and backend session management (e.g., httpOnly cookies) handles auth.
      // If the session is invalid, the API call will likely fail,
      // and you'd handle that with a global Axios interceptor if needed,
      // or rely on component-specific error handling and logout.

      try {
        // Fetch client details and (ideally) their loan summary and filtered loans
        // Assuming your getClientById in services/api.js is updated on the backend
        // to return { client, loans, clientLoanSummary }
        const clientData = await getClientById(clientId);

        // If the backend endpoint for getClientById returns loans and summary:
        setClient(clientData.client);
        setClientLoans(clientData.loans); // This would be the loans filtered by the backend if 'filter' is passed
        setClientLoanSummary(clientData.clientLoanSummary);

        // --- ALTERNATIVE if getClientById ONLY returns client details: ---
        // 1. You'd need to fetch loans separately:
        // const clientDetails = await getClientById(clientId);
        // setClient(clientDetails);
        //
        // 2. Then fetch loans specific to this client with the filter:
        // const loanFilters = { clientId: clientId };
        // if (filter !== "all") {
        //   loanFilters.status = filter;
        // }
        // const allClientLoans = await getAllLoans(loanFilters);
        // setClientLoans(allClientLoans.loans); // Assuming getAllLoans returns { loans: [...] }
        //
        // 3. And you'd compute the clientLoanSummary on the frontend or add a new backend endpoint for it.
        // For simplicity, I'm sticking with the assumption that getClientById gets everything.
        // If it doesn't, let me know, and we'll adjust for separate calls and frontend summary calculation.

      } catch (err) {
        console.error("ViewClientPage: Error fetching client data:", err);
        // Error from api.js is already a string message
        setError(err || "Failed to fetch client data.");
        // If authentication failed, redirect to login
        if (err && (err.includes("Authentication expired") || err.includes("unauthorized"))) {
          // You might still want a global redirect if your backend consistently sends specific messages for this
          // Or, ideally, use an Axios response interceptor for universal auth errors.
          navigate("/loginForm"); // Adjust based on your actual login route
          toast.error(err); // Show the toast message
        } else {
          toast.error(err || "Failed to fetch client data.");
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate, clientId] // Removed BACKEND_URL as it's no longer directly used here
  );

  useEffect(() => {
    fetchClientData(loanFilterStatus);
  }, [fetchClientData, loanFilterStatus]);

  const handleLoanEdit = (loanId) => {
    navigate(`/loans/edit/${loanId}`);
  };

  const handleLoanDelete = async (loanId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this loan? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Use the centralized deleteLoan API function
      await deleteLoan(loanId);
      toast.success("Loan deleted successfully!");
      fetchClientData(loanFilterStatus); // Re-fetch data after deletion
    } catch (err) {
      console.error("Error deleting loan:", err);
      setError(err || "Failed to delete loan."); // Error from api.js is already a message
      toast.error(err || "Failed to delete loan.");

      if (err && (err.includes("Authentication expired") || err.includes("unauthorized"))) {
        navigate("/loginForm"); // Adjust based on your actual login route
      }
    }
  };

  const handleClientDelete = async () => {
    const hasOutstandingLoans =
      clientLoanSummary.activeLoans > 0 ||
      clientLoanSummary.overdueLoans > 0 ||
      clientLoanSummary.defaultedLoans > 0;

    if (hasOutstandingLoans) {
      toast.error(
        "Cannot delete client: Client has active, overdue, or defaulted loans associated with them. Please clear all outstanding loans first."
      );
      return;
    }

    if (
      !window.confirm(
        "WARNING: Are you sure you want to delete this client? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Use the centralized deleteClient API function
      await deleteClient(clientId);
      toast.success("Client and all associated loans deleted successfully!");
      navigate("/clients"); // Redirect to clients list after deletion
    } catch (err) {
      console.error("Error deleting client:", err);
      setError(err || "Failed to delete client."); // Error from api.js is already a message
      toast.error(err || "Failed to delete client.");

      if (err && (err.includes("Authentication expired") || err.includes("unauthorized"))) {
        navigate("/loginForm"); // Adjust based on your actual login route
      }
    }
  };

  // Handlers for RecordPaymentModal
  const handleOpenPaymentModal = (loan) => {
    setSelectedLoanForPayment(loan);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setSelectedLoanForPayment(null);
    setIsPaymentModalOpen(false);
    fetchClientData(loanFilterStatus); // Re-fetch client data to update loan balances/statuses after a payment
  };

  const handlePaymentRecorded = (transactionRef) => {
    if (transactionRef) {
      toast.info(
        `Electronic payment initiated. Transaction ID: ${transactionRef}. Awaiting confirmation.`
      );
    } else {
      toast.success("Manual payment recorded successfully!");
    }
    handleClosePaymentModal();
  };

  const canDeleteClient =
    clientLoanSummary.activeLoans === 0 &&
    clientLoanSummary.overdueLoans === 0 &&
    clientLoanSummary.defaultedLoans === 0;

  const getClientStatusText = () => {
    if (clientLoanSummary.defaultedLoans > 0) {
      return "Defaulted (has defaulted loan)";
    }
    if (clientLoanSummary.overdueLoans > 0) {
      return "Overdue (has overdue loan)";
    }
    if (clientLoanSummary.activeLoans > 0) {
      return "Active (has active loan)";
    }
    return "Inactive (no active loans)";
  };

  const getClientStatusClass = () => {
    if (clientLoanSummary.defaultedLoans > 0) {
      return "defaulted";
    }
    if (clientLoanSummary.overdueLoans > 0) {
      return "overdue";
    }
    if (clientLoanSummary.activeLoans > 0) {
      return "active";
    }
    return "inactive";
  };

  if (loading) {
    return (
      <div className="clientDashboardContainer">
        Loading client dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="clientDashboardContainer" style={{ color: "red" }}>
        Error: {error}
      </div>
    );
  }

  if (!client) {
    return <div className="clientDashboardContainer">Client not found.</div>;
  }

  return (
    <div className="clientDashboardContainer">
      <div className="clientDashboardContent">
        <Link to="/clients" className="clientDashboardBackLink">
          Clients List
        </Link>

        <h1 className="clientDashboardHeadline">Client Details</h1>

        {/* Client Details Section */}
        <section className="clientDetailsSection">
          <div className="clientDetailsContent">
            <p className="clientDetailItem">
              <span className="clientDetailLabel">Name:</span>
              <span className="clientDetailValue">{client.name}</span>
            </p>
            <p className="clientDetailItem">
              <span className="clientDetailLabel">Email: </span>
              <span className="clientDetailValue">{client.email}</span>
            </p>
            <p className="clientDetailItem">
              <span className="clientDetailLabel">Primary Phone:</span>
              <span className="clientDetailValue">{client.phone || "N/A"}</span>
            </p>
            <p className="clientDetailItem">
              <span className="clientDetailLabel">Secondary Phone:</span>
              <span className="clientDetailValue">
                {client.secondaryPhone || "N/A"}
              </span>
            </p>
            <p className="clientDetailItem">
              <span className="clientDetailLabel">NRC:</span>
              <span className="clientDetailValue">{client.nrc || "N/A"}</span>
            </p>
            <p className="clientDetailItem">
              <span className="clientDetailLabel">Address:</span>
              <span className="clientDetailValue">
                {client.address || "N/A"}
              </span>
            </p>
            <p className="clientDetailItem">
              <span className="clientDetailLabel">Status:</span>{" "}
              <span className={`clientStatus ${getClientStatusClass()}`}>
                {getClientStatusText()}
              </span>
            </p>
            <p className="clientDetailItem">
              <span className="clientDetailLabel">Date Registered:</span>{" "}
              {new Date(client.dateRegistered).toLocaleDateString()}
            </p>
            {/* Assuming client.registeredBy exists and is a readable string/object */}
            {client.registeredBy && (
              <p className="clientDetailItem">
                <span className="clientDetailLabel">Registered By:</span>{" "}
                <span className="clientDetailValue">
                  {/* Adjust this based on how registeredBy is structured */}
                  {client.registeredBy.username || client.registeredBy}
                </span>
              </p>
            )}
            {/* Client action buttons */}
            <div className="clientActionButtons">
              <button
                onClick={() => navigate(`/clients/edit/${client._id}`)}
                className="clientEditButton"
              >
                Edit Client Details
              </button>
              <button
                onClick={handleClientDelete}
                className={`clientDeleteButton ${
                  !canDeleteClient ? "disabled" : ""
                }`}
                disabled={!canDeleteClient}
                title={
                  !canDeleteClient
                    ? "Client has outstanding loans (active, overdue, or defaulted) and cannot be deleted."
                    : "Delete Client"
                }
              >
                Delete Client
              </button>
              {!canDeleteClient && (
                <p className="deleteClientRestrictionMessage">
                  Client has outstanding loans (active, overdue, or defaulted)
                  and cannot be deleted!
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Client's Loan Summary Section */}
        <section className="clientLoanSummarySection">
          <h2 className="clientLoanSummaryHeadline">
            {client.name}'s Loan Summary
          </h2>
          <div className="clientLoanSummaryCards">
            <div className="clientLoanSummaryTotals">
              <div className="clientLoanSummaryCard">
                <h3 className="clientLoanSummaryCardTitle">Total Loans</h3>
                <p>{clientLoanSummary.totalLoans}</p>
              </div>
              <div className="clientLoanSummaryCard">
                <h3 className="clientLoanSummaryCardTitle">
                  Total Loan Amount
                </h3>
                <p>ZMW{clientLoanSummary.totalLoanAmount.toFixed(2)}</p>
              </div>
              <div className="clientLoanSummaryCard">
                <h3 className="clientLoanSummaryCardTitle">
                  Total Balance Due
                </h3>
                <p>ZMW{clientLoanSummary.totalBalanceDue.toFixed(2)}</p>
              </div>
              <div className="clientLoanSummaryCard">
                <h3 className="clientLoanSummaryCardTitle">
                  Total Payments Made
                </h3>
                <p>ZMW{clientLoanSummary.totalPaymentsMade.toFixed(2)}</p>
              </div>
            </div>
            <div className="clientLoanSummaryLoanTotals">
              <div className="clientLoanSummaryCard">
                <h3 className="clientLoanSummaryCardTitle">Active Loans</h3>
                <p>{clientLoanSummary.activeLoans}</p>
              </div>
              <div className="clientLoanSummaryCard">
                <h3 className="clientLoanSummaryCardTitle">Pending Loans</h3>
                <p>{clientLoanSummary.pendingLoans}</p>
              </div>
              <div className="clientLoanSummaryCard">
                <h3 className="clientLoanSummaryCardTitle">Defaulted Loans</h3>
                <p>{clientLoanSummary.defaultedLoans}</p>
              </div>
              <div className="clientLoanSummaryCard">
                <h3 className="clientLoanSummaryCardTitle">Paid Loans</h3>
                <p>{clientLoanSummary.paidLoans}</p>
              </div>
            </div>
          </div>
        </section>
        {/* Loan Filter Buttons */}
        <div className="clientLoanFilterButtons">
          <button
            onClick={() => setLoanFilterStatus("all")}
            className={
              loanFilterStatus === "all"
                ? "active-filter clientLoanFilterButton"
                : "clientLoanFilterButton"
            }
          >
            All Loans
          </button>
          <button
            onClick={() => setLoanFilterStatus("active")}
            className={
              loanFilterStatus === "active"
                ? "active-filter clientLoanFilterButton"
                : "clientLoanFilterButton"
            }
          >
            Active Loans
          </button>
          <button
            onClick={() => setLoanFilterStatus("pending")}
            className={
              loanFilterStatus === "pending"
                ? "active-filter clientLoanFilterButton"
                : "clientLoanFilterButton"
            }
          >
            Pending Loans
          </button>
          <button
            onClick={() => setLoanFilterStatus("defaulted")}
            className={
              loanFilterStatus === "defaulted"
                ? "active-filter clientLoanFilterButton"
                : "clientLoanFilterButton"
            }
          >
            Defaulted Loans
          </button>
          <button
            onClick={() => setLoanFilterStatus("paid")}
            className={
              loanFilterStatus === "paid"
                ? "active-filter clientLoanFilterButton"
                : "clientLoanFilterButton"
            }
          >
            Paid Loans
          </button>
        </div>

        {/* Client's Loans List Section */}
        <section className="clientLoansListSection">
          <h2 className="clientLoansListHeadline">
            {client.name}'s{" "}
            {loanFilterStatus !== "all" ? `${loanFilterStatus} ` : ""}Loans
          </h2>
          {clientLoans.length === 0 ? (
            <p className="noLoansMessage">
              No {loanFilterStatus !== "all" ? `${loanFilterStatus} ` : ""}loans
              found for this client.
            </p>
          ) : (
            <div className="clientLoansTableContainer">
              <table className="clientLoansTable">
                <thead>
                  <tr>
                    <th className="clientLoansTableHeader">Loan ID</th>
                    <th className="clientLoansTableHeader">Amount </th>
                    <th className="clientLoansTableHeader">Loan Date</th>
                    <th className="clientLoansTableHeader">Due Date</th>
                    <th className="clientLoansTableHeader">
                      Rate (%)
                    </th>
                    <th className="clientLoansTableHeader">Status</th>
                    <th className="clientLoansTableHeader">
                      Balance
                    </th>
                    <th className="clientLoansTableHeader">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientLoans.map((loan) => (
                    <tr key={loan._id}>
                      <td className="clientLoansTableCell">
                        {loan._id.substring(0, 8)}...
                      </td>
                      <td className="clientLoansTableCell">
                        ZMW{loan.loanAmount.toFixed(2)}
                      </td>
                      <td className="clientLoansTableCell">{loan.loanDate}</td>
                      <td className="clientLoansTableCell">{loan.dueDate}</td>
                      <td className="clientLoansTableCell">
                        {loan.interestRate}%
                      </td>
                      <td className="clientLoansTableCell">
                        <span className={`loanStatus ${loan.status}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="clientLoansTableCell">
                        ZMW{loan.balanceDue.toFixed(2)}
                      </td>
                      <td className="loanActionsCell">
                        <Link
                          to={`/loans/${loan._id}`}
                          className="viewLoanDetailsLink"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleOpenPaymentModal(loan)}
                          className="recordPaymentBtn"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Render the RecordPaymentModal conditionally */}
      {isPaymentModalOpen && selectedLoanForPayment && (
        <RecordPaymentModal
          loanId={selectedLoanForPayment._id}
          clientId={client._id}
          clientName={client.name}
          clientPhoneNumber={client.phone}
          clientEmail={client.email}
          currentBalanceDue={selectedLoanForPayment.balanceDue}
          onClose={handleClosePaymentModal}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
};

export default ViewClientPage;