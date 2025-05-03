import React, { useState,useEffect } from "react";
import { apiUrl } from "../config/config";
import Navbar from "../components/Navbar";
import "../css/DeleteAccount.css";
import { useNavigate } from "react-router-dom";

const DeleteAccount = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  
    useEffect(() => {
      const checkUser = async () => {
        try {
          const response = await fetch(`${apiUrl}/isUserLoggedIn`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
          if (response.status !== 200) {
            navigate("/");
          }
        } catch (err) {
          console.error("Auth check failed", err);
          navigate("/");
        }
      };
      checkUser();
    }, [navigate]);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This action is irreversible."
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${apiUrl}/delete-account`, {
        method: "GET",
        credentials: "include", // include session cookies
      });

      const data = await response.json();

      if (response.status === 200) {
        setSuccess("Account deleted successfully.");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        setError(data.error || "Failed to delete account.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Something went wrong.");
    }
  };

  return (
    <div className="delete-account-container">
      <Navbar isAdmin={false} />
      <div className="delete-box">
        <h1>Delete Account</h1>
        <p className="warning">
          This action is permanent and cannot be undone.
        </p>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <button onClick={handleDelete} className="delete-button">
          Delete My Account
        </button>
      </div>
    </div>
  );
};

export default DeleteAccount;
