// src/Pages/MainDashboardPage/LoansManagementPage/EditLoanForm/EditLoanForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { getLoanById, updateLoan } from '../../../../services/api/loanApi';
import { getAllClients } from '../../../../services/api/clientApi';

import './EditLoanForm.css';

/**
 * @component EditLoanForm
 * @description Allows administrators to edit the details of an existing loan.
 * It fetches loan and client data, calculates loan financials, and handles form submission.
 */
const EditLoanForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        client: '',
        loanAmount: '',
        interestRate: '',
        loanTerm: '',
        termUnit: 'months',
        startDate: '',
        dueDate: '',
        paymentsMade: 0,
        balanceDue: '',
        totalRepaymentAmount: '',
        status: 'pending',
        description: '',
        collateralType: '',
        collateralValue: '',
        collateralDescription: ''
    });
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // --- Helper to format date strings for input type="date" ---
    // This is a safer way to handle dates that might be null or already ISO strings
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn("Invalid date string encountered during formatting:", dateString);
                return ''; // Return empty string for invalid dates
            }
            return date.toISOString().split('T')[0]; // Format to YYYY-MM-DD
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return '';
        }
    };

    // --- Data Fetching Effect ---
    const fetchLoanAndClients = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const clientsData = await getAllClients();
            setClients(clientsData.clients || []);

            const loanData = await getLoanById(id);

            // CORRECTED LINES: Use formatDateForInput helper
            const formattedStartDate = formatDateForInput(loanData.startDate);
            const formattedDueDate = formatDateForInput(loanData.dueDate);

            const clientId = loanData.client?._id || loanData.client;

            setFormData({
                client: clientId,
                loanAmount: loanData.loanAmount || '',
                interestRate: loanData.interestRate || '',
                loanTerm: loanData.loanTerm || '',
                termUnit: loanData.termUnit || 'months',
                startDate: formattedStartDate, // Use formatted date
                dueDate: formattedDueDate,     // Use formatted date
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
            console.error("Error fetching data:", err);
            setError(err.message || "Failed to load loan data or clients.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchLoanAndClients();
        }
    }, [id, fetchLoanAndClients]);

    // --- Handle Form Field Changes ---
    const handleChange = (e) => {
        const { name, value, type } = e.target;

        setFormData(prevData => {
            let newValue = value;
            if (type === "number" && value !== "") {
                newValue = parseFloat(value);
            } else if (type === "number" && value === "") {
                newValue = "";
            }
            return {
                ...prevData,
                [name]: newValue
            };
        });
    };

    // --- Calculate Loan Details (Total Repayment, Balance Due, Due Date, Interest Amount) ---
    useEffect(() => {
        const loanAmt = parseFloat(formData.loanAmount);
        const interestRate = parseFloat(formData.interestRate);
        const loanTerm = parseInt(formData.loanTerm);
        const startDateString = formData.startDate; // Get the start date string

        let calculatedTotalRepaymentAmount = '';
        let calculatedBalanceDue = '';
        let calculatedDueDate = '';
        let calculatedInterestAmount = '';

        if (!isNaN(loanAmt) && loanAmt > 0 && !isNaN(interestRate) && interestRate >= 0 && !isNaN(loanTerm) && loanTerm > 0) {
            const totalInterest = (loanAmt * (interestRate / 100) * (formData.termUnit === 'months' ? loanTerm : 1));
            calculatedInterestAmount = totalInterest.toFixed(2);
            calculatedTotalRepaymentAmount = (loanAmt + totalInterest).toFixed(2);
            // Ensure paymentsMade is treated as a number for calculation
            const paymentsMade = parseFloat(formData.paymentsMade || 0);
            calculatedBalanceDue = (parseFloat(calculatedTotalRepaymentAmount) - paymentsMade).toFixed(2);
        } else {
            setFormData(prevData => ({
                ...prevData,
                interestAmount: "",
                totalRepaymentAmount: "",
                balanceDue: "",
                dueDate: "",
            }));
        }

        // Calculate Due Date
        if (startDateString && loanTerm > 0 && !isNaN(loanTerm)) {
            // Parse the date string safely for calculation
            const start = new Date(startDateString);
            if (isNaN(start.getTime())) {
                console.warn("Invalid startDate string for due date calculation:", startDateString);
                calculatedDueDate = ''; // Keep due date empty if start date is invalid
            } else {
                let dueDateCalc = new Date(start);

                switch (formData.termUnit) {
                    case 'days':
                        dueDateCalc.setDate(start.getDate() + loanTerm);
                        break;
                    case 'weeks':
                        dueDateCalc.setDate(start.getDate() + loanTerm * 7);
                        break;
                    case 'months':
                        const originalDayMonth = start.getDate();
                        dueDateCalc = new Date(start.getFullYear(), start.getMonth() + loanTerm, originalDayMonth);
                        if (dueDateCalc.getMonth() !== ((start.getMonth() + loanTerm) % 12)) {
                            dueDateCalc = new Date(start.getFullYear(), start.getMonth() + loanTerm + 1, 0);
                        }
                        break;
                    case 'years':
                        const originalDayYear = start.getDate();
                        const originalMonthYear = start.getMonth();
                        dueDateCalc = new Date(start.getFullYear() + loanTerm, originalMonthYear, originalDayYear);
                        if (dueDateCalc.getMonth() !== originalMonthYear) {
                            dueDateCalc = new Date(start.getFullYear() + loanTerm, originalMonthYear + 1, 0);
                        }
                        break;
                    default:
                        break;
                }
                // Format the calculated due date for the input
                calculatedDueDate = dueDateCalc.toISOString().split('T')[0];
            }
        } else if (!startDateString || isNaN(loanTerm) || loanTerm <= 0) {
            calculatedDueDate = ''; // Clear due date if start date or term is invalid
        }

        setFormData(prevData => {
            const updatedData = {};
            let changed = false;

            if (prevData.totalRepaymentAmount !== calculatedTotalRepaymentAmount) {
                updatedData.totalRepaymentAmount = calculatedTotalRepaymentAmount;
                changed = true;
            }
            if (prevData.balanceDue !== calculatedBalanceDue) {
                updatedData.balanceDue = calculatedBalanceDue;
                changed = true;
            }
            if (prevData.dueDate !== calculatedDueDate) {
                updatedData.dueDate = calculatedDueDate;
                changed = true;
            }
            if (prevData.interestAmount !== calculatedInterestAmount) {
                updatedData.interestAmount = calculatedInterestAmount;
                changed = true;
            }

            return changed ? { ...prevData, ...updatedData } : prevData;
        });

    }, [formData.loanAmount, formData.interestRate, formData.loanTerm, formData.termUnit, formData.startDate, formData.paymentsMade]);


    // --- Handle Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (
            !formData.client ||
            isNaN(parseFloat(formData.loanAmount)) || parseFloat(formData.loanAmount) <= 0 ||
            isNaN(parseFloat(formData.interestRate)) || parseFloat(formData.interestRate) < 0 ||
            isNaN(parseInt(formData.loanTerm)) || parseInt(formData.loanTerm) <= 0 ||
            !formData.startDate || !formData.dueDate
        ) {
            const validationError = 'Please fill in all required fields correctly (Loan Amount, Interest Rate, Loan Term must be positive numbers).';
            toast.error(validationError);
            setError(validationError);
            setIsSubmitting(false);
            return;
        }

        try {
            const dataToSubmit = {
                ...formData,
                loanAmount: parseFloat(formData.loanAmount),
                interestRate: parseFloat(formData.interestRate),
                loanTerm: parseInt(formData.loanTerm),
                paymentsMade: parseFloat(formData.paymentsMade),
                balanceDue: parseFloat(formData.balanceDue),
                totalRepaymentAmount: parseFloat(formData.totalRepaymentAmount),
                interestAmount: parseFloat(formData.interestAmount),
                collateralValue: formData.collateralValue === "" ? null : parseFloat(formData.collateralValue),
            };

            const response = await updateLoan(id, dataToSubmit);

            console.log('Loan updated successfully:', response);
            toast.success(response.message || 'Loan updated successfully!');
            setTimeout(() => {
                navigate(`/loans/${id}`);
            }, 1500);
        } catch (err) {
            console.error("Error updating loan:", err);
            toast.error(err.message || "Network error or server unavailable.");
            setError(err.message || "Network error or server unavailable.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="editLoanPageContainer editLoanLoading">Loading loan data...</div>;
    }

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
                            disabled={loading || isSubmitting}
                        >
                            <option value="">Select a client</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>
                                    {client.firstName} {client.lastName} ({client.email})
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
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="interestAmount">Interest Amount (ZMW):</label>
                        <input
                            type="text"
                            id="interestAmount"
                            name="interestAmount"
                            value={formData.interestAmount}
                            className="editLoanInput"
                            readOnly
                            disabled
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
                            disabled={isSubmitting}
                        />
                        <select
                            id="termUnit"
                            name="termUnit"
                            value={formData.termUnit}
                            onChange={handleChange}
                            className="editLoanSelect"
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="dueDate">Due Date (Calculated):</label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate}
                            className="editLoanInput"
                            readOnly
                            disabled
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
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="totalRepaymentAmount">Total Repayment (ZMW):</label>
                        <input
                            type="text"
                            id="totalRepaymentAmount"
                            name="totalRepaymentAmount"
                            value={formData.totalRepaymentAmount}
                            className="editLoanInput"
                            readOnly
                            disabled
                        />
                    </div>

                    <div className="editLoanFormGroup">
                        <label htmlFor="balanceDue">Balance Due (ZMW):</label>
                        <input
                            type="text"
                            id="balanceDue"
                            name="balanceDue"
                            value={formData.balanceDue}
                            className="editLoanInput"
                            readOnly
                            disabled
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
                            disabled={isSubmitting}
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
                            disabled={isSubmitting}
                        ></textarea>
                    </div>

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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                    </section>

                    <div className="editLoanActionButtons">
                        <button type="submit" className="editLoanSubmitBtn" disabled={isSubmitting}>
                            {isSubmitting ? 'Updating...' : 'Update Loan'}
                        </button>
                        <button type="button" onClick={() => navigate(-1)} className="editLoanCancelBtn" disabled={isSubmitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditLoanForm;