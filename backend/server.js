const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
// const pgSession = require('connect-pg-simple')(session);
const app = express();
const port = 4000;

// PostgreSQL connection
const pool = new Pool({
  user: 'project',
  host: 'localhost',
  database: 'irctc',
  password: 'project',
  port: 5432,
});


// Session configuration
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));


// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Middleware to prevent caching of authenticated pages
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Helper function for handling database errors
const handleDbError = (res, error) => {
  console.error('Database error:', error);
  res.status(500).json({ error: error.message });
};



function isAuthenticated(req, res, next) {
  if(req.session.userId || req.session.adminId){
    return next();
  }
  return res.redirect('/');
}

function isLoggedIn(req, res, next) {
  if(req.session.userId){
    return res.redirect('/user-dashboard');
  }
  else if(req.session.adminId){
    return res.redirect('/admin-dashboard');
  }
  return next();
}

// Routes
app.get('/isUserLoggedIn', (req, res) => {
  if (req.session.userId) {
    res.status(200).json({ loggedIn: true, userId: req.session.userId });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

app.get('/isAdminLoggedIn', (req, res) => {
  if (req.session.adminId) {
    res.status(200).json({ loggedIn: true, adminId: req.session.adminId });
  } else {
    res.status(401).json({ loggedIn: false });
  }
});
// User Signup
app.post('/user-signup',isLoggedIn, async (req, res) => {
  const { username,email,password, phone_number } = req.body;
  try {
    // Check if user already exists
    const existingUser = await pool.query(
      `SELECT * FROM Users WHERE email = $1`,
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }
    // Check if phone number already exists
    const existingPhone = await pool.query(
      `SELECT * FROM Users WHERE phone_no = $1`,
      [phone_number]
    );
    if (existingPhone.rows.length > 0) {
      return res.status(409).json({ error: 'Phone number already exists' });
    }
    // Hash password and insert new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result1 = await pool.query(
      `INSERT INTO Users (name, password, email, phone_no) 
       VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, phone_no`,
      [username, hashedPassword, email, phone_number]
    );
    // Set session user ID

    const result = await pool.query(
      `SELECT * FROM Users WHERE email = $1`,
      [email]
    );
    req.session.userId = result.rows[0].user_id;
    res.status(200).json({ message: 'User registered successfully!', user: result.rows[0] });
  } catch (error) {
    handleDbError(res, error);
  }
});

// User Login
app.post('/user-login',isLoggedIn, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM Users WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.userId = user.user_id;
    res.status(200).json({ message: 'Login successful', user: { id: user.user_id, name: user.name, email: user.email } });
  } catch (error) {
    handleDbError(res, error);
  }
});

// Admin Login
app.post('/admin-login',isLoggedIn, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM Admin WHERE email = $1`,
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const admin = result.rows[0];
    // const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!(password === admin.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.adminId = admin.admin_id;
    console.log('%d : %d',req.session.adminId,admin.admin_id);
    res.status(200).json({ message: 'Admin login successful', admin: { id: admin.admin_id, name: admin.name, email: admin.email } });
  } catch (error) {
    handleDbError(res, error);
  }
});

// Get List of Trains
app.get('/trains',isAuthenticated, async (req, res) => {
  console.log("User id : ",req.session.userId);
  try {
    const result = await pool.query(`SELECT * FROM Train`);
    res.status(200).json(result.rows);
  } catch (error) {
    handleDbError(res, error);
  }
});

// Add Train (Admin only)
app.post('/add-train',isAuthenticated, async (req, res) => {
  const { train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, operating_days } = req.body;
  console.log(operating_days);
  console.log("Admin adding train : ",req.session.adminId);
  if (!req.session.adminId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
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

// Logout
// app.post('/logout', (req, res) => {
//   req.session.destroy(err => {
//     if (err) {
//       return res.status(500).json({ error: 'Could not log out, please try again' });
//     }
//     res.clearCookie('connect.sid');
//     res.json({ message: 'Logout successful' });
//   });
// });
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Logout failed");
    }

    res.clearCookie("connect.sid");
    console.log("User logged out");
    return res.status(200).json({ message: "Logged out" }); // ✅ Clean JSON response
  });
});




// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;