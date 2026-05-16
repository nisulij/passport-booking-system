const express = require("express");

const router = express.Router();

const Booking = require("../models/Booking");



// GET BOOKED SLOTS

router.get(
"/slots/:date",

async(req,res)=>{

try{

const bookings=

await Booking.find({

date:req.params.date

});


const bookedSlots=

bookings.map(

b=>b.slot

);


res.json(
bookedSlots
);

}

catch(err){

console.log(err);

res.status(500)
.json([]);

}

});




// ALL BOOKINGS FOR DASHBOARD

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




// UPDATE STATUS

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

catch(err){

console.log(err);

res.status(500)
.json({

message:
"update failed"

});

}

});






// FAMILY BOOKING

router.post(
"/family-book",

async(req,res)=>{

try{

const {

email,

date,

members

}=req.body;



if(

!email ||

!date ||

!members ||

members.length===0

){

return res
.status(400)
.json({

message:
"Missing data"

});

}



const count=

await Booking.countDocuments();


const familyId=

"F"+

String(
count+1
)

.padStart(
3,
"0"
);


const tokens=[];



for(

let i=0;

i<members.length;

i++

){

const member=
members[i];



const slotExists=

await Booking.findOne({

date,

slot:
member.slot

});


if(slotExists){

return res
.status(400)
.json({

message:
`${member.slot} already booked`

});

}



const token=

`${familyId}-${i+1}`;


tokens.push(
token
);



await Booking.create({

title:
"Family",

name:
member.name,

idNumber:
member.id,

phone:
member.phone,

email,

date,

slot:
member.slot,

token,

status:
"ongoing"

});

}



res.json({

message:
"Family booking successful",

tokens

});

}

catch(err){

console.log(

"FAMILY ERROR:",

err

);

res
.status(500)
.json({

message:
err.message

});

}

});






// INDIVIDUAL BOOKING

router.post(
"/book",

async(req,res)=>{

try{

const data=
req.body;



const existing=

await Booking.findOne({

email:
data.email,

title:{

$ne:"Family"

}

});


if(existing){

return res
.status(400)
.json({

message:
"Email already used"

});

}



const slotExists=

await Booking.findOne({

date:
data.date,

slot:
data.slot

});


if(slotExists){

return res
.status(400)
.json({

message:
"Slot already booked"

});

}



const count=

await Booking.countDocuments();



const token=

"T"+

String(
count+1
)

.padStart(
3,
"0"
);



const booking=

new Booking({

...data,

token,

status:
"ongoing"

});


await booking.save();



res.json({

message:
"Booking success",

token

});

}

catch(err){

console.log(err);

res
.status(500)
.json({

message:
"Server error"

});

}

});



module.exports=router;