const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

const Admin = require("../models/Admin");
const Booking = require("../models/Booking");

const router = express.Router();


// ==============================
// GMAIL TRANSPORTER
// ==============================

const transporter = nodemailer.createTransport({

  host: "smtp.gmail.com",

  port: 587,

  secure: false,

  auth: {

    user: process.env.EMAIL,

    pass: process.env.EMAIL_PASSWORD

  }

});


// TEST MAIL CONNECTION

transporter.verify((error, success) => {

  if (error) {

    console.log("MAIL ERROR:", error);

  } else {

    console.log("Gmail SMTP Ready");

  }

});



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

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      exists: false

    });

  }

});




// ==============================
// FIRST ADMIN SIGNUP
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


    const hash =
    await bcrypt.hash(password, 10);


    await Admin.create({

      email,
      password: hash

    });

    res.json({

      message: "Admin account created"

    });

  }

  catch (err) {

    console.log("SIGNUP ERROR:", err);

    res.status(500).json({

      message: err.message

    });

  }

});




// ==============================
// LOGIN + SEND OTP
// ==============================

router.post("/login", async (req, res) => {

  try {

    const {

      email,
      password

    } = req.body;


    const admin =
    await Admin.findOne({ email });


    if (!admin) {

      return res.status(400).json({

        message: "Admin not found"

      });

    }


    const valid =
    await bcrypt.compare(
      password,
      admin.password
    );


    if (!valid) {

      return res.status(400).json({

        message: "Incorrect password"

      });

    }



    // OTP

    const otp =
    otpGenerator.generate(
      6,
      {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
      }
    );


    admin.otp = otp;

    admin.otpExpiry =
    Date.now() + 300000;

    await admin.save();



    // SEND EMAIL

    await transporter.sendMail({

      from: process.env.EMAIL,

      to: email,

      subject: "Passport Admin OTP",

      text:
`Your OTP Code: ${otp}

This OTP expires in 5 minutes.`

    });


    console.log("OTP SENT:", otp);


    res.json({

      message: "OTP sent"

    });

  }

  catch (err) {

    console.log("LOGIN ERROR:", err);

    res.status(500).json({

      message: err.message

    });

  }

});




// ==============================
// VERIFY OTP
// ==============================

router.post("/verify-otp", async (req, res) => {

  try {

    const {

      email,
      otp

    } = req.body;


    const admin =
    await Admin.findOne({ email });


    if (!admin) {

      return res.status(400).json({

        message: "Admin not found"

      });

    }


    if (admin.otp !== otp) {

      return res.status(400).json({

        message: "Invalid OTP"

      });

    }


    if (Date.now() > admin.otpExpiry) {

      return res.status(400).json({

        message: "OTP expired"

      });

    }



    const token =
    jwt.sign(

      {

        id: admin._id

      },

      process.env.JWT_SECRET,

      {

        expiresIn: "1d"

      }

    );


    admin.otp = "";

    await admin.save();


    res.json({

      message: "Success",

      token

    });

  }

  catch (err) {

    console.log("VERIFY OTP ERROR:", err);

    res.status(500).json({

      message: err.message

    });

  }

});




// ==============================
// GET BOOKINGS
// ==============================

router.get("/bookings", async (req, res) => {

  try {

    const bookings =
    await Booking.find()
    .sort({

      createdAt: -1

    });

    res.json(bookings);

  }

  catch (err) {

    console.log(err);

    res.status(500).json([]);

  }

});




// ==============================
// UPDATE STATUS
// ==============================

router.put("/status/:id", async (req, res) => {

  try {

    await Booking.findByIdAndUpdate(

      req.params.id,

      {

        status: req.body.status

      }

    );

    res.json({

      message: "updated"

    });

  }

  catch (err) {

    console.log(err);

    res.status(500).json({

      message: "failed"

    });

  }

});



module.exports = router;