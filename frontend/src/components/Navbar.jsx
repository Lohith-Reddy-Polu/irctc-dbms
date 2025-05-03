import React from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import './Navbar.css';

const Navbar = ({ isAdmin }) => {
  const navigate = useNavigate();
  // console.log("Logout clicked");
  // ✅ Proper logout function
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/logout`, {
        method: "GET", // or "POST" based on your backend
        credentials: "include",
      });

      if (response.status === 200) {
        navigate("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <nav>
      <ul>
        {!isAdmin && (
          <>
          <li>
            <button onClick={() => navigate("/user-dashboard")}>
              User Dashboard
            </button>
         </li>
            <li>
            <button onClick={() => navigate("/my-tickets")}>
              My Tickets
            </button>
          </li>
          </>
        )}
        {isAdmin && (
          <>
            <li>
              <button onClick={() => navigate("/admin-dashboard")}>
                Admin Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => navigate("/add-train")}>Add Train</button>
            </li>
            <li>
              <button onClick={() => navigate("/add-delay")}>Add Delay</button>
            </li>
          </>
        )}
        <li>
          <button onClick={() => navigate("/trains")}>Trains</button>
        </li>
        <li>
          <button onClick={handleLogout}>Logout</button> {/* ✅ Fix here */}
        </li>
        <li>
          <button onClick={() => navigate("/live-status")}>Live Status</button>
        </li>
        <li>
          <button onClick={() => navigate("/delete-account")}>Delete Account</button>
        </li>
        <li>
          <button onClick={() => navigate("/profile")}>Profile</button>
        </li>
        <li>
          <button onClick={() => navigate("/order-food")}>Order Food</button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
