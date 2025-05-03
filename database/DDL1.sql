-- ENUM TYPES (unchanged)
CREATE TYPE day_enum AS ENUM ('Sunday', 'Monday', 'Tuesday' , 'Wednesday' , 'Thursday' , 'Friday' , 'Saturday');
CREATE TYPE class_enum AS ENUM ('3AC', '2AC' , 'SLP' , '1AC');
CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE booking_status_enum AS ENUM ('Confirmed', 'Waiting', 'Cancelled');
CREATE TYPE tracking_status_enum AS ENUM ('Estimated', 'Arrived', 'Departed', 'Skipped');

-- DROP ALL TABLES (in reverse dependency order)
DROP TABLE IF EXISTS Ticket CASCADE;
DROP TABLE IF EXISTS Booking CASCADE;
DROP TABLE IF EXISTS Seats CASCADE;
DROP TABLE IF EXISTS Route CASCADE;
DROP TABLE IF EXISTS Train CASCADE;
DROP TABLE IF EXISTS Stations CASCADE;
DROP TABLE IF EXISTS Admin CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- USERS
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_no VARCHAR(15) UNIQUE NOT NULL
);

-- ADMIN
CREATE TABLE Admin (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- STATIONS
CREATE TABLE Stations (
    station_id SERIAL PRIMARY KEY,
    station_code VARCHAR(10) UNIQUE NOT NULL,
    station_name VARCHAR(100) NOT NULL
);

-- TRAINS
CREATE TABLE Train (
    train_id SERIAL PRIMARY KEY,
    train_no VARCHAR(10) UNIQUE NOT NULL,
    train_name VARCHAR(100) NOT NULL,
    src_stn VARCHAR(50) NOT NULL,
    dest_stn VARCHAR(50) NOT NULL,
    arrival_time TIME NOT NULL,
    departure_time TIME NOT NULL,
    operating_days day_enum[] NOT NULL
);

-- ROUTE: list of stations per train with order and timing
CREATE TABLE Route (
    route_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES Train(train_id) ON DELETE CASCADE,
    station_id INT NOT NULL REFERENCES Stations(station_id) ON DELETE CASCADE,
    stop_number INT NOT NULL CHECK (stop_number >= 1),
    arrival_time TIME,
    departure_time TIME,
    distance_from_start_km INT NOT NULL,
    arrival_delay_minutes INT DEFAULT 0,
    departure_delay_minutes INT DEFAULT 0,
    status tracking_status_enum DEFAULT 'Estimated',
    UNIQUE(train_id, stop_number),
    UNIQUE(train_id, station_id)
);

-- SEATS: simplified (no availability)
CREATE TABLE Seats (
    seat_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES Train(train_id) ON DELETE CASCADE,
    class class_enum NOT NULL,
    bhogi VARCHAR(3) NOT NULL CHECK (bhogi IN ('B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8' )),
    seat_number INT NOT NULL,
    UNIQUE(train_id, class, bhogi, seat_number)
);

-- BOOKING
CREATE TABLE Booking (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    train_id INTEGER REFERENCES train(train_id) ON DELETE CASCADE,
    travel_date DATE NOT NULL,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    train_class TEXT NOT NULL,
    src_stn INT NOT NULL REFERENCES Stations(station_id)ON DELETE CASCADE,
    dest_stn INT NOT NULL REFERENCES Stations(station_id)ON DELETE CASCADE,
    booking_status booking_status_enum NOT NULL,
    pnr_number TEXT NOT NULL,
    CHECK (src_stn <> dest_stn),
    total_fare DECIMAL(10,2) NOT NULL CHECK (total_fare >= 0)
);


-- TICKET: now includes travel segment
CREATE TABLE Ticket (
    ticket_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES Booking(booking_id) ON DELETE CASCADE,
    seat_id INT NOT NULL REFERENCES Seats(seat_id) ON DELETE CASCADE,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_gender gender_enum NOT NULL,
    passenger_age INT NOT NULL CHECK (passenger_age BETWEEN 1 AND 120)
);
