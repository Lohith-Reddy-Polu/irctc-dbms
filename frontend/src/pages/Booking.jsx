import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import "../css/Booking.css";

const Booking = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { train, travelDate, srcStn, destStn } = state || {};

  // Initialize with class from location state or default to SLP
  const [trainClass, setTrainClass] = useState(() => {
    return state && state.trainClass ? state.trainClass : "1AC";
  });
  const [passengers, setPassengers] = useState([
    { name: "", gender: "Male", age: "" },
  ]);
  const [availableSeats, setAvailableSeats] = useState([]);
  // Changed: selectedSeats now contains { seat, passengerIndex } objects
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  // Function to fetch available seats
  const fetchSeats = async () => {
    console.log("hi");

    if (!train || !srcStn || !destStn || !travelDate) {
      console.error("Missing required data for fetching seats");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/available-seats?train_id=${train.train_id}&class=${trainClass}&travel_date=${travelDate}&src_stn=${srcStn}&dest_stn=${destStn}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableSeats(data.seats || []);
      console.log("Fetched seats:", data.seats);
    } catch (err) {
      console.error("Failed to fetch seats:", err);
      setError(`Failed to fetch seats: ${err.message}`);
      setAvailableSeats([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle class change
  const handleClassChange = (newClass) => {
    setTrainClass(newClass);
    // Reset seat selection when class changes
    setSelectedSeats([]);
    // Clear any previous errors
    setError("");
  };

  useEffect(() => {
    if (train && srcStn && destStn && travelDate) {
      fetchSeats();
    }
  }, [train, trainClass, travelDate, srcStn, destStn]);

  // Changed: Toggle seat function with numbered passenger assignment
  const toggleSeat = (seat) => {
    if (!seat.available) return;
    
    // Find if the seat is already selected
    const existingIndex = selectedSeats.findIndex(s => s.seat.seat_id === seat.seat_id);
    
    if (existingIndex !== -1) {
      // If seat is already selected, remove it
      const removedPassengerIndex = selectedSeats[existingIndex].passengerIndex;
      const newSelectedSeats = selectedSeats.filter((_, index) => index !== existingIndex);
      
      // Reassign passenger indices for remaining seats
      const updatedSeats = newSelectedSeats.map(s => {
        // If this seat was assigned to a higher passenger index, 
        // decrement it if it's higher than the removed one
        if (s.passengerIndex > removedPassengerIndex) {
          return { ...s, passengerIndex: s.passengerIndex - 1 };
        }
        return s;
      });
      
      setSelectedSeats(updatedSeats);
    } else {
      // If seat is not selected, add it with the next available passenger index
      if (selectedSeats.length < passengers.length) {
        // Find the lowest unused passenger index
        const usedIndices = selectedSeats.map(s => s.passengerIndex);
        let nextIndex = 0;
        while (usedIndices.includes(nextIndex)) {
          nextIndex++;
        }
        
        setSelectedSeats([...selectedSeats, { seat, passengerIndex: nextIndex }]);
      } else {
        setError("Please add more passengers before selecting more seats.");
      }
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
    // Don't allow removing if it would leave fewer passengers than selected seats
    if (passengers.length <= selectedSeats.length) {
      setError("Please unselect some seats before removing passengers.");
      return;
    }
    
    // Remove the passenger
    const newPassengers = passengers.filter((_, i) => i !== index);
    setPassengers(newPassengers);
    
    // Remove any seats assigned to this passenger and reassign indices
    const newSelectedSeats = selectedSeats
      .filter(s => s.passengerIndex !== index)
      .map(s => {
        if (s.passengerIndex > index) {
          return { ...s, passengerIndex: s.passengerIndex - 1 };
        }
        return s;
      });
    
    setSelectedSeats(newSelectedSeats);
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

    // Validate passenger details
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || !p.age) {
        setError("Please fill all passenger details.");
        return;
      }
      if (isNaN(p.age) || p.age < 1 || p.age > 100) {
        setError("Please enter a valid age (1-100) for all passengers.");
        return;
      }
    }

    try {
      // Sort selected seats by passenger index to ensure correct mapping
      const sortedSeats = [...selectedSeats].sort((a, b) => a.passengerIndex - b.passengerIndex);
      
      const response = await fetch(`${apiUrl}/book-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          train_id: train.train_id,
          travel_date: travelDate,
          train_class: trainClass,
          srcStn,
          destStn,
          seats: sortedSeats.map((seatObj, i) => ({
            seat_id: seatObj.seat.seat_id,
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

  // Get seat class and display passenger number
  const getSeatDisplay = (seat) => {
    const selectedSeatEntry = selectedSeats.find(s => s.seat.seat_id === seat.seat_id);
    
    if (selectedSeatEntry) {
      // Return the passenger number (1-based for display) for selected seats
      return (selectedSeatEntry.passengerIndex + 1).toString();
    }
    
    // For available and unavailable seats, just return the seat number
    return "";
  };

  const getSeatClass = (seat) => {
    if (selectedSeats.some(s => s.seat.seat_id === seat.seat_id)) return "seat selected";
    if (seat.available) return "seat available";
    return "seat unavailable";
  };

  if (!train) return <div>No train selected. Please go back and try again.</div>;

  return (
    <div className="booking-container">
      <Navbar isAdmin={false} />
      <h2>Book Train: {train.train_name}</h2>
      <p>Date: {travelDate}</p>

      <div className="booking-form">
        <div className="class-selection">
          <label>Class:</label>
          <select 
            value={trainClass} 
            onChange={(e) => handleClassChange(e.target.value)}
          >
            <option value="SLP">Sleeper</option>
            <option value="3AC">3rd AC</option>
            <option value="2AC">2nd AC</option>
            <option value="1AC">1st AC</option>
          </select>
        </div>

        <div className="seat-selection-container">
          <h3>Select Seats</h3>
          {isLoading ? (
            <div className="loading-message">Loading seats...</div>
          ) : (
            <div className="seat-grid">
              {availableSeats && availableSeats.length > 0 ? (
                availableSeats.map((seat) => (
                  <div
                    key={seat.seat_id}
                    className={getSeatClass(seat)}
                    onClick={() => toggleSeat(seat)}
                  >
                    <span className="seat-label">{seat.bhogi}-{seat.seat_number}</span>
                    {getSeatDisplay(seat) && (
                      <span className="passenger-number">{getSeatDisplay(seat)}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-seats-message">No seats available for this class. Please try another class.</div>
              )}
            </div>
          )}

          <div className="seat-legend">
            <div className="legend-item">
              <div className="seat available legend"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="seat selected legend"></div>
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <div className="seat unavailable legend"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>

        <div className="passenger-section">
          <h3>Passengers:</h3>
          {passengers.map((p, idx) => (
            <div key={idx} className="passenger">
              <div className="passenger-number">{idx + 1}</div>
              <input
                type="text"
                placeholder="Name"
                value={p.name}
                onChange={(e) => handlePassengerChange(idx, "name", e.target.value)}
                required
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
                min="1"
                max="100"
                value={p.age}
                onChange={(e) => handlePassengerChange(idx, "age", e.target.value)}
                required
              />
              {passengers.length > 1 && (
                <button className="remove-btn" onClick={() => removePassenger(idx)}>Remove</button>
              )}
            </div>
          ))}
          <button className="add-btn" onClick={addPassenger}>+ Add Passenger</button>
        </div>

        <div className="booking-summary">
          <h3>Booking Summary</h3>
          <p>Train: {train.train_name}</p>
          <p>Date: {travelDate}</p>
          <p>Class: {trainClass}</p>
          <p>Passengers: {passengers.length}</p>
          <p>Selected Seats: {selectedSeats.length}</p>
        </div>

        <button className="submit-btn" onClick={handleBooking}>Submit Booking</button>

        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}
      </div>
    </div>
  );
};

export default Booking;