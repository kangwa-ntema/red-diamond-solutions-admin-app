import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getClientById } from "../../../../../src/services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext";
// REMOVED: import ClientActivityLog from '../ClientActivityLog/ClientActivityLog'; // This line should remain commented or removed
import "./ViewClientPage.css";

/**
 * @component ViewClientPage
 * @description Displays comprehensive details for a single client, including their
 * personal information, loan summary, and a list of associated loans.
 */
const ViewClientPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasRole } = useAuth();

    const [client, setClient] = useState(null);
    const [loans, setLoans] = useState([]);
    const [clientLoanSummary, setClientLoanSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchClientDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await getClientById(id);
                setClient(data.client);
                setLoans(data.loans);
                setClientLoanSummary(data.clientLoanSummary);
            } catch (err) {
                console.error("Error fetching client details:", err);
                const errorMessage = err.message || "Failed to fetch client details.";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchClientDetails();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: "numeric", month: "long", day: "numeric" };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading) {
        return (
            <div className="viewClientPageContainer">
                <div className="viewClientMessage">Loading client details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="viewClientPageContainer">
                <div className="viewClientErrorMessage">Error: {error}</div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="viewClientPageContainer">
                <div className="viewClientMessage">Client not found.</div>
            </div>
        );
    }

    return (
        <div className="viewClientPageContainer">
            <div className="viewClientPageContent">
                <Link to="/clients" className="viewClientBackLink">
                    Back to Clients List
                </Link>

                <h1 className="viewClientHeadline">Client Details: {client.firstName} {client.lastName}</h1>
                <div className="clientDetailsSections">
                    <section className="clientInfoSection clientDetailCard">
                        <h3 className="sectionTitle">Personal Information</h3>
                        <div className="infoGrid">
                            <div className="infoItem">
                                <strong>Client ID:</strong> <span>{client.clientId || "N/A"}</span>
                            </div>
                            <div className="infoItem">
                                <strong>First Name:</strong> <span>{client.firstName || "N/A"}</span>
                            </div>
                            <div className="infoItem">
                                <strong>Last Name:</strong> <span>{client.lastName || "N/A"}</span>
                            </div>
                            <div className="infoItem">
                                <strong>Email:</strong> <span>{client.email || "N/A"}</span>
                            </div>
                            <div className="infoItem">
                                <strong>Phone:</strong> <span>{client.phone || "N/A"}</span>
                            </div>
                            <div className="infoItem">
                                <strong>Secondary Phone:</strong> <span>{client.secondaryPhone || "N/A"}</span>
                            </div>
                            <div className="infoItem">
                                <strong>NRC:</strong> <span>{client.nrc || "N/A"}</span>
                            </div>
                            <div className="infoItem addressItem">
                                <strong>Address:</strong> <span>{client.address || "N/A"}</span>
                            </div>
                            <div className="infoItem">
                                <strong>Status:</strong>{" "}
                                <span className={client.isActive ? "status-active" : "status-inactive"}>
                                    {client.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div className="infoItem">
                                <strong>Date Registered:</strong> <span>{formatDate(client.dateRegistered)}</span>
                            </div>
                            <div className="infoItem">
                                <strong>Recorded By:</strong> <span>{client.recordedBy ? client.recordedBy.username : 'N/A'}</span>
                            </div>
                            <div className="infoItem">
                                <strong>Last Updated By:</strong> <span>{client.updatedBy ? client.updatedBy.username : 'N/A'}</span>
                            </div>
                        </div>
                        <div className="actionButtons">
                            {hasRole(["superadmin", "admin"]) && (
                                <button onClick={() => navigate(`/clients/edit/${client._id}`)} className="editClientBtn">
                                    Edit Client
                                </button>
                            )}
                            {/* Changed to Link to navigate to the new ClientLogsPage */}
                            <Link to={`/clients/${client._id}/client-activity`} className="viewLogsBtn">
                                View Client Activity Log
                            </Link>
                        </div>
                    </section>

                    <section className="loanSummarySection clientDetailCard">
                        <h3 className="sectionTitle">Loan Summary</h3>
                        {clientLoanSummary ? (
                            <div className="infoGrid">
                                <div className="infoItem">
                                    <strong>Total Loans:</strong> <span>{clientLoanSummary.totalLoans}</span>
                                </div>
                                <div className="infoItem">
                                    <strong>Total Loan Amount:</strong>{" "}
                                    <span>K{clientLoanSummary.totalLoanAmount.toFixed(2)}</span>
                                </div>
                                <div className="infoItem">
                                    <strong>Total Balance Due:</strong>{" "}
                                    <span>K{clientLoanSummary.totalBalanceDue.toFixed(2)}</span>
                                </div>
                                <div className="infoItem">
                                    <strong>Total Payments Made:</strong>{" "}
                                    <span>K{clientLoanSummary.totalPaymentsMade.toFixed(2)}</span>
                                </div>
                                <div className="infoItem">
                                    <strong>Active Loans:</strong> <span>{clientLoanSummary.activeLoans}</span>
                                </div>
                                <div className="infoItem">
                                    <strong>Pending Loans:</strong> <span>{clientLoanSummary.pendingLoans}</span>
                                </div>
                                <div className="infoItem">
                                    <strong>Overdue Loans:</strong> <span>{clientLoanSummary.overdueLoans}</span>
                                </div>
                                <div className="infoItem">
                                    <strong>Defaulted Loans:</strong> <span>{clientLoanSummary.defaultedLoans}</span>
                                </div>
                                <div className="infoItem">
                                    <strong>Paid Loans:</strong> <span>{clientLoanSummary.paidLoans}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="noDataMessage">No loan summary available.</p>
                        )}
                    </section>

                    <section className="clientLoansListSection clientDetailCard">
                        <h3 className="sectionTitle">Associated Loans</h3>
                        {loans.length === 0 ? (
                            <p className="noDataMessage">No loans associated with this client.</p>
                        ) : (
                            <div className="loansTableContainer">
                                <table className="loansTable">
                                    <thead>
                                        <tr>
                                            <th>Loan ID</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Balance Due</th>
                                            <th>Start Date</th>
                                            <th>Due Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loans.map((loan) => (
                                            <tr key={loan._id}>
                                                <td>{loan._id.substring(0, 8)}...</td>
                                                <td>K{loan.loanAmount.toFixed(2)}</td>
                                                <td>
                                                    <span className={`loan-status ${loan.status.toLowerCase()}`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                                <td>K{loan.balanceDue.toFixed(2)}</td>
                                                <td>{formatDate(loan.loanDate)}</td>
                                                <td>{formatDate(loan.dueDate)}</td>
                                                <td>
                                                    <Link to={`/loans/${loan._id}`} className="viewLoanDetailsBtn">
                                                        View Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* The Client Activity Log Section is REMOVED from here */}
                </div>
            </div>
        </div>
    );
};

export default ViewClientPage;