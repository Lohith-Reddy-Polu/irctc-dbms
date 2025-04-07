import React from 'react';
import Navbar from '../components/Navbar';

const AdminDashboard = () => {
  return (
    <div>
      <Navbar isAdmin={true} />
      <h2>Admin Dashboard</h2>
      <p>Manage trains, view bookings, and more.</p>
    </div>
  );
};

export default AdminDashboard;