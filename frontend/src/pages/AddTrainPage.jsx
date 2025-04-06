import React, { useState } from "react";

const AddTrainPage = () => {
  const [formData, setFormData] = useState({
    train_no: "",
    train_name: "",
    src_stn: "",
    dest_stn: "",
    arrival_time: "",
    departure_time: "",
    operating_days: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/trains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }).then(() => window.location.href = "/admin-dashboard");
  };

  return (
    <div className="container">
      <h2>Add New Train</h2>
      {/* Form fields matching train schema */}
      {/* Similar to the previous example */}
    </div>
  );
};

export default AddTrainPage;
