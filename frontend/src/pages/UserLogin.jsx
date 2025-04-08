import React, { useState } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const UserLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

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
      const response = await fetch(`${apiUrl}/user-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Login response: ", response.status, data);
      if (response.status === 200) {
        navigate("/user-dashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error1) {
      console.error("Login error: ", error1);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error ? <p style={{ color: "red" }}>{error}</p> : null}
      <form onSubmit={handleSubmit}>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <label>
          Password:
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <a href="/user-signup">Sign up here</a>
      </p>
    </div>
  );
};

export default UserLogin;