import React, { useState } from 'react';
import { getToken } from '../utils/authUtils.js';
import './RecordPaymentModal.css';
import { toast } from 'react-toastify'; // Ensure react-toastify is installed and configured in your App.jsx

const RecordPaymentModal = ({ loanId, customerId, customerName, customerPhoneNumber, customerEmail, currentBalanceDue, onClose, onPaymentRecorded }) => {
    // Props:
    // loanId: ID of the loan being paid
    // customerId: ID of the customer (for manual payments)
    // customerName: Name of the customer (for display and electronic payment)
    // customerPhoneNumber: Customer's phone number (for Airtel Money, can be pre-filled)
    // customerEmail: Customer's email (for Airtel Money)
    // currentBalanceDue: Current outstanding balance of the loan
    // onClose: Function to close the modal
    // onPaymentRecorded: Callback function after a payment is successfully recorded/initiated

    const today = new Date().toISOString().split('T')[0]; // Current date for default
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(today);
    const [method, setMethod] = useState('Cash'); // Default payment method
    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(customerPhoneNumber || ''); // Initialize with customer's phone or empty
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Assuming VITE_BACKEND_URL is set in your .env.local or .env file for React
    // e.g., VITE_BACKEND_URL=http://localhost:5000
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''; // Fallback to empty string if not set

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const token = getToken();
        if (!token) {
            setError('Authentication required. Please log in.');
            setLoading(false);
            toast.error('Authentication required. Please log in.');
            return;
        }

        let apiEndpoint;
        let paymentData;

        // Determine which backend endpoint to call based on the selected method
        if (method === 'Airtel Money') {
            apiEndpoint = `${BACKEND_URL}/api/payments/initiate`;

            // Basic phone number formatting for Zambia (097xxxxxxx -> 26097xxxxxxx)
            let formattedPhoneNumber = phoneNumber.trim();
            if (formattedPhoneNumber.startsWith('0') && formattedPhoneNumber.length === 10) {
                formattedPhoneNumber = '260' + formattedPhoneNumber.substring(1);
            } else if (formattedPhoneNumber.length === 9 && formattedPhoneNumber.startsWith('9')) {
                // If it's a 9-digit number starting with 9 (e.g., 97xxxxxxx), prepend 260
                formattedPhoneNumber = '260' + formattedPhoneNumber;
            }


            paymentData = {
                loanId,
                amount: parseFloat(amount), // Ensure amount is a number
                paymentMethod: 'Airtel Money', // This is the method sent to the gateway
                phoneNumber: formattedPhoneNumber, // Use the formatted number from the form input
                customerName: customerName, // Pass customer name
                customerEmail: customerEmail // Pass customer email
            };

            // Additional validation for electronic payments
            if (!paymentData.phoneNumber) {
                setError('Customer Mobile Money Number is required for Airtel Money payments.');
                setLoading(false);
                toast.error('Customer Mobile Money Number is required for Airtel Money payments.');
                return;
            }
            // Basic validation for Zambian numbers (12 digits for 26097xxxxxxx)
            if (formattedPhoneNumber.length !== 12 || !formattedPhoneNumber.startsWith('260')) {
                setError('Please enter a valid Zambian mobile money number (e.g., 0971234567 or 260971234567).');
                setLoading(false);
                toast.error('Please enter a valid Zambian mobile money number.');
                return;
            }

        } else {
            // For manual payments (Cash, Bank Transfer, Other)
            apiEndpoint = `${BACKEND_URL}/api/payments`;
            paymentData = {
                loanId,
                customerId, // This is needed for the manual payment recording route
                amount: parseFloat(amount), // Ensure amount is a number
                date,
                method,
                notes
            };
        }

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });

            const data = await response.json();

            if (!response.ok) {
                // If response.ok is false, it means HTTP status is 4xx or 5xx
                throw new Error(data.message || 'Failed to process payment.');
            }

            console.log('Payment process successful:', data);
            toast.success(data.message || 'Payment successfully processed!');
            // For electronic payments, data.paymentId is the _id of the pending payment record
            // For manual payments, data.payment is the full payment object
            onPaymentRecorded(data.paymentId || data.payment?._id); // Pass the relevant ID/ref
            onClose(); // Close the modal

        } catch (err) {
            console.error('Error during payment process:', err);
            setError(err.message || 'Network error or server unavailable.');
            toast.error(err.message || 'Network error or server unavailable.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modalOverlay">
            <div className="modalContent">
                <button className="modalCloseButton" onClick={onClose}>&times;</button>
                <h2 className="modalHeadline">Record Payment for {customerName}</h2>
                <p className="modalSubheadline">Loan ID: {loanId.substring(0, 8)}...</p>
                <p className="modalCurrentBalance">Current Balance Due: ZMW{parseFloat(currentBalanceDue).toFixed(2)}</p>

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
                            step="0.01"
                            min="0.01"
                            required
                            disabled={loading}
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
                            required={method !== 'Airtel Money'} // Date is less relevant for instant electronic
                            disabled={loading || method === 'Airtel Money'} // Disable for electronic payments
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
                            disabled={loading}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Airtel Money">Airtel Money</option> {/* Added Airtel Money option */}
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Conditional rendering for phone number field */}
                    {method === 'Airtel Money' && (
                        <div className="formGroup">
                            <label htmlFor="phoneNumber">Customer Mobile Money Number:</label>
                            <input
                                type="text"
                                id="phoneNumber"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="e.g., 0971234567 or 260971234567"
                                className="formInput"
                                required={method === 'Airtel Money'} // Make required only for Airtel Money
                                disabled={loading}
                            />
                        </div>
                    )}

                    <div className="formGroup">
                        <label htmlFor="notes">Notes (Optional):</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="formTextarea"
                            rows="3"
                            maxLength="200"
                            disabled={loading}
                        ></textarea>
                    </div>

                    <button type="submit" className="submitPaymentBtn" disabled={loading}>
                        {loading ? 'Processing...' : (method === 'Airtel Money' ? 'Initiate Airtel Payment' : 'Record Manual Payment')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
