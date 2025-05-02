const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
// const pgSession = require('connect-pg-simple')(session);
const app = express();
const port = 4000;


// extra modules used
// date-fns 
// uuid 
// axios

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
  return res.status(400).json( {message: "Unauthorized" });
  // return res.redirect('/');
}

function isLoggedIn(req, res, next) {
  if(req.session.userId){
    return res.status(200).json({ loggedIn: true, userId: req.session.userId });
  }
  else if(req.session.adminId){
    return res.status(200).json({ loggedIn: true, adminId: req.session.adminId });
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
// app.get('/trains',isAuthenticated, async (req, res) => {
//   console.log("User id : ",req.session.userId);
//   try {
//     const result = await pool.query(`SELECT * FROM Train`);
//     res.status(200).json(result.rows);
//   } catch (error) {
//     handleDbError(res, error);
//   }
// });

// not using /trains

app.get('/stations', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Stations ORDER BY station_name");
    res.json(result.rows);
  } catch (err) {
    handleDbError(res, err);
  }
});


const { format } = require('date-fns'); // Add this package if not installed

app.post('/search-trains', isAuthenticated, async (req, res) => {
  const { srcStn, destStn, travelDate } = req.body;

  if (!srcStn || !destStn || !travelDate) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const travelDay = format(new Date(travelDate), 'EEEE'); // e.g., "Wednesday"

    const result = await pool.query(`
      SELECT DISTINCT t.*
      FROM Train t
      JOIN Route r1 ON t.train_id = r1.train_id
      JOIN Route r2 ON t.train_id = r2.train_id
      JOIN Stations s1 ON r1.station_id = s1.station_id
      JOIN Stations s2 ON r2.station_id = s2.station_id
      WHERE s1.station_name ILIKE $1
        AND s2.station_name ILIKE $2
        AND r1.stop_number < r2.stop_number
        AND $3 = ANY (t.operating_days)
    `, [srcStn, destStn, travelDay]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Search error:", err);
    handleDbError(res, err);
  }
});


// Add Train (Admin only)
// app.post('/add-train',isAuthenticated, async (req, res) => {
//   const { train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, operating_days } = req.body;
//   console.log(operating_days);
//   console.log("Admin adding train : ",req.session.adminId);
//   if (!req.session.adminId) {
//     return res.status(403).json({ error: 'Unauthorized' });
//   }
//   try {
//     const result = await pool.query(
//       `INSERT INTO Train (train_no, train_name, src_stn, dest_stn,
//         arrival_time, departure_time, operating_days)
//        VALUES ($1, $2, $3, $4, $5, $6, $7)
//        RETURNING train_id`,
//       [train_no, train_name, src_stn, dest_stn,
//         arrival_time, departure_time,
//         operating_days]
//     );
//     res.status(201).json({ message: 'Train added successfully!', train: result.rows[0] });
//   } catch (error) {
//     handleDbError(res, error);
//   }
// });

app.post('/add-train', isAuthenticated, async (req, res) => {
  const {
    train_no, train_name, src_stn, dest_stn,
    arrival_time, departure_time, operating_days,
    seatCounts
  } = req.body;

  if (!req.session.adminId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO Train (train_no, train_name, src_stn, dest_stn,
        arrival_time, departure_time, operating_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING train_id`,
      [train_no, train_name, src_stn, dest_stn,
        arrival_time, departure_time, operating_days]
    );

    const trainId = result.rows[0].train_id;

    const bhogi = 'B1'; // using 'B1' by default
    let insertValues = [];
    let index = 1;

    for (const cls of ['SLP', '3AC', '2AC', '1AC']) {
      const count = seatCounts[cls];
      for (let i = 1; i <= count; i++) {
        insertValues.push(`(${trainId}, '${cls}', '${bhogi}', ${i}, 'Available')`);
      }
    }

    if (insertValues.length > 0) {
      const seatsQuery = `
        INSERT INTO Seats (train_id, class, bhogi, seat_number, status)
        VALUES ${insertValues.join(",")}
      `;
      await client.query(seatsQuery);
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Train and seats added successfully!', train: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Add train error:", error);
    res.status(500).json({ error: 'Failed to add train and seats' });
  } finally {
    client.release();
  }
});


app.post("/book-ticket",isAuthenticated, async (req, res) => {
  const { train_id, travel_date, train_class, passengers } = req.body;
  const user_id = req.session.userId;
  console.log("seats available: ",req.body);
  if (!user_id || !train_id || !travel_date || !train_class || !Array.isArray(passengers)) {
    return res.status(400).json({ error: "Missing required booking data" });
  }
  
  // const client = await pool.connect();

  try {
    await pool.query("BEGIN");
    
    // 1. Generate unique PNR
    const pnr_number = "PNR" + Date.now() + Math.floor(Math.random() * 1000);

    // 2. Insert into Booking
    const booking_date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    const bookingRes = await pool.query(
      `INSERT INTO Booking (user_id, train_id, pnr_number, travel_date, booking_date, booking_status, total_fare)
       VALUES ($1, $2, $3, $4, $5, 'Confirmed', 100)
       RETURNING booking_id`,
      [user_id, train_id, pnr_number, travel_date, booking_date]
    );
    
    const booking_id = bookingRes.rows[0].booking_id;

    // 3. Fetch available seats for the train/class
    const seatRes = await pool.query(
      `SELECT seat_id FROM Seats 
       WHERE train_id = $1 AND class = $2 AND status = 'Available' 
       LIMIT $3 FOR UPDATE`,
      [train_id, train_class, passengers.length]
    );

    if (seatRes.rows.length < passengers.length) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Not enough available seats" });
    }

    const seat_ids = seatRes.rows.map(row => row.seat_id);
    
    // 4. Insert Tickets and mark seats as Booked
    for (let i = 0; i < passengers.length; i++) {
      const { name, gender, age } = passengers[i];
      const seat_id = seat_ids[i];

      await pool.query(
        `INSERT INTO Ticket (train_id, booking_id, seat_id, passenger_name, gender, age)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [train_id, booking_id, seat_id, name, gender, age]
      );

      await pool.query(
        `UPDATE Seats SET status = 'Booked' WHERE seat_id = $1`,
        [seat_id]
      );
    }

    await pool.query("COMMIT");

    return res.status(200).json({ message: "Booking successful", pnr_number });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Booking error:", err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    // client.release();
  }
});


// Utility to get all station IDs between source and destination
async function getStationIdsBetween(train_id, src_id, dest_id) {
  const result = await pool.query(
    `SELECT stop_number, station_id FROM Route WHERE train_id = $1 ORDER BY stop_number`,
    [train_id]
  );

  const route = result.rows;
  const srcStop = route.find(r => r.station_id === src_id)?.stop_number;
  const destStop = route.find(r => r.station_id === dest_id)?.stop_number;

  if (!srcStop || !destStop || srcStop >= destStop) {
    throw new Error('Invalid route segment');
  }

  return route
    .filter(r => r.stop_number >= srcStop && r.stop_number < destStop)
    .map(r => r.station_id);
}

app.get('/available-seats', async (req, res) => {
  try {
    const { train_id, class: train_class, travel_date, src_stn, dest_stn } = req.query;

    if (!train_id || !train_class || !travel_date || !src_stn || !dest_stn) {
      return res.status(400).json({ error: "Missing required query parameters" });
    }

    const segmentStations = await getStationIdsBetween(
      parseInt(train_id),
      parseInt(src_stn),
      parseInt(dest_stn)
    );

    // Fetch all seats for the specified train and class
    const allSeats = await pool.query(
      `SELECT seat_id, bhogi, seat_number FROM Seats
       WHERE train_id = $1 AND class = $2`,
      [train_id, train_class]
    );

    const seatMap = new Map();
    for (const seat of allSeats.rows) {
      seatMap.set(seat.seat_id, {
        ...seat,
        available: true
      });
    }

    // Fetch all bookings for the same date and class
    const bookings = await pool.query(
      `SELECT T.seat_id, T.from_station_id, T.to_station_id
       FROM Ticket T
       JOIN Booking B ON T.booking_id = B.booking_id
       WHERE B.train_id = $1 AND B.train_class = $2 AND B.travel_date = $3`,
      [train_id, train_class, travel_date]
    );

    // Determine seat availability based on overlapping segments
    for (const b of bookings.rows) {
      const bookedSegment = await getStationIdsBetween(train_id, b.from_station_id, b.to_station_id);
      const overlap = bookedSegment.some(stationId => segmentStations.includes(stationId));
      if (overlap && seatMap.has(b.seat_id)) {
        seatMap.get(b.seat_id).available = false;
      }
    }

    const result = Array.from(seatMap.values());
    res.json({ seats: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seat availability' });
  }
});




app.get("/my-tickets", isAuthenticated,async (req, res) => {
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
app.get("/logout", (req, res) => {
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
