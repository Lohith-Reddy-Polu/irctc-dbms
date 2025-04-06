import React from "react";

const UserSignup = () => {
  return (
    <div className="container">
      <h2>User Signup</h2>
      <form>
        <input type="text" placeholder="Name" required />
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <input type="text" placeholder="Phone Number" required />
        <button type="submit">Signup</button>
      </form>
    </div>
  );
};

export default UserSignup;
