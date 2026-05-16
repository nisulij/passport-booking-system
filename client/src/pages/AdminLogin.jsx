import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {

const navigate=
useNavigate();

const[
adminExists,
setAdminExists
]=useState(true);

const[
form,
setForm
]=useState({

email:"",
password:""

});

const[
loading,
setLoading
]=useState(false);


useEffect(()=>{

fetch(
"https://passport-booking-app.onrender.com/api/admin/exists"
)

.then(r=>r.json())

.then(data=>{

setAdminExists(
data.exists
)

})

},[]);



const login=
async()=>{

setLoading(true);

try{

const res=
await fetch(

"https://passport-booking-app.onrender.com/api/admin/login",

{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:JSON.stringify(
form
)

}

);


const data=
await res.json();


if(!res.ok){

throw new Error(
data.message
);

}


localStorage.setItem(

"adminEmail",

form.email

);

navigate(
"/verify-otp"
);

}

catch(err){

alert(
err.message
);

}

finally{

setLoading(false);

}

};


return(

<div
style={{

minHeight:"100vh",

display:"flex",

justifyContent:"center",

alignItems:"center",

background:"#faf9f7"

}}
>

<div
style={{

background:"#fff",

padding:"40px",

borderRadius:"20px",

width:"380px",

boxShadow:
"0 8px 30px rgba(0,0,0,.06)"

}}
>

<h1
style={{

marginBottom:"30px"

}}
>

Admin Login

</h1>


{

!adminExists &&

<button

style={{

marginBottom:"20px"

}}

onClick={()=>

navigate(
"/admin-signup"
)

}

>

Create First Admin

</button>

}



<input

placeholder="Admin Email"

value={form.email}

onChange={(e)=>

setForm({

...form,

email:
e.target.value

})

}

style={{

width:"100%",

padding:"12px",

marginBottom:"16px"

}}

/>



<input

type="password"

placeholder="Password"

value={form.password}

onChange={(e)=>

setForm({

...form,

password:
e.target.value

})

}

style={{

width:"100%",

padding:"12px",

marginBottom:"20px"

}}

/>


<button

onClick={login}

style={{

width:"100%",

padding:"14px",

background:"#1a1a2e",

color:"#fff",

border:"none",

borderRadius:"10px"

}}

>

{

loading

?

"Loading..."

:

"Login"

}

</button>

</div>

</div>

)

}