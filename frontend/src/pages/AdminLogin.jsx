import React from "react";

const AdminLogin = () => {
  return (
    <div className="container">
      <h2>Admin Login</h2>
      <form>
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;
