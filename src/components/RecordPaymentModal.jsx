import React, { useState } from 'react';
import { getToken } from '../utils/authUtils.js'; // Added .js extension
import './RecordPaymentModal.css'; // Added .css extension

const RecordPaymentModal = ({ loanId, customerId, customerName, currentBalanceDue, onClose, onPaymentRecorded }) => {
    const today = new Date().toISOString().split('T')[0]; // Current date for default
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(today);
    const [method, setMethod] = useState('Cash'); // Default payment method
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const token = getToken();
        if (!token) {
            setError('Authentication required. Please log in.');
            setLoading(false);
            return;
        }

        const paymentData = {
            loanId,
            customerId,
            amount: parseFloat(amount), // Ensure amount is a number
            date,
            method,
            notes
        };

        try {
            const response = await fetch(`${BACKEND_URL}/api/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(paymentData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to record payment.');
            }

            const data = await response.json();
            console.log('Payment recorded successfully:', data);
            onPaymentRecorded(); // Call the callback to update parent and close modal
        } catch (err) {
            console.error('Error recording payment:', err);
            setError(err.message || 'Network error or server unavailable.');
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
                            className="formInput" // Fixed typo: lassName changed to className
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
                            className="formInput" // Fixed typo: lassName changed to className
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="method">Payment Method:</label>
                        <select
                            id="method"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="formSelect" // Fixed typo: lassName changed to className
                            required
                            disabled={loading}
                        >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Mobile Money">Mobile Money</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="formGroup">
                        <label htmlFor="notes">Notes (Optional):</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="formTextarea" // Fixed typo: lassName changed to className
                            rows="3"
                            maxLength="200"
                            disabled={loading}
                        ></textarea>
                    </div>

                    <button type="submit" className="submitPaymentBtn" disabled={loading}>
                        {loading ? 'Recording...' : 'Record Payment'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RecordPaymentModal;
