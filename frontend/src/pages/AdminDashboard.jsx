import React from "react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="container">
      <h2>Welcome Admin!</h2>
      <div className="button-group">
        <Link to="/trains" className="btn">Manage Trains</Link>
        <Link to="/add-train" className="btn">Add New Train</Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
