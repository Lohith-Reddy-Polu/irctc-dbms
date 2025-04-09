import React, { useState , useEffect} from "react";
import Navbar from '../components/Navbar';
import { apiUrl } from "../config/config";
import { useNavigate } from 'react-router-dom';
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

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

    checkUser();
  }
  , [navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      console.log("WOWOWOW12");
      const response = await fetch(`${apiUrl}/add-train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials : 'include',
        body: JSON.stringify({...formData, seatCounts}),
      });
      console.log("WOWOWOW");
      const data = await response.json();
      if (response.status === 201) {
        setFormData(data.train);
        setSuccess("Train added successfully!");
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
      <h2>Add Train</h2>
      {error ? <p style={{ color: "red" }}>{error}</p> : null}
      {success ? <p style={{ color: "green" }}>{success}</p> : null}
      <form onSubmit={handleSubmit}>
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
          Source Station:
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
          Destination Station:
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
          Arrival Time:
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
          Departure Time:
          <input
            type="time"
            name="departure_time"
            value={formData.departure_time}
            onChange={handleChange}
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
            placeholder="e.g., {Monday, Tuesday}"
            required
          />
        </label>
        <label>
        Sleeper Seats:
        <input type="number" name="SLP" value={seatCounts["SLP"]} onChange={handleSeatChange} />
      </label><br />
      <label>
        3AC Seats:
        <input type="number" name="3AC" value={seatCounts["3AC"]} onChange={handleSeatChange} />
      </label><br />
      <label>
        2AC Seats:
        <input type="number" name="2AC" value={seatCounts["2AC"]} onChange={handleSeatChange} />
      </label><br />
      <label>
        1AC Seats:
        <input type="number" name="1AC" value={seatCounts["1AC"]} onChange={handleSeatChange} />
      </label><br />
        <br />
        <button type="submit">Add Train</button>
      </form>
    </div>
  );
};

export default AddTrainPage;