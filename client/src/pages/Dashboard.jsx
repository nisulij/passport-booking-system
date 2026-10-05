import { useEffect, useMemo, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://passport-booking-app.onrender.com/api";

const TABS = [
  { key:"passport", label:"Passport", icon:"🛂", accent:"#2563EB" },
  { key:"birth_certificate", label:"Birth Certificate", icon:"📜", accent:"#D97706" },
  { key:"other", label:"Other Services", icon:"🏛️", accent:"#7C3AED" },
];
const STATUSES = ["ongoing","completed","no participate"];

function labelService(key){ return TABS.find(x=>x.key===key)?.label || key; }
function displayDate(v){ if(!v) return "—"; const d=new Date(`${v}T00:00:00`); return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}); }
function getDate(r){ return r.appointmentDate || r.date || ""; }
function getTime(r){ return r.appointmentTime || r.slot || ""; }
function getRef(r){ return r.reference || r.token || "—"; }
function getPhone(r){ return r.mobile || r.phone || "—"; }
function getSource(r){ return r.source === "excel" ? "Excel" : "Live"; }
function initials(name="A"){ return String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase() || "A"; }

function Modal({children,onClose,title}){
  return <div style={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div style={styles.modal}><div style={styles.modalHead}><div><div style={styles.modalTitle}>{title}</div><div style={styles.modalSub}>Edit appointment details</div></div><button style={styles.close} onClick={onClose}>×</button></div>{children}</div></div>;
}

function EditModal({row,onClose,onSave}){
  const [form,setForm]=useState({
    reference:getRef(row), name:row.name||"", email:row.email||"", mobile:getPhone(row)==="—"?"":getPhone(row),
    idNumber:row.idNumber||"", purpose:row.purpose||"", appointmentDate:getDate(row), appointmentTime:getTime(row),
    status:row.status||"ongoing", title:row.title||"", address:row.address||"", bookingType:row.bookingType||"individual"
  });
  const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function submit(e){
    e.preventDefault(); setSaving(true); setError("");
    try{
      const isExcel=row.source==="excel";
      const url=isExcel ? `${API}/admin/imports/${row.serviceType}/${row._id}` : `${API}/admin/bookings/${row._id}`;
      const body=isExcel ? {reference:form.reference,appointmentDate:form.appointmentDate,appointmentTime:form.appointmentTime,name:form.name,email:form.email,mobile:form.mobile,rawData:row.rawData||{}} : {title:form.title,name:form.name,idNumber:form.idNumber,email:form.email,phone:form.mobile,address:form.address,purpose:form.purpose,date:form.appointmentDate,slot:form.appointmentTime,status:form.status,bookingType:form.bookingType};
      const r=await fetch(url,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); const data=await r.json();
      if(!r.ok) throw new Error(data.message||"Update failed");
      onSave(isExcel?data.row:data.booking);
    }catch(err){setError(err.message)} finally{setSaving(false)}
  }
  return <Modal title={`${row.source} appointment`} onClose={onClose}>
    <form onSubmit={submit}>
      <div style={styles.formGrid}>
        <Field label="Reference / Token" value={form.reference} onChange={v=>set("reference",v)} />
        <Field label="Name" required value={form.name} onChange={v=>set("name",v)} />
        <Field label="Email" value={form.email} onChange={v=>set("email",v)} />
        <Field label="Mobile / Phone" value={form.mobile} onChange={v=>set("mobile",v)} />
        <Field label="Date" type="date" value={form.appointmentDate} onChange={v=>set("appointmentDate",v)} />
        <Field label="Time / Slot" value={form.appointmentTime} onChange={v=>set("appointmentTime",v)} />
        {row.source!=="excel" && <>
          <Field label="Title" value={form.title} onChange={v=>set("title",v)} />
          <Field label="ID / Passport No." value={form.idNumber} onChange={v=>set("idNumber",v)} />
          <Field label="Purpose" value={form.purpose} onChange={v=>set("purpose",v)} />
          <Field label="Address" value={form.address} onChange={v=>set("address",v)} />
          <label style={styles.field}><span style={styles.label}>Booking Type</span><select style={styles.input} value={form.bookingType} onChange={e=>set("bookingType",e.target.value)}><option value="individual">Individual</option><option value="family">Family</option><option value="service">Service</option></select></label>
          <label style={styles.field}><span style={styles.label}>Status</span><select style={styles.input} value={form.status} onChange={e=>set("status",e.target.value)}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
        </>}
      </div>
      {error&&<div style={styles.error}>{error}</div>}
      <div style={styles.modalActions}><button type="button" style={styles.secondary} onClick={onClose}>Cancel</button><button disabled={saving} style={styles.primary}>{saving?"Saving…":"Save Changes"}</button></div>
    </form>
  </Modal>;
}
function Field({label,value,onChange,type="text",required=false}){return <label style={styles.field}><span style={styles.label}>{label}{required&&" *"}</span><input required={required} type={type} value={value} onChange={e=>onChange(e.target.value)} style={styles.input}/></label>}

export default function Dashboard(){
  const [tab,setTab]=useState("passport");
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
  const [search,setSearch]=useState(""); const [date,setDate]=useState(""); const [source,setSource]=useState("all"); const [status,setStatus]=useState("all");
  const [sort,setSort]=useState({field:"date",dir:"asc"}); const [edit,setEdit]=useState(null); const [uploading,setUploading]=useState(false); const [uploadProgress,setUploadProgress]=useState(0); const [uploadStatus,setUploadStatus]=useState(""); const [message,setMessage]=useState("");
  const inputRef=useRef();

  async function load(){ setLoading(true); setError(""); try{const r=await fetch(`${API}/admin/appointments/${tab}`); const d=await r.json(); if(!r.ok)throw new Error(d.message||"Failed"); setRows(Array.isArray(d)?d:[]);}catch(e){setError(e.message)}finally{setLoading(false)} }
  useEffect(()=>{setSearch("");setDate("");setSource("all");setStatus("all");load();},[tab]);

  const dates=useMemo(()=>Array.from(new Set(rows.map(getDate).filter(Boolean))).sort(),[rows]);
  const counts=useMemo(()=>({total:rows.length,live:rows.filter(x=>x.source==="live").length,excel:rows.filter(x=>x.source==="excel").length}),[rows]);
  const filtered=useMemo(()=>{
    const q=search.toLowerCase().trim();
    return rows.filter(r=>{
      if(date&&getDate(r)!==date)return false; if(source!=="all"&&r.source!==source)return false; if(status!=="all"&&r.status!==status)return false;
      if(q&&!`${getRef(r)} ${r.name||""} ${r.email||""} ${getPhone(r)} ${r.idNumber||""} ${r.purpose||""}`.toLowerCase().includes(q))return false; return true;
    }).sort((a,b)=>{const key=sort.field;let av=key==="date"?`${getDate(a)} ${getTime(a)}`:key==="source"?getSource(a):String(a[key]||"");let bv=key==="date"?`${getDate(b)} ${getTime(b)}`:key==="source"?getSource(b):String(b[key]||"");const n=av.localeCompare(bv);return sort.dir==="asc"?n:-n;});
  },[rows,date,source,status,search,sort]);

  function sortBy(field){setSort(s=>s.field===field?{field,dir:s.dir==="asc"?"desc":"asc"}:{field,dir:"asc"})}
  function upload(file){
    if(!file || uploading) return;
    setUploading(true); setUploadProgress(1); setUploadStatus("Preparing upload…"); setMessage(""); setError("");
    const fd=new FormData(); fd.append("file",file);
    const xhr=new XMLHttpRequest();
    xhr.open("POST",`${API}/admin/imports/${tab}/excel`,true);
    xhr.upload.onprogress=(event)=>{
      if(!event.lengthComputable) return;
      const pct=Math.max(1,Math.min(95,Math.round((event.loaded/event.total)*95)));
      setUploadProgress(pct);
      setUploadStatus(pct >= 95 ? "Processing Excel file…" : `Uploading ${pct}%…`);
    };
    xhr.onload=async()=>{
      try{
        let data={};
        try{ data=JSON.parse(xhr.responseText || "{}"); }catch(_){ throw new Error(`Server returned an invalid response (${xhr.status}).`); }
        if(xhr.status<200 || xhr.status>=300) throw new Error(data.message||`Upload failed (${xhr.status})`);
        setUploadProgress(100); setUploadStatus("Upload complete ✓");
        setMessage(`${data.fileName}: ${data.imported} new, ${data.updated} updated, ${data.skipped} skipped.`);
        await load();
      }catch(e){ setError(e.message); setUploadStatus(""); }
      finally{
        setUploading(false);
        setTimeout(()=>{setUploadProgress(0);setUploadStatus("");},900);
        if(inputRef.current) inputRef.current.value="";
      }
    };
    xhr.onerror=()=>{
      setError("Upload failed. Please check that the local backend is running.");
      setUploading(false); setUploadProgress(0); setUploadStatus("");
      if(inputRef.current) inputRef.current.value="";
    };
    xhr.onabort=()=>{
      setError("Upload cancelled.");
      setUploading(false); setUploadProgress(0); setUploadStatus("");
      if(inputRef.current) inputRef.current.value="";
    };
    xhr.send(fd);
  }
  async function remove(row){
    if(!window.confirm(`Delete this ${row.source} appointment for ${row.name||"this applicant"}?`))return;
    try{const url=row.source==="excel"?`${API}/admin/imports/${tab}/${row._id}`:`${API}/admin/bookings/${row._id}`;const r=await fetch(url,{method:"DELETE"});const d=await r.json();if(!r.ok)throw new Error(d.message||"Delete failed");setRows(x=>x.filter(a=>a._id!==row._id||a.source!==row.source));setMessage("Appointment deleted.");}catch(e){setError(e.message)}
  }
  function saved(updated){setRows(x=>x.map(a=>a._id===updated._id&&a.source===updated.source?{...a,...(updated.source?updated:{...updated,source:"live",sourceLabel:"Live"})}:a));setEdit(null);setMessage("Appointment updated.");}
  function download(){const qs=date?`?date=${encodeURIComponent(date)}`:"";window.open(`${API}/admin/appointments/${tab}/download${qs}`,"_blank");}

  const active=TABS.find(x=>x.key===tab);
  return <div style={styles.page}>
    <header style={styles.nav}><div style={styles.brand}><div style={styles.logo}>🛂</div><div><div style={styles.brandTitle}>Consular Admin</div><div style={styles.brandSub}>Appointment Management</div></div></div><div style={styles.live}>● Live</div></header>
    <main style={styles.main}>
      <div style={styles.heading}><div><h1 style={styles.h1}>Appointments</h1><p style={styles.sub}>Live bookings and Excel appointments in one table, separated by service.</p></div></div>
      <div style={styles.tabs}>{TABS.map(t=><button key={t.key} onClick={()=>setTab(t.key)} style={{...styles.tab, ...(tab===t.key?{background:"#fff",color:t.accent,borderColor:t.accent,boxShadow:"0 2px 7px rgba(0,0,0,.06)"}:{})}}>{t.icon} {t.label}</button>)}</div>
      <section style={{...styles.card,borderTop:`3px solid ${active.accent}`}}>
        <div style={styles.toolbarTop}><div><div style={styles.cardTitle}>{active.icon} {active.label} Appointments</div><div style={styles.cardSub}>{counts.total} total · {counts.live} live · {counts.excel} Excel</div></div><div style={styles.actions}><input ref={inputRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>upload(e.target.files?.[0])}/><button style={styles.upload} disabled={uploading} onClick={()=>inputRef.current?.click()}>{uploading?"Uploading…":`📤 Upload ${active.label} Excel`}</button><button style={styles.download} onClick={download}>⬇ Download {date?displayDate(date):"All"}</button></div></div>
        <div style={styles.filters}><input style={styles.search} placeholder="Search reference, name, email, phone…" value={search} onChange={e=>setSearch(e.target.value)}/><select style={styles.filter} value={date} onChange={e=>setDate(e.target.value)}><option value="">All dates</option>{dates.map(d=><option key={d} value={d}>{displayDate(d)}</option>)}</select><select style={styles.filter} value={source} onChange={e=>setSource(e.target.value)}><option value="all">Live + Excel</option><option value="live">Live only</option><option value="excel">Excel only</option></select>{tab!=="other"&&<select style={styles.filter} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All status</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select>}</div>
        {uploading&&<div style={styles.progressWrap}><div style={styles.progressTop}><span>{uploadStatus || "Uploading…"}</span><b>{uploadProgress}%</b></div><div style={styles.progressTrack}><div style={{...styles.progressBar,width:`${uploadProgress}%`}}/></div><div style={styles.progressHint}>{uploadProgress<95?"Uploading your Excel file securely…":"Excel uploaded. Processing appointments…"}</div></div>}
        {message&&<div style={styles.success}>{message}</div>}{error&&<div style={styles.error}>{error}</div>}
        <div style={{overflowX:"auto"}}>{loading?<div style={styles.empty}>Loading appointments…</div>:filtered.length===0?<div style={styles.empty}>No appointments found in this tab.</div>:<table style={styles.table}><thead><tr>{[["source","Source"],["reference","Reference"],["name","Name"],["email","Email"],["mobile","Mobile"],["date","Date"],["time","Time"],["idNumber","ID / Passport"],["status","Status"]].map(([f,l])=><th key={f} onClick={()=>sortBy(f)} style={styles.th}>{l} <span style={{opacity:sort.field===f?.65:.25}}>{sort.field===f?(sort.dir==="asc"?"▲":"▼"):"↕"}</span></th>)}<th style={styles.th}>Actions</th></tr></thead><tbody>{filtered.map(r=><tr key={`${r.source}-${r._id}`} style={styles.tr}><td style={styles.td}><span style={{...styles.badge, ...(r.source==="excel"?styles.excelBadge:styles.liveBadge)}}>{r.source==="excel"?"Excel":"Live"}</span></td><td style={styles.td}><b style={styles.ref}>{getRef(r)}</b></td><td style={styles.td}><div style={styles.person}><span style={{...styles.avatar,background:active.accent}}>{initials(r.name)}</span><span>{r.name||"—"}</span></div></td><td style={styles.td}>{r.email||"—"}</td><td style={styles.td}>{getPhone(r)}</td><td style={styles.td}>{displayDate(getDate(r))}</td><td style={styles.td}>{getTime(r)||"—"}</td><td style={styles.td}>{r.idNumber||"—"}</td><td style={styles.td}>{r.status?<span style={styles.status}>{r.status}</span>:"—"}</td><td style={{...styles.td,whiteSpace:"nowrap"}}><button style={styles.editBtn} onClick={()=>setEdit(r)}>Edit</button><button style={styles.deleteBtn} onClick={()=>remove(r)}>Delete</button></td></tr>)}</tbody></table>}</div>
        <div style={styles.footer}>Showing {filtered.length} of {rows.length} {active.label.toLowerCase()} appointments</div>
      </section>
    </main>
    {edit&&<EditModal row={edit} onClose={()=>setEdit(null)} onSave={saved}/>} 
  </div>;
}

const styles={
 page:{minHeight:"100vh",background:"#F4F6F9",fontFamily:"Inter,Segoe UI,system-ui,sans-serif",color:"#111827"},progressWrap:{margin:"12px 22px 0",padding:"12px 14px",background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10},progressTop:{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#334155",marginBottom:8},progressTrack:{height:9,background:"#E5E7EB",borderRadius:99,overflow:"hidden"},progressBar:{height:"100%",background:"#2563EB",borderRadius:99,transition:"width .2s ease"},progressHint:{fontSize:10,color:"#94A3B8",marginTop:6},nav:{height:62,background:"#fff",borderBottom:"1px solid #E5E7EB",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 36px",position:"sticky",top:0,zIndex:20},brand:{display:"flex",alignItems:"center",gap:11},logo:{width:34,height:34,borderRadius:9,background:"#1D4ED8",display:"grid",placeItems:"center",fontSize:17},brandTitle:{fontWeight:700,fontSize:14},brandSub:{fontSize:11,color:"#9CA3AF",marginTop:2},live:{fontSize:11,fontWeight:700,color:"#047857",background:"#ECFDF5",border:"1px solid #A7F3D0",padding:"6px 10px",borderRadius:99},main:{maxWidth:1700,margin:"0 auto",padding:"30px 36px"},heading:{marginBottom:20},h1:{fontSize:24,margin:0},sub:{fontSize:13,color:"#6B7280",marginTop:5},tabs:{display:"flex",gap:8,marginBottom:18,background:"#EDEFF3",padding:5,borderRadius:13,width:"fit-content",flexWrap:"wrap"},tab:{border:"1px solid transparent",background:"transparent",padding:"10px 18px",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",color:"#6B7280"},card:{background:"#fff",border:"1px solid #E5E7EB",borderRadius:16,overflow:"hidden",boxShadow:"0 3px 14px rgba(15,23,42,.04)"},toolbarTop:{padding:"18px 22px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap",borderBottom:"1px solid #F1F3F5"},cardTitle:{fontSize:16,fontWeight:750},cardSub:{fontSize:12,color:"#9CA3AF",marginTop:4},actions:{display:"flex",gap:8,flexWrap:"wrap"},upload:{border:"1px solid #1D4ED8",background:"#1D4ED8",color:"#fff",padding:"9px 13px",borderRadius:9,fontWeight:700,cursor:"pointer"},download:{border:"1px solid #D1D5DB",background:"#fff",color:"#374151",padding:"9px 13px",borderRadius:9,fontWeight:700,cursor:"pointer"},filters:{display:"flex",gap:9,padding:"14px 22px",borderBottom:"1px solid #F1F3F5",flexWrap:"wrap"},search:{width:280,maxWidth:"100%",padding:"9px 11px",border:"1px solid #E5E7EB",borderRadius:9,fontSize:13},filter:{padding:"9px 11px",border:"1px solid #E5E7EB",borderRadius:9,fontSize:13,background:"#fff"},success:{margin:"12px 22px 0",padding:"9px 11px",background:"#ECFDF5",color:"#065F46",border:"1px solid #A7F3D0",borderRadius:8,fontSize:12},error:{margin:"12px 22px 0",padding:"9px 11px",background:"#FEF2F2",color:"#991B1B",border:"1px solid #FECACA",borderRadius:8,fontSize:12},empty:{padding:"70px 20px",textAlign:"center",color:"#9CA3AF",fontSize:13},table:{width:"100%",minWidth:1250,borderCollapse:"collapse"},th:{textAlign:"left",padding:"12px 14px",fontSize:10,textTransform:"uppercase",letterSpacing:".55px",color:"#9CA3AF",background:"#FAFAFA",borderBottom:"1px solid #E5E7EB",whiteSpace:"nowrap",cursor:"pointer"},tr:{borderBottom:"1px solid #F3F4F6"},td:{padding:"12px 14px",fontSize:12,color:"#4B5563",verticalAlign:"middle",whiteSpace:"nowrap"},badge:{display:"inline-flex",padding:"4px 8px",borderRadius:99,fontWeight:700,fontSize:10},liveBadge:{background:"#EFF6FF",color:"#1D4ED8",border:"1px solid #BFDBFE"},excelBadge:{background:"#ECFDF5",color:"#047857",border:"1px solid #A7F3D0"},ref:{fontFamily:"ui-monospace,monospace",fontSize:11,color:"#1D4ED8"},person:{display:"flex",alignItems:"center",gap:8},avatar:{width:28,height:28,borderRadius:"50%",display:"grid",placeItems:"center",color:"#fff",fontWeight:800,fontSize:9},status:{fontSize:10,fontWeight:700,textTransform:"capitalize",padding:"4px 8px",borderRadius:99,background:"#F3F4F6",color:"#374151"},editBtn:{border:"1px solid #BFDBFE",background:"#EFF6FF",color:"#1D4ED8",padding:"5px 9px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",marginRight:5},deleteBtn:{border:"1px solid #FECACA",background:"#FEF2F2",color:"#B91C1C",padding:"5px 9px",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"},footer:{padding:"12px 22px",borderTop:"1px solid #F3F4F6",fontSize:11,color:"#9CA3AF"},overlay:{position:"fixed",inset:0,background:"rgba(15,23,42,.45)",display:"grid",placeItems:"center",zIndex:100,padding:20},modal:{background:"#fff",borderRadius:16,width:"min(760px,100%)",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.18)"},modalHead:{display:"flex",justifyContent:"space-between",padding:"18px 20px",borderBottom:"1px solid #F1F3F5"},modalTitle:{fontWeight:800,fontSize:16},modalSub:{fontSize:11,color:"#9CA3AF",marginTop:3},close:{border:0,background:"#F3F4F6",borderRadius:8,width:30,height:30,fontSize:22,cursor:"pointer",color:"#6B7280"},formGrid:{padding:20,display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:13},field:{display:"flex",flexDirection:"column",gap:6},label:{fontSize:11,fontWeight:700,color:"#6B7280"},input:{padding:"9px 10px",border:"1px solid #DDE2E8",borderRadius:8,fontSize:13,fontFamily:"inherit",background:"#fff"},modalActions:{display:"flex",justifyContent:"flex-end",gap:8,padding:"14px 20px",borderTop:"1px solid #F1F3F5"},secondary:{border:"1px solid #D1D5DB",background:"#fff",padding:"9px 14px",borderRadius:8,fontWeight:700,cursor:"pointer"},primary:{border:0,background:"#1D4ED8",color:"#fff",padding:"9px 14px",borderRadius:8,fontWeight:700,cursor:"pointer"}
};
