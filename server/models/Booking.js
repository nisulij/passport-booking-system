const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: ["passport", "birth_certificate", "other"],
      required: true,
      default: "passport",
      index: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    idNumber: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    purpose: {
      type: String,
      default: "",
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    slot: {
      type: String,
      required: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["ongoing", "completed", "no participate"],
      default: "ongoing",
    },

    bookingType: {
      type: String,
      enum: ["individual", "family", "service"],
      default: "individual",
    },

    familyId: {
      type: String,
      default: null,
    },

    familyMemberNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// IMPORTANT:
// A time slot is unique only INSIDE the same service.
// Example:
// passport 09:00 can coexist with birth_certificate 09:00
// and other 09:00 on the same date.
bookingSchema.index(
  {
    serviceType: 1,
    date: 1,
    slot: 1,
  },
  {
    unique: true,
    name: "service_date_slot_unique",
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
