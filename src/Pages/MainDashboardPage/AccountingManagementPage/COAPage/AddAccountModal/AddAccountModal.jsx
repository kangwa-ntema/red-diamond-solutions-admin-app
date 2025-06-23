// src/Pages/MainDashboardPage/AccountingManagementDashboard/COADashboard/AddAccountModal/AddAccountModal.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
// Import the centralized API function for adding accounts from the consolidated accountingApi
import { addAccount } from '../../../../../services/api/accountApi'; // Corrected import path

/**
 * @component AddAccountModal
 * @description A modal form for adding a new account to the Chart of Accounts.
 * It receives `onClose` to dismiss the modal and `onAccountAdded` to trigger
 * a refresh or update in the parent component upon successful account creation.
 * It handles its own form state and submission logic using the centralized API service.
 *
 * @param {Object} props - Component props
 * @param {function} props.onClose - Callback function to close the modal.
 * @param {function} props.onAccountAdded - Callback function to notify parent of successful account addition.
 */
const AddAccountModal = ({ onClose, onAccountAdded }) => {
    // State for the new account form data
    const [newAccountFormData, setNewAccountFormData] = useState({
        accountCode: '', // User can provide, or leave blank for auto-generation by backend
        accountName: '',
        accountType: 'Asset', // Default type
        subType: '',
        description: '',
        normalBalance: 'Debit', // Default normal balance for Asset, will update with accountType
        isActive: true,
    });
    const [loading, setLoading] = useState(false); // Loading state for form submission
    const [error, setError] = useState(null); // Error state for form submission

    /**
     * @function handleNewAccountChange
     * @description Handles changes in the form inputs.
     * Updates the `newAccountFormData` state. Automatically sets `normalBalance`
     * based on the selected `accountType`.
     * @param {Object} e - The event object from the input change.
     */
    const handleNewAccountChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewAccountFormData(prevData => {
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
     * @function handleAddAccountSubmit
     * @description Handles the submission of the new account form.
     * Sends a POST request to the backend to create a new account using the centralized API service.
     * On success, notifies the parent and closes the modal.
     * @param {Object} e - The event object from the form submission.
     */
    const handleAddAccountSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null); // Clear previous errors

        try {
            // Trim whitespace from string inputs
            const submissionData = {
                ...newAccountFormData,
                accountCode: newAccountFormData.accountCode.trim(),
                accountName: newAccountFormData.accountName.trim(),
                subType: newAccountFormData.subType.trim(),
                description: newAccountFormData.description.trim(),
            };

            // If accountCode is an empty string after trimming, send it as undefined
            // so the backend can auto-generate if configured to do so.
            if (submissionData.accountCode === '') {
                delete submissionData.accountCode;
            }

            // Use the centralized addAccount function from accountingApi
            const addedAccount = await addAccount(submissionData);
            toast.success(`Account "${addedAccount.accountName}" added successfully with code: ${addedAccount.accountCode || 'auto-generated'}!`); // Show generated code
            onAccountAdded(); // Notify parent to refresh account list
            onClose(); // Close the modal
        } catch (err) {
            // The `handleApiError` in `utils.js` (used by accountingApi) should already show a toast.
            // This catch block sets a local error message for display within the modal.
            console.error("AddAccountModal: Error adding account:", err);
            const errorMessage = err.message || "Failed to add account. Please try again.";
            setError(errorMessage);
            // Optionally, if `handleApiError` does not toast or you want a specific modal toast:
            // toast.error(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // Prevent modal from closing when clicking inside
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // Modal overlay
        <div className="modalOverlay" onClick={onClose}>
            {/* Modal content area */}
            <div className="modalContent" onClick={handleContentClick}>
                <div className="modalHeader">
                    <h2 className="modalTitle">Add New Account</h2>
                    <button className="modalCloseButton" onClick={onClose} disabled={loading}>&times;</button>
                </div>
                <div className="modalBody">
                    {error && <div className="modalErrorMessage">{error}</div>}
                    <form onSubmit={handleAddAccountSubmit} className="addAccountFormModal">
                        <div className="formGroup">
                            <label htmlFor="accountCode">Account Code:</label>
                            <input
                                type="text"
                                id="accountCode"
                                name="accountCode"
                                value={newAccountFormData.accountCode}
                                onChange={handleNewAccountChange}
                                className="formInput"
                                placeholder="Optional: Leave blank for auto-generation"
                                disabled={loading} // Enable/disable based on loading state
                            />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="accountName">Account Name:</label>
                            <input
                                type="text"
                                id="accountName"
                                name="accountName"
                                value={newAccountFormData.accountName}
                                onChange={handleNewAccountChange}
                                className="formInput"
                                placeholder="e.g., Cash"
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="accountType">Account Type:</label>
                            <select
                                id="accountType"
                                name="accountType"
                                value={newAccountFormData.accountType}
                                onChange={handleNewAccountChange}
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
                            <label htmlFor="normalBalance">Normal Balance:</label>
                            <select
                                id="normalBalance"
                                name="normalBalance"
                                value={newAccountFormData.normalBalance}
                                onChange={handleNewAccountChange}
                                className="formSelect"
                                required
                                disabled={true} // Disabled because it's set automatically based on accountType
                            >
                                <option value="Debit">Debit</option>
                                <option value="Credit">Credit</option>
                            </select>
                        </div>
                        <div className="formGroup">
                            <label htmlFor="subType">Sub-Type (Optional):</label>
                            <input
                                type="text"
                                id="subType"
                                name="subType"
                                value={newAccountFormData.subType}
                                onChange={handleNewAccountChange}
                                className="formInput"
                                placeholder="e.g., Current Asset"
                                disabled={loading}
                            />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="description">Description (Optional):</label>
                            <textarea
                                id="description"
                                name="description"
                                value={newAccountFormData.description}
                                onChange={handleNewAccountChange}
                                className="formTextarea"
                                rows="2"
                                placeholder="A brief explanation of this account"
                                disabled={loading}
                            ></textarea>
                        </div>
                        <div className="formGroup checkboxGroup">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={newAccountFormData.isActive}
                                onChange={handleNewAccountChange}
                                disabled={loading}
                            />
                            <label htmlFor="isActive">Is Active</label>
                        </div>
                        <button type="submit" className="submitBtn" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Account'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddAccountModal;
