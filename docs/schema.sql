-- Database schema (simplified)
CREATE TABLE api_user (
  id serial PRIMARY KEY,
  username varchar(150) UNIQUE NOT NULL,
  email varchar(254),
  password varchar(128),
  role varchar(32)
);

-- Other tables: students, internships, rooms, maintenance, payments
