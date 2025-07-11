const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require("nodemailer");
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

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mybookingsystem1@gmail.com", // your email
    pass: "wrtr hpky rvqg frpk", // app password or SMTP pass
  },
})

function isAuthenticated(req, res, next) {
  if(req.session.userId || req.session.adminId){
    return next();
  }
  return res.status(400).json( {error: "Unauthorized" });
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
    res.status(200).json({ loggedIn: true, userId: req.session.userId , username:req.session.username});
  } else {
    res.status(401).json({ loggedIn: false });
  }
});

app.get('/isAdminLoggedIn', (req, res) => {
  if (req.session.adminId) {
    res.status(200).json({ loggedIn: true, adminId: req.session.adminId, adminname:req.session.adminname });
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
    req.session.username = result.rows[0].name;
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
    req.session.username = user.name;
    res.status(200).json({ message: 'Login successful', user: { id: user.user_id, name: user.name, email: user.email } });
  } catch (error) {
    handleDbError(res, error);
  }
});

app.get("/profile", isAuthenticated,async (req, res) => {
  try {
    if(req.session.adminId){
      const adminId = req.session.adminId;
      const result = await pool.query(
        "SELECT name, email, phone_no FROM Admin WHERE admin_id = $1",
        [adminId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Admin not found" });
      }
      res.status(200).json({re:result.rows[0],type:true});
    }
    else{
    const userId = req.session.userId;
    const result = await pool.query(
      "SELECT name, email, phone_no FROM Users WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({re: result.rows[0],type:false});}
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/delete-account", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not logged in" });
    }
    const { rows } = await pool.query("SELECT * FROM Users WHERE user_id = $1", [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    // Delete user (ON DELETE CASCADE will clean up bookings, tickets, etc.)
    await pool.query("DELETE FROM Users WHERE user_id = $1", [userId]);

    req.session.destroy(); // Clear session
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Internal server error" });
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
    req.session.adminname = admin.name;
    console.log('%d : %d',req.session.adminId,admin.admin_id);
    res.status(200).json({ message: 'Admin login successful', admin: { id: admin.admin_id, name: admin.name, email: admin.email } });
  } catch (error) {
    handleDbError(res, error);
  }
});


app.post('/add-delay', async (req, res) => {
  const { train_no, station_code, departure_date, delay_minutes, type } = req.body;

  try {
    const trainRes = await pool.query(`SELECT train_id FROM Train WHERE train_no = $1`, [train_no]);
    if (trainRes.rowCount === 0) return res.status(404).json({ message: 'Train not found' });

    const stationRes = await pool.query(`SELECT station_id FROM Stations WHERE station_code = $1`, [station_code]);
    if (stationRes.rowCount === 0) return res.status(404).json({ message: 'Station not found' });

    const { train_id } = trainRes.rows[0];
    const { station_id } = stationRes.rows[0];

    const routeRes = await pool.query(
      `SELECT route_id FROM Route WHERE train_id = $1 AND station_id = $2`,
      [train_id, station_id]
    );
    if (routeRes.rowCount === 0) return res.status(404).json({ message: 'Route entry not found' });

    const { route_id } = routeRes.rows[0];

    const existing = await pool.query(
      `SELECT * FROM Delays WHERE route_id = $1 AND departure_date = $2`,
      [route_id, departure_date]
    );

    if (existing.rowCount > 0) {
      if (type === 'arrival') {
        await pool.query(
          `UPDATE Delays SET arrival_delay_minutes = $1,status = 'Arrived' WHERE route_id = $2 AND departure_date = $3`,
          [delay_minutes, route_id, departure_date]
        );
      } else {
        await pool.query(
          `UPDATE Delays SET departure_delay_minutes = $1,status = 'Departed' WHERE route_id = $2 AND departure_date = $3`,
          [delay_minutes, route_id, departure_date]
        );
      }
    } else {
          const allRoutes = await pool.query('SELECT route_id FROM Route WHERE train_id = $1', [train_id]);
          for (const r of allRoutes.rows) {
            const r_id = r.route_id;
            const arrival = (r_id === route_id && type === 'arrival') ? delay_minutes : 0;
            const departure = (r_id === route_id && type === 'departure') ? delay_minutes : 0;
            if(r_id === route_id &&type === 'arrival'){
            await pool.query(
              `INSERT INTO Delays (route_id, departure_date, arrival_delay_minutes, departure_delay_minutes,status) VALUES ($1, $2, $3, $4,$5)`,
              [r_id, departure_date, arrival, departure,"Arrived"] );
            }
            else if(r_id === route_id &&type === 'departure'){
              await pool.query(
              `INSERT INTO Delays (route_id, departure_date, arrival_delay_minutes, departure_delay_minutes,status) VALUES ($1, $2, $3, $4,$5)`,
              [r_id, departure_date, arrival, departure,"Departed"] );
            }
            else{
              await pool.query(
                `INSERT INTO Delays (route_id, departure_date, arrival_delay_minutes, departure_delay_minutes) VALUES ($1, $2, $3, $4)`,
                [r_id, departure_date, arrival, departure] );
            }
          }
      // const arrival = type === 'arrival' ? delay_minutes : 0;
      // const departure = type === 'departure' ? delay_minutes : 0;
      // await pool.query(
      //   'INSERT INTO Delays (route_id, departure_date, arrival_delay_minutes, departure_delay_minutes) VALUES ($1, $2, $3, $4)',
      //   [route_id, departure_date, arrival, departure]
      // );
    }

    res.status(200).json({ message: 'Delay updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
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
    res.status(200).json(result.rows);
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
    train_no, 
    train_name, 
    src_stn, 
    dest_stn, 
    arrival_time, 
    departure_time, 
    operating_days,
    seatCounts,
    intermediateStations ,
    distance
  } = req.body;

  const client = await pool.connect();
  await client.query('BEGIN');
  const daysArray = operating_days
        .replace(/[{}]/g, '')
        .split(',')
        .map(day => day.trim());

  for (const day of daysArray) {
    if (!['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(day)) {
      throw new Error(`Invalid day: ${day}`);
    }
  }

  if (!req.session.adminId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  const srcStationQuery = await client.query(
    'SELECT station_id FROM Stations WHERE station_code = $1',
    [src_stn]
  );
  const destStationQuery = await client.query(
    'SELECT station_id FROM Stations WHERE station_code = $1',
    [dest_stn]
  );
  if (srcStationQuery.rows.length === 0) {
    throw new Error(`Source station with code ${src_stn} does not exist`);
  }
  
  if (destStationQuery.rows.length === 0) {
    throw new Error(`Destination station with code ${dest_stn} does not exist`);
  }

 
  try {
    
    const trainResult = await client.query(
      `INSERT INTO Train 
       (train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, operating_days) 
       VALUES ($1, $2, $3, $4, $5, $6, $7::day_enum[]) 
       RETURNING train_id`,
      [train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, `{${daysArray.join(',')}}`]
    );

    const trainId = trainResult.rows[0].train_id;

    const seatClasses = Object.keys(seatCounts);
    for (const seatClass of seatClasses) {
        const count = seatCounts[seatClass];
        if (count > 0) {
          // Determine how many seats per bogie based on class
          let seatsPerBogie = 72;  // Default for SLP
          if (seatClass === '3AC') seatsPerBogie = 64;
          else if (seatClass === '2AC') seatsPerBogie = 46;
          else if (seatClass === '1AC') seatsPerBogie = 24;
          
          const bogieCount = Math.ceil(count / seatsPerBogie);
          
          for (let bogieNum = 1; bogieNum <= bogieCount; bogieNum++) {
            const bogieName = `B${bogieNum}`;
            const seatsInThisBogie = bogieNum < bogieCount ? seatsPerBogie : count - ((bogieNum - 1) * seatsPerBogie);
            
            for (let seatNum = 1; seatNum <= seatsInThisBogie; seatNum++) {
              await client.query(
                `INSERT INTO Seats 
                 (train_id, class, bhogi, seat_number) 
                 VALUES ($1, $2, $3, $4)`,
                [trainId, seatClass, bogieName, seatNum]
              );
            }
          }
        }
      }
      const srcStationId = srcStationQuery.rows[0].station_id;
      await client.query(
        `INSERT INTO Route 
         (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_start_km) 
         VALUES ($1, $2, $3, NULL, $4, $5)`,
        [trainId, srcStationId, 1, departure_time, 0]  // Source has no arrival time
      );

      if (intermediateStations && intermediateStations.length > 0) {
        for (const station of intermediateStations) {
          // Check if station exists
          const stationQuery = await client.query(
            'SELECT station_id FROM Stations WHERE station_code = $1',
            [station.station_code]
          );
          
          if (stationQuery.rows.length === 0) {
            throw new Error(`Station with code ${station.station_code} does not exist`);
          }
          
          const stationId = stationQuery.rows[0].station_id;
          
          await client.query(
            `INSERT INTO Route 
             (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_start_km) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              trainId, 
              stationId, 
              station.stop_number, 
              station.arrival_time, 
              station.departure_time, 
              station.distance_from_start_km
            ]
          );
        }
      }
      const destStationId = destStationQuery.rows[0].station_id;
      const finalStopNumber = intermediateStations.length > 0 
        ? intermediateStations.length + 2  : 2;
      await client.query(
          `INSERT INTO Route 
           (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_start_km) 
           VALUES ($1, $2, $3, $4, NULL, $5)`,
          [trainId, destStationId, finalStopNumber, arrival_time, distance]  // Destination has no departure time
        );
      await client.query('COMMIT');
      res.status(201).json({ message: 'Train and seats,routes added successfully!', train: trainResult.rows[0] , train_id: trainId  });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Add train error:", error);
    res.status(500).json({ error: 'Failed to add train and seats' });
  } finally {
    client.release();
  }
});



const sendBookingConfirmation = async (toEmail, bookingDetails) => {
  const { pnr, trainName, travelDate, passengers, seats, waitlistedPassengers , fare} = bookingDetails;

  // Create confirmed passengers section
  let confirmedSection = '';
  if (passengers.length > 0) {
    confirmedSection = `\nConfirmed Passengers:\n${seats.map((s, i) =>
      `Passenger ${i + 1}: ${passengers[i].passenger_name}, Seat: ${s.bhogi}-${s.seat_number}`
    ).join("\n")}`;
  }

  // Create waitlisted passengers section
  let waitlistedSection = '';
  if (waitlistedPassengers && waitlistedPassengers.length > 0) {
    waitlistedSection = `\n\nWaitlisted Passengers:\n${waitlistedPassengers.map((p, i) =>
      `Passenger: ${p.passenger_name}, Waitlist Number: WL${p.waitlist_number}`
    ).join("\n")}`;
  }

  const mailOptions = {
    from: "mybookingsystem1@gmail.com",
    to: toEmail,
    subject: `Your Train Booking Confirmation - PNR ${pnr}`,
    text: `Your booking was successful! \n\n Train:${trainName} \nDate: ${travelDate} \n PNR: ${pnr} \n Total Fare: ${fare} \n${confirmedSection} \n ${waitlistedSection}\n \nThank you for booking with us!`,
  };

  await transporter.sendMail(mailOptions);
};


app.post('/book-ticket', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      train_id,
      travel_date,
      train_class,
      srcStn,
      destStn,
      seats,
      waitlisted_passengers 
    } = req.body;

    const booking_date = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' format

    const booking_status = 'Confirmed';
    const currentTime = new Date();
    const pnr_number = Date.now() + currentTime.getHours() * 10000 + currentTime.getMinutes() * 100 + currentTime.getSeconds();

    // Get user_id from session
    const user_id = req.session.userId;
    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const src_stn_id_q = await pool.query(`Select station_id from stations where station_name = $1`, [srcStn]);
    const dest_stn_id_q = await pool.query(`Select station_id from stations where station_name = $1`, [destStn]);
    const src_stn_id = src_stn_id_q.rows[0].station_id;
    const dest_stn_id = dest_stn_id_q.rows[0].station_id;

    const dis1 = await pool.query(`select distance_from_start_km from Route where station_id = $1 and train_id = $2`,[src_stn_id,train_id]);
    const dis2 = await pool.query(`select distance_from_start_km from Route where station_id = $1 and train_id = $2`,[dest_stn_id,train_id]);
    let dis_1 = dis1.rows[0].distance_from_start_km;
    let dis_2 = dis2.rows[0].distance_from_start_km;
    // Validate input
    if (!train_id || !travel_date || !train_class || !src_stn_id || !dest_stn_id || !(seats || waitlisted_passengers )) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    let fare = 0;

    // Validate each seat entry
    if(seats){
      for (const seat of seats) {
        if (!seat.seat_id || !seat.passenger_name || !seat.passenger_gender || !seat.passenger_age) {
          return res.status(400).json({ error: 'Missing passenger or seat details' });
        }
        const class1 = await pool.query(`select class from seats where train_id=$1 and seat_id=$2`,[train_id,seat.seat_id]);
        let class2 = class1.rows[0].class;
        if(class2 == '3AC') {fare += 3*(dis_2 - dis_1);}
        if(class2 == '2AC') fare += 4*(dis_2 - dis_1);
        if(class2 == '1AC') fare += 5*(dis_2 - dis_1);
        if(class2 == 'SLP') fare += 2*(dis_2 - dis_1);
      }
      for (const pas of waitlisted_passengers){
        if(train_class == '3AC') {fare += 3*(dis_2 - dis_1);}
        if(train_class == '2AC') fare += 4*(dis_2 - dis_1);
        if(train_class == '1AC') fare += 5*(dis_2 - dis_1);
        if(train_class == 'SLP') fare += 2*(dis_2 - dis_1);
      }
    }

    

    if (waitlisted_passengers && waitlisted_passengers.length > 0) {
      for (const passenger of waitlisted_passengers) {
        if (!passenger.passenger_name || !passenger.passenger_gender || 
            !passenger.passenger_age || !passenger.waitlist_number) {
          return res.status(400).json({ error: 'Missing waitlisted passenger details' });
        }
      }
    }

    await client.query('BEGIN');

    const waitlistSeatResult = await client.query(
      `SELECT seat_id FROM Seats 
       WHERE train_id = $1 AND class = $2 AND bhogi = 'WL' AND seat_number = 0`,
      [train_id, train_class]
    );

    if (!waitlistSeatResult.rows.length) {
      throw new Error('Waitlist seat not found for this class');
    }

    const waitlist_seat_id = waitlistSeatResult.rows[0].seat_id;

    // Generate a PNR - using UUID for more uniqueness
    // const pnr = 'PNR' + Date.now() + Math.floor(Math.random() * 1000);

    // Create a single booking record for all seats
    const bookingResult = await client.query(
      `INSERT INTO Booking (
        user_id, train_id, travel_date , booking_date , train_class,
        src_stn, dest_stn, pnr_number, total_fare
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING booking_id`,
      [
        user_id, train_id, travel_date , booking_date , train_class,
        src_stn_id, dest_stn_id, pnr_number, fare
      ]
    );

    const booking_id = bookingResult.rows[0].booking_id;

    // Insert a ticket for each passenger/seat
    if(seats && seats.length > 0){
      for (const seat of seats) {
        await client.query(
          `INSERT INTO Ticket (
            booking_id, seat_id , booking_status,
            passenger_name, passenger_gender, passenger_age , waitlist_number
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            booking_id, seat.seat_id, 'Confirmed',
            seat.passenger_name, seat.passenger_gender, seat.passenger_age , 0
          ]
        );
      }
    }

    if (waitlisted_passengers && waitlisted_passengers.length > 0) {
      for (const passenger of waitlisted_passengers) {
        await client.query(
          `INSERT INTO Ticket (
            booking_id, seat_id, booking_status,
            passenger_name, passenger_gender, passenger_age,
            waitlist_number
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            booking_id, 
            waitlist_seat_id, // Using dummy seat_id for waitlisted tickets
            'Waiting',
            passenger.passenger_name, 
            passenger.passenger_gender, 
            passenger.passenger_age,
            passenger.waitlist_number
          ]
        );
      }
    }
    // Get train name
    const tra = await client.query(`select train_name from train where train_id = $1`, [train_id]);
    const train_name = tra.rows[0].train_name;

    // Get seat details for confirmed tickets (if any)
    let dbseats = [];
    if (seats && seats.length > 0) {
      const seatIds = seats.map(seat => seat.seat_id);
      const dbseats_db = await client.query(
        `SELECT * FROM Seats WHERE seat_id = ANY($1::int[]) AND bhogi != 'WL'`,
        [seatIds]
      );
      dbseats = dbseats_db.rows;
    }

    // Get user email
    const use = await client.query(`Select * from users where user_id = $1`, [user_id]);
    const usermail = use.rows[0].email;

    // Send confirmation email with both confirmed and waitlisted passengers
    await sendBookingConfirmation(usermail, {
      pnr: pnr_number,
      trainName: train_name,
      travelDate: travel_date,
      passengers: seats || [],
      waitlistedPassengers: waitlisted_passengers || [],
      seats: dbseats,
      fare : fare
    });


    await client.query('COMMIT');
    res.status(200).json({
      message: 'Booking completed successfully!',
      booking_id,
      pnr_number: pnr_number,
      confirmed_tickets: seats ? seats.length : 0,
      waitlisted_tickets: waitlisted_passengers ? waitlisted_passengers.length : 0,
      total_tickets: (seats ? seats.length : 0) + (waitlisted_passengers ? waitlisted_passengers.length : 0)
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
      WHERE train_id = $1 AND class = $2 AND bhogi != 'WL'
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
      WHERE B.train_id = $1 AND B.train_class = $2 AND B.travel_date = $3 AND T.booking_status = 'Confirmed'
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
    

      // Get the current waitlist number
    const waitlistQuery = `
    SELECT COUNT(*) as waitlist_count
    FROM Ticket T
    JOIN Booking B ON T.booking_id = B.booking_id
    WHERE B.train_id = $1 
    AND B.train_class = $2 
    AND B.travel_date = $3
    AND T.booking_status = 'Waiting'
    `;

    const waitlistResult = await pool.query(waitlistQuery, [trainId, train_class, travel_date]);
    const nextWaitlistNumber = parseInt(waitlistResult.rows[0].waitlist_count) + 1;

    
    res.status(200).json({ seats: result , next_waitlist_number: nextWaitlistNumber  });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seat availability: ' + err.message });
  }
});


app.post('/train-status', async (req, res) => {
  const { trainNumber,date } = req.body;

  try {
    const travelDay = format(new Date(date), 'EEEE');
    const ran = await pool.query(`select * from train t where t.train_no=$1`,[trainNumber]);
    if(ran.rows.length===0){
      return res.status(400).json({error: "Invalid train no"});
    }
    const result = await pool.query(`
      SELECT
        s.station_name AS name,
        r.stop_number,
        r.arrival_time ,
        r.departure_time ,
        0 as arrival_delay_minutes ,
        0 as departure_delay_minutes,
        'Estimated' as status
      FROM route r
      JOIN stations s ON r.station_id = s.station_id
      JOIN train t ON t.train_id = r.train_id
      WHERE t.train_no = $1 AND $2 = ANY (t.operating_days)
      ORDER BY r.stop_number
    `, [trainNumber,travelDay]);
      if(result.rows.length===0){
          res.status(400).json({error: "Train doesn't run that day"});
      }
      else{
        const result1 = await pool.query(`
          SELECT
            s.station_name AS name,
            r.stop_number,
            r.arrival_time ,
            r.departure_time ,
            d.arrival_delay_minutes ,
            d.departure_delay_minutes,
            d.status
          FROM route r
          JOIN stations s ON r.station_id = s.station_id
          JOIN train t ON t.train_id = r.train_id
          Join delays d on r.route_id = d.route_id
          WHERE t.train_no = $1 and d.departure_date = $2
          ORDER BY r.stop_number
        `, [trainNumber,date]);
        if(result1.rows.length===0){
          res.status(200).json({ stations: result.rows });
         }
         else{
         res.status(200).json({ stations: result1.rows });}
      }
} catch (error) {
  console.error("Error fetching train status:", error);
  res.status(500).json({ error: "Internal server error" });
  }
});

// Backend: app.get("/my-tickets")
// Backend: app.get("/my-tickets")
app.get("/my-tickets", isAuthenticated, async (req, res) => {
  const user_id = req.session.userId;
  if (!user_id) return res.status(401).json({ error: "Not logged in" });

  try {
    const result = await pool.query(
      `SELECT 
         B.booking_id, B.pnr_number, B.travel_date, B.booking_date, 
         B.total_fare,
         T.train_id, T.train_name, T.train_no,
         Tk.ticket_id, Tk.passenger_name, Tk.passenger_gender, Tk.passenger_age, 
         Tk.booking_status, Tk.waitlist_number,
         S.seat_id, S.class, S.bhogi, S.seat_number,
         src_stn.station_name as source_station_name,
         src_stn.station_code as source_station_code,
         dest_stn.station_name as destination_station_name,
         dest_stn.station_code as destination_station_code
       FROM Booking B
       JOIN Train T ON B.train_id = T.train_id
       JOIN Ticket Tk ON B.booking_id = Tk.booking_id
       LEFT JOIN Seats S ON Tk.seat_id = S.seat_id
       JOIN Stations src_stn ON B.src_stn = src_stn.station_id
       JOIN Stations dest_stn ON B.dest_stn = dest_stn.station_id
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
          total_fare: row.total_fare,
          train_name: row.train_name,
          train_no: row.train_no,
          source_station: {
            name: row.source_station_name,
            code: row.source_station_code
          },
          destination_station: {
            name: row.destination_station_name,
            code: row.destination_station_code
          },
          passengers: []
        };
      }
      grouped[row.booking_id].passengers.push({
        ticket_id: row.ticket_id,
        name: row.passenger_name,
        gender: row.passenger_gender,
        age: row.passenger_age,
        booking_status: row.booking_status,
        waitlist_number: row.waitlist_number,
        class: row.class || "N/A",
        bhogi: row.bhogi || "N/A",
        seat_number: row.seat_number || "N/A"
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



///////////////////////////////ORDER FOOD //////////////////////////////////////////
app.post('/validate-pnr', async (req, res) => {
  const { pnrNumber } = req.body;
  const userId = req.session.userId;

  if (!pnrNumber || pnrNumber.length < 6) {
    return res.status(400).json({ error: 'Invalid PNR format' });
  }

  try {
    const query = `
      SELECT 
        b.booking_id, b.train_id, b.travel_date, t.booking_status, 
        b.src_stn, b.dest_stn, b.total_fare, 
        t.ticket_id, t.passenger_name, t.passenger_gender, t.passenger_age, t.seat_id
      FROM Booking b
      JOIN Ticket t ON b.booking_id = t.booking_id
      WHERE b.pnr_number = $1 AND b.user_id = $2
    `;
    const result = await pool.query(query, [pnrNumber, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PNR not found or no tickets available' });
    }

    res.status(200).json({ booking: result.rows[0], tickets: result.rows });
  } catch (err) {
    console.error('Error validating PNR:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch Food Items
app.get('/food-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM food_item');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching food items:', err);
    res.status(500).json({ error: 'Failed to fetch food items' });
  }
});

// Place an Order
app.post('/order-food', async (req, res) => {
  const { booking_id, items } = req.body;

  if (!booking_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  try {
    // Begin a transaction to ensure data consistency
    await pool.query('BEGIN');

    // Insert each item into the order details
    for (const item of items) {
      const { id, quantity } = item;
      const query = `
        INSERT INTO order_details (booking_id, food_item_id, quantity)
        VALUES ($1, $2, $3)
      `;
      await pool.query(query, [booking_id, id, quantity]);
    }

    // Commit the transaction
    await pool.query('COMMIT');

    res.json({ message: 'Order placed successfully' });
  } catch (err) {
    // Rollback in case of an error
    await pool.query('ROLLBACK');
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});


//////////////////////////Forgot Password//////////////////////////////////

const generateOTP = () => {
  // Generates a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtp = async (toEmail,otp) => {
  // Generate OTP

  const mailOptions = {
    from: "mybookingsystem1@gmail.com",
    to: toEmail,
    subject: "Your OTP for Confirmation",
    text: `Your OTP for confirmation is: ${otp}\n\nPlease use this OTP to confirm your action.\n\nThank you!`,
  };

  // Send the OTP email
  await transporter.sendMail(mailOptions);
};

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const otp = generateOTP();
    req.session.otp=otp;
    req.session.usermail=email;
    console.log(req.session.usermail);
    sendOtp(email,otp);
    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Failed sending OTP: ', err);
    res.status(500).json({ error: 'Failed sending OTP. Please try again.' });
  }
});
app.post('/verify-otp', async (req, res) => {
  console.log(req.body);
  const { otp } = req.body;
  try {
    const otp1 = req.session.otp;
    console.log(otp);
    console.log(otp1);
    if(otp == otp1){

    res.status(200).json({ message: 'OTP Verified' });
   }
   else{
    res.status(500).json({ error: 'OTP not verified' });
   }

  } catch (err) {
    res.status(500).json({ error: 'OTP not verified1' });
  }
});
app.post('/new-password', async (req, res) => {
  const { newPassword } = req.body;
  try {
    const email = req.session.usermail;
    if (!email) {
      return res.status(400).json({ error: 'No session found. Please request password reset again.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10); // Using bcrypt to hash the password
    const updateQuery = `
      UPDATE Users
      SET password = $1
      WHERE email = $2
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [hashedPassword, email]);
    if (result.rows.length > 0) {
      res.status(200).json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }

  } catch (err) {
    console.error('Error updating password: ', err);
    res.status(500).json({ error: 'Failed to update password. Please try again.' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

///////////////////////////PNR ENQIRY//////////////////////////////

app.post('/pnr-enquiry', async (req, res) => {
  const { pnrNumber } = req.body;

  if (!pnrNumber || pnrNumber.length < 6) {
    return res.status(400).json({ error: 'Invalid PNR format' });
  }

  try {
    const query = `
              SELECT 
                tr.train_name,
                tr.train_no,
                t.passenger_name,
                t.passenger_gender,
                t.passenger_age,
                s.bhogi,
                s.seat_number,
                t.booking_status,
                t.waitlist_number
              FROM Booking b
              JOIN Ticket t ON b.booking_id = t.booking_id
              JOIN Seats s ON t.seat_id = s.seat_id
              JOIN Train tr ON b.train_id = tr.train_id
              WHERE b.pnr_number = $1`;
    const result = await pool.query(query, [pnrNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PNR not found or no tickets available' });
    }

    res.json({ booking: result.rows[0], tickets: result.rows });
  } catch (err) {
    console.error('Error validating PNR:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = app;


////////////////////////CANCEL TICKETS///////////////////////////

// Function to send cancellation email
const sendCancellationEmail = async (toEmail, cancellationDetails) => {
  const { pnr, trainName, travelDate, cancelledTickets, refundAmount } = cancellationDetails;

  const mailOptions = {
    from: "mybookingsystem1@gmail.com",
    to: toEmail,
    subject: `Ticket Cancellation Confirmation - PNR ${pnr}`,
    text: `Your ticket(s) have been cancelled successfully!\n\n` +
          `Train: ${trainName}\n` +
          `Date: ${travelDate}\n` +
          `PNR: ${pnr}\n` +
          `Cancelled Tickets:\n${cancelledTickets.map(t => 
            `Passenger: ${t.passenger_name}`
          ).join('\n')}\n` +
          `Refund Amount: ₹${refundAmount}\n\n` +
          `Thank you for using our service!`
  };

  await transporter.sendMail(mailOptions);
};

// Function to send confirmation email for waitlist cleared
const sendWaitlistClearedEmail = async (toEmail, confirmationDetails) => {
  const { pnr, trainName, travelDate, passenger, seatDetails } = confirmationDetails;

  const mailOptions = {
    from: "mybookingsystem1@gmail.com",
    to: toEmail,
    subject: `Waitlist Cleared - Ticket Confirmed - PNR ${pnr}`,
    text: `Great news! Your waitlisted ticket has been confirmed!\n\n` +
          `Train: ${trainName}\n` +
          `Date: ${travelDate}\n` +
          `PNR: ${pnr}\n` +
          `Passenger: ${passenger.passenger_name}\n` +
          `Seat: ${seatDetails.bhogi}-${seatDetails.seat_number}\n\n` +
          `Have a great journey!`
  };

  await transporter.sendMail(mailOptions);
};

// Function to check and update waitlist
async function processWaitlist(client, train_id, train_class, travel_date) {
  try {
    // Get all waitlisted tickets
    const waitlistedTicketsQuery = `
      SELECT t.ticket_id, t.booking_id, t.passenger_name, t.passenger_gender, 
             t.passenger_age, t.waitlist_number, b.src_stn, b.dest_stn, u.email,
             b.pnr_number
      FROM Ticket t
      JOIN Booking b ON t.booking_id = b.booking_id
      JOIN Users u ON b.user_id = u.user_id
      WHERE b.train_id = $1 AND b.train_class = $2 
      AND b.travel_date = $3 AND t.booking_status = 'Waiting'
      ORDER BY t.waitlist_number
    `;

    const waitlistedTickets = await client.query(waitlistedTicketsQuery, 
      [train_id, train_class, travel_date]);

    const confirmedTicketIds = [];

    // Process each waitlisted ticket
    for (const ticket of waitlistedTickets.rows) {
      // Check for available seat
      const availableSeatsQuery = `
        SELECT s.seat_id, s.bhogi, s.seat_number
      FROM Seats s
      WHERE s.train_id = $1
        AND s.class = $2
        AND s.bhogi != 'WL'
        AND NOT EXISTS (
          SELECT 1
          FROM Ticket t2
          JOIN Booking b2 ON t2.booking_id = b2.booking_id
          JOIN Route r_src ON r_src.train_id = b2.train_id AND r_src.station_id = b2.src_stn
          JOIN Route r_dest ON r_dest.train_id = b2.train_id AND r_dest.station_id = b2.dest_stn
          WHERE t2.seat_id = s.seat_id
            AND b2.travel_date = $3
            AND t2.booking_status = 'Confirmed'
            AND EXISTS (
              SELECT 1
              FROM UNNEST($4::int[]) AS sid
              JOIN Route r_mid ON r_mid.train_id = s.train_id AND r_mid.station_id = sid
              WHERE r_mid.stop_number >= r_src.stop_number
                AND r_mid.stop_number < r_dest.stop_number
            )
        )
      LIMIT 1;
      `;

      const stationIds = await getStationIdsBetween(train_id, ticket.src_stn, ticket.dest_stn);
      const availableSeat = await client.query(availableSeatsQuery, 
        [train_id, train_class, travel_date, stationIds]);

      if (availableSeat.rows.length > 0) {
        // Update ticket to confirmed status
        await client.query(
          `UPDATE Ticket 
           SET booking_status = 'Confirmed', 
               seat_id = $1, 
               waitlist_number = 0
           WHERE ticket_id = $2`,
          [availableSeat.rows[0].seat_id, ticket.ticket_id]
        );

        confirmedTicketIds.push(ticket.ticket_id);

        // Get train details for email
        const trainDetails = await client.query(
          `SELECT train_name FROM Train WHERE train_id = $1`,
          [train_id]
        );

        // Send confirmation email
        await sendWaitlistClearedEmail(ticket.email, {
          pnr: ticket.pnr_number, // Now we have the PNR
          trainName: trainDetails.rows[0].train_name,
          travelDate: travel_date,
          passenger: ticket,
          seatDetails: availableSeat.rows[0]
        });
      }
    }

    // Update remaining waitlist numbers to be sequential
      const updateWaitlistQuery = `
        WITH ranked AS (
          SELECT 
            ticket_id,
            ROW_NUMBER() OVER (ORDER BY waitlist_number) as new_waitlist_number
          FROM Ticket t
          JOIN Booking b ON t.booking_id = b.booking_id
          WHERE b.train_id = $1 
          AND b.train_class = $2 
          AND b.travel_date = $3 
          AND t.booking_status = 'Waiting'
        )
        UPDATE Ticket 
        SET waitlist_number = ranked.new_waitlist_number
        FROM ranked
        WHERE Ticket.ticket_id = ranked.ticket_id
      `;

      await client.query(updateWaitlistQuery, [train_id, train_class, travel_date]);

  } catch (error) {
    console.error('Error processing waitlist:', error);
    throw error;
  }
}

// Cancel ticket endpoint
app.post('/cancel-tickets', async (req, res) => {
  const client = await pool.connect();
  try {
    const { ticketIds } = req.body;
    
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ error: 'Invalid ticket IDs' });
    }

    await client.query('BEGIN');

    // Get booking details for these tickets
    const ticketDetailsQuery = `
      SELECT t.ticket_id, t.booking_id, t.passenger_name, b.train_id, 
             b.train_class, b.travel_date, b.user_id, b.pnr_number,
             tr.train_name,b.src_stn,b.dest_stn,t.seat_id, t.passenger_gender, t.passenger_age
      FROM Ticket t
      JOIN Booking b ON t.booking_id = b.booking_id
      JOIN Train tr ON b.train_id = tr.train_id
      WHERE t.ticket_id = ANY($1)
    `;

    const ticketDetails = await client.query(ticketDetailsQuery, [ticketIds]);

    if (ticketDetails.rows.length === 0) {
      throw new Error('No valid tickets found');
    }

    // Update tickets to cancelled status
    await client.query(
      `UPDATE Ticket 
       SET booking_status = 'Cancelled'
       WHERE ticket_id = ANY($1)`,
      [ticketIds]
    );

    // Get user email
    const userEmail = await client.query(
      `SELECT email FROM Users WHERE user_id = $1`,
      [ticketDetails.rows[0].user_id]
    );

    const src_stn_id = ticketDetails.rows[0].src_stn;
    const dest_stn_id = ticketDetails.rows[0].dest_stn;
    const train_id = ticketDetails.rows[0].train_id;
    const travel_date = ticketDetails.rows[0].travel_date;
    const train_class = ticketDetails.rows[0].train_class;
    // Calculate refund amount (simplified version)
    let refundAmount = 0; // Replace with actual refund calculation
    const dis1 = await pool.query(`select distance_from_start_km from Route where station_id = $1 and train_id = $2`,[src_stn_id,train_id]);
    const dis2 = await pool.query(`select distance_from_start_km from Route where station_id = $1 and train_id = $2`,[dest_stn_id,train_id]);
    let dis_1 = dis1.rows[0].distance_from_start_km;
    let dis_2 = dis2.rows[0].distance_from_start_km;
    // Validate input
    if (!train_id || !travel_date || !train_class || !src_stn_id || !dest_stn_id || !(ticketDetails )) {
      return res.status(400).json({ error: 'Missing required cancelling fields' });
    }

    // Validate each seat entry
    if(ticketDetails.rows ){
      for (const seat of ticketDetails.rows ) {
        if (!seat.seat_id || !seat.passenger_name || !seat.passenger_gender || !seat.passenger_age) {
          return res.status(400).json({ error: 'Missing passenger or seat details' });
        }
        const class1 = await pool.query(`select class from seats where train_id=$1 and seat_id=$2`,[train_id,seat.seat_id]);
        let class2 = class1.rows[0].class;
        if(class2 == '3AC') {refundAmount += 3*(dis_2 - dis_1);}
        if(class2 == '2AC') refundAmount += 4*(dis_2 - dis_1);
        if(class2 == '1AC') refundAmount += 5*(dis_2 - dis_1);
        if(class2 == 'SLP') refundAmount += 2*(dis_2 - dis_1);
      }
    }


   
    // Send cancellation email
    await sendCancellationEmail(userEmail.rows[0].email, {
      pnr: ticketDetails.rows[0].pnr_number,
      trainName: ticketDetails.rows[0].train_name,
      travelDate: ticketDetails.rows[0].travel_date,
      cancelledTickets: ticketDetails.rows,
      refundAmount
    });

    // Process waitlist
    await processWaitlist(
      client,
      ticketDetails.rows[0].train_id,
      ticketDetails.rows[0].train_class,
      ticketDetails.rows[0].travel_date
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Tickets cancelled successfully',
      cancelledTickets: ticketIds.length,
      refundAmount
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling tickets:', error);
    res.status(500).json({ error: 'Failed to cancel tickets' });
  } finally {
    client.release();
  }
});

app.get('/future-bookings', async (req, res) => {
  try {
    // Get user_id from session
    const user_id = req.session.userId;
    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const query = `
      SELECT 
        b.booking_id,
        t.train_name,
        b.travel_date,
        b.pnr_number,
        s1.station_name as src_station,
        s2.station_name as dest_station,
        b.train_class,
        b.total_fare
      FROM Booking b
      JOIN Train t ON b.train_id = t.train_id
      JOIN Stations s1 ON b.src_stn = s1.station_id
      JOIN Stations s2 ON b.dest_stn = s2.station_id
      WHERE b.user_id = $1 
      AND b.travel_date > CURRENT_DATE
      ORDER BY b.travel_date ASC
    `;

    const result = await pool.query(query, [user_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching future bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.get('/booking-tickets/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const user_id = req.session.userId;

    if (!user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First verify this booking belongs to the user
    const verifyQuery = `
      SELECT 1 FROM Booking 
      WHERE booking_id = $1 AND user_id = $2
    `;
    
    const verifyResult = await pool.query(verifyQuery, [bookingId, user_id]);
    
    if (verifyResult.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized access to booking' });
    }

    // Get all tickets for this booking
    const query = `
      SELECT 
        t.ticket_id,
        t.passenger_name,
        t.passenger_age,
        t.passenger_gender,
        t.booking_status,
        t.waitlist_number,
        CASE 
          WHEN s.bhogi = 'WL' THEN NULL
          ELSE s.bhogi
        END as bhogi,
        CASE 
          WHEN s.bhogi = 'WL' THEN NULL
          ELSE s.seat_number
        END as seat_number,
        s.class
      FROM Ticket t
      JOIN Seats s ON t.seat_id = s.seat_id
      WHERE t.booking_id = $1
      ORDER BY 
        CASE 
          WHEN t.booking_status = 'Confirmed' THEN 1
          WHEN t.booking_status = 'Waiting' THEN 2
          ELSE 3
        END,
        t.waitlist_number
    `;

    const result = await pool.query(query, [bookingId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching booking tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});