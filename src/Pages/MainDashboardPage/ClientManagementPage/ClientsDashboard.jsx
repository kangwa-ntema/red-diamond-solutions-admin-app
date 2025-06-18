// src/pages/ClientsDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // Import useAuth hook
import { getAllClients, deleteClient } from "../../../services/api"; // Centralized API calls
import "./ClientsDashboard.css"; // Ensure this CSS file is correctly imported and named for clients

/**
 * @component ClientsDashboard
 * @description A React component that displays an overview of clients, including summaries
 * and a detailed list. It allows filtering clients by their active status (based on loans)
 * and provides navigation to add new clients or view client details.
 * All instances of 'customer' have been comprehensively changed to 'client' for consistency.
 */
const ClientsDashboard = () => {
  // --- State Management ---

  // clients: State to store the array of client objects fetched from the backend.
  const [clients, setClients] = useState([]);
  // overallSummary: Stores aggregate data about clients (total, active), fetched from backend.
  const [overallSummary, setOverallSummary] = useState({
    totalClients: 0, // Total count of all registered clients
    activeClients: 0, // Count of clients with at least one active loan
  });
  // loading: Boolean state to indicate if data is currently being fetched.
  const [loading, setLoading] = useState(true);
  // error: Stores any error message that occurs during data fetching.
  const [error, setError] = useState(null);
  // filterStatus: Controls which subset of clients to display ('all', 'active', 'inactive').
  const [filterStatus, setFilterStatus] = useState("all");

  // useNavigate hook for programmatic navigation within the application.
  const navigate = useNavigate();
  // Get current logged-in user and role checker from AuthContext
  const { user: currentUser, hasRole } = useAuth();

  // --- Data Fetching Logic ---

  /**
   * @function fetchClientData
   * @description A memoized callback function to fetch client data from the backend.
   * It takes an optional statusFilter to fetch 'all', 'active', or 'inactive' clients.
   * Handles authentication token retrieval, API calls, and error handling.
   * @param {string} statusFilter - The filter criterion ('all', 'active', 'inactive').
   */
  const fetchClientData = useCallback(
    async (statusFilter = "all") => {
      setLoading(true); // Set loading state to true before fetching
      setError(null); // Clear any previous errors

      try {
        const filters = {};
        if (statusFilter !== "all") {
          filters.status = statusFilter; // Send as 'active' or 'inactive'
        }
        // Use the centralized API call for getAllClients
        const data = await getAllClients(filters);
        setClients(data.clients); // Update the clients state
        setOverallSummary(data.overallSummary); // Update the overall summary state
      } catch (err) {
        // Catch and log any errors during the fetch operation.
        console.error("ClientsDashboard: Error fetching client data:", err);
        setError(err.message || "Failed to fetch client data.");
        // AuthContext or an interceptor should ideally handle 401/403 for redirects
      } finally {
        setLoading(false); // Always set loading to false after the fetch operation
      }
    },
    [] // No dependencies that change on re-render for useCallback here, as filters are passed
  );

  // --- Effects ---

  // useEffect hook to call fetchClientData whenever filterStatus changes.
  useEffect(() => {
    fetchClientData(filterStatus);
  }, [fetchClientData, filterStatus]); // Dependencies: re-run effect if filterStatus changes or fetchClientData reference changes

  // --- Action Handlers ---

  /**
   * @function handleEdit
   * @description Navigates to the edit client page for a specific client.
   * @param {string} clientId - The ID of the client to edit.
   */
  const handleEdit = (clientId) => {
    navigate(`/clients/edit/${clientId}`);
  };

  /**
   * @function handleDelete
   * @description Handles the deletion of a client. Confirms with the user,
   * sends a DELETE request to the backend using the centralized API, and
   * re-fetches client data if successful.
   * @param {string} clientId - The ID of the client to delete.
   */
  const handleDelete = async (clientId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this client? This will also affect their associated loans."
      )
    ) {
      try {
        await deleteClient(clientId); // Use the centralized API call for deleteClient
        alert("Client deleted successfully!");
        fetchClientData(filterStatus); // Re-fetch data to update the list
      } catch (err) {
        alert(`Failed to delete client: ${err.message || err}`);
        console.error("Error deleting client:", err);
      }
    }
  };

  // --- Conditional Rendering for Loading and Error States ---

  if (loading) {
    return (
      <div className="clientsDashboardContainer">Loading clients...</div>
    );
  }

  if (error) {
    return (
      <div className="clientsDashboardContainer" style={{ color: "red" }}>
        Error: {error}
      </div>
    );
  }

  // --- Main Component Render ---

  return (
    <div className="clientsDashboardContainer">
      <div className="clientsDashboardHeading">
        <Link to="/mainDashboard">
          <button className="clientsDashboardBackLink">
            Back to Main Dashboard
          </button>
        </Link>
        <h1 className="clientsDashboardHeadline">CLIENTS DASHBOARD</h1>
        <h2 className="clientSummaryHeadline">SUMMARY</h2>
      </div>
      <div className="clientsDashboard">
        <div className="clientsDashboardPanelContainer">
          <div className="clientsDashboardPanel">
            {/* Overall Client Summary Section */}
            <section className="clientSummarySection">
              <div className="clientSummaryCards">
                <div className="clientSummaryCard">
                  <h3 className="clientSummaryCardTitle">Total Clients</h3>
                  <p className="clientSummaryCardValue">
                    {overallSummary.totalClients}
                  </p>
                </div>
                <div className="clientSummaryCard">
                  <h3 className="clientSummaryCardTitle">Active Clients</h3>
                  <p className="clientSummaryCardValue">
                    {overallSummary.activeClients}
                  </p>
                </div>
              </div>
            </section>
            {/* Action Buttons (Add New Client, Add Loan) */}
            <div className="clientActionBtns">
              {/* Render "Add New Client" button only if current user is superadmin or admin */}
              {hasRole(["superadmin", "admin"]) && (
                <Link to="/clients/add">
                  <button className="clientActionBtn newClientBtn">
                    + Add New Client
                  </button>
                </Link>
              )}
              {/* Render "Add Loan" button only if current user is superadmin or admin */}
              {hasRole(["superadmin", "admin", "employee"]) && (
                <Link to="/loans/add">
                  <button className="clientActionBtn newLoanBtn">
                    + Add Loan
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="clientsDashboardContent">
          {/* Filter Buttons */}
          <h1 className="clientsFilterBtnHeadline">Clients Filter Buttons</h1>
          <div className="clientFilterBtns">
            <button
              onClick={() => setFilterStatus("all")}
              className={filterStatus === "all" ? "active-filter" : ""}
            >
              All Clients
            </button>
            <button
              onClick={() => setFilterStatus("active")}
              className={filterStatus === "active" ? "active-filter" : ""}
            >
              Active Clients
            </button>
            <button
              onClick={() => setFilterStatus("inactive")}
              className={filterStatus === "inactive" ? "active-filter" : ""}
            >
              Inactive Clients
            </button>
          </div>
          {/* Detailed Clients List Section */}
          <section className="clientsListSection">
            <h2 className="clientsListHeadline">Clients List</h2>
            {clients.length === 0 ? (
              <p className="no-clients-message">
                No clients found matching the current filter. Add a new client!
              </p>
            ) : (
              <div className="clientsTableContainer">
                <table className="clientsTable">
                  <thead className="clientsTableHead">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Total Loans</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client._id}>
                        <td>{client._id.substring(0, 8)}...</td>
                        <td>{client.name}</td>
                        <td>{client.phone || "N/A"}</td>
                        <td>
                          <span
                            className={`client-status ${
                              client.hasActiveLoan ? "active" : "inactive"
                            }`}
                          >
                            {client.hasActiveLoan
                              ? "Active (has loan)"
                              : "Inactive (no active loan)"}
                          </span>
                        </td>
                        <td>{client.totalLoans || 0}</td>
                        <td className="actions-cell">
                          <Link to={`/clients/${client._id}`}>Details</Link>
                          {/* Render Edit button only if current user is superadmin or admin */}
                          {hasRole(["superadmin", "admin"]) && (
                            <button onClick={() => handleEdit(client._id)}>
                              Edit
                            </button>
                          )}
                          {/* Render Delete button only if current user is superadmin */}
                          {hasRole(["superadmin"]) && (
                            <button onClick={() => handleDelete(client._id)}>
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ClientsDashboard;