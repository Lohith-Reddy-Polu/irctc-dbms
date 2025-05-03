import React, { useState } from 'react';
import { apiUrl } from "../config/config";
import "../css/orderfood.css";

const CancelTicket = () => {
  const [pnr, setPnr] = useState('');
  const [booking, setBooking] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validatePNR = async (pnrNumber) => {
    const res = await fetch(`${apiUrl}/validate-pnr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pnrNumber }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "PNR not valid");
    return data;
  };

  const cancelTicket = async (ticketId) => {
    try {
      const res = await fetch(`${apiUrl}/cancel-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ticketId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Cancellation failed");

      setTickets(prev => prev.filter(t => t.ticket_id !== ticketId));
      setMessage(`Ticket ${ticketId} cancelled successfully.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitPNR = async () => {
    try {
      setError('');
      setMessage('');
      const data = await validatePNR(pnr);
      setBooking(data.booking);
      setTickets(data.tickets);
    } catch (err) {
      setBooking(null);
      setTickets([]);
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Cancel Your Ticket</h1>

      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Enter PNR number"
          value={pnr}
          onChange={e => setPnr(e.target.value)}
          className="border p-2 flex-1"
        />
        <button onClick={handleSubmitPNR} className="ml-2 bg-blue-500 text-white p-2 rounded">
          Submit
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {message && <p className="text-green-600 mt-2">{message}</p>}

      {tickets.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Passengers:</h2>
          <table className="w-full table-auto border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Gender</th>
                <th className="p-2 border">Age</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.ticket_id} className="text-center">
                  <td className="p-2 border">{ticket.passenger_name}</td>
                  <td className="p-2 border">{ticket.passenger_gender}</td>
                  <td className="p-2 border">{ticket.passenger_age}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => cancelTicket(ticket.ticket_id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CancelTicket;
