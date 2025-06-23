// src/Pages/MainDashboardPage/AccountingManagementPage/IncomeStatementPage/IncomeStatementPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Import the centralized API functions for reports and error handling
import { getIncomeStatementReport } from '../../../../services/api/reportApi'; // Consolidated import for report API
import { handleApiError } from '../../../../services/axiosInstance'; // For consistent error handling

import './IncomeStatementPage.css'; 

/**
 * @component IncomeStatementPage
 * @description Displays the Income Statement (Profit & Loss) report for a selected period.
 * Summarizes revenues and expenses to show net income or loss.
 */
const IncomeStatementPage = () => {
    const navigate = useNavigate(); // Hook for programmatic navigation

    // State to store the fetched income statement data
    const [incomeStatementData, setIncomeStatementData] = useState(null);
    // State for filtering by date range
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [loading, setLoading] = useState(false); // Initial state is false, awaiting user input
    const [error, setError] = useState(null);

    // --- Memoized function to fetch Income Statement data ---
    const fetchAndSetIncomeStatement = useCallback(async () => {
        // Perform client-side validation before making API call
        if (!filterStartDate || !filterEndDate) {
            setIncomeStatementData(null); // Clear previous report data if dates are incomplete
            setLoading(false); // Ensure loading is off
            setError(null); // Clear any previous error
            return;
        }

        // Additional validation for date range logic
        const startDateObj = new Date(filterStartDate);
        const endDateObj = new Date(filterEndDate);

        if (startDateObj > endDateObj) {
            toast.error('Start date cannot be after end date.');
            setIncomeStatementData(null); // Clear data
            setLoading(false);
            setError('Invalid date range: Start date cannot be after end date.');
            return;
        }

        setLoading(true); // Indicate loading has started
        setError(null);   // Clear any previous errors

        try {
            // Call the centralized report API function with a filters object
            const data = await getIncomeStatementReport({ startDate: filterStartDate, endDate: filterEndDate });
            setIncomeStatementData(data);
        } catch (err) {
            // Centralized error handler `handleApiError` will show a toast and potentially redirect.
            console.error("IncomeStatementPage: Error fetching income statement:", err);
            handleApiError(err, "Failed to generate Income Statement report.");
            setIncomeStatementData(null); // Clear previous data on error
            setError(err.message || "Failed to fetch income statement data."); // Set local error for display
        } finally {
            setLoading(false); // Indicate loading has finished
        }
    }, [filterStartDate, filterEndDate]); // Re-fetch whenever filter dates change

    // Use useEffect to trigger fetching when `fetchAndSetIncomeStatement` changes (due to its dependencies)
    useEffect(() => {
        fetchAndSetIncomeStatement();
    }, [fetchAndSetIncomeStatement]);

    // `handleApplyFilters` now simply provides user feedback if dates are missing/invalid,
    // as the `useEffect` handles the actual data fetching based on state changes.
    const handleApplyFilters = () => {
        if (!filterStartDate || !filterEndDate) {
            toast.info('Please select both a start and end date to generate the report.');
        } else if (new Date(filterStartDate) > new Date(filterEndDate)) {
            toast.error('Start date cannot be after end date.');
        }
        // State updates already trigger the useEffect.
    };

    // Handle clearing filter dates
    const handleClearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        // Setting state to empty will trigger `fetchAndSetIncomeStatement`, which will clear the report.
    };

    return (
        <div className="incomeStatementContainer">
            {/* Link back to the main accounting dashboard */}
            <Link to="/accounting" className="incomeStatementBackLink">
                {"<"} Back to Accounting Dashboard
            </Link>
            <h1 className="incomeStatementHeadline">Income Statement (Profit & Loss)</h1>

            {/* Filter Section */}
            <div className="incomeStatementFilters">
                <h3>Select Reporting Period</h3>
                <div className="filterGroup">
                    <label htmlFor="filterStartDate">Start Date:</label>
                    <input
                        type="date"
                        id="filterStartDate"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        required
                        disabled={loading} // Disable input while loading
                    />
                </div>
                <div className="filterGroup">
                    <label htmlFor="filterEndDate">End Date:</label>
                    <input
                        type="date"
                        id="filterEndDate"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        required
                        disabled={loading} // Disable input while loading
                    />
                </div>
                <div className="filterButtons">
                    <button
                        onClick={handleApplyFilters}
                        className="applyFiltersBtn"
                        disabled={loading || !filterStartDate || !filterEndDate} // Disable if loading or dates missing
                    >
                        Generate Report
                    </button>
                    <button
                        onClick={handleClearFilters}
                        className="clearFiltersBtn"
                        disabled={loading} // Disable while loading
                    >
                        Clear Dates
                    </button>
                </div>
            </div>

            {/* Conditional Rendering for Loading, Error, and Data */}
            {loading ? (
                <div className="incomeStatementMessage">Generating Income Statement...</div>
            ) : error ? (
                <div className="incomeStatementErrorMessage">Error: {error}</div>
            ) : !incomeStatementData ? (
                <div className="incomeStatementMessage">
                    Please select a reporting period using the dates above and click 'Generate Report'.
                </div>
            ) : (
                <div className="incomeStatementReport">
                    <h2>For the Period Ending {new Date(incomeStatementData.reportPeriod.endDate).toLocaleDateString()}</h2>

                    <div className="incomeStatementSection">
                        <h3>Revenues</h3>
                        {incomeStatementData.revenues.length === 0 ? (
                            <p className="noDataMessage">No revenue recorded for this period.</p>
                        ) : (
                            <table className="incomeStatementTable">
                                <tbody>
                                    {incomeStatementData.revenues.map(rev => (
                                        <tr key={rev._id}>
                                            <td className="accountNameCol">{rev.accountName} ({rev.accountCode})</td>
                                            <td className="amountCol text-right">ZMW {rev.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="totalRow">
                                        <td><strong>Total Revenues:</strong></td>
                                        <td className="amountCol text-right"><strong>ZMW {incomeStatementData.totalRevenue.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="incomeStatementSection">
                        <h3>Expenses</h3>
                        {incomeStatementData.expenses.length === 0 ? (
                            <p className="noDataMessage">No expenses recorded for this period.</p>
                        ) : (
                            <table className="incomeStatementTable">
                                <tbody>
                                    {incomeStatementData.expenses.map(exp => (
                                        <tr key={exp._id}>
                                            <td className="accountNameCol">{exp.accountName} ({exp.accountCode})</td>
                                            <td className="amountCol text-right">ZMW {exp.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="totalRow">
                                        <td><strong>Total Expenses:</strong></td>
                                        <td className="amountCol text-right"><strong>ZMW {incomeStatementData.totalExpenses.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="netIncomeSection">
                        <p><strong>Net Income (Loss):</strong></p>
                        <p className={`netIncomeAmount ${incomeStatementData.netIncome < 0 ? 'negative-income' : ''}`}>
                            <strong>ZMW {incomeStatementData.netIncome.toFixed(2)}</strong>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncomeStatementPage;
