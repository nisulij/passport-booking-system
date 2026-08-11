const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
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
      default: "New Passport",
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
    },

    status: {
      type: String,
      enum: [
        "ongoing",
        "completed",
        "no participate",
      ],
      default: "ongoing",
    },

    bookingType: {
      type: String,
      enum: [
        "individual",
        "family",
      ],
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


// =============================================
// IMPORTANT
// Only ONE booking can own a date + time slot
// =============================================

bookingSchema.index(
  {
    date: 1,
    slot: 1,
  },
  {
    unique: true,
  }
);


// Token should also be unique

bookingSchema.index(
  {
    token: 1,
  },
  {
    unique: true,
  }
);


module.exports =
  mongoose.model(
    "Booking",
    bookingSchema
  );