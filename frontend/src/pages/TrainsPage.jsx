import React, { useState, useEffect } from "react";
import { apiUrl } from "../config/config";

const TrainsPage = () => {
  const [trains, setTrains] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        const response = await fetch(`${apiUrl}/trains`,{
          method: "GET",
          credentials: "include",

        });
        console.log("WOWOWOW");
        const data = await response.json();
        console.log("WOWOWOW12");
        console.log(data);
        console.log(response);
        console.log(response.status);
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrainsPage;