import React, { useState, useEffect } from "react";
import Navbar from '../components/Navbar';
import { apiUrl } from "../config/config";
import { useNavigate } from 'react-router-dom';
import '../css/AddTrainPage.css';

const AddTrainPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    train_no: "",
    train_name: "",
    src_stn: "",
    dest_stn: "",
    arrival_time: "",
    departure_time: "",
    operating_days: "",
  });

  const [seatCounts, setSeatCounts] = useState({
    "SLP": 0,
    "3AC": 0,
    "2AC": 0,
    "1AC": 0
  });

  const [intermediateStations, setIntermediateStations] = useState([]);
  const [allStations, setAllStations] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [distance, setDistance]=useState(0);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking user status...");
        const response = await fetch(`${apiUrl}/isAdminLoggedIn`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (response.status !== 200) {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        navigate('/');
      }
    };

    const fetchStations = async () => {
      try {
        const response = await fetch(`${apiUrl}/stations`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (response.status === 200) {
          setAllStations(data.stations);
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };

    checkUser();
    fetchStations();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSeatChange = (e) => {
    const { name, value } = e.target;
    setSeatCounts({
      ...seatCounts,
      [name]: parseInt(value)
    });
  };

  const addIntermediateStation = () => {
    setIntermediateStations([
      ...intermediateStations,
      {
        station_code: "",
        arrival_time: "",
        departure_time: "",
        distance_from_start_km: 0,
        stop_number: intermediateStations.length + 2 // +2 because source is 1
      }
    ]);
  };

  const removeIntermediateStation = (index) => {
    const updatedStations = [...intermediateStations];
    updatedStations.splice(index, 1);
    
    // Update stop numbers for remaining stations
    const reorderedStations = updatedStations.map((station, idx) => ({
      ...station,
      stop_number: idx + 2 // +2 because source is 1
    }));
    
    setIntermediateStations(reorderedStations);
  };

  const handleIntermediateStationChange = (index, field, value) => {
    const updatedStations = [...intermediateStations];
    updatedStations[index][field] = value;
    setIntermediateStations(updatedStations);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate intermediate stations
    let isValid = true;
    intermediateStations.forEach(station => {
      if (!station.station_code || !station.arrival_time || !station.departure_time || station.distance_from_start_km <= 0) {
        setError("Please fill in all fields for intermediate stations");
        isValid = false;
      }
    });

    if (!isValid) return;

    try {
      const response = await fetch(`${apiUrl}/add-train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          ...formData, 
          seatCounts,
          intermediateStations,
          distance
        }),
      });
      
      const data = await response.json();
      if (response.status === 201) {
        setFormData({
          train_no: "",
          train_name: "",
          src_stn: "",
          dest_stn: "",
          arrival_time: "",
          departure_time: "",
          operating_days: "",
        });
        setSeatCounts({
          "SLP": 0,
          "3AC": 0,
          "2AC": 0,
          "1AC": 0
        });
        setIntermediateStations([]);
        setDistance(0);
        setSuccess("Train and route added successfully!");
      } else {
        setError(data.message || "Failed to add train");
      }
    } catch (error1) {
      console.error("Add train error: ", error1);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div>
      <Navbar isAdmin={true} />
      <div className="add-train-container">
        <h2>Add Train</h2>
        {error ? <p style={{ color: "red" }}>{error}</p> : null}
        {success ? <p style={{ color: "green" }}>{success}</p> : null}
        <form onSubmit={handleSubmit}>
          <div className="train-basic-info">
            <h3>Basic Train Information</h3>
            <label>
              Train Number:
              <input
                type="text"
                name="train_no"
                value={formData.train_no}
                onChange={handleChange}
                required
              />
            </label>
            <br />
            <label>
              Train Name:
              <input
                type="text"
                name="train_name"
                value={formData.train_name}
                onChange={handleChange}
                required
              />
            </label>
            <br />
            <label>
              Source Station Code:
              <input
                type="text"
                name="src_stn"
                value={formData.src_stn}
                onChange={handleChange}
                required
              />
            </label>
            <br />
            <label>
              Destination Station Code:
              <input
                type="text"
                name="dest_stn"
                value={formData.dest_stn}
                onChange={handleChange}
                required
              />
            </label>
            <br />
            <label>
              Arrival Time (at destination):
              <input
                type="time"
                name="arrival_time"
                value={formData.arrival_time}
                onChange={handleChange}
                required
              />
            </label>
            <br />
            <label>
              Departure Time (from source):
              <input
                type="time"
                name="departure_time"
                value={formData.departure_time}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Distance Covered (km):
              <input
                type="number"
                value={distance}
                onChange={(e) =>setDistance(parseInt(e.target.value))}
                min="1"
                required
              />
            </label>
            <br />
            <label>
              Operating Days:
              <input
                type="text"
                name="operating_days"
                value={formData.operating_days}
                onChange={handleChange}
                placeholder="e.g., {Monday,Tuesday,Wednesday}"
                required
              />
            </label>
          </div>

          <div className="seat-info">
            <h3>Seat Information</h3>
            <label>
              Sleeper Seats:
              <input 
                type="number" 
                name="SLP" 
                value={seatCounts["SLP"]} 
                onChange={handleSeatChange} 
                min="0"
              />
            </label><br />
            <label>
              3AC Seats:
              <input 
                type="number" 
                name="3AC" 
                value={seatCounts["3AC"]} 
                onChange={handleSeatChange} 
                min="0"
              />
            </label><br />
            <label>
              2AC Seats:
              <input 
                type="number" 
                name="2AC" 
                value={seatCounts["2AC"]} 
                onChange={handleSeatChange} 
                min="0"
              />
            </label><br />
            <label>
              1AC Seats:
              <input 
                type="number" 
                name="1AC" 
                value={seatCounts["1AC"]} 
                onChange={handleSeatChange} 
                min="0"
              />
            </label>
          </div>

          <div className="route-info">
            <h3>Route Information</h3>
            <p>Source station will be stop #1, and destination station will be the final stop.</p>
            
            {intermediateStations.length > 0 ? (
              <div className="intermediate-stations">
                <h4>Intermediate Stations</h4>
                {intermediateStations.map((station, index) => (
                  <div key={index} className="intermediate-station">
                    <h5>Stop #{station.stop_number}</h5>
                    <label>
                      Station Code:
                      <input
                        type="text"
                        value={station.station_code}
                        onChange={(e) => handleIntermediateStationChange(index, 'station_code', e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Arrival Time:
                      <input
                        type="time"
                        value={station.arrival_time}
                        onChange={(e) => handleIntermediateStationChange(index, 'arrival_time', e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Departure Time:
                      <input
                        type="time"
                        value={station.departure_time}
                        onChange={(e) => handleIntermediateStationChange(index, 'departure_time', e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Distance from Start (km):
                      <input
                        type="number"
                        value={station.distance_from_start_km}
                        onChange={(e) => handleIntermediateStationChange(index, 'distance_from_start_km', parseInt(e.target.value))}
                        min="1"
                        required
                      />
                    </label>
                    <button 
                      type="button" 
                      className="remove-station" 
                      onClick={() => removeIntermediateStation(index)}
                    >
                      Remove Station
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No intermediate stations added.</p>
            )}
            
            <button 
              type="button" 
              className="add-station-btn" 
              onClick={addIntermediateStation}
            >
              Add Intermediate Station
            </button>
          </div>

          <button type="submit" className="submit-btn">Add Train</button>
        </form>
      </div>
    </div>
  );
};

export default AddTrainPage;