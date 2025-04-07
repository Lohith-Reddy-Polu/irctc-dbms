require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port =  4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'project',
  host: 'localhost',
  database: 'irctc',
  password: 'project',
  port: 5432,
});

// Helper function for handling database errors
const handleDbError = (res, error) => {
  console.error('Database error:', error);
  res.status(500).json({ error: error.message });
};

// Routes

// User Signup
app.post('/user-signup', async (req, res) => {
  const { username, password, email, phone_number } = req.body;
  console.log("hi111");
  try {
    const result = await pool.query(
      `INSERT INTO Users (name, password, email, phone_no) 
       VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, phone_no`,
      [username, password, email, phone_number]
    );
    res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
  } catch (error) {
    handleDbError(res, error);
  }
});

// User Login
app.post('/api/user-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM Users WHERE email = $1 AND password = $2`,
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ message: 'Login successful', user: result.rows[0] });
  } catch (error) {
    handleDbError(res, error);
  }
});

// Admin Login
app.post('/api/admin-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM Admin WHERE email = $1 AND password = $2`,
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ message: 'Admin login successful', admin: result.rows[0] });
  } catch (error) {
    handleDbError(res, error);
  }
});

// Get List of Trains
app.get('/api/trains', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM Train`);
    res.json(result.rows);
  } catch (error) {
    handleDbError(res, error);
  }
});

// Add Train (Admin only)
app.post('/api/add-train', async (req, res) => {
  const { train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, operating_days } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO Train (train_no, train_name, src_stn, dest_stn,
        arrival_time, departure_time, operating_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING train_id`,
      [train_no, train_name, src_stn, dest_stn,
        arrival_time, departure_time,
        operating_days]
    );
    res.status(201).json({ message: 'Train added successfully!', train: result.rows[0] });
  } catch (error) {
    handleDbError(res, error);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;
