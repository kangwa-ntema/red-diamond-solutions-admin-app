import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Import functions from your centralized API service
import { getLoanById, getAllClients, updateLoan } from '../../../../services/api'; 
// Assuming authUtils.js and clearAuthData are still needed for manual logout on severe auth failures
import { clearAuthData } from '../../../../utils/authUtils'; 

import './EditLoanForm.css'; // Import your CSS file

const EditLoanForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        client: '',
        loanAmount: '',
        interestRate: '',
        loanTerm: '',
        termUnit: 'months', // Default to 'months'
        startDate: '',
        dueDate: '',
        paymentsMade: 0, // Initialize as number for calculations
        balanceDue: '',
        totalRepaymentAmount: '',
        status: 'pending', // Default to 'pending'
        description: '',
        collateralType: '',
        collateralValue: '',
        collateralDescription: ''
    });
    const [clients, setClients] = useState([]); // Renamed to setClients for consistency
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [interestAmount, setInterestAmount] = useState(''); // State for calculated interest amount

    // --- Data Fetching Effect ---
    // Uses useCallback to memoize the fetch function and prevent unnecessary re-renders/loops
    const fetchLoanAndClients = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch clients using the API service
            const clientsData = await getAllClients();
            setClients(clientsData.clients); 

            // Fetch Loan by ID using the API service
            const loanData = await getLoanById(id);

            // Format dates for input fields
            const formattedStartDate = loanData.startDate ? new Date(loanData.startDate).toISOString().split('T')[0] : '';
            const formattedDueDate = loanData.dueDate ? new Date(loanData.dueDate).toISOString().split('T')[0] : '';

            // Ensure client is an ID string (if populated as object)
            const clientId = loanData.client?._id || loanData.client;

            setFormData({
                client: clientId,
                loanAmount: loanData.loanAmount || '',
                interestRate: loanData.interestRate || '',
                loanTerm: loanData.loanTerm || '',
                termUnit: loanData.termUnit || 'months',
                startDate: formattedStartDate,
                dueDate: formattedDueDate, 
                paymentsMade: loanData.paymentsMade || 0,
                balanceDue: loanData.balanceDue || '', 
                totalRepaymentAmount: loanData.totalRepaymentAmount || '', 
                status: loanData.status || 'pending',
                description: loanData.description || '',
                collateralType: loanData.collateralType || '',
                collateralValue: loanData.collateralValue || '',
                collateralDescription: loanData.collateralDescription || ''
            });

        } catch (err) {
            // The API interceptor should handle 401, but we catch other errors here
            console.error("Error fetching data:", err);
            toast.error(err.message || "Failed to load loan data.");
            setError(err.message || "Network error or server unavailable.");
            // If the error is an authorization issue not caught by interceptor, redirect
            if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
                 clearAuthData(); // Clear client-side auth data
                 navigate('/landingPage'); // Redirect to login
            }
        } finally {
            setLoading(false);
        }
    }, [id, navigate]); // Dependencies for useCallback

    useEffect(() => {
        fetchLoanAndClients();
    }, [fetchLoanAndClients]); // Run effect when fetchLoanAndClients changes

    // --- Handle Form Field Changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // --- Calculate Loan Details (Total Repayment, Balance Due, Due Date, Interest Amount) ---
    useEffect(() => {
        const loanAmt = parseFloat(formData.loanAmount);
        const interestRate = parseFloat(formData.interestRate);
        const loanTerm = parseInt(formData.loanTerm);
        const startDate = formData.startDate;
        const paymentsMade = parseFloat(formData.paymentsMade || 0);

        let calculatedTotalRepaymentAmount = '';
        let calculatedBalanceDue = '';
        let calculatedDueDate = '';
        let calculatedInterestAmount = '';

        if (!isNaN(loanAmt) && !isNaN(interestRate) && interestRate >= 0) {
            const totalInterest = loanAmt * (interestRate / 100);
            calculatedInterestAmount = totalInterest.toFixed(2);

            calculatedTotalRepaymentAmount = (loanAmt + totalInterest).toFixed(2);
            calculatedBalanceDue = (parseFloat(calculatedTotalRepaymentAmount) - paymentsMade).toFixed(2);
        }

        // Calculate Due Date
        if (startDate && loanTerm > 0) {
            const start = new Date(startDate);
            let dueDate = new Date(startDate);

            switch (formData.termUnit) {
                case 'days':
                    dueDate.setDate(start.getDate() + loanTerm);
                    break;
                case 'weeks':
                    dueDate.setDate(start.getDate() + loanTerm * 7);
                    break;
                case 'months':
                    dueDate.setMonth(start.getMonth() + loanTerm);
                    // Adjust day if month overflowed (e.g., Jan 31 + 1 month = Feb 28/29)
                    if (dueDate.getDate() !== start.getDate()) {
                        dueDate.setDate(0); // Set to last day of previous month
                    }
                    break;
                case 'years':
                    dueDate.setFullYear(start.getFullYear() + loanTerm);
                    // Adjust day if month overflowed (e.g., Feb 29 in leap year + 1 year = Feb 28)
                    if (dueDate.getMonth() !== start.getMonth()) {
                        dueDate.setDate(0); // Set to last day of previous month
                    }
                    break;
                default:
                    break;
            }
            calculatedDueDate = dueDate.toISOString().split('T')[0];
        }

        // Update formData and interestAmount states if values have changed
        setFormData(prevData => {
            const newFormData = { ...prevData };
            let changed = false;

            if (newFormData.totalRepaymentAmount !== calculatedTotalRepaymentAmount) {
                newFormData.totalRepaymentAmount = calculatedTotalRepaymentAmount;
                changed = true;
            }
            if (newFormData.balanceDue !== calculatedBalanceDue) {
                newFormData.balanceDue = calculatedBalanceDue;
                changed = true;
            }
            if (newFormData.dueDate !== calculatedDueDate) {
                newFormData.dueDate = calculatedDueDate;
                changed = true;
            }

            return changed ? newFormData : prevData;
        });

        if (interestAmount !== calculatedInterestAmount) {
            setInterestAmount(calculatedInterestAmount);
        }

    }, [formData.loanAmount, formData.interestRate, formData.loanTerm, formData.termUnit, formData.startDate, formData.paymentsMade, interestAmount]);


    // --- Handle Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.client || !formData.loanAmount || !formData.interestRate || !formData.loanTerm || !formData.dueDate) {
            toast.error('Please fill in all required fields (client, Loan Amount, Interest Rate, Loan Term, Due Date).');
            return;
        }

        try {
            // Use the centralized updateLoan API function
            const data = await updateLoan(id, formData);
            
            console.log('Loan updated successfully:', data);
            toast.success('Loan updated successfully!');
            setTimeout(() => {
                navigate(`/loans/${id}`); // Redirect back to loan details page
            }, 1500);
        } catch (err) {
            console.error("Error updating loan:", err);
            // The API interceptor usually shows the toast, but this is a fallback for other errors
            toast.error(err.message || "Network error or server unavailable.");
            setError(err.message || "Network error or server unavailable.");
        }
    };

    if (loading) {
        return <div className="editLoanPageContainer editLoanLoading">Loading loan data...</div>;
    }

    // Display not found if no client (implies no loan) and not loading/error
    if (!formData.client && !loading && !error) {
        return <div className="editLoanPageContainer editLoanNotFound">Loan not found or invalid ID.</div>;
    }

    return (
        <div className="editLoanPageContainer">
            <div className="editLoanPageContent">
                <Link to="/loans" className="editLoanBackLink">
                    Back to Loans Overview
                </Link>
                <h1 className="editLoanHeadline">Edit Loan</h1>

                {error && <div className="editLoanErrorMessage">{error}</div>}

                <form onSubmit={handleSubmit} className="editLoanForm">
                    <div className="editLoanFormGroup">
                        <label htmlFor="client">Client:</label>
                        <select
                            id="client"
                            name="client"
                            value={formData.client}
                            onChange={handleChange}
                            className="editLoanSelect"
                            required
                        >
                            <option value="">Select a client</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>
                                    {client.name} ({client.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="loanAmount">Loan Amount (ZMW):</label>
                        <input
                            type="number"
                            id="loanAmount"
                            name="loanAmount"
                            value={formData.loanAmount}
                            onChange={handleChange}
                            className="editLoanInput"
                            step="0.01"
                            min="0.01"
                            required
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="interestRate">Interest Rate (%):</label>
                        <input
                            type="number"
                            id="interestRate"
                            name="interestRate"
                            value={formData.interestRate}
                            onChange={handleChange}
                            className="editLoanInput"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="loanTerm">Loan Term:</label>
                        <input
                            type="number"
                            id="loanTerm"
                            name="loanTerm"
                            value={formData.loanTerm}
                            onChange={handleChange}
                            className="editLoanInput"
                            min="1"
                            required
                        />
                        <select
                            id="termUnit"
                            name="termUnit"
                            value={formData.termUnit}
                            onChange={handleChange}
                            className="editLoanSelect"
                        >
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                        </select>
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="startDate">Start Date:</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="editLoanInput"
                            required
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="dueDate">Due Date:</label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="editLoanInput"
                            readOnly // Made readOnly as it's calculated
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="paymentsMade">Payments Made (ZMW):</label>
                        <input
                            type="number"
                            id="paymentsMade"
                            name="paymentsMade"
                            value={formData.paymentsMade}
                            onChange={handleChange}
                            className="editLoanInput"
                            step="0.01"
                            min="0"
                            // This field is kept editable to allow manual input of payments made.
                            // The balanceDue calculation will react to changes here.
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="totalRepaymentAmount">Total Repayment (ZMW):</label>
                        <input
                            type="text"
                            id="totalRepaymentAmount"
                            name="totalRepaymentAmount"
                            value={formData.totalRepaymentAmount}
                            onChange={handleChange}
                            className="editLoanInput"
                            readOnly // Made readOnly as it's calculated
                        />
                    </div>

                    {/* New field for calculated Interest Amount */}
                    <div className="editLoanFormGroup">
                        <label htmlFor="interestAmount">Interest Amount (ZMW):</label>
                        <input
                            type="text"
                            id="interestAmount"
                            name="interestAmount"
                            value={interestAmount}
                            className="editLoanInput"
                            readOnly // This field is calculated, not editable
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="balanceDue">Balance Due (ZMW):</label>
                        <input
                            type="text"
                            id="balanceDue"
                            name="balanceDue"
                            value={formData.balanceDue}
                            onChange={handleChange}
                            className="editLoanInput"
                            readOnly // Made readOnly as it's calculated
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="status">Status:</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="editLoanSelect"
                            required
                        >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="overdue">Overdue</option>
                            <option value="default">Default</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="description">Description (Optional):</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="editLoanTextarea"
                            rows="3"
                            maxLength="500"
                            placeholder="e.g., Loan for business expansion, vehicle purchase, etc."
                        ></textarea>
                    </div>

                    {/* --- Collateral Details Section --- */}
                    <section className="collateralSection">
                        <h2 className="collateralHeadline">Collateral Details (Optional)</h2>
                        <div className="editLoanFormGroup">
                            <label htmlFor="collateralType">Collateral Type:</label>
                            <input
                                type="text"
                                id="collateralType"
                                name="collateralType"
                                value={formData.collateralType}
                                onChange={handleChange}
                                className="editLoanInput"
                                placeholder="e.g., Vehicle, Property, Jewelry"
                            />
                        </div>
                        <div className="editLoanFormGroup">
                            <label htmlFor="collateralValue">Collateral Estimated Value (ZMW):</label>
                            <input
                                type="number"
                                id="collateralValue"
                                name="collateralValue"
                                value={formData.collateralValue}
                                onChange={handleChange}
                                className="editLoanInput"
                                step="0.01"
                                min="0"
                                placeholder="e.g., 15000.00"
                            />
                        </div>
                        <div className="editLoanFormGroup">
                            <label htmlFor="collateralDescription">Collateral Description:</label>
                            <textarea
                                id="collateralDescription"
                                name="collateralDescription"
                                value={formData.collateralDescription}
                                onChange={handleChange}
                                className="editLoanTextarea"
                                rows="3"
                                maxLength="500"
                                placeholder="e.g., 2015 Toyota Corolla, VIN: ABC123..., Color: Blue"
                            ></textarea>
                        </div>
                    </section>

                    <div className="editLoanActionButtons">
                        <button type="submit" className="editLoanSubmitBtn">Update Loan</button>
                        <button type="button" onClick={() => navigate(-1)} className="editLoanCancelBtn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditLoanForm;