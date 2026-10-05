require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bookingRoutes = require("./routes/booking");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors({
  origin: [
    "https://passport-booking-system.vercel.app",
    "https://passport-booking-system-git-main-nisuli-s-projects.vercel.app",
    "http://localhost:5173",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json({ limit: "2mb" }));
app.use("/api", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req,res) => res.send("Passport API running"));

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
