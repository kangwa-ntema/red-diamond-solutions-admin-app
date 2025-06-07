import { Link, useNavigate } from "react-router-dom";
import "./MainDashboard.css"; // Ensure this CSS file is correctly imported

const MainDashboard = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  // handleLogout function is now moved to Settings.jsx
  // const handleLogout = async () => { ... };

  return (
    // Add a container div with class for overall styling
    <div className="mainDashboardContainer">
      {/* Content wrapper div */}
      <div className="mainDashboardContent"> {/* This was previously mainDashboardContainer, adjusted to reflect content box */}
        <h1 className="mainDashboardHeadline">Hello, welcome to the dashboard.</h1>
        <nav className="mainDashboardNav">
          <ul role="list" className="mainDashboardNavList">
            <li className="mainDashboardNavLink" >
              <Link to="/clients">Manage Clients</Link>
            </li>
            <li className="mainDashboardNavLink" >
              <Link to="/loans">Manage Loans</Link>
            </li>
            <li className="mainDashboardNavLink" >
              <Link to="/transactions">Manage Accounting</Link>
            </li>
            <li className="mainDashboardNavLink" >
              <Link to="/accounts">Chart Of Accounts</Link>
            </li>
            <li className="mainDashboardNavLink" >
              <Link to="/settings">Settings</Link> {/* Updated link to /settings */}
            </li>
            {/* Removed Change Password and Logout links from here */}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MainDashboard;
