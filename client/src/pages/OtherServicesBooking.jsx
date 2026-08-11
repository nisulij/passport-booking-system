import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://passport-booking-app.onrender.com";

function getTodayLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().split("T")[0];
}

function generateSlots() {
  const slots = [];

  for (let hour = 9; hour < 13; hour += 1) {
    for (let minute = 0; minute < 60; minute += 30) {
      const start = `${hour}:${String(minute).padStart(2, "0")}`;

      let endHour = hour;
      let endMinute = minute + 30;

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

export default function OtherServicesBooking() {
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
    purpose: "Document Attestation",
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
      return;
    }

    let cancelled = false;

    async function loadSlots() {
      setLoadingSlots(true);

      try {
        const response = await fetch(
          `${API_BASE}/api/slots/other/${encodeURIComponent(
            form.date
          )}`
        );

        if (!response.ok) {
          throw new Error("Could not load other service slots");
        }

        const data = await response.json();

        if (!cancelled) {
          setBookedSlots(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("OTHER SERVICE SLOT ERROR:", error);

        if (!cancelled) {
          setBookedSlots([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
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
        `${API_BASE}/api/other-service-book`,
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

            <h1>Other Consular Service Appointment Confirmed</h1>

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
              onClick={() => navigate("/")}
            >
              Return to Services
            </button>
          </section>
        </main>
      </div>
    );
  }

  const availableCount =
    ALL_SLOTS.length - bookedSlots.length;

  return (
    <div className="bc-page">
      <style>{STYLES}</style>

      <header className="bc-header">
        <button onClick={() => navigate("/")}>
          ← Services
        </button>

        <div>
          <h1>Other Consular Service Appointment</h1>
          <p>Embassy of Sri Lanka in France</p>
        </div>

        <div className="bc-service-pill">
          🏛 30-minute slots
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
                <label>Purpose of Appointment</label>

                <select
                  value={form.purpose}
                  onChange={(e) =>
                    update("purpose", e.target.value)
                  }
                >
                  <option>Document Attestation</option>
                  <option>Power of Attorney</option>
                  <option>Affidavit</option>
                  <option>Citizenship Services</option>
                  <option>Pension / Life Certificate</option>
                  <option>Police Clearance Related Service</option>
                  <option>Consular Assistance</option>
                  <option>Other</option>
                </select>
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
                  Other consular services use a separate 30-minute calendar from Passport and Other Consular Service services.
                </p>
              </div>

              <div className="bc-field">
                <label>Appointment Date</label>

                <input
                  type="date"
                  min={TODAY}
                  value={form.date}
                  onChange={(e) => {
                    update("date", e.target.value);
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
                  : "Confirm Other Consular Service Appointment"}
              </button>
            </>
          )}
        </section>

        <aside className="bc-availability">
          <div className="bc-av-head">
            <div>
              <strong>Slot Availability</strong>
              <span>
                Other Services calendar
              </span>
            </div>

            {form.date && (
              <div className="bc-open">
                {availableCount} open
              </div>
            )}
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