import React, { useState, useEffect } from "react";
import { apiUrl } from "../config/config";
import { useNavigate } from "react-router-dom";
import '../css/TrainsPage.css';
const TrainsPage = () => {
  const [trains, setTrains] = useState([]);
  const [filteredTrains, setFilteredTrains] = useState([]);
  const [srcStn, setSrcStn] = useState("");
  const [destStn, setDestStn] = useState("");
  const [srcSuggestions, setSrcSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          setFilteredTrains(data); // show all by default
          const uniqueSrc = [...new Set(data.map((t) => t.src_stn))];
          const uniqueDest = [...new Set(data.map((t) => t.dest_stn))];
          setSrcSuggestions(uniqueSrc);
          setDestSuggestions(uniqueDest);
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

  const handleSearch = () => {
    const filtered = trains.filter(
      (train) =>
        train.src_stn.toLowerCase().includes(srcStn.toLowerCase()) &&
        train.dest_stn.toLowerCase().includes(destStn.toLowerCase())
    );
    setFilteredTrains(filtered);
  };

  return (
  //   <div>
  //      {/* <Navbar isAdmin={false} /> */}
  //     <h2>Available Trains</h2>

  //     <div style={{ marginBottom: "20px" }}>
  //       <input
  //         type="text"
  //         list="src-options"
  //         placeholder="Source Station"
  //         value={srcStn}
  //         onChange={(e) => setSrcStn(e.target.value)}
  //         style={{ marginRight: "10px" }}
  //       />
  //       <datalist id="src-options">
  //         {srcSuggestions.map((stn, idx) => (
  //           <option key={idx} value={stn} />
  //         ))}
  //       </datalist>

  //       <input
  //         type="text"
  //         list="dest-options"
  //         placeholder="Destination Station"
  //         value={destStn}
  //         onChange={(e) => setDestStn(e.target.value)}
  //         style={{ marginRight: "10px" }}
  //       />
  //       <datalist id="dest-options">
  //         {destSuggestions.map((stn, idx) => (
  //           <option key={idx} value={stn} />
  //         ))}
  //       </datalist>

  //       <button onClick={handleSearch}>Search</button>
  //     </div>

  //     {error ? <p style={{ color: "red" }}>{error}</p> : null}

  //     <ul>
  //       {filteredTrains.length > 0 ? (
  //         filteredTrains.map((train) => (
  //           <li key={train.train_id}>
  //             {train.train_name} ({train.train_no}) - {train.src_stn} to {train.dest_stn}
  //             <button
  //               style={{ marginLeft: "10px" }}
  //               onClick={() => navigate("/book", { state: { train } })}
  //             >
  //               Book
  //             </button>
  //           </li>
  //         ))
  //       ) : (
  //         <p>No trains found for the selected route.</p>
  //       )}
  //     </ul>
  //   </div>
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
            <td>{train.src_stn}</td>
            <td>{train.dest_stn}</td>
            <td>
              <button
                className="book-btn"
                onClick={() => navigate("/book", { state: { train } })}
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

