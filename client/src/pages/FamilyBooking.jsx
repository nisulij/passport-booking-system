import { useEffect, useState } from "react";

export default function FamilyBooking(){

const TODAY=
new Date().toISOString().split("T")[0];

const [step,setStep]=useState(1);

const [email,setEmail]=useState("");

const [date,setDate]=useState("");

const [bookedSlots,setBookedSlots]=useState([]);

const [tokens,setTokens]=useState([]);

const [done,setDone]=useState(false);

const [members,setMembers]=useState([

{
name:"",
id:"",
phone:"",
address:"",
purpose:"New Passport",
slot:""
},

{
name:"",
id:"",
phone:"",
address:"",
purpose:"New Passport",
slot:""
}

]);

function generateSlots(){

const arr=[];

for(let h=9; h<13; h++){

for(let m=0; m<60; m+=5){

const start=
`${h}:${String(m).padStart(2,"0")}`;

let em=m+5;
let eh=h;

if(em===60){
em=0;
eh++;
}

arr.push(
`${start} - ${eh}:${String(em).padStart(2,"0")}`
);

}

}

return arr;

}

const slots=generateSlots();

useEffect(()=>{

if(!date) return;

fetch(
`https://passport-booking-app.onrender.com/api/slots/${date}`
)

.then(r=>r.json())

.then(data=>{

setBookedSlots(data);

});

},[date]);

const update=(i,key,val)=>{

const copy=[...members];

copy[i][key]=val;

setMembers(copy);

};

const submit=async()=>{

try{

const res=
await fetch(

"https://passport-booking-app.onrender.com/api/family-book",

{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

email,
date,
members

})

}

);

const data=
await res.json();

if(!res.ok){

throw new Error(data.message);

}

setTokens(data.tokens);
setDone(true);

}

catch(err){

alert(err.message);

}

};

if(done){

return(

<div style={{
minHeight:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"#f7f4ef",
fontFamily:"sans-serif"
}}>

<div style={{
background:"#fff",
padding:"50px",
borderRadius:"25px",
width:"700px",
boxShadow:"0 10px 40px rgba(0,0,0,.08)"
}}>

<h1 style={{textAlign:"center"}}>
Family Booking Confirmed
</h1>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
gap:"20px",
marginTop:"40px"
}}>

{
tokens.map((t,i)=>(

<div
key={i}
style={{
padding:"25px",
borderRadius:"18px",
background:"#f5f7ff",
textAlign:"center"
}}
>

<h2>{t}</h2>

<p>Member {i+1}</p>

</div>

))
}

</div>

</div>

</div>

)

}

return(

<div style={{
minHeight:"100vh",
background:"#f7f4ef",
padding:"40px",
fontFamily:"sans-serif"
}}>

<div style={{
maxWidth:"1300px",
margin:"0 auto",
display:"grid",
gridTemplateColumns:"1fr 420px",
gap:"30px"
}}>

<div style={{
background:"#fff",
padding:"35px",
borderRadius:"25px"
}}>

<div style={{
display:"flex",
gap:"15px",
marginBottom:"30px"
}}>

<div style={{
flex:1,
padding:"16px",
borderRadius:"14px",
background:step===1?"#1f3f72":"#f2f2f2",
color:step===1?"#fff":"#999"
}}>
1 Personal Details
</div>

<div style={{
flex:1,
padding:"16px",
borderRadius:"14px",
background:step===2?"#1f3f72":"#f2f2f2",
color:step===2?"#fff":"#999"
}}>
2 Date & Time
</div>

</div>

{
step===1 && (

<>

<label>Family Email</label>

<input
style={input}
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

{
members.map((m,index)=>(

<div
key={index}
style={{
padding:"20px",
marginTop:"20px",
border:"1px solid #eee",
borderRadius:"18px"
}}
>

<h3>
Member {index+1}
</h3>

<input
style={input}
placeholder="Full Name"
value={m.name}
onChange={(e)=>update(index,"name",e.target.value)}
/>

<input
style={input}
placeholder="ID Number"
value={m.id}
onChange={(e)=>update(index,"id",e.target.value)}
/>

<input
style={input}
placeholder="Phone"
value={m.phone}
onChange={(e)=>
update(
index,
"phone",
e.target.value.replace(/\D/g,"")
)
}
/>

<input
style={input}
placeholder="Address"
value={m.address}
onChange={(e)=>update(index,"address",e.target.value)}
/>

<select
style={input}
value={m.purpose}
onChange={(e)=>update(index,"purpose",e.target.value)}
>

<option>New Passport</option>
<option>Renew Passport</option>
<option>Lost Passport</option>
<option>Damaged Passport</option>

</select>

</div>

))
}

<button
style={btn}
onClick={()=>setStep(2)}
>
Continue
</button>

</>

)

}

{
step===2 && (

<>

<button
onClick={()=>setStep(1)}
style={{
marginBottom:"20px",
background:"none",
border:"none",
cursor:"pointer"
}}
>
← Back
</button>

<label>Date</label>

<input
type="date"
min={TODAY}
style={input}
value={date}
onChange={(e)=>setDate(e.target.value)}
/>

{
members.map((m,index)=>(

<div key={index}>

<label>
Member {index+1} Slot
</label>

<select
style={input}
value={m.slot}
onChange={(e)=>update(index,"slot",e.target.value)}
>

<option value="">
Select Slot
</option>

{
slots.map(slot=>(

<option
key={slot}
value={slot}
disabled={
bookedSlots.includes(slot)
}

>

{slot}

</option>

))
}

</select>

</div>

))
}

<button
style={btn}
onClick={submit}
>
Confirm Family Booking
</button>

</>

)

}

</div>

<div style={{
background:"#fff",
padding:"30px",
borderRadius:"25px",
height:"fit-content"
}}>

<h2>Available Slots</h2>

<div style={{
display:"flex",
flexWrap:"wrap",
gap:"8px",
marginTop:"25px"
}}>

{
slots.map(slot=>(

<div
key={slot}
style={{

padding:"8px 12px",

borderRadius:"10px",

fontSize:"13px",

border:"1px solid #9ec5ff",

background:
bookedSlots.includes(slot)
?"#efefef"
:"#e9f2ff",

opacity:
bookedSlots.includes(slot)
?0.4
:1

}}
>

{slot}

</div>

))
}

</div>

</div>

</div>

</div>

)

}

const input={

width:"100%",
padding:"14px",
marginTop:"10px",
marginBottom:"16px",
border:"1px solid #ddd",
borderRadius:"12px"

};

const btn={

width:"100%",
padding:"16px",
background:"#1f3f72",
color:"#fff",
border:"none",
borderRadius:"14px",
fontWeight:"600",
cursor:"pointer",
marginTop:"15px"

};
