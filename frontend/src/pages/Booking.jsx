import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";

const Booking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { train } = state || {};
  
  const [travelDate, setTravelDate] = useState("");
  const [trainClass, setTrainClass] = useState("Sleeper"); // Default
  const [passengers, setPassengers] = useState([
    { name: "", gender: "Male", age: "" },
  ]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!train) {
    return <div>No train selected. Go back and select a train.</div>;
  }

  const handlePassengerChange = (index, field, value) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  const addPassenger = () => {
    setPassengers([...passengers, { name: "", gender: "Male", age: "" }]);
  };

  const removePassenger = (index) => {
    const updated = passengers.filter((_, i) => i !== index);
    setPassengers(updated);
  };

  const handleBooking = async () => {
    if (!travelDate || passengers.length === 0) {
      setError("Please fill all details");
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
          passengers,
        }),
      });

      const data = await response.json();

      if (response.status === 200) {
        setSuccess("Booking successful! PNR: " + data.pnr_number);
        setError("");
        setTimeout(() => navigate("/user-dashboard"), 3000);
      } else {
        setError(data.error || "Booking failed");
      }
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  return (
    <div>
      <h2>Book Train: {train.train_name}</h2>

      <label>Travel Date:</label>
      <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />

      <label>Class:</label>
      <select value={trainClass} onChange={(e) => setTrainClass(e.target.value)}>
        <option value="SLP">Sleeper</option>
        <option value="3AC">3rd AC</option>
        <option value="2AC">2vd AC</option>
        <option value="1AC">1st AC</option>
      </select>

      <h3>Passengers:</h3>
      {passengers.map((p, idx) => (
        <div key={idx}>
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
          </select>
          <input
            type="number"
            placeholder="Age"
            value={p.age}
            onChange={(e) => handlePassengerChange(idx, "age", e.target.value)}
          />
          {passengers.length > 1 && (
            <button onClick={() => removePassenger(idx)}>Remove</button>
          )}
        </div>
      ))}
      <button onClick={addPassenger}>+ Add Passenger</button>

      <br />
      <button onClick={handleBooking}>Submit Booking</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
};

export default Booking;
