-- Train Table
CREATE TABLE Train (
    train_no SERIAL PRIMARY KEY,
    train_name VARCHAR(50) NOT NULL,
    depart_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    source_stn VARCHAR(50) NOT NULL,
    dest_stn VARCHAR(50) NOT NULL,
    no_of_res_bogies INT NOT NULL,
    bogie_capacity INT NOT NULL
);

-- Passenger Table
CREATE TABLE Passenger (
    passenger_id SERIAL PRIMARY KEY,
    passenger_name VARCHAR(50) NOT NULL,
    address VARCHAR(100),
    age INT CHECK (age > 0),
    gender CHAR(1) CHECK (gender IN ('M', 'F', 'O')) -- M: Male, F: Female, O: Other
);

-- Ticket Table
CREATE TABLE Ticket (
    ticket_no SERIAL PRIMARY KEY,
    train_no INT REFERENCES Train(train_no) ON DELETE CASCADE,
    passenger_id INT REFERENCES Passenger(passenger_id) ON DELETE CASCADE,
    bogie_no INT NOT NULL,
    no_of_berths INT CHECK (no_of_berths > 0),
    tdate DATE NOT NULL,
    ticket_amt DECIMAL(10,2) CHECK (ticket_amt >= 0),
    status CHAR(1) CHECK (status IN ('W', 'C')) -- W: Waitlisted, C: Confirmed
);

-- Coach Table
CREATE TABLE Coach (
    coach_id SERIAL PRIMARY KEY,
    train_no INT REFERENCES Train(train_no) ON DELETE CASCADE,
    coach_type VARCHAR(50) NOT NULL, -- e.g., Sleeper, AC, General
    seating_capacity INT CHECK (seating_capacity > 0),
    maintenance_status VARCHAR(50), -- e.g., Good, Needs Repair
    last_maintenance_date DATE
);

-- CoachType Table
CREATE TABLE CoachType (
    coach_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL, -- e.g., Sleeper, AC
    amenities TEXT, -- e.g., "WiFi, Charging Ports"
    pricing_factor DECIMAL(4,2) CHECK (pricing_factor > 0) -- Multiplier for fare calculation
);

-- Route Table
CREATE TABLE Route (
    route_id SERIAL PRIMARY KEY,
    train_no INT REFERENCES Train(train_no) ON DELETE CASCADE,
    source_station VARCHAR(50) NOT NULL,
    destination_station VARCHAR(50) NOT NULL,
    total_distance_km INT CHECK (total_distance_km > 0),
    estimated_travel_time INTERVAL
);

-- RouteStop Table
CREATE TABLE RouteStop (
    stop_id SERIAL PRIMARY KEY,
    route_id INT REFERENCES Route(route_id) ON DELETE CASCADE,
    station_name VARCHAR(50) NOT NULL,
    arrival_time TIME NOT NULL,
    departure_time TIME NOT NULL,
    distance_from_start INT CHECK (distance_from_start >= 0)
);

-- FareRule Table
CREATE TABLE FareRule (
    rule_id SERIAL PRIMARY KEY,
    train_no INT REFERENCES Train(train_no) ON DELETE CASCADE,
    coach_type_id INT REFERENCES CoachType(coach_type_id),
    base_fare DECIMAL(10,2) CHECK (base_fare >= 0),
    dynamic_pricing_factor DECIMAL(4,2),
    discount_percentage DECIMAL(4,2),
    effective_date DATE NOT NULL,
    expiry_date DATE
);

-- SeatInventory Table
CREATE TABLE SeatInventory (
    seat_id SERIAL PRIMARY KEY,
    train_no INT REFERENCES Train(train_no) ON DELETE CASCADE,
    coach_id INT REFERENCES Coach(coach_id),
    seat_number VARCHAR(10),
    status VARCHAR(10) CHECK (status IN ('Available', 'Booked', 'Reserved')),
    booking_id INT REFERENCES Ticket(ticket_no)
);

-- UserPreferences Table
CREATE TABLE UserPreferences (
    user_id INT REFERENCES Passenger(passenger_id),
    preferred_train_types TEXT, -- e.g., "AC,Sleeper"
    meal_preference VARCHAR(50), -- e.g., "Veg, Non-Veg"
    preferred_seat_position VARCHAR(50), -- e.g., "Window, Aisle"
	PRIMARY KEY(user_id)
);

-- MasterPassengerList Table
CREATE TABLE MasterPassengerList (
	user_id INT REFERENCES Passenger(passenger_id),
	passenger_name VARCHAR(50),
	age INT CHECK(age > 0),
	gender CHAR(1) CHECK(gender IN ('M', 'F', 'O')),
	PRIMARY KEY(user_id, passenger_name)
);

-- Payment Table
CREATE TABLE Payment (
	payment_id SERIAL PRIMARY KEY,
	ticket_no INT REFERENCES Ticket(ticket_no),
	user_id INT REFERENCES Passenger(passenger_id),
	payment_method VARCHAR(20), -- e.g., Credit Card, UPI
	amount_paid DECIMAL(10,2) CHECK(amount_paid >= 0),
	payment_status VARCHAR(20) CHECK(payment_status IN ('Success', 'Failed', 'Refunded')),
	payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refund Table
CREATE TABLE Refund (
	refund_id SERIAL PRIMARY KEY,
	ticket_no INT REFERENCES Ticket(ticket_no),
	refund_amount DECIMAL(10,2) CHECK(refund_amount >= 0),
	refund_status VARCHAR(20) CHECK(refund_status IN ('Pending', 'Processed')),
	refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PNRPrediction Table
CREATE TABLE PNRPrediction (
	pnr_number BIGINT PRIMARY KEY,
	waitlist_position INT CHECK(waitlist_position > 0),
	confirmation_probability DECIMAL(5,2), -- Percentage likelihood of confirmation
	last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TrainTracking Table
CREATE TABLE TrainTracking (
	tracking_id SERIAL PRIMARY KEY,
	train_no INT REFERENCES Train(train_no),
	current_location VARCHAR(50),
	estimated_arrival_time TIME,
	delay_minutes INT DEFAULT 0 CHECK(delay_minutes >= 0)
);

-- UserAlerts Table
CREATE TABLE UserAlerts (
	alert_id SERIAL PRIMARY KEY,
	user_id INT REFERENCES Passenger(passenger_id),
	train_no INT REFERENCES Train(train_no),
	alert_message TEXT NOT NULL,
	alert_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VikalpScheme Table
CREATE TABLE VikalpScheme (
	vikalp_id SERIAL PRIMARY KEY,
	original_ticket_no INT REFERENCES Ticket(ticket_no),
	alternate_train_no INT REFERENCES Train(train_no),
	alternate_coach_type VARCHAR(50)
);

-- BookingAnalytics Table
CREATE TABLE BookingAnalytics (
	analytics_id SERIAL PRIMARY KEY,
	train_no INT REFERENCES Train(train_no),
	booking_date DATE NOT NULL,
	total_tickets_booked INT DEFAULT 0 CHECK(total_tickets_booked >= 0),
	revenue_generated DECIMAL(10,2) DEFAULT 0.00 CHECK(revenue_generated >= 0)
);
