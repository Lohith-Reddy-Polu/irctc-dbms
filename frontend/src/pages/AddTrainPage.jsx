import React, { useState } from "react";
import { apiUrl } from "../config/config";

const AddTrainPage = () => {
  const [formData, setFormData] = useState({
    train_no: "",
    train_name: "",
    src_stn: "",
    dest_stn: "",
    arrival_time: "",
    departure_time: "",
    operating_days: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
        body: JSON.stringify(formData),
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
        <br />
        <button type="submit">Add Train</button>
      </form>
    </div>
  );
};

export default AddTrainPage;