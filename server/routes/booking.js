const express = require("express");

const router = express.Router();

const Booking = require("../models/Booking");


// =============================================
// GET BOOKED SLOTS FOR DATE
// =============================================

router.get(
  "/slots/:date",
  async (req, res) => {

    try {

      const bookings =
        await Booking.find(
          {
            date: req.params.date,
          },
          {
            slot: 1,
            _id: 0,
          }
        );


      const bookedSlots =
        bookings.map(
          (booking) =>
            booking.slot
        );


      res.json(
        bookedSlots
      );

    }

    catch (err) {

      console.log(
        "GET SLOTS ERROR:",
        err
      );


      res
        .status(500)
        .json([]);

    }

  }
);


// =============================================
// GET ALL BOOKINGS
// =============================================

router.get(
  "/bookings",
  async (req, res) => {

    try {

      const bookings =
        await Booking
          .find()
          .sort({
            createdAt: -1,
          });


      res.json(
        bookings
      );

    }

    catch (err) {

      console.log(
        "GET BOOKINGS ERROR:",
        err
      );


      res
        .status(500)
        .json([]);

    }

  }
);


// =============================================
// UPDATE STATUS
// =============================================

router.put(
  "/status/:id",
  async (req, res) => {

    try {

      const {
        status,
      } = req.body;


      const allowedStatuses = [
        "ongoing",
        "completed",
        "no participate",
      ];


      if (
        !allowedStatuses.includes(
          status
        )
      ) {

        return res
          .status(400)
          .json({
            message:
              "Invalid status",
          });

      }


      const updated =
        await Booking
          .findByIdAndUpdate(
            req.params.id,
            {
              status,
            },
            {
              new: true,
            }
          );


      if (!updated) {

        return res
          .status(404)
          .json({
            message:
              "Booking not found",
          });

      }


      res.json({
        message:
          "updated",

        booking:
          updated,
      });

    }

    catch (err) {

      console.log(
        "STATUS ERROR:",
        err
      );


      res
        .status(500)
        .json({
          message:
            "Update failed",
        });

    }

  }
);


// =============================================
// FAMILY BOOKING
// =============================================

router.post(
  "/family-book",
  async (req, res) => {

    try {

      const {
        email,
        date,
        members,
      } = req.body;


      // ------------------------------
      // BASIC VALIDATION
      // ------------------------------

      if (
        !email ||
        !date ||
        !Array.isArray(members) ||
        members.length < 1
      ) {

        return res
          .status(400)
          .json({
            message:
              "Missing family booking information",
          });

      }


      if (
        members.length > 4
      ) {

        return res
          .status(400)
          .json({
            message:
              "Maximum 4 family members allowed",
          });

      }


      // ------------------------------
      // VALIDATE EACH MEMBER
      // ------------------------------

      for (
        let i = 0;
        i < members.length;
        i++
      ) {

        const member =
          members[i];


        if (
          !member.name ||
          !member.id ||
          !member.phone ||
          !member.address ||
          !member.purpose ||
          !member.slot
        ) {

          return res
            .status(400)
            .json({
              message:
                `Missing information for Member ${i + 1}`,
            });

        }

      }


      // ------------------------------
      // MAKE SURE FAMILY MEMBERS
      // DID NOT SELECT SAME SLOT
      // ------------------------------

      const requestedSlots =
        members.map(
          (member) =>
            member.slot
        );


      const uniqueSlots =
        new Set(
          requestedSlots
        );


      if (
        uniqueSlots.size !==
        requestedSlots.length
      ) {

        return res
          .status(400)
          .json({
            message:
              "Each family member must select a different time slot",
          });

      }


      // ------------------------------
      // CHECK ALL SLOTS BEFORE SAVING
      // ANY MEMBER
      // ------------------------------

      const alreadyBooked =
        await Booking.find({

          date,

          slot: {
            $in:
              requestedSlots,
          },

        });


      if (
        alreadyBooked.length > 0
      ) {

        const unavailable =
          alreadyBooked.map(
            (booking) =>
              booking.slot
          );


        return res
          .status(400)
          .json({

            message:
              `These slots are already booked: ${unavailable.join(", ")}`,

          });

      }


      // ------------------------------
      // GENERATE FAMILY ID
      // ------------------------------

      const familyId =
        `F${Date.now()
          .toString()
          .slice(-8)}`;


      const bookingsToCreate = [];

      const tokens = [];


      for (
        let i = 0;
        i < members.length;
        i++
      ) {

        const member =
          members[i];


        const token =
          `${familyId}-${i + 1}`;


        tokens.push(
          token
        );


        bookingsToCreate.push({

          title:
            "Family",

          bookingType:
            "family",

          familyId,

          familyMemberNumber:
            i + 1,

          name:
            member.name.trim(),

          idNumber:
            member.id.trim(),

          phone:
            member.phone.trim(),

          address:
            member.address.trim(),

          purpose:
            member.purpose,

          email:
            email
              .trim()
              .toLowerCase(),

          date,

          slot:
            member.slot,

          token,

          status:
            "ongoing",

        });

      }


      // ------------------------------
      // CREATE ALL MEMBERS TOGETHER
      // ------------------------------

      await Booking.insertMany(
        bookingsToCreate,
        {
          ordered: true,
        }
      );


      // ------------------------------
      // RETURN TOKENS IN SAME ORDER
      // AS FAMILY MEMBER NAMES
      // ------------------------------

      const confirmations =
        members.map(
          (member, index) => ({
            name:
              member.name,

            token:
              tokens[index],

            slot:
              member.slot,

            purpose:
              member.purpose,
          })
        );


      res.status(201).json({

        message:
          "Family booking successful",

        familyId,

        tokens,

        confirmations,

      });

    }

    catch (err) {

      console.log(
        "FAMILY BOOKING ERROR:",
        err
      );


      // ------------------------------
      // SLOT UNIQUE INDEX COLLISION
      // ------------------------------

      if (
        err.code === 11000
      ) {

        return res
          .status(409)
          .json({

            message:
              "One of the selected slots was just booked by another applicant. Please refresh and choose another slot.",

          });

      }


      res
        .status(500)
        .json({

          message:
            err.message ||
            "Family booking failed",

        });

    }

  }
);


// =============================================
// INDIVIDUAL BOOKING
// =============================================

router.post(
  "/book",
  async (req, res) => {

    try {

      const data =
        req.body;


      if (
        !data.name ||
        !data.idNumber ||
        !data.email ||
        !data.phone ||
        !data.date ||
        !data.slot
      ) {

        return res
          .status(400)
          .json({

            message:
              "Please complete all required fields",

          });

      }


      // Individual booking email
      // can only have one individual booking

      const existing =
        await Booking.findOne({

          email:
            data.email
              .trim()
              .toLowerCase(),

          bookingType:
            "individual",

        });


      if (existing) {

        return res
          .status(400)
          .json({

            message:
              "This email already has an individual booking",

          });

      }


      // CHECK SLOT

      const slotExists =
        await Booking.findOne({

          date:
            data.date,

          slot:
            data.slot,

        });


      if (slotExists) {

        return res
          .status(400)
          .json({

            message:
              "Slot already booked",

          });

      }


      // TOKEN

      const token =
        `T${Date.now()
          .toString()
          .slice(-8)}`;


      const booking =
        await Booking.create({

          title:
            data.title ||
            "Mr",

          bookingType:
            "individual",

          familyId:
            null,

          familyMemberNumber:
            null,

          name:
            data.name.trim(),

          idNumber:
            data.idNumber.trim(),

          email:
            data.email
              .trim()
              .toLowerCase(),

          phone:
            data.phone.trim(),

          address:
            data.address
              ? data.address.trim()
              : "",

          purpose:
            data.purpose ||
            "New Passport",

          date:
            data.date,

          slot:
            data.slot,

          token,

          status:
            "ongoing",

        });


      res
        .status(201)
        .json({

          message:
            "Booking success",

          token:
            booking.token,

          booking,

        });

    }

    catch (err) {

      console.log(
        "INDIVIDUAL BOOKING ERROR:",
        err
      );


      if (
        err.code === 11000
      ) {

        return res
          .status(409)
          .json({

            message:
              "This slot was just booked by another applicant. Please select another slot.",

          });

      }


      res
        .status(500)
        .json({

          message:
            err.message ||
            "Server error",

        });

    }

  }
);


module.exports =
  router;