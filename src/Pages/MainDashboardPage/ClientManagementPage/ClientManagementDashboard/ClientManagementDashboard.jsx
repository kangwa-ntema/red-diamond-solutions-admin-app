// src/Pages/MainDashboardPage/ClientManagementPage/ClientManagementDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext"; // Import useAuth hook
import { getAllClients, deleteClient } from "../../../../services/api/";
import "./ClientManagementDashboard.css"; // Ensure this CSS file is correctly imported and named for clients
import { toast } from "react-toastify"; // Import toast for consistent notifications

/**
 * @component ClientManagementDashboard
 * @description A React component that displays an overview of clients, including summaries
 * and a detailed list. It allows filtering clients by their active status (based on loans)
 * and provides navigation to add new clients or view client details.
 * All instances of 'customer' have been comprehensively changed to 'client' for consistency.
 */
const ClientManagementDashboard = () => {
    // --- State Management ---
    const [clients, setClients] = useState([]);
    const [overallSummary, setOverallSummary] = useState({
        totalClients: 0,
        activeClients: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [isDeleting, setIsDeleting] = useState(false);

    // States for custom confirmation modal for delete action
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [clientToDeleteId, setClientToDeleteId] = useState(null);
    const [clientToDeleteName, setClientToDeleteName] = useState('');

    const navigate = useNavigate();
    const { user: currentUser, hasRole } = useAuth();

    // --- Data Fetching Logic ---
    const fetchClientData = useCallback(
        async (statusFilter = "all") => {
            setLoading(true);
            setError(null);

            try {
                const filters = {};
                if (statusFilter !== "all") {
                    filters.status = statusFilter;
                }
                const data = await getAllClients(filters);
                setClients(data.clients || []);
                setOverallSummary(data.overallSummary || { totalClients: 0, activeClients: 0 });
            } catch (err) {
                console.error("ClientsDashboard: Error fetching client data:", err);
                setError(err.message || "Failed to fetch client data.");
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // --- Effects ---
    useEffect(() => {
        fetchClientData(filterStatus);
    }, [fetchClientData, filterStatus]);

    // --- Action Handlers ---
    const handleEdit = (clientId) => {
        navigate(`/clients/edit/${clientId}`);
    };

    /**
     * @function handleDeleteClick
     * @description Opens the confirmation modal for deleting a client.
     * @param {string} clientId - The ID of the client to delete.
     * @param {string} clientFirstName - The first name of the client to delete (for display in modal).
     * @param {string} clientLastName - The last name of the client to delete (for display in modal).
     */
    const handleDeleteClick = (clientId, clientFirstName, clientLastName) => { // Updated parameters
        setClientToDeleteId(clientId);
        setClientToDeleteName(`${clientFirstName} ${clientLastName}`); // Construct full name for display
        setShowConfirmModal(true);
    };

    const executeDelete = async () => {
        setShowConfirmModal(false);
        if (!clientToDeleteId) return;

        setIsDeleting(true);
        setError(null);

        try {
            await deleteClient(clientToDeleteId);
            toast.success("Client deleted successfully!");
            fetchClientData(filterStatus);
        } catch (err) {
            toast.error(err.message || "Failed to delete client.");
            console.error("Error deleting client:", err);
            setError(err.message || "Failed to delete client.");
        } finally {
            setIsDeleting(false);
            setClientToDeleteId(null);
            setClientToDeleteName('');
        }
    };

    // --- Conditional Rendering for Loading and Error States ---
    if (loading) {
        return (
            <div className="clientsDashboardContainer">
                <div className="clientsMessage">Loading clients...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="clientsDashboardContainer">
                <div className="clientsErrorMessage">Error: {error}</div>
            </div>
        );
    }

    // --- Main Component Render ---
    return (
        <div className="clientsDashboardContainer">
            <Link to="/mainDashboard">
                <button className="clientsDashboardBackLink" disabled={isDeleting}>
                    Back to Main Dashboard
                </button>
            </Link>
            <h2 className="clientsDashboardHeadline">CLIENT MANAGEMENT</h2>
            <h2 className="clientsDashboardSubHeadline">SUMMARY</h2> {/* Consistent with UserManagementDashboard */}

            <div className="clientsDashboard"> {/* Outer wrapper for the main content */}
                <div className="clientsDashboardPanelContainer"> {/* For summary cards and main action buttons */}
                    <div className="clientsDashboardPanel"> {/* Inner panel for styling */}
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
                            {hasRole(["superadmin", "admin"]) && (
                                <Link to="/clients/add">
                                    <button className="clientActionBtn newClientBtn" disabled={isDeleting}>
                                        + Add New Client
                                    </button>
                                </Link>
                            )}
                            {hasRole(["superadmin", "admin", "employee"]) && (
                                <Link to="/loans/add">
                                    <button className="clientActionBtn newLoanBtn" disabled={isDeleting}>
                                        + Add Loan
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="clientsDashboardContentContainer"> {/* For filters and the list/table */}
                    {/* Filter Buttons Section */}
                    <div className="clientsDashboardPanelFilter"> {/* Renamed for consistency */}
                        <h3 className="clientsFilterBtnHeadline">Filters</h3>
                        <div className="clientFilterBtns">
                            <button
                                onClick={() => setFilterStatus("all")}
                                className={filterStatus === "all" ? "active-filter" : ""}
                                disabled={isDeleting}
                            >
                                All Clients
                            </button>
                            <button
                                onClick={() => setFilterStatus("active")}
                                className={filterStatus === "active" ? "active-filter" : ""}
                                disabled={isDeleting}
                            >
                                Active Clients
                            </button>
                            <button
                                onClick={() => setFilterStatus("inactive")}
                                className={filterStatus === "inactive" ? "active-filter" : ""}
                                disabled={isDeleting}
                            >
                                Inactive Clients
                            </button>
                        </div>
                    </div>
                    {/* Detailed Clients List Section */}
                    <div className="clientsDashboardContent"> {/* Inner content for the list */}
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
                                                <th>First Name</th> {/* Changed from Name */}
                                                <th>Last Name</th> {/* New column */}
                                                <th>Phone</th>
                                                <th>Status</th>
                                                <th>Total Loans</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clients.map((client) => (
                                                <tr key={client._id}>
                                                    <td>{client.clientId || client._id.substring(0, 8) + '...'}</td> {/* Display custom clientId or shortened _id */}
                                                    <td>{client.firstName}</td> {/* Use client.firstName */}
                                                    <td>{client.lastName}</td>  {/* Use client.lastName */}
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
                                                        <Link to={`/clients/${client._id}`} className="viewDetailsBtn">Details</Link>
                                                        {hasRole(["superadmin", "admin"]) && (
                                                            <button onClick={() => handleEdit(client._id)} disabled={isDeleting} className="editClientBtn">
                                                                Edit
                                                            </button>
                                                        )}
                                                        {hasRole(["superadmin"]) && (
                                                            <button
                                                                onClick={() => handleDeleteClick(client._id, client.firstName, client.lastName)} // Pass first and last name
                                                                disabled={isDeleting}
                                                                className="deleteClientBtn"
                                                            >
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

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <h3>Confirm Deletion</h3>
                        <p>
                            {`Are you sure you want to delete ${clientToDeleteName || 'this client'}? This action cannot be undone and will also delete their associated loans.`}
                        </p>
                        <div className="modalActions">
                            <button onClick={executeDelete} className="modalConfirmBtn" disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button onClick={() => setShowConfirmModal(false)} className="modalCancelBtn" disabled={isDeleting}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManagementDashboard;
