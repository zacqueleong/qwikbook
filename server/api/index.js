// API Url
// https://e78eab32-017b-4a27-bc3d-adef354ab0ce-00-343hps8rnfkvp.pike.replit.dev/

const express = require("express");
const app = express();
require("dotenv").config();
const { PORT, DATABASE_URL, JWT_ACCESS_SECRET_KEY, JWT_REFRESH_SECRET_KEY } =
  process.env;
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const { checkBookingTime } = require("../helpers/reminder");
const { generateAccessToken, generateRefreshToken } = require('../helpers/generateToken');

let refreshTokens = [];
app.use(express.json());
app.use(cors());

// Cron Job ( Run Hourly )
cron.schedule("0 0 * * * *", checkBookingTime);

// Verify Token Middleware
const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Retrieve the token from second element split by space.
    jwt.verify(token, JWT_ACCESS_SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json("Token is not valid!");
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).json("You are not authenticated!");
  }
};

// Postgres client configuration
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    require: true,
  },
});
async function getPostgresVersion() {
  const client = await pool.connect();
  try {
    const response = await client.query("SELECT version()");
    console.log(response.rows[0]);
  } finally {
    client.release();
  }
}
getPostgresVersion();

// Get '/' endpoint (default/homepage)
app.get("/", (req, res) => {
  res.send("Welcome to Qwikbook API.");
}); 

// GET method - to retrieve all Users records
app.get("/users", verify, async (req, res) => {
  const client = await pool.connect();
  try {
    // Define query
    const query = "SELECT * FROM users";

    // Execute query
    const result = await client.query(query);

    // Output result
    res.json(result.rows);
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({ Error: error.message });
  } finally {
    // Release the client connection
    client.release();
  }
});

// GET method - to retrieve all Booking record of User Id
app.get("/users/:id/bookings", verify, async (req, res) => {
  const client = await pool.connect();
  try {
    // Define params
    const params = [req.params.id];

    // Define query
    const query = "SELECT * FROM booking WHERE uid = $1";

    // Execute query
    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ Error: "No record found with that User Id." });
    }

    // Output result
    res.json(result.rows);
  } catch (error) {
    console.log(error.stack);
    console.log(error.message)
    res.status(500).json({ Error: error.message });
  } finally {
    // Release the client connection
    client.release();
  }
});

// GET method - to retrieve all Booking by Date + Time or Date only.
app.get("/bookings", verify, async (req, res) => {
  const client = await pool.connect();
  
  try {
    let query;
    let result;

    // Define query params
    const bookingDate = req.query.bookingDate;
    const bookingTime = req.query.bookingTime;

    // If booking date & booking time included as query parameter
    if (bookingDate && bookingTime) {
      const params = [bookingDate, bookingTime];
      query =
        "SELECT booking.id, booking.description, booking_email, booking_phone, booking.booking_date, booking.booking_time, booking.booking_timestamp, booking.is_emailed, booking.uid, users.usernamebooking_email, booking_phone,  FROM booking INNER JOIN users ON booking.uid = users.id WHERE booking_date = $1 AND booking_time = $2";
      result = await client.query(query, params);
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({
            Error: `No booking found with date: '${bookingDate}' and time: '${bookingTime}'`,
          });
      }
    } else if (bookingDate) {
      // If booking date only included as query parameter
      query =
        "SELECT booking.id, booking.description, booking_email, booking_phone, booking.booking_date, booking.booking_time, booking.booking_timestamp, booking.is_emailed, booking.uid, users.usernamebooking_email, booking_phone,  FROM booking INNER JOIN users ON booking.uid = users.id WHERE booking_date = $1";
      result = await client.query(query, [bookingDate]);
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ Error: `No booking found with date: '${bookingDate}'` });
      }
    } else {
      // When no query parameter provided
      query = "SELECT * FROM booking";
      result = await client.query(query);
    }
    res.json(result.rows);
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({ Error: error.message });
  } finally {
    // Release the client connection
    client.release();
  }
});

// GET method - to retrieve Booking record by specific Booking Id
app.get("/bookings/:id", verify, async (req, res) => {
  const client = await pool.connect();
  try {
    // Define params
    const params = [req.params.id];

    // Define query
    const query = "SELECT * FROM booking WHERE id = $1";

    // Execute query
    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ Error: "No record found with that Id." });
    }

    // Output result
    res.json(result.rows);
  } catch (error) {
    console.log(error.stack);
    res.status(500).json({ Error: error.message });
  } finally {
    // Release the client connection
    client.release();
  }
});

// Create booking endpoint
app.post("/bookings", verify, async (req, res) => {
  const client = await pool.connect();

  try {
    // Form Request Data Object
    const data = {
      booking_description: req.body.booking_description,
      booking_email: req.body.booking_email,
      booking_phone: req.body.booking_phone,
      booking_date: req.body.booking_date,
      booking_time: req.body.booking_time,
      booking_timestamp: req.body.booking_timestamp,
      is_emailed: req.body.is_emailed,
      uid: req.body.uid,
      created_at: new Date().toISOString(),
    };

    // Define Params
    const params = [
      data.booking_description,
      data.booking_email,
      data.booking_phone,
      data.booking_date,
      data.booking_time,
      data.booking_timestamp,
      data.is_emailed,
      data.uid,
      data.created_at,
    ];

    // Define Query
    const query =
      "INSERT INTO booking (description, booking_email, booking_phone, booking_date, booking_time, booking_timestamp, is_emailed, uid, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *";

    // Execute Query
    const result = await client.query(query, params);

    // Output Result
    const createdBooking = result.rows[0];
    res.json({
      message: `Booking with Id ${createdBooking.id} created successfully.`,
      data: createdBooking,
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Update booking endpoint
app.put("/bookings/:id", verify, async (req, res) => {
  const client = await pool.connect();

  try {
    // Form Request Data
    const bookingId = req.params.id;
    const updateFields = req.body; 

    // Check fields to update is provided
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: "No fields to update provided." });
    }

    // Define SET clause based on provided fields to update
    const setClause = Object.keys(updateFields)
      .map((key, index) => `${key} = $${index + 2}`) // Offset start from $2 as bookingId is $1 param
      .join(", "); // Join the clauses with a comma

    // Define Params
    const params = [bookingId, ...Object.values(updateFields)]; // BookingId as $1 param, spread/copy all fields to update as remaining params

    // Define Query
    const query = `UPDATE booking SET ${setClause} WHERE id = $1 RETURNING *`;

    // Execute Query
    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: `Booking with Id ${bookingId} not found.` });
    }

    // Output Result
    const updatedBooking = result.rows[0];
    res.json({
      message: `Booking with Id ${bookingId} updated successfully.`,
      data: updatedBooking,
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Delete booking endpoint
app.delete("/bookings/:id", verify, async (req, res) => {
  const client = await pool.connect();
  try {
    // Define params
    const params = [req.params.id];

    // Define query
    const query = "DELETE FROM booking WHERE id = $1 RETURNING *";

    // Execute query
    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ Error: `Booking with ID ${req.params.id} not found.` });
    }
    // Output result
    res.json({
      message: `Booking with ID ${req.params.id} deleted successfully.`,
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Create user endpoint
app.post("/register", async (req, res) => {
  const client = await pool.connect();
  try {
    // Form Request Data Object
    const data = {
      username: req.body.username,
      password: await bcrypt.hash(req.body.password, 12),
      createDate: new Date().toISOString(),
    };

    // Check Username
    const checkUserParams = [data.username];
    const checkUserQuery = "SELECT * FROM users WHERE username = $1";
    const checkUserResult = await client.query(checkUserQuery, checkUserParams);

    if (checkUserResult.rows.length > 0) {
      return res
        .status(400)
        .json({ message: `Username '${data.username}' already exist.` });
    }

    // Create User
    const createUserParams = [data.username, data.password, data.createDate];
    const createUserQuery =
      "INSERT INTO users (username, password, created_at) VALUES ($1, $2, $3) RETURNING *";
    const createUserResult = await client.query(
      createUserQuery,
      createUserParams,
    );

    // Output result
    const createdUser = createUserResult.rows[0];
    res.json({
      message: `User '${createdUser.username}' created successfully.`,
      user: createdUser,
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM users WHERE username = $1",
      [req.body.username],
    );

    // If user found, store it in 'user' variable
    const user = result.rows[0];

    // When User found
    if (user) {
      // Compare password entered with the hashed password in the database
      const passwordIsValid = await bcrypt.compare(
        req.body.password,
        user.password,
      );

      // When Password matched
      if (passwordIsValid) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.push(refreshToken); // Push refresh token to store at array

        // Return token back to user (front-end)
        res.json({
          message: "Login Successful",
          auth: true,
          token: accessToken,
          refreshToken: refreshToken,
          username: user.username,
          uid: user.id,
        });
        
      } else {
        res.status(401).json({
          message: "Invalid password",
          auth: false,
          token: null,
          refreshToken: null,
          username: user.username,
          uid: user.id,
        });
      }
    } else {
      res.status(400).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Refresh Token endpoint
app.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.body.token;
    console.log(`IN Refresh Tokens: ${refreshTokens}`)
    console.log(`IN Refresh Token: ${refreshToken}`);
    
    // Throw error if refresh token is not provided
    if (!refreshToken) throw new Error("You are not authenticated!");

    // Prompt error if refresh token is not within the array
    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json("Invalid refresh token");
    }

    // Verify refresh token
    jwt.verify(refreshToken, JWT_REFRESH_SECRET_KEY, (err, user) => {
      if (err) {
        console.error("Error verifying refresh token:", err);
      }

      console.log(`Refresh token verified successful!`)

      // Remove refresh token from array when verification successful
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      
      // Push new refresh token to array
      refreshTokens.push(newRefreshToken);
      console.log(`NEW Refresh Tokens: ${refreshTokens}`);
      console.log(`NEW Refresh Token: ${newRefreshToken}`);
      console.log(`--- END ---`)
      // Respond with new tokens back to client
      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });
  } catch (error) {
    console.error("Error: ", error.message);
  }
});

// Username endpoint
app.get("/username", verify, async (req, res) => {
  try {
    // Output result
    res.json({
      id: req.user.id,
      username: req.user.username,
      issue: req.user.iat,
      expiry: req.user.exp,
    });
  } catch (error) {
    // Return an error if the token is not valid
    res.status(400).json({ error: "Invalid token" });
  }
});

// Handle invalid request
app.use((req, res) => {
  // res.status(404).sendFile(path.join(__dirname + '/404.html'));
  res.status(404).send("Invalid request!");
});

// Application to listen from port 3000
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
