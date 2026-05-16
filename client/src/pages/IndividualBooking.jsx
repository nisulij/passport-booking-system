import { useState, useEffect, useCallback } from "react";

// Generate all 5-minute slots from 9am to 5pm
function generateSlots() {
  const slots = [];
  for (let h = 9; h < 17; h++) {
    for (let m = 0; m < 60; m += 5) {
      const start = `${h}:${String(m).padStart(2, "0")}`;
      let em = m + 5, eh = h;
      if (em === 60) { em = 0; eh++; }
      slots.push(`${start} - ${eh}:${String(em).padStart(2, "0")}`);
    }
  }
  return slots;
}

const ALL_SLOTS = generateSlots();
const TODAY = new Date().toISOString().split("T")[0];

function formatDateLabel(hour) {
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return "12:00 PM";
  return `${hour - 12}:00 PM`;
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr + "T00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function randomToken() {
  return "A" + Math.floor(1000 + Math.random() * 9000);
}

// ── Slot Availability Panel ──────────────────────────────────────────────────
function SlotPanel({ date, bookedSlots, loadingSlots, selectedSlot, onSelectSlot }) {
  const available = ALL_SLOTS.length - bookedSlots.length;
  const hours = Array.from({ length: 8 }, (_, i) => i + 9);

  return (
    <div style={styles.slotPanel}>
      {/* Header */}
      <div style={styles.slotPanelHeader}>
        <div style={styles.slotPanelTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Slot Availability
        </div>
        {date && !loadingSlots && (
          <span style={styles.availBadge}>{available} open</span>
        )}
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        {[
          { val: date && !loadingSlots ? available : "—", lbl: "Available", color: "#166534" },
          { val: date && !loadingSlots ? bookedSlots.length : "—", lbl: "Booked", color: "#9a3412" },
          { val: date && !loadingSlots ? ALL_SLOTS.length : "—", lbl: "Total", color: "#1e3a5f" },
        ].map(({ val, lbl, color }) => (
          <div key={lbl} style={styles.statCard}>
            <div style={{ ...styles.statVal, color }}>{val}</div>
            <div style={styles.statLbl}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      {date && !loadingSlots && (
        <div style={styles.legend}>
          {[
            { bg: "#dbeafe", border: "#93c5fd", text: "#1e3a5f", label: "Available" },
            { bg: "#f1f5f9", border: "#cbd5e1", text: "#94a3b8", label: "Booked" },
            { bg: "#1e3a5f", border: "#1e3a5f", text: "#fff", label: "Selected" },
          ].map(({ bg, border, text, label }) => (
            <div key={label} style={styles.legendItem}>
              <div style={{ ...styles.legendDot, background: bg, border: `1px solid ${border}`, color: text }} />
              <span style={styles.legendLabel}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Slot grid or placeholder */}
      {!date ? (
        <div style={styles.slotHint}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p style={styles.slotHintText}>Select a date on the left to view available slots</p>
        </div>
      ) : loadingSlots ? (
        <div style={styles.slotHint}>
          <div style={styles.spinnerLg} />
          <p style={styles.slotHintText}>Loading slots…</p>
        </div>
      ) : (
        <div style={styles.slotsScroll}>
          {hours.map(hour => {
            const hourSlots = ALL_SLOTS.filter(s => s.startsWith(`${hour}:`));
            return (
              <div key={hour} style={styles.hourGroup}>
                <div style={styles.hourLabel}>{formatDateLabel(hour)}</div>
                <div style={styles.pillRow}>
                  {hourSlots.map(slot => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = slot === selectedSlot;
                    return (
                      <button
                        key={slot}
                        onClick={() => !isBooked && onSelectSlot(slot)}
                        disabled={isBooked}
                        title={isBooked ? "Already booked" : slot}
                        style={{
                          ...styles.pill,
                          ...(isBooked ? styles.pillBooked : styles.pillFree),
                          ...(isSelected ? styles.pillSelected : {}),
                        }}
                      >
                        {slot.split(" - ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ booking, onReset }) {
  return (
    <div style={styles.successWrap}>
      <div style={styles.successIcon}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h2 style={styles.successTitle}>Booking Confirmed</h2>
      <p style={styles.successSub}>Your appointment has been successfully reserved.</p>

      <div style={styles.tokenBox}>
        <div style={styles.tokenLabel}>Your Token Number</div>
        <div style={styles.tokenVal}>{booking.token}</div>
      </div>

      <div style={styles.confRows}>
        {[
          ["Name", `${booking.title} ${booking.name}`],
          ["Email", booking.email],
          ["Phone", booking.phone],
          ["Date", formatFullDate(booking.date)],
          ["Slot", booking.slot],
        ].map(([k, v]) => (
          <div key={k} style={styles.confRow}>
            <span style={styles.confKey}>{k}</span>
            <span style={styles.confVal}>{v}</span>
          </div>
        ))}
      </div>

      <button style={styles.ghostBtn} onClick={onReset}>Book Another Appointment</button>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function PassportBooking() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "Mr", name: "", id: "", email: "", phone: "", date: "",
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  useEffect(() => {
    if (!form.date) return;
    setLoadingSlots(true);
    setSelectedSlot("");
    fetch(`https://passport-booking-app.onrender.com/api/slots/${form.date}`)
      .then(r => r.json())
      .then(data => setBookedSlots(data))
      .catch(() => {
        // Demo fallback: random booked slots
        const n = Math.floor(Math.random() * 30) + 10;
        setBookedSlots([...ALL_SLOTS].sort(() => Math.random() - 0.5).slice(0, n));
      })
      .finally(() => setLoadingSlots(false));
  }, [form.date]);

  const validateStep1 = useCallback(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.id.trim()) e.id = "ID number is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleNext = () => { if (validateStep1()) setStep(2); };

const handleSubmit = async () => {

  const errorsObj = {};

  if (!form.date) {
    errorsObj.date = "Please select a date";
  }

  if (!selectedSlot) {
    errorsObj.slot = "Please select a slot";
  }

  setErrors(errorsObj);

  if (Object.keys(errorsObj).length > 0) {
    return;
  }

  try {

    const response = await fetch(
      "https://passport-booking-app.onrender.com/api/book",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          title: form.title,

          name: form.name,

          idNumber: form.id,

          email: form.email,

          phone: form.phone,

          date: form.date,

          slot: selectedSlot

        })

      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Booking failed"
      );

    }

    setConfirmedBooking({

      ...form,

      slot: selectedSlot,

      token: data.token

    });

    setSubmitted(true);

  }

  catch(err){

    alert(
      err.message
    );

  }

};

  const handleReset = () => {
    setForm({ title: "Mr", name: "", id: "", email: "", phone: "", date: "" });
    setErrors({});
    setStep(1);
    setSubmitted(false);
    setConfirmedBooking(null);
    setBookedSlots([]);
    setSelectedSlot("");
  };

  return (
    <div style={styles.root}>
      {/* ── Global CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0ede8; }
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        select option { background: #fff; color: #1e293b; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes breathe { 0%,100%{opacity:1}50%{opacity:0.35} }
        .pill-free:hover { background: #bfdbfe !important; border-color: #3b82f6 !important; transform: scale(1.05); }
        .ghost-btn:hover { background: #f1f5f9 !important; border-color: #1e3a5f !important; color: #1e3a5f !important; }
        .primary-btn:hover:not(:disabled) { background: #162d4d !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(30,58,95,0.3) !important; }
        .primary-btn:active:not(:disabled) { transform: translateY(0) !important; }
        .step-tab:hover:not(.active-tab) { background: #f8fafc !important; }
      `}</style>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.brandWrap}>
          <div style={styles.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h4"/>
            </svg>
          </div>
          <div>
            <div style={styles.brandName}>Passport Services</div>
            <div style={styles.brandSub}>Official Appointment Booking</div>
          </div>
        </div>
        <div style={styles.livePill}>
          <div style={styles.liveDot} />
          <span style={{ fontSize: 12, color: "#166534" }}>
            {form.date && !loadingSlots
              ? `${ALL_SLOTS.length - bookedSlots.length} slots available`
              : "Live availability"}
          </span>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={styles.main}>

        {/* LEFT: Form card */}
        <div style={styles.formCard}>
          {submitted && confirmedBooking ? (
            <SuccessScreen booking={confirmedBooking} onReset={handleReset} />
          ) : (
            <>
              {/* Step tabs */}
              <div style={styles.stepTabs}>
                {[
                  { n: 1, label: "Personal Details" },
                  { n: 2, label: "Date & Time" },
                ].map(({ n, label }) => {
                  const isDone = step > n || submitted;
                  const isActive = step === n && !submitted;
                  return (
                    <div
                      key={n}
                      className={`step-tab${isActive ? " active-tab" : ""}`}
                      style={{
                        ...styles.stepTab,
                        ...(isActive ? styles.stepTabActive : {}),
                        ...(isDone && !isActive ? styles.stepTabDone : {}),
                      }}
                    >
                      <div style={{
                        ...styles.stepNum,
                        background: isActive ? "#fff" : isDone ? "#bbf7d0" : "#f1f5f9",
                        color: isActive ? "#1e3a5f" : isDone ? "#166534" : "#94a3b8",
                      }}>
                        {isDone && !isActive ? "✓" : n}
                      </div>
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div style={{ animation: "fadeUp 0.25s ease" }}>
                  <div style={styles.fieldRow}>
                    <div style={{ ...styles.field, maxWidth: 90 }}>
                      <label style={styles.label}>Title</label>
                      <select style={styles.input} value={form.title} onChange={e => handleChange("title", e.target.value)}>
                        {["Mr", "Mrs", "Miss", "Dr", "Prof"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Full Name</label>
                      <input
                        style={{ ...styles.input, ...(errors.name ? styles.inputErr : {}) }}
                        placeholder="e.g. Sarah Ellison"
                        value={form.name}
                        onChange={e => handleChange("name", e.target.value)}
                      />
                      {errors.name && <span style={styles.errMsg}>{errors.name}</span>}
                    </div>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>ID / Passport No.</label>
                    <input
                      style={{ ...styles.input, ...(errors.id ? styles.inputErr : {}) }}
                      placeholder="National ID or Passport number"
                      value={form.id}
                      onChange={e => handleChange("id", e.target.value)}
                    />
                    {errors.id && <span style={styles.errMsg}>{errors.id}</span>}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Email Address</label>
                    <input
                      style={{ ...styles.input, ...(errors.email ? styles.inputErr : {}) }}
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={e => handleChange("email", e.target.value)}
                    />
                    {errors.email && <span style={styles.errMsg}>{errors.email}</span>}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      style={{ ...styles.input, ...(errors.phone ? styles.inputErr : {}) }}
                      placeholder="+1 555 000 0000"
                      value={form.phone}
                      onChange={e => handleChange("phone", e.target.value)}
                    />
                    {errors.phone && <span style={styles.errMsg}>{errors.phone}</span>}
                  </div>

                  <div style={styles.divider} />
                  <button className="primary-btn" style={styles.primaryBtn} onClick={handleNext}>
                    Continue to Scheduling
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div style={{ animation: "fadeUp 0.25s ease" }}>
                  <button style={styles.backBtn} onClick={() => setStep(1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back to personal details
                  </button>

                  <div style={styles.field}>
                    <label style={styles.label}>Appointment Date</label>
                    <input
                      type="date"
                      style={{ ...styles.input, ...(errors.date ? styles.inputErr : {}) }}
                      min={TODAY}
                      value={form.date}
                      onChange={e => handleChange("date", e.target.value)}
                    />
                    {errors.date && <span style={styles.errMsg}>{errors.date}</span>}
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Selected Time Slot</label>
                    <div style={{
                      ...styles.input,
                      cursor: "default",
                      color: selectedSlot ? "#1e3a5f" : "#94a3b8",
                      background: "#f8fafc",
                      display: "flex", alignItems: "center", gap: 8,
                      ...(errors.slot ? styles.inputErr : {}),
                    }}>
                      {selectedSlot ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {selectedSlot}
                        </>
                      ) : "← Pick a slot from the calendar"}
                    </div>
                    {errors.slot && <span style={styles.errMsg}>{errors.slot}</span>}
                  </div>

                  <div style={styles.divider} />
                  <button
                    className="primary-btn"
                    style={{ ...styles.primaryBtn, ...(submitting ? { opacity: 0.6, cursor: "not-allowed" } : {}) }}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <><div style={styles.spinner} /> Confirming…</>
                    ) : (
                      <>
                        Confirm Booking
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Slot availability */}
        <SlotPanel
          date={form.date}
          bookedSlots={bookedSlots}
          loadingSlots={loadingSlots}
          selectedSlot={selectedSlot}
          onSelectSlot={(slot) => {
            setSelectedSlot(slot);
            if (errors.slot) setErrors(prev => ({ ...prev, slot: undefined }));
          }}
        />
      </main>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: "100vh",
    background: "#f0ede8",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 40px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  brandWrap: { display: "flex", alignItems: "center", gap: 12 },
  brandIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: "#1e3a5f",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  brandName: { fontSize: 15, fontWeight: 500, color: "#1e293b", fontFamily: "'DM Serif Display', serif" },
  brandSub: { fontSize: 11, color: "#94a3b8", marginTop: 1 },
  livePill: {
    display: "flex", alignItems: "center", gap: 7,
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: 20, padding: "6px 14px",
  },
  liveDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#16a34a", animation: "breathe 2s ease-in-out infinite",
  },

  main: {
    flex: 1, display: "flex", gap: 24, padding: "32px 40px",
    maxWidth: 1100, margin: "0 auto", width: "100%",
    alignItems: "flex-start",
  },

  // Form card
  formCard: {
    flex: 1, background: "#fff", borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: 28, minWidth: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  stepTabs: { display: "flex", gap: 8, marginBottom: 24 },
  stepTab: {
    flex: 1, padding: "10px 14px", borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#fff", cursor: "default",
    fontSize: 13, fontWeight: 500, color: "#94a3b8",
    display: "flex", alignItems: "center", gap: 8,
    transition: "all 0.15s",
  },
  stepTabActive: {
    background: "#1e3a5f", color: "#fff", border: "1px solid #1e3a5f",
  },
  stepTabDone: {
    background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0",
  },
  stepNum: {
    width: 22, height: 22, borderRadius: "50%",
    fontSize: 11, fontWeight: 500,
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  field: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 },
  fieldRow: { display: "flex", gap: 12 },
  label: {
    fontSize: 11, fontWeight: 500, letterSpacing: "0.7px",
    textTransform: "uppercase", color: "#64748b",
  },
  input: {
    padding: "10px 13px", borderRadius: 9,
    border: "1px solid #e2e8f0",
    background: "#fff",
    fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    color: "#1e293b", outline: "none", width: "100%",
    transition: "border-color 0.2s, box-shadow 0.2s",
    WebkitAppearance: "none",
  },
  inputErr: { borderColor: "#fca5a5", background: "#fff7f7" },
  errMsg: { fontSize: 11, color: "#dc2626", marginTop: -2 },
  divider: { height: 1, background: "#f1f5f9", margin: "16px 0" },
  primaryBtn: {
    width: "100%", padding: "12px 20px",
    background: "#1e3a5f", color: "#fff",
    border: "none", borderRadius: 10,
    fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "all 0.15s",
    boxShadow: "0 2px 8px rgba(30,58,95,0.2)",
  },
  backBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 13, color: "#64748b", fontFamily: "'DM Sans', sans-serif",
    padding: 0, marginBottom: 18,
    display: "flex", alignItems: "center", gap: 5,
    transition: "color 0.15s",
  },
  spinner: {
    width: 14, height: 14, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    animation: "spin 0.7s linear infinite",
  },

  // Slot panel
  slotPanel: {
    width: 400, flexShrink: 0,
    background: "#fff", borderRadius: 16,
    border: "1px solid #e2e8f0",
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  slotPanelHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 16,
  },
  slotPanelTitle: {
    fontSize: 12, fontWeight: 500, letterSpacing: "0.8px",
    textTransform: "uppercase", color: "#64748b",
    display: "flex", alignItems: "center", gap: 6,
  },
  availBadge: {
    fontSize: 11, fontWeight: 500,
    background: "#f0fdf4", color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 12, padding: "3px 9px",
  },
  statsRow: { display: "flex", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, background: "#f8fafc", borderRadius: 9,
    padding: "12px 10px", textAlign: "center",
  },
  statVal: { fontSize: 22, fontWeight: 500, fontFamily: "'DM Serif Display', serif" },
  statLbl: { fontSize: 11, color: "#94a3b8", marginTop: 2 },

  legend: { display: "flex", gap: 14, marginBottom: 14 },
  legendItem: { display: "flex", alignItems: "center", gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: 11, color: "#64748b" },

  slotHint: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "48px 0", gap: 12,
  },
  slotHintText: { fontSize: 13, color: "#94a3b8", textAlign: "center" },
  spinnerLg: {
    width: 28, height: 28, borderRadius: "50%",
    border: "3px solid #e2e8f0",
    borderTopColor: "#1e3a5f",
    animation: "spin 0.8s linear infinite",
  },

  slotsScroll: {
    maxHeight: 480,
    overflowY: "auto",
    paddingRight: 4,
  },
  hourGroup: { marginBottom: 12 },
  hourLabel: {
    fontSize: 10, fontWeight: 500, color: "#94a3b8",
    letterSpacing: "0.7px", textTransform: "uppercase",
    marginBottom: 5,
  },
  pillRow: { display: "flex", flexWrap: "wrap", gap: 5 },
  pill: {
    padding: "4px 9px", borderRadius: 6,
    fontSize: 11, fontWeight: 500, cursor: "pointer",
    border: "1px solid transparent",
    transition: "all 0.12s",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  },
  pillFree: { background: "#dbeafe", color: "#1e3a5f", borderColor: "#93c5fd" },
  pillBooked: {
    background: "#f1f5f9", color: "#cbd5e1",
    borderColor: "#e2e8f0", cursor: "not-allowed",
    textDecoration: "line-through",
  },
  pillSelected: { background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f" },

  // Success
  successWrap: { textAlign: "center", padding: "8px 0" },
  successIcon: {
    width: 72, height: 72, borderRadius: "50%",
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 20px",
  },
  successTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 26, fontWeight: 400, color: "#1e293b", marginBottom: 6,
  },
  successSub: { fontSize: 14, color: "#94a3b8", marginBottom: 24, fontWeight: 300 },
  tokenBox: {
    background: "#eff6ff", border: "1px solid #bfdbfe",
    borderRadius: 12, padding: "14px 20px", marginBottom: 20,
  },
  tokenLabel: {
    fontSize: 10, fontWeight: 500, letterSpacing: "1px",
    textTransform: "uppercase", color: "#3b82f6", marginBottom: 4,
  },
  tokenVal: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 32, color: "#1e3a5f", letterSpacing: 6,
  },
  confRows: {
    background: "#f8fafc", borderRadius: 10,
    border: "1px solid #e2e8f0",
    overflow: "hidden", marginBottom: 18, textAlign: "left",
  },
  confRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13,
  },
  confKey: { color: "#94a3b8" },
  confVal: { fontWeight: 500, color: "#1e293b" },
  ghostBtn: {
    width: "100%", padding: "12px",
    background: "transparent", border: "1px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer", color: "#64748b",
    transition: "all 0.15s",
  },
};