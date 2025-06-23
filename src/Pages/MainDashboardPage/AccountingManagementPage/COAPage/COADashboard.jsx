// src/Pages/MainDashboardPage/AccountingManagementDashboard/COADashboard/COADashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './COADashboard.css'; // Dedicated CSS for styling this page
import { toast } from 'react-toastify'; // For displaying notifications
import { useAuth } from '../../../../context/AuthContext.jsx'; // Import useAuth hook

// Import the centralized API functions from accountingApi
import {
    getAllAccounts,
    deleteAccount,
    // AddAccount and UpdateAccount are typically handled by their respective modals,
    // so they are not directly imported here.
} from '../../../../services/api/accountApi.js'; // Corrected import path

// Import the Add Account modal
import AddAccountModal from './AddAccountModal/AddAccountModal.jsx';
// Import View Account modal
import ViewAccountModal from './ViewAccountModal/ViewAccountModal.jsx';
// Import Edit Account modal
import EditAccountModal from './EditAccountModal/EditAccountModal.jsx';
// Import a generic Confirmation Modal (or implement inline)
import ConfirmationModal from '../../../components/common/ConfirmationModal/ConfirmationModal.jsx'; // Assuming a generic ConfirmationModal component exists

/**
 * @component COADashboard
 * @description This component displays the Chart of Accounts (CoA) and allows administrators
 * to view accounts, add new ones via a modal, and manage (view details, edit, delete) existing accounts.
 * It fetches account data from the backend using the centralized API service.
 */
const COADashboard = () => {
    // State to store the list of accounts fetched from the backend
    const [accounts, setAccounts] = useState([]);
    // State to manage the loading status of data fetching
    const [loading, setLoading] = useState(true);
    // State to store any error messages during initial data fetch
    const [error, setError] = useState(null);

    // States for modal visibility and selected account
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [showViewAccountModal, setShowViewAccountModal] = useState(false);
    const [showEditAccountModal, setShowEditAccountModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); // New state for delete confirmation
    const [selectedAccount, setSelectedAccount] = useState(null); // Account object for view/edit/delete confirmation

    const navigate = useNavigate();
    const { hasRole } = useAuth(); // Destructure hasRole for authorization checks

    /**
     * @function fetchAccounts
     * @description Fetches the list of all accounting accounts from the backend API.
     * This function now uses the centralized API service.
     * Handles general error reporting, while authentication errors are handled by Axios interceptors.
     */
    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Use the centralized getAllAccounts function from accountingApi
            const data = await getAllAccounts();
            setAccounts(data); // Update state with fetched accounts
        } catch (err) {
            // The Axios interceptor in api.js should handle 401/403 and show general errors.
            // This catch block is for other, more specific errors that might bypass the interceptor,
            // or if you want to show a component-specific message.
            console.error("COADashboard: Error fetching accounts:", err);
            setError(err.message || "Failed to fetch accounts. Please try again.");
            // A toast message might already be shown by the interceptor, avoid redundancy
        } finally {
            setLoading(false); // End loading regardless of success or failure
        }
    }, []); // No external dependencies like BACKEND_URL or getToken needed anymore

    // useEffect to call fetchAccounts on component mount
    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    // Handlers to open/close modals
    const handleOpenAddAccountModal = () => setShowAddAccountModal(true);
    const handleCloseAddAccountModal = () => {
        setShowAddAccountModal(false);
        fetchAccounts(); // Re-fetch accounts after add/edit to update the table
    };

    // Handlers for View/Edit/Delete
    const handleViewAccount = (account) => {
        setSelectedAccount(account);
        setShowViewAccountModal(true);
    };

    const handleCloseViewAccountModal = () => {
        setSelectedAccount(null);
        setShowViewAccountModal(false);
    };

    const handleEditAccount = (account) => {
        setSelectedAccount(account);
        setShowEditAccountModal(true);
    };

    const handleCloseEditAccountModal = () => {
        setSelectedAccount(null);
        setShowEditAccountModal(false);
        fetchAccounts(); // Re-fetch accounts after add/edit to update the table
    };

    // Function to initiate the delete confirmation modal
    const confirmDeleteAccount = (account) => {
        setSelectedAccount(account); // Set the account to be deleted
        setShowDeleteConfirmModal(true); // Open the confirmation modal
    };

    // Function to handle the actual deletion after confirmation
    const handleConfirmDelete = async () => {
        setShowDeleteConfirmModal(false); // Close the confirmation modal
        if (!selectedAccount) return; // Should not happen if modal is opened correctly

        setLoading(true); // Indicate loading for the delete operation
        try {
            // Use the centralized deleteAccount function
            await deleteAccount(selectedAccount._id);
            toast.success('Account deleted successfully!');
            fetchAccounts(); // Re-fetch accounts to update the list
        } catch (err) {
            // The Axios interceptor in api.js should handle 401/403 and general errors.
            console.error("COADashboard: Error deleting account:", err);
            toast.error(`Error deleting account: ${err.message || "Network error"}`);
        } finally {
            setLoading(false); // End loading
            setSelectedAccount(null); // Clear selected account
        }
    };

    // Callback when an account is successfully added/edited in a modal
    // Note: This function is still useful for direct modal closes where re-fetch is needed,
    // but specific modal close handlers (like handleCloseAddAccountModal) now call it directly.
    const handleAccountModified = useCallback(() => {
        fetchAccounts(); // Re-fetch the list of accounts to update the table
    }, [fetchAccounts]);

    // Conditional rendering for initial loading and error states
    if (loading && accounts.length === 0 && !selectedAccount) {
        return <div className="coaContainer coaLoading">Loading Chart of Accounts...</div>;
    }

    if (error && accounts.length === 0 && !selectedAccount) {
        return <div className="coaContainer coaErrorMessage">Error: {error}</div>;
    }

    return (
        <div className="coaContainer">
            <div className="coaContent">
                <Link to="/accounting-dashboard" className="coaBackLink"> {/* Adjusted link to accounting-dashboard */}
                    Back to Accounting Dashboard
                </Link>
                <h1 className="coaHeadline">Chart of Accounts</h1>

                {/* Button to open the Add Account Modal - Only visible to authorized roles */}
                {hasRole(['superadmin', 'admin']) && (
                    <div className="addAccountButtonContainer">
                        <button className="addAccountBtn" onClick={handleOpenAddAccountModal} disabled={loading}>
                            + Add New Account
                        </button>
                    </div>
                )}

                {/* Section for Displaying Chart of Accounts */}
                <section className="accountsListSection">
                    <h2 className="sectionHeadline">All Accounts</h2>
                    {loading && accounts.length > 0 && <p className="coaLoadingMessage">Refreshing accounts...</p>}
                    {error && accounts.length > 0 && <div className="coaErrorMessageSmall">{error}</div>}

                    {accounts.length > 0 ? (
                        <div className="accountsTableContainer">
                            <table className="accountsTable">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Sub-Type</th>
                                        <th>Normal Balance</th>
                                        <th>Status</th>
                                        {hasRole(['superadmin', 'admin']) && <th>Actions</th>} {/* Only show Actions column if authorized */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map(account => (
                                        <tr key={account._id}>
                                            <td data-label="Code">{account.accountCode || 'N/A'}</td> {/* Display N/A if code is empty */}
                                            <td data-label="Name">{account.accountName}</td>
                                            <td data-label="Type"><span className={`accountTypeTag ${account.accountType.toLowerCase().replace(/\s/g, '-')}`}>{account.accountType}</span></td>
                                            <td data-label="Sub-Type">{account.subType || 'N/A'}</td>
                                            <td data-label="Normal Balance"><span className={`normalBalanceTag ${account.normalBalance.toLowerCase()}`}>{account.normalBalance}</span></td>
                                            <td data-label="Status">
                                                <span className={`statusTag ${account.isActive ? 'active' : 'inactive'}`}>
                                                    {account.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            {hasRole(['superadmin', 'admin']) && ( // Only render actions if authorized
                                                <td data-label="Actions" className="coaActionsCell">
                                                    <button
                                                        onClick={() => handleViewAccount(account)}
                                                        className="actionBtn viewBtn"
                                                        title="View Account Details"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditAccount(account)}
                                                        className="actionBtn editBtn"
                                                        title="Edit Account"
                                                        disabled={loading} // Disable during operations
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDeleteAccount(account)} // Use the new confirm function
                                                        className="actionBtn deleteBtn"
                                                        title="Delete Account"
                                                        disabled={loading} // Disable during operations
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        !loading && <p className="noAccountsMessage">No accounts found in the Chart of Accounts. Click "Add New Account" to add one!</p>
                    )}
                </section>

                {/* Render Modals Conditionally */}
                {showAddAccountModal && (
                    <AddAccountModal
                        onClose={handleCloseAddAccountModal}
                        onAccountAdded={handleAccountModified}
                    />
                )}

                {showViewAccountModal && selectedAccount && (
                    <ViewAccountModal
                        account={selectedAccount}
                        onClose={handleCloseViewAccountModal}
                    />
                )}

                {showEditAccountModal && selectedAccount && (
                    <EditAccountModal
                        account={selectedAccount}
                        onClose={handleCloseEditAccountModal}
                        onAccountUpdated={handleAccountModified}
                    />
                )}

                {/* New Confirmation Modal for Delete */}
                {showDeleteConfirmModal && selectedAccount && (
                    <ConfirmationModal
                        isOpen={showDeleteConfirmModal}
                        onClose={() => setShowDeleteConfirmModal(false)}
                        onConfirm={handleConfirmDelete}
                        title="Confirm Account Deletion"
                        message={`Are you sure you want to delete the account "${selectedAccount.accountName}" (Code: ${selectedAccount.accountCode || 'N/A'})? This action cannot be undone and will fail if there are associated journal entries.`}
                        confirmText="Delete"
                        cancelText="Cancel"
                    />
                )}
            </div>
        </div>
    );
};

export default COADashboard;
