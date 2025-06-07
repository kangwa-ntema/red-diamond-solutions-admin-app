import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../utils/authUtils";
import "./ClientDashboard.css"; // Import the new CSS file
import RecordPaymentModal from '../components/RecordPaymentModal'; // Import the RecordPaymentModal
import { toast } from 'react-toastify'; // Import toast for notifications

const ClientDashboard = () => {
  const { id: clientId } = useParams(); // Changed from customerId to clientId
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [client, setClient] = useState(null); // Changed from customer to client
  const [clientLoans, setClientLoans] = useState([]); // Changed from customerLoans to clientLoans
  const [clientLoanSummary, setClientLoanSummary] = useState({ // Changed from customerLoanSummary to clientLoanSummary
    totalLoans: 0,
    totalLoanAmount: 0,
    totalBalanceDue: 0,
    totalPaymentsMade: 0,
    activeLoans: 0,
    pendingLoans: 0,
    defaultedLoans: 0,
    paidLoans: 0,
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
          navigate("/login");
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
    if (
      window.confirm(
        "Are you sure you want to delete this loan? This action cannot be undone."
      )
    ) {
      const token = getToken();
      if (!token) {
        toast.error("Authentication required to delete a loan."); // Consider toast.error here
        navigate("/login");
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
          toast.success("Loan deleted successfully!"); // Changed alert to toast
          fetchClientData(loanFilterStatus);
        } else if (response.status === 401 || response.status === 403) {
          toast.error("Authentication expired or unauthorized. Please log in again."); // Changed alert to toast
          clearAuthData();
          navigate("/login");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete loan.");
        }
      } catch (err) {
        console.error("Error deleting loan:", err);
        setError(err.message || "Failed to delete loan.");
        toast.error(err.message || "Failed to delete loan."); // Added toast for error
      }
    }
  };

  const handleClientDelete = async () => {
    if (
      window.confirm(
        "WARNING: Are you sure you want to delete this client and ALL their associated loans? This action cannot be undone."
      )
    ) {
      const token = getToken();
      if (!token) {
        toast.error("Authentication required to delete a client."); // Changed alert to toast
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/clients/${clientId}`, // Changed from customers/${customerId} to clients/${clientId}
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          toast.success("Client and all associated loans deleted successfully!"); // Changed alert to toast
          navigate("/clients"); // Changed from /customers to /clients
        } else if (response.status === 401 || response.status === 403) {
          toast.error("Authentication expired or unauthorized. Please log in again."); // Changed alert to toast
          clearAuthData();
          navigate("/login");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete client.");
        }
      } catch (err) {
        console.error("Error deleting client:", err);
        setError(err.message || "Failed to delete client.");
        toast.error(err.message || "Failed to delete client."); // Added toast for error
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
    // Re-fetch client data to update loan balances/statuses after a payment
    fetchClientData(loanFilterStatus);
  };
  
  const handlePaymentRecorded = (transactionRef) => {
    // This callback is triggered after a payment (manual or electronic) is processed
    // The `transactionRef` is passed for electronic payments
    if (transactionRef) {
        toast.info(`Electronic payment initiated. Transaction ID: ${transactionRef}. Awaiting confirmation.`);
    } else {
            toast.success('Manual payment recorded successfully!');
    }
    handleClosePaymentModal(); // Close the modal
  };

  if (loading) {
    return <div className="clientDashboardContainer">Loading client dashboard...</div>;
  }

  if (error) {
    return <div className="clientDashboardContainer" style={{ color: "red" }}>Error: {error}</div>;
  }

  if (!client) { // Changed from customer to client
    return <div className="clientDashboardContainer">Client not found.</div>;
  }

  return (
    <div className="clientDashboardContainer">
      <div className="clientDashboardContent">
        <Link to="/clients" className="clientDashboardBackLink"> {/* Changed from /customers to /clients */}
          {"<"} Back to Clients List
        </Link>

        <h1 className="clientDashboardHeadline">Client Dashboard: {client.name}</h1> {/* Changed from customer.name to client.name */}

        {/* Client Details Section */}
        <section className="clientDetailsSection">
          <h2 className="clientDetailsHeadline">Client Details</h2>
          <div className="clientDetailsContent">
            <p className="clientDetailItem">
              <strong className="clientDetailLabel">Name:</strong> {client.name} {/* Changed from customer.name to client.name */}
            </p>
            <p className="clientDetailItem">
              <strong className="clientDetailLabel">Email:</strong> {client.email} {/* Changed from customer.email to client.email */}
            </p>
            <p className="clientDetailItem">
              <strong className="clientDetailLabel">Primary Phone:</strong> {client.phone || "N/A"} {/* Changed from customer.phone to client.phone */}
            </p>
            <p className="clientDetailItem">
              <strong className="clientDetailLabel">Secondary Phone:</strong> {client.secondaryPhone || "N/A"} {/* Changed from customer.secondaryPhone to client.secondaryPhone */}
            </p>
            <p className="clientDetailItem">
              <strong className="clientDetailLabel">NRC:</strong> {client.nrc || "N/A"} {/* Changed from customer.nrc to client.nrc */}
            </p>
            <p className="clientDetailItem">
              <strong className="clientDetailLabel">Address:</strong> {client.address || "N/A"} {/* Changed from customer.address to client.address */}
            </p>
            <p className="clientDetailItem">
              <strong className="clientDetailLabel">Status:</strong>{" "}
              <span className={`clientStatus ${clientLoanSummary.activeLoans > 0 ? 'active' : 'inactive'}`}> {/* Changed from customerLoanSummary to clientLoanSummary */}
                {clientLoanSummary.activeLoans > 0 // Changed from customerLoanSummary to clientLoanSummary
                  ? "Active (has active loan)"
                  : "Inactive (no active loans)"}
              </span>
            </p>
            <p className="clientDetailItem">
              <strong className="clientDetailLabel">Date Registered:</strong>{" "}
              {new Date(client.dateRegistered).toLocaleDateString()} {/* Changed from customer.dateRegistered to client.dateRegistered */}
            </p>
            {/* Client action buttons */}
            <div className="clientActionButtons">
              <button onClick={() => navigate(`/clients/edit/${client._id}`)} className="clientEditButton"> {/* Changed from customers/edit/${customer._id} to clients/edit/${client._id} */}
                Edit Client Details
              </button>
              <button onClick={handleClientDelete} className="clientDeleteButton">Delete Client</button>
            </div>
          </div>
        </section>

        {/* Client's Loan Summary Section */}
        <section className="clientLoanSummarySection">
          <h2 className="clientLoanSummaryHeadline">{client.name}'s Loan Summary</h2> {/* Changed from customer.name to client.name */}
          <div className="clientLoanSummaryCards">
            <div className="clientLoanSummaryCard">
              <h3>Total Loans</h3>
              <p>{clientLoanSummary.totalLoans}</p> {/* Changed from customerLoanSummary to clientLoanSummary */}
            </div>
            <div className="clientLoanSummaryCard">
              <h3>Total Loan Amount</h3>
              <p>ZMW{clientLoanSummary.totalLoanAmount.toFixed(2)}</p> {/* Changed from customerLoanSummary to clientLoanSummary */}
            </div>
            <div className="clientLoanSummaryCard">
              <h3>Total Balance Due</h3>
              <p>ZMW{clientLoanSummary.totalBalanceDue.toFixed(2)}</p> {/* Changed from customerLoanSummary to clientLoanSummary */}
            </div>
            <div className="clientLoanSummaryCard">
              <h3>Total Payments Made</h3>
              <p>ZMW{clientLoanSummary.totalPaymentsMade.toFixed(2)}</p> {/* Changed from customerLoanSummary to clientLoanSummary */}
            </div>
            <div className="clientLoanSummaryCard">
              <h3>Active Loans</h3>
              <p>{clientLoanSummary.activeLoans}</p> {/* Changed from customerLoanSummary to clientLoanSummary */}
            </div>
            <div className="clientLoanSummaryCard">
              <h3>Pending Loans</h3>
              <p>{clientLoanSummary.pendingLoans}</p> {/* Changed from customerLoanSummary to clientLoanSummary */}
            </div>
            <div className="clientLoanSummaryCard">
              <h3>Defaulted Loans</h3>
              <p>{clientLoanSummary.defaultedLoans}</p> {/* Changed from customerLoanSummary to clientLoanSummary */}
            </div>
            <div className="clientLoanSummaryCard">
              <h3>Paid Loans</h3>
              <p>{clientLoanSummary.paidLoans}</p> {/* Changed from customerLoanSummary to clientLoanSummary */}
            </div>
          </div>
        </section>

        {/* Loan Filter Buttons */}
        <div className="clientLoanFilterButtons">
          <button onClick={() => setLoanFilterStatus("all")} className={loanFilterStatus === 'all' ? 'active-filter clientLoanFilterButton' : 'clientLoanFilterButton'}>All Loans</button>
          <button onClick={() => setLoanFilterStatus("active")} className={loanFilterStatus === 'active' ? 'active-filter clientLoanFilterButton' : 'clientLoanFilterButton'}>
            Active Loans
          </button>
          <button onClick={() => setLoanFilterStatus("pending")} className={loanFilterStatus === 'pending' ? 'active-filter clientLoanFilterButton' : 'clientLoanFilterButton'}>
            Pending Loans
          </button>
          <button onClick={() => setLoanFilterStatus("defaulted")} className={loanFilterStatus === 'defaulted' ? 'active-filter clientLoanFilterButton' : 'clientLoanFilterButton'}>
            Defaulted Loans
          </button>
          <button onClick={() => setLoanFilterStatus("paid")} className={loanFilterStatus === 'paid' ? 'active-filter clientLoanFilterButton' : 'clientLoanFilterButton'}>Paid Loans</button>
        </div>

        {/* Client's Loans List Section */}
        <section className="clientLoansListSection">
          <h2 className="clientLoansListHeadline">
            {client.name}'s{" "} {/* Changed from customer.name to client.name */}
            {loanFilterStatus !== "all" ? `${loanFilterStatus} ` : ""}Loans
          </h2>
          {clientLoans.length === 0 ? ( // Changed from customerLoans to clientLoans
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
                    <th className="clientLoansTableHeader">Interest Rate (%)</th>
                    <th className="clientLoansTableHeader">Status</th>
                    <th className="clientLoansTableHeader">Balance Due (ZMW)</th>
                    <th className="clientLoansTableHeader">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientLoans.map((loan) => ( // Changed from customerLoans.map to clientLoans.map
                    <tr key={loan._id}>
                      <td className="clientLoansTableCell">{loan._id.substring(0, 8)}...</td>
                      <td className="clientLoansTableCell">ZMW{loan.loanAmount.toFixed(2)}</td>
                      <td className="clientLoansTableCell">{loan.loanDate}</td>
                      <td className="clientLoansTableCell">{loan.dueDate}</td>
                      <td className="clientLoansTableCell">{loan.interestRate}%</td>
                      <td className="clientLoansTableCell">
                        <span className={`loanStatus ${loan.status}`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="clientLoansTableCell">ZMW{loan.balanceDue.toFixed(2)}</td>
                      <td className="loanActionsCell">
                        <Link to={`/loans/${loan._id}`} className="viewLoanDetailsLink">View Details</Link>
                        {/* Button to open payment modal */}
                        <button
                            onClick={() => handleOpenPaymentModal(loan)}
                            className="recordPaymentBtn" // Add a class for styling
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
          clientId={client._id} // Changed from customerId to clientId
          clientName={client.name} // Changed from customerName to clientName
          clientPhoneNumber={client.phone} // Changed from customerPhoneNumber to clientPhoneNumber
          clientEmail={client.email} // Changed from customerEmail to clientEmail
          currentBalanceDue={selectedLoanForPayment.balanceDue}
          onClose={handleClosePaymentModal}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
};

export default ClientDashboard;