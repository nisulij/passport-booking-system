import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const STATUS_CONFIG = {
  ongoing:          { label: "Ongoing",        bg: "#FFF8ED", text: "#92400E", dot: "#F59E0B", border: "#FDE68A" },
  completed:        { label: "Completed",      bg: "#ECFDF5", text: "#065F46", dot: "#10B981", border: "#A7F3D0" },
  "no participate": { label: "No Participate", bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", border: "#FECACA" },
};


const SERVICE_CONFIG = {
  passport: { label: "Passport", icon: "🛂", bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  birth_certificate: { label: "Birth Certificate", icon: "📜", bg: "#FFF8ED", text: "#9A5A00", border: "#F5D89A" },
  other: { label: "Other Services", icon: "🏛", bg: "#F3F0FF", text: "#6D28D9", border: "#DDD6FE" },
};

function getServiceType(b) {
  return b.serviceType || "passport";
}

const AVATAR_COLORS = [
  { bg: "#EDE9FE", text: "#4C1D95" },
  { bg: "#DBEAFE", text: "#1E3A8A" },
  { bg: "#D1FAE5", text: "#064E3B" },
  { bg: "#FCE7F3", text: "#831843" },
  { bg: "#FEF3C7", text: "#78350F" },
  { bg: "#CFFAFE", text: "#164E63" },
];

function getAvatarColor(name = "A") {
  const safeName = String(name || "A");
  return AVATAR_COLORS[safeName.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, total, icon, accentBg, accentText, accentBorder, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 16, padding: "22px 24px",
      border: "1px solid #E9EBF0",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: accentBg, border: `1px solid ${accentBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "#9CA3AF", paddingTop: 4 }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, color: "#111827", letterSpacing: "-1px", lineHeight: 1, marginBottom: 14 }}>
        {value}
      </div>
      <div style={{ height: 3, borderRadius: 99, background: "#F3F4F6" }}>
        <div style={{ height: "100%", borderRadius: 99, background: accentText, width: `${pct}%`, transition: "width 1s cubic-bezier(0.22,1,0.36,1)" }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: "#9CA3AF" }}>{Math.round(pct)}% of total</div>
    </div>
  );
}

// ── Status Select — portal-rendered so it escapes all overflow:hidden parents ──
function StatusSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.ongoing;

  const toggleMenu = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + window.scrollY + 4, left: r.left + window.scrollX });
    }
    setOpen(o => !o);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Close on scroll
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleMenu}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px 4px 8px", borderRadius: 99,
          background: cfg.bg, color: cfg.text,
          border: `1px solid ${cfg.border}`,
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
        {cfg.label}
        <svg
          width="9" height="9" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s", flexShrink: 0 }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: "#FFFFFF",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)",
            minWidth: 156,
            overflow: "hidden",
            animation: "ddFadeIn 0.14s ease",
          }}
        >
          {Object.entries(STATUS_CONFIG).map(([key, c]) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              onMouseEnter={e => { if (key !== value) e.currentTarget.style.background = "#F8FAFC"; }}
              onMouseLeave={e => { if (key !== value) e.currentTarget.style.background = "transparent"; }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "10px 13px",
                background: key === value ? c.bg : "transparent",
                border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: c.text,
                fontFamily: "inherit", textAlign: "left",
                transition: "background 0.1s",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
              {c.label}
              {key === value && (
                <svg style={{ marginLeft: "auto" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.dot} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [passportType, setPassportType] = useState("all");

  useEffect(() => {
    fetch("https://passport-booking-app.onrender.com/api/admin/bookings")
      .then(r => r.json())
      .then(data => { setBookings(data); setLoading(false); })
      .catch(() => { setBookings([]); setLoading(false); });
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`https://passport-booking-app.onrender.com/api/admin/status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {}
    setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
  };

  const counts = {
    total:     bookings.length,
    ongoing:   bookings.filter(b => b.status === "ongoing").length,
    completed: bookings.filter(b => b.status === "completed").length,
    absent:    bookings.filter(b => b.status === "no participate").length,
  };

  const serviceCounts = {
    passport: bookings.filter(b => getServiceType(b) === "passport").length,
    birth: bookings.filter(b => getServiceType(b) === "birth_certificate").length,
    other: bookings.filter(b => getServiceType(b) === "other").length,
  };

  const getBookingType = (b) => {
    if (b.bookingType === "family" || b.title === "Family" || b.token?.startsWith("F") || b.token?.startsWith("PF")) {
      return "family";
    }
    return "individual";
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    if (q && !`${b.name || ""} ${b.email || ""} ${b.token || ""} ${b.idNumber || ""} ${b.purpose || ""}`.toLowerCase().includes(q)) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (serviceFilter !== "all" && getServiceType(b) !== serviceFilter) return false;
    if (serviceFilter === "passport" && passportType !== "all" && getBookingType(b) !== passportType) return false;
    return true;
  }).sort((a, b) => {
    let av = a[sortField] || "";
    let bv = b[sortField] || "";
    if (sortField === "date") { av = new Date(av); bv = new Date(bv); }
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 3, opacity: sortField === field ? 0.65 : 0.22, fontSize: 10 }}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  const COL_HEADERS = [
    { label: "Token",   field: "token"       },
    { label: "Name",    field: "name"        },
    { label: "Service", field: "serviceType" },
    { label: "Purpose", field: "purpose"     },
    { label: "Email",   field: "email"       },
    { label: "Phone",   field: null          },
    { label: "ID No.",  field: "idNumber"    },
    { label: "Date",    field: "date"        },
    { label: "Slot",    field: "slot"        },
    { label: "Booking", field: null          },
    { label: "Status",  field: "status"      },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6F9", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 8px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ddFadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .th-sortable { cursor: pointer; user-select: none; }
        .th-sortable:hover { color: #1D4ED8 !important; }
        .trow:hover td { background: #F8FAFF !important; }
        .filter-btn { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .filter-btn:hover { border-color: #93C5FD !important; }
        input:focus { outline: none; border-color: #3B82F6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
      `}</style>

      {/* Navbar */}
      <div style={{
        background: "#FFFFFF", borderBottom: "1px solid #E9EBF0",
        height: 60, padding: "0 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1D4ED8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛂</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: "-0.2px" }}>Consular Admin</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>Appointment Management</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 99, background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", display: "block" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#065F46" }}>Live</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 36px", maxWidth: 1440, margin: "0 auto" }}>

        {/* Heading */}
        <div style={{ marginBottom: 28, animation: "fadeUp 0.35s ease" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>Overview</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 3 }}>Manage passport, birth certificate and other consular appointments</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          <StatCard title="Total Bookings"     value={counts.total}         total={counts.total} icon="📋" accentBg="#EFF6FF" accentText="#1D4ED8" accentBorder="#BFDBFE" delay={0} />
          <StatCard title="Passport"           value={serviceCounts.passport} total={counts.total} icon="🛂" accentBg="#EFF6FF" accentText="#2563EB" accentBorder="#BFDBFE" delay={70} />
          <StatCard title="Birth Certificate"  value={serviceCounts.birth}    total={counts.total} icon="📜" accentBg="#FFF8ED" accentText="#D97706" accentBorder="#FDE68A" delay={140} />
          <StatCard title="Other Services"     value={serviceCounts.other}    total={counts.total} icon="🏛" accentBg="#F3F0FF" accentText="#7C3AED" accentBorder="#DDD6FE" delay={210} />
        </div>

        {/* Table card */}
        <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #E9EBF0", animation: "fadeUp 0.4s ease 0.15s both" }}>

          {/* Toolbar */}
          <div style={{
            padding: "16px 24px", borderBottom: "1px solid #F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>All Bookings</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{filtered.length} of {bookings.length} records</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Service category toggle */}
              <div style={{ display: "flex", gap: 2, background: "#F3F4F6", borderRadius: 10, padding: 3, border: "1px solid #E9EBF0", flexWrap: "wrap" }}>
                {[["all","All","📋"],["passport","Passport","🛂"],["birth_certificate","Birth Certificate","📜"],["other","Other","🏛"]].map(([val, label, icon]) => (
                  <button
                    key={val}
                    onClick={() => {
                      setServiceFilter(val);
                      if (val !== "passport") setPassportType("all");
                    }}
                    style={{
                      padding: "6px 13px",
                      borderRadius: 8,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      background: serviceFilter === val ? "#FFFFFF" : "transparent",
                      color: serviceFilter === val ? "#1D4ED8" : "#6B7280",
                      boxShadow: serviceFilter === val ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {serviceFilter === "passport" && (
                <div style={{ display: "flex", gap: 5 }}>
                  {[["all","All Passport"],["individual","Individual"],["family","Family"]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setPassportType(val)}
                      style={{
                        padding: "6px 11px",
                        borderRadius: 8,
                        border: `1px solid ${passportType === val ? "#111827" : "#E9EBF0"}`,
                        background: passportType === val ? "#111827" : "#FFFFFF",
                        color: passportType === val ? "#FFFFFF" : "#6B7280",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
{/* Search */}
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  placeholder="Search name, token, ID…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                    borderRadius: 9, border: "1px solid #E9EBF0",
                    fontSize: 13, fontFamily: "inherit", color: "#111827",
                    width: 210, background: "#FAFAFA",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                />
              </div>

              {/* Status filter pills */}
              <div style={{ display: "flex", gap: 5 }}>
                {[
                  { key: "all",            label: "All"       },
                  { key: "ongoing",        label: "Ongoing"   },
                  { key: "completed",      label: "Completed" },
                  { key: "no participate", label: "Absent"    },
                ].map(({ key, label }) => (
                  <button key={key} className="filter-btn" onClick={() => setFilterStatus(key)} style={{
                    padding: "6px 13px", borderRadius: 8,
                    border: `1px solid ${filterStatus === key ? "#1D4ED8" : "#E9EBF0"}`,
                    background: filterStatus === key ? "#EFF6FF" : "#FFFFFF",
                    color: filterStatus === key ? "#1D4ED8" : "#6B7280",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            {loading ? (
              <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, border: "2px solid #E9EBF0", borderTopColor: "#1D4ED8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>Loading bookings…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 14, color: "#6B7280" }}>No bookings match your filters</div>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                <thead>
                  <tr style={{ background: "#FAFAFA" }}>
                    {COL_HEADERS.map(({ label, field }) => (
                      <th
                        key={label}
                        className={field ? "th-sortable" : ""}
                        onClick={field ? () => handleSort(field) : undefined}
                        style={{
                          padding: "11px 18px", textAlign: "left",
                          fontSize: 11, fontWeight: 600,
                          letterSpacing: "0.6px", textTransform: "uppercase",
                          color: sortField === field ? "#1D4ED8" : "#9CA3AF",
                          borderBottom: "1px solid #F3F4F6",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}{field && <SortIcon field={field} />}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b, i) => {
                    const avatar = getAvatarColor(b.name);
                    return (
                      <tr key={b._id} className="trow" style={{ opacity: 0, animation: `fadeUp 0.28s ease ${i * 35}ms forwards` }}>

                        {/* Token */}
                        <td style={td}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "3px 9px", borderRadius: 6, border: "1px solid #BFDBFE", letterSpacing: "0.3px", fontFamily: "monospace" }}>
                            {b.token}
                          </span>
                        </td>

                        {/* Name */}
                        <td style={td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatar.bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: avatar.text }}>
                              {String(b.name || "A").charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{getServiceType(b) === "passport" && b.title !== "Family" ? `${b.title || ""} ` : ""}{b.name}</span>
                          </div>
                        </td>

                        {/* Service */}
                        <td style={td}>
                          {(() => {
                            const cfg = SERVICE_CONFIG[getServiceType(b)] || SERVICE_CONFIG.passport;
                            return (
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "3px 10px",
                                borderRadius: 99,
                                background: cfg.bg,
                                color: cfg.text,
                                border: `1px solid ${cfg.border}`,
                                fontSize: 11,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}>
                                {cfg.icon} {cfg.label}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Purpose */}
                        <td style={{ ...td, color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>
                          {b.purpose || "—"}
                        </td>

                        {/* Email */}
                        <td style={{ ...td, color: "#6B7280", fontSize: 13 }}>{b.email}</td>

                        {/* Phone */}
                        <td style={{ ...td, color: "#6B7280", fontSize: 13, whiteSpace: "nowrap" }}>{b.phone}</td>

                        {/* ID */}
                        <td style={td}>
                          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#374151", background: "#F9FAFB", padding: "2px 8px", borderRadius: 5, border: "1px solid #E9EBF0" }}>
                            {b.idNumber}
                          </span>
                        </td>

                        {/* Date */}
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                            {new Date(b.date + "T00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </td>

                        {/* Slot */}
                        <td style={{ ...td, whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6B7280" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            {b.slot}
                          </div>
                        </td>
                        {/* Booking type */}
                        <td style={td}>
                          {getServiceType(b) === "passport" ? (
                            getBookingType(b) === "family" ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "#EDE9FE", color: "#5B21B6", border: "1px solid #DDD6FE", fontSize: 11, fontWeight: 600 }}>
                                👨‍👩‍👧 Family
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 99, background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", fontSize: 11, fontWeight: 600 }}>
                                👤 Individual
                              </span>
                            )
                          ) : (
                            <span style={{ color: "#9CA3AF", fontSize: 11 }}>—</span>
                          )}
                        </td>

                        {/* Status — portal dropdown, never clipped */}
                        <td style={{ ...td, paddingRight: 24 }}>
                          <StatusSelect value={b.status || "ongoing"} onChange={(s) => updateStatus(b._id, s)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "13px 24px", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Showing {filtered.length} of {bookings.length} records</span>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 600, border: `1px solid ${cfg.border}` }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
                  {bookings.filter(b => b.status === key).length} {cfg.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const td = {
  padding: "13px 18px",
  borderBottom: "1px solid #F3F4F6",
  verticalAlign: "middle",
  background: "transparent",
  transition: "background 0.12s",
};