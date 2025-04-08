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

app.post("/book-ticket", async (req, res) => {
  const { train_id, travel_date, train_class, passengers } = req.body;
  const user_id = req.session.userId;

  if (!user_id || !train_id || !travel_date || !train_class || !Array.isArray(passengers)) {
    return res.status(400).json({ error: "Missing required booking data" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Generate unique PNR
    const pnr_number = "PNR" + Date.now() + Math.floor(Math.random() * 1000);

    // 2. Insert into Booking
    const booking_date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const bookingRes = await client.query(
      `INSERT INTO Booking (user_id, train_id, pnr_number, travel_date, booking_date, booking_status, total_fare)
       VALUES ($1, $2, $3, $4, $5, 'Confirmed', 100)
       RETURNING booking_id`,
      [user_id, train_id, pnr_number, travel_date, booking_date]
    );
    
    const booking_id = bookingRes.rows[0].booking_id;

    // 3. Fetch available seats for the train/class
    const seatRes = await client.query(
      `SELECT seat_id FROM Seats 
       WHERE train_id = $1 AND class = $2 AND status = 'Available' 
       LIMIT $3 FOR UPDATE`,
      [train_id, train_class, passengers.length]
    );

    if (seatRes.rows.length < passengers.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Not enough available seats" });
    }

    const seat_ids = seatRes.rows.map(row => row.seat_id);

    // 4. Insert Tickets and mark seats as Booked
    for (let i = 0; i < passengers.length; i++) {
      const { name, gender, age } = passengers[i];
      const seat_id = seat_ids[i];

      await client.query(
        `INSERT INTO Ticket (train_id, booking_id, seat_id, passenger_name, gender, age)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [train_id, booking_id, seat_id, name, gender, age]
      );

      await client.query(
        `UPDATE Seats SET status = 'Booked' WHERE seat_id = $1`,
        [seat_id]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({ message: "Booking successful", pnr_number });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Booking error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

app.get("/my-tickets", async (req, res) => {
  const user_id = req.session.userId;
  if (!user_id) return res.status(401).json({ error: "Not logged in" });

  try {
    const result = await pool.query(
      `SELECT 
         B.booking_id, B.pnr_number, B.travel_date, B.booking_date, 
         B.booking_status, B.total_fare,
         T.train_id, T.train_name, T.train_no,
         Tk.ticket_id, Tk.passenger_name, Tk.gender, Tk.age, 
         S.seat_id, S.class, S.bhogi, S.seat_number
       FROM Booking B
       JOIN Train T ON B.train_id = T.train_id
       JOIN Ticket Tk ON B.booking_id = Tk.booking_id
       JOIN Seats S ON Tk.seat_id = S.seat_id
       WHERE B.user_id = $1
       ORDER BY B.booking_date DESC`,
      [user_id]
    );

    // Group passengers by booking
    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.booking_id]) {
        grouped[row.booking_id] = {
          booking_id: row.booking_id,
          pnr_number: row.pnr_number,
          travel_date: row.travel_date,
          booking_date: row.booking_date,
          booking_status: row.booking_status,
          total_fare: row.total_fare,
          train_name: row.train_name,
          train_no: row.train_no,
          passengers: []
        };
      }
      grouped[row.booking_id].passengers.push({
        ticket_id: row.ticket_id,
        name: row.passenger_name,
        gender: row.gender,
        age: row.age,
        class: row.class,
        bhogi: row.bhogi,
        seat_number: row.seat_number
      });
    });

    res.status(200).json(Object.values(grouped));
  } catch (err) {
    console.error("Error fetching tickets:", err);
    res.status(500).json({ error: "Internal server error" });
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