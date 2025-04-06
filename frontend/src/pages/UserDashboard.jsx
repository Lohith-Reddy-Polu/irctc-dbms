import React from "react";
import { Link } from "react-router-dom";

const UserDashboard = () => {
  return (
    <div className="container">
      <h2>Welcome User!</h2>
      <Link to="/trains" className="btn">View Trains</Link>
    </div>
  );
};

export default UserDashboard;
