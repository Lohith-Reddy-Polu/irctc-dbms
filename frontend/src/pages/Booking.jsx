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
  const [next_waitlist_number,setNextWaitlistNumber] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [waitlistedPassengers, setWaitlistedPassengers] = useState([]);

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
      setNextWaitlistNumber(parseInt(data.next_waitlist_number, 10)); 
      console.log(data.next_waitlist_number);
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
    setSelectedSeats([]);
    setPassengers([{ name: "", gender: "Male", age: "" }]);
    setWaitlistedPassengers([]);
    setError("");
  };


  useEffect(() => {
    if (availableSeats.length > 0) {
      const availableSeatsCount = availableSeats.filter(seat => seat.available).length;
      if (availableSeatsCount === 0) {
        // If no seats are available, clear confirmed passengers
        setPassengers([]);
        // If no waitlisted passengers yet, add one empty one
        if (waitlistedPassengers.length === 0) {
          setWaitlistedPassengers([{ name: "", gender: "Male", age: "" }]);
        }
      } else {
        // If there are available seats and no confirmed passengers
        if (passengers.length === 0) {
          setPassengers([{ name: "", gender: "Male", age: "" }]);
        }
      }
    }
  }, [availableSeats]);

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

  const handlePassengerChange = (index, field, value, isWaitlisted = false) => {
    if (!isWaitlisted) {
      const newPassengers = [...passengers];
      newPassengers[index][field] = value;
      setPassengers(newPassengers);
    } else {
      const newWaitlistedPassengers = [...waitlistedPassengers];
      newWaitlistedPassengers[index][field] = value;
      setWaitlistedPassengers(newWaitlistedPassengers);
    }
  };
  
  const addPassenger = () => {
    const newPassenger = { name: "", gender: "Male", age: "" };
    const availableSeatsCount = availableSeats.filter(seat => seat.available).length;
    
    if (passengers.length < availableSeatsCount) {
      setPassengers([...passengers, newPassenger]);
    } else {
      setWaitlistedPassengers([...waitlistedPassengers, newPassenger]);
    }
  };

  const removePassenger = (index, isWaitlisted = false) => {
    if (!isWaitlisted) {
      // Original logic for regular passengers
      if (passengers.length <= selectedSeats.length) {
        setError("Please unselect some seats before removing passengers.");
        return;
      }
      
      const newPassengers = passengers.filter((_, i) => i !== index);
      setPassengers(newPassengers);
      
      const newSelectedSeats = selectedSeats
        .filter(s => s.passengerIndex !== index)
        .map(s => {
          if (s.passengerIndex > index) {
            return { ...s, passengerIndex: s.passengerIndex - 1 };
          }
          return s;
        });
      
      setSelectedSeats(newSelectedSeats);
    } else {
      // Logic for waitlisted passengers
      const newWaitlistedPassengers = waitlistedPassengers.filter((_, i) => i !== index);
      setWaitlistedPassengers(newWaitlistedPassengers);
    }
  };

  const handleBooking = async () => {
    const availableSeatsCount = availableSeats.filter(seat => seat.available).length;
  
    // Different validation for when only waitlist is available
    if (availableSeatsCount === 0) {
      if (waitlistedPassengers.length === 0) {
        setError("Please add at least one waitlisted passenger.");
        return;
      }
  
      // Validate waitlisted passengers
      for (const p of waitlistedPassengers) {
        if (!p.name || !p.age) {
          setError("Please fill all passenger details.");
          return;
        }
        if (isNaN(p.age) || p.age < 1 || p.age > 100) {
          setError("Please enter a valid age (1-100) for all passengers.");
          return;
        }
      }
    } else {
      // Original validation for when seats are available
      if (selectedSeats.length === 0 || passengers.length === 0) {
        setError("Please select at least one seat and fill passenger details.");
        return;
      }
      if (selectedSeats.length !== passengers.length) {
        setError("Each passenger must have one seat.");
        return;
      }
  
      // Validate confirmed passengers
      for (const p of passengers) {
        if (!p.name || !p.age) {
          setError("Please fill all passenger details.");
          return;
        }
        if (isNaN(p.age) || p.age < 1 || p.age > 100) {
          setError("Please enter a valid age (1-100) for all passengers.");
          return;
        }
      }
    }
  
    try {
      const sortedSeats = [...selectedSeats].sort((a, b) => a.passengerIndex - b.passengerIndex);
      
      const requestBody = {
        train_id: train.train_id,
        travel_date: travelDate,
        train_class: trainClass,
        srcStn,
        destStn,
        seats: availableSeatsCount > 0 ? sortedSeats.map((seatObj, i) => ({
          seat_id: seatObj.seat.seat_id,
          passenger_name: passengers[i].name,
          passenger_gender: passengers[i].gender,
          passenger_age: passengers[i].age,
        })) : [], // Empty array if no confirmed seats
        waitlisted_passengers: waitlistedPassengers.map((passenger, index) => ({
          passenger_name: passenger.name,
          passenger_gender: passenger.gender,
          passenger_age: passenger.age,
          waitlist_number: parseInt(next_waitlist_number) + parseInt(index)
        }))
      };
  
      const response = await fetch(`${apiUrl}/book-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody)
      });
  
      const data = await response.json();
      if (response.status === 200) {
        setSuccess(`Booking successful! PNR: ${data.pnr_number}`);
        setError("");
        setTimeout(() => navigate("/user-dashboard"), 1000);
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
    <div>
       <Navbar isAdmin={false} />
    <div className="booking-container">
      
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
          {/* Only show confirmed passengers section if there are available seats */}
          {availableSeats.some(seat => seat.available) && (
            <>
              <h3>Confirmed Passengers:</h3>
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
            </>
          )}

          {/* Show waitlisted passengers if any exist or if no seats are available */}
          {(waitlistedPassengers.length > 0 || !availableSeats.some(seat => seat.available))&& (
            <>
              <h3>Waitlisted Passengers:</h3>
              {waitlistedPassengers.map((p, idx) => (
                <div key={idx} className="passenger waitlisted">
                  <div className="passenger-number">WL{parseInt(next_waitlist_number) + parseInt(idx)}</div>
                  <input
                    type="text"
                    placeholder="Name"
                    value={p.name}
                    onChange={(e) => handlePassengerChange(idx, "name", e.target.value, true)}
                    required
                  />
                  <select
                    value={p.gender}
                    onChange={(e) => handlePassengerChange(idx, "gender", e.target.value, true)}
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
                    onChange={(e) => handlePassengerChange(idx, "age", e.target.value, true)}
                    required
                  />
                  <button className="remove-btn" onClick={() => removePassenger(idx, true)}>
                    Remove
                  </button>
                </div>
              ))}
            </>
          )}
          
          {/* Add Passenger button moved to the bottom */}
          <button 
            className="add-btn" 
            onClick={addPassenger}
          >
            + Add {availableSeats.filter(seat => seat.available).length > 0 ? "Passenger" : "Waitlist Passenger"}
          </button>
        </div>

        <div className="booking-summary">
          <h3>Booking Summary</h3>
          <p>Train: {train.train_name}</p>
          <p>Date: {travelDate}</p>
          <p>Class: {trainClass}</p>
          {availableSeats.filter(seat => seat.available).length > 0 && (
            <>
              <p>Confirmed Passengers: {passengers.length}</p>
              <p>Selected Seats: {selectedSeats.length}</p>
            </>
          )}
          {waitlistedPassengers.length > 0 && (
            <p>Waitlisted Passengers: {waitlistedPassengers.length}</p>
          )}
        </div>

        <button className="submit-btn" onClick={handleBooking}>Submit Booking</button>

        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}
      </div>
    </div>
    </div>
  );
};

export default Booking;