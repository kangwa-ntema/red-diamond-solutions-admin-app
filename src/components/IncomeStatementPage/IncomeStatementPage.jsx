import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../../utils/authUtils'; // Adjust path as needed
import { toast } from 'react-toastify'; // For notifications
import './IncomeStatementPage.css'; // Common CSS for accounting pages

/**
 * @component IncomeStatementPage
 * @description Displays the Income Statement (Profit & Loss) report for a selected period.
 * Summarizes revenues and expenses to show net income or loss.
 */
const IncomeStatementPage = () => {
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // State to store the fetched income statement data
    const [incomeStatementData, setIncomeStatementData] = useState(null);
    // State for filtering by date range
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Income Statement data ---
    const fetchIncomeStatement = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/loginForm');
            toast.error('Authentication required to view income statement.');
            return;
        }

        // Require both start and end dates
        if (!filterStartDate || !filterEndDate) {
            toast.info('Please select both a start and end date for the Income Statement.');
            setLoading(false);
            setIncomeStatementData(null); // Clear previous data
            return;
        }

        if (new Date(filterStartDate) > new Date(filterEndDate)) {
            toast.error('Start date cannot be after end date.');
            setLoading(false);
            setIncomeStatementData(null); // Clear previous data
            return;
        }

        try {
            const url = `${BACKEND_URL}/api/reports/income-statement?startDate=${filterStartDate}&endDate=${filterEndDate}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/loginForm');
                toast.error('Authentication expired or unauthorized. Please log in again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch income statement data.');
            }

            const data = await response.json();
            setIncomeStatementData(data);
        } catch (err) {
            console.error("IncomeStatementPage: Error fetching income statement:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error fetching income statement: ${err.message || "Network error"}`);
            setIncomeStatementData(null); // Clear previous data on error
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL, navigate, filterStartDate, filterEndDate]); // Re-fetch when filter dates change

    // Initial fetch on component mount (or when filter dates are initially set/cleared)
    useEffect(() => {
        // Only fetch if dates are set, otherwise it will wait for user input
        if (filterStartDate && filterEndDate) {
            fetchIncomeStatement();
        } else {
            setLoading(false); // If no dates, set loading false, awaiting user input
        }
    }, [fetchIncomeStatement, filterStartDate, filterEndDate]); // Add filter dates to dependency array

    // Handle filter application
    const handleApplyFilters = () => {
        fetchIncomeStatement(); // Trigger re-fetch with current filter states
    };

    // Handle clearing filters
    const handleClearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        // fetchIncomeStatement will be called by useEffect due to state changes
    };

    if (loading && !incomeStatementData && (filterStartDate && filterEndDate)) {
        return <div className="incomeStatementContainer loading">Generating Income Statement...</div>;
    }

    if (error && !incomeStatementData) {
        return <div className="incomeStatementContainer error">Error: {error}</div>;
    }

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
                    />
                </div>
                <div className="filterButtons">
                    <button onClick={handleApplyFilters} className="applyFiltersBtn" disabled={loading}>Generate Report</button>
                    <button onClick={handleClearFilters} className="clearFiltersBtn" disabled={loading}>Clear Dates</button>
                </div>
            </div>

            {/* Income Statement Report Display */}
            {!incomeStatementData ? (
                <div className="incomeStatementMessage">
                    {loading ? "Loading..." : "Please select a reporting period and click 'Generate Report'."}
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
