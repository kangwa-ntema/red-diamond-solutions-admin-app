import { Link, useNavigate } from "react-router-dom";

import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "GET",
        credentials: "include", // Ensure this sends cookies to clear the token
      });

      if (response.ok) {
        navigate("/loginform"); // Redirect to login page after successful logout
      } else {
        const errorData = await response.json();
        console.error(
          "Logout failed:",
          errorData.message || "Server error during logout."
        );
        // Even if backend reports an error, for UX, still redirect to login
        navigate("/loginform");
      }
    } catch (err) {
      console.error("Network error during logout:", err);
      // For network errors, still attempt to redirect
      navigate('/loginform');
    }
  };

  return (
    <>
      <h1>Hello, welcome to the dashboard.</h1>
      <nav>
        <ul>
          <li>
            <Link to="/customers">Manage Clients</Link> {/* Add this link */}
          </li>
          <li>
            <Link to="/accounting">Manage Accounting</Link>{" "}
            {/* Add this link */}
          </li>
          {/* <li>
            <Link to="/changePasswordForm">Change Password</Link> 
          </li> */}
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </li>
          {/* You can add a logout link here later too */}
        </ul>
      </nav>
    </>
  );
};

export default Dashboard;
