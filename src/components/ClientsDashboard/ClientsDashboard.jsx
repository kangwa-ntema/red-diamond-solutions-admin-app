import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../../utils/authUtils"; // Utility functions for authentication
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
  // BACKEND_URL: Base URL for API calls, loaded from environment variables.
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

      const token = getToken(); // Get the authentication token

      // If no token is found, log an error, clear authentication data, and redirect to login.
      if (!token) {
        console.error(
          "ClientsDashboard: No authentication token found. Redirecting to login."
        );
        clearAuthData(); // Clear potentially stale auth data
        navigate("/LandingPage"); // Redirect unauthenticated users
        return;
      }

      try {
        // Construct the API URL, appending a query parameter if a filter is active.
        let url = `${BACKEND_URL}/api/clients`; // API endpoint changed to /api/clients
        if (statusFilter === "active") {
          url += "?status=active"; // Filter for active clients
        } else if (statusFilter === "inactive") {
          url += "?status=inactive"; // Filter for inactive clients
        }

        // Make the API request to fetch client data.
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Include the authentication token
          },
          credentials: "include", // Include cookies (e.g., HTTP-only token if used)
        });

        // Handle unauthorized or forbidden responses (401, 403).
        if (response.status === 401 || response.status === 403) {
          console.error(
            "ClientsDashboard: Authentication expired or invalid. Logging out."
          );
          clearAuthData(); // Clear authentication data
          navigate("/"); // Redirect to login
          return;
        }

        // If the response is not OK, parse the error and throw an exception.
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch client data." // Updated error message
          );
        }

        // Parse the successful response JSON.
        // The backend is expected to return an object with 'clients' array and 'overallSummary'.
        const { clients: fetchedClients, overallSummary: fetchedSummary } =
          await response.json();
        setClients(fetchedClients); // Update the clients state
        setOverallSummary(fetchedSummary); // Update the overall summary state
      } catch (err) {
        // Catch and log any errors during the fetch operation.
        console.error("ClientsDashboard: Error fetching client data:", err); // Updated console message
        setError(err.message || "Network error or server unavailable."); // Set user-friendly error message
      } finally {
        setLoading(false); // Always set loading to false after the fetch operation
      }
    },
    [navigate, BACKEND_URL] // Dependencies for useCallback: re-create if these change
  );

  // --- Effects ---

  // useEffect hook to call fetchClientData whenever filterStatus or fetchClientData changes.
  useEffect(() => {
    fetchClientData(filterStatus);
  }, [fetchClientData, filterStatus]); // Dependencies: re-run effect if filterStatus changes or fetchClientData reference changes

  // --- Action Handlers (Kept for reference/potential future use) ---

  // handleEdit and handleDelete functions are no longer directly used in the JSX,
  // as the table now links to a client details page. They are kept here in case
  // you want to re-introduce direct edit/delete buttons in the table.

  /**
   * @function handleEdit
   * @description Navigates to the edit client page for a specific client.
   * @param {string} clientId - The ID of the client to edit.
   */
  const handleEdit = (clientId) => {
    navigate(`/clients/edit/${clientId}`); // Updated path
  };

  /**
   * @function handleDelete
   * @description Handles the deletion of a client. Confirms with the user,
   * retrieves the token, sends a DELETE request to the backend, and
   * re-fetches client data if successful.
   * @param {string} clientId - The ID of the client to delete.
   */
  const handleDelete = async (clientId) => {
    // Confirm deletion with the user, warning about associated loans.
    if (
      window.confirm(
        "Are you sure you want to delete this client? This will also affect their associated loans." // Updated message
      )
    ) {
      const token = getToken(); // Get authentication token
      if (!token) {
        alert("Authentication required to delete a client."); // Updated message
        navigate("/LandingPage"); // Redirect to login if no token
        clearAuthData(); // Clear any stale auth data
        return;
      }

      try {
        // Send a DELETE request to the backend API.
        const response = await fetch(
          `${BACKEND_URL}/api/clients/${clientId}`, // API endpoint changed to /api/clients
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        // Handle successful deletion.
        if (response.ok) {
          alert("Client deleted successfully!"); // Updated message
          fetchClientData(filterStatus); // Re-fetch data to update the list
        }
        // Handle authentication errors.
        else if (response.status === 401 || response.status === 403) {
          alert("Authentication expired or unauthorized. Please log in again.");
          clearAuthData();
          navigate("/loginForm");
        }
        // Handle other API errors.
        else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete client."); // Updated message
        }
      } catch (err) {
        // Catch and handle network or other unexpected errors.
        console.error("Error deleting client:", err); // Updated console message
        setError(err.message || "Failed to delete client."); // Set error message
      }
    }
  };

  // --- Conditional Rendering for Loading and Error States ---

  if (loading) {
    return (
      <div className="clientsDashboardContainer">Loading clients...</div> // Updated class and text
    );
  }

  if (error) {
    return (
      <div className="clientsDashboardContainer" style={{ color: "red" }}>
        {" "}
        {/* Updated class */}
        Error: {error}
      </div>
    );
  }

  // --- Main Component Render ---

  return (
    <div className="clientsDashboardContainer">
      {" "}
      {/* Main container for the dashboard (updated class) */}
      <div className="clientsDashboardHeading">
        {" "}
        {/* Section for heading and back link (updated class) */}
        <Link to="/mainDashboard">
          {" "}
          {/* Link back to the main dashboard */}
          <button className="clientsDashboardBackLink">
            {" "}
            {/* Button styled as a back link (updated class) */}
            Back to Main Dashboard
          </button>
        </Link>
        <h1 className="clientsDashboardHeadline">CLIENTS DASHBOARD</h1>{" "}
        {/* Main title (updated class and text) */}
        <h2 className="clientSummaryHeadline">SUMMARY</h2>{" "}
        {/* Section title for summary (updated class and text) */}
      </div>
      <div className="clientsDashboard">
        {" "}
        {/* Flex container for dashboard panels (updated class) */}
        <div className="clientsDashboardPanel">
          <div className="dashboardPanel">
            {" "}
            {/* Left panel for summary and action buttons (updated class) */}
            {/* Overall Client Summary Section */}
            <section className="clientSummarySection">
              {" "}
              {/* Section for summary cards (updated class) */}
              <div className="clientSummaryCards">
                {" "}
                {/* Container for individual summary cards (updated class) */}
                <div className="clientSummaryCard">
                  {" "}
                  {/* Card for Total Clients (updated class) */}
                  <h3 className="clientSummaryCardTitle">Total Clients</h3>{" "}
                  {/* Card title (updated class and text) */}
                  <p className="clientSummaryCardValue">
                    {" "}
                    {/* Card value (updated class) */}
                    {overallSummary.totalClients}
                  </p>
                </div>
                <div className="clientSummaryCard">
                  {" "}
                  {/* Card for Active Clients (updated class) */}
                  <h3 className="clientSummaryCardTitle">
                    Active Clients
                  </h3>{" "}
                  {/* Card title (updated class and text) */}
                  <p className="clientSummaryCardValue">
                    {" "}
                    {/* Card value (updated class) */}
                    {overallSummary.activeClients}
                  </p>
                </div>
              </div>
            </section>
            {/* Action Buttons (Add New Client, Add Loan) */}
            <div className="clientActionBtns">
              {" "}
              {/* Container for action buttons (updated class) */}
              <Link to="/clients/add">
                {" "}
                {/* Link to the Add New Client page (updated URL) */}
                <button className="clientActionBtn newClientBtn">
                  {" "}
                  {/* Button to add new client (updated class and text) */}+ Add
                  New Client
                </button>
              </Link>
              <Link to="/loans/add">
                {" "}
                {/* Link to the Add Loan page */}
                <button className="clientActionBtn newLoanBtn">
                  + Add Loan
                </button>{" "}
                {/* Button to add loan (updated class) */}
              </Link>
            </div>
          </div>
        </div>
        <div className="clientsDashboardContent">
          {" "}
          {/* Right panel for filters and client list (updated class) */}
          {/* Filter Buttons */}
          <h1 className="clientsFilterBtnHeadline">Clients Filter Buttons</h1>
          <div className="clientFilterBtns">
            {" "}
            {/* Container for filter buttons (updated class) */}
            <button
              onClick={() => setFilterStatus("all")} // Set filter to 'all'
              className={filterStatus === "all" ? "active-filter" : ""} // Apply active-filter class if 'all' is selected
            >
              All Clients {/* Updated button text */}
            </button>
            <button
              onClick={() => setFilterStatus("active")} // Set filter to 'active'
              className={filterStatus === "active" ? "active-filter" : ""} // Apply active-filter class if 'active' is selected
            >
              Active Clients {/* Updated button text */}
            </button>
            <button
              onClick={() => setFilterStatus("inactive")} // Set filter to 'inactive'
              className={filterStatus === "inactive" ? "active-filter" : ""} // Apply active-filter class if 'inactive' is selected
            >
              Inactive Clients {/* Updated button text */}
            </button>
          </div>
          {/* Detailed Clients List Section */}
          <section className="clientsListSection">
            {" "}
            {/* Section for the client list (updated class) */}
            <h2 className="clientsListHeadline">Clients List</h2>{" "}
            {/* Headline for the client list (updated class and text) */}
            {/* Conditional rendering based on whether clients array is empty */}
            {clients.length === 0 ? (
              <p className="no-clients-message">
                No clients found matching the current filter. Add a new client!
              </p> // Message if no clients (updated text)
            ) : (
              <div className="clientsTableContainer">
                {" "}
                {/* Container for the table for overflow scrolling (updated class) */}
                <table className="clientsTable">
                  {" "}
                  {/* Table to display client data (updated class) */}
                  <thead className="clientsTableHead">
                    {" "}
                    {/* Table header (updated class) */}
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      {/* <th>Email</th> */} {/* Email column commented out */}
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Total Loans</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Map through the clients array to render each client as a table row */}
                    {clients.map((client) => (
                      <tr key={client._id}>
                        {" "}
                        {/* Unique key for each row using client ID */}
                        <td>{client._id.substring(0, 8)}...</td>{" "}
                        {/* Display truncated ID */}
                        <td>{client.name}</td>
                        {/* <td>{client.email}</td> */}
                        <td>{client.phone || "N/A"}</td>{" "}
                        {/* Display phone or 'N/A' */}
                        <td>
                          {/* Display client status: Active (has loan) or Inactive (no active loan) */}
                          <span
                            className={`client-status ${
                              client.hasActiveLoan ? "active" : "inactive"
                            }`}
                          >
                            {" "}
                            {/* Updated class */}
                            {client.hasActiveLoan
                              ? "Active (has loan)"
                              : "Inactive (no active loan)"}
                          </span>
                        </td>
                        <td>{client.totalLoans || 0}</td>{" "}
                        {/* Display total loans, default to 0 */}
                        <td className="actions-cell">
                          {" "}
                          {/* Cell for action links/buttons */}
                          <Link to={`/clients/${client._id}`}>
                            {" "}
                            {/* Link to individual client details page (updated URL) */}
                            Details
                          </Link>
                          {/*
                            <button onClick={() => handleEdit(client._id)}>Edit</button>
                            <button onClick={() => handleDelete(client._id)}>Delete</button>
                          */}
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

export default ClientsDashboard; // Export the component for use in other parts of the application (renamed)
