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


// app.post("/book-ticket",isAuthenticated, async (req, res) => {
//   const { train_id, travel_date, train_class, passengers } = req.body;
//   const user_id = req.session.userId;
//   console.log("seats available: ",req.body);
//   if (!user_id || !train_id || !travel_date || !train_class || !Array.isArray(passengers)) {
//     return res.status(400).json({ error: "Missing required booking data" });
//   }
  
//   // const client = await pool.connect();

//   try {
//     await pool.query("BEGIN");
    
//     // 1. Generate unique PNR
    // const pnr_number = "PNR" + Date.now() + Math.floor(Math.random() * 1000);

//     // 2. Insert into Booking
//     const booking_date = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

//     const bookingRes = await pool.query(
//       `INSERT INTO Booking (user_id, train_id, pnr_number, travel_date, booking_date, booking_status, total_fare)
//        VALUES ($1, $2, $3, $4, $5, 'Confirmed', 100)
//        RETURNING booking_id`,
//       [user_id, train_id, pnr_number, travel_date, booking_date]
//     );
    
//     const booking_id = bookingRes.rows[0].booking_id;

//     // 3. Fetch available seats for the train/class
//     const seatRes = await pool.query(
//       `SELECT seat_id FROM Seats 
//        WHERE train_id = $1 AND class = $2 AND status = 'Available' 
//        LIMIT $3 FOR UPDATE`,
//       [train_id, train_class, passengers.length]
//     );

//     if (seatRes.rows.length < passengers.length) {
//       await pool.query("ROLLBACK");
//       return res.status(400).json({ error: "Not enough available seats" });
//     }

//     const seat_ids = seatRes.rows.map(row => row.seat_id);
    
//     // 4. Insert Tickets and mark seats as Booked
//     for (let i = 0; i < passengers.length; i++) {
//       const { name, gender, age } = passengers[i];
//       const seat_id = seat_ids[i];

//       await pool.query(
//         `INSERT INTO Ticket (train_id, booking_id, seat_id, passenger_name, gender, age)
//          VALUES ($1, $2, $3, $4, $5, $6)`,
//         [train_id, booking_id, seat_id, name, gender, age]
//       );

//       await pool.query(
//         `UPDATE Seats SET status = 'Booked' WHERE seat_id = $1`,
//         [seat_id]
//       );
//     }

//     await pool.query("COMMIT");

//     return res.status(200).json({ message: "Booking successful", pnr_number });

//   } catch (err) {
//     await pool.query("ROLLBACK");
//     console.error("Booking error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   } finally {
//     // client.release();
//   }
// });

// Updated /book-ticket endpoint to handle multiple seats and passengers
app.post('/book-ticket', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      train_id,
      travel_date,
      train_class,
      srcStn,
      destStn,
      seats
    } = req.body;

    const booking_date = new Date().toISOString().split('T')[0];
    const booking_status = 'Confirmed';
    const pnr_number = "PNR" + Date.now() + Math.floor(Math.random() * 1000);

    // Get user_id from session
    const user_id = req.session.userId;
    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const src_stn_id_q = await pool.query(`Select station_id from stations where station_name = $1`, [srcStn]);
    const dest_stn_id_q = await pool.query(`Select station_id from stations where station_name = $1`, [destStn]);
    const src_stn_id = src_stn_id_q.rows[0].station_id;
    const dest_stn_id = dest_stn_id_q.rows[0].station_id;
    // Validate input
    if (!train_id || !travel_date || !train_class || !src_stn_id || !dest_stn_id || !seats || !seats.length) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    // Validate each seat entry
    for (const seat of seats) {
      if (!seat.seat_id || !seat.passenger_name || !seat.passenger_gender || !seat.passenger_age) {
        return res.status(400).json({ error: 'Missing passenger or seat details' });
      }
    }

    await client.query('BEGIN');

    // Generate a PNR - using UUID for more uniqueness
    // const pnr = 'PNR' + Date.now() + Math.floor(Math.random() * 1000);

    // Create a single booking record for all seats
    const bookingResult = await client.query(
      `INSERT INTO Booking (
        user_id, train_id, travel_date , booking_date , train_class,
        src_stn, dest_stn,booking_status, pnr_number, total_fare
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING booking_id`,
      [
        user_id, train_id, travel_date , booking_date , train_class,
        src_stn_id, dest_stn_id, booking_status, pnr_number, 0
      ]
    );

    const booking_id = bookingResult.rows[0].booking_id;

    // Insert a ticket for each passenger/seat
    for (const seat of seats) {
      await client.query(
        `INSERT INTO Ticket (
          booking_id, seat_id,
          passenger_name, passenger_gender, passenger_age
        )
        VALUES ($1,$2,$3,$4,$5)`,
        [
          booking_id, seat.seat_id,
          seat.passenger_name, seat.passenger_gender, seat.passenger_age
        ]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Tickets booked successfully!',
      booking_id,
      pnr_number: pnr_number,
      num_tickets: seats.length
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Booking failed:', err);
    res.status(500).json({ error: 'Ticket booking failed. Please try again.' });
  } finally {
    client.release();
  }
});

// Utility to get all station IDs between source and destination
async function getStationIdsBetween(train_id, src_id, dest_id) {
  try {
    
    const result = await pool.query(
      `SELECT stop_number, station_id FROM Route WHERE train_id = $1 ORDER BY stop_number`,
      [train_id]
    );
    // console.log(result.rows);
    // console.log(src_id);
    // console.log(dest_id);
    const route = result.rows;
    const srcStop = route.find(r => r.station_id === src_id)?.stop_number;
    const destStop = route.find(r => r.station_id === dest_id)?.stop_number;
    // console.log(srcStop);
    // console.log(destStop);
    
    if (!srcStop) {
      console.error(`[ERROR] Source station ID ${src_id} not found in route`);
      throw new Error(`Source station ID ${src_id} not found in route`);
    }
    
    if (!destStop) {
      console.error(`[ERROR] Destination station ID ${dest_id} not found in route`);
      throw new Error(`Destination station ID ${dest_id} not found in route`);
    }
    
    if (srcStop >= destStop) {
      console.error(`[ERROR] Invalid route direction: srcStop=${srcStop}, destStop=${destStop}`);
      throw new Error('Invalid route segment: source must come before destination');
    }

    // Include stations at both source and destination stops
    const filteredStations = route
      .filter(r => r.stop_number >= srcStop && r.stop_number < destStop)
      .map(r => r.station_id);
      
    
    return filteredStations;
  } catch (error) {
    console.error(`[ERROR] Error in getStationIdsBetween: ${error.message}`);
    throw error;
  }
}

app.get('/available-seats', async (req, res) => {
  
  try {
    const { train_id, class: train_class, travel_date, src_stn, dest_stn } = req.query;

    if (!train_id || !train_class || !travel_date || !src_stn || !dest_stn) {
      console.error(`[ERROR] Missing required parameters:`, {
        train_id: !!train_id,
        train_class: !!train_class,
        travel_date: !!travel_date,
        src_stn: !!src_stn,
        dest_stn: !!dest_stn
      });
      return res.status(400).json({ error: "Missing required query parameters" });
    }

    // Parse input parameters
    const trainId = parseInt(train_id);

    // Validate numeric parameters
    if (isNaN(trainId) ) {
      console.error(`[ERROR] Invalid numeric parameters:`, {
        trainId: isNaN(trainId) ? 'NaN' : trainId
      });
      return res.status(400).json({ error: "Invalid numeric parameters" });
    }


    // Get all stations in the requested journey segment
    const src_stn_id = await pool.query(`Select station_id from stations where station_name = $1`, [src_stn]);
    const dest_stn_id = await pool.query(`Select station_id from stations where station_name = $1`, [dest_stn]);
    const segmentStations = await getStationIdsBetween(trainId, src_stn_id.rows[0].station_id, dest_stn_id.rows[0].station_id);

    // Fetch all seats for the specified train and class
    const allSeatsQuery = `
      SELECT seat_id, bhogi, seat_number 
      FROM Seats
      WHERE train_id = $1 AND class = $2
      ORDER BY bhogi, seat_number
    `;
    
    const allSeats = await pool.query(allSeatsQuery, [trainId, train_class]);
    
    if (allSeats.rows.length === 0) {
      console.warn(`[WARN] No seats found for train ${trainId}, class ${train_class}`);
    }

    // Create a map with all seats initially marked as available
    const seatMap = new Map();
    for (const seat of allSeats.rows) {
      seatMap.set(seat.seat_id, {
        ...seat,
        available: true
      });
    }

    // Fetch all bookings for the same date and class that might affect our journey
    const bookingsQuery = `
      SELECT T.seat_id, B.src_stn, B.dest_stn
      FROM Ticket T 
      JOIN Booking B ON T.booking_id = B.booking_id
      WHERE B.train_id = $1 AND B.train_class = $2 AND B.travel_date = $3
    `;
    
    const bookings = await pool.query(bookingsQuery, [trainId, train_class, travel_date]);

    // console.log(bookings.rows);

    // Detailed logging of each booking
    if (bookings.rows.length > 0) {
    }

    // Determine seat availability based on overlapping segments
    let unavailableCount = 0;
    for (const booking of bookings.rows) {
      try {
        // const stnnames1 = await pool.query(`Select station_name from stations where station_id = $1`, [booking.from_station_id]);
        // const stnnames2 = await pool.query(`Select station_name from stations where station_id = $1`, [booking.to_station_id]);
        // Get stations in the booked segment
        const bookedSegmentStations = await getStationIdsBetween(
          trainId, 
          booking.src_stn, 
          booking.dest_stn,
        );
        
        
        // Check if any station appears in both the booked segment and our journey
        const overlappingStations = segmentStations.filter(stationId => 
          bookedSegmentStations.includes(stationId)
        );
        
        const hasOverlap = overlappingStations.length > 0;

        // If there's an overlap in the route segments, mark the seat as unavailable
        if (hasOverlap && seatMap.has(booking.seat_id)) {
          seatMap.get(booking.seat_id).available = false;
          unavailableCount++;
        }
      } catch (error) {
        // Continue with the next booking even if one fails
      }
    }

    // Convert the map back to an array for response
    const result = Array.from(seatMap.values());
    const availableCount = result.filter(s => s.available).length;
    
    
    // Detailed seat availability breakdown by bhogi (coach)
    const seatsByBhogi = {};
    result.forEach(seat => {
      if (!seatsByBhogi[seat.bhogi]) {
        seatsByBhogi[seat.bhogi] = { total: 0, available: 0 };
      }
      seatsByBhogi[seat.bhogi].total++;
      if (seat.available) {
        seatsByBhogi[seat.bhogi].available++;
      }
    });
    
    
    // Print first 10 available seats and first 10 unavailable seats for debug
    const sampleAvailable = result.filter(s => s.available).slice(0, 10);
    const sampleUnavailable = result.filter(s => !s.available).slice(0, 10);
    
    
    res.json({ seats: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seat availability: ' + err.message });
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
         Tk.ticket_id, Tk.passenger_name, Tk.passenger_gender, Tk.passenger_age, 
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
        gender: row.passenger_gender,
        age: row.passenger_age,
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
