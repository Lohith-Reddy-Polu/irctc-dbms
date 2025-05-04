import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import '../css/AdminLogin.css';
const AdminLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
    useEffect(() => {
        const checkStatus = async () => {
          // Implement your logic here
          try {
            const response = await fetch(`${apiUrl}/isAdminLoggedIn`, {
              method: "GET",
              credentials: "include", // Ensures cookies are sent
            });
    
            const data = await response.json();
            if (response.status === 200) {
              navigate("/admin-dashboard"); // Redirect to dashboard if logged in
            }
            else{
              console.log("Not logged in");
              console.log(data);
            }
          } catch (error) {
            setError("Failed to check login status");
           // console.error("Error checking login status:", error);
          }
        };
        checkStatus();
    }, [navigate]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`${apiUrl}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.status === 200) {
        navigate("/admin-dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error1) {
      console.error("Login error: ", error1);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="admin-login-container">
  <h2>Admin Login</h2>
  {error && (
    <p className="error-message" role="alert">
      {error}
    </p>
  )}
  <form onSubmit={handleSubmit}>
    <label htmlFor="email">Email:</label>
    <input
      type="email"
      name="email"
      id="email"
      placeholder=" "
      value={formData.email}
      onChange={handleChange}
      required
      aria-required="true"
    />

    <label htmlFor="password">Password:</label>
    <input
      type="password"
      name="password"
      id="password"
      placeholder=" "
      value={formData.password}
      onChange={handleChange}
      required
      aria-required="true"
    />

    <button type="submit">Login</button>
  </form>
</div>
  );
};

export default AdminLogin;