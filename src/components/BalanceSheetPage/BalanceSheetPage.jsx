import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../../utils/authUtils'; // Adjust path as needed
import { toast } from 'react-toastify'; // For notifications
import './BalanceSheetPage.css'; // Common CSS for accounting pages

/**
 * @component BalanceSheetPage
 * @description Displays the Balance Sheet report as of a selected date.
 * It shows assets, liabilities, and equity, and verifies the accounting equation.
 */
const BalanceSheetPage = () => {
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // State to store the fetched balance sheet data
    const [balanceSheetData, setBalanceSheetData] = useState(null);
    // State for filtering by "as of" date
    const [filterAsOfDate, setFilterAsOfDate] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Balance Sheet data ---
    const fetchBalanceSheet = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/loginForm');
            toast.error('Authentication required to view balance sheet.');
            return;
        }

        // Require an "as of" date
        if (!filterAsOfDate) {
            toast.info('Please select an "as of" date for the Balance Sheet.');
            setLoading(false);
            setBalanceSheetData(null); // Clear previous data
            return;
        }

        try {
            const url = `${BACKEND_URL}/api/reports/balance-sheet?asOfDate=${filterAsOfDate}`;

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
                throw new Error(data.message || 'Failed to fetch balance sheet data.');
            }

            const data = await response.json();
            setBalanceSheetData(data);
        } catch (err) {
            console.error("BalanceSheetPage: Error fetching balance sheet:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error fetching balance sheet: ${err.message || "Network error"}`);
            setBalanceSheetData(null); // Clear previous data on error
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL, navigate, filterAsOfDate]); // Re-fetch when filterAsOfDate changes

    // Initial fetch on component mount (or when filter date is initially set/cleared)
    useEffect(() => {
        // Only fetch if a date is set, otherwise it will wait for user input
        if (filterAsOfDate) {
            fetchBalanceSheet();
        } else {
            setLoading(false); // If no date, set loading false, awaiting user input
        }
    }, [fetchBalanceSheet, filterAsOfDate]); // Add filter date to dependency array

    // Handle filter application
    const handleApplyFilter = () => {
        fetchBalanceSheet(); // Trigger re-fetch with current filter state
    };

    // Handle clearing filter
    const handleClearFilter = () => {
        setFilterAsOfDate('');
        // fetchBalanceSheet will be called by useEffect due to state change
    };

    if (loading && !balanceSheetData && filterAsOfDate) {
        return <div className="balanceSheetContainer loading">Generating Balance Sheet...</div>;
    }

    if (error && !balanceSheetData) {
        return <div className="balanceSheetContainer error">Error: {error}</div>;
    }

    return (
        <div className="balanceSheetContainer">
            <Link to="/transactions" className="balanceSheetBackLink">
                {"<"} Back to Accounting
            </Link>
            <h1 className="balanceSheetHeadline">Balance Sheet</h1>

            {/* Filter Section */}
            <div className="balanceSheetFilters">
                <h3>Select Report Date</h3>
                <div className="filterGroup">
                    <label htmlFor="filterAsOfDate">As of Date:</label>
                    <input
                        type="date"
                        id="filterAsOfDate"
                        value={filterAsOfDate}
                        onChange={(e) => setFilterAsOfDate(e.target.value)}
                        required
                    />
                </div>
                <div className="filterButtons">
                    <button onClick={handleApplyFilter} className="applyFiltersBtn" disabled={loading}>Generate Report</button>
                    <button onClick={handleClearFilter} className="clearFiltersBtn" disabled={loading}>Clear Date</button>
                </div>
            </div>

            {/* Balance Sheet Report Display */}
            {!balanceSheetData ? (
                <div className="balanceSheetMessage">
                    {loading ? "Loading..." : "Please select an 'as of' date and click 'Generate Report'."}
                </div>
            ) : (
                <div className="balanceSheetReport">
                    <h2>As of {new Date(balanceSheetData.reportDate).toLocaleDateString()}</h2>

                    {/* Assets Section */}
                    <div className="balanceSheetSection">
                        <h3>Assets</h3>
                        {balanceSheetData.assets.length === 0 ? (
                            <p className="noDataMessage">No asset balances found.</p>
                        ) : (
                            <table className="balanceSheetTable">
                                <tbody>
                                    {balanceSheetData.assets.map(asset => (
                                        <tr key={asset._id}>
                                            <td className="accountNameCol">{asset.accountName} ({asset.accountCode})</td>
                                            <td className="amountCol text-right">ZMW {asset.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="totalRow">
                                        <td><strong>Total Assets:</strong></td>
                                        <td className="amountCol text-right"><strong>ZMW {balanceSheetData.totalAssets.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Liabilities Section */}
                    <div className="balanceSheetSection">
                        <h3>Liabilities</h3>
                        {balanceSheetData.liabilities.length === 0 ? (
                            <p className="noDataMessage">No liability balances found.</p>
                        ) : (
                            <table className="balanceSheetTable">
                                <tbody>
                                    {balanceSheetData.liabilities.map(liability => (
                                        <tr key={liability._id}>
                                            <td className="accountNameCol">{liability.accountName} ({liability.accountCode})</td>
                                            <td className="amountCol text-right">ZMW {liability.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="totalRow">
                                        <td><strong>Total Liabilities:</strong></td>
                                        <td className="amountCol text-right"><strong>ZMW {balanceSheetData.totalLiabilities.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Equity Section */}
                    <div className="balanceSheetSection">
                        <h3>Equity</h3>
                        {balanceSheetData.equity.length === 0 ? (
                            <p className="noDataMessage">No equity balances found.</p>
                        ) : (
                            <table className="balanceSheetTable">
                                <tbody>
                                    {balanceSheetData.equity.map(eq => (
                                        <tr key={eq._id}>
                                            <td className="accountNameCol">{eq.accountName} ({eq.accountCode})</td>
                                            <td className="amountCol text-right">ZMW {eq.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="totalRow">
                                        <td><strong>Total Equity:</strong></td>
                                        <td className="amountCol text-right"><strong>ZMW {balanceSheetData.totalEquity.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Accounting Equation Summary */}
                    <div className={`accountingEquationSummary ${balanceSheetData.isBalanced ? 'balanced' : 'unbalanced'}`}>
                        <p><strong>Total Assets:</strong> <span className="totalAmount">ZMW {balanceSheetData.totalAssets.toFixed(2)}</span></p>
                        <p><strong>Total Liabilities + Equity:</strong> <span className="totalAmount">ZMW {(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity).toFixed(2)}</span></p>
                        <p className="statusMessage">{balanceSheetData.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BalanceSheetPage;
