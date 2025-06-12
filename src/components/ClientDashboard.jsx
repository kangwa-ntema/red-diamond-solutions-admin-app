import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../utils/authUtils";
import "./ClientDashboard.css"; // Import the new CSS file
import RecordPaymentModal from "../components/RecordPaymentModal"; // Import the RecordPaymentModal
import { toast } from "react-toastify"; // Import toast for notifications

const ClientDashboard = () => {
  const { id: clientId } = useParams(); // Changed from customerId to clientId
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [client, setClient] = useState(null); // Changed from customer to client
  const [clientLoans, setClientLoans] = useState([]); // Changed from customerLoans to clientLoans
  const [clientLoanSummary, setClientLoanSummary] = useState({
    // Changed from customerLoanSummary to clientLoanSummary
    totalLoans: 0,
    totalLoanAmount: 0,
    totalBalanceDue: 0,
    totalPaymentsMade: 0,
    activeLoans: 0,
    pendingLoans: 0,
    defaultedLoans: 0,
    paidLoans: 0,
    overdueLoans: 0, // Ensure this is initialized for consistency
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
      const token = getToken();

      if (!token) {
        console.error(
          "ClientDashboard: No authentication token found. Redirecting to landing page."
        );
        clearAuthData();
        navigate("/");
        return;
      }

      try {
        let url = `${BACKEND_URL}/api/clients/${clientId}`; // Changed from customerId to clientId
        if (filter !== "all") {
          url += `?loanStatus=${filter}`;
        }

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
          console.error(
            "ClientDashboard: Authentication expired or invalid. Logging out."
          );
          clearAuthData();
          navigate("/loginForm");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch client data.");
        }

        const { client, loans, clientLoanSummary } = await response.json(); // Changed from customer, loans, customerLoanSummary to client, loans, clientLoanSummary
        setClient(client); // Changed from setCustomer to setClient
        setClientLoans(loans); // Changed from setCustomerLoans to setClientLoans
        setClientLoanSummary(clientLoanSummary); // Changed from setCustomerLoanSummary to setClientLoanSummary
      } catch (err) {
        console.error("ClientDashboard: Error fetching client data:", err);
        setError(err.message || "Network error or server unavailable.");
      } finally {
        setLoading(false);
      }
    },
    [navigate, BACKEND_URL, clientId] // Changed from customerId to clientId
  );

  useEffect(() => {
    fetchClientData(loanFilterStatus);
  }, [fetchClientData, loanFilterStatus]);

  const handleLoanEdit = (loanId) => {
    navigate(`/loans/edit/${loanId}`);
  };

  const handleLoanDelete = async (loanId) => {
    // Replaced window.confirm with a custom modal or toast for better UX
    // For now, using toast for simplicity in this example.
    toast.info(
      "Deletion confirmation functionality to be handled by a custom modal."
    );
    // In a real application, you would open a modal here.
    // Example: openConfirmationModal({
    //   message: "Are you sure you want to delete this loan? This action cannot be undone.",
    //   onConfirm: async () => { ...actual delete logic... }
    // });

    // For now, if you proceed, it will directly call the delete endpoint.
    // It's crucial to replace window.confirm in production.
    if (
      !window.confirm(
        "Are you sure you want to delete this loan? This action cannot be undone."
      )
    ) {
      return; // User cancelled
    }

    const token = getToken();
    if (!token) {
      toast.error("Authentication required to delete a loan.");
      navigate("/loginForm");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/loans/${loanId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Loan deleted successfully!");
        fetchClientData(loanFilterStatus);
      } else if (response.status === 401 || response.status === 403) {
        toast.error(
          "Authentication expired or unauthorized. Please log in again."
        );
        clearAuthData();
        navigate("/loginForm");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete loan.");
      }
    } catch (err) {
      console.error("Error deleting loan:", err);
      setError(err.message || "Failed to delete loan.");
      toast.error(err.message || "Failed to delete loan.");
    }
  };

  const handleClientDelete = async () => {
    // Define if the client has any "active" loans that prevent deletion
    const hasOutstandingLoans =
      clientLoanSummary.activeLoans > 0 ||
      clientLoanSummary.overdueLoans > 0 ||
      clientLoanSummary.defaultedLoans > 0;

    if (hasOutstandingLoans) {
      toast.error(
        "Cannot delete client: Client has active, overdue, or defaulted loans associated with them. Please clear all outstanding loans first."
      );
      return; // Prevent deletion if outstanding loans exist
    }

    // Replace window.confirm with a custom modal or toast for better UX
    // For now, using toast for simplicity in this example.
    toast.info(
      "Deletion confirmation functionality to be handled by a custom modal."
    );
    // In a real application, you would open a modal here.
    // Example: openConfirmationModal({
    //   message: "WARNING: Are you sure you want to delete this client and ALL their associated loans? This action cannot be undone.",
    //   onConfirm: async () => { ...actual delete logic... }
    // });

    // For now, if you proceed, it will directly call the delete endpoint.
    // It's crucial to replace window.confirm in production.
    if (
      !window.confirm(
        "WARNING: Are you sure you want to delete this client? This action cannot be undone."
      )
    ) {
      return; // User cancelled
    }

    const token = getToken();
    if (!token) {
      toast.error("Authentication required to delete a client.");
      navigate("/loginForm");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/clients/${clientId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Client and all associated loans deleted successfully!");
        navigate("/clients");
      } else if (response.status === 401 || response.status === 403) {
        toast.error(
          "Authentication expired or unauthorized. Please log in again."
        );
        clearAuthData();
        navigate("/loginForm");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete client.");
      }
    } catch (err) {
      console.error("Error deleting client:", err);
      setError(err.message || "Failed to delete client.");
      toast.error(err.message || "Failed to delete client.");
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
    // Re-fetch client data to update loan balances/statuses after a payment
    fetchClientData(loanFilterStatus);
  };

  const handlePaymentRecorded = (transactionRef) => {
    // This callback is triggered after a payment (manual or electronic) is processed
    // The `transactionRef` is passed for electronic payments
    if (transactionRef) {
      toast.info(
        `Electronic payment initiated. Transaction ID: ${transactionRef}. Awaiting confirmation.`
      );
    } else {
      toast.success("Manual payment recorded successfully!");
    }
    handleClosePaymentModal(); // Close the modal
  };

  // Determine if client can be deleted based on loan summary
  const canDeleteClient =
    clientLoanSummary.activeLoans === 0 &&
    clientLoanSummary.overdueLoans === 0 &&
    clientLoanSummary.defaultedLoans === 0;

  // Determine client status text based on loan summary
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

  // Determine client status CSS class based on loan summary
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
            <p className="clientDetailItem">
              <span className="clientDetailLabel">Registered By:</span>{" "}
              {new Date(client.dateRegistered).toLocaleDateString()}
            </p>
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
         {<section className="clientLoansListSection">
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
                    <th className="clientLoansTableHeader">Amount (ZMW)</th>
                    <th className="clientLoansTableHeader">Loan Date</th>
                    <th className="clientLoansTableHeader">Due Date</th>
                    <th className="clientLoansTableHeader">
                      Rate (%)
                    </th>
                    <th className="clientLoansTableHeader">Status</th>
                    <th className="clientLoansTableHeader">
                      Balance Due (ZMW)
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
                        {/* <button
                          onClick={() => handleOpenPaymentModal(loan)}
                          className="recordPaymentBtn" // Add a class for styling
                        >
                          Record Payment
                        </button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>}
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

export default ClientDashboard;
