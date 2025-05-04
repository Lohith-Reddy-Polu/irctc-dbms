import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import '../css/CancelTicket.css';

const CancelTicket = () => {
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState("");
    const [tickets, setTickets] = useState([]);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await fetch(`${apiUrl}/future-bookings`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                setBookings(data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const fetchTickets = async (bookingId) => {
        try {
            const response = await fetch(`${apiUrl}/booking-tickets/${bookingId}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                setTickets(data);
                setSelectedTickets([]);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch tickets');
        }
    };

    const handleBookingSelect = (e) => {
        const bookingId = e.target.value;
        setSelectedBooking(bookingId);
        if (bookingId) {
            fetchTickets(bookingId);
        } else {
            setTickets([]);
            setSelectedTickets([]);
        }
    };

    const handleTicketSelect = (ticketId) => {
        setSelectedTickets(prev => {
            if (prev.includes(ticketId)) {
                return prev.filter(id => id !== ticketId);
            } else {
                return [...prev, ticketId];
            }
        });
    };

    const handleCancelTickets = async () => {
        if (!selectedTickets.length) {
            setError('Please select tickets to cancel');
            return;
        }

        if (!window.confirm('Are you sure you want to cancel the selected tickets?')) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/cancel-tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ ticketIds: selectedTickets }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Tickets cancelled successfully');
                fetchTickets(selectedBooking);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to cancel tickets');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div>
            <Navbar isAdmin={false} />
        <div className="cancel-ticket-container">
            <h2>Cancel Tickets</h2>

            <div className="booking-select-container">
                <select 
                    value={selectedBooking}
                    onChange={handleBookingSelect}
                    className="booking-select"
                >
                    <option value="">Select a booking</option>
                    {bookings.map(booking => (
                        <option key={booking.booking_id} value={booking.booking_id}>
                            {`${booking.train_name} - ${new Date(booking.travel_date).toLocaleDateString()} - PNR: ${booking.pnr_number}`}
                        </option>
                    ))}
                </select>
            </div>

            {tickets.length > 0 && (
                <div className="tickets-container">
                    {tickets.map(ticket => (
                        <div key={ticket.ticket_id} className="ticket-card">
                            <div className="ticket-checkbox">
                            <input
                                type="checkbox"
                                checked={selectedTickets.includes(ticket.ticket_id)}
                                onChange={() => handleTicketSelect(ticket.ticket_id)}
                                disabled={ticket.booking_status === 'Cancelled'}
                            />
                            </div>
                            <div className="ticket-info">
                            <h3>{ticket.passenger_name}</h3>
                            <p>Age: {ticket.passenger_age} | Gender: {ticket.passenger_gender}</p>
                            <p>
                                Class: {ticket.class} | Coach: {ticket.bhogi} | 
                                Seat: {ticket.seat_number}
                            </p>
                            <p 
                                data-status={ticket.booking_status}
                            >
                                Status: {ticket.booking_status}
                                {ticket.booking_status === 'Waiting' && 
                                ` (WL ${ticket.waitlist_number})`}
                            </p>
                            </div>
                        </div>
                    ))}
                    
                    {selectedTickets.length > 0 && (
                        <div className="cancel-actions">
                            <button 
                                className="cancel-selected-btn"
                                onClick={handleCancelTickets}
                            >
                                Cancel Selected Tickets ({selectedTickets.length})
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
        </div>
    );
};

export default CancelTicket;