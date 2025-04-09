import React, { useEffect, useState } from "react";
import { apiUrl } from "../config/config";
import axios from "axios";

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Tickets</h1>
      {error && <p className="text-red-600">{error}</p>}

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map((b, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-5 mb-6 border">
            <h2 className="text-xl font-semibold">PNR: {b.pnr_number}</h2>
            <p className="text-gray-700">Train: {b.train_name} ({b.train_no})</p>
            <p className="text-gray-700">Travel Date: {b.travel_date}</p>
            <p className="text-gray-700">Booking Date: {b.booking_date}</p>
            <p className="text-gray-700">Status: {b.booking_status}</p>
            <p className="text-gray-700">Total Fare: ₹{b.total_fare}</p>

            <h3 className="mt-4 font-semibold">Passengers:</h3>
            <ul className="list-disc pl-6">
              {b.passengers.map((p, idx) => (
                <li key={idx}>
                  {p.name} ({p.gender}, {p.age} yrs) - Seat: {p.bhogi}-{p.seat_number} [{p.class}]
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
