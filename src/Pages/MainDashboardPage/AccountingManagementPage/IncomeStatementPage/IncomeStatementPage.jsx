import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getIncomeStatement } from '../../../../services/api/accountingApi'; // Adjust path as needed
import './IncomeStatementPage.css'; // Ensure this path is correct

/**
 * @component IncomeStatementPage
 * @description Displays the Income Statement (Profit & Loss) report for a selected period.
 * Summarizes revenues and expenses to show net income or loss.
 */
const IncomeStatementPage = () => {
    const navigate = useNavigate();

    // State to store the fetched income statement data
    const [incomeStatementData, setIncomeStatementData] = useState(null);
    // State for filtering by date range
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [loading, setLoading] = useState(false); // Changed initial state to false as we await user input
    const [error, setError] = useState(null);

    // --- Memoized function to fetch Income Statement data ---
    const fetchAndSetIncomeStatement = useCallback(async () => {
        // Perform local validation before making API call
        if (!filterStartDate || !filterEndDate) {
            // No toast.info here, as the UI will prompt the user to select dates.
            // setIncomeStatementData(null) is important to clear previous report
            setIncomeStatementData(null);
            setLoading(false); // Stop loading if dates are missing
            setError(null); // Clear any previous error
            return;
        }

        if (new Date(filterStartDate) > new Date(filterEndDate)) {
            toast.error('Start date cannot be after end date.');
            setIncomeStatementData(null); // Clear previous data
            setLoading(false);
            setError('Invalid date range: Start date cannot be after end date.');
            return;
        }

        setLoading(true); // Indicate loading has started
        setError(null);   // Clear any previous errors

        try {
            const data = await getIncomeStatement(filterStartDate, filterEndDate);
            setIncomeStatementData(data);
        } catch (err) {
            // handleApiError in accountingApi.js should already show a toast
            // and handle unauthorized redirects. We catch it here to update local error state.
            console.error("IncomeStatementPage: Error fetching income statement:", err);
            setError(err.message || "Failed to fetch income statement data.");
            setIncomeStatementData(null); // Clear previous data on error
        } finally {
            setLoading(false); // Indicate loading has finished
        }
    }, [filterStartDate, filterEndDate]); // Re-fetch whenever filter dates change

    // Use a separate useEffect for automatic fetching when dates are provided
    // or when the component initially loads with pre-filled dates (if applicable)
    useEffect(() => {
        // This useEffect specifically watches for changes in dates
        // and triggers the fetch if both dates are present and valid.
        // It's effectively the "listener" for when filters are applied.
        fetchAndSetIncomeStatement();
    }, [fetchAndSetIncomeStatement]); // Dependency on the memoized function

    // handleApplyFilters now simply ensures the dates are ready, and
    // the useEffect will pick up the changes and trigger the fetch.
    const handleApplyFilters = () => {
        // No direct fetch call here; the state updates will trigger the useEffect
        // The validation inside fetchAndSetIncomeStatement will catch missing/invalid dates
        // before the API call is made.
        if (!filterStartDate || !filterEndDate) {
            toast.info('Please select both a start and end date to generate the report.');
        } else if (new Date(filterStartDate) > new Date(filterEndDate)) {
            toast.error('Start date cannot be after end date.');
        }
    };

    // Handle clearing filters
    const handleClearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        // Setting state to empty will trigger fetchAndSetIncomeStatement
        // which will then show the "Please select dates" message.
    };

    return (
        <div className="incomeStatementContainer">
            <Link to="/transactions" className="incomeStatementBackLink">
                {"<"} Back to Accounting
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
                        disabled={loading}
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