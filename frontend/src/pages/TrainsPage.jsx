import React, { useState, useEffect } from "react";

const TrainsPage = () => {
  const [trains, setTrains] = useState([]);

  useEffect(() => {
    fetch("/api/trains")
      .then((res) => res.json())
      .then((data) => setTrains(data));
  }, []);

  return (
    <div className="container">
      <h2>Available Trains</h2>
      <table>
        <thead>
          <tr>
            <th>Train No</th>
            <th>Name</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Departure</th>
            <th>Arrival</th>
          </tr>
        </thead>
        <tbody>
          {trains.map((train) => (
            <tr key={train.train_id}>
              <td>{train.train_no}</td>
              <td>{train.train_name}</td>
              <td>{train.src_stn}</td>
              <td>{train.dest_stn}</td>
              <td>{train.departure_time}</td>
              <td>{train.arrival_time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrainsPage;
