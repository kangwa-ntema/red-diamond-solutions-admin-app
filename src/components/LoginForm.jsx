import "./LoginForm.css";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Keep this if you want cookies to still be sent for some browsers
        body: JSON.stringify({ username, password }),
      });

      const responseData = await response.json(); // <--- Parse the JSON response

      if (response.ok) {
        // Login successful, the cookie is set by the backend.
        // NOW, ALSO STORE THE TOKEN FROM THE RESPONSE BODY IN LOCAL STORAGE
        if (responseData.token) {
          localStorage.setItem("jwtToken", responseData.token); // Store the token
          // You might also store user info if available in responseData
          localStorage.setItem("userInfo", JSON.stringify(responseData.user));
          navigate("/dashboard");
        } else {
          // This should ideally not happen if backend sends token
          setError("Login successful, but no token received.");
        }
      } else {
        setError(responseData.message || "Login failed");
      }
    } catch (err) {
      setError("Error during login");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="loginFormContainer">
      <Link to="/" >
        <button className="backHomeBtn">Back Home</button>
      </Link>
      <div className="loginForm">
        <p className="signInHeadline">LOG IN.</p>
        <form onSubmit={handleSubmit}>
          <div className="signInFormElement">
            <label htmlFor="username">
              <p>Username</p>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <div className="signInFormElement">
              <label htmlFor="password">
                <p>Password</p>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </div>
          </div>
          <button type="submit" disabled={loading} className="logInBtn">
            {loading ? "Loading..." : "Log In"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </section>
  );
};

export default LoginForm;
