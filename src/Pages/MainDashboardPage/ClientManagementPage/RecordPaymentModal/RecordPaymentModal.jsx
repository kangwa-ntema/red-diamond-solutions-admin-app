import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './RecordPaymentModal.css';

// Import API functions from your centralized api.js file
import { recordPayment, initiateAirtelMoneyPayment } from '../../../../services/api';

const RecordPaymentModal = ({
    loanId,
    clientId, // Renamed from customerId to clientId for consistency with backend
    clientName, // Renamed from customerName
    clientPhoneNumber, // Renamed from customerPhoneNumber
    clientEmail, // Renamed from customerEmail
    currentBalanceDue,
    onClose,
    onPaymentRecorded
}) => {
    const today = new Date().toISOString().split('T')[0];
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(today);
    const [method, setMethod] = useState('Cash'); // Default payment method
    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(clientPhoneNumber || ''); // Initialize with client's phone or empty
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Effect to update phone number if clientPhoneNumber prop changes (e.g., if modal is reused)
    useEffect(() => {
        setPhoneNumber(clientPhoneNumber || '');
    }, [clientPhoneNumber]);

    const formatZambianPhoneNumber = (num) => {
        let formattedNum = num.trim();
        // Remove common non-digit characters if present
        formattedNum = formattedNum.replace(/[^0-9]/g, '');

        // If it starts with '0' and is 10 digits (e.g., 097xxxxxxx), prepend '260'
        if (formattedNum.startsWith('0') && formattedNum.length === 10) {
            formattedNum = '260' + formattedNum.substring(1);
        }
        // If it's a 9-digit number starting with '9' (e.g., 97xxxxxxx), prepend '260'
        else if (formattedNum.length === 9 && formattedNum.startsWith('9')) {
            formattedNum = '260' + formattedNum;
        }
        // If it's already 260xxxxxxxxx (12 digits), it's probably good
        // Add more specific validation for mobile money network prefixes if needed

        return formattedNum;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            let responseData; // To store the successful response data
            let transactionRef = null; // To store a transaction ID if available

            if (method === 'Airtel Money') {
                const formattedPhoneNumber = formatZambianPhoneNumber(phoneNumber);

                if (!formattedPhoneNumber) {
                    throw new Error('Customer Mobile Money Number is required for Airtel Money payments.');
                }
                if (formattedPhoneNumber.length !== 12 || !formattedPhoneNumber.startsWith('260')) {
                    throw new Error('Please enter a valid Zambian mobile money number (e.g., 0971234567 or 260971234567).');
                }
                if (parseFloat(amount) <= 0) {
                    throw new Error('Payment amount must be greater than zero.');
                }
                if (parseFloat(amount) > currentBalanceDue) {
                    throw new Error(`Payment amount (ZMW${parseFloat(amount).toFixed(2)}) cannot exceed the current balance due (ZMW${currentBalanceDue.toFixed(2)}).`);
                }


                const paymentData = {
                    loanId,
                    amount: parseFloat(amount),
                    paymentMethod: 'Airtel Money',
                    phoneNumber: formattedPhoneNumber,
                    clientName: clientName,
                    clientEmail: clientEmail
                };

                // Use the centralized API function for Airtel Money initiation
                responseData = await initiateAirtelMoneyPayment(paymentData);
                transactionRef = responseData.transactionId || responseData.paymentId; // Adjust based on your backend response
                toast.info(responseData.message || `Electronic payment initiated. Transaction ID: ${transactionRef}. Awaiting confirmation.`);

            } else {
                // For manual payments (Cash, Bank Transfer, Other)
                if (parseFloat(amount) <= 0) {
                    throw new Error('Payment amount must be greater than zero.');
                }
                if (parseFloat(amount) > currentBalanceDue) {
                    throw new Error(`Payment amount (ZMW${parseFloat(amount).toFixed(2)}) cannot exceed the current balance due (ZMW${currentBalanceDue.toFixed(2)}).`);
                }

                const paymentData = {
                    loanId,
                    clientId, // Ensure clientId is passed for manual payments
                    amount: parseFloat(amount),
                    date,
                    method,
                    notes
                };

                // Use the centralized API function for recording manual payment
                responseData = await recordPayment(loanId, paymentData);
                toast.success(responseData.message || 'Manual payment recorded successfully!');
            }

            // Call the callback provided by the parent component
            onPaymentRecorded(transactionRef); // Pass transactionRef for electronic, null for manual
            onClose(); // Close the modal

        } catch (err) {
            console.error('Error during payment process:', err);
            // `err` here should be the string message thrown by api.js's handleApiError
            setError(err);
            toast.error(err);

            // You might want to explicitly handle authentication errors here if not already
            // handled by a global Axios interceptor with automatic redirection.
            // For example: if (err.includes("Authentication expired")) { navigate("/login"); }
            // However, with the interceptor approach, this should already be managed globally.
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modalOverlay">
            <div className="modalContent">
                <button className="modalCloseButton" onClick={onClose}>&times;</button>
                <h2 className="modalHeadline">Record Payment for {clientName}</h2>
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
                            required={method !== 'Airtel Money'}
                            disabled={loading || method === 'Airtel Money'}
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
                            <option value="Airtel Money">Airtel Money</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

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
                                required={method === 'Airtel Money'}
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