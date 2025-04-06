import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} Railway Reservation System. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
