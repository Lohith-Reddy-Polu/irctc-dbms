import React, { useEffect, useState } from "react";
import Navbar from '../components/Navbar';
import '../css/Profile.css';
import { apiUrl } from "../config/config";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${apiUrl}/profile`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (res.status !== 200) {
           setError(res.error);
        }
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load profile.");
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="profile-container">
      <Navbar isAdmin={false} />
      <h1>My Profile</h1>
      {error && <p className="error-message">{error}</p>}

      {profile ? (
        <div className="profile-card">
          <p><span className="label">Name:</span> {profile.name}</p>
          <p><span className="label">Email:</span> {profile.email}</p>
          <p><span className="label">Phone Number:</span> {profile.phone_no}</p>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
};

export default Profile;
