const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(

{

title:{
type:String,
required:true
},

name:{
type:String,
required:true
},

idNumber:{
type:String,
required:true
},

email:{
type:String,
required:true
},

phone:{
type:String,
required:true
},

address:{
type:String
},

purpose:{
type:String
},

date:{
type:String,
required:true
},

slot:{
type:String,
required:true
},

token:{
type:String
},

status:{
type:String,
default:"ongoing"
}

},

{
timestamps:true
}

);

module.exports =
mongoose.model(
"Booking",
bookingSchema
);