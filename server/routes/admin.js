const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const Booking = require("../models/Booking");

const router = express.Router();


// ==============================
// CHECK ADMIN EXISTS
// ==============================

router.get("/exists", async (req, res) => {

  try {

    const count =
      await Admin.countDocuments();

    res.json({
      exists: count > 0
    });

  } catch (err) {

    console.log(
      "ADMIN EXISTS ERROR:",
      err
    );

    res.status(500).json({
      exists: false
    });

  }

});


// ==============================
// FIRST ADMIN SIGNUP ONLY
// ==============================

router.post("/signup", async (req, res) => {

  try {

    const count =
      await Admin.countDocuments();

    if (count > 0) {

      return res.status(400).json({
        message: "Signup disabled"
      });

    }


    const {
      email,
      password
    } = req.body;


    if (!email || !password) {

      return res.status(400).json({
        message: "Email and password are required"
      });

    }


    const cleanEmail =
      email
        .toLowerCase()
        .trim();


    const hash =
      await bcrypt.hash(
        password,
        10
      );


    const admin =
      await Admin.create({

        email: cleanEmail,

        password: hash

      });


    res.json({

      message:
        "Admin account created",

      adminId:
        admin._id

    });

  } catch (err) {

    console.log(
      "SIGNUP ERROR:",
      err
    );

    res.status(500).json({
      message:
        err.message ||
        "Signup failed"
    });

  }

});


// ==============================
// LOGIN DIRECTLY TO DASHBOARD
// NO OTP
// ==============================

router.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    // =====================================
    // TEMPORARY DEBUG - ADD HERE
    // =====================================

    console.log("LOGIN EMAIL:", email);
    console.log("ENV EMAIL:", process.env.ADMIN_EMAIL);
    console.log("PASSWORD ENV LOADED:", !!process.env.ADMIN_PASSWORD);

    console.log(
      "PASSWORD LENGTHS:",
      password?.length,
      process.env.ADMIN_PASSWORD?.length
    );


    // =====================================
    // VALIDATION
    // =====================================

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }


    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;


    if (!adminEmail || !adminPassword) {
      console.log("ADMIN_EMAIL or ADMIN_PASSWORD missing");

      return res.status(500).json({
        message: "Admin credentials are not configured"
      });
    }


    // CHECK EMAIL

    if (
      email.trim().toLowerCase() !==
      adminEmail.trim().toLowerCase()
    ) {
      return res.status(400).json({
        message: "Incorrect admin email"
      });
    }


    // CHECK PASSWORD

    if (password !== adminPassword) {
      return res.status(400).json({
        message: "Incorrect password"
      });
    }


    // CREATE LOGIN TOKEN

    const token = jwt.sign(
      {
        email: adminEmail
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );


    return res.json({
      message: "Login successful",
      token
    });


  } catch (err) {

    console.log("LOGIN ERROR:", err);

    return res.status(500).json({
      message: err.message || "Login failed"
    });

  }
});


// ==============================
// GET BOOKINGS
// ==============================

router.get("/bookings", async (req, res) => {

  try {

    const bookings =
      await Booking
        .find()
        .sort({
          createdAt: -1
        });


    res.json(
      bookings
    );

  } catch (err) {

    console.log(
      "BOOKINGS ERROR:",
      err
    );

    res
      .status(500)
      .json([]);

  }

});


// ==============================
// UPDATE BOOKING STATUS
// ==============================

router.put("/status/:id", async (req, res) => {

  try {

    const {
      status
    } = req.body;


    if (!status) {

      return res
        .status(400)
        .json({
          message:
            "Status is required"
        });

    }


    const updatedBooking =
      await Booking.findByIdAndUpdate(

        req.params.id,

        {
          status
        },

        {
          new: true
        }

      );


    if (!updatedBooking) {

      return res
        .status(404)
        .json({
          message:
            "Booking not found"
        });

    }


    res.json({

      message:
        "updated",

      booking:
        updatedBooking

    });

  } catch (err) {

    console.log(
      "STATUS UPDATE ERROR:",
      err
    );


    res.status(500).json({
      message:
        err.message ||
        "failed"
    });

  }

});


module.exports = router;