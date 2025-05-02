INSERT INTO Stations (station_code, station_name) VALUES
('NDLS', 'New Delhi'),
('CNB', 'Kanpur Central'),
('ALD', 'Prayagraj Junction'),
('MGS', 'Mughalsarai Junction'),
('PNBE', 'Patna Junction'),
('HWH', 'Howrah Junction'),
('LKO', 'Lucknow NR'),
('BPL', 'Bhopal Junction'),
('NGP', 'Nagpur Junction'),
('CSMT', 'Mumbai CSMT');

INSERT INTO Train (train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, operating_days) VALUES
('12301', 'Rajdhani Express', 'NDLS', 'HWH', '17:00', '17:30', ARRAY['Monday', 'Wednesday', 'Friday']::day_enum[]),
('11061', 'LTT Jayanthi Exp', 'CSMT', 'HWH', '10:30', '11:00', ARRAY['Tuesday', 'Saturday']::day_enum[]),
('12303', 'Poorva Express', 'NDLS', 'HWH', '06:00', '06:30', ARRAY['Sunday', 'Thursday']::day_enum[]);

-- Rajdhani Express Route (Train ID 1)
INSERT INTO Route (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_start_km) VALUES
(1, 1, 1, NULL, '17:30', 0),      -- NDLS
(1, 2, 2, '21:00', '21:10', 440), -- CNB
(1, 3, 3, '23:00', '23:05', 635), -- ALD
(1, 4, 4, '01:30', '01:35', 890), -- MGS
(1, 5, 5, '03:30', '03:40', 1000),-- PNBE
(1, 6, 6, '07:00', NULL, 1450);   -- HWH

-- LTT Jayanthi Exp Route (Train ID 2)
INSERT INTO Route (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_start_km) VALUES
(2, 10, 1, NULL, '11:00', 0),     -- CSMT
(2, 9, 2, '16:00', '16:10', 850), -- NGP
(2, 8, 3, '22:30', '22:40', 1150),-- BPL
(2, 7, 4, '03:00', '03:10', 1450),-- LKO
(2, 5, 5, '08:00', '08:10', 1850),-- PNBE
(2, 6, 6, '12:00', NULL, 2100);   -- HWH

-- Poorva Express Route (Train ID 3)
INSERT INTO Route (train_id, station_id, stop_number, arrival_time, departure_time, distance_from_start_km) VALUES
(3, 1, 1, NULL, '06:30', 0),      -- NDLS
(3, 2, 2, '10:00', '10:10', 440), -- CNB
(3, 3, 3, '12:00', '12:10', 635), -- ALD
(3, 4, 4, '14:30', '14:35', 890), -- MGS
(3, 5, 5, '16:30', '16:40', 1000),-- PNBE
(3, 6, 6, '20:00', NULL, 1450);   -- HWH


-- 1AC: B3
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(1, '1AC', 'B3', 1), (1, '1AC', 'B3', 2), (1, '1AC', 'B3', 3), (1, '1AC', 'B3', 4);

-- 2AC: B2
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(1, '2AC', 'B2', 1), (1, '2AC', 'B2', 2), (1, '2AC', 'B2', 3), (1, '2AC', 'B2', 4), (1, '2AC', 'B2', 5), (1, '2AC', 'B2', 6);

-- 3AC: B1
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(1, '3AC', 'B1', 1), (1, '3AC', 'B1', 2), (1, '3AC', 'B1', 3), (1, '3AC', 'B1', 4), (1, '3AC', 'B1', 5), (1, '3AC', 'B1', 6), (1, '3AC', 'B1', 7), (1, '3AC', 'B1', 8);

-- 1AC: B3
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(2, '1AC', 'B3', 1), (2, '1AC', 'B3', 2), (2, '1AC', 'B3', 3), (2, '1AC', 'B3', 4);

-- 2AC: B2
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(2, '2AC', 'B2', 1), (2, '2AC', 'B2', 2), (2, '2AC', 'B2', 3), (2, '2AC', 'B2', 4), (2, '2AC', 'B2', 5);

-- 3AC: B1
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(2, '3AC', 'B1', 1), (2, '3AC', 'B1', 2), (2, '3AC', 'B1', 3), (2, '3AC', 'B1', 4), (2, '3AC', 'B1', 5), (2, '3AC', 'B1', 6);

-- SLP: B4
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(2, 'SLP', 'B4', 1), (2, 'SLP', 'B4', 2), (2, 'SLP', 'B4', 3), (2, 'SLP', 'B4', 4), (2, 'SLP', 'B4', 5), (2, 'SLP', 'B4', 6), (2, 'SLP', 'B4', 7), (2, 'SLP', 'B4', 8), (2, 'SLP', 'B4', 9), (2, 'SLP', 'B4', 10);

-- 1AC: B3
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(3, '1AC', 'B3', 1), (3, '1AC', 'B3', 2), (3, '1AC', 'B3', 3), (3, '1AC', 'B3', 4), (3, '1AC', 'B3', 5);

-- 2AC: B2
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(3, '2AC', 'B2', 1), (3, '2AC', 'B2', 2), (3, '2AC', 'B2', 3), (3, '2AC', 'B2', 4), (3, '2AC', 'B2', 5), (3, '2AC', 'B2', 6);

-- 3AC: B1
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(3, '3AC', 'B1', 1), (3, '3AC', 'B1', 2), (3, '3AC', 'B1', 3), (3, '3AC', 'B1', 4), (3, '3AC', 'B1', 5), (3, '3AC', 'B1', 6);

-- SLP: B4
INSERT INTO Seats (train_id, class, bhogi, seat_number) VALUES
(3, 'SLP', 'B4', 1), (3, 'SLP', 'B4', 2), (3, 'SLP', 'B4', 3), (3, 'SLP', 'B4', 4), (3, 'SLP', 'B4', 5), (3, 'SLP', 'B4', 6), (3, 'SLP', 'B4', 7), (3, 'SLP', 'B4', 8), (3, 'SLP', 'B4', 9), (3, 'SLP', 'B4', 10);
