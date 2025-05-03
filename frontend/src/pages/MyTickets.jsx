// Frontend: MyTickets.js
import React, { useEffect, useState } from "react";
import { apiUrl } from "../config/config";
import axios from "axios";
import Navbar from '../components/Navbar';
import '../css/MyTickets.css';

const MyTickets = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${apiUrl}/my-tickets`, {
          withCredentials: true,
        });
        setBookings(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load your tickets.");
      }
    };

    fetchBookings();
  }, []);

  const getStatusDisplay = (status, waitlistNumber) => {
    if (status === 'Confirmed') return 'Confirmed';
    if (status === 'Waiting') return `Waitlist (WL${waitlistNumber})`;
    return status;
  };

  const formatStation = (station) => {
    return `${station.name} (${station.code})`;
  };

  return (
    <div className="my-tickets-container">
      <Navbar isAdmin={false} />
      <h1>My Tickets</h1>
      {error && <p className="error-message">{error}</p>}

      {bookings.length === 0 ? (
        <p className="no-bookings">No bookings found.</p>
      ) : (
        bookings.map((b, i) => (
          <div key={i} className="ticket-card">
            <h2 className="ticket-header">PNR: {b.pnr_number}</h2>
            <div className="ticket-info">
              <p><span className="label">Train:</span> {b.train_name} ({b.train_no})</p>
              <p className="route-info">
                <span className="label">Route:</span> 
                <span className="station-details">
                  {formatStation(b.source_station)} → {formatStation(b.destination_station)}
                </span>
              </p>
              <p><span className="label">Travel Date:</span> {new Date(b.travel_date).toLocaleDateString('en-IN')}</p>
              <p><span className="label">Booking Date:</span> {new Date(b.booking_date).toLocaleDateString('en-IN')}</p>
              <p><span className="label">Total Fare:</span> ₹{b.total_fare}</p>
            </div>

            <h3 className="mt-4 font-semibold">Passengers:</h3>
            <ul className="passenger-list">
              {b.passengers.map((p, idx) => (
                <li key={idx} className="passenger-item">
                  {p.name} ({p.gender}, {p.age} yrs)
                  {p.booking_status === 'Confirmed' && p.seat_number !== 'N/A' ? (
                    <> - Seat: {p.bhogi}-{p.seat_number} [{p.class}]</>
                  ) : null}
                  <span className={`status-badge ${
                    p.booking_status === 'Confirmed' ? 'status-confirmed' : 
                    p.booking_status === 'Waiting' ? 'status-waitlist' : ''
                  }`}>
                    {getStatusDisplay(p.booking_status, p.waitlist_number)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default MyTickets;