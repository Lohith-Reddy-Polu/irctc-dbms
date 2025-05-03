import React ,{useState,useEffect} from 'react';
import Navbar from '../components/Navbar';
import { apiUrl } from '../config/config';
import { useNavigate } from 'react-router-dom';
import '../css/UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking user status...");
        const response = await fetch(`${apiUrl}/isUserLoggedIn`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        console.log(data);
        if (response.status !== 200) {
          navigate('/');
        }
        else{
            setUser(data.username);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        navigate('/');
      }
    };

    checkUser();
  }
  , [navigate]);

  return (
    <div className="dashboard-container">
      <Navbar isAdmin={false} />
      <h2>User Dashboard</h2>
      <p>Welcome, {user}</p>
      <p>Look trains, view bookings, and more.</p>
    </div>
  );
};

export default UserDashboard;