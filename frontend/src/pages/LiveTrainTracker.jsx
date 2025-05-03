import React, { useState , useEffect} from "react";
import Navbar from '../components/Navbar';
import { apiUrl } from "../config/config";
import { useNavigate } from 'react-router-dom';
import '../css/LiveTrainTracker.css';

const LiveTrainTracker = () => {
  const [trainNumber, setTrainNumber] = useState("");
  const [statusData, setStatusData] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const parseTime = (timeStr) => new Date(`1970-01-01T${timeStr}Z`);
  const addMinutes = (timeStr, minutes) => {
    const date = parseTime(timeStr);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5); // returns "HH:MM"
  };
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

  const transformData = (stations) => {
    let latestDelay = 0;

    return stations.map((station) => {
      let estimatedArrival = null, estimatedDeparture = null;

      if (station.status === "Departed") {
        if(station.arrival_time){
        estimatedArrival = addMinutes(station.arrival_time, station.arrival_delay_minutes || 0);}
        if(station.departure_time){
        estimatedDeparture = addMinutes(station.departure_time, station.departure_delay_minutes || 0);}
        latestDelay = station.departure_delay_minutes || station.arrival_delay_minutes || 0;
      }
      else if(station.status === "Arrived"){
        if(station.arrival_time){
        estimatedArrival = addMinutes(station.arrival_time, station.arrival_delay_minutes || 0);}
        if(station.departure_time){
        estimatedDeparture = addMinutes(station.departure_time,  Math.max(station.arrival_delay_minutes,0) || 0);}
        latestDelay = Math.max(station.arrival_delay_minutes,0) || 0;
      }
      else if(station.status === "Estimated"){
        if(station.arrival_time){
        estimatedArrival = addMinutes(station.arrival_time, latestDelay);}
        if(station.departure_time){
        estimatedDeparture = addMinutes(station.departure_time, latestDelay);}
      }
      else{
          estimatedDeparture = null; 
          estimatedArrival = null;
      }

      return {
        ...station,
        estimated_arrival: estimatedArrival,
        estimated_departure: estimatedDeparture,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatusData([]);

    try {
      const response = await fetch(`${apiUrl}/train-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ trainNumber }),
      });

      const data = await response.json();

      if (response.status === 200) {
        const transformed = transformData(data.stations);
        setStatusData(transformed);
      } else {
        setError(data.error || "Train not found or server error.");
      }
    } catch (err) {
      console.error("Error fetching train status:", err);
      setError("Network error. Please try again.");
    }
  };

  return (
    
    <div className="live-train-tracker-container">
      <Navbar isAdmin={false} />
      <h2>Live Train Tracker</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="trainNumber">Train Number:</label>
        <input
          type="text"
          id="trainNumber"
          value={trainNumber}
          onChange={(e) => setTrainNumber(e.target.value)}
          required
        />
        <button type="submit">Track Train</button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {statusData.length > 0 && (
        <div className="station-table">
          <h3>Route Status</h3>
          <table>
            <thead>
              <tr>
                <th>Stop #</th>
                <th>Station</th>
                <th>Est. Arrival</th>
                <th>Est. Departure</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map((station, idx) => (
                <tr key={idx}>
                  <td>{station.stop_number}</td>
                  <td>{station.name}</td>
                  <td>{station.estimated_arrival ?? "-"}</td>
                  <td>{station.estimated_departure ?? "-"}</td>
                  <td>{station.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LiveTrainTracker;
