import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../utils/authUtils";
/* import "./ClientDashboard.css"; */ // CSS import commented out

const ClientDashboard = () => {
  const { id: customerId } = useParams();
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [customer, setCustomer] = useState(null);
  const [customerLoans, setCustomerLoans] = useState([]);
  const [customerLoanSummary, setCustomerLoanSummary] = useState({
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

  const fetchClientData = useCallback(
    async (filter = "all") => {
      setLoading(true);
      setError(null);
      const token = getToken();

      if (!token) {
        console.error(
          "ClientDashboard: No authentication token found. Redirecting to login."
        );
        clearAuthData();
        navigate("/login");
        return;
      }

      try {
        let url = `${BACKEND_URL}/api/customers/${customerId}`;
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

        const { customer, loans, customerLoanSummary } = await response.json();
        setCustomer(customer);
        setCustomerLoans(loans);
        setCustomerLoanSummary(customerLoanSummary);
      } catch (err) {
        console.error("ClientDashboard: Error fetching client data:", err);
        setError(err.message || "Network error or server unavailable.");
      } finally {
        setLoading(false);
      }
    },
    [navigate, BACKEND_URL, customerId]
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
        alert("Authentication required to delete a loan.");
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
          alert("Loan deleted successfully!");
          fetchClientData(loanFilterStatus);
        } else if (response.status === 401 || response.status === 403) {
          alert("Authentication expired or unauthorized. Please log in again.");
          clearAuthData();
          navigate("/login");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete loan.");
        }
      } catch (err) {
        console.error("Error deleting loan:", err);
        setError(err.message || "Failed to delete loan.");
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
        alert("Authentication required to delete a client.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/customers/${customerId}`,
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
          alert("Client and all associated loans deleted successfully!");
          navigate("/customers");
        } else if (response.status === 401 || response.status === 403) {
          alert("Authentication expired or unauthorized. Please log in again.");
          clearAuthData();
          navigate("/login");
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete client.");
        }
      } catch (err) {
        console.error("Error deleting client:", err);
        setError(err.message || "Failed to delete client.");
      }
    }
  };

  if (loading) {
    return <div>Loading client dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  if (!customer) {
    return <div>Client not found.</div>;
  }

  return (
    <div>
      <Link to="/customers">{"<"} Back to Customers List</Link>

      <h1>Client Dashboard: {customer.name}</h1>

      {/* Client Details Section */}
      <div>
        <h2>Client Details</h2>
        <div>
          <p>
            <strong>Name:</strong> {customer.name}
          </p>
          <p>
            <strong>Email:</strong> {customer.email}
          </p>
          <p>
            <strong>Primary Phone:</strong> {customer.phone || "N/A"}
          </p>
          <p>
            <strong>Secondary Phone:</strong> {customer.secondaryPhone || "N/A"}
          </p>
          <p>
            <strong>NRC:</strong> {customer.nrc || "N/A"}
          </p>
          <p>
            <strong>Address:</strong> {customer.address || "N/A"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {customerLoanSummary.activeLoans > 0
              ? "Active (has active loan)"
              : "Inactive (no active loans)"}
          </p>
          <p>
            <strong>Date Registered:</strong>{" "}
            {new Date(customer.dateRegistered).toLocaleDateString()}
          </p>
          {/* Client action buttons */}
          <div>
            <button onClick={() => navigate(`/customers/edit/${customer._id}`)}>
              Edit Client Details
            </button>
            <button onClick={handleClientDelete}>Delete Client</button>
          </div>
        </div>
      </div>

      {/* Client's Loan Summary Section */}
      <div>
        <h2>{customer.name}'s Loan Summary</h2>
        <div>
          <div>
            <h3>Total Loans</h3>
            <p>{customerLoanSummary.totalLoans}</p>
          </div>
          <div>
            <h3>Total Loan Amount</h3>
            <p>ZMW{customerLoanSummary.totalLoanAmount.toFixed(2)}</p>
          </div>
          <div>
            <h3>Total Balance Due</h3>
            <p>ZMW{customerLoanSummary.totalBalanceDue.toFixed(2)}</p>
          </div>
          <div>
            <h3>Total Payments Made</h3>
            <p>ZMW{customerLoanSummary.totalPaymentsMade.toFixed(2)}</p>
          </div>
          <div>
            <h3>Active Loans</h3>
            <p>{customerLoanSummary.activeLoans}</p>
          </div>
          <div>
            <h3>Pending Loans</h3>
            <p>{customerLoanSummary.pendingLoans}</p>
          </div>
          <div>
            <h3>Defaulted Loans</h3>
            <p>{customerLoanSummary.defaultedLoans}</p>
          </div>
          <div>
            <h3>Paid Loans</h3>
            <p>{customerLoanSummary.paidLoans}</p>
          </div>
        </div>
      </div>

      {/* Loan Filter Buttons */}
      <div>
        <button onClick={() => setLoanFilterStatus("all")}>All Loans</button>
        <button onClick={() => setLoanFilterStatus("active")}>
          Active Loans
        </button>
        <button onClick={() => setLoanFilterStatus("pending")}>
          Pending Loans
        </button>
        <button onClick={() => setLoanFilterStatus("defaulted")}>
          Defaulted Loans
        </button>
        <button onClick={() => setLoanFilterStatus("paid")}>Paid Loans</button>
      </div>

      {/* Client's Loans List Section */}
      <div>
        <h2>
          {customer.name}'s{" "}
          {loanFilterStatus !== "all" ? `${loanFilterStatus} ` : ""}Loans
        </h2>
        {customerLoans.length === 0 ? (
          <p>
            No {loanFilterStatus !== "all" ? `${loanFilterStatus} ` : ""}loans
            found for this client.
          </p>
        ) : (
          <div>
            <table>
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Amount (ZMW)</th>
                  <th>Loan Date</th>
                  <th>Due Date</th>
                  <th>Interest Rate (%)</th>
                  <th>Status</th>
                  <th>Balance Due (ZMW)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerLoans.map((loan) => (
                  <tr key={loan._id}>
                    <td>{loan._id.substring(0, 8)}...</td>
                    <td>ZMW{loan.loanAmount.toFixed(2)}</td>
                    <td>{loan.loanDate}</td>
                    <td>{loan.dueDate}</td>
                    <td>{loan.interestRate}%</td>
                    <td>{loan.status}</td>
                    <td>ZMW{loan.balanceDue.toFixed(2)}</td>
                    <td>
                      <Link to={`/loans/${loan._id}`}>View Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;
