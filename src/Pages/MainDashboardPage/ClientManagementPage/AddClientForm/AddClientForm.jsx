import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addClient } from "../../../../services/api"; // Corrected import path
import "./AddClientForm.css"; // Ensure this CSS file is correctly imported and named

/**
 * @component AddClientForm
 * @description A React component for adding a new client to the system.
 * It handles form input, client creation via API, and navigation.
 */
const AddClientForm = () => {
  // --- State Management ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    secondaryPhone: "",
    nrc: "",
    address: "",
    dateRegistered: new Date().toISOString().split("T")[0], // Default to current date
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  // --- Event Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the centralized API call for adding a client.
      // No need for getToken() or Authorization header here because api.js handles withCredentials: true
      await addClient(formData);
      setSuccess("Client added successfully!");
      // Clear the form fields after successful submission
      setFormData({
        name: "",
        email: "",
        phone: "",
        secondaryPhone: "",
        nrc: "",
        address: "",
        dateRegistered: new Date().toISOString().split("T")[0],
      });
      // Redirect to the clients list page after a short delay to show success message
      setTimeout(() => {
        navigate("/clients");
      }, 1500);
    } catch (err) {
      console.error("Error adding client:", err);
      // The error thrown from api.js is already the message
      setError(err || "An error occurred during client creation.");
    } finally {
      setLoading(false);
    }
  };

  // --- Render Logic ---
  return (
    <div className="addClientFormContainer">
      <div className="addClientFormContent">
        <Link to="/clients">
          <button className="addClientBackLink">Back to Clients List</button>
        </Link>
        <h2 className="addClientHeadline">Add New Client</h2>

        {success && <p className="addClientSuccessMessage">{success}</p>}
        {error && <p className="addClientErrorMessage">{error}</p>}

        <form onSubmit={handleSubmit} className="addClientForm">
          {/* Form Group: Name */}
          <div className="addClientFormGroup">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="addClientInput"
            />
          </div>
          {/* Form Group: Email */}
          <div className="addClientFormGroup">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="addClientInput"
            />
          </div>
          {/* Form Group: Primary Phone */}
          <div className="addClientFormGroup">
            <label htmlFor="phone">Primary Phone:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="addClientInput"
            />
          </div>
          {/* Form Group: Secondary Phone */}
          <div className="addClientFormGroup">
            <label htmlFor="secondaryPhone">Secondary Phone:</label>
            <input
              type="tel"
              id="secondaryPhone"
              name="secondaryPhone"
              value={formData.secondaryPhone}
              onChange={handleChange}
              className="addClientInput"
            />
          </div>
          {/* Form Group: NRC */}
          <div className="addClientFormGroup">
            <label htmlFor="nrc">NRC:</label>
            <input
              type="text"
              id="nrc"
              name="nrc"
              value={formData.nrc}
              onChange={handleChange}
              className="addClientInput"
            />
          </div>
          {/* Form Group: Address */}
          <div className="addClientFormGroup">
            <label htmlFor="address">Address:</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="addClientTextarea"
            ></textarea>
          </div>
          {/* Form Group: Date Registered */}
          <div className="addClientFormGroup">
            <label htmlFor="dateRegistered">Date Registered:</label>
            <input
              type="date"
              id="dateRegistered"
              name="dateRegistered"
              value={formData.dateRegistered}
              onChange={handleChange}
              className="addClientInput"
            />
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="addClientSubmitBtn"
          >
            {loading ? "Adding..." : "Add Client"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddClientForm;