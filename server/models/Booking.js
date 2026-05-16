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

required:true,

unique:true

},


phone:{

type:String,

required:true

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

type:String,

default:""

},


status:{

type:String,

enum:[
"ongoing",
"completed",
"no participate"
],

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