// Route handler for adding a train with route information
router.post('/add-train', isAdminLoggedIn, async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { 
        train_no, 
        train_name, 
        src_stn, 
        dest_stn, 
        arrival_time, 
        departure_time, 
        operating_days,
        seatCounts,
        intermediateStations 
      } = req.body;
      
      // Parse operating days from string to array
      const daysArray = operating_days
        .replace(/[{}]/g, '')
        .split(',')
        .map(day => day.trim());
      
      // Validate operating days
      for (const day of daysArray) {
        if (!['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].includes(day)) {
          throw new Error(`Invalid day: ${day}`);
        }
      }
      
      // Check if source and destination stations exist
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
      
      // Insert train
      const trainResult = await client.query(
        `INSERT INTO Train 
         (train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, operating_days) 
         VALUES ($1, $2, $3, $4, $5, $6, $7::day_enum[]) 
         RETURNING train_id`,
        [train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, `{${daysArray.join(',')}}`]
      );
      
      const trainId = trainResult.rows[0].train_id;
      
      // Create seats based on the seat counts
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
      
      // Create route entries
      // First, add source station as stop #1
      const srcStationId = srcStationQuery.rows[0].station_id;
      await client.query(
        `INSERT INTO Route 
         (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_start_km) 
         VALUES ($1, $2, $3, NULL, $4, $5)`,
        [trainId, srcStationId, 1, departure_time, 0]  // Source has no arrival time
      );
      
      // Next, add all intermediate stations
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
      
      // Finally, add destination station as the last stop
      const destStationId = destStationQuery.rows[0].station_id;
      const finalStopNumber = intermediateStations.length > 0 
        ? intermediateStations.length + 2 
        : 2;  // If no intermediate stations, destination is stop #2
      
      const lastStationDistanceQuery = intermediateStations.length > 0 
        ? await client.query(
            'SELECT MAX(distance_from_start_km) as max_distance FROM Route WHERE train_id = $1',
            [trainId]
          )
        : { rows: [{ max_distance: 0 }] };
      
      // Ensure destination has a greater distance than any intermediate station
      const minDestDistance = Math.max(
        lastStationDistanceQuery.rows[0].max_distance + 1,
        intermediateStations.length > 0 
          ? intermediateStations[intermediateStations.length - 1].distance_from_start_km + 1 
          : 1
      );
      
      await client.query(
        `INSERT INTO Route 
         (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_start_km) 
         VALUES ($1, $2, $3, $4, NULL, $5)`,
        [trainId, destStationId, finalStopNumber, arrival_time, minDestDistance]  // Destination has no departure time
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Train added successfully', 
        train_id: trainId 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding train:', error);
      res.status(500).json({ message: error.message || 'Failed to add train' });
    } finally {
      client.release();
    }
  });
  
  // Helper endpoint to get all stations
  router.get('/stations', isAdminLoggedIn, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT station_id, station_code, station_name FROM Stations ORDER BY station_name'
      );
      
      res.status(200).json({ stations: result.rows });
    } catch (error) {
      console.error('Error fetching stations:', error);
      res.status(500).json({ message: 'Failed to fetch stations' });
    }
  });
  
  // Authentication middleware for admin
  function isAdminLoggedIn(req, res, next) {
    if (req.session && req.session.admin) {
      return next();
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }