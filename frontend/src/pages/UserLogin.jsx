import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import '../css/UserLogin.css';

const UserLogin = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkStatus = async () => {
      // Implement your logic here
      try {
        const response = await fetch(`${apiUrl}/isUserLoggedIn`, {
          method: "GET",
          credentials: "include", // Ensures cookies are sent
        });
        const data = await response.json();
        if (response.status === 200) {
          navigate("/user-dashboard"); // Redirect to dashboard if logged in
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

  // return (
  //   <div>
  //     <h2>Login</h2>
  //     {error ? <p style={{ color: "red" }}>{error}</p> : null}
  //     <form onSubmit={handleSubmit}>
  //       <label>
  //         Email:
  //         <input
  //           type="email"
  //           name="email"
  //           value={formData.email}
  //           onChange={handleChange}
  //           required
  //         />
  //       </label>
  //       <br />
  //       <label>
  //         Password:
  //         <input
  //           type="password"
  //           name="password"
  //           value={formData.password}
  //           onChange={handleChange}
  //           required
  //         />
  //       </label>
  //       <br />
  //       <button type="submit">Login</button>
  //     </form>
  //     <p>
  //       Don't have an account? <a href="/user-signup">Sign up here</a>
  //     </p>
  //   </div>
  // );
  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        {error ? <p className="error">{error}</p> : null}
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
          <button type="submit">Login</button>
        </form>
        <p>
          Don't have an account? <a href="/user-signup">Sign up here</a>
        </p>
      </div>
    </div>
  );
  
};

export default UserLogin;