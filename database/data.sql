INSERT INTO Train (train_no, train_name, src_stn, dest_stn, arrival_time, departure_time, operating_days) VALUES
('12001', 'Shatabdi Express', 'New Delhi', 'Bhopal', '14:00', '06:00', ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']::day_enum[]),
('12345', 'Rajdhani Express', 'Howrah', 'New Delhi', '10:00', '16:50', ARRAY['Monday','Wednesday','Friday']::day_enum[]),
('12627', 'Karnataka Express', 'Bangalore', 'New Delhi', '20:00', '07:20', ARRAY['Tuesday','Thursday','Saturday']::day_enum[]),
('12951', 'Mumbai Rajdhani', 'Mumbai', 'New Delhi', '08:35', '16:10', ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']::day_enum[]),
('12723', 'Telangana Express', 'Hyderabad', 'New Delhi', '17:30', '06:25', ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']::day_enum[]),
('12296', 'Sanghamitra Express', 'Bangalore', 'Patna', '07:30', '09:00', ARRAY['Sunday','Monday','Wednesday','Friday']::day_enum[]),
('12430', 'New Delhi Express', 'Lucknow', 'New Delhi', '11:00', '05:30', ARRAY['Monday','Tuesday','Thursday','Saturday']::day_enum[]),
('12801', 'Puri Express', 'Puri', 'New Delhi', '06:45', '20:30', ARRAY['Wednesday','Friday','Sunday']::day_enum[]);
