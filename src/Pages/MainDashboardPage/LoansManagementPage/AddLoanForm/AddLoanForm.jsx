import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext"; // Use your AuthContext
import { addLoan, getEligibleClients } from "../../../../services/api"; // Centralized API functions

import "./AddLoanForm.css"; // Ensure your CSS is correctly linked

/**
 * @component AddLoanPage
 * @description Allows administrators to add a new loan or renew an existing loan for a client.
 * It fetches eligible clients, calculates loan financials, and handles form submission.
 */
const AddLoanForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth(); // Get logout function from AuthContext

  const { loanDataToRenew } = location.state || {}; // Destructure loanDataToRenew from state

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    client: "",
    loanAmount: "", // Changed to empty string for better controlled input behavior
    interestRate: "", // Changed to empty string
    loanTerm: "", // Changed to empty string
    termUnit: "months",
    startDate: today,
    dueDate: "",
    paymentsMade: 0, // Should typically start at 0 for a new/renewed loan
    balanceDue: "",
    totalRepaymentAmount: "",
    interestAmount: "",
    status: "pending",
    description: "",
    collateralType: "",
    collateralValue: "", // Changed to empty string
    collateralDescription: "",
  });

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  /**
   * Initializes form data when the component mounts or if a loan is being renewed.
   */
  useEffect(() => {
    if (loanDataToRenew) {
      setFormData((prevData) => ({
        ...prevData,
        // Pre-fill from existing loan, ensuring correct types
        client: loanDataToRenew.client || "",
        loanAmount: parseFloat(loanDataToRenew.loanAmount) || "",
        interestRate: parseFloat(loanDataToRenew.interestRate) || "",
        loanTerm: parseInt(loanDataToRenew.loanTerm) || "",
        termUnit: loanDataToRenew.termUnit || "months",
        startDate: today, // New start date for renewed loan
        // Reset calculated/payment fields for a fresh loan
        paymentsMade: 0,
        balanceDue: "",
        totalRepaymentAmount: "",
        interestAmount: "",
        dueDate: "",
        description: loanDataToRenew.description || "",
        collateralType: loanDataToRenew.collateralType || "",
        collateralValue: parseFloat(loanDataToRenew.collateralValue) || "",
        collateralDescription: loanDataToRenew.collateralDescription || "",
      }));

      // For renewal, set clients list to only include the renewed client for the dropdown
      const renewedClient = {
        _id: loanDataToRenew.client,
        name: loanDataToRenew.clientName || "Unknown Client",
        email: loanDataToRenew.clientEmail || "",
      };
      setClients([renewedClient]);
      setLoading(false); // No need to fetch clients if renewing
    }
  }, [loanDataToRenew, today]);

  /**
   * Fetches clients eligible for a new loan.
   * This is only called if not in renewal mode.
   */
  const fetchClients = useCallback(async () => {
    if (loanDataToRenew) {
      // If renewing, client data is pre-set, no need to fetch.
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      // Use the centralized API function
      const response = await getEligibleClients(); // This should handle token internally
      setClients(response.clients || []);
    } catch (err) {
      console.error("Error fetching eligible clients:", err);
      setFetchError(err.message || "Failed to load eligible clients.");
      toast.error(`Error loading clients: ${err.message}`);
      // If error is due to auth, logout
      if (err.message.includes("Authentication expired") || err.message.includes("unauthorized")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [loanDataToRenew, logout]); // Add logout to dependencies

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /**
   * Handles changes to form input fields, parsing numbers correctly.
   */
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setFormData((prevData) => {
      let newValue = value;
      // Convert to number if type is 'number' and value is not empty
      if (type === "number" && value !== "") {
        newValue = parseFloat(value);
      } else if (type === "number" && value === "") {
        newValue = ""; // Keep it as an empty string if input is cleared
      }
      return {
        ...prevData,
        [name]: newValue,
      };
    });
  };

  /**
   * Calculates loan financials (interest, total repayment, balance due, due date).
   * Memoized with useCallback to prevent unnecessary re-creations.
   */
  const calculateLoanFinancials = useCallback(() => {
    const loanAmount = parseFloat(formData.loanAmount);
    const interestRate = parseFloat(formData.interestRate);
    const loanTerm = parseInt(formData.loanTerm);
    const startDate = formData.startDate;

    let calculatedInterestAmount = "";
    let calculatedTotalRepaymentAmount = "";
    let calculatedBalanceDue = "";
    let calculatedDueDate = "";

    // Calculate interest, total repayment, and balance due
    if (
      !isNaN(loanAmount) &&
      loanAmount > 0 &&
      !isNaN(interestRate) &&
      !isNaN(loanTerm) &&
      loanTerm > 0
    ) {
      calculatedInterestAmount = (loanAmount * (interestRate / 100) * loanTerm).toFixed(2);
      calculatedTotalRepaymentAmount = (loanAmount + parseFloat(calculatedInterestAmount)).toFixed(2);
      calculatedBalanceDue = calculatedTotalRepaymentAmount;
    }

    // Calculate due date
    if (startDate && loanTerm > 0 && !isNaN(loanTerm)) {
      const start = new Date(startDate + 'T00:00:00'); // Ensure date is treated as UTC to avoid timezone issues
      let dueDateCalc = new Date(start);

      switch (formData.termUnit) {
        case "days":
          dueDateCalc.setDate(start.getDate() + loanTerm);
          break;
        case "weeks":
          dueDateCalc.setDate(start.getDate() + loanTerm * 7);
          break;
        case "months":
          // Add months, then adjust date to end of month if original day was end of month
          dueDateCalc.setMonth(start.getMonth() + loanTerm);
          // If original day was greater than new month's last day, set to new month's last day
          if (dueDateCalc.getDate() !== start.getDate() && dueDateCalc.getMonth() !== ((start.getMonth() + loanTerm) % 12)) {
            dueDateCalc.setDate(0); // This sets it to the last day of the *previous* month
            dueDateCalc.setDate(dueDateCalc.getDate() + start.getDate()); // Re-adjust to the target month's last day
          }
          break;
        case "years":
          dueDateCalc.setFullYear(start.getFullYear() + loanTerm);
          // Similar adjustment for year-based calculation
          if (dueDateCalc.getMonth() !== start.getMonth()) {
            dueDateCalc.setDate(0);
            dueDateCalc.setDate(dueDateCalc.getDate() + start.getDate());
          }
          break;
        default:
          break;
      }
      calculatedDueDate = dueDateCalc.toISOString().split("T")[0];
    }

    // Update formData if calculated values have changed
    setFormData((prevData) => {
      const updatedData = {};
      if (prevData.totalRepaymentAmount !== calculatedTotalRepaymentAmount) {
        updatedData.totalRepaymentAmount = calculatedTotalRepaymentAmount;
      }
      if (prevData.balanceDue !== calculatedBalanceDue) {
        updatedData.balanceDue = calculatedBalanceDue;
      }
      if (prevData.dueDate !== calculatedDueDate) {
        updatedData.dueDate = calculatedDueDate;
      }
      if (prevData.interestAmount !== calculatedInterestAmount) {
        updatedData.interestAmount = calculatedInterestAmount;
      }

      return Object.keys(updatedData).length > 0
        ? { ...prevData, ...updatedData }
        : prevData;
    });
  }, [
    formData.loanAmount,
    formData.interestRate,
    formData.loanTerm,
    formData.termUnit,
    formData.startDate,
  ]);

  // Trigger loan financial calculation whenever relevant fields change
  useEffect(() => {
    calculateLoanFinancials();
  }, [calculateLoanFinancials]);

  /**
   * Handles the form submission for adding a new loan.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFetchError(null);
    setIsSubmitting(true);

    // Basic client-side validation
    if (
      !formData.client ||
      isNaN(formData.loanAmount) ||
      formData.loanAmount <= 0 ||
      isNaN(formData.interestRate) ||
      formData.interestRate < 0 ||
      isNaN(formData.loanTerm) ||
      formData.loanTerm <= 0 ||
      !formData.startDate
    ) {
      setFetchError("Please fill in all required fields correctly (Loan Amount, Interest Rate, Loan Term must be positive numbers).");
      toast.error("Please fill in all required fields correctly.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare data for submission - remove empty strings/nulls if backend expects numbers
      const dataToSubmit = {
        ...formData,
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate),
        loanTerm: parseInt(formData.loanTerm),
        collateralValue: formData.collateralValue === "" ? null : parseFloat(formData.collateralValue),
        // Ensure calculated fields are sent as numbers or strings as expected by backend
        interestAmount: parseFloat(formData.interestAmount),
        totalRepaymentAmount: parseFloat(formData.totalRepaymentAmount),
        balanceDue: parseFloat(formData.balanceDue),
      };

      // Use the centralized API function
      const response = await addLoan(dataToSubmit); // This handles authentication internally

      toast.success(response.message || "Loan added successfully!");

      // Reset form or navigate
      setFormData({
        client: "",
        loanAmount: "",
        interestRate: "",
        loanTerm: "",
        termUnit: "months",
        startDate: today,
        dueDate: "",
        paymentsMade: 0,
        balanceDue: "",
        totalRepaymentAmount: "",
        interestAmount: "",
        status: "pending",
        description: "",
        collateralType: "",
        collateralValue: "",
        collateralDescription: "",
      });
      // Navigate after a short delay for toast to be visible
      setTimeout(() => {
        navigate("/loans");
      }, 1500);
    } catch (err) {
      console.error("Error submitting loan:", err);
      setFetchError(err.message || "Failed to add loan. Please try again.");
      toast.error(`Error adding loan: ${err.message || "Network error"}`);
      // If error is due to auth, logout
      if (err.message.includes("Authentication expired") || err.message.includes("unauthorized")) {
        logout();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Conditional Rendering for Loading and Error States ---
  if (loading) {
    return (
      <div className="addLoanPageContainer addLoanLoading">
        Loading clients...
      </div>
    );
  }

  // Display a global error message if fetching clients failed AND no clients were loaded.
  // This now specifically applies to the "add new loan" scenario, not renewal.
  if (fetchError && !loanDataToRenew) {
    return (
      <div className="addLoanPageContainer addLoanErrorMessage">
        Error: {fetchError}
        <br />
        <Link to="/loans">
          <button className="addLoanBackLink">Back to Loans Overview</button>
        </Link>
      </div>
    );
  }

  // If no eligible clients are found, and the component is not loading, AND we are NOT renewing a loan,
  // display a message indicating that no clients are available for a new loan.
  if (clients.length === 0 && !loading && !loanDataToRenew) {
    return (
      <div className="addLoanPageContainer addLoanErrorMessage">
        <p className="noClientsFoundForLoan">
          No eligible clients found to add a loan for. All clients may already
          have an active or overdue loan, or there are no clients registered.
        </p>
        <Link to="/clients">
          <button className="addLoanBackLink">Back to Clients Dashboard</button>
        </Link>
      </div>
    );
  }

  // Main component render: Displays the loan input form.
  return (
    <div className="addLoanPageContainer">
      <div className="addLoanPageContent">
        <Link to="/loans" className="">
          <button className="addLoanBackLink">Back to Loans Overview</button>
        </Link>
        <h1 className="addLoanHeadline">
          {loanDataToRenew ? "Renew Loan" : "Add New Loan"}
        </h1>

        {/* Display form-specific error message if validation fails or submission error */}
        {fetchError && <div className="addLoanErrorMessage">{fetchError}</div>}

        <form onSubmit={handleSubmit} className="addLoanForm">
          {/* Client Selection Dropdown */}
          <div className="addLoanFormGroup">
            <label htmlFor="client">Client:</label>
            <select
              id="client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              className="addLoanSelect"
              required
              disabled={!!loanDataToRenew} // Disable if renewing a loan
            >
              {loanDataToRenew ? (
                <option key={formData.client} value={formData.client}>
                  {clients[0]?.name} ({clients[0]?.email})
                </option>
              ) : (
                <>
                  <option value="">Select a Client</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </>
              )}
            </select>
            {clients.length === 0 && !loading && !loanDataToRenew && (
              <p className="addLoanInfoText">
                No clients without active or overdue loans found.
              </p>
            )}
            {loanDataToRenew && (
              <p className="addLoanInfoText">
                Client pre-selected for renewal.
              </p>
            )}
          </div>

          <div className="addLoanFormGroup">
            <label htmlFor="loanAmount">Loan Amount (ZMW):</label>
            <input
              type="number"
              id="loanAmount"
              name="loanAmount"
              value={formData.loanAmount}
              onChange={handleChange}
              className="addLoanInput"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div className="addLoanFormGroup">
            <label htmlFor="interestRate">Interest Rate (% Direct):</label>
            <input
              type="number"
              id="interestRate"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleChange}
              className="addLoanInput"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="addLoanFormGroup">
            <label htmlFor="interestAmount">
              Calculated Interest Amount (ZMW):
            </label>
            <input
              type="text"
              id="interestAmount"
              name="interestAmount"
              value={formData.interestAmount}
              className="addLoanInput"
              readOnly
            />
          </div>

          <div className="addLoanFormGroup term-group">
            <label htmlFor="loanTerm">Loan Term:</label>
            <input
              type="number"
              id="loanTerm"
              name="loanTerm"
              value={formData.loanTerm}
              onChange={handleChange}
              className="addLoanInput"
              min="1"
              required
            />
            <select
              id="termUnit"
              name="termUnit"
              value={formData.termUnit}
              onChange={handleChange}
              className="addLoanSelect term-unit-select"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>

          <div className="addLoanFormGroup">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="addLoanInput"
              required
            />
          </div>

          <div className="addLoanFormGroup">
            <label htmlFor="dueDate">Due Date (Calculated):</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              className="addLoanInput"
              readOnly
            />
          </div>

          <div className="addLoanFormGroup">
            <label htmlFor="paymentsMade">Payments Made (ZMW):</label>
            <input
              type="number"
              id="paymentsMade"
              name="paymentsMade"
              value={formData.paymentsMade}
              onChange={handleChange}
              className="addLoanInput"
              step="0.01"
              min="0"
              readOnly
            />
          </div>

          <div className="addLoanFormGroup">
            <label htmlFor="totalRepaymentAmount">
              Calculated Total Repayment (ZMW):
            </label>
            <input
              type="text"
              id="totalRepaymentAmount"
              name="totalRepaymentAmount"
              value={formData.totalRepaymentAmount}
              className="addLoanInput"
              readOnly
            />
          </div>

          <div className="addLoanFormGroup">
            <label htmlFor="description">Description (Optional):</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="addLoanInput"
              rows="3"
            ></textarea>
          </div>

          <div className="addLoanSection">
            <h2 className="addLoanCollateralSectionTitle">
              Collateral Information (Optional)
            </h2>
            <div className="addLoanFormGroup">
              <label htmlFor="collateralType">Collateral Type:</label>
              <input
                type="text"
                id="collateralType"
                name="collateralType"
                value={formData.collateralType}
                onChange={handleChange}
                className="addLoanInput"
              />
            </div>
            <div className="addLoanFormGroup">
              <label htmlFor="collateralValue">Collateral Value (ZMW):</label>
              <input
                type="number"
                id="collateralValue"
                name="collateralValue"
                value={formData.collateralValue}
                onChange={handleChange}
                className="addLoanInput"
                step="0.01"
                min="0"
              />
            </div>
            <div className="addLoanFormGroup">
              <label htmlFor="collateralDescription">
                Collateral Description:
              </label>
              <textarea
                id="collateralDescription"
                name="collateralDescription"
                value={formData.collateralDescription}
                onChange={handleChange}
                className="addLoanInput"
                rows="3"
              ></textarea>
            </div>
          </div>

          <button type="submit" className="addLoanSubmitButton" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : (loanDataToRenew ? "Renew Loan" : "+ Add Loan")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLoanForm;