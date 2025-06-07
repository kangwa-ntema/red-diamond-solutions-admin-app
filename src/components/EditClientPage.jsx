import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../utils/authUtils"; // Assuming authUtils.js exists
import "./EditClientPage.css"; // Import the new CSS file, renamed for client
import { toast } from "react-toastify"; // Re-importing toast for notifications

/**
 * @component EditClientPage
 * @description A React component that allows an administrator to edit the details
 * of an existing client. It fetches the client's current data and pre-populates
 * the form fields for editing.
 */
const EditClientPage = () => {
  // useParams hook to extract the 'id' parameter from the URL.
  // This 'id' corresponds to the MongoDB ObjectId of the client being edited.
  const { id: clientId } = useParams();
  // useNavigate hook for programmatic navigation within the application.
  const navigate = useNavigate();

  // Access the backend URL from environment variables for API calls.
  // IMPORTANT: This relies on your project setup (e.g., Vite, Create React App)
  // properly exposing environment variables prefixed with VITE_ or REACT_APP_.
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // State to hold the form data. Initialized with empty strings.
  // These will be populated with fetched client data.
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    secondaryPhone: "",
    nrc: "",
    address: "",
    dateRegistered: "", // Will store the date in 'YYYY-MM-DD' format for HTML date input.
  });
  // State to indicate if data is currently being loaded.
  const [loading, setLoading] = useState(true);
  // State to store any error messages that occur during fetching or submission.
  const [error, setError] = useState(null);
  // State to indicate if the form is currently being submitted.
  const [submitting, setSubmitting] = useState(false);

  /**
   * useEffect hook to fetch the client's details when the component mounts
   * or when 'clientId', 'navigate', or 'BACKEND_URL' dependencies change.
   */
  useEffect(() => {
    /**
     * Asynchronous function to fetch existing client details from the backend.
     */
    const fetchClientDetails = async () => {
      setLoading(true); // Start loading state
      setError(null); // Clear any previous errors

      // Retrieve the authentication token using the actual utility function.
      const token = getToken();

      // If no token is found, log an error, clear auth data, and redirect to the login page.
      if (!token) {
        console.error(
          "EditClientPage: No authentication token found. Redirecting to login."
        );
        clearAuthData(); // Clears any stored authentication data using the actual utility function.
        navigate("/login"); // Redirects to the login route
        return; // Exit the function
      }

      try {
        // Make a GET request to the backend API to fetch client details by ID.
        const response = await fetch(`${BACKEND_URL}/api/clients/${clientId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json", // Specify content type as JSON.
            Authorization: `Bearer ${token}`, // Include the JWT token in the Authorization header.
          },
          credentials: "include", // Ensures cookies (if any) are sent with the request.
        });

        // Handle 401 Unauthorized or 403 Forbidden responses (e.g., expired token).
        if (response.status === 401 || response.status === 403) {
          console.error(
            "EditClientPage: Authentication expired or invalid. Logging out."
          );
          clearAuthData(); // Clear authentication data using the actual utility function.
          navigate("/login"); // Redirect to login.
          return;
        }

        // If the response is not OK (e.g., 404 Not Found, 500 Internal Server Error).
        if (!response.ok) {
          const errorData = await response.json(); // Attempt to parse error message from response body.
          throw new Error(
            errorData.message || "Failed to fetch client details."
          ); // Throw an error.
        }

        // Parse the JSON response body.
        const responseData = await response.json();
        // FIX: Access the nested 'client' object from the response if your backend returns it like this.
        // Based on previous interactions, your backend API for /api/clients/:id returns { client: {...}, loans: [...], ... }
        const clientData = responseData.client;

        // Populate the form data state with the fetched client details.
        // Use logical OR (|| '') for fields that might be null/undefined to prevent React warnings.
        setFormData({
          name: clientData.name || "",
          email: clientData.email || "",
          phone: clientData.phone || "",
          secondaryPhone: clientData.secondaryPhone || "",
          nrc: clientData.nrc || "",
          address: clientData.address || "",
          // Format dateRegistered for HTML date input type (YYYY-MM-DD).
          dateRegistered: clientData.dateRegistered
            ? new Date(clientData.dateRegistered).toISOString().split("T")[0]
            : "",
        });
        console.log("Client details fetched successfully:", clientData); // Added for debugging
      } catch (err) {
        console.error("Error fetching client details:", err); // Log the error to the console.
        setError(err.message || "Failed to load client details."); // Set error state for display.
        toast.error(`Error loading client: ${err.message || "Network error"}`); // Display a toast notification.
      } finally {
        setLoading(false); // Always set loading to false once the fetch operation is complete.
      }
    };

    // Only fetch client details if a clientId is available in the URL parameters.
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId, navigate, BACKEND_URL]); // Dependencies for useEffect.

  /**
   * Handles changes to form input fields.
   * Updates the `formData` state dynamically based on user input.
   * @param {Object} e - The event object from the input change.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  /**
   * Asynchronous function to handle form submission for updating client details.
   * Sends a PUT request to the backend with the updated form data.
   * @param {Object} e - The event object from the form submission.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior (page reload).
    setSubmitting(true); // Set submitting state to true.
    setError(null); // Clear any previous errors.

    const token = getToken(); // Retrieve the authentication token.

    // If no token, show an error and redirect to login.
    if (!token) {
      toast.error("Authentication required to update client."); // Display a toast notification.
      navigate("/");
      return;
    }

    try {
      // Send a PUT request to the backend API to update the client by ID.
      const response = await fetch(`${BACKEND_URL}/api/clients/${clientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json", // Specify content type as JSON.
          Authorization: `Bearer ${token}`, // Include the JWT token.
        },
        credentials: "include", // Ensures cookies are sent.
        body: JSON.stringify(formData), // Send the updated formData object as JSON.
      });

      // If the update was successful.
      if (response.ok) {
        toast.success("Client updated successfully!"); // Display success toast.
        navigate(`/clients/${clientId}`); // Navigate back to the client's detail page.
      }
      // If authentication failed or unauthorized.
      else if (response.status === 401 || response.status === 403) {
        toast.error(
          "Authentication expired or unauthorized. Please log in again."
        );
        clearAuthData();
        navigate("/login");
      }
      // Handle other errors during update.
      else {
        const errorData = await response.json(); // Attempt to parse error message.
        throw new Error(errorData.message || "Failed to update client.");
      }
    } catch (err) {
      console.error("Error updating client:", err); // Log the error.
      setError(err.message || "Failed to update client."); // Set error state.
      toast.error(`Error updating client: ${err.message || "Network error"}`); // Display error toast.
    } finally {
      setSubmitting(false); // Always set submitting to false after the operation.
    }
  };

  // --- Conditional Render Logic ---

  // Display a loading message while client data is being fetched.
  if (loading) {
    return (
      <div style={styles.loadingErrorContainer}>Loading client details...</div>
    );
  }

  // Display an error message if data fetching failed.
  if (error) {
    return (
      <div style={{ ...styles.loadingErrorContainer, color: "red" }}>
        Error: {error}
      </div>
    );
  }

  // Main component render if data is loaded successfully.
  return (
    <div className="editClientPageContainer">
      <div className="editClientPageContent">
        {/* Link to navigate back to the clients list. */}
        <Link to="/clients" className="editClientBackLink">
          {"<"} Back to Clients List
        </Link>
        {/* Headline for the edit page, displaying the client's name or ID. */}
        <h1 className="editClientHeadline">
          Edit Client: {formData.name || clientId}
        </h1>
        {/* Client editing form. */}
        <form onSubmit={handleSubmit} className="editClientForm">
          {/* Form Group for Name */}
          <div className="editClientFormGroup">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name} // CORRECTED: Now references formData.name
              onChange={handleChange}
              required
            />
          </div>
          {/* Form Group for Email */}
          <div className="editClientFormGroup">
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
          <div className="editClientFormGroup">
            <label htmlFor="phone">Primary Phone:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="editClientFormGroup">
            <label htmlFor="secondaryPhone">Secondary Phone:</label>
            <input
              type="tel"
              id="secondaryPhone"
              name="secondaryPhone"
              value={formData.secondaryPhone}
              onChange={handleChange}
            />
          </div>
          <div className="editClientFormGroup">
            <label htmlFor="nrc">NRC:</label>
            <input
              type="text"
              id="nrc"
              name="nrc"
              value={formData.nrc}
              onChange={handleChange}
            />
          </div>
          <div className="editClientFormGroup">
            <label htmlFor="address">Address:</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>
          <div className="editClientFormGroup">
            <label htmlFor="dateRegistered">Date Registered:</label>
            <input
              type="date"
              id="dateRegistered"
              name="dateRegistered"
              value={formData.dateRegistered}
              onChange={handleChange}
            />
          </div>

          <div className="editClientActionButtons">
            <button
              type="submit"
              disabled={submitting}
              className="editClientSubmitBtn"
            >
              {submitting ? "Updating..." : "Update Client"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="editClientCancelBtn"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Inline styles for the component to ensure rendering without external CSS files.
const styles = {
  pageContainer: {
    minHeight: "100vh",
    backgroundColor: "#f7fafc",
    padding: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
  },
  contentContainer: {
    backgroundColor: "#fff",
    borderRadius: "0.5rem",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    padding: "1.5rem 2rem",
    width: "100%",
    maxWidth: "48rem",
    border: "1px solid #e2e8f0",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    color: "#2563eb",
    textDecoration: "none",
    marginBottom: "1.5rem",
    fontWeight: "500",
  },
  backIcon: {
    width: "1rem",
    height: "1rem",
    marginRight: "0.25rem",
  },
  headline: {
    fontSize: "2.25rem",
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  formGroupGrid: {
    display: "grid",
    gridTemplateColumns: "1fr", // Default for mobile
    gap: "1rem",
    // In a real project, you'd use media queries in a CSS file or a CSS-in-JS solution.
    // For inline styles, media queries like this are not directly supported as JavaScript objects.
    // You would typically calculate these based on window.innerWidth or use a responsive design library.
    // Example for a responsive grid in a real app:
    // '@media (min-width: 768px)': { gridTemplateColumns: '1fr 1fr' },
    // This 'formGroupGrid' with 1fr will make it stack on smaller screens.
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#4a5568",
    marginBottom: "0.25rem",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "0.375rem",
    outline: "none",
  },
  textarea: {
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "0.375rem",
    outline: "none",
    resize: "vertical",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  submitButton: {
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    cursor: "pointer",
  },
  cancelButton: {
    backgroundColor: "#e2e8f0",
    color: "#4a5568",
    fontWeight: "bold",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: "background-color 0.3s ease, transform 0.3s ease",
    cursor: "pointer",
  },
  loadingErrorContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontSize: "1.125rem",
    color: "#4a5568",
  },
};

export default EditClientPage; // Export the component for use in other parts of the application.
