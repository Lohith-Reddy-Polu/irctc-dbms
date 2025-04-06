import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">Railway Reservation</Link>
        <ul className="navbar-links">
          <li><Link to="/user-login">User Login</Link></li>
          <li><Link to="/admin-login">Admin Login</Link></li>
          <li><Link to="/user-signup">User Signup</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
