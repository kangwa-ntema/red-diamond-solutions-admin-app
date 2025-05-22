import "./Customers.css";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Make sure this URL points to your backend
        const response = await fetch("/api/customers", {
          method: "GET",
          // Credentials are important for sending the HTTP-only cookie
          credentials: "include", // This sends cookies with the request
        });

        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        } else if (response.status === 401 || response.status === 403) {
          // If not authenticated or unauthorized, redirect to login
          console.error("Authentication required or unauthorized.");
          navigate("/"); // Or just '/' if LandingPage has login link
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch customers");
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Network error or server unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [navigate]); // Add navigate to dependency array

  if (loading) {
    return <div>Loading customers...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }
  return (
    <div className="customers-container">
                <li><Link to="/dashboard">Back to Dashboard</Link></li>
      
      <h1>Clients List</h1>
      
      {customers.length === 0 ? (
        <p>No clients found. Add a new customer!</p>
      ) : (
        <ul className="customer-list">
          {customers.map((customer) => (
            <li key={customer._id} className="customer-item">
              <h3>{customer.name}</h3>
              <p>Email: {customer.email}</p>
              <p>Phone: {customer.phone}</p>
              {customer.address && (
                <p>
                  Address: {customer.address.street}, {customer.address.city},{" "}
                  {customer.address.state}, {customer.address.zip},{" "}
                  {customer.address.country}
                </p>
              )}
              {/* Add buttons for Edit/Delete later */}
              {/* <button onClick={() => handleEdit(customer._id)}>Edit</button> */}
              {/* <button onClick={() => handleDelete(customer._id)}>Delete</button> */}
            </li>
          ))}
        </ul>
      )}
      <Link to="/customers/add">
        <button className="add-customer-btn">Add New Client</button>
      </Link>
    </div>
  );
};

export default Customers;
