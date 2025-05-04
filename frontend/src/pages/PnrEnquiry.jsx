import React, { useState } from 'react';
import { apiUrl } from "../config/config";
import "../css/pnrenquiry.css";
import Navbar from '../components/Navbar';

const PNREnquiry = () => {
  const [pnrNumber, setPnrNumber] = useState("");
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");

  const handleEnquiry = async () => {
    setError("");
    try {
      const res = await fetch(`${apiUrl}/pnr-enquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ pnrNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PNR not valid");

      setTickets(data.tickets);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setTickets(null);
    }
  };

  const renderTable = () => {
    if (!tickets || tickets.length === 0) return null;

    const { train_name, train_no } = tickets[0];

    return (
      <div className="pnr-results">
        <h2>Train: {train_name} ({train_no})</h2>
        <table className="pnr-table">
          <thead>
            <tr>
              <th>Passenger Name</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Booking Status</th>
              <th>Seat Info</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, index) => (
              <tr key={index}>
                <td>{ticket.passenger_name}</td>
                <td>{ticket.passenger_gender}</td>
                <td>{ticket.passenger_age}</td>
                <td>{ticket.booking_status}</td>
                <td>
                {ticket.booking_status.toLowerCase() === "confirmed"
                    ? `${ticket.bhogi}-${ticket.seat_number}`
                    : ticket.booking_status.toLowerCase() === "cancelled"
                      ? "Cancelled"
                      : `WL${ticket.waitlist_number}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="pnr-enquiry-container">
      <Navbar isAdmin={false} />
      <h1>PNR Enquiry</h1>
      <input
        type="number"
        placeholder="Enter PNR Number"
        value={pnrNumber}
        onChange={(e) => setPnrNumber(e.target.value)}
      />
      <button onClick={handleEnquiry}>Check Status</button>
      {error && <p className="error">{error}</p>}
      {renderTable()}
    </div>
  );
};

export default PNREnquiry;
