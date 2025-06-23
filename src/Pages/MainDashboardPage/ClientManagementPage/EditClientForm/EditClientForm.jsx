// src/Pages/MainDashboardPage/ClientManagementPage/EditClientForm/EditClientForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify"; // Import toast for notifications

// Import centralized API functions from the clientApi service
import { getClientById, updateClient } from "../../../../services/api/clientApi"; // Corrected import path

import "./EditClientForm.css"; // Import the new CSS file, renamed for client

/**
 * @component EditClientForm
 * @description A React component that allows an administrator to edit the details
 * of an existing client. It fetches the client's current data and pre-populates
 * the form fields for editing.
 */
const EditClientForm = () => {
    const { id: clientId } = useParams(); // Get client ID from URL parameters
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "", // Changed from 'name' to 'firstName'
        lastName: "",  // Added 'lastName'
        email: "",
        phone: "",
        secondaryPhone: "",
        nrc: "",
        address: "",
        dateRegistered: "",
    });
    const [loading, setLoading] = useState(true);     // For initial data fetch
    const [error, setError] = useState(null);         // For displaying errors within the component
    const [submitting, setSubmitting] = useState(false); // For form submission in progress

    /**
     * @function fetchClientDetails
     * @description Asynchronous function to fetch existing client details from the backend.
     * Pre-populates the form fields with the fetched data.
     * Wrapped in useCallback to prevent unnecessary re-creations.
     */
    const fetchClientDetails = useCallback(async () => {
        setLoading(true); // Set loading state to true before fetching
        setError(null);   // Clear any previous errors

        try {
            // Use the centralized getClientById function from clientApi
            const clientDataResponse = await getClientById(clientId);
            const clientData = clientDataResponse.client; // Access the nested client object

            setFormData({
                firstName: clientData.firstName || "", // Use firstName
                lastName: clientData.lastName || "",   // Use lastName
                email: clientData.email || "",
                phone: clientData.phone || "",
                secondaryPhone: clientData.secondaryPhone || "",
                nrc: clientData.nrc || "",
                address: clientData.address || "",
                // Ensure date is formatted correctly for date input type
                dateRegistered: clientData.dateRegistered
                    ? new Date(clientData.dateRegistered).toISOString().split("T")[0]
                    : "",
            });
        } catch (err) {
            console.error("Error fetching client details:", err);
            // The error from the clientApi is expected to be a user-friendly message.
            const errorMessage = err.message || "Failed to load client details. Please try again.";
            setError(errorMessage);
            toast.error(`Error loading client: ${errorMessage}`);
            // No need for manual logout/redirect here, axios interceptor handles global auth errors.
        } finally {
            setLoading(false); // Always set loading to false after fetch operation
        }
    }, [clientId]); // Depend on clientId so it re-fetches if the URL parameter changes

    // Effect hook to fetch client details when the component mounts or clientId changes
    useEffect(() => {
        if (clientId) {
            fetchClientDetails();
        }
    }, [clientId, fetchClientDetails]);

    /**
     * @function handleChange
     * @description Handles changes to form input fields.
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
     * @function handleSubmit
     * @description Handles the form submission to update client details.
     * @param {Object} e - The event object from the form submission.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); // Set submitting state to true
        setError(null);     // Clear any previous errors

        // Basic client-side validation
        if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
            const validationError = "First Name, Last Name, and Email are required fields.";
            setError(validationError);
            toast.error(validationError);
            setSubmitting(false);
            return;
        }

        try {
            // Use the centralized updateClient function from clientApi
            await updateClient(clientId, formData);

            toast.success("Client updated successfully!"); // Use toast for success message
            navigate(`/clients/${clientId}`); // Navigate back to the client details page
        } catch (err) {
            console.error("Error updating client:", err);
            // The error from the clientApi is expected to be a user-friendly message.
            const errorMessage = err.message || "Failed to update client. Please try again.";
            setError(errorMessage); // Set local error for display in the form
            toast.error(`Error updating client: ${errorMessage}`); // Use toast for error message
            // No need for manual logout/redirect here, axios interceptor handles global auth errors.
        } finally {
            setSubmitting(false); // Always set submitting to false after operation completes
        }
    };

    // --- Conditional Rendering for Loading and Error States ---
    if (loading) {
        return (
            <div className="loadingContainer">Loading client details...</div>
        );
    }

    if (error) {
        return (
            <div className="errorContainer">
                Error: {error}
            </div>
        );
    }

    // --- Main Component Render ---
    return (
        <div className="editClientPageContainer">
            <div className="editClientPageContent">
                <Link to={`/clients/${clientId}`} className="editClientBackLink">
                    Back to Client Details
                </Link>
                <h1 className="editClientHeadline">
                    Edit Client: {formData.firstName} {formData.lastName}
                </h1>
                <form onSubmit={handleSubmit} className="editClientForm">
                    {/* Form Group: First Name */}
                    <div className="editClientFormGroup">
                        <label htmlFor="firstName">First Name:</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="editClientInput"
                            disabled={submitting} // Disable during submission
                        />
                    </div>
                    {/* Form Group: Last Name */}
                    <div className="editClientFormGroup">
                        <label htmlFor="lastName">Last Name:</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className="editClientInput"
                            disabled={submitting} // Disable during submission
                        />
                    </div>
                    {/* Form Group: Email */}
                    <div className="editClientFormGroup">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="editClientInput"
                            disabled={submitting} // Disable during submission
                        />
                    </div>
                    {/* Form Group: Primary Phone */}
                    <div className="editClientFormGroup">
                        <label htmlFor="phone">Primary Phone:</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="editClientInput"
                            disabled={submitting} // Disable during submission
                        />
                    </div>
                    {/* Form Group: Secondary Phone */}
                    <div className="editClientFormGroup">
                        <label htmlFor="secondaryPhone">Secondary Phone:</label>
                        <input
                            type="tel"
                            id="secondaryPhone"
                            name="secondaryPhone"
                            value={formData.secondaryPhone}
                            onChange={handleChange}
                            className="editClientInput"
                            disabled={submitting} // Disable during submission
                        />
                    </div>
                    {/* Form Group: NRC */}
                    <div className="editClientFormGroup">
                        <label htmlFor="nrc">NRC:</label>
                        <input
                            type="text"
                            id="nrc"
                            name="nrc"
                            value={formData.nrc}
                            onChange={handleChange}
                            className="editClientInput"
                            disabled={submitting} // Disable during submission
                        />
                    </div>
                    {/* Form Group: Address */}
                    <div className="editClientFormGroup">
                        <label htmlFor="address">Address:</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3"
                            className="editClientTextarea"
                            disabled={submitting} // Disable during submission
                        ></textarea>
                    </div>
                    {/* Form Group: Date Registered */}
                    <div className="editClientFormGroup">
                        <label htmlFor="dateRegistered">Date Registered:</label>
                        <input
                            type="date"
                            id="dateRegistered"
                            name="dateRegistered"
                            value={formData.dateRegistered}
                            onChange={handleChange}
                            className="editClientInput"
                            disabled={submitting} // Disable during submission
                        />
                    </div>

                    <div className="editClientActionButtons">
                        <button
                            type="submit"
                            disabled={submitting} // Disable button while submitting
                            className="editClientSubmitBtn"
                        >
                            {submitting ? "Updating..." : "Update Client"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/clients/${clientId}`)} // Navigate back to details page
                            className="editClientCancelBtn"
                            disabled={submitting} // Disable button while submitting
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClientForm;
