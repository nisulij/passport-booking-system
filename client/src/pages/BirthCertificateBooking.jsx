import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";



const API_ROOT = (

  import.meta.env.VITE_API_URL ||

  (import.meta.env.DEV

    ? "http://localhost:5000/api"

    : "https://passport-booking-app.onrender.com/api")

).replace(/\/api\/?$/, "");



function getTodayLocal() {

  const now = new Date();

  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return local.toISOString().split("T")[0];

}



function generateSlots() {

  const slots = [];



  for (let hour = 9; hour < 13; hour += 1) {

    for (let minute = 0; minute < 60; minute += 15) {

      const start = `${hour}:${String(minute).padStart(2, "0")}`;



      let endHour = hour;

      let endMinute = minute + 15;



      if (endMinute >= 60) {

        endHour += 1;

        endMinute -= 60;

      }



      slots.push(

        `${start} - ${endHour}:${String(endMinute).padStart(2, "0")}`

      );

    }

  }



  return slots;

}



const ALL_SLOTS = generateSlots();





function normalizeStartTime(value) {

  if (value === null || value === undefined) return "";



  let raw = String(value).trim();

  if (!raw) return "";



  // If the backend sends a full slot such as "9:00 - 9:15",

  // compare only the starting time.

  if (raw.includes(" - ")) {

    raw = raw.split(" - ")[0].trim();

  }



  let match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);



  if (!match) return raw;



  let hour = Number(match[1]);

  const minute = match[2];

  const period = match[3] ? match[3].toUpperCase() : "";



  if (period === "AM" && hour === 12) hour = 0;

  if (period === "PM" && hour !== 12) hour += 12;



  return `${hour}:${minute}`;

}



function downloadBirthCertificateConfirmation({ name, date, slot, token }) {
  return new Promise((resolve, reject) => {
  const safe = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;",
  }[char]));
  const width = 1200, height = 760;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="1200" height="760" fill="#f4f7fb"/>
    <rect x="70" y="55" width="1060" height="650" rx="28" fill="#fff" stroke="#dbe4ef" stroke-width="2"/>
    <rect x="70" y="55" width="1060" height="150" rx="28" fill="#234674"/><rect x="70" y="177" width="1060" height="28" fill="#234674"/>
    <text x="120" y="125" fill="#fff" font-family="Arial" font-size="36" font-weight="700">EMBASSY APPOINTMENT</text>
    <text x="120" y="165" fill="#dbe8f8" font-family="Arial" font-size="21">Appointment Confirmation</text>
    <circle cx="1035" cy="130" r="34" fill="#eaf5ff"/><path d="M1018 130 l11 12 l24 -29" fill="none" stroke="#234674" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="120" y="270" fill="#17213a" font-family="Arial" font-size="34" font-weight="700">Booking Confirmed</text>
    <text x="120" y="307" fill="#7084a0" font-family="Arial" font-size="20">Please bring this confirmation on your appointment day.</text>
    <text x="120" y="370" fill="#71839d" font-family="Arial" font-size="17">SERVICE</text><text x="360" y="370" fill="#17213a" font-family="Arial" font-size="20" font-weight="700">Birth Certificate</text>
    <text x="120" y="420" fill="#71839d" font-family="Arial" font-size="17">APPLICANT NAME</text><text x="360" y="420" fill="#17213a" font-family="Arial" font-size="20" font-weight="700">${safe(name)}</text>
    <text x="120" y="470" fill="#71839d" font-family="Arial" font-size="17">APPOINTMENT DATE</text><text x="360" y="470" fill="#17213a" font-family="Arial" font-size="20" font-weight="700">${safe(date)}</text>
    <text x="120" y="520" fill="#71839d" font-family="Arial" font-size="17">APPOINTMENT TIME</text><text x="360" y="520" fill="#17213a" font-family="Arial" font-size="20" font-weight="700">${safe(slot)}</text>
    <rect x="730" y="350" width="330" height="155" rx="22" fill="#edf4fd"/><text x="760" y="395" fill="#234674" font-family="Arial" font-size="17" font-weight="700">APPOINTMENT TOKEN</text><text x="760" y="455" fill="#17213a" font-family="Arial" font-size="30" font-weight="700">${safe(token)}</text>
    <text x="120" y="610" fill="#e01f26" font-family="Arial" font-size="18">Please bring this confirmation together with your required original documents.</text>
    <text x="120" y="650" fill="#91a2b9" font-family="Arial" font-size="15">Embassy Appointment System</text>
  </svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas"); canvas.width = width * 2; canvas.height = height * 2;
    const ctx = canvas.getContext("2d"); ctx.scale(2, 2); ctx.drawImage(image, 0, 0, width, height); URL.revokeObjectURL(url);
    const link = document.createElement("a"); link.download = `Birth-Certificate-Appointment-${String(token || "confirmation").replace(/[^a-zA-Z0-9_-]/g, "_")}.png`; link.href = canvas.toDataURL("image/png"); link.click();
    resolve();
  };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Unable to download the confirmation image. Please try again.")); };
  image.src = url;
  });
}


function normalizeBookedSlots(data) {

  const values = Array.isArray(data) ? data : [];



  const blockedStarts = new Set(

    values

      .map((item) => {

        if (typeof item === "string") return item;

        return item?.appointmentTime ?? item?.slot ?? item?.time ?? "";

      })

      .map(normalizeStartTime)

      .filter(Boolean)

  );



  // Convert backend times like "09:00" into the exact frontend slot

  // strings like "9:00 - 9:15".

  return ALL_SLOTS.filter((slot) =>

    blockedStarts.has(normalizeStartTime(slot))

  );

}



export default function BirthCertificateBooking() {

  const navigate = useNavigate();

  const TODAY = getTodayLocal();



  const [step, setStep] = useState(1);



  const [form, setForm] = useState({

    title: "Mr",

    name: "",

    idNumber: "",

    email: "",

    phone: "",

    address: "",

    purpose: "Birth Certificate",

    date: "",

    slot: "",

  });



  const [bookedSlots, setBookedSlots] = useState([]);

  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [token, setToken] = useState("");

  const [done, setDone] = useState(false);



  useEffect(() => {
    if (!form.date) {
      setBookedSlots([]);
      setLoadingSlots(false);
      return;
    }

    let cancelled = false;

    const normalizeDate = (value) => {
      if (!value) return "";
      const raw = String(value).trim();

      if (raw === form.date || raw.startsWith(`${form.date}T`)) return form.date;

      const dmy = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
      if (dmy) {
        return `${dmy[3]}-${String(Number(dmy[2])).padStart(2, "0")}-${String(Number(dmy[1])).padStart(2, "0")}`;
      }

      return raw.slice(0, 10);
    };

    async function loadSlots() {
      setLoadingSlots(true);
      setBookedSlots([]);

      try {
        const [slotResponse, adminResponse] = await Promise.all([
          fetch(`${API_ROOT}/api/slots/birth_certificate/${encodeURIComponent(form.date)}`),
          fetch(`${API_ROOT}/api/admin/appointments/birth_certificate`),
        ]);

        const publicData = slotResponse.ok ? await slotResponse.json() : [];
        const adminData = adminResponse.ok ? await adminResponse.json() : [];

        const adminTimes = Array.isArray(adminData)
          ? adminData
              .filter((row) => {
                const rowDate = row?.appointmentDate ?? row?.date;
                return normalizeDate(rowDate) === form.date;
              })
              .map((row) => row?.appointmentTime ?? row?.slot ?? row?.time ?? "")
          : [];

        if (!cancelled) {
          setBookedSlots(
            normalizeBookedSlots([
              ...(Array.isArray(publicData) ? publicData : []),
              ...adminTimes,
            ])
          );
        }
      } catch (error) {
        console.error("BIRTH SLOT ERROR:", error);
        if (!cancelled) setBookedSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [form.date]);



  const update = (field, value) => {

    setForm((current) => ({

      ...current,

      [field]: value,

    }));

  };



  const goNext = () => {

    if (

      !form.name.trim() ||

      !form.idNumber.trim() ||

      !form.email.trim() ||

      !form.phone.trim() ||

      !form.address.trim()

    ) {

      alert("Please complete all personal details.");

      return;

    }



    if (!/^\d{7,15}$/.test(form.phone)) {

      alert("Phone number must contain 7 to 15 digits only.");

      return;

    }



    setStep(2);

    window.scrollTo({ top: 0, behavior: "smooth" });

  };



  const submit = async () => {

    if (!form.date || !form.slot) {

      alert("Please select a date and time slot.");

      return;

    }



    setSubmitting(true);



    try {

      const response = await fetch(

        `${API_ROOT}/api/birth-certificate-book`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify({

            ...form,

            email: form.email.trim().toLowerCase(),

          }),

        }

      );



      const data = await response.json();



      if (!response.ok) {
        if (response.status === 409) {
          // Refresh the visible calendar immediately after a conflict.
          try {
            const [slotResponse, adminResponse] = await Promise.all([
              fetch(`${API_ROOT}/api/slots/birth_certificate/${encodeURIComponent(form.date)}`),
              fetch(`${API_ROOT}/api/admin/appointments/birth_certificate`),
            ]);

            const publicData = slotResponse.ok ? await slotResponse.json() : [];
            const adminData = adminResponse.ok ? await adminResponse.json() : [];

            const adminTimes = Array.isArray(adminData)
              ? adminData
                  .filter((row) => String(row?.appointmentDate ?? row?.date ?? "").slice(0, 10) === form.date)
                  .map((row) => row?.appointmentTime ?? row?.slot ?? row?.time ?? "")
              : [];

            setBookedSlots(
              normalizeBookedSlots([
                ...(Array.isArray(publicData) ? publicData : []),
                ...adminTimes,
              ])
            );
          } catch (refreshError) {
            console.error("BIRTH SLOT REFRESH ERROR:", refreshError);
          }

          setForm((current) => ({ ...current, slot: "" }));
        }

        throw new Error(
          data.message || "Birth certificate booking failed"
        );
      }

      setToken(data.token);

      setDone(true);

    } catch (error) {

      alert(error.message || "Unable to complete booking");

    } finally {

      setSubmitting(false);

    }

  };



  if (done) {

    return (

      <div className="bc-page">

        <style>{STYLES}</style>



        <main className="bc-success-shell">

          <section className="bc-success-card">

            <div className="bc-success-icon">✓</div>



            <div className="bc-eyebrow">Appointment confirmed</div>



            <h1>Birth Certificate Appointment Confirmed</h1>



            <p>

              Please keep your appointment token and present it

              when attending the Embassy.

            </p>



            <div className="bc-confirm-grid">

              <div>

                <span>Name</span>

                <strong>{form.name}</strong>

              </div>



              <div>

                <span>Date</span>

                <strong>{form.date}</strong>

              </div>



              <div>

                <span>Time</span>

                <strong>{form.slot}</strong>

              </div>

            </div>



            <div className="bc-token">

              <span>Appointment Token</span>

              <strong>{token}</strong>

            </div>



            <button
              className="bc-primary"
              onClick={async () => {
                try {
                  await downloadBirthCertificateConfirmation({
                    name: form.name,
                    date: form.date,
                    slot: form.slot,
                    token,
                  });
                  navigate("/");
                } catch (error) {
                  alert(error.message || "Unable to download the confirmation.");
                }
              }}
            >
              Download Appointment Confirmation
            </button>

          </section>

        </main>

      </div>

    );

  }



  const availableCount =

    Math.max(0, ALL_SLOTS.length - bookedSlots.length);



  return (

    <div className="bc-page">

      <style>{STYLES}</style>



      <header className="bc-header">

        <button onClick={() => navigate("/")}>

          ← Services

        </button>



        <div>

          <h1>Birth Certificate Appointment</h1>

          <p>Embassy of Sri Lanka in France</p>

        </div>



        <div className="bc-service-pill">

          📜 15-minute slots

        </div>

      </header>



      <main className="bc-shell">

        <section className="bc-card">

          <div className="bc-steps">

            <div

              className={`bc-step ${

                step === 1 ? "active" : "done"

              }`}

            >

              <span>{step === 2 ? "✓" : "1"}</span>

              Personal Details

            </div>



            <div

              className={`bc-step ${

                step === 2 ? "active" : ""

              }`}

            >

              <span>2</span>

              Date & Time

            </div>

          </div>



          {step === 1 ? (

            <>

              <div className="bc-heading">

                <h2>Applicant Details</h2>

                <p>

                  Enter the details of the person attending

                  the appointment.

                </p>

              </div>



              <div className="bc-two">

                <div className="bc-field">

                  <label>Title</label>



                  <select

                    value={form.title}

                    onChange={(e) =>

                      update("title", e.target.value)

                    }

                  >

                    <option>Mr</option>

                    <option>Mrs</option>

                    <option>Miss</option>

                    <option>Ms</option>

                    <option>Dr</option>

                  </select>

                </div>



                <div className="bc-field">

                  <label>Full Name</label>



                  <input

                    placeholder="Full name"

                    value={form.name}

                    onChange={(e) =>

                      update("name", e.target.value)

                    }

                  />

                </div>

              </div>



              <div className="bc-field">

                <label>ID / Passport No.</label>



                <input

                  placeholder="National ID or Passport number"

                  value={form.idNumber}

                  onChange={(e) =>

                    update("idNumber", e.target.value)

                  }

                />

              </div>



              <div className="bc-field">

                <label>Email Address</label>



                <input

                  type="email"

                  placeholder="name@example.com"

                  value={form.email}

                  onChange={(e) =>

                    update("email", e.target.value)

                  }

                />

              </div>



              <div className="bc-field">

                <label>Phone Number</label>



                <input

                  type="tel"

                  inputMode="numeric"

                  pattern="[0-9]*"

                  maxLength={15}

                  placeholder="0771234567"

                  value={form.phone}

                  onChange={(e) =>

                    update(

                      "phone",

                      e.target.value

                        .replace(/\D/g, "")

                        .slice(0, 15)

                    )

                  }

                />

              </div>



              <div className="bc-field">

                <label>Address</label>



                <input

                  placeholder="Home address"

                  value={form.address}

                  onChange={(e) =>

                    update("address", e.target.value)

                  }

                />

              </div>



              <div className="bc-field">

                <label>Service</label>



                <input

                  value="Birth Certificate"

                  disabled

                />

              </div>



              <button

                className="bc-primary"

                onClick={goNext}

              >

                Continue to Scheduling →

              </button>

            </>

          ) : (

            <>

              <button

                className="bc-back"

                onClick={() => setStep(1)}

              >

                ← Back to personal details

              </button>



              <div className="bc-heading">

                <h2>Select Date & Time</h2>

                <p>

                  Birth Certificate appointments use a separate

                  15-minute calendar from Passport services.

                </p>

              </div>



              <div className="bc-field">

                <label>Appointment Date</label>



                <input

                  type="date"

                  min={TODAY}

                  value={form.date}

               onChange={(e) => {
  const selectedDate = e.target.value;
  const day = new Date(selectedDate + "T00:00:00").getDay();

  if (day === 0 || day === 6) {
    alert("The Embassy is closed on Saturdays and Sundays. Please select a weekday.");
    return;
  }

  update("date", selectedDate);
  update("slot", "");
}}

                />

              </div>



              {form.slot && (

                <div className="bc-selected">

                  Selected time:

                  <strong>{form.slot}</strong>

                </div>

              )}



              <button

                className="bc-primary"

                disabled={submitting}

                onClick={submit}

              >

                {submitting

                  ? "Confirming..."

                  : "Confirm Birth Certificate Appointment"}

              </button>

            </>

          )}

        </section>



        <aside className="bc-availability">

          <div className="bc-av-head">

            <div>

              <strong>Slot Availability</strong>

              <span>

                Birth Certificate calendar

              </span>

            </div>



          </div>



          {!form.date || step === 1 ? (

            <div className="bc-empty">

              <div>📅</div>

              <p>

                Continue to Date & Time and select a date

                to view available slots.

              </p>

            </div>

          ) : loadingSlots ? (

            <div className="bc-empty">

              <p>Loading availability...</p>

            </div>

          ) : (

            <>

              <div className="bc-stats-row">

                <div className="bc-stat-card">

                  <strong>{availableCount}</strong>

                  <span>Available</span>

                </div>

                <div className="bc-stat-card">

                  <strong>{bookedSlots.length}</strong>

                  <span>Booked</span>

                </div>

              </div>

              <div className="bc-slot-grid">

              {ALL_SLOTS.map((slot) => {

                const booked =

                  bookedSlots.includes(slot);



                const selected =

                  form.slot === slot;



                return (

                  <button

                    key={slot}

                    disabled={booked}

                    className={`bc-slot ${

                      booked

                        ? "booked"

                        : selected

                        ? "selected"

                        : ""

                    }`}

                    onClick={() =>

                      update("slot", slot)

                    }

                  >

                    {slot}

                  </button>

                );

              })}

            </div>

            </>

          )}

        </aside>

      </main>

    </div>

  );

}



const STYLES = `

@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');



* { box-sizing: border-box; }

body { margin: 0; }



.bc-page {

  min-height: 100vh;

  background: #f2efea;

  font-family: 'DM Sans', sans-serif;

  color: #17213a;

}



.bc-header {

  min-height: 82px;

  padding: 15px 42px;

  background: #fff;

  border-top: 4px solid #e7ad18;

  border-bottom: 1px solid #e5e1d9;

  display: grid;

  grid-template-columns: 1fr auto 1fr;

  align-items: center;

  gap: 20px;

}



.bc-header > button,

.bc-back {

  border: 0;

  background: transparent;

  cursor: pointer;

  color: #60738e;

}



.bc-header > div:nth-child(2) {

  text-align: center;

}



.bc-header h1 {

  margin: 0;

  font-family: 'DM Serif Display', serif;

  font-size: 22px;

  font-weight: 400;

}



.bc-header p {

  margin: 3px 0 0;

  color: #9a8f89;

  font-size: 11px;

}



.bc-service-pill {

  justify-self: end;

  background: #fff8e8;

  color: #905900;

  border: 1px solid #efd28b;

  border-radius: 999px;

  padding: 8px 13px;

  font-size: 11px;

  font-weight: 700;

}



.bc-shell {

  width: min(1300px, calc(100% - 50px));

  margin: 0 auto;

  padding: 36px 0 60px;

  display: grid;

  grid-template-columns: minmax(0, 1.15fr) minmax(360px, .75fr);

  gap: 28px;

  align-items: start;

}



.bc-card,

.bc-availability {

  background: #fff;

  border: 1px solid #dfe4eb;

  border-radius: 20px;

  box-shadow: 0 3px 12px rgba(24,35,59,.04);

}



.bc-card {

  padding: 32px;

}



.bc-availability {

  padding: 28px;

  min-height: 390px;

}



.bc-steps {

  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 12px;

  margin-bottom: 32px;

}



.bc-step {

  min-height: 55px;

  border: 1px solid #dae1eb;

  border-radius: 12px;

  padding: 0 17px;

  display: flex;

  align-items: center;

  gap: 10px;

  color: #9aa8bd;

  font-size: 13px;

  font-weight: 700;

}



.bc-step span {

  width: 27px;

  height: 27px;

  border-radius: 50%;

  background: #f2f5f8;

  display: grid;

  place-items: center;

  font-size: 11px;

}



.bc-step.active {

  background: #203f69;

  color: #fff;

  border-color: #203f69;

}



.bc-step.active span {

  background: #fff;

  color: #203f69;

}



.bc-step.done {

  background: #effbf3;

  color: #0b7c3e;

  border-color: #baecca;

}



.bc-heading {

  margin-bottom: 24px;

}



.bc-heading h2 {

  font-family: 'DM Serif Display', serif;

  font-size: 27px;

  font-weight: 400;

  margin: 0;

}



.bc-heading p {

  margin: 6px 0 0;

  color: #8998ad;

  font-size: 12px;

  line-height: 1.6;

}



.bc-two {

  display: grid;

  grid-template-columns: 120px 1fr;

  gap: 14px;

}



.bc-field {

  margin-bottom: 19px;

}



.bc-field label {

  display: block;

  color: #557093;

  text-transform: uppercase;

  letter-spacing: .07em;

  font-size: 10px;

  font-weight: 700;

  margin-bottom: 7px;

}



.bc-field input,

.bc-field select {

  width: 100%;

  min-height: 50px;

  padding: 0 14px;

  border: 1px solid #d9e1ec;

  border-radius: 10px;

  background: #fff;

  outline: none;

  color: #18233b;

}



.bc-field input:focus,

.bc-field select:focus {

  border-color: #789bc5;

  box-shadow: 0 0 0 3px rgba(72,111,160,.08);

}



.bc-field input:disabled {

  background: #f7f8fa;

  color: #8996a8;

}



.bc-primary {

  width: 100%;

  min-height: 53px;

  margin-top: 11px;

  border: 0;

  border-radius: 11px;

  background: #203f69;

  color: #fff;

  cursor: pointer;

  font-weight: 700;

}



.bc-primary:disabled {

  opacity: .6;

}



.bc-back {

  margin-bottom: 22px;

}



.bc-selected {

  margin: 20px 0;

  padding: 14px 16px;

  background: #edf4fd;

  border: 1px solid #c9dcf3;

  border-radius: 10px;

  color: #637b99;

  font-size: 12px;

}



.bc-selected strong {

  margin-left: 8px;

  color: #203f69;

}



.bc-av-head {

  display: flex;

  justify-content: space-between;

  gap: 15px;

  align-items: flex-start;

  margin-bottom: 24px;

}



.bc-av-head strong {

  display: block;

  font-size: 13px;

  text-transform: uppercase;

  letter-spacing: .07em;

  color: #5b718e;

}



.bc-av-head span {

  display: block;

  margin-top: 4px;

  font-size: 10px;

  color: #9aa7b8;

}



.bc-stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 0 0 18px;
}

.bc-stat-card {
  background: #f7f9fc;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
  padding: 15px 12px;
  text-align: center;
}

.bc-stat-card strong {
  display: block;
  font-size: 24px;
  line-height: 1;
  color: #203f69;
  font-weight: 700;
}

.bc-stat-card:first-child strong {
  color: #148345;
}

.bc-stat-card span {
  display: block;
  margin-top: 7px;
  font-size: 10px;
  color: #8a9ab0;
}

.bc-open {

  padding: 6px 10px;

  border-radius: 999px;

  background: #effcf3;

  color: #11813e;

  border: 1px solid #b7efc7;

  font-size: 10px;

  font-weight: 700;

}



.bc-empty {

  min-height: 250px;

  display: grid;

  place-content: center;

  text-align: center;

  color: #93a4bd;

}



.bc-empty div {

  font-size: 28px;

  margin-bottom: 10px;

}



.bc-empty p {

  max-width: 250px;

  font-size: 12px;

  line-height: 1.6;

}



.bc-slot-grid {

  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 9px;

}



.bc-slot {

  min-height: 40px;

  border-radius: 9px;

  border: 1px solid #8fbdf4;

  background: #e8f2ff;

  color: #1b538f;

  cursor: pointer;

  font-size: 11px;

}



.bc-slot.booked {

  background: #eef1f5;

  border-color: #d8dfe7;

  color: #b3becb;

  opacity: .55;

  text-decoration: line-through;

  cursor: not-allowed;

}



.bc-slot.selected {

  background: #203f69;

  border-color: #203f69;

  color: #fff;

}



.bc-success-shell {

  min-height: 100vh;

  display: grid;

  place-items: center;

  padding: 35px;

}



.bc-success-card {

  width: min(720px, 100%);

  background: #fff;

  border: 1px solid #dfe4eb;

  border-radius: 22px;

  padding: 42px;

  text-align: center;

}



.bc-success-icon {

  width: 68px;

  height: 68px;

  margin: 0 auto 18px;

  border-radius: 50%;

  background: #eaf9ef;

  color: #148345;

  display: grid;

  place-items: center;

  font-size: 30px;

}



.bc-eyebrow {

  color: #148345;

  font-size: 10px;

  font-weight: 800;

  text-transform: uppercase;

  letter-spacing: .1em;

}



.bc-success-card h1 {

  font-family: 'DM Serif Display', serif;

  font-weight: 400;

  margin: 9px 0;

}



.bc-success-card > p {

  color: #8897aa;

  font-size: 13px;

}



.bc-confirm-grid {

  display: grid;

  grid-template-columns: repeat(3, 1fr);

  border: 1px solid #e2e7ee;

  border-radius: 12px;

  overflow: hidden;

  margin: 28px 0 18px;

}



.bc-confirm-grid div {

  padding: 15px;

  border-right: 1px solid #e2e7ee;

}



.bc-confirm-grid div:last-child {

  border-right: 0;

}



.bc-confirm-grid span,

.bc-token span {

  display: block;

  font-size: 9px;

  color: #98a5b6;

  text-transform: uppercase;

  letter-spacing: .08em;

}



.bc-confirm-grid strong {

  display: block;

  margin-top: 5px;

  font-size: 12px;

}



.bc-token {

  background: #203f69;

  color: #fff;

  border-radius: 13px;

  padding: 18px;

}



.bc-token span {

  color: #bed0e6;

}



.bc-token strong {

  display: block;

  margin-top: 6px;

  font-size: 26px;

  letter-spacing: .08em;

}



@media (max-width: 900px) {

  .bc-shell {

    grid-template-columns: 1fr;

  }

}



@media (max-width: 600px) {

  .bc-header {

    grid-template-columns: 1fr;

    text-align: center;

  }



  .bc-header > button,

  .bc-service-pill {

    justify-self: center;

  }



  .bc-two,

  .bc-confirm-grid {

    grid-template-columns: 1fr;

  }



  .bc-confirm-grid div {

    border-right: 0;

    border-bottom: 1px solid #e2e7ee;

  }

}

`;
