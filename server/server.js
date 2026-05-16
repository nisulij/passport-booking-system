require("dotenv").config();

console.log(
"EMAIL:",
process.env.EMAIL || "missing"
);

console.log(
"EMAIL_PASS:",
process.env.EMAIL_PASS ? "loaded" : "missing"
);

const express=require("express");
const mongoose=require("mongoose");
const cors=require("cors");

const bookingRoutes=
require("./routes/booking");

const adminRoutes=
require("./routes/admin");

const app=express();


// CORS FIX

app.use(

cors({

origin:true,

credentials:true,

methods:[
"GET",
"POST",
"PUT",
"DELETE"
],

allowedHeaders:[
"Content-Type",
"Authorization"
]

})

);


app.use(
express.json()
);


app.use(
"/api",
bookingRoutes
);

app.use(
"/api/admin",
adminRoutes
);


app.get(
"/",
(req,res)=>{

res.send(
"Passport API running"
);

}
);


mongoose
.connect(
process.env.MONGO_URL
)

.then(()=>{

console.log(
"MongoDB Connected"
);

})

.catch((err)=>{

console.log(
"Mongo Error:",
err
);

});


const PORT=
process.env.PORT || 5000;


app.listen(

PORT,

()=>{

console.log(
`Server running on port ${PORT}`
);

});