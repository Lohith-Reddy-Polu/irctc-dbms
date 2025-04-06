CREATE TYPE day_enum AS ENUM ('Sunday', 'Monday');
CREATE TYPE class_enum AS ENUM ('3A', '2A', 'SLP');
CREATE TYPE status_enum AS ENUM ('Available', 'Booked');
CREATE TYPE gender_enum AS ENUM ('M', 'F', 'LGBTQ');
CREATE TYPE booking_status_enum AS ENUM ('Confirmed', 'Waiting', 'Cancelled');

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_no VARCHAR(15) UNIQUE NOT NULL
);

CREATE TABLE Admin (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

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

CREATE TABLE Seats (
    seat_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES Train(train_id) ON DELETE CASCADE,
    class class_enum NOT NULL,
    bhogi VARCHAR(3) NOT NULL CHECK (bhogi IN ('B1', 'B2', 'B3')),
    seat_number INT NOT NULL,
    status status_enum NOT NULL DEFAULT 'Available',
    UNIQUE(train_id, class, bhogi, seat_number)
);

CREATE TABLE Booking (
    booking_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    train_id INT NOT NULL REFERENCES Train(train_id) ON DELETE CASCADE,
    pnr_number VARCHAR(20) UNIQUE NOT NULL,
    travel_date DATE NOT NULL,
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    booking_status booking_status_enum NOT NULL,
    total_fare DECIMAL(10,2) NOT NULL CHECK (total_fare >= 0)
);

CREATE TABLE Passenger (
    passenger_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES Booking(booking_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gender gender_enum NOT NULL,
    age INT NOT NULL CHECK (age BETWEEN 1 AND 100)
);

CREATE TABLE Ticket (
    ticket_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL REFERENCES Train(train_id) ON DELETE CASCADE,
    pnr_number VARCHAR(20) NOT NULL REFERENCES Booking(pnr_number) ON DELETE CASCADE,
    booking_id INT NOT NULL REFERENCES Booking(booking_id) ON DELETE CASCADE,
    passenger_id INT NOT NULL REFERENCES Passenger(passenger_id) ON DELETE CASCADE,
    seat_id INT NOT NULL REFERENCES Seats(seat_id) ON DELETE CASCADE,
    UNIQUE(pnr_number, passenger_id, seat_id)
);