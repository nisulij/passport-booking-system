import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminSignup() {

const navigate=
useNavigate();

const [form,setForm]=
useState({

email:"",
password:""

});

const submit=
async()=>{

try{

const res=
await fetch(

"http://localhost:5000/api/admin/signup",

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

alert(
"Admin created"
);

navigate(
"/admin-login"
);

}

catch(err){

alert(
err.message
);

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
width:"350px"
}}
>

<h1>

Admin Signup

</h1>

<br/>

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

/>

<br/><br/>

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

/>

<br/><br/>

<button
onClick={submit}
>

Create Admin

</button>

</div>

</div>

)

}