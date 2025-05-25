import React from 'react';
import { Link } from 'react-router-dom';
import './Accounting.css'; 

const Accounting = () => {
  return (
    <div className="accounting-container">
        <nav>
        <ul role='list'>
          <li><Link to="/dashboard"> {"<"} Back to Dashboard</Link></li>
        </ul>
      </nav>
      <h1>Accounting Management</h1>
      <p>This is where you will manage loan transactions, payments, etc.</p>
      
    </div>
  );
};

export default Accounting;