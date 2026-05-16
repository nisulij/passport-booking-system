import { useState, useEffect } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Jost:wght@300;400;500;600&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%,100% { opacity: 0.45; }
    50%      { opacity: 1; }
  }
  @keyframes pulseDot {
    0%,100% { box-shadow: 0 0 0 0 rgba(110,168,110,0.55); }
    50%      { box-shadow: 0 0 0 7px rgba(110,168,110,0); }
  }
  @keyframes floatBlob {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(18px,-12px) scale(1.04); }
    66%      { transform: translate(-10px,10px) scale(0.97); }
  }

  .fb-wrap * { box-sizing: border-box; margin: 0; padding: 0; }

  .fb-blob {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(80px);
    animation: floatBlob 12s ease-in-out infinite;
  }
  .fb-blob-1 {
    width: 520px; height: 520px;
    top: -160px; right: -160px;
    background: radial-gradient(circle, rgba(195,220,180,0.45) 0%, transparent 65%);
    animation-delay: 0s;
  }
  .fb-blob-2 {
    width: 420px; height: 420px;
    bottom: -120px; left: -100px;
    background: radial-gradient(circle, rgba(212,185,130,0.35) 0%, transparent 65%);
    animation-delay: -5s;
  }
  .fb-blob-3 {
    width: 300px; height: 300px;
    top: 45%; left: 40%;
    background: radial-gradient(circle, rgba(180,210,195,0.25) 0%, transparent 65%);
    animation-delay: -9s;
  }

  .fb-wrap input,
  .fb-wrap select {
    display: block;
    width: 100%;
    padding: 13px 16px;
    margin-top: 7px;
    margin-bottom: 18px;
    background: rgba(255,255,255,0.72);
    border: 1.5px solid rgba(180,160,110,0.25);
    border-radius: 13px;
    color: #2c2417;
    font-family: 'Jost', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
    appearance: none;
    -webkit-appearance: none;
    box-shadow: 0 1px 4px rgba(100,80,40,0.06);
  }
  .fb-wrap input::placeholder { color: rgba(44,36,23,0.3); }
  .fb-wrap input:focus,
  .fb-wrap select:focus {
    border-color: rgba(110,168,110,0.7);
    background: rgba(255,255,255,0.92);
    box-shadow: 0 0 0 4px rgba(110,168,110,0.12), 0 2px 8px rgba(100,80,40,0.08);
  }
  .fb-wrap input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.3) sepia(0.4) hue-rotate(60deg);
    cursor: pointer;
  }
  .fb-wrap option { background: #faf7f2; color: #2c2417; }

  .fb-label {
    display: block;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(110,168,110,0.9);
    font-family: 'Jost', sans-serif;
  }

  .fb-card {
    background: rgba(255,255,255,0.58);
    border: 1.5px solid rgba(200,185,145,0.28);
    border-radius: 28px;
    padding: 34px;
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    box-shadow: 0 4px 32px rgba(100,80,40,0.08), 0 1px 0 rgba(255,255,255,0.9) inset;
  }

  .fb-member-card {
    margin-top: 20px;
    padding: 24px;
    border: 1.5px solid rgba(180,160,110,0.18);
    border-radius: 20px;
    background: rgba(255,255,255,0.5);
    transition: border-color 0.25s, box-shadow 0.25s;
    box-shadow: 0 2px 10px rgba(100,80,40,0.04);
  }
  .fb-member-card:hover {
    border-color: rgba(110,168,110,0.4);
    box-shadow: 0 4px 18px rgba(110,168,110,0.1);
  }

  .fb-submit {
    display: block;
    width: 100%;
    padding: 17px;
    margin-top: 28px;
    background: linear-gradient(135deg, #6ea870 0%, #4d8f50 100%);
    color: #fff;
    border: none;
    border-radius: 14px;
    font-family: 'Jost', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
    box-shadow: 0 6px 24px rgba(78,143,80,0.3), 0 1px 0 rgba(255,255,255,0.25) inset;
  }
  .fb-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 36px rgba(78,143,80,0.4), 0 1px 0 rgba(255,255,255,0.25) inset;
  }
  .fb-submit:active { transform: translateY(0); }

  .fb-slot {
    padding: 7px 11px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Jost', sans-serif;
    letter-spacing: 0.02em;
    cursor: default;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .fb-slot:hover { transform: scale(1.07); box-shadow: 0 3px 10px rgba(80,80,80,0.1); }

  .fb-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(180,160,110,0.3), transparent);
    margin: 10px 0 26px;
  }

  .fb-section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(44,36,23,0.3);
    font-family: 'Jost', sans-serif;
    margin-bottom: 22px;
  }

  .fb-animate  { animation: fadeUp 0.55s ease both; }
  .fb-animate2 { animation: fadeUp 0.55s ease 0.12s both; }
  .fb-animate3 { animation: fadeUp 0.55s ease 0.24s both; }

  .fb-select-wrap { position: relative; }
  .fb-select-wrap::after {
    content: '▾';
    position: absolute;
    right: 16px; top: 50%;
    transform: translateY(-50%);
    color: rgba(110,168,110,0.7);
    font-size: 14px;
    pointer-events: none;
  }

  .fb-right-panel::-webkit-scrollbar { width: 5px; }
  .fb-right-panel::-webkit-scrollbar-track { background: transparent; }
  .fb-right-panel::-webkit-scrollbar-thumb { background: rgba(110,168,110,0.3); border-radius: 10px; }
`;

export default function FamilyBooking() {

  const [familyCount, setFamilyCount] = useState(2);
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [tokens,setTokens]=useState([]);
  const [bookingDone,setBookingDone]=useState(false);
  const [members, setMembers] = useState([
    { name: "", id: "", phone: "", slot: "" },
    { name: "", id: "", phone: "", slot: "" }
  ]);

  function generateSlots() {
    const slots = [];
    for (let h = 9; h < 17; h++) {
      for (let m = 0; m < 60; m += 5) {
        const start = `${h}:${m.toString().padStart(2, "0")}`;
        let endM = m + 5;
        let endH = h;
        if (endM === 60) { endM = 0; endH++; }
        slots.push(`${start} - ${endH}:${endM.toString().padStart(2, "0")}`);
      }
    }
    return slots;
  }

  const slots = generateSlots();

  useEffect(() => {
    if (!date) return;
    fetch(`https://passport-booking-app.onrender.com/api/slots/${date}`)
      .then(r => r.json())
      .then(data => { setBookedSlots(data); });
  }, [date]);

  const changeCount = (n) => {
    setFamilyCount(n);
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({ name: "", id: "", phone: "", slot: "" });
    }
    setMembers(arr);
  };

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

const submit = async()=>{

const chosen=
members.map(
m=>m.slot
);

const duplicates=
chosen.filter(

(item,index)=>

chosen.indexOf(item)!==index

);

if(duplicates.length){

alert(
"Two members cannot use same slot"
);

return;

}

try{

const res=
await fetch(

"https://passport-booking-app.onrender.com/api/family-book",

{

method:"POST",

headers:{
"Content-Type":
"application/json"
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

throw new Error(
data.message
);

}

setTokens(
data.tokens
);

setBookingDone(
true
);

}
catch(err){

alert(
err.message
);

}

};

const available = slots.length - bookedSlots.length;


if(bookingDone){

return(

<div
className="fb-wrap"
style={{
minHeight:"100vh",
background:"#f5f0e8",
padding:"60px",
fontFamily:"'Jost',sans-serif"
}}
>

<style>{STYLES}</style>

<div className="fb-blob fb-blob-1"/>
<div className="fb-blob fb-blob-2"/>
<div className="fb-blob fb-blob-3"/>

<div
className="fb-card"
style={{

maxWidth:"1000px",

margin:"0 auto",

padding:"55px",

textAlign:"center"

}}
>

<div
style={{
fontSize:"70px",
marginBottom:"15px"
}}
>

✅

</div>

<h1
style={{

fontFamily:"'Playfair Display', serif",

fontSize:"44px",

marginBottom:"12px"

}}
>

Family Booking Confirmed

</h1>

<p
style={{

color:"rgba(44,36,23,.55)",

marginBottom:"40px"

}}
>

Appointment tokens generated successfully

</p>


<div
style={{

display:"grid",

gridTemplateColumns:
"repeat(auto-fit,minmax(220px,1fr))",

gap:"18px"

}}
>

{

tokens.map(

(token,index)=>(

<div

key={index}

className="fb-member-card"

style={{

marginTop:0

}}

>

<div
style={{

fontSize:"11px",

letterSpacing:".14em",

textTransform:"uppercase",

color:"rgba(44,36,23,.35)"

}}
>

Member {index+1}

</div>

<div
style={{

fontSize:"32px",

fontWeight:"700",

color:"#4a8f4a",

margin:"15px 0"

}}
>

{token}

</div>

<div
style={{
color:"rgba(44,36,23,.45)"
}}
>

Appointment Token

</div>

</div>

)

)

}

</div>


<button

className="fb-submit"

style={{

maxWidth:"300px",

margin:"40px auto 0"

}}

onClick={()=>{

setBookingDone(false);

setTokens([]);

window.location.reload();

}}

>

New Family Booking

</button>

</div>

</div>

)

}

return (
    <div
      className="fb-wrap"
      style={{
        minHeight: "100vh",
        background: "#f5f0e8",
        padding: "44px 36px",
        fontFamily: "'Jost', sans-serif",
        color: "#2c2417",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{STYLES}</style>

      {/* Decorative background blobs */}
      <div className="fb-blob fb-blob-1" />
      <div className="fb-blob fb-blob-2" />
      <div className="fb-blob fb-blob-3" />

      {/* ── HEADER ── */}
      <div
        className="fb-animate"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "40px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <div style={{ width: "28px", height: "1px", background: "rgba(110,168,110,0.7)" }} />
            <p style={{
              fontSize: "10.5px", letterSpacing: "0.22em", textTransform: "uppercase",
              color: "rgba(110,168,110,0.9)", fontWeight: 600,
            }}>
              Medical Scheduling
            </p>
            <div style={{ width: "28px", height: "1px", background: "rgba(110,168,110,0.7)" }} />
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "46px", fontWeight: 500, lineHeight: 1.04,
            color: "#2c2417", letterSpacing: "-0.01em",
          }}>
            Family Appointment
          </h1>
          <p style={{
            color: "rgba(44,36,23,0.45)", fontSize: "15px",
            marginTop: "9px", fontWeight: 300, letterSpacing: "0.02em",
          }}>
            Book multiple family members simultaneously
          </p>
        </div>

        <div style={{
          padding: "11px 22px",
          background: available > 20 ? "rgba(110,168,110,0.1)" : "rgba(212,168,83,0.1)",
          border: `1.5px solid ${available > 20 ? "rgba(110,168,110,0.3)" : "rgba(212,168,83,0.35)"}`,
          borderRadius: "40px",
          display: "flex", alignItems: "center", gap: "10px",
          fontSize: "14px", fontWeight: 500,
          color: available > 20 ? "#4a8f4a" : "#8a6520",
          marginTop: "6px",
          boxShadow: available > 20 ? "0 2px 12px rgba(110,168,110,0.1)" : "0 2px 12px rgba(212,168,83,0.1)",
        }}>
          <span style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: available > 20 ? "#6ea870" : "#c9a84c",
            display: "inline-block",
            animation: available > 20 ? "pulseDot 2s infinite" : "shimmer 2s infinite",
          }} />
          {available}&nbsp;slots available
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: "24px",
      }}>

        {/* ── LEFT PANEL – Form ── */}
        <div className="fb-card fb-animate2">

          <p className="fb-section-label">Contact &amp; Scheduling</p>

          <label className="fb-label">Family Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="family@gmail.com"
          />

          <label className="fb-label">Appointment Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label className="fb-label">Family Members</label>
          <div className="fb-select-wrap">
            <select
              value={familyCount}
              onChange={(e) => changeCount(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map(n => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="fb-divider" />
          <p className="fb-section-label">Member Details</p>

          {members.map((m, index) => (
            <div key={index} className="fb-member-card">

              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                marginBottom: "18px",
              }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: "rgba(110,168,110,0.1)",
                  border: "1.5px solid rgba(110,168,110,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", fontWeight: 600, color: "#4a8f4a",
                  flexShrink: 0,
                }}>
                  {index + 1}
                </div>
                <span style={{
                  fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.12em", color: "rgba(44,36,23,0.4)",
                }}>
                  Member {index + 1}
                </span>
              </div>

              <label className="fb-label">Full Name</label>
              <input
                placeholder="Full Name"
                value={m.name}
                onChange={(e) => updateMember(index, "name", e.target.value)}
              />

              <label className="fb-label">ID Number</label>
              <input
                placeholder="ID Number"
                value={m.id}
                onChange={(e) => updateMember(index, "id", e.target.value)}
              />

              <label className="fb-label">Phone</label>
              <input
                placeholder="Phone"
                value={m.phone}
                onChange={(e) => updateMember(index, "phone", e.target.value)}
              />

              <label className="fb-label">Time Slot</label>
              <div className="fb-select-wrap">
                <select
                  value={m.slot}
                  onChange={(e) => updateMember(index, "slot", e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  <option>Select slot</option>
                  {slots.map(slot => (
                    <option
                      key={slot}
                      value={slot}
                      disabled={
                        bookedSlots.includes(slot) ||
                        members.some((x, i) => i !== index && x.slot === slot)
                      }
                    >
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button className="fb-submit" onClick={submit}>
            Confirm Family Booking &nbsp;✦
          </button>
          


        </div>

        {/* ── RIGHT PANEL – Availability ── */}
        <div
          className="fb-card fb-animate3 fb-right-panel"
          style={{ height: "750px", overflow: "auto" }}
        >
          <p className="fb-section-label">Slot Availability</p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "28px",
          }}>
            <Box n={available} t="Available" accent="green" />
            <Box n={bookedSlots.length} t="Booked" accent="rose" />
            <Box n={slots.length} t="Total" accent="gold" />
          </div>

          {/* Legend */}
          <div style={{
            display: "flex", gap: "20px", marginBottom: "18px",
            fontSize: "11.5px", color: "rgba(44,36,23,0.38)",
            fontWeight: 500, letterSpacing: "0.03em",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{
                width: "9px", height: "9px", borderRadius: "3px",
                background: "rgba(110,168,110,0.2)",
                border: "1.5px solid rgba(110,168,110,0.5)", display: "inline-block",
              }} />
              Available
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{
                width: "9px", height: "9px", borderRadius: "3px",
                background: "rgba(200,180,150,0.2)",
                border: "1.5px solid rgba(200,180,150,0.4)", display: "inline-block",
              }} />
              Booked
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {slots.map(slot => (
              <div
                key={slot}
                className="fb-slot"
                style={{
                  border: `1.5px solid ${bookedSlots.includes(slot)
                    ? "rgba(200,180,150,0.3)"
                    : "rgba(110,168,110,0.35)"}`,
                  background: bookedSlots.includes(slot)
                    ? "rgba(200,180,150,0.1)"
                    : "rgba(110,168,110,0.09)",
                  color: bookedSlots.includes(slot)
                    ? "rgba(44,36,23,0.28)"
                    : "rgba(54,110,60,0.9)",
                  opacity: bookedSlots.includes(slot) ? 0.5 : 1,
                }}
              >
                {slot}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function Box({ n, t, accent }) {
  const themes = {
    green: { bg: "rgba(110,168,110,0.09)", border: "rgba(110,168,110,0.28)", num: "#4a8f4a", lbl: "rgba(74,143,74,0.65)" },
    rose:  { bg: "rgba(220,100,100,0.07)", border: "rgba(220,100,100,0.22)", num: "#b85050", lbl: "rgba(184,80,80,0.6)"  },
    gold:  { bg: "rgba(180,140,70,0.08)",  border: "rgba(180,140,70,0.25)",  num: "#8a6520", lbl: "rgba(138,101,32,0.6)" },
  };
  const c = themes[accent] || themes.gold;

  return (
    <div style={{
      padding: "18px 12px",
      background: c.bg,
      border: `1.5px solid ${c.border}`,
      borderRadius: "16px",
      textAlign: "center",
      boxShadow: "0 2px 10px rgba(80,60,20,0.05)",
    }}>
      <p style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "32px", fontWeight: 500, lineHeight: 1,
        color: c.num,
      }}>
        {n}
      </p>
      <p style={{
        fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.14em", color: c.lbl, marginTop: "6px",
      }}>
        {t}
      </p>
    </div>
  );
}