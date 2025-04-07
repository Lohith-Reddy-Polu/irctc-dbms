import React from 'react';
import Navbar from '../components/Navbar';

const UserDashboard = () => {
  return (
    <div>
      <Navbar isAdmin={false} />
      <h2>User Dashboard</h2>
      <p>Welcome to your dashboard. Here you can view your bookings and manage your account.</p>
    </div>
  );
};

export default UserDashboard;