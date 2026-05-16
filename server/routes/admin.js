const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

const Admin = require("../models/Admin");
const Booking = require("../models/Booking");

const router = express.Router();


// CHECK ADMIN EXISTS

router.get("/exists", async(req,res)=>{

try{

const count=
await Admin.countDocuments();

res.json({

exists:
count>0

});

}

catch{

res.status(500)
.json({

exists:false

});

}

});




// FIRST ADMIN SIGNUP ONLY

router.post("/signup",async(req,res)=>{

try{

const count=
await Admin.countDocuments();

if(count>0){

return res
.status(400)
.json({

message:
"Signup disabled"

});

}


const{
email,
password
}=req.body;


const hash=
await bcrypt.hash(
password,
10
);


await Admin.create({

email,

password:hash

});


res.json({

message:
"Admin account created"

});

}

catch(err){

console.log(err);

res.status(500)
.json({

message:
"Server error"

});

}

});




// LOGIN + SEND OTP

router.post("/login",async(req,res)=>{

try{

const{
email,
password
}=req.body;


const admin=
await Admin.findOne({
email
});


if(!admin){

return res
.status(400)
.json({

message:
"Admin not found"

});

}


const valid=
await bcrypt.compare(
password,
admin.password
);


if(!valid){

return res
.status(400)
.json({

message:
"Incorrect password"

});

}



const otp=
otpGenerator.generate(
6,
{
upperCaseAlphabets:false,
lowerCaseAlphabets:false,
specialChars:false
}
);


admin.otp=otp;

admin.otpExpiry=
Date.now()+300000;

await admin.save();



const transporter=
nodemailer.createTransport({

service:"gmail",

auth:{

user:
process.env.EMAIL,

pass:
process.env.EMAIL_PASSWORD

}

});



await transporter.sendMail({

from:
process.env.EMAIL,

to:
email,

subject:
"Passport Admin OTP",

text:
`Your OTP: ${otp}

Expires in 5 minutes.`

});


res.json({

message:
"OTP sent"

});

}

catch(err){

console.log(err);

res.status(500)
.json({

message:
"Login failed"

});

}

});




// VERIFY OTP

router.post("/verify-otp",async(req,res)=>{

try{

const{
email,
otp
}=req.body;


const admin=
await Admin.findOne({
email
});


if(!admin){

return res
.status(400)
.json({

message:
"Admin not found"

});

}


if(admin.otp!==otp){

return res
.status(400)
.json({

message:
"Invalid OTP"

});

}


if(Date.now()>admin.otpExpiry){

return res
.status(400)
.json({

message:
"OTP expired"

});

}


const token=
jwt.sign(

{

id:admin._id

},

process.env.JWT_SECRET,

{

expiresIn:"1d"

}

);


admin.otp="";

await admin.save();


res.json({

message:
"Success",

token

});

}

catch(err){

console.log(err);

res.status(500)
.json({

message:
"Verification failed"

});

}

});




// DASHBOARD GET BOOKINGS

router.get(
"/bookings",

async(req,res)=>{

try{

const bookings=

await Booking.find()
.sort({

createdAt:-1

});

res.json(
bookings
);

}

catch(err){

console.log(err);

res.status(500)
.json([]);

}

});




// UPDATE BOOKING STATUS

router.put(
"/status/:id",

async(req,res)=>{

try{

await Booking.findByIdAndUpdate(

req.params.id,

{

status:
req.body.status

}

);

res.json({

message:
"updated"

});

}

catch{

res.status(500)
.json({

message:
"failed"

});

}

});



module.exports=router;