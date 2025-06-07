import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
// No direct navigation in modal, but need token utility
import { getToken, clearAuthData } from '../../../utils/authUtils'; // Corrected path assuming it's up one level from 'components'

/**
 * @component AddAccountModal
 * @description A modal form for adding a new account to the Chart of Accounts.
 * It receives `onClose` to dismiss the modal and `onAccountAdded` to trigger
 * a refresh or update in the parent component upon successful account creation.
 * It handles its own form state and submission logic.
 *
 * @param {Object} props - Component props
 * @param {function} props.onClose - Callback function to close the modal.
 * @param {function} props.onAccountAdded - Callback function to notify parent of successful account addition.
 * @param {string} props.backendUrl - The base URL for backend API calls.
 * @param {function} props.navigate - The navigate function from react-router-dom, passed for auth redirects.
 */
const AddAccountModal = ({ onClose, onAccountAdded, backendUrl, navigate }) => {
    // State for the new account form data
    const [newAccountFormData, setNewAccountFormData] = useState({
        accountCode: '', // This will be left blank by the user for auto-generation
        accountName: '',
        accountType: 'Asset', // Default type
        subType: '',
        description: '',
        normalBalance: 'Debit', // Default normal balance for Asset
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
     * Sends a POST request to the backend to create a new account.
     * On success, notifies the parent and closes the modal.
     * @param {Object} e - The event object from the form submission.
     */
    const handleAddAccountSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/'); // Redirect to login if token is missing
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(newAccountFormData)
            });

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/login');
                toast.error('Authentication expired or unauthorized. Please log in again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add account.');
            }

            const addedAccount = await response.json();
            toast.success(`Account "${addedAccount.accountName}" added successfully with code: ${addedAccount.accountCode}!`); // Show generated code
            onAccountAdded(); // Notify parent to refresh account list
            onClose(); // Close the modal
        } catch (err) {
            console.error("AddAccountModal: Error adding account:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error adding account: ${err.message || "Network error"}`);
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
                    <button className="modalCloseButton" onClick={onClose}>&times;</button>
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
                                value={newAccountFormData.accountCode} // Will be empty as user doesn't enter it
                                onChange={handleNewAccountChange} // Still needed for internal state management for clearing
                                className="formInput"
                                placeholder="Auto-generated based on type" // NEW: Placeholder
                                readOnly={true} // NEW: Make it read-only
                                disabled={loading} // Keep disabled during loading
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
                                disabled // Disabled because it's set automatically based on accountType
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
