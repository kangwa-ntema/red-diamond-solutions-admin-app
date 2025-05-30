import React, { useState } from 'react';

import { useNavigate, Link } from 'react-router-dom';

import { getToken } from '../utils/authUtils';

/* import './AddCustomerForm.css'; */



const AddCustomerForm = () => {

    const [formData, setFormData] = useState({

        name: '',

        email: '',

        phone: '',

        secondaryPhone: '',

        nrc: '',

        address: '', // UPDATED: Now a single string

        dateRegistered: new Date().toISOString().split('T')[0]

    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null);

    const [success, setSuccess] = useState(null);



    const navigate = useNavigate();

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;



    const handleChange = (e) => {

        const { name, value } = e.target;

        // UPDATED: Simpler handling for all fields, no more nested address logic

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



        const token = getToken();



        if (!token) {

            setError("Authentication required. Please log in.");

            setLoading(false);

            navigate('/login');

            return;

        }



        try {

            const response = await fetch(`${BACKEND_URL}/api/customers`, {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json',

                    'Authorization': `Bearer ${token}`

                },

                credentials: 'include',

                body: JSON.stringify(formData)

            });



            if (response.ok) {

                setSuccess('Customer added successfully!');

                setFormData({ // Clear form after successful submission

                    name: '',

                    email: '',

                    phone: '',

                    secondaryPhone: '',

                    nrc: '',

                    address: '', // UPDATED: Reset as a string

                    dateRegistered: new Date().toISOString().split('T')[0]

                });

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

            <Link className="back-to-dashboard-btn" to="/customers">

                {"<"} Back to Customers List

            </Link>

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

                    <label htmlFor="phone">Primary Phone:</label>

                    <input

                        type="tel"

                        id="phone"

                        name="phone"

                        value={formData.phone}

                        onChange={handleChange}

                    />

                </div>

                <div className="form-group">

                    <label htmlFor="secondaryPhone">Secondary Phone:</label>

                    <input

                        type="tel"

                        id="secondaryPhone"

                        name="secondaryPhone"

                        value={formData.secondaryPhone}

                        onChange={handleChange}

                    />

                </div>

                <div className="form-group">

                    <label htmlFor="nrc">NRC:</label>

                    <input

                        type="text"

                        id="nrc"

                        name="nrc"

                        value={formData.nrc}

                        onChange={handleChange}

                    />

                </div>

                <div className="form-group">

                    <label htmlFor="address">Address:</label> {/* UPDATED: Single field */}

                    <textarea

                        id="address"

                        name="address"

                        value={formData.address}

                        onChange={handleChange}

                        rows="3"

                    ></textarea>

                </div>

                <div className="form-group">

                    <label htmlFor="dateRegistered">Date Registered:</label>

                    <input

                        type="date"

                        id="dateRegistered"

                        name="dateRegistered"

                        value={formData.dateRegistered}

                        onChange={handleChange}

                    />

                </div>



                <button type="submit" disabled={loading} className="submit-btn">

                    {loading ? 'Adding...' : 'Add Customer'}

                </button>



                {success && <p className="success-message">{success}</p>}

                {error && <p className="error-message">{error}</p>}

            </form>

        </div>

    );

};

export default AddCustomerForm;