import React, { useState, useEffect } from "react";
import { apiUrl } from "../config/config";
import { useNavigate } from "react-router-dom";
import "../css/TrainsPage.css";

const TrainsPage = () => {
  const [filteredTrains, setFilteredTrains] = useState([]);
  const [srcStn, setSrcStn] = useState("");
  const [destStn, setDestStn] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [srcSuggestions, setSrcSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch(`${apiUrl}/stations`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();
        if (response.status === 200 || Array.isArray(data)) {
          const stationNames = data.map((station) => station.station_name);
          setSrcSuggestions(stationNames);
          setDestSuggestions(stationNames);
        } else {
          setError("Failed to fetch station list.");
        }
      } catch (err) {
        console.error("Error fetching stations:", err);
        setError("Error fetching stations.");
      }
    };

    fetchStations();
  }, []);

  const handleSearch = async () => {
    setError(null);
    if (!srcStn || !destStn || !travelDate) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/search-trains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          srcStn,
          destStn,
          travelDate,
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        setFilteredTrains(data);
      } else {
        setFilteredTrains([]);
        setError(data.message || "No trains found for given criteria.");
      }
    } catch (err) {
      console.error("Error searching trains:", err);
      setError("An error occurred while searching.");
    }
  };

  return (
    <div className="trains-page">
      <h2>Available Trains</h2>

      <div className="search-bar">
        <input
          type="text"
          list="src-options"
          placeholder="Source Station"
          value={srcStn}
          onChange={(e) => setSrcStn(e.target.value)}
        />
        <datalist id="src-options">
          {srcSuggestions.map((stn, idx) => (
            <option key={idx} value={stn} />
          ))}
        </datalist>

        <input
          type="text"
          list="dest-options"
          placeholder="Destination Station"
          value={destStn}
          onChange={(e) => setDestStn(e.target.value)}
        />
        <datalist id="dest-options">
          {destSuggestions.map((stn, idx) => (
            <option key={idx} value={stn} />
          ))}
        </datalist>

        <input
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
        />

        <button onClick={handleSearch}>Search</button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {filteredTrains.length > 0 ? (
        <table className="train-table">
          <thead>
            <tr>
              <th>Train Name</th>
              <th>Train Number</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrains.map((train) => (
              <tr key={train.train_id}>
                <td>{train.train_name}</td>
                <td>{train.train_no}</td>
                <td>{train.src_stn || "—"}</td>
                <td>{train.dest_stn || "—"}</td>
                <td>
                  <button
                    className="book-btn"
                    onClick={() => navigate("/book", { state: { train,
                                                                travelDate,
                                                                srcStn,
                                                                destStn,} })}
                  >
                    Book
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No trains found for the selected route.</p>
      )}
    </div>
  );
};

export default TrainsPage;
