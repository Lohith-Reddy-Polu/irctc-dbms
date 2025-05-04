import React ,{useState,useEffect} from 'react';
import Navbar from '../components/Navbar';
import { apiUrl } from '../config/config';
import { useNavigate } from 'react-router-dom';
import '../css/AdminDashboard.css';


const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch(`${apiUrl}/isAdminLoggedIn`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (response.status !== 200) {
          navigate('/');
        }
        else{
            setAdmin(data.adminname);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };

    checkAdmin();
  }
  , [navigate]);

  // return (
  //   <div>
  //     <Navbar isAdmin={true} />
  //     <h2>Admin Dashboard</h2>
  //     <p>Welcome, Admin {admin}</p>
  //     <p>Manage trains, view bookings, and more.</p>
  //   </div>
  // );
  return (
<div>
  <Navbar isAdmin={true} />
  <div className="admin-dashboard-container">
    <h2>Admin Dashboard</h2>
    <p><strong>Welcome, {admin}</strong></p>
    <p>Manage trains, view bookings, and more.</p>
    
  </div>
</div>
  );
  
};

export default AdminDashboard;