import React from "react";
import { Link } from "react-router-dom";
import '../css/HomePage.css';

const HomePage = () => {
  return (
    <div className="container">
      <h1>Welcome to Railway Reservation</h1>
      <div className="button-group">
        <Link to="/user-login" className="btn">User Login</Link>
        <br></br>
        <Link to="/admin-login" className="btn">Admin Login</Link>
        <br></br>
        <Link to="/user-signup" className="btn">User Signup</Link>
      </div>
    </div>
  );
};

export default HomePage;
