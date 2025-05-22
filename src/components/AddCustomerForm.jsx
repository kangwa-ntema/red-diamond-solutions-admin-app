import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Optional: import a CSS file if you have one for this form
import './AddCustomerForm.css';

const AddCustomerForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/customers', { // Use relative path for proxy
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Needed to send the JWT cookie
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Customer added successfully!');
        setFormData({ // Clear form after successful submission
          name: '',
          email: '',
          phone: '',
          address: ''
        });
        // Optional: Redirect to the customers list after a short delay
        setTimeout(() => {
          navigate('/customers');
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add customer.');
      }
    } catch (err) {
      console.error('Error adding customer:', err);
      setError('An error occurred during customer creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-customer-form-container">
      <h2>Add New Customer</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
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
        <div className="form-group">
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
        <div className="form-group">
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel" // Use type="tel" for phone numbers
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="address">Address:</label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding...' : 'Add Customer'}
        </button>

        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}
      </form>
      <button onClick={() => navigate('/customers')} className="back-btn">
        Back to Customers
      </button>
    </div>
  );
};

export default AddCustomerForm;