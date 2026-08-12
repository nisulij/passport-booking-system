const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

const SERVICES = ["passport", "birth_certificate", "other"];

function cleanServiceType(value) {
  return SERVICES.includes(value) ? value : null;
}

function makeToken(prefix) {
  return `${prefix}-${Date.now().toString().slice(-8)}-${Math.floor(
    100 + Math.random() * 900
  )}`;
}

async function findExistingIdentity(email, idNumber) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanId = String(idNumber || "").trim();

  const conditions = [];
  if (cleanEmail) conditions.push({ email: cleanEmail });
  if (cleanId) conditions.push({ idNumber: cleanId });

  if (!conditions.length) return null;

  return Booking.findOne({ $or: conditions });
}

function duplicateIdentityMessage(existing, email, idNumber) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanId = String(idNumber || "").trim();

  if (existing?.email === cleanEmail && existing?.idNumber === cleanId) {
    return "This email and passport / ID number already have a booking.";
  }

  if (existing?.email === cleanEmail) {
    return "This email address already has a booking.";
  }

  return "This passport / ID number already has a booking.";
}

// =============================================
// GET BOOKED SLOTS FOR A SPECIFIC SERVICE + DATE
// =============================================

router.get("/slots/:serviceType/:date", async (req, res) => {
  try {
    const serviceType = cleanServiceType(req.params.serviceType);

    if (!serviceType) {
      return res.status(400).json({
        message: "Invalid service type",
      });
    }

    const bookings = await Booking.find(
      {
        serviceType,
        date: req.params.date,
      },
      {
        slot: 1,
        _id: 0,
      }
    );

    res.json(bookings.map((booking) => booking.slot));
  } catch (err) {
    console.log("GET SERVICE SLOTS ERROR:", err);
    res.status(500).json([]);
  }
});

// Backward compatibility for your current passport pages.
// You can remove this route after both passport pages use:
// /api/slots/passport/${date}
router.get("/slots/:date", async (req, res) => {
  try {
    const bookings = await Booking.find(
      {
        serviceType: "passport",
        date: req.params.date,
      },
      {
        slot: 1,
        _id: 0,
      }
    );

    res.json(bookings.map((booking) => booking.slot));
  } catch (err) {
    console.log("GET PASSPORT SLOTS ERROR:", err);
    res.status(500).json([]);
  }
});

// =============================================
// GET ALL BOOKINGS
// =============================================

router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({
      createdAt: -1,
    });

    res.json(bookings);
  } catch (err) {
    console.log("GET BOOKINGS ERROR:", err);
    res.status(500).json([]);
  }
});

// =============================================
// UPDATE STATUS
// =============================================

router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "ongoing",
      "completed",
      "no participate",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Booking not found",
      });
    }

    res.json({
      message: "updated",
      booking: updated,
    });
  } catch (err) {
    console.log("STATUS ERROR:", err);
    res.status(500).json({
      message: "Update failed",
    });
  }
});

// =============================================
// PASSPORT FAMILY BOOKING
// =============================================

router.post("/family-book", async (req, res) => {
  try {
    const { email, date, members } = req.body;

    if (
      !email ||
      !date ||
      !Array.isArray(members) ||
      members.length < 1
    ) {
      return res.status(400).json({
        message: "Missing family booking information",
      });
    }

    if (members.length > 4) {
      return res.status(400).json({
        message: "Maximum 4 family members allowed",
      });
    }

    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      if (
        !member.name ||
        !member.id ||
        !member.phone ||
        !member.address ||
        !member.purpose ||
        !member.slot
      ) {
        return res.status(400).json({
          message: `Missing information for Member ${i + 1}`,
        });
      }
    }

    const existingEmail = await Booking.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "This email address already has a booking.",
      });
    }

    const requestedIds = members.map((member) =>
      String(member.id || "").trim()
    );

    const uniqueIds = new Set(requestedIds);

    if (uniqueIds.size !== requestedIds.length) {
      return res.status(400).json({
        message:
          "The same passport / ID number cannot be used for more than one family member.",
      });
    }

    const existingId = await Booking.findOne({
      idNumber: { $in: requestedIds },
    });

    if (existingId) {
      return res.status(400).json({
        message: `Passport / ID number ${existingId.idNumber} already has a booking.`,
      });
    }

    const requestedSlots = members.map((member) => member.slot);
    const uniqueSlots = new Set(requestedSlots);

    if (uniqueSlots.size !== requestedSlots.length) {
      return res.status(400).json({
        message: "Each family member must select a different time slot",
      });
    }

    // IMPORTANT: only passport bookings block passport slots.
    const alreadyBooked = await Booking.find({
      serviceType: "passport",
      date,
      slot: {
        $in: requestedSlots,
      },
    });

    if (alreadyBooked.length > 0) {
      const unavailable = alreadyBooked.map(
        (booking) => booking.slot
      );

      return res.status(400).json({
        message: `These slots are already booked: ${unavailable.join(", ")}`,
      });
    }

    const familyId = `F${Date.now().toString().slice(-8)}`;
    const bookingsToCreate = [];
    const tokens = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const token = `${familyId}-${i + 1}`;

      tokens.push(token);

      bookingsToCreate.push({
        serviceType: "passport",
        title: "Family",
        bookingType: "family",
        familyId,
        familyMemberNumber: i + 1,
        name: member.name.trim(),
        idNumber: member.id.trim(),
        phone: member.phone.trim(),
        address: member.address.trim(),
        purpose: member.purpose,
        email: email.trim().toLowerCase(),
        date,
        slot: member.slot,
        token,
        status: "ongoing",
      });
    }

    await Booking.insertMany(bookingsToCreate, {
      ordered: true,
    });

    const confirmations = members.map((member, index) => ({
      name: member.name,
      token: tokens[index],
      slot: member.slot,
      purpose: member.purpose,
    }));

    res.status(201).json({
      message: "Family booking successful",
      familyId,
      tokens,
      confirmations,
    });
  } catch (err) {
    console.log("FAMILY BOOKING ERROR:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message:
          "One of the selected passport slots was just booked. Please refresh and choose another slot.",
      });
    }

    res.status(500).json({
      message: err.message || "Family booking failed",
    });
  }
});

// =============================================
// PASSPORT INDIVIDUAL BOOKING
// =============================================

router.post("/book", async (req, res) => {
  try {
    const data = req.body;

    if (
      !data.name ||
      !data.idNumber ||
      !data.email ||
      !data.phone ||
      !data.date ||
      !data.slot
    ) {
      return res.status(400).json({
        message: "Please complete all required fields",
      });
    }

    const existingIdentity = await findExistingIdentity(
      data.email,
      data.idNumber
    );

    if (existingIdentity) {
      return res.status(400).json({
        message: duplicateIdentityMessage(
          existingIdentity,
          data.email,
          data.idNumber
        ),
      });
    }

    const slotExists = await Booking.findOne({
      serviceType: "passport",
      date: data.date,
      slot: data.slot,
    });

    if (slotExists) {
      return res.status(400).json({
        message: "Passport slot already booked",
      });
    }

    const token = makeToken("P");

    const booking = await Booking.create({
      serviceType: "passport",
      title: data.title || "Mr",
      bookingType: "individual",
      familyId: null,
      familyMemberNumber: null,
      name: data.name.trim(),
      idNumber: data.idNumber.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      address: data.address ? data.address.trim() : "",
      purpose: data.purpose || "New Passport",
      date: data.date,
      slot: data.slot,
      token,
      status: "ongoing",
    });

    res.status(201).json({
      message: "Booking success",
      token: booking.token,
      booking,
    });
  } catch (err) {
    console.log("INDIVIDUAL BOOKING ERROR:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message:
          "This passport slot was just booked. Please select another slot.",
      });
    }

    res.status(500).json({
      message: err.message || "Server error",
    });
  }
});

// =============================================
// BIRTH CERTIFICATE BOOKING
// 15-minute frontend slots, 9:00 AM - 1:00 PM
// =============================================

router.post("/birth-certificate-book", async (req, res) => {
  try {
    const data = req.body;

    if (
      !data.name ||
      !data.idNumber ||
      !data.email ||
      !data.phone ||
      !data.date ||
      !data.slot
    ) {
      return res.status(400).json({
        message: "Please complete all required fields",
      });
    }

    const existingIdentity = await findExistingIdentity(
      data.email,
      data.idNumber
    );

    if (existingIdentity) {
      return res.status(400).json({
        message: duplicateIdentityMessage(
          existingIdentity,
          data.email,
          data.idNumber
        ),
      });
    }

    const slotExists = await Booking.findOne({
      serviceType: "birth_certificate",
      date: data.date,
      slot: data.slot,
    });

    if (slotExists) {
      return res.status(400).json({
        message: "Birth certificate slot already booked",
      });
    }

    const token = makeToken("BC");

    const booking = await Booking.create({
      serviceType: "birth_certificate",
      title: data.title || "",
      bookingType: "service",
      name: data.name.trim(),
      idNumber: data.idNumber.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      address: data.address ? data.address.trim() : "",
      purpose: data.purpose || "Birth Certificate",
      date: data.date,
      slot: data.slot,
      token,
      status: "ongoing",
    });

    res.status(201).json({
      message: "Birth certificate appointment booked",
      token: booking.token,
      booking,
    });
  } catch (err) {
    console.log("BIRTH CERTIFICATE BOOKING ERROR:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message:
          "This birth certificate slot was just booked. Please select another slot.",
      });
    }

    res.status(500).json({
      message: err.message || "Birth certificate booking failed",
    });
  }
});

// =============================================
// OTHER CONSULAR SERVICE BOOKING
// 30-minute frontend slots, 9:00 AM - 1:00 PM
// =============================================

router.post("/other-service-book", async (req, res) => {
  try {
    const data = req.body;

    if (
      !data.name ||
      !data.idNumber ||
      !data.email ||
      !data.phone ||
      !data.date ||
      !data.slot ||
      !data.purpose
    ) {
      return res.status(400).json({
        message: "Please complete all required fields",
      });
    }

    const existingIdentity = await findExistingIdentity(
      data.email,
      data.idNumber
    );

    if (existingIdentity) {
      return res.status(400).json({
        message: duplicateIdentityMessage(
          existingIdentity,
          data.email,
          data.idNumber
        ),
      });
    }

    const slotExists = await Booking.findOne({
      serviceType: "other",
      date: data.date,
      slot: data.slot,
    });

    if (slotExists) {
      return res.status(400).json({
        message: "Other service slot already booked",
      });
    }

    const token = makeToken("OS");

    const booking = await Booking.create({
      serviceType: "other",
      title: data.title || "",
      bookingType: "service",
      name: data.name.trim(),
      idNumber: data.idNumber.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      address: data.address ? data.address.trim() : "",
      purpose: data.purpose.trim(),
      date: data.date,
      slot: data.slot,
      token,
      status: "ongoing",
    });

    res.status(201).json({
      message: "Other consular service appointment booked",
      token: booking.token,
      booking,
    });
  } catch (err) {
    console.log("OTHER SERVICE BOOKING ERROR:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message:
          "This other-service slot was just booked. Please select another slot.",
      });
    }

    res.status(500).json({
      message: err.message || "Other service booking failed",
    });
  }
});

module.exports = router;
