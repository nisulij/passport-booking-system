const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const ImportedAppointment = require("../models/ImportedAppointment");
const nodemailer = require("nodemailer");

// -------------------------------------------------
// BOOKING HELPERS
// -------------------------------------------------

const SERVICES = ["passport", "birth_certificate", "other"];

function cleanServiceType(value) {
  return SERVICES.includes(value) ? value : null;
}

function makeToken(prefix) {
  return `${prefix}-${Date.now().toString().slice(-8)}-${Math.floor(
    100 + Math.random() * 900
  )}`;
}

async function findExistingIdentity(email, idNumber, serviceType) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanId = String(idNumber || "").trim();

  const conditions = [];
  if (cleanEmail) conditions.push({ email: cleanEmail });
  if (cleanId) conditions.push({ idNumber: cleanId });

  if (!conditions.length) return null;

  return Booking.findOne({
    serviceType,
    $or: conditions,
  });
}

function duplicateIdentityMessage(existing, email, idNumber) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanId = String(idNumber || "").trim();

  if (
    existing?.email === cleanEmail &&
    existing?.idNumber === cleanId
  ) {
    return "This email and passport / ID number already have a booking.";
  }

  if (existing?.email === cleanEmail) {
    return "This email address already has a booking.";
  }

  return "This passport / ID number already has a booking.";
}

const MAX_PASSPORT_APPOINTMENTS_PER_DAY = 40;

function normalizeSlot(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const range = raw.match(/^(\d{1,2}:\d{2})/);
  if (range) return range[1].padStart(5, "0");
  return raw;
}

async function getBlockedSlots(serviceType, date) {
  const liveBookings = await Booking.find(
    { serviceType, date },
    { slot: 1, _id: 0 }
  ).lean();

  if (serviceType !== "passport") {
    return liveBookings.map((x) => x.slot).filter(Boolean);
  }

  const importedAppointments = await ImportedAppointment.find(
    { serviceType: "passport", appointmentDate: date },
    { appointmentTime: 1, _id: 0 }
  ).lean();

  return [
    ...liveBookings.map((x) => x.slot),
    ...importedAppointments.map((x) => x.appointmentTime),
  ]
    .filter(Boolean)
    .map(normalizeSlot);
}


// -------------------------------------------------
// EMAIL CONFIRMATIONS
// -------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: Number(process.env.MAIL_PORT || 587) === 465,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

function serviceLabel(serviceType) {
  if (serviceType === "passport") return "Passport";
  if (serviceType === "birth_certificate") return "Birth Certificate";
  return "Consular Service";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mailFrom() {
  return process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME;
}

function mailFromName() {
  return process.env.MAIL_FROM_NAME || process.env.APP_NAME || "Passport & Consular Booking";
}

async function sendAppointmentEmail(booking) {
  try {
    if (!process.env.MAIL_HOST || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
      console.error("EMAIL ERROR: MAIL_HOST, MAIL_USERNAME or MAIL_PASSWORD is missing.");
      return false;
    }

    if (!booking?.email) {
      console.error("EMAIL ERROR: Booking has no email address.");
      return false;
    }

    const service = serviceLabel(booking.serviceType);
    const to = String(booking.email).trim().toLowerCase();

    const info = await transporter.sendMail({
      from: `"${mailFromName()}" <${mailFrom()}>`,
      to,
      subject: `Appointment Confirmed - ${service} - ${booking.token}`,
      text: `Your ${service} appointment has been confirmed.

Name: ${booking.name}
Service: ${service}
Date: ${booking.date}
Time: ${booking.slot}
Appointment Token: ${booking.token}
ID / Passport Number: ${booking.idNumber}

Please bring your required documents and arrive on time.
This is an automated confirmation email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#222">
          <h2 style="margin-bottom:8px">Appointment Confirmed</h2>
          <p>Your <strong>${escapeHtml(service)}</strong> appointment has been successfully booked.</p>
          <table style="border-collapse:collapse;width:100%;margin-top:20px">
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(booking.name)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Service</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(service)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Date</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(booking.date)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Time</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(booking.slot)}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Appointment Token</strong></td><td style="padding:8px;border:1px solid #ddd"><strong>${escapeHtml(booking.token)}</strong></td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>ID / Passport Number</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(booking.idNumber)}</td></tr>
          </table>
          <p style="margin-top:20px">Please bring your required documents and arrive on time.</p>
          <p style="font-size:12px;color:#777">This is an automated confirmation email.</p>
        </div>
      `,
    });

    console.log("EMAIL SENT SUCCESSFULLY:", info.messageId, "->", to);
    return true;
  } catch (err) {
    console.error("EMAIL SEND ERROR:", err);
    return false;
  }
}

async function sendFamilyAppointmentEmail(email, date, confirmations) {
  try {
    const to = String(email || "").trim().toLowerCase();

    if (!to) {
      console.error("EMAIL ERROR: Family booking has no email address.");
      return false;
    }

    if (!process.env.MAIL_HOST || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
      console.error("EMAIL ERROR: MAIL_HOST, MAIL_USERNAME or MAIL_PASSWORD is missing.");
      return false;
    }

    const rows = confirmations.map((item) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(item.name)}</td>
        <td style="padding:8px;border:1px solid #ddd">${escapeHtml(item.slot)}</td>
        <td style="padding:8px;border:1px solid #ddd"><strong>${escapeHtml(item.token)}</strong></td>
      </tr>
    `).join("");

    const info = await transporter.sendMail({
      from: `"${mailFromName()}" <${mailFrom()}>`,
      to,
      subject: `Family Passport Appointments Confirmed - ${date}`,
      text: `Your family passport appointments have been confirmed for ${date}.

${confirmations.map((x) => `${x.name} - ${x.slot} - ${x.token}`).join("\n")}

Please bring the required documents and arrive on time.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;padding:24px;color:#222">
          <h2>Family Passport Appointments Confirmed</h2>
          <p>Date: <strong>${escapeHtml(date)}</strong></p>
          <table style="border-collapse:collapse;width:100%;margin-top:20px">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #ddd;text-align:left">Member</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left">Time</th>
                <th style="padding:8px;border:1px solid #ddd;text-align:left">Token</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:20px">Please bring the required documents and arrive on time.</p>
          <p style="font-size:12px;color:#777">This is an automated confirmation email.</p>
        </div>
      `,
    });

    console.log("FAMILY EMAIL SENT SUCCESSFULLY:", info.messageId, "->", to);
    return true;
  } catch (err) {
    console.error("FAMILY EMAIL SEND ERROR:", err);
    return false;
  }
}

// =============================================
// GET BOOKED SLOTS FOR A SPECIFIC SERVICE + DATE
// =============================================
router.get("/slots/:serviceType/:date", async (req, res) => {
  try {
    const serviceType = cleanServiceType(req.params.serviceType);
    if (!serviceType) {
      return res.status(400).json({ message: "Invalid service type" });
    }
    const blockedSlots = await getBlockedSlots(serviceType, req.params.date);
    res.json([...new Set(blockedSlots)]);
  } catch (err) {
    console.log("GET SERVICE SLOTS ERROR:", err);
    res.status(500).json([]);
  }
});

router.get("/slots/:date", async (req, res) => {
  try {
    const blockedSlots = await getBlockedSlots("passport", req.params.date);
    res.json([...new Set(blockedSlots)]);
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
// Shared family email + address.
// Each member has name + phone + adult/child choice.
// Adults require ID/passport; children may have no ID/passport.
// =============================================
router.post("/family-book", async (req, res) => {
  try {
    const { email, address, date, members } = req.body;

    if (!email || !address || !date || !Array.isArray(members) || members.length < 1) {
      return res.status(400).json({
        message: "Please complete the family email, address, date and members.",
      });
    }

    if (members.length > 4) {
      return res.status(400).json({
        message: "Maximum 4 family members allowed",
      });
    }

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const isChild = Boolean(member.isChild);
      const name = String(member.name || "").trim();
      const phone = String(member.phone || "").trim();
      const id = String(member.id || "").trim();
      const slot = String(member.slot || "").trim();

      if (!name || !phone || !slot) {
        return res.status(400).json({
          message: `Missing information for Member ${i + 1}`,
        });
      }

      if (!/^\d{7,15}$/.test(phone)) {
        return res.status(400).json({
          message: `Enter a valid phone number for Member ${i + 1}.`,
        });
      }

      if (!isChild && !id) {
        return res.status(400).json({
          message: `Member ${i + 1} is an adult. Please enter the ID / Passport number or choose Child.`,
        });
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanAddress = address.trim();

    const existingEmail = await Booking.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({
        message: "This email address already has a booking.",
      });
    }

    const adultIds = members
      .filter((member) => !Boolean(member.isChild))
      .map((member) => String(member.id || "").trim())
      .filter(Boolean);

    const uniqueIds = new Set(adultIds);
    if (uniqueIds.size !== adultIds.length) {
      return res.status(400).json({
        message: "The same passport / ID number cannot be used for more than one family member.",
      });
    }

    if (adultIds.length) {
      const existingId = await Booking.findOne({
        idNumber: { $in: adultIds },
      });

      if (existingId) {
        return res.status(400).json({
          message: `Passport / ID number ${existingId.idNumber} already has a booking.`,
        });
      }
    }

    const [livePassportCount, importedPassportCount] = await Promise.all([
      Booking.countDocuments({ serviceType: "passport", date }),
      ImportedAppointment.countDocuments({
        serviceType: "passport",
        appointmentDate: date,
      }),
    ]);

    const dailyPassportCount = livePassportCount + importedPassportCount;

    if (dailyPassportCount + members.length > MAX_PASSPORT_APPOINTMENTS_PER_DAY) {
      return res.status(400).json({
        message: `Only ${Math.max(0, MAX_PASSPORT_APPOINTMENTS_PER_DAY - dailyPassportCount)} passport appointment slot(s) remain for this date.`,
      });
    }

    const requestedSlots = members.map((member) => String(member.slot || "").trim());
    const uniqueSlots = new Set(requestedSlots);

    if (uniqueSlots.size !== requestedSlots.length) {
      return res.status(400).json({
        message: "Each family member must select a different time slot",
      });
    }

    const [alreadyBooked, importedBooked] = await Promise.all([
      Booking.find({
        serviceType: "passport",
        date,
        slot: { $in: requestedSlots },
      }),
      ImportedAppointment.find({
        serviceType: "passport",
        appointmentDate: date,
        appointmentTime: { $in: requestedSlots.map(normalizeSlot) },
      }),
    ]);

    if (alreadyBooked.length > 0 || importedBooked.length > 0) {
      const unavailable = [
        ...alreadyBooked.map((booking) => booking.slot),
        ...importedBooked.map((booking) => booking.appointmentTime),
      ];

      return res.status(400).json({
        message: `These slots are already booked: ${unavailable.join(", ")}`,
      });
    }

    const familyId = `F${Date.now().toString().slice(-8)}`;
    const bookingsToCreate = [];
    const tokens = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const isChild = Boolean(member.isChild);
      const token = `${familyId}-${i + 1}`;
      tokens.push(token);

      bookingsToCreate.push({
        serviceType: "passport",
        title: "Family",
        bookingType: "family",
        familyId,
        familyMemberNumber: i + 1,
        name: String(member.name).trim(),
        idNumber: isChild ? "" : String(member.id || "").trim(),
        isChild,
        phone: String(member.phone).trim(),
        address: cleanAddress,
        purpose: isChild ? "Child Passport" : "New Passport",
        email: cleanEmail,
        date,
        slot: String(member.slot).trim(),
        token,
        status: "ongoing",
      });
    }

    await Booking.insertMany(bookingsToCreate, { ordered: true });

    const confirmations = members.map((member, index) => ({
      name: member.name,
      token: tokens[index],
      slot: member.slot,
      purpose: Boolean(member.isChild) ? "Child Passport" : "New Passport",
    }));

    void sendFamilyAppointmentEmail(cleanEmail, date, confirmations);

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
      data.idNumber,
      "passport"
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
    const dailyPassportCount = await Booking.countDocuments({
      serviceType: "passport",
      date: data.date,
    });

    if (dailyPassportCount >= MAX_PASSPORT_APPOINTMENTS_PER_DAY) {
      return res.status(400).json({
        message: "Passport appointments are fully booked for this date.",
      });
    }

    const [livePassportCount, importedPassportCount] = await Promise.all([
      Booking.countDocuments({ serviceType: "passport", date: data.date }),
      ImportedAppointment.countDocuments({
        serviceType: "passport",
        appointmentDate: data.date,
      }),
    ]);

    if (livePassportCount + importedPassportCount >= MAX_PASSPORT_APPOINTMENTS_PER_DAY) {
      return res.status(400).json({
        message: "Passport appointments are fully booked for this date.",
      });
    }

    const slotExists = await Booking.findOne({
      serviceType: "passport",
      date: data.date,
      slot: data.slot,
    });

    const importedSlotExists = await ImportedAppointment.findOne({
      serviceType: "passport",
      appointmentDate: data.date,
      appointmentTime: normalizeSlot(data.slot),
    });

    if (importedSlotExists) {
      return res.status(400).json({
        message: "Passport slot already booked",
      });
    }
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
  emailQueued: true,
});

// Send the confirmation email in the background.
// An email problem cannot prevent the booking confirmation from appearing.
void sendAppointmentEmail({
  ...booking.toObject(),
  name: String(data.name).trim(),
  email: String(data.email).trim().toLowerCase(),
  date: data.date,
  slot: data.slot,
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
      data.idNumber,
      "birth_certificate"
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
  emailQueued: true,
});

// Send the confirmation email in the background.
// An email problem cannot prevent the booking confirmation from appearing.
void sendAppointmentEmail({
  ...booking.toObject(),
  name: String(data.name).trim(),
  email: String(data.email).trim().toLowerCase(),
  date: data.date,
  slot: data.slot,
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
      data.idNumber,
      "other"
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
  emailQueued: true,
});

// Send the confirmation email in the background.
// An email problem cannot prevent the booking confirmation from appearing.
void sendAppointmentEmail({
  ...booking.toObject(),
  name: String(data.name).trim(),
  email: String(data.email).trim().toLowerCase(),
  date: data.date,
  slot: data.slot,
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
