import React from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";

const Navbar = ({ isAdmin }) => {
  const navigate = useNavigate(); // Use this to redirect users

  // // Function to handle logout
  // const handleLogout = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const response = await fetch(`${apiUrl}/logout`, {
  //       method: "POST",
  //       credentials: "include",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     if (response.status === 200) {
  //       navigate("/login");
  //     } else {
  //       console.error("Logout failed");
  //     }
  //   } catch (error) {
  //     console.error("Error during logout:", error);
  //   }
  // };

  return (
    <nav>
      <ul>
        <li><button onClick={() => navigate("/")}>Home</button></li>
        <li><button onClick={() => navigate("/trains")}>Trains</button></li>
        {!isAdmin && (
          <>
            <li><button onClick={() => navigate("/user-signup")}>Sign Up</button></li>
            <li><button onClick={() => navigate("/user-login")}>Login</button></li>
            <li><button onClick={() => navigate("/user-dashboard")}>User Dashboard</button></li>
          </>
        )}
        {isAdmin && (
          <>
            <li><button onClick={() => navigate("/admin-dashboard")}>Admin Dashboard</button></li>
            <li><button onClick={() => navigate("/add-train")}>Add Train</button></li>
          </>
        )}
        <li><button onClick={() => navigate("/")}>Logout</button></li>
      </ul>
    </nav>
  );
};

export default Navbar;