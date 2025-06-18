import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
// Import the centralized API function for updating accounts
import { updateAccount } from '../../../../../services/api/accountApi';
import './EditAccountModal.css'; // Reusing a general modal CSS (you might need to create this or add to ChartOfAccountsPage.css)

/**
 * @component EditAccountModal
 * @description A modal form for editing an existing account in the Chart of Accounts.
 * It pre-populates the form with the provided `account` data and allows submission
 * of updates via a PUT request using the centralized API service.
 *
 * @param {Object} props - Component props
 * @param {Object} props.account - The account object to be edited.
 * @param {function} props.onClose - Callback function to close the modal.
 * @param {function} props.onAccountUpdated - Callback function to notify parent of successful account update.
 */
const EditAccountModal = ({ account, onClose, onAccountUpdated }) => {
    // State for the form data, initialized with the provided account's details
    const [formData, setFormData] = useState({
        accountCode: account.accountCode || '',
        accountName: account.accountName || '',
        accountType: account.accountType || 'Asset',
        subType: account.subType || '',
        description: account.description || '',
        normalBalance: account.normalBalance || 'Debit',
        isActive: account.isActive !== undefined ? account.isActive : true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Update form data if the `account` prop changes (e.g., if re-opening modal for another account)
    useEffect(() => {
        if (account) {
            setFormData({
                accountCode: account.accountCode || '',
                accountName: account.accountName || '',
                accountType: account.accountType || 'Asset',
                subType: account.subType || '',
                description: account.description || '',
                normalBalance: account.normalBalance || 'Debit',
                isActive: account.isActive !== undefined ? account.isActive : true,
            });
        }
    }, [account]);

    /**
     * @function handleChange
     * @description Handles changes in the form inputs.
     * Updates the `formData` state. Automatically sets `normalBalance`
     * based on the selected `accountType`.
     * @param {Object} e - The event object from the input change.
     */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => {
            const updatedData = {
                ...prevData,
                [name]: type === 'checkbox' ? checked : value
            };

            // Automatically set normalBalance based on accountType
            if (name === 'accountType') {
                if (['Asset', 'Expense'].includes(value)) {
                    updatedData.normalBalance = 'Debit';
                } else if (['Liability', 'Equity', 'Revenue'].includes(value)) {
                    updatedData.normalBalance = 'Credit';
                }
            }
            return updatedData;
        });
    };

    /**
     * @function handleSubmit
     * @description Handles the submission of the edit account form.
     * Sends a PUT request to the backend to update the account using the centralized API service.
     * On success, notifies the parent and closes the modal.
     * @param {Object} e - The event object from the form submission.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use the centralized updateAccount function
            const updatedAccount = await updateAccount(account._id, formData);
            toast.success(`Account "${updatedAccount.accountName}" updated successfully!`);
            onAccountUpdated(); // Notify parent to refresh account list
            onClose(); // Close the modal
        } catch (err) {
            // Axios interceptor in api.js handles 401/403 and general errors.
            // This catch is for other specific errors or custom messages.
            console.error("EditAccountModal: Error updating account:", err);
            setError(err.message || "Failed to update account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Prevent modal from closing when clicking inside
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="modalContent" onClick={handleContentClick}>
                <div className="modalHeader">
                    <h2 className="modalTitle">Edit Account: {account.accountName}</h2>
                    <button className="modalCloseButton" onClick={onClose}>&times;</button>
                </div>
                <div className="modalBody">
                    {error && <div className="modalErrorMessage">{error}</div>}
                    <form onSubmit={handleSubmit} className="editAccountFormModal">
                        <div className="formGroup">
                            <label htmlFor="editAccountCode">Account Code:</label>
                            <input
                                type="text"
                                id="editAccountCode"
                                name="accountCode"
                                value={formData.accountCode}
                                onChange={handleChange}
                                className="formInput"
                                placeholder="e.g., 1010"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="editAccountName">Account Name:</label>
                            <input
                                type="text"
                                id="editAccountName"
                                name="accountName"
                                value={formData.accountName}
                                onChange={handleChange}
                                className="formInput"
                                placeholder="e.g., Cash"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="editAccountType">Account Type:</label>
                            <select
                                id="editAccountType"
                                name="accountType"
                                value={formData.accountType}
                                onChange={handleChange}
                                className="formSelect"
                                required
                                disabled={loading}
                            >
                                <option value="Asset">Asset</option>
                                <option value="Liability">Liability</option>
                                <option value="Equity">Equity</option>
                                <option value="Revenue">Revenue</option>
                                <option value="Expense">Expense</option>
                            </select>
                        </div>
                        <div className="formGroup">
                            <label htmlFor="editNormalBalance">Normal Balance:</label>
                            <select
                                id="editNormalBalance"
                                name="normalBalance"
                                value={formData.normalBalance}
                                onChange={handleChange}
                                className="formSelect"
                                required
                                disabled // Disabled because it's set automatically based on accountType
                            >
                                <option value="Debit">Debit</option>
                                <option value="Credit">Credit</option>
                            </select>
                        </div>
                        <div className="formGroup">
                            <label htmlFor="editSubType">Sub-Type (Optional):</label>
                            <input
                                type="text"
                                id="editSubType"
                                name="subType"
                                value={formData.subType}
                                onChange={handleChange}
                                className="formInput"
                                placeholder="e.g., Current Asset"
                                disabled={loading}
                            />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="editDescription">Description (Optional):</label>
                            <textarea
                                id="editDescription"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="formTextarea"
                                rows="2"
                                placeholder="A brief explanation of this account"
                                disabled={loading}
                            ></textarea>
                        </div>
                        <div className="formGroup checkboxGroup">
                            <input
                                type="checkbox"
                                id="editIsActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <label htmlFor="editIsActive">Is Active</label>
                        </div>
                        <button type="submit" className="submitBtn" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditAccountModal;