// import React from "react";

// const UserSignup = () => {
//   return (
//     <div className="container">
//       <h2>User Signup</h2>
//       <form>
//         <input type="text" placeholder="Name" required />
//         <input type="email" placeholder="Email" required />
//         <input type="password" placeholder="Password" required />
//         <input type="text" placeholder="Phone Number" required />
//         <button type="submit">Signup</button>
//       </form>
//     </div>
//   );
// };

// export default UserSignup;


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const UserSignup = () => {
  const navigate = useNavigate(); // Use this to redirect users
  const [error,setError] = useState(null);

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
        setError(data.message || "Signup failed");
       }
    }
    catch(error1){
      console.error("Signup error: ",error1);
      setError("An error occured. Please try again mmmmmm. ");
    }
    // Implement the sign-up logic here
  };
  return (
    <div>
      {/* Implement the form UI here */}
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
        <br />
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
        <br />
        <button type="submit">Sign Up</button>
        </form>
      <p>
        Already have an account? <a href="/user-login">Login here</a>
      </p>
    </div>
  );
};

export default UserSignup;
