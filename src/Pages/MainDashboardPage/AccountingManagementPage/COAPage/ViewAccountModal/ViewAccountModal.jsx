// src/Pages/MainDashboardPage/AccountingManagementDashboard/COADashboard/ViewAccountModal/ViewAccountModal.jsx
import React from 'react';
import './ViewAccountModal.css'; // Reusing a general modal CSS (you might need to create this or add to ChartOfAccountsPage.css)
import { Link } from 'react-router-dom'; // NEW: Import Link from react-router-dom

/**
 * @component ViewAccountModal
 * @description A read-only modal to display detailed information about a selected accounting account.
 * This component simply renders the data it receives via props.
 *
 * @param {Object} props - Component props
 * @param {Object} props.account - The account object to display.
 * @param {function} props.onClose - Callback function to close the modal.
 */
const ViewAccountModal = ({ account, onClose }) => {
    // If no account is provided, or account is null, don't render the modal.
    // This is a defensive check, as the parent component should ideally only render this
    // when `selectedAccount` is truthy.
    if (!account) return null;

    // Helper to capitalize the first letter of a string.
    // Used for display consistency for accountType and normalBalance.
    const capitalize = (s) => {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    return (
        // Modal overlay: Covers the entire screen and closes the modal when clicked (if not on content).
        <div className="modalOverlay" onClick={onClose}>
            {/* Modal content area: Prevents closing when clicking inside the modal itself. */}
            <div className="modalContent" onClick={e => e.stopPropagation()}>
                <div className="modalHeader">
                    {/* Display account name in the title for quick identification. */}
                    <h2 className="modalTitle">Account Details: {account.accountName || 'N/A'}</h2>
                    {/* Close button for the modal. */}
                    <button className="modalCloseButton" onClick={onClose}>&times;</button>
                </div>
                <div className="modalBody">
                    {/* Grid layout for displaying account details. */}
                    <div className="accountDetailGrid">
                        <div className="detailItem">
                            <strong>Account Code:</strong>
                            <span>{account.accountCode || 'N/A'}</span> {/* Display 'N/A' if accountCode is null/empty */}
                        </div>
                        <div className="detailItem">
                            <strong>Account Name:</strong>
                            <span>{account.accountName || 'N/A'}</span>
                        </div>
                        <div className="detailItem">
                            <strong>Account Type:</strong>
                            <span>{capitalize(account.accountType)}</span>
                        </div>
                        <div className="detailItem">
                            <strong>Sub-Type:</strong>
                            <span>{account.subType || 'N/A'}</span>
                        </div>
                        <div className="detailItem">
                            <strong>Normal Balance:</strong>
                            <span>{capitalize(account.normalBalance)}</span>
                        </div>
                        <div className="detailItem">
                            <strong>Status:</strong>
                            {/* Display status with a semantic tag for visual distinction. */}
                            <span className={`statusTag ${account.isActive ? 'active' : 'inactive'}`}>
                                {account.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="detailItem fullWidth">
                            <strong>Description:</strong>
                            <span>{account.description || 'N/A'}</span>
                        </div>
                        <div className="detailItem">
                            <strong>Created At:</strong>
                            {/* Format createdAt date for user-friendly display. */}
                            <span>{new Date(account.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="detailItem">
                            <strong>Last Updated:</strong>
                            {/* Format updatedAt date for user-friendly display. */}
                            <span>{new Date(account.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {account.recordedBy && ( // Only show 'Recorded By' if the data is available (populated)
                            <div className="detailItem">
                                <strong>Recorded By:</strong>
                                {/* Assuming `recordedBy` is populated with at least a `username` field. */}
                                <span>{account.recordedBy.username || 'N/A'}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="modalFooter">
                    {/* NEW: Link to Account Activity Log */}
                    <Link
                        to={`/accounting/accounts/${account._id}/account-activity-logs`}
                        className="viewActivityLogBtn" // Add appropriate styling in your CSS
                        onClick={onClose} // Close the modal when the link is clicked
                    >
                        View Activity Log
                    </Link>
                    {/* Close button in the footer for consistent modal interaction. */}
                    <button className="closeBtn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ViewAccountModal;