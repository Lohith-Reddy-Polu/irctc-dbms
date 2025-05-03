import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import '../css/UserSignup.css';

const UserSignup = () => {
  const navigate = useNavigate(); // Use this to redirect users
  const [error,setError] = useState(null);
  
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
    username: "",
    email: "",
    password: "",
    phone_number: "",
  });

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
    setError("");
    try{
       const response = await fetch(`${apiUrl}/user-signup`,{
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials : "include",
        body : JSON.stringify(formData),
       });

       const data = await response.json();
       if (response.status === 200){
        navigate("/user-dashboard");
       } else{
        setError(data.error || "Signup failed");
       }
    }
    catch(error1){
      console.error("Signup error: ",error1);
      setError("An error occured. Please try again mmmmmm. ");
    }
    // Implement the sign-up logic here
  };
  // return (
  //   <div className="signup-wrapper">
  //     {/* Implement the form UI here */}
  //     <h2>Sign Up</h2>
  //     {error ? <p style={{ color: "red" }}>{error}</p> : null}
  //     <form onSubmit={handleSubmit}>
  //       <label>
  //         Username:
  //         <input
  //           type="text"
  //           name="username"
  //           value={formData.username}
  //           onChange={handleChange}
  //           required
  //         />
  //       </label>
  //       <br />
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
  //       <label>
  //       Phone Number:
  //       <input
  //         type="tel"
  //         name="phone_number" 
  //         value={formData.phone_number}
  //         onChange={handleChange}
  //         required
  //         pattern="[0-9]{10}" 
  //         placeholder="Enter 10-digit number"
  //       />
  //     </label>
  //       <br />
  //       <button type="submit">Sign Up</button>
  //       </form>
  //     <p>
  //       Already have an account? <a href="/user-login">Login here</a>
  //     </p>
  //   </div>
  // );
  return (
    <div className="signup-wrapper">
      <div className="signup-content">
        <h2>Sign Up</h2>
        {error ? <p style={{ color: "red" }}>{error}</p> : null}
        <form onSubmit={handleSubmit}>
          <label>
            Username:
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>
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
          <label>
            Phone Number:
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              placeholder="Enter 10-digit number"
            />
          </label>
          <button type="submit">Sign Up</button>
        </form>
        <p>
          Already have an account? <a href="/user-login">Login here</a>
        </p>
      </div>
    </div>
  );
  
};

export default UserSignup;
