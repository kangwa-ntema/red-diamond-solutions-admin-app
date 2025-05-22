import "./LoginForm.css";
import React, { useState } from "react";
import {useNavigate} from "react-router-dom"

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // Login successful, the cookie is set by the backend
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Login failed");
      }
    } catch (err) {
      setError("Error during login");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
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
    </>
  );
};

export default LoginForm;
