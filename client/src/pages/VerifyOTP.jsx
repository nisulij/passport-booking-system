import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VerifyOTP() {

  const navigate = useNavigate();

  const [otp, setOtp] = useState("");

  const [loading, setLoading] =
    useState(false);

  const adminEmail =
    localStorage.getItem(
      "adminEmail"
    );


  const verifyOTP =
  async()=>{

    if(!otp){

      alert(
        "Enter OTP"
      );

      return;

    }

    setLoading(true);

    try{

      const res=
      await fetch(

      "https://passport-booking-app.onrender.com/api/admin/verify-otp",

      {

      method:"POST",

      headers:{

      "Content-Type":
      "application/json"

      },

      body:JSON.stringify({

      email:
      adminEmail,

      otp

      })

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

      "adminToken",

      data.token

      );


      navigate(
      "/dashboard"
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


  return (

<div
style={{

minHeight:"100vh",

display:"flex",

justifyContent:"center",

alignItems:"center",

background:"#faf9f7",

fontFamily:
"'DM Sans', sans-serif"

}}
>

<div
style={{

width:"400px",

background:"#fff",

padding:"40px",

borderRadius:"20px",

boxShadow:
"0 8px 30px rgba(0,0,0,.08)"

}}
>

<div
style={{

textAlign:"center",

marginBottom:"25px"

}}
>

<div
style={{

fontSize:"42px",

marginBottom:"10px"

}}
>

🔐

</div>

<h1
style={{

fontSize:"28px",

color:"#1a1a2e"

}}
>

Verify OTP

</h1>

<p
style={{

color:"#888",

fontSize:"14px",

marginTop:"10px"

}}
>

OTP sent to

<br/>

<b>

{adminEmail}

</b>

</p>

</div>


<input

placeholder="Enter 6-digit OTP"

value={otp}

onChange={(e)=>

setOtp(
e.target.value
)

}

style={{

width:"100%",

padding:"14px",

border:
"1px solid #ddd",

borderRadius:"10px",

fontSize:"18px",

textAlign:"center",

letterSpacing:"6px",

marginBottom:"20px"

}}

/>


<button

onClick={
verifyOTP
}

style={{

width:"100%",

padding:"14px",

background:"#1a1a2e",

color:"#fff",

border:"none",

borderRadius:"10px",

fontWeight:"600",

cursor:"pointer"

}}

>

{

loading

?

"Verifying..."

:

"Verify OTP"

}

</button>


<div
style={{

marginTop:"20px",

textAlign:"center"

}}
>

<button

onClick={()=>
navigate(
"/admin-login"
)
}

style={{

background:"none",

border:"none",

color:"#6c4fe0",

cursor:"pointer"

}}

>

← Back to Login

</button>

</div>

</div>

</div>

)

}