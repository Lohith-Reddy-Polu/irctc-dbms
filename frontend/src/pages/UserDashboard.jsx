import React ,{useState,useEffect} from 'react';
import Navbar from '../components/Navbar';
import { apiUrl } from '../config/config';
import { useNavigate } from 'react-router-dom';

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
        if (response.status !== 200) {
          navigate('/');
        }
        else{
            setUser(data.userId);
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
    <div>
      <Navbar isAdmin={false} />
      <h2>User Dashboard</h2>
      <p>Welcome, User {user}</p>
      <p>Look trains, view bookings, and more.</p>
    </div>
  );
};

export default UserDashboard;