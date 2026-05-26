require("dotenv").config();

console.log(process.env.EMAIL);
console.log(process.env.EMAIL_PASSWORD);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const bookingRoutes = require("./routes/booking");
const adminRoutes = require("./routes/admin");

const app = express();


// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use(express.json());


// ROUTES
app.use("/api", bookingRoutes);
app.use("/api/admin", adminRoutes);


// TEST
app.get("/", (req, res) => {
  res.send("Passport API running");
});


// DATABASE
mongoose
.connect(process.env.MONGO_URL)
.then(() => {
  console.log("MongoDB Connected");
})
.catch((err) => {
  console.log("Mongo Error:", err);
});


// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});