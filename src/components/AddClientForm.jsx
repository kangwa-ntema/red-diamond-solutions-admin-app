import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getToken } from "../utils/authUtils"; // Utility to get authentication token
import "./AddClientForm.css"; // Import the new CSS file, renamed for consistency

/**
 * @component AddClientForm
 * @description A React component for adding a new client to the system.
 * It handles form input, client creation via API, and navigation.
 * All instances of 'customer' have been changed to 'client' for consistency.
 */
const AddClientForm = () => {
  // --- State Management ---

  // formData: Stores the values of the form fields for the new client.
  // dateRegistered is initialized to today's date in YYYY-MM-DD format.
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    secondaryPhone: "",
    nrc: "",
    address: "", // Single string field for address
    dateRegistered: new Date().toISOString().split("T")[0], // Default to current date
  });
  // loading: Boolean state to indicate if an API request is in progress.
  const [loading, setLoading] = useState(false);
  // error: Stores any error message received from the API or during the process.
  const [error, setError] = useState(null);
  // success: Stores a success message upon successful client creation.
  const [success, setSuccess] = useState(null);

  // useNavigate hook from react-router-dom for programmatic navigation.
  const navigate = useNavigate();
  // Retrieve the backend URL from environment variables for API calls.
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // --- Event Handlers ---

  /**
   * @function handleChange
   * @description Updates the formData state when any form input changes.
   * @param {Object} e - The event object from the input change.
   */
  const handleChange = (e) => {
    const { name, value } = e.target; // Destructure name and value from the input element
    setFormData((prevData) => ({
      ...prevData, // Spread the previous form data
      [name]: value, // Update the specific field by its name
    }));
  };

  /**
   * @function handleSubmit
   * @description Handles the form submission to add a new client.
   * It prevents default form submission, sets loading state, fetches
   * an authentication token, sends a POST request to the backend,
   * and handles success or error responses.
   * @param {Object} e - The event object from the form submission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload)
    setLoading(true); // Set loading to true while the request is in progress
    setError(null); // Clear any previous error messages
    setSuccess(null); // Clear any previous success messages

    const token = getToken(); // Get the authentication token from local storage or cookies

    // If no token is found, display an error and redirect to login page.
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      navigate("/login"); // Redirect to login page
      return;
    }

    try {
      // Send a POST request to the backend API to add a new client.
      // Endpoint changed from /api/customers to /api/clients.
      const response = await fetch(`${BACKEND_URL}/api/clients`, {
        method: "POST", // HTTP POST method for creating a new resource
        headers: {
          "Content-Type": "application/json", // Specify content type as JSON
          Authorization: `Bearer ${token}`, // Include JWT token for authentication
        },
        credentials: "include", // Include cookies (if any) with the request
        body: JSON.stringify(formData), // Send the form data as a JSON string in the request body
      });

      // Check if the response was successful (status code 2xx)
      if (response.ok) {
        setSuccess("Client added successfully!"); // Set success message
        // Clear the form fields after successful submission
        setFormData({
          name: "",
          email: "",
          phone: "",
          secondaryPhone: "",
          nrc: "",
          address: "",
          dateRegistered: new Date().toISOString().split("T")[0], // Reset to current date
        });
        // Redirect to the clients list page after a short delay to show success message
        setTimeout(() => {
          navigate("/clients"); // Navigate to the clients list (URL changed)
        }, 1500);
      } else {
        // If the response was not OK, parse the error message from the backend
        const errorData = await response.json();
        setError(errorData.message || "Failed to add client."); // Set error message (updated message)
      }
    } catch (err) {
      // Catch any network errors or other exceptions during the fetch operation
      console.error("Error adding client:", err); // Log the detailed error
      setError("An error occurred during client creation."); // Set a generic error message
    } finally {
      // This block runs regardless of success or failure
      setLoading(false); // End loading state
    }
  };

  // --- Render Logic ---

  return (
    <div className="addClientFormContainer">
      {" "}
      {/* Main container div (updated class) */}
      {/* Wrapper div for content box, applies styling for layout (updated class) */}
      <div className="addClientFormContent">
        {/* Link to navigate back to the clients list */}
        <Link className="addClientBackLink" to="/clients">
          {" "}
          {/* Updated URL and class */}
          {"<"} Back to Clients List
        </Link>
        {/* Headline for the form (updated class and text) */}
        <h2 className="addClientHeadline">Add New Client</h2>
        {/* Display success message if available */}
        {success && <p className="addClientSuccessMessage">{success}</p>}{" "}
        {/* Updated class */}
        {/* Display error message if available */}
        {error && <p className="addClientErrorMessage">{error}</p>}{" "}
        {/* Updated class */}
        {/* The form for adding a new client */}
        <form onSubmit={handleSubmit} className="addClientForm">
          {" "}
          {/* Updated class */}
          {/* Form Group: Name */}
          <div className="addClientFormGroup">
            {" "}
            {/* Updated class */}
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required // HTML5 required attribute
            />
          </div>
          {/* Form Group: Email */}
          <div className="addClientFormGroup">
            {" "}
            {/* Updated class */}
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          {/* Form Group: Primary Phone */}
          <div className="addClientFormGroup">
            {" "}
            {/* Updated class */}
            <label htmlFor="phone">Primary Phone:</label>
            <input
              type="tel" // Use tel for phone numbers
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          {/* Form Group: Secondary Phone */}
          <div className="addClientFormGroup">
            {" "}
            {/* Updated class */}
            <label htmlFor="secondaryPhone">Secondary Phone:</label>
            <input
              type="tel"
              id="secondaryPhone"
              name="secondaryPhone"
              value={formData.secondaryPhone}
              onChange={handleChange}
            />
          </div>
          {/* Form Group: NRC */}
          <div className="addClientFormGroup">
            {" "}
            {/* Updated class */}
            <label htmlFor="nrc">NRC:</label>
            <input
              type="text"
              id="nrc"
              name="nrc"
              value={formData.nrc}
              onChange={handleChange}
            />
          </div>
          {/* Form Group: Address */}
          <div className="addClientFormGroup">
            {" "}
            {/* Updated class */}
            <label htmlFor="address">Address:</label>{" "}
            {/* Label for the single address field */}
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3" // Display 3 rows for multiline input
            ></textarea>
          </div>
          {/* Form Group: Date Registered */}
          <div className="addClientFormGroup">
            {" "}
            {/* Updated class */}
            <label htmlFor="dateRegistered">Date Registered:</label>
            <input
              type="date" // HTML5 date input type
              id="dateRegistered"
              name="dateRegistered"
              value={formData.dateRegistered}
              onChange={handleChange}
            />
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="addClientSubmitBtn"
          >
            {" "}
            {/* Updated class */}
            {loading ? "Adding..." : "Add Client"}{" "}
            {/* Change button text based on loading state */}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddClientForm; // Export the component for use in other parts of the application (renamed)
