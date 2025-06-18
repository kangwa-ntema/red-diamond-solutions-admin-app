import React from 'react';
import './ViewAccountModal.css'; // Reusing a general modal CSS (you might need to create this or add to ChartOfAccountsPage.css)

/**
 * @component ViewAccountModal
 * @description A read-only modal to display detailed information about a selected accounting account.
 *
 * @param {Object} props - Component props
 * @param {Object} props.account - The account object to display.
 * @param {function} props.onClose - Callback function to close the modal.
 */
const ViewAccountModal = ({ account, onClose }) => {
    if (!account) return null; // Don't render if no account is provided

    // Helper to capitalize first letter
    const capitalize = (s) => {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="modalContent" onClick={e => e.stopPropagation()}>
                <div className="modalHeader">
                    <h2 className="modalTitle">Account Details: {account.accountName}</h2>
                    <button className="modalCloseButton" onClick={onClose}>&times;</button>
                </div>
                <div className="modalBody">
                    <div className="accountDetailGrid">
                        <div className="detailItem">
                            <strong>Account Code:</strong>
                            <span>{account.accountCode}</span>
                        </div>
                        <div className="detailItem">
                            <strong>Account Name:</strong>
                            <span>{account.accountName}</span>
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
                            <span>{new Date(account.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="detailItem">
                            <strong>Last Updated:</strong>
                            <span>{new Date(account.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {account.recordedBy && ( // Only show if recordedBy is populated (which it should be from backend)
                            <div className="detailItem">
                                <strong>Recorded By:</strong>
                                <span>{account.recordedBy.username || 'N/A'}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="modalFooter">
                    <button className="closeBtn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ViewAccountModal;