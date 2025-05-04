import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import '../css/AddDelay.css';

const AddDelay = () => {
  const [trainNo, setTrainNo] = useState('');
  const [stationCode, setStationCode] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDelay, setArrivalDelay] = useState('');
  const [departureDelay, setDepartureDelay] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (type) => {
    const body = {
      train_no: trainNo,
      station_code: stationCode,
      departure_date: departureDate,
      delay_minutes: type === 'arrival' ? arrivalDelay : departureDelay,
      type
    };

    const res = await fetch(`${apiUrl}/add-delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials : 'include',
      body: JSON.stringify(body)
    });

    const data = await res.json();
    setMessage(data.message || 'Delay updated');
  };

  return (
    <div>
      <Navbar isAdmin={true} />
    <div className="delay-form">
      <h2>Update Train Delay</h2>
      <input
        type="text"
        placeholder="Train No"
        value={trainNo}
        onChange={(e) => setTrainNo(e.target.value)}
      />
      <input
        type="text"
        placeholder="Station Code"
        value={stationCode}
        onChange={(e) => setStationCode(e.target.value)}
      />
      <input
        type="date"
        value={departureDate}
        onChange={(e) => setDepartureDate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Arrival Delay (min)"
        value={arrivalDelay}
        onChange={(e) => setArrivalDelay(e.target.value)}
      />
      <button onClick={() => handleSubmit('arrival')}>Update Arrival Delay</button>

      <input
        type="number"
        placeholder="Departure Delay (min)"
        value={departureDelay}
        onChange={(e) => setDepartureDelay(e.target.value)}
      />
      <button onClick={() => handleSubmit('departure')}>Update Departure Delay</button>

      {message && <p className="message">{message}</p>}
    </div>
    </div>
  );
}

export default AddDelay;