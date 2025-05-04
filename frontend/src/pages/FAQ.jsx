import React ,{useState,useEffect} from 'react';
import Navbar from '../components/Navbar';
import { apiUrl } from '../config/config';
import { useNavigate } from 'react-router-dom';
import '../css/FAQ.css';

const FAQ = () => {
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
    <div className="faq-container">
      <Navbar isAdmin={false} />
      <div className="faq-section">
        <h2>Frequently Asked Questions (FAQ)</h2>
        <div className="faq-item">
          <h3>1. How do I book a train ticket?</h3>
          <p>To book a train ticket, simply go to the booking section, select your train, date, and preferred seat, and proceed to payment.</p>
        </div>
        <div className="faq-item">
          <h3>2. What is the PNR number?</h3>
          <p>The PNR (Passenger Name Record) is a unique code assigned to your booking. It allows you to track the status of your reservation and access booking details.</p>
        </div>
        <div className="faq-item">
          <h3>4. What happens if my train is delayed?</h3>
          <p>You can check the train status via the "Live status" feature on the website.</p>
        </div>
        <div className="faq-item">
          <h3>5. How do I check my booking status?</h3>
          <p>You can check your booking status by entering your PNR number in the "PNR Enquiry" section. This will show you the current status of your reservation.</p>
        </div>
        <div className="faq-item">
          <h3>6. How do I cancel my train ticket?</h3>
          <p>If you need to cancel your train ticket, go to the "Cancel Ticket" section and follow the cancellation process. Cancellation charges may apply.</p>
        </div>
        <div className="faq-item">
          <h3>7. What is waitlisting in train bookings?</h3>
          <p>Waitlisting occurs when all seats are booked. If a confirmed seat is canceled, the waitlisted passenger will be upgraded based on their position in the queue.</p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;