import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MyTickets from './pages/MyTickets';
import Booking from './pages/Booking';
import HomePage from './pages/HomePage';
import UserSignup from './pages/UserSignup';
import UserLogin from './pages/UserLogin';
import UserDashboard from './pages/UserDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AddTrainPage from './pages/AddTrainPage';
import TrainsPage from './pages/TrainsPage';
import NotFound from './pages/NotFound';
import LiveTrainTracker from './pages/LiveTrainTracker';
import DeleteAccount from './pages/DeleteAccount';
import Profile from './pages/Profile';
import Orderfood from './pages/Orderfood';
import ForgotPassword from './pages/ForgotPassword';
import './styles.css';

const App = () => {
  // Example state to determine if the user is an admin
  const isAdmin = false; // This should be determined by your authentication logic

  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/user-signup" element={<UserSignup />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/add-train" element={<AddTrainPage />} />
        <Route path="/trains" element={<TrainsPage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/book" element={<Booking />} />       
        <Route path="/my-tickets" element={<MyTickets />} />    
        <Route path="/live-status" element={<LiveTrainTracker />} />    
        <Route path="/delete-account" element={<DeleteAccount />} />    
        <Route path="/profile" element={<Profile />} />  
        <Route path="/order-food" element={<Orderfood />} />  
        <Route path="/forgot-password" element={<ForgotPassword />} />  
      </Routes>
    </div>
  );
};

export default App;