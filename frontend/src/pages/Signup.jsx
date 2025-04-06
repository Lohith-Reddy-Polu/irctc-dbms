import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const Signup = () => {
  const navigate = useNavigate(); // Use this to redirect users

  // TODO: Implement the checkStatus function.
  // If the user is already logged in, make an API call 
  // to check their authentication status.
  // If logged in, redirect to the dashboard.
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include",
        });
        if (response.status === 200) {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };
    checkStatus();
  }, [navigate]);

  // Read about useState to understand how to manage component state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState('');
  // This function handles input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Read about the spread operator (...) to understand this syntax
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // TODO: Implement the sign-up operation
  // This function should send form data to the server
  // and handle success/failure responses.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Implement the sign-up logic here
    try {
      const response = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.status === 200) {
        navigate("/dashboard"); 
      } else {
        setErrorMessage(data.message); 
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  // TODO: Use JSX to create a sign-up form with input fields for:
  // - Username
  // - Email
  // - Password
  // - A submit button
  return (
    <div>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
        <br />

        <label htmlFor="email">Email:</label>
        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required/>
        <br />

        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required/>
        <br />

        <button type="submit">Sign Up</button>
      </form>

      <p>
        Already have an account? <a href="/login">Login here</a>
      </p>

      {errorMessage && <p className="error">{errorMessage}</p>}
    </div>
  );
};

export default Signup;
