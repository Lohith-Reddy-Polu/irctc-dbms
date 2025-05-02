import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import "../css/Booking.css";

const Booking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { train, travelDate, src_stn_id, dest_stn_id } = state || {};

  const [trainClass, setTrainClass] = useState();
  const [passengers, setPassengers] = useState([
    { name: "", gender: "Male", age: "" },
  ]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch(`${apiUrl}/isUserLoggedIn`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (response.status !== 200) {
          navigate("/");
        }
      } catch (err) {
        console.error("Auth check failed", err);
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/available-seats?train_id=${train.train_id}&class=${trainClass}&travel_date=${travelDate}&src_stn=${src_stn_id}&dest_stn=${dest_stn_id}`
        );
        const data = await response.json();
        setAvailableSeats(data.seats);
      } catch (err) {
        console.error("Failed to fetch seats:", err);
      }
    };

    if (train && src_stn_id && dest_stn_id && travelDate) {
      fetchSeats();
    }
  }, [train, trainClass, travelDate, src_stn_id, dest_stn_id]);

  const toggleSeat = (seat) => {
    if (!seat.available) return;
    const alreadySelected = selectedSeats.find((s) => s.seat_id === seat.seat_id);
    if (alreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.seat_id !== seat.seat_id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handlePassengerChange = (index, field, value) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  const addPassenger = () => {
    setPassengers([...passengers, { name: "", gender: "Male", age: "" }]);
  };

  const removePassenger = (index) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0 || passengers.length === 0) {
      setError("Please select at least one seat and fill passenger details.");
      return;
    }
    if (selectedSeats.length !== passengers.length) {
      setError("Each passenger must have one seat.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/book-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          train_id: train.train_id,
          travel_date: travelDate,
          train_class: trainClass,
          src_stn_id,
          dest_stn_id,
          seats: selectedSeats.map((seat, i) => ({
            seat_id: seat.seat_id,
            passenger_name: passengers[i].name,
            passenger_gender: passengers[i].gender,
            passenger_age: passengers[i].age,
          })),
        }),
      });

      const data = await response.json();
      if (response.status === 200) {
        setSuccess(`Booking successful! PNR: ${data.pnr_number}`);
        setError("");
        setTimeout(() => navigate("/user-dashboard"), 3000);
      } else {
        setError(data.error || "Booking failed");
      }
    } catch (err) {
      setError("Booking failed: " + err.message);
    }
  };

  const getSeatClass = (seat) => {
    if (selectedSeats.find((s) => s.seat_id === seat.seat_id)) return "seat selected";
    if (seat.available) return "seat available";
    return "seat unavailable";
  };

  if (!train) return <div>No train selected. Please go back and try again.</div>;

  return (
    <div className="booking-container">
      <Navbar isAdmin={false} />
      <h2>Book Train: {train.train_name}</h2>
      <p>Class: {trainClass} | Date: {travelDate}</p>

      <label>Class:</label>
      <select value={trainClass} onChange={(e) => setTrainClass(e.target.value)}>
        <option value="SLP">Sleeper</option>
        <option value="3AC">3rd AC</option>
        <option value="2AC">2nd AC</option>
        <option value="1AC">1st AC</option>
      </select>

      <div className="seat-grid">
        {availableSeats.map((seat) => (
          <div
            key={seat.seat_id}
            className={getSeatClass(seat)}
            onClick={() => toggleSeat(seat)}
          >
            {seat.bhogi}-{seat.seat_number}
          </div>
        ))}
      </div>

      <div className="passenger-section">
        <h3>Passengers:</h3>
        {passengers.map((p, idx) => (
          <div key={idx} className="passenger">
            <input
              type="text"
              placeholder="Name"
              value={p.name}
              onChange={(e) => handlePassengerChange(idx, "name", e.target.value)}
            />
            <select
              value={p.gender}
              onChange={(e) => handlePassengerChange(idx, "gender", e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="number"
              placeholder="Age"
              value={p.age}
              onChange={(e) => handlePassengerChange(idx, "age", e.target.value)}
            />
            {passengers.length > 1 && (
              <button className="remove-btn" onClick={() => removePassenger(idx)}>Remove</button>
            )}
          </div>
        ))}
        <button className="add-btn" onClick={addPassenger}>+ Add Passenger</button>
      </div>

      <button className="submit-btn" onClick={handleBooking}>Submit Booking</button>

      {error && <p className="message error">{error}</p>}
      {success && <p className="message success">{success}</p>}
    </div>
  );
};

export default Booking;
