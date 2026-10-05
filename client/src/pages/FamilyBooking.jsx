import { useEffect, useMemo, useState } from "react";
import { downloadFamilyConfirmation } from "../utils/downloadConfirmation";

const API_BASE = (import.meta.env.VITE_API_URL || "https://passport-booking-app.onrender.com/api").replace(/\/$/, "");
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
  isChild: false,
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

const HOLIDAYS = {
  "2026-11-11": "Embassy Holiday",
  "2026-12-25": "Christmas Day",
};

function formatCalendarDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateFromString(dateStr) {
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(dateStr, days) {
  const d = dateFromString(dateStr);
  d.setDate(d.getDate() + days);
  return formatCalendarDate(d);
}

function isClosedDate(dateStr) {
  const d = dateFromString(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6 || Boolean(HOLIDAYS[dateStr]);
}

function getCalendarDays(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, monthIndex, day));
  }
  return cells;
}

function monthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

async function getAvailableSlotsForDate(dateStr) {
  if (isClosedDate(dateStr)) return [];
  const response = await fetch(`${API_BASE}/slots/passport/${encodeURIComponent(dateStr)}`);
  if (!response.ok) throw new Error(`Slot request failed (${response.status})`);
  const blockedData = await response.json();
  const booked = normalizeBookedSlots(Array.isArray(blockedData) ? blockedData : []);
  return ALL_SLOTS.filter((slot) => !booked.some((blocked) => normalizeStartTime(blocked) === normalizeStartTime(slot)));
}

async function findNextAvailableFamilyDate(startDate, requiredSlots) {
  let current = startDate;

  for (let i = 0; i < 370; i++) {
    if (!isClosedDate(current) && current >= TODAY) {
      const availableSlots = await getAvailableSlotsForDate(current);
      if (availableSlots.length >= requiredSlots) {
        return { date: current, availableSlots };
      }
    }
    current = addDays(current, 1);
  }

  return null;
}

function AppointmentCalendar({ value, onChange, familySize, checking }) {
  const initialDate = value ? dateFromString(value) : dateFromString(TODAY);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (!value) return;
    const selected = dateFromString(value);
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());
  }, [value]);

  const todayDate = dateFromString(TODAY);
  const minMonthKey = todayDate.getFullYear() * 12 + todayDate.getMonth();
  const viewMonthKey = viewYear * 12 + viewMonth;
  const canGoPrev = viewMonthKey > minMonthKey;

  const goMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    const nextKey = next.getFullYear() * 12 + next.getMonth();
    if (nextKey < minMonthKey) return;
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const handleDateClick = async (dateObj) => {
    const dateStr = formatCalendarDate(dateObj);
    if (dateStr < TODAY || isClosedDate(dateStr) || checking) return;
    await onChange(dateStr);
  };

  return (
    <div style={styles.calendarWrap}>
      <div style={styles.calendarHeader}>
        <button
          type="button"
          onClick={() => goMonth(-1)}
          disabled={!canGoPrev || checking}
          style={{ ...styles.calendarNavBtn, opacity: canGoPrev && !checking ? 1 : 0.45 }}
        >
          ‹
        </button>

        <strong style={styles.calendarTitle}>{monthLabel(viewYear, viewMonth)}</strong>

        <button
          type="button"
          onClick={() => goMonth(1)}
          disabled={checking}
          style={{ ...styles.calendarNavBtn, opacity: checking ? 0.45 : 1 }}
        >
          ›
        </button>
      </div>

      <div style={styles.calendarWeekdays}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} style={styles.calendarWeekday}>{day}</div>
        ))}
      </div>

      <div style={styles.calendarGrid}>
        {getCalendarDays(viewYear, viewMonth).map((dayObj, index) => {
          if (!dayObj) return <div key={`empty-${index}`} />;

          const dateStr = formatCalendarDate(dayObj);
          const closed = isClosedDate(dateStr);
          const past = dateStr < TODAY;
          const selected = dateStr === value;
          const holiday = HOLIDAYS[dateStr];
          const disabled = closed || past || checking;

          return (
            <button
              type="button"
              key={dateStr}
              disabled={disabled}
              onClick={() => handleDateClick(dayObj)}
              title={holiday || (closed ? "Closed" : "")}
              style={{
                ...styles.calendarDay,
                ...(closed ? styles.calendarClosed : {}),
                ...(past ? styles.calendarPast : {}),
                ...(selected ? styles.calendarSelected : {}),
              }}
            >
              <span>{dayObj.getDate()}</span>
              {holiday && <small style={styles.calendarClosedLabel}>Closed</small>}
              {!holiday && dateObjIsWeekend(dayObj) && (
                <small style={styles.calendarClosedLabel}>Closed</small>
              )}
            </button>
          );
        })}
      </div>

      <div style={styles.calendarLegend}>
        <span><i style={{ ...styles.legendDot, background: "#dc2626" }} /> Closed</span>
        <span><i style={{ ...styles.legendDot, background: "#203f69" }} /> Selected</span>
      </div>

      {checking && (
        <div style={styles.calendarChecking}>
          Checking the next available family appointment…
        </div>
      )}
    </div>
  );
}

function dateObjIsWeekend(dateObj) {
  const day = dateObj.getDay();
  return day === 0 || day === 6;
}

function normalizeStartTime(value) {
  let raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.includes(" - ")) raw = raw.split(" - ")[0].trim();

  let m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;

  m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (m) {
    let h = Number(m[1]);
    const ap = m[3].toUpperCase();
    if (ap === "AM" && h === 12) h = 0;
    if (ap === "PM" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${m[2]}`;
  }
  return raw;
}

function normalizeBookedSlots(data) {
  const blockedStarts = new Set(
    (Array.isArray(data) ? data : [])
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.appointmentTime ?? item?.slot ?? item?.time ?? "";
      })
      .map(normalizeStartTime)
      .filter(Boolean)
  );
  return ALL_SLOTS.filter((slot) => blockedStarts.has(normalizeStartTime(slot)));
}

export default function FamilyBooking() {
  const [step, setStep] = useState(1);
  const [familyCount, setFamilyCount] = useState(2);
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [members, setMembers] = useState([emptyMember(), emptyMember()]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingDate, setCheckingDate] = useState(false);
  const [dateNotice, setDateNotice] = useState("");

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

    let cancelled = false;

    getAvailableSlotsForDate(date)
      .then((availableSlots) => {
        if (cancelled) return;
        setBookedSlots(ALL_SLOTS.filter(
          (slot) => !availableSlots.some(
            (availableSlot) =>
              normalizeStartTime(availableSlot) === normalizeStartTime(slot)
          )
        ));
      })
      .catch((err) => {
        console.error("FAMILY SLOT LOAD ERROR:", err);
        if (!cancelled) setBookedSlots(ALL_SLOTS);
      });

    return () => {
      cancelled = true;
    };
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
    if (!address.trim()) return alert("Please enter the family address.");

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name.trim()) return alert(`Enter Member ${i + 1} name.`);
      if (!/^\d{7,15}$/.test(m.phone)) {
        return alert(`Enter a valid phone number for Member ${i + 1}.`);
      }
      if (!m.isChild && !m.id.trim()) {
        return alert(`Enter Member ${i + 1} ID / Passport number, or choose Child.`);
      }
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
      const res = await fetch(`${API_BASE}/family-book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          address: address.trim(),
          date,
          members: members.map((member) => ({
            ...member,
            id: member.isChild ? "" : member.id.trim(),
            address: address.trim(),
            purpose: member.isChild ? "Child Passport" : "New Passport",
          })),
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
      <div className="family-page" style={styles.page}>
        <div className="family-success-card" style={styles.successCard}>
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
          <button type="button" style={{ ...styles.ghostBtn, marginTop: 20 }} onClick={() => downloadFamilyConfirmation({ email, date, members, tokens })}>
            Download Confirmation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="family-page" style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        .family-page { position: relative; overflow: hidden; }
        .family-page::before { content:""; position:absolute; top:-180px; right:-140px; width:420px; height:420px; border-radius:50%; background:rgba(214,169,75,.12); pointer-events:none; }
        .family-page::after { content:""; position:absolute; bottom:-220px; left:-180px; width:460px; height:460px; border-radius:50%; background:rgba(32,63,105,.07); pointer-events:none; }
        .family-hero { position:relative; z-index:1; max-width:1360px; margin:0 auto 24px; padding:24px 28px; border-radius:24px; background:linear-gradient(135deg,#17365f 0%,#244f80 62%,#315f8e 100%); color:#fff; display:flex; align-items:center; gap:18px; box-shadow:0 14px 35px rgba(23,54,95,.18); overflow:hidden; }
        .family-hero::after { content:""; position:absolute; width:220px; height:220px; border:1px solid rgba(255,255,255,.12); border-radius:50%; right:40px; top:-105px; }
        .family-hero-icon { width:54px; height:54px; flex:0 0 54px; border-radius:16px; display:grid; place-items:center; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18); color:#f2cc73; font-size:25px; box-shadow:inset 0 1px rgba(255,255,255,.15); }
        .family-hero h1 { margin:3px 0 5px; font-family:Georgia,serif; font-size:30px; font-weight:700; letter-spacing:-.02em; }
        .family-hero p { margin:0; color:rgba(255,255,255,.78); font-size:13px; line-height:1.5; }
        .family-eyebrow { color:#f2cc73; font-size:10px; font-weight:800; letter-spacing:.14em; }
        .family-hero-badge { margin-left:auto; position:relative; z-index:2; white-space:nowrap; padding:9px 13px; border-radius:999px; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.16); color:rgba(255,255,255,.9); font-size:11px; font-weight:700; }
        .family-hero-badge span { color:#78df9a; margin-right:5px; }
        .family-form-card, .family-slot-panel { position:relative; z-index:1; }
        .family-form-card input:focus { border-color:#4778aa !important; box-shadow:0 0 0 4px rgba(71,120,170,.10); }
        .family-count-row button, .family-member-card, .family-slot-member, .family-slot-panel { transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .family-count-row button:hover { transform:translateY(-2px); box-shadow:0 7px 15px rgba(32,63,105,.10); }
        .family-member-card:hover, .family-slot-member:hover { border-color:#c8d6e7 !important; box-shadow:0 8px 20px rgba(30,50,80,.06); }
        .family-slot-grid button { transition:transform .15s ease, box-shadow .15s ease, background .15s ease; }
        .family-slot-grid button:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 5px 12px rgba(32,63,105,.12); }
        .family-form-card > button:last-child { box-shadow:0 10px 20px rgba(32,63,105,.18); }
        .family-form-card > button:last-child:hover { filter:brightness(1.06); transform:translateY(-1px); }
        @media (max-width: 900px) {
          .family-page { padding: 22px 16px !important; overflow-x: hidden !important; }
          .family-hero { padding:20px; border-radius:20px; margin-bottom:18px; }
          .family-hero h1 { font-size:25px; }
          .family-hero-badge { display:none; }
          .family-layout { display:flex !important; flex-direction:column !important; width:100% !important; max-width:760px !important; gap:18px !important; }
          .family-form-card,.family-slot-panel { width:100% !important; min-width:0 !important; }
          .family-slot-panel { order:2 !important; }
        }
        @media (max-width: 600px) {
          html,body,#root { width:100% !important; max-width:100% !important; overflow-x:hidden !important; }
          .family-page { padding:12px 10px 28px !important; }
          .family-hero { margin:0 0 12px; padding:18px 15px; gap:12px; border-radius:16px; }
          .family-hero-icon { width:44px; height:44px; flex-basis:44px; border-radius:13px; font-size:20px; }
          .family-hero h1 { font-size:21px; }
          .family-hero p { font-size:11px; }
          .family-eyebrow { font-size:8px; }
          .family-layout { width:100% !important; max-width:none !important; margin:0 !important; gap:12px !important; }
          .family-form-card,.family-slot-panel { width:100% !important; min-width:0 !important; padding:16px !important; border-radius:14px !important; }
          .family-steps { grid-template-columns:1fr 1fr !important; gap:6px !important; margin-bottom:20px !important; }
          .family-steps > div { min-width:0 !important; min-height:48px !important; padding:0 9px !important; gap:6px !important; font-size:11px !important; }
          .family-count-row { grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:7px !important; }
          .family-member-card { width:100% !important; min-width:0 !important; padding:14px !important; margin-top:14px !important; }
          .family-member-card input,.family-member-card select,.family-form-card > input,.family-form-card > select { width:100% !important; min-width:0 !important; font-size:16px !important; }
          .family-slot-member { flex-direction:column !important; align-items:stretch !important; gap:8px !important; }
          .family-slot-member > div:last-child { width:100% !important; text-align:center !important; }
          .family-stats-row { grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:6px !important; }
          .family-slot-grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:6px !important; }
          .family-slot-grid button { width:100% !important; min-width:0 !important; min-height:38px !important; padding:5px 2px !important; font-size:10px !important; }
          .family-success-card { width:100% !important; max-width:none !important; margin:0 auto !important; padding:20px 14px !important; }
          .family-token-card { flex-direction:column !important; align-items:stretch !important; }
          .family-token-card > div:last-child { width:100% !important; min-width:0 !important; }
        }
        @media (max-width:380px) { .family-slot-grid { grid-template-columns:repeat(3,minmax(0,1fr)) !important; } }
      `}</style>

      <div className="family-hero">
        <div className="family-hero-icon">✦</div>
        <div>
          <div className="family-eyebrow">PASSPORT APPOINTMENT SERVICE</div>
          <h1>Family Passport Booking</h1>
          <p>Book appointments for your family together, with one shared address and email.</p>
        </div>
        <div className="family-hero-badge">
          <span>●</span> Secure booking
        </div>
      </div>

      <div className="family-layout" style={styles.layout}>
        <section className="family-form-card" style={styles.card}>
          <div className="family-steps" style={styles.steps}>
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
              <div className="family-count-row" style={styles.countRow}>
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

              <label style={styles.label}>Family Address</label>
              <input
                style={styles.input}
                placeholder="Same address for all family members"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div style={styles.familyInfoNote}>
                The email address and home address are entered once because they are shared by the family.
              </div>

              {members.map((m, index) => (
                <div key={index} className="family-member-card" style={styles.memberCard}>
                  <div style={styles.memberHeader}>
                    <h3 style={{ margin: 0 }}>Member {index + 1}</h3>
                    <span style={m.isChild ? styles.childPill : styles.adultPill}>
                      {m.isChild ? "Child" : "Adult"}
                    </span>
                  </div>

                  <input
                    style={styles.input}
                    placeholder="Full Name"
                    value={m.name}
                    onChange={(e) => updateMember(index, "name", e.target.value)}
                  />

                  <input
                    style={styles.input}
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="Phone Number"
                    value={m.phone}
                    onChange={(e) => updateMember(index, "phone", e.target.value.replace(/\D/g, "").slice(0, 15))}
                  />

                  <label style={styles.childChoice}>
                    <input
                      type="checkbox"
                      checked={m.isChild}
                      onChange={(e) =>
                        updateMember(index, "isChild", e.target.checked)
                      }
                    />
                    <span>This member is a child — no passport / ID number</span>
                  </label>

                  {!m.isChild && (
                    <input
                      style={styles.input}
                      placeholder="ID / Passport Number"
                      value={m.id}
                      onChange={(e) => updateMember(index, "id", e.target.value)}
                    />
                  )}
                </div>
              ))}

              <button style={styles.primaryBtn} onClick={next}>Continue to Scheduling →</button>
            </>
          ) : (
            <>
              <button style={styles.backBtn} onClick={() => setStep(1)}>← Back to personal details</button>

              <label style={styles.label}>Appointment Date</label>
              <AppointmentCalendar
                value={date}
                familySize={members.length}
                checking={checkingDate}
                onChange={async (requestedDate) => {
                  setCheckingDate(true);
                  setDateNotice("");
                  setMembers((current) => current.map((m) => ({ ...m, slot: "" })));

                  try {
                    const result = await findNextAvailableFamilyDate(
                      requestedDate,
                      members.length
                    );

                    if (!result) {
                      setDate("");
                      setBookedSlots(ALL_SLOTS);
                      setDateNotice(
                        "No date with enough available appointments was found in the next year."
                      );
                      return;
                    }

                    setDate(result.date);
                    setBookedSlots(
                      ALL_SLOTS.filter(
                        (slot) => !result.availableSlots.some(
                          (availableSlot) =>
                            normalizeStartTime(availableSlot) === normalizeStartTime(slot)
                        )
                      )
                    );

                    if (result.date !== requestedDate) {
                      setDateNotice(
                        `No family appointment was available on ${requestedDate}. The next available date is ${result.date}.`
                      );
                    }
                  } catch (err) {
                    console.error("FAMILY DATE CHECK ERROR:", err);
                    setDateNotice(
                      "We could not check availability right now. Please try again."
                    );
                  } finally {
                    setCheckingDate(false);
                  }
                }}
              />

              {dateNotice && (
                <div style={styles.dateNotice}>{dateNotice}</div>
              )}

              {members.map((m, index) => (
                <div key={index} className="family-slot-member" style={styles.slotMemberCard}>
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

        <aside className="family-slot-panel" style={styles.card}>
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
              <div className="family-stats-row" style={styles.statsRow}>
                <Stat value={available} label="Available" />
                <Stat value={bookedSlots.length} label="Booked" />
                <Stat value={ALL_SLOTS.length} label="Total" />
              </div>

              <div className="family-slot-grid" style={styles.slotGrid}>
                {ALL_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.some(booked => normalizeStartTime(booked) === normalizeStartTime(slot));
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
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#f7f4ef 0%,#eef3f8 100%)", padding: 32, fontFamily: "Arial, sans-serif", color: "#17263d" },
  layout: { maxWidth: 1360, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 24, alignItems: "start" },
  card: { background: "rgba(255,255,255,.96)", border: "1px solid #e1e7ef", borderRadius: 24, padding: 30, boxShadow: "0 14px 35px rgba(30,50,80,.07)" },
  steps: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 },
  step: { minHeight: 56, border: "1px solid #dce4ed", borderRadius: 14, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", color: "#8b9aae", fontWeight: 700, background: "#fafbfd" },
  stepActive: { background: "linear-gradient(135deg,#1b3d68,#2c5d8d)", borderColor: "#203f69", color: "#fff", boxShadow: "0 8px 18px rgba(32,63,105,.18)" },
  stepDone: { background: "#effaf3", borderColor: "#bdebc9", color: "#15803d" },
  stepCircle: { width: 26, height: 26, borderRadius: "50%", background: "#fff", color: "#203f69", display: "grid", placeItems: "center", fontSize: 12 },
  label: { display: "block", margin: "16px 0 7px", color: "#5d7290", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" },
  input: { width: "100%", minHeight: 48, border: "1px solid #d8e0ea", borderRadius: 11, padding: "0 14px", marginBottom: 12, outline: "none", background: "#fff" },
  countRow: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 10 },
  countBtn: { minHeight: 45, border: "1px solid #d8e0ea", borderRadius: 10, background: "#fff", color: "#71859f", fontWeight: 700, cursor: "pointer" },
  countBtnActive: { background: "#203f69", borderColor: "#203f69", color: "#fff" },
  memberCard: { marginTop: 18, padding: 20, border: "1px solid #e3e8ef", borderRadius: 18, background: "linear-gradient(180deg,#fbfdff,#f7f9fc)" },
  memberHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 },
  adultPill: { background: "#edf4fd", color: "#20558d", border: "1px solid #c8dcf4", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700 },
  childPill: { background: "#fff6df", color: "#8a6416", border: "1px solid #efd58f", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700 },
  childChoice: { display: "flex", alignItems: "center", gap: 9, margin: "2px 0 12px", color: "#526b88", fontSize: 12, lineHeight: 1.4, cursor: "pointer" },
  familyInfoNote: { marginTop: 2, marginBottom: 4, padding: "10px 12px", borderRadius: 10, background: "#f4f7fb", color: "#647991", fontSize: 12, lineHeight: 1.45 },
  primaryBtn: { width: "100%", minHeight: 54, border: 0, borderRadius: 13, background: "linear-gradient(135deg,#17365f,#285b8b)", color: "#fff", fontWeight: 800, cursor: "pointer", marginTop: 22, letterSpacing: ".01em" },
  backBtn: { border: 0, background: "transparent", color: "#607997", padding: 0, marginBottom: 18, cursor: "pointer" },
  slotMemberCard: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 15, border: "1px solid #e3e8ef", borderRadius: 12, padding: 14, marginBottom: 10, background: "#fbfcfe" },
  selectedText: { color: "#203f69", background: "#edf4fd", border: "1px solid #c8dcf4", borderRadius: 8, padding: "8px 10px", fontSize: 12 },
  availHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  openPill: { background: "#eefbf2", color: "#15803d", border: "1px solid #bdebc9", borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 700 },
  placeholder: { minHeight: 290, display: "grid", placeItems: "center", textAlign: "center", color: "#95a5bb", padding: 35 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 },
  statBox: { background: "#f7f9fb", borderRadius: 12, minHeight: 82, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  slotGrid: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 7 },
  slotBtn: { minHeight: 34, border: "1px solid #a9c9e9", borderRadius: 8, background: "linear-gradient(180deg,#eef6ff,#e3f0fd)", color: "#194f87", fontSize: 10, fontWeight: 700, cursor: "pointer" },
  bookedSlot: { background: "#eef1f5", borderColor: "#d3dce6", color: "#b5c0cd", textDecoration: "line-through", opacity: .5, cursor: "not-allowed" },
  selectedSlot: { background: "linear-gradient(135deg,#17365f,#2d6393)", borderColor: "#17365f", color: "#fff", textDecoration: "none", opacity: 1, boxShadow: "0 5px 12px rgba(32,63,105,.18)" },
  calendarWrap: { border: "1px solid #dce4ed", borderRadius: 18, padding: 17, background: "linear-gradient(180deg,#fff,#fbfcfe)", marginBottom: 16, boxShadow: "0 8px 22px rgba(30,50,80,.04)" },
  calendarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  calendarNavBtn: { width: 42, height: 42, border: "1px solid #d8e0ea", borderRadius: 10, background: "#fff", color: "#174b82", fontSize: 26, lineHeight: 1, cursor: "pointer" },
  calendarTitle: { fontFamily: "Georgia, serif", fontSize: 22, color: "#1d2940" },
  calendarWeekdays: { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6, marginBottom: 6 },
  calendarWeekday: { textAlign: "center", color: "#8798ad", fontSize: 11, fontWeight: 700, padding: "5px 0" },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 },
  calendarDay: { minHeight: 54, border: "1px solid #dce4ed", borderRadius: 11, background: "#fff", color: "#18243a", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 14, fontWeight: 700 },
  calendarClosed: { background: "#fff1f2", borderColor: "#ffb7bd", color: "#dc2626", cursor: "not-allowed" },
  calendarPast: { opacity: .35, cursor: "not-allowed" },
  calendarSelected: { background: "linear-gradient(135deg,#17365f,#2d6393)", borderColor: "#17365f", color: "#fff", boxShadow: "0 6px 14px rgba(32,63,105,.2)" },
  calendarClosedLabel: { fontSize: 9, lineHeight: 1, color: "#dc2626", fontWeight: 600 },
  calendarLegend: { display: "flex", gap: 18, alignItems: "center", marginTop: 12, color: "#6e819a", fontSize: 11 },
  legendDot: { display: "inline-block", width: 10, height: 10, borderRadius: "50%", marginRight: 5 },
  calendarChecking: { marginTop: 12, padding: "10px 12px", borderRadius: 9, background: "#f4f7fb", color: "#607997", fontSize: 12, textAlign: "center" },
  dateNotice: { marginTop: 8, padding: "11px 12px", borderRadius: 9, background: "#fff8e8", border: "1px solid #f2d58a", color: "#795b16", fontSize: 12, lineHeight: 1.45 },
  successCard: { maxWidth: 850, margin: "40px auto", background: "rgba(255,255,255,.97)", border: "1px solid #dfe5ec", borderRadius: 26, padding: 40, boxShadow: "0 18px 45px rgba(30,50,80,.10)" },
  check: { width: 72, height: 72, margin: "0 auto", borderRadius: "50%", background: "linear-gradient(135deg,#e8faef,#d7f4e2)", color: "#15803d", display: "grid", placeItems: "center", fontSize: 32, fontWeight: 800, boxShadow: "0 10px 25px rgba(21,128,61,.12)" },
  successTitle: { textAlign: "center", marginBottom: 6 },
  muted: { color: "#8898ad", textAlign: "center" },
  mutedSmall: { color: "#8f9db0", fontSize: 11 },
  small: { color: "#99a6b7", fontSize: 9, letterSpacing: ".08em", fontWeight: 700 },
  smallLight: { color: "#bdcbe0", fontSize: 9, letterSpacing: ".08em" },
  personName: { fontSize: 15, fontWeight: 700, margin: "4px 0" },
  tokenCard: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, border: "1px solid #e2e7ee", borderRadius: 14, padding: 15, background: "#fbfcfe" },
  tokenBox: { minWidth: 135, background: "#203f69", color: "#fff", borderRadius: 10, padding: "10px 14px", textAlign: "center", display: "grid", gap: 4 },
};