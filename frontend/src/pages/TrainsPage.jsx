import React, { useState, useEffect } from "react";
import { apiUrl } from "../config/config";
import { useNavigate } from "react-router-dom";

const TrainsPage = () => {
  const [trains, setTrains] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // ✅ Needed for navigation

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        const response = await fetch(`${apiUrl}/trains`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (response.status === 200) {
          setTrains(data);
        } else {
          setError("Failed to fetch trains");
        }
      } catch (error1) {
        console.error("Fetch trains error: ", error1);
        setError("An error occurred. Please try again.");
      }
    };

    fetchTrains();
  }, []);

  return (
    <div>
      <h2>Available Trains</h2>
      {error ? <p style={{ color: "red" }}>{error}</p> : null}
      <ul>
        {trains.map((train) => (
          <li key={train.train_id}>
            {train.train_name} ({train.train_no}) - {train.src_stn} to {train.dest_stn}
            <button
              style={{ marginLeft: "10px" }}
              onClick={() => navigate("/book", { state: { train } })}
            >
              Book
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrainsPage;
