import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../../utils/authUtils';
import './ChartOfAccountsPage.css'; // Dedicated CSS for styling this page
import { toast } from 'react-toastify'; // For displaying notifications
import AddAccountModal from './AddAccountModal/AddAccountModal'; // Import the Add Account modal
import ViewAccountModal from './ViewAccountModal/ViewAccountModal'; // NEW: Import View Account modal
import EditAccountModal from './EditAccountModal/EditAccountModal'; // NEW: Import Edit Account modal


/**
 * @component ChartOfAccountsPage
 * @description This component displays the Chart of Accounts (CoA) and allows administrators
 * to view accounts, add new ones via a modal, and manage (view details, edit, delete) existing accounts.
 * It fetches account data from the backend.
 */
const ChartOfAccountsPage = () => {
    // State to store the list of accounts fetched from the backend
    const [accounts, setAccounts] = useState([]);
    // State to manage the loading status of data fetching
    const [loading, setLoading] = useState(true);
    // State to store any error messages during initial data fetch
    const [error, setError] = useState(null);

    // States for modal visibility and selected account
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [showViewAccountModal, setShowViewAccountModal] = useState(false); // NEW
    const [showEditAccountModal, setShowEditAccountModal] = useState(false); // NEW
    const [selectedAccount, setSelectedAccount] = useState(null); // NEW: Account object for view/edit

    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    /**
     * @function fetchAccounts
     * @description Fetches the list of all accounting accounts from the backend API.
     * Handles authentication and error reporting. This function is memoized using useCallback.
     */
    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            console.error("ChartOfAccountsPage: No authentication token found. Redirecting to login.");
            clearAuthData();
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/accounts`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/login');
                toast.error('Authentication expired or unauthorized. Please log in again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch accounts.');
            }

            const data = await response.json();
            setAccounts(data); // Update state with fetched accounts
        } catch (err) {
            console.error("ChartOfAccountsPage: Error fetching accounts:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error fetching accounts: ${err.message || "Network error"}`);
        } finally {
            setLoading(false); // End loading regardless of success or failure
        }
    }, [BACKEND_URL, navigate]); // Dependencies for useCallback

    // useEffect to call fetchAccounts on component mount
    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    // Handlers to open/close modals
    const handleOpenAddAccountModal = () => setShowAddAccountModal(true);
    const handleCloseAddAccountModal = () => setShowAddAccountModal(false);

    // NEW: Handlers for View/Edit/Delete
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
    };

    const handleDeleteAccount = async (accountId) => {
        if (window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
            setLoading(true); // Indicate loading for the delete operation
            const token = getToken();

            if (!token) {
                clearAuthData();
                navigate('/');
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/accounts/${accountId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                });

                if (response.status === 401 || response.status === 403) {
                    clearAuthData();
                    navigate('/');
                    toast.error('Authentication expired or unauthorized. Please log in again.');
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete account.');
                }

                toast.success('Account deleted successfully!');
                fetchAccounts(); // Re-fetch accounts to update the list
            } catch (err) {
                console.error("ChartOfAccountsPage: Error deleting account:", err);
                toast.error(`Error deleting account: ${err.message || "Network error"}`);
            } finally {
                setLoading(false); // End loading
            }
        }
    };

    // Callback when an account is successfully added/edited in a modal
    const handleAccountModified = () => {
        fetchAccounts(); // Re-fetch the list of accounts to update the table
    };

    // Conditional rendering for initial loading and error states
    if (loading && accounts.length === 0 && !selectedAccount) { // Only show full loading if no accounts loaded yet and no account selected (initial state)
        return <div className="coaContainer coaLoading">Loading Chart of Accounts...</div>;
    }

    if (error && accounts.length === 0 && !selectedAccount) { // Only show global error if no accounts could be loaded initially
        return <div className="coaContainer coaErrorMessage">Error: {error}</div>;
    }

    return (
        <div className="coaContainer">
            <div className="coaContent">
                <Link to="/mainDashboard" className="coaBackLink">
                     Back to Main Dashboard
                </Link>
                <h1 className="coaHeadline">Chart of Accounts</h1>

                {/* Button to open the Add Account Modal */}
                <div className="addAccountButtonContainer">
                    <button className="addAccountBtn" onClick={handleOpenAddAccountModal}>
                        Add New Account
                    </button>
                </div>

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
                                        <th>Actions</th> {/* NEW: Actions Column */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map(account => (
                                        <tr key={account._id}>
                                            <td data-label="Code">{account.accountCode}</td>
                                            <td data-label="Name">{account.accountName}</td>
                                            <td data-label="Type"><span className={`accountTypeTag ${account.accountType.toLowerCase().replace(/\s/g, '-')}`}>{account.accountType}</span></td>
                                            <td data-label="Sub-Type">{account.subType || 'N/A'}</td>
                                            <td data-label="Normal Balance"><span className={`normalBalanceTag ${account.normalBalance.toLowerCase()}`}>{account.normalBalance}</span></td>
                                            <td data-label="Status">
                                                <span className={`statusTag ${account.isActive ? 'active' : 'inactive'}`}>
                                                    {account.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td data-label="Actions" className="coaActionsCell"> {/* NEW: Action buttons */}
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
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAccount(account._id)}
                                                    className="actionBtn deleteBtn"
                                                    title="Delete Account"
                                                    disabled={loading} // Disable delete during any loading state
                                                >
                                                    Delete
                                                </button>
                                            </td>
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
                        onAccountAdded={handleAccountModified} // Use general handler for refreshing
                        backendUrl={BACKEND_URL}
                        navigate={navigate}
                    />
                )}

                {showViewAccountModal && selectedAccount && ( // NEW: View Modal
                    <ViewAccountModal
                        account={selectedAccount}
                        onClose={handleCloseViewAccountModal}
                    />
                )}

                {showEditAccountModal && selectedAccount && ( // NEW: Edit Modal
                    <EditAccountModal
                        account={selectedAccount}
                        onClose={handleCloseEditAccountModal}
                        onAccountUpdated={handleAccountModified} // Use general handler for refreshing
                        backendUrl={BACKEND_URL}
                        navigate={navigate}
                    />
                )}
            </div>
        </div>
    );
};

export default ChartOfAccountsPage;
