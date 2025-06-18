import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../../context/AuthContext"; // Import useAuth hook
import { getClientById, updateClient } from "../../../../services/api"; // Import centralized API functions

import "./EditClientForm.css"; // Import the new CSS file, renamed for client

/**
 * @component EditClientForm
 * @description A React component that allows an administrator to edit the details
 * of an existing client. It fetches the client's current data and pre-populates
 * the form fields for editing.
 */
const EditClientForm = () => {
  const { id: clientId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth(); // Get logout function from AuthContext

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    secondaryPhone: "",
    nrc: "",
    address: "",
    dateRegistered: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Asynchronous function to fetch existing client details from the backend.
   * Wrapped in useCallback to prevent unnecessary re-creations.
   */
  const fetchClientDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the centralized getClientById function
      const clientDataResponse = await getClientById(clientId);
      const clientData = clientDataResponse.client; // Access the nested client object

      setFormData({
        name: clientData.name || "",
        email: clientData.email || "",
        phone: clientData.phone || "",
        secondaryPhone: clientData.secondaryPhone || "",
        nrc: clientData.nrc || "",
        address: clientData.address || "",
        dateRegistered: clientData.dateRegistered
          ? new Date(clientData.dateRegistered).toISOString().split("T")[0]
          : "",
      });
      // console.log("Client details fetched successfully:", clientData); // Keep for debugging if needed
    } catch (err) {
      console.error("Error fetching client details:", err);
      const errorMessage =
        err.message || "Failed to load client details. Please try again.";
      setError(errorMessage);
      toast.error(`Error loading client: ${errorMessage}`);

      // Handle specific authentication errors
      if (err.message.includes("Authentication expired") || err.message.includes("unauthorized")) {
        logout(); // Use the logout function from AuthContext
        navigate("/loginForm"); // Redirect to login page
      }
    } finally {
      setLoading(false);
    }
  }, [clientId, navigate, logout]); // Add logout to dependencies

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId, fetchClientDetails]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Use the centralized updateClient function
      await updateClient(clientId, formData);

      toast.success("Client updated successfully!");
      navigate(`/clients/${clientId}`);
    } catch (err) {
      console.error("Error updating client:", err);
      const errorMessage =
        err.message || "Failed to update client. Please try again.";
      setError(errorMessage);
      toast.error(`Error updating client: ${errorMessage}`);

      // Handle specific authentication errors
      if (err.message.includes("Authentication expired") || err.message.includes("unauthorized")) {
        logout(); // Use the logout function from AuthContext
        navigate("/loginForm"); // Redirect to login page
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingErrorContainer}>Loading client details...</div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.loadingErrorContainer, color: "red" }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="editClientPageContainer">
      <div className="editClientPageContent">
        <Link to="/clients" className="editClientBackLink">
          Clients List
        </Link>
        <h1 className="editClientHeadline">
          Edit Client: {formData.name || clientId}
        </h1>
        <form onSubmit={handleSubmit} className="editClientForm">
          <div className="editClientFormGroup">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
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

export default EditClientForm;