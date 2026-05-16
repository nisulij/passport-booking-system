const mongoose=require("mongoose");

const adminSchema=
new mongoose.Schema({

email:{
type:String,
unique:true
},

password:String,

otp:String,

otpExpiry:Date

});

module.exports=
mongoose.model(
"Admin",
adminSchema
);