import { useEffect, useMemo, useState } from "react";

const API_BASE = "https://passport-booking-app.onrender.com";
const TODAY = new Date().toISOString().split("T")[0];

const PURPOSES = [
  "New Passport",
  "Renew Passport",
  "Lost Passport",
  "Damaged Passport",
  "Child Passport",
  "Passport Correction",
  "Name Amendment",
  "Emergency Travel Document",
];

const emptyMember = () => ({
  name: "",
  id: "",
  phone: "",
  address: "",
  purpose: "New Passport",
  slot: "",
});

function generateSlots() {
  const slots = [];
  for (let h = 9; h < 13; h++) {
    for (let m = 0; m < 60; m += 5) {
      const start = `${h}:${String(m).padStart(2, "0")}`;
      let endH = h;
      let endM = m + 5;
      if (endM === 60) {
        endM = 0;
        endH += 1;
      }
      slots.push(`${start} - ${endH}:${String(endM).padStart(2, "0")}`);
    }
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

export default function FamilyBooking() {
  const [step, setStep] = useState(1);
  const [familyCount, setFamilyCount] = useState(2);
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [members, setMembers] = useState([emptyMember(), emptyMember()]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const available = ALL_SLOTS.length - bookedSlots.length;

  const selectedSlots = useMemo(
    () => members.map((m) => m.slot).filter(Boolean),
    [members]
  );

  useEffect(() => {
    if (!date) {
      setBookedSlots([]);
      return;
    }

    fetch(`${API_BASE}/api/slots/${date}`)
      .then((r) => r.json())
      .then((data) => setBookedSlots(Array.isArray(data) ? data : []))
      .catch(() => setBookedSlots([]));
  }, [date]);

  const changeFamilyCount = (count) => {
    const n = Number(count);
    setFamilyCount(n);
    setMembers((current) => {
      if (n > current.length) {
        return [
          ...current,
          ...Array.from({ length: n - current.length }, () => emptyMember()),
        ];
      }
      return current.slice(0, n);
    });
  };

  const updateMember = (index, field, value) => {
    setMembers((current) =>
      current.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    );
  };

  const next = () => {
    if (!email.trim()) return alert("Please enter the family email.");

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim()) return alert(`Enter Member ${i + 1} name.`);
      if (!m.id.trim()) return alert(`Enter Member ${i + 1} ID / Passport number.`);
      if (!/^\d{7,15}$/.test(m.phone)) return alert(`Enter a valid phone number for Member ${i + 1}.`);
      if (!m.address.trim()) return alert(`Enter Member ${i + 1} address.`);
    }

    setStep(2);
  };

  const submit = async () => {
    if (!date) return alert("Please select a date.");

    if (members.some((m) => !m.slot)) {
      return alert("Please select one time slot for every family member.");
    }

    if (new Set(selectedSlots).size !== selectedSlots.length) {
      return alert("Two family members cannot use the same slot.");
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/family-book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          date,
          members,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Family booking failed");
      if (!Array.isArray(data.tokens) || data.tokens.length !== members.length) {
        throw new Error("Booking created but token response is incomplete.");
      }

      setTokens(data.tokens);
      setDone(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.check}>✓</div>
          <h1 style={styles.successTitle}>Family Booking Confirmed</h1>
          <p style={styles.muted}>Each member has their own token.</p>

          <div style={{ display: "grid", gap: 14, marginTop: 28 }}>
            {members.map((m, i) => (
              <div key={i} style={styles.tokenCard}>
                <div>
                  <div style={styles.small}>MEMBER {i + 1}</div>
                  <div style={styles.personName}>{m.name}</div>
                  <div style={styles.mutedSmall}>{m.slot} · {m.purpose}</div>
                </div>

                <div style={styles.tokenBox}>
                  <span style={styles.smallLight}>TOKEN</span>
                  <strong>{tokens[i]}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <section style={styles.card}>
          <div style={styles.steps}>
            <div style={{ ...styles.step, ...(step === 1 ? styles.stepActive : styles.stepDone) }}>
              <span style={styles.stepCircle}>{step === 2 ? "✓" : "1"}</span>
              Personal Details
            </div>
            <div style={{ ...styles.step, ...(step === 2 ? styles.stepActive : {}) }}>
              <span style={styles.stepCircle}>2</span>
              Date & Time
            </div>
          </div>

          {step === 1 ? (
            <>
              <label style={styles.label}>Number of Family Members</label>
              <div style={styles.countRow}>
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => changeFamilyCount(n)}
                    style={{ ...styles.countBtn, ...(familyCount === n ? styles.countBtnActive : {}) }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <label style={styles.label}>Family Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="family@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {members.map((m, index) => (
                <div key={index} style={styles.memberCard}>
                  <h3 style={{ marginTop: 0 }}>Member {index + 1}</h3>

                  <input style={styles.input} placeholder="Full Name" value={m.name} onChange={(e) => updateMember(index, "name", e.target.value)} />
                  <input style={styles.input} placeholder="ID / Passport Number" value={m.id} onChange={(e) => updateMember(index, "id", e.target.value)} />
                  <input
                    style={styles.input}
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="Phone Number"
                    value={m.phone}
                    onChange={(e) => updateMember(index, "phone", e.target.value.replace(/\D/g, "").slice(0, 15))}
                  />
                  <input style={styles.input} placeholder="Address" value={m.address} onChange={(e) => updateMember(index, "address", e.target.value)} />
                  <select style={styles.input} value={m.purpose} onChange={(e) => updateMember(index, "purpose", e.target.value)}>
                    {PURPOSES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              ))}

              <button style={styles.primaryBtn} onClick={next}>Continue to Scheduling →</button>
            </>
          ) : (
            <>
              <button style={styles.backBtn} onClick={() => setStep(1)}>← Back to personal details</button>

              <label style={styles.label}>Appointment Date</label>
              <input
                style={styles.input}
                type="date"
                min={TODAY}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setMembers((current) => current.map((m) => ({ ...m, slot: "" })));
                }}
              />

              {members.map((m, index) => (
                <div key={index} style={styles.slotMemberCard}>
                  <div>
                    <div style={styles.small}>MEMBER {index + 1}</div>
                    <strong>{m.name}</strong>
                  </div>
                  <div style={styles.selectedText}>{m.slot || "Select from slots →"}</div>
                </div>
              ))}

              <button style={styles.primaryBtn} onClick={submit} disabled={loading}>
                {loading ? "Confirming..." : "Confirm Family Booking"}
              </button>
            </>
          )}
        </section>

        <aside style={styles.card}>
          <div style={styles.availHeader}>
            <h3 style={{ margin: 0 }}>Slot Availability</h3>
            {step === 2 && date && <span style={styles.openPill}>{available} open</span>}
          </div>

          {step !== 2 || !date ? (
            <div style={styles.placeholder}>
              <div style={{ fontSize: 30 }}>▣</div>
              <p>Select a date in Date & Time to view available slots.</p>
            </div>
          ) : (
            <>
              <div style={styles.statsRow}>
                <Stat value={available} label="Available" />
                <Stat value={bookedSlots.length} label="Booked" />
                <Stat value={ALL_SLOTS.length} label="Total" />
              </div>

              <div style={styles.slotGrid}>
                {ALL_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const selectedBy = members.findIndex((m) => m.slot === slot);
                  const isSelected = selectedBy >= 0;

                  return (
                    <button
                      key={slot}
                      disabled={isBooked}
                      onClick={() => {
                        if (isBooked) return;

                        if (isSelected) {
                          updateMember(selectedBy, "slot", "");
                          return;
                        }

                        const target = members.findIndex((m) => !m.slot);
                        if (target === -1) {
                          alert("All members already have a slot. Click a selected slot to remove it first.");
                          return;
                        }

                        updateMember(target, "slot", slot);
                      }}
                      style={{
                        ...styles.slotBtn,
                        ...(isBooked ? styles.bookedSlot : {}),
                        ...(isSelected ? styles.selectedSlot : {}),
                      }}
                    >
                      {slot.split(" - ")[0]}
                      {isSelected ? ` · M${selectedBy + 1}` : ""}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div style={styles.statBox}>
      <strong style={{ fontSize: 24 }}>{value}</strong>
      <span style={styles.mutedSmall}>{label}</span>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#f3f0eb", padding: 36, fontFamily: "Arial, sans-serif", color: "#1d2940" },
  layout: { maxWidth: 1360, margin: "0 auto", display: "grid", gridTemplateColumns: "1.25fr .85fr", gap: 28, alignItems: "start" },
  card: { background: "#fff", border: "1px solid #dfe5ec", borderRadius: 22, padding: 32, boxShadow: "0 4px 18px rgba(30,50,80,.05)" },
  steps: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 },
  step: { minHeight: 54, border: "1px solid #d8e0ea", borderRadius: 13, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", color: "#9aa8bb", fontWeight: 600 },
  stepActive: { background: "#203f69", borderColor: "#203f69", color: "#fff" },
  stepDone: { background: "#effaf3", borderColor: "#bdebc9", color: "#15803d" },
  stepCircle: { width: 26, height: 26, borderRadius: "50%", background: "#fff", color: "#203f69", display: "grid", placeItems: "center", fontSize: 12 },
  label: { display: "block", margin: "16px 0 7px", color: "#5d7290", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" },
  input: { width: "100%", minHeight: 48, border: "1px solid #d8e0ea", borderRadius: 11, padding: "0 14px", marginBottom: 12, outline: "none", background: "#fff" },
  countRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 10 },
  countBtn: { minHeight: 45, border: "1px solid #d8e0ea", borderRadius: 10, background: "#fff", color: "#71859f", fontWeight: 700, cursor: "pointer" },
  countBtnActive: { background: "#203f69", borderColor: "#203f69", color: "#fff" },
  memberCard: { marginTop: 18, padding: 20, border: "1px solid #e3e8ef", borderRadius: 16, background: "#fbfcfe" },
  primaryBtn: { width: "100%", minHeight: 52, border: 0, borderRadius: 11, background: "#203f69", color: "#fff", fontWeight: 700, cursor: "pointer", marginTop: 20 },
  backBtn: { border: 0, background: "transparent", color: "#607997", padding: 0, marginBottom: 18, cursor: "pointer" },
  slotMemberCard: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 15, border: "1px solid #e3e8ef", borderRadius: 12, padding: 14, marginBottom: 10, background: "#fbfcfe" },
  selectedText: { color: "#203f69", background: "#edf4fd", border: "1px solid #c8dcf4", borderRadius: 8, padding: "8px 10px", fontSize: 12 },
  availHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  openPill: { background: "#eefbf2", color: "#15803d", border: "1px solid #bdebc9", borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 700 },
  placeholder: { minHeight: 290, display: "grid", placeItems: "center", textAlign: "center", color: "#95a5bb", padding: 35 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 },
  statBox: { background: "#f7f9fb", borderRadius: 12, minHeight: 82, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  slotGrid: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 7 },
  slotBtn: { minHeight: 32, border: "1px solid #8abaf3", borderRadius: 7, background: "#e6f1ff", color: "#194f87", fontSize: 10, cursor: "pointer" },
  bookedSlot: { background: "#eef1f5", borderColor: "#d3dce6", color: "#b5c0cd", textDecoration: "line-through", opacity: .5, cursor: "not-allowed" },
  selectedSlot: { background: "#203f69", borderColor: "#203f69", color: "#fff", textDecoration: "none", opacity: 1 },
  successCard: { maxWidth: 850, margin: "40px auto", background: "#fff", border: "1px solid #dfe5ec", borderRadius: 22, padding: 38, boxShadow: "0 6px 25px rgba(30,50,80,.06)" },
  check: { width: 64, height: 64, margin: "0 auto", borderRadius: "50%", background: "#eaf9ef", color: "#15803d", display: "grid", placeItems: "center", fontSize: 30, fontWeight: 700 },
  successTitle: { textAlign: "center", marginBottom: 6 },
  muted: { color: "#8898ad", textAlign: "center" },
  mutedSmall: { color: "#8f9db0", fontSize: 11 },
  small: { color: "#99a6b7", fontSize: 9, letterSpacing: ".08em", fontWeight: 700 },
  smallLight: { color: "#bdcbe0", fontSize: 9, letterSpacing: ".08em" },
  personName: { fontSize: 15, fontWeight: 700, margin: "4px 0" },
  tokenCard: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, border: "1px solid #e2e7ee", borderRadius: 14, padding: 15, background: "#fbfcfe" },
  tokenBox: { minWidth: 135, background: "#203f69", color: "#fff", borderRadius: 10, padding: "10px 14px", textAlign: "center", display: "grid", gap: 4 },
};