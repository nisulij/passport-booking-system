const mongoose = require("mongoose");

const importedAppointmentSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      enum: ["passport", "birth_certificate"],
      required: true,
      index: true,
    },

    reference: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    appointmentDate: {
      type: String,
      default: "",
      index: true,
    },

    appointmentTime: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    mobile: {
      type: String,
      default: "",
      trim: true,
    },

    // The original Excel row is preserved so extra columns are not lost.
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    sourceFileName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

importedAppointmentSchema.index({
  serviceType: 1,
  reference: 1,
});

module.exports = mongoose.model(
  "ImportedAppointment",
  importedAppointmentSchema
);
