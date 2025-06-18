// src/pages/NotFoundPage.js
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '50px auto', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '2em', marginBottom: '20px', color: '#333' }}>404 - Page Not Found</h2>
            <p style={{ fontSize: '1.1em', marginBottom: '30px' }}>Oops! The page you are looking for does not exist.</p>
            <Link to="/mainDashboard" style={{ display: 'inline-block', padding: '12px 25px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '1em', transition: 'background-color 0.3s ease' }}>Go to Dashboard</Link>
        </div>
    );
};

export default NotFoundPage;