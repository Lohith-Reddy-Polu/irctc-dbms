import React ,{useState,useEffect} from 'react';
import Navbar from '../components/Navbar';
import { apiUrl } from '../config/config';
import { useNavigate } from 'react-router-dom';



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
            setAdmin(data.adminId);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };

    checkAdmin();
  }
  , [navigate]);

  return (
    <div>
      <Navbar isAdmin={true} />
      <h2>Admin Dashboard</h2>
      <p>Welcome, Admin {admin}</p>
      <p>Manage trains, view bookings, and more.</p>
    </div>
  );
};

export default AdminDashboard;