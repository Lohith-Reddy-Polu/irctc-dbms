import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Input handlers
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleOtpChange = (e) => setOtp(e.target.value);
  const handleNewPasswordChange = (e) => setNewPassword(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  // Step 1: Request OTP
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
    const response = await fetch(`${apiUrl}/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // required if session/cookies are used
        body: JSON.stringify({ email, }),
        });
        
        const data = await response.json();
      if (response.status === 200) setStep(2);
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
    const response = await fetch(`${apiUrl}/verify-otp`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        credentials: 'include', 
        body: JSON.stringify({otp,}),
        });
          
        const data = await response.json();
      if (response.status === 200) {
        setSuccessMessage("OTP verified! Please set a new password.");
        setStep(3);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Error verifying OTP. Please try again.");
    }
  };

  // Step 3: Submit New Password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
        const response = await fetch(`${apiUrl}/new-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // include if using sessions
            body: JSON.stringify({ newPassword }),
          });
          
        const data = await response.json();
      if (response.status === 200) {
        setSuccessMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
            navigate("/user-login"); 
        }, 2000);
      } else {
        setError("Failed to update password. Please try again.");
      }
    } catch (err) {
      setError("Error resetting password. Please try again.");
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h2>Forgot Password</h2>

        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit}>
            <label>
              Enter your email:
              <input type="email" value={email} onChange={handleEmailChange} required />
            </label>
            <button type="submit">Send OTP</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit}>
            <label>
              Enter the 6-digit OTP:
              <input type="text" value={otp} onChange={handleOtpChange} maxLength={6} required />
            </label>
            <button type="submit">Verify OTP</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordReset}>
            <label>
              New Password:
              <input type="password" value={newPassword} onChange={handleNewPasswordChange} required />
            </label>
            <label>
              Confirm New Password:
              <input type="password" value={confirmPassword} onChange={handleConfirmPasswordChange} required />
            </label>
            <button type="submit">Reset Password</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
