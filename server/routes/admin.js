const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const XLSX = require("xlsx");

const Admin = require("../models/Admin");
const Booking = require("../models/Booking");
const ImportedAppointment = require("../models/ImportedAppointment");

const router = express.Router();

const SERVICES = ["passport", "birth_certificate", "other"];

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!/\.(xlsx|xls)$/i.test(file.originalname || "")) {
      return cb(new Error("Only .xlsx or .xls files are allowed"));
    }
    cb(null, true);
  },
});

function cleanService(value) {
  return SERVICES.includes(value) ? value : null;
}

function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function firstValue(row, keys) {
  const entries = Object.entries(row || {});
  const direct = new Map(entries.map(([k, v]) => [String(k), v]));
  for (const key of keys) {
    const v = direct.get(key);
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  const normalized = new Map(entries.map(([k, v]) => [normalKey(k), v]));
  for (const key of keys) {
    const v = normalized.get(normalKey(key));
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

function excelSerialToDate(serial) {
  if (typeof serial !== "number" || !Number.isFinite(serial)) return null;
  const p = XLSX.SSF.parse_date_code(serial);
  if (!p) return null;
  return new Date(Date.UTC(p.y, p.m - 1, p.d, p.H || 0, p.M || 0, Math.floor(p.S || 0)));
}

const pad = (v) => String(v).padStart(2, "0");
const dateUTC = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
const timeUTC = (d) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;

function parseDateTime(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return { date: dateUTC(value), time: timeUTC(value) };
  if (typeof value === "number") {
    const d = excelSerialToDate(value);
    if (d) return { date: dateUTC(d), time: timeUTC(d) };
  }
  const s = cleanText(value);
  if (!s) return { date: "", time: "" };
  let m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:[ T,]+(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?)?/i);
  if (m) {
    let h = m[4] === undefined ? null : Number(m[4]);
    const min = m[5] === undefined ? 0 : Number(m[5]);
    const ap = m[7] ? m[7].toUpperCase() : "";
    if (h !== null && ap) { if (ap === "PM" && h < 12) h += 12; if (ap === "AM" && h === 12) h = 0; }
    return { date: `${m[3]}-${pad(m[2])}-${pad(m[1])}`, time: h === null ? "" : `${pad(h)}:${pad(min)}` };
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T,]+(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?)?/i);
  if (m) {
    let h = m[4] === undefined ? null : Number(m[4]);
    const min = m[5] === undefined ? 0 : Number(m[5]);
    const ap = m[7] ? m[7].toUpperCase() : "";
    if (h !== null && ap) { if (ap === "PM" && h < 12) h += 12; if (ap === "AM" && h === 12) h = 0; }
    return { date: `${m[1]}-${pad(m[2])}-${pad(m[3])}`, time: h === null ? "" : `${pad(h)}:${pad(min)}` };
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? { date: "", time: "" } : { date: dateUTC(d), time: timeUTC(d) };
}

function normalizeImportedRow(row, serviceType, index, fileName) {
  const start = firstValue(row, ["Ref", "Reference", "Reference Number", "referenceNumber", "Token", "token"]);
  const dateValue = firstValue(row, ["appointmentDate", "Appointment Date", "date", "Date", "startTime", "Start Time", "start time"]);
  const timeValue = firstValue(row, ["appointmentTime", "Appointment Time", "time", "Time", "slot", "Slot"]);
  const parsedDate = parseDateTime(dateValue);
  const parsedTime = parseDateTime(timeValue);
  const reference = cleanText(start) || `IMPORT-${serviceType.toUpperCase()}-${Date.now()}-${index + 1}`;
  const name = cleanText(firstValue(row, ["inviteeName", "Invitee Name", "Name", "name", "Applicant Name", "applicantName"]));
  const email = cleanText(firstValue(row, ["inviteeEmail", "Invitee Email", "Email", "email", "Applicant Email", "applicantEmail"])).toLowerCase();
  const mobile = cleanText(firstValue(row, ["Mobile Number", "Mobile", "mobile", "Phone", "phone", "Telephone"]));
  const rawData = JSON.parse(JSON.stringify(row, (k,v) => v instanceof Date ? v.toISOString() : v));
  return {
    serviceType, reference,
    appointmentDate: parsedDate.date,
    appointmentTime: parsedTime.time || parsedDate.time,
    name, email, mobile, rawData, sourceFileName: fileName || "uploaded.xlsx",
  };
}

function importedToClient(doc) {
  const x = doc.toObject ? doc.toObject() : doc;
  return { ...x, _id: String(x._id), source: "excel", sourceLabel: "Excel", token: x.reference, date: x.appointmentDate, slot: x.appointmentTime, phone: x.mobile, idNumber: "", purpose: "" };
}

function bookingToClient(doc) {
  const x = doc.toObject ? doc.toObject() : doc;
  return { ...x, _id: String(x._id), source: "live", sourceLabel: "Live", reference: x.token, appointmentDate: x.date, appointmentTime: x.slot, mobile: x.phone };
}

function authError(res, message) { return res.status(401).json({ message }); }

// ---------------- AUTH / EXISTING ADMIN ----------------
router.get("/exists", async (req,res) => {
  try { res.json({ exists: await Admin.countDocuments() > 0 }); }
  catch (err) { console.log("ADMIN EXISTS ERROR:", err); res.status(500).json({ exists:false }); }
});

router.post("/signup", async (req,res) => {
  try {
    if (await Admin.countDocuments() > 0) return res.status(400).json({ message:"Signup disabled" });
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message:"Email and password are required" });
    const admin = await Admin.create({ email: email.toLowerCase().trim(), password: await bcrypt.hash(password,10) });
    res.json({ message:"Admin account created", adminId:admin._id });
  } catch (err) { console.log("SIGNUP ERROR:",err); res.status(500).json({ message:err.message || "Signup failed" }); }
});

router.post("/login", async (req,res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message:"Email and password are required" });
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) return res.status(500).json({ message:"Admin credentials are not configured" });
    if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) return res.status(400).json({ message:"Incorrect admin email" });
    if (password !== adminPassword) return res.status(400).json({ message:"Incorrect password" });
    const token = jwt.sign({ email:adminEmail }, process.env.JWT_SECRET, { expiresIn:"1d" });
    res.json({ message:"Login successful", token });
  } catch (err) { console.log("LOGIN ERROR:",err); res.status(500).json({ message:err.message || "Login failed" }); }
});

// ---------------- LIVE BOOKINGS ----------------
router.get("/bookings", async (req,res) => {
  try { res.json(await Booking.find().sort({ createdAt:-1 })); }
  catch (err) { console.log("BOOKINGS ERROR:",err); res.status(500).json([]); }
});

router.put("/status/:id", async (req,res) => {
  try {
    if (!req.body.status) return res.status(400).json({ message:"Status is required" });
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status:req.body.status }, { new:true });
    if (!booking) return res.status(404).json({ message:"Booking not found" });
    res.json({ message:"updated", booking });
  } catch (err) { console.log("STATUS UPDATE ERROR:",err); res.status(500).json({ message:err.message || "failed" }); }
});

router.put("/bookings/:id", async (req,res) => {
  try {
    const allowed = ["title","name","idNumber","email","phone","address","purpose","date","slot","status","bookingType"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    if (update.email) update.email = String(update.email).trim().toLowerCase();
    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new:true, runValidators:true });
    if (!booking) return res.status(404).json({ message:"Booking not found" });
    res.json({ message:"Live appointment updated", booking });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message:"That service/date/slot is already booked." });
    console.log("BOOKING EDIT ERROR:",err); res.status(500).json({ message:err.message || "Update failed" });
  }
});

router.delete("/bookings/:id", async (req,res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message:"Booking not found" });
    res.json({ message:"Live appointment deleted" });
  } catch (err) { console.log("BOOKING DELETE ERROR:",err); res.status(500).json({ message:err.message || "Delete failed" }); }
});

// ---------------- EXCEL IMPORTS ----------------
router.get("/imports/:serviceType", async (req,res) => {
  try {
    const service = cleanService(req.params.serviceType); if (!service) return res.status(400).json({message:"Invalid service type"});
    const rows = await ImportedAppointment.find({serviceType:service}).sort({ appointmentDate:1, appointmentTime:1, createdAt:1 });
    res.json(rows.map(importedToClient));
  } catch (err) { console.log("IMPORT LIST ERROR:",err); res.status(500).json({message:"Failed to load Excel appointments"}); }
});

router.post("/imports/:serviceType/excel", excelUpload.single("file"), async (req,res) => {
  try {
    const service = cleanService(req.params.serviceType); if (!service) return res.status(400).json({message:"Invalid service type"});
    if (!req.file) return res.status(400).json({message:"Please select an Excel file"});
    const workbook = XLSX.read(req.file.buffer, { type:"buffer", cellDates:true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({message:"Excel file has no worksheet"});
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval:"" });
    if (!rows.length) return res.status(400).json({message:"The Excel sheet is empty"});

    let imported = 0, updated = 0, skipped = 0;
    for (let i=0;i<rows.length;i++) {
      const normalized = normalizeImportedRow(rows[i], service, i, req.file.originalname);
      if (!normalized.name && !normalized.reference && !normalized.appointmentDate) { skipped++; continue; }
      const key = { serviceType:service, reference:normalized.reference, appointmentDate:normalized.appointmentDate };
      const existing = await ImportedAppointment.findOne(key);
      await ImportedAppointment.findOneAndUpdate(key, normalized, { upsert:true, new:true, setDefaultsOnInsert:true });
      if (existing) updated++; else imported++;
    }
    res.status(201).json({ message:`Excel uploaded successfully`, serviceType:service, fileName:req.file.originalname, totalRows:rows.length, imported, updated, skipped });
  } catch (err) {
    console.log("EXCEL IMPORT ERROR:",err);
    res.status(500).json({message:err.message || "Excel import failed"});
  }
});

router.put("/imports/:serviceType/:id", async (req,res) => {
  try {
    const service = cleanService(req.params.serviceType); if (!service) return res.status(400).json({message:"Invalid service type"});
    const allowed = ["reference","appointmentDate","appointmentTime","name","email","mobile","rawData"];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    if (update.email !== undefined) update.email = String(update.email).trim().toLowerCase();
    const row = await ImportedAppointment.findOneAndUpdate({ _id:req.params.id, serviceType:service }, update, { new:true, runValidators:true });
    if (!row) return res.status(404).json({message:"Excel appointment not found"});
    res.json({message:"Excel appointment updated", row:importedToClient(row)});
  } catch (err) { console.log("IMPORT EDIT ERROR:",err); res.status(500).json({message:err.message || "Update failed"}); }
});

router.delete("/imports/:serviceType/:id", async (req,res) => {
  try {
    const service = cleanService(req.params.serviceType); if (!service) return res.status(400).json({message:"Invalid service type"});
    const row = await ImportedAppointment.findOneAndDelete({_id:req.params.id, serviceType:service});
    if (!row) return res.status(404).json({message:"Excel appointment not found"});
    res.json({message:"Excel appointment deleted"});
  } catch (err) { console.log("IMPORT DELETE ERROR:",err); res.status(500).json({message:err.message || "Delete failed"}); }
});

async function combinedRows(serviceType, date) {
  const liveQuery = { serviceType };
  const excelQuery = { serviceType };
  if (date) { liveQuery.date=date; excelQuery.appointmentDate=date; }
  const [live, excel] = await Promise.all([
    Booking.find(liveQuery).sort({date:1,slot:1,createdAt:1}),
    ImportedAppointment.find(excelQuery).sort({appointmentDate:1,appointmentTime:1,createdAt:1}),
  ]);
  return [...live.map(bookingToClient), ...excel.map(importedToClient)].sort((a,b) => {
    const ad = `${a.appointmentDate||a.date||""} ${a.appointmentTime||a.slot||""}`;
    const bd = `${b.appointmentDate||b.date||""} ${b.appointmentTime||b.slot||""}`;
    return ad.localeCompare(bd) || String(a.name||"").localeCompare(String(b.name||""));
  });
}

router.get("/appointments/:serviceType/download", async (req,res) => {
  try {
    const service = cleanService(req.params.serviceType); if (!service) return res.status(400).json({message:"Invalid service type"});
    const date = cleanText(req.query.date);
    const rows = await combinedRows(service, date || null);
    const exportRows = rows.map(r => ({
      Source: r.sourceLabel || r.source,
      Reference: r.reference || r.token || "",
      Date: r.appointmentDate || r.date || "",
      Time: r.appointmentTime || r.slot || "",
      Name: r.name || "",
      Email: r.email || "",
      Mobile: r.mobile || r.phone || "",
      "ID Number": r.idNumber || "",
      Purpose: r.purpose || "",
      Status: r.status || "",
      "Source File": r.sourceFileName || "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows.length ? exportRows : [{Source:"",Reference:"",Date:date,Time:"",Name:"",Email:"",Mobile:"", "ID Number":"", Purpose:"", Status:"", "Source File":""}]);
    XLSX.utils.book_append_sheet(wb, ws, service === "birth_certificate" ? "Birth Certificate" : service === "passport" ? "Passport" : "Other Services");
    const buffer = XLSX.write(wb,{type:"buffer",bookType:"xlsx"});
    const suffix = date ? `-${date}` : "-all";
    const file = `${service}${suffix}.xlsx`;
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",`attachment; filename="${file}"`);
    res.send(buffer);
  } catch (err) { console.log("EXPORT ERROR:",err); res.status(500).json({message:"Excel download failed"}); }
});

router.get("/appointments/:serviceType/dates", async (req,res) => {
  try {
    const service = cleanService(req.params.serviceType); if (!service) return res.status(400).json({message:"Invalid service type"});
    const [live, excel] = await Promise.all([
      Booking.distinct("date", {serviceType:service}),
      ImportedAppointment.distinct("appointmentDate", {serviceType:service}),
    ]);
    res.json([...new Set([...live,...excel].filter(Boolean))].sort());
  } catch (err) { res.status(500).json({message:"Failed to load dates"}); }
});

router.get("/appointments/:serviceType", async (req,res) => {
  try {
    const service = cleanService(req.params.serviceType); if (!service) return res.status(400).json({message:"Invalid service type"});
    res.json(await combinedRows(service));
  } catch (err) { console.log("COMBINED APPOINTMENTS ERROR:",err); res.status(500).json({message:"Failed to load appointments"}); }
});


// Multer / generic errors.
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({message:`Upload error: ${err.message}`});
  if (err) return res.status(400).json({message:err.message || "Request failed"});
  next();
});

module.exports = router;
