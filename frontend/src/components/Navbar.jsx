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
              <button 
                data-type="user" 
                onClick={() => navigate("/user-dashboard")}
                title="User Dashboard"
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                data-type="user" 
                onClick={() => navigate("/my-tickets")}
                title="My Tickets"
              >
                Tickets
              </button>
            </li>
            <li>
              <button 
                data-type="user" 
                onClick={() => navigate("/delete-account")}
                title="Delete Account"
              >
                Delete A/C
              </button>
            </li>
            <li>
              <button 
                data-type="user" 
                onClick={() => navigate("/cancel-ticket")}
                title="Cancel Ticket"
              >
                Cancel Ticket
              </button>
            </li>
            <li>
              <button 
                data-type="user" 
                onClick={() => navigate("/order-food")}
                title="Order Food"
              >
                Food
              </button>
            </li>
            <li>
              <button 
                data-type="user" 
                onClick={() => navigate("/pnr-enquiry")}
                title="PNR Enquiry"
              >
                PNR
              </button>
            </li>
            <li>
              <button 
                data-type="user" 
                onClick={() => navigate("/FAQ")}
                title="Frequently Asked Questions"
              >
                FAQ
              </button>
            </li>
          </>
        )}

        {isAdmin && (
          <>
            <li>
              <button 
                data-type="admin" 
                onClick={() => navigate("/admin-dashboard")}
                title="Admin Dashboard"
              >
                Dashboard
              </button>
            </li>
            <li>
              <button 
                data-type="admin" 
                onClick={() => navigate("/add-train")}
                title="Add Train"
              >
                Add Train
              </button>
            </li>
            <li>
              <button 
                data-type="admin" 
                onClick={() => navigate("/add-delay")}
                title="Add Delay"
              >
                Add Delay
              </button>
            </li>
          </>
        )}

        <li>
          <button 
            data-type="common" 
            onClick={() => navigate("/trains")}
            title="Available Trains"
          >
            Trains
          </button>
        </li>
        <li>
          <button 
            data-type="logout" 
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </li>
        <li>
          <button 
            data-type="common" 
            onClick={() => navigate("/live-status")}
            title="Train Live Status"
          >
            Live Status
          </button>
        </li>
        <li>
          <button 
            data-type="common" 
            onClick={() => navigate("/profile")}
            title="User Profile"
          >
            Profile
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;