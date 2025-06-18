import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getBalanceSheet } from '../../../../services/api/accountingApi'; // Adjust path as needed
import './BalanceSheetPage.css'; // Ensure this path is correct

/**
 * @component BalanceSheetPage
 * @description Displays the Balance Sheet report as of a selected date.
 * It shows assets, liabilities, and equity, and verifies the accounting equation.
 */
const BalanceSheetPage = () => {
    const navigate = useNavigate();

    // State to store the fetched balance sheet data
    const [balanceSheetData, setBalanceSheetData] = useState(null);
    // State for filtering by "as of" date
    const [filterAsOfDate, setFilterAsOfDate] = useState('');

    const [loading, setLoading] = useState(false); // Initial state is false, awaiting user input
    const [error, setError] = useState(null);

    // --- Memoized function to fetch Balance Sheet data ---
    const fetchAndSetBalanceSheet = useCallback(async () => {
        // Client-side validation before making API call
        if (!filterAsOfDate) {
            setBalanceSheetData(null);
            setLoading(false); // Stop loading if date is missing
            setError(null); // Clear any previous error
            return;
        }

        setLoading(true); // Indicate loading has started
        setError(null);   // Clear any previous errors

        try {
            const data = await getBalanceSheet(filterAsOfDate);
            setBalanceSheetData(data);
        } catch (err) {
            // handleApiError in accountingApi.js should already show a toast
            // and handle unauthorized redirects. We catch it here to update local error state.
            console.error("BalanceSheetPage: Error fetching balance sheet:", err);
            setError(err.message || "Failed to fetch balance sheet data.");
            setBalanceSheetData(null); // Clear previous data on error
        } finally {
            setLoading(false); // Indicate loading has finished
        }
    }, [filterAsOfDate]); // Re-fetch whenever filterAsOfDate changes

    // Use useEffect to trigger fetching when filterAsOfDate changes
    useEffect(() => {
        // This useEffect specifically watches for changes in the date
        // and triggers the fetch if a date is present.
        fetchAndSetBalanceSheet();
    }, [fetchAndSetBalanceSheet]); // Dependency on the memoized function

    // handleApplyFilter now just ensures the date is ready.
    const handleApplyFilter = () => {
        // No direct fetch call here; the state update will trigger the useEffect.
        // The validation inside fetchAndSetBalanceSheet will catch missing date.
        if (!filterAsOfDate) {
            toast.info('Please select an "as of" date to generate the report.');
        }
    };

    // Handle clearing filter
    const handleClearFilter = () => {
        setFilterAsOfDate('');
        // Setting state to empty will trigger fetchAndSetBalanceSheet
        // which will then show the "Please select date" message.
    };

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
                        disabled={loading} // Disable input while loading
                    />
                </div>
                <div className="filterButtons">
                    <button
                        onClick={handleApplyFilter}
                        className="applyFiltersBtn"
                        disabled={loading || !filterAsOfDate} // Disable if loading or date missing
                    >
                        Generate Report
                    </button>
                    <button
                        onClick={handleClearFilter}
                        className="clearFiltersBtn"
                        disabled={loading}
                    >
                        Clear Date
                    </button>
                </div>
            </div>

            {/* Conditional Rendering for Loading, Error, and Data */}
            {loading ? (
                <div className="balanceSheetMessage">Generating Balance Sheet...</div>
            ) : error ? (
                <div className="balanceSheetErrorMessage">Error: {error}</div>
            ) : !balanceSheetData ? (
                <div className="balanceSheetMessage">
                    Please select an 'as of' date above and click 'Generate Report'.
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