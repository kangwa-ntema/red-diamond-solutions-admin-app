import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './RecordPaymentModal.css';

// Import API functions from your centralized api.js file
// initiateAirtelMoneyPayment is removed as it's no longer used directly here.
import { recordPayment } from '../../../../services/api/paymentApi'; // Consolidated import for recordPayment

const RecordPaymentModal = ({
    loanId,
    clientId, // Consistent with backend
    clientName,
    currentBalanceDue,
    onClose,
    onPaymentRecorded
}) => {
    // Get today's date in YYYY-MM-DD format for the date input default
    const today = new Date().toISOString().split('T')[0];

    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(today); // Default to today's date
    const [method, setMethod] = useState('Cash'); // Default payment method to 'Cash'
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false); // State for loading/processing indicator
    const [error, setError] = useState(null); // State to display any errors

    // handleSubmit function to process the payment form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        setError(null);    // Clear any previous errors
        setLoading(true);  // Set loading to true to disable form and show processing state

        try {
            const parsedAmount = parseFloat(amount);

            // Client-side validation:
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Payment amount must be a positive number.');
            }
            if (parsedAmount > currentBalanceDue) {
                throw new Error(`Payment amount (ZMW${parsedAmount.toFixed(2)}) cannot exceed the current balance due (ZMW${currentBalanceDue.toFixed(2)}).`);
            }
            if (!date) {
                throw new Error('Payment date is required.');
            }
            if (!method) {
                throw new Error('Payment method is required.');
            }

            // Prepare payment data for the API call
            const paymentData = {
                loanId,
                clientId, // Pass clientId for manual payments
                amount: parsedAmount,
                date,
                method,
                notes // Optional notes
            };

            // Call the API function to record the manual payment
            const responseData = await recordPayment(paymentData);
            toast.success(responseData.message || 'Manual payment recorded successfully!');

            // Call the callback provided by the parent component (e.g., to refresh loan data)
            onPaymentRecorded(); // No transactionRef for manual payments, so don't pass it
            onClose(); // Close the modal upon successful payment recording

        } catch (err) {
            console.error('Error during payment process:', err);
            // Assuming handleApiError or the throw new Error in the try block
            // returns a string message, display it to the user.
            setError(err.message || 'Failed to record payment. Please try again.');
            toast.error(err.message || 'Failed to record payment.');
        } finally {
            setLoading(false); // Always set loading to false when process finishes
        }
    };

    return (
        <div className="modalOverlay">
            <div className="modalContent">
                {/* Close button for the modal */}
                <button className="modalCloseButton" onClick={onClose} disabled={loading}>&times;</button>
                <h2 className="modalHeadline">Record Payment for {clientName}</h2>
                <p className="modalSubheadline">Loan ID: {loanId.substring(0, 8)}...</p>
                <p className="modalCurrentBalance">Current Balance Due: ZMW{parseFloat(currentBalanceDue).toFixed(2)}</p>

                {/* Display error message if present */}
                {error && <div className="modalErrorMessage">{error}</div>}

                <form onSubmit={handleSubmit} className="paymentForm">
                    <div className="formGroup">
                        <label htmlFor="amount">Amount (ZMW):</label>
                        <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="formInput"
                            step="0.01" // Allow decimal values
                            min="0.01" // Minimum amount must be positive
                            required
                            disabled={loading} // Disable input while loading
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="date">Date:</label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="formInput"
                            required
                            disabled={loading} // Disable input while loading
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="method">Payment Method:</label>
                        <select
                            id="method"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="formSelect"
                            required
                            disabled={loading} // Disable select while loading
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            {/* Airtel Money option removed */}
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Removed the conditional rendering for Airtel Money phone number input */}

                    <div className="formGroup">
                        <label htmlFor="notes">Notes (Optional):</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="formTextarea"
                            rows="3"
                            maxLength="200" // Limit note length
                            disabled={loading} // Disable textarea while loading
                        ></textarea>
                    </div>

                    {/* Submit button, dynamically shows text based on loading state */}
                    <button type="submit" className="submitPaymentBtn" disabled={loading}>
                        {loading ? 'Processing...' : 'Record Manual Payment'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
