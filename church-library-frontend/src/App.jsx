import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ── Icons ─────────────────────────────────────────────────────────────────────
const BookIcon      = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
const SearchIcon    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const UploadIcon    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>);
const CheckoutIcon  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const ReturnIcon    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>);
const RefreshIcon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const CloseIcon     = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const CrossIcon     = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const ChevronIcon   = ({ open }) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}><polyline points="6 9 12 15 18 9"/></svg>);
const ClipboardIcon = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>);
const PlusIcon      = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const WarnIcon      = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const GearIcon      = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
const DownloadIcon  = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const SparkleIcon   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>);

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return val; }
}

function exportToCSV(books) {
  const cols = ["isbn","title","author","publisher","date","dewey","category","audience","pages","source","checked_out_by","summary","tags","image_url"];
  const header = cols.join(",");
  const rows = books.map(b =>
    cols.map(c => {
      const val = b[c] ?? "";
      return /[,"\n]/.test(String(val)) ? `"${String(val).replace(/"/g, '""')}"` : val;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wesley-library-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const normalizeISBN = s => String(s || "").replace(/[^0-9Xx]/g, "").toUpperCase();

// ── Palette for charts ────────────────────────────────────────────────────────
const CHART_COLORS = ["#2d6a4f","#52b788","#b7e4c7","#1b4332","#74c69d","#40916c","#95d5b2","#d8f3dc"];

// ── Word Cloud ────────────────────────────────────────────────────────────────
function WordCloud({ words, title, colorVar = "--accent" }) {
  if (!words || words.length === 0) return <div className="drawer-empty">No data yet.</div>;

  const max = words[0].count;
  const min = words[words.length - 1].count;
  const range = max - min || 1;

  const getSize = (count) => {
    const pct = (count - min) / range;
    return 0.72 + pct * 1.6; // rem: 0.72 → 2.32
  };

  const getOpacity = (count) => {
    const pct = (count - min) / range;
    return 0.45 + pct * 0.55;
  };

  return (
    <div>
      {title && <p className="section-label">{title}</p>}
      <div className="word-cloud">
        {words.map(({ word, count }) => (
          <span
            key={word}
            className="word-cloud-item"
            title={`${word}: ${count}`}
            style={{
              fontSize: `${getSize(count)}rem`,
              opacity: getOpacity(count),
              fontWeight: count === max ? 700 : count > (max * 0.6) ? 600 : 400,
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Book Cover ────────────────────────────────────────────────────────────────
function BookCover({ url, title, size = "sm" }) {
  const [err, setErr] = React.useState(false);
  const dim = size === "lg"
    ? { width: 90, height: 120, fontSize: "1.8rem" }
    : { width: 36, height: 48, fontSize: ".85rem" };
  const style = {
    width: dim.width, height: dim.height, flexShrink: 0,
    borderRadius: 8, overflow: "hidden",
    background: "var(--surface-2)", border: "1px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  if (url && !err) {
    return (
      <div style={style}>
        <img src={url} alt={title || "cover"} onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    );
  }
  return (
    <div style={{ ...style, color: "var(--text-muted)", fontSize: dim.fontSize }}>📖</div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position:"fixed", bottom:"1.5rem", right:"1.5rem", zIndex:9999, display:"flex", flexDirection:"column", gap:".5rem" }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="toast-close"><CrossIcon /></button>
        </div>
      ))}
    </div>
  );
}

// ── Insights Panel ────────────────────────────────────────────────────────────
function InsightsPanel({ books, log }) {
  // Category donut data
  const categoryData = useMemo(() => {
    const cats = {};
    books.forEach(b => { if (b.category) cats[b.category] = (cats[b.category] || 0) + 1; });
    return Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([name, value]) => ({ name, value }));
  }, [books]);

  // Tags word cloud data
  const tagWords = useMemo(() => {
    const freq = {};
    books.forEach(b => {
      if (b.tags) b.tags.split(",").forEach(t => {
        const word = t.trim();
        if (word) freq[word] = (freq[word] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 60)
      .map(([word, count]) => ({ word, count }));
  }, [books]);

  // Subject/summary word cloud — common nouns from summaries
  const STOPWORDS = new Set(["the","a","an","and","or","of","to","in","is","it","for","on","with","as","by","at","from","that","this","are","was","be","has","have","been","not","but","his","her","their","they","he","she","we","our","its","which","who","when","all","one","can","will","about","also","more","into","than","up","had","he","she","i","my","you","your","we","us","them","after","before","if","so","do","does","what","how","were","there","then","just","like","over","through","out","me","him","am","did","would","could","should","any","each","two","three","four","five","six","seven","eight","nine","ten","new","first","last","many","much","some","other","time","life","world","book","story","novel","author","reader"]);

  const summaryWords = useMemo(() => {
    const freq = {};
    books.forEach(b => {
      if (b.summary) {
        b.summary.toLowerCase()
          .replace(/[^a-z\s]/g, " ")
          .split(/\s+/)
          .filter(w => w.length > 4 && !STOPWORDS.has(w))
          .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      }
    });
    return Object.entries(freq)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 50)
      .map(([word, count]) => ({ word, count }));
  }, [books]);

  // Top authors bar chart
  const authorData = useMemo(() => {
    const freq = {};
    books.forEach(b => { if (b.author) freq[b.author] = (freq[b.author] || 0) + 1; });
    return Object.entries(freq)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name: name.split(",")[0].trim(), count }));
  }, [books]);

  // Checkout activity by month from log
  const activityData = useMemo(() => {
    const months = {};
    log.forEach(e => {
      if (e.action === "checkout" && e.checked_out_at) {
        const d = new Date(e.checked_out_at);
        if (!isNaN(d)) {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
          months[key] = (months[key] || 0) + 1;
        }
      }
    });
    return Object.entries(months).sort((a,b)=>a[0].localeCompare(b[0])).slice(-12)
      .map(([month, count]) => ({ month: month.slice(5), count }));
  }, [log]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:".5rem .85rem", fontSize:".82rem", boxShadow:"0 4px 16px rgba(0,0,0,.12)" }}>
          <div style={{ fontWeight:600, color:"var(--text)" }}>{label}</div>
          <div style={{ color:"var(--text-muted)" }}>{payload[0].value} books</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"2rem" }}>

      {/* Category donut */}
      {categoryData.length > 0 && (
        <div>
          <p className="section-label">Catalog by Category</p>
          <div style={{ display:"flex", gap:"1.25rem", alignItems:"center", flexWrap:"wrap" }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {categoryData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius:8, border:"1px solid var(--border)", background:"var(--surface)", fontSize:".82rem" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexDirection:"column", gap:".35rem", flex:1, minWidth:120 }}>
              {categoryData.slice(0, 8).map(({ name, value }, i) => (
                <div key={name} style={{ display:"flex", alignItems:"center", gap:".5rem", fontSize:".8rem" }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:CHART_COLORS[i % CHART_COLORS.length], flexShrink:0 }} />
                  <span style={{ flex:1, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</span>
                  <span style={{ color:"var(--text-muted)", fontVariantNumeric:"tabular-nums" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tags word cloud */}
      {tagWords.length > 0 && (
        <WordCloud words={tagWords} title="Subject Tags" />
      )}

      {/* Summary topics word cloud */}
      {summaryWords.length > 0 && (
        <WordCloud words={summaryWords} title="Topics from Summaries" />
      )}

      {/* Top authors */}
      {authorData.length > 1 && (
        <div>
          <p className="section-label">Most Titles by Author</p>
          <ResponsiveContainer width="100%" height={Math.max(180, authorData.length * 28)}>
            <BarChart data={authorData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill:"var(--text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill:"var(--text)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:"var(--surface-2)" }} />
              <Bar dataKey="count" fill="#2d6a4f" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Checkout activity */}
      {activityData.length > 1 && (
        <div>
          <p className="section-label">Checkout Activity (Last 12 Months)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={activityData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"var(--text-muted)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:10, fill:"var(--text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:"var(--surface-2)" }} />
              <Bar dataKey="count" fill="#52b788" radius={[4,4,0,0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Circulation Drawer ────────────────────────────────────────────────────────
function CirculationDrawer({ open, onClose, books }) {
  const [tab, setTab]           = useState("history");
  const [log, setLog]           = useState([]);
  const [loading, setLoading]   = useState(false);
  const [borrower, setBorrower] = useState("");

  useEffect(() => { if (open) loadLog(); }, [open]);

  const loadLog = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/circulation?limit=300", { withCredentials: true });
      setLog(Array.isArray(res.data) ? res.data : []);
    } catch { setLog([]); }
    finally { setLoading(false); }
  };

  const checkedOut = books.filter(b => !!b.checked_out_by);

  const borrowerMap = {};
  log.forEach(entry => {
    if (entry.action === "checkout" && entry.checked_out_by) {
      const name = entry.checked_out_by;
      if (!borrowerMap[name]) borrowerMap[name] = { checkouts: 0, titles: [] };
      borrowerMap[name].checkouts++;
      if (entry.title && !borrowerMap[name].titles.includes(entry.title))
        borrowerMap[name].titles.push(entry.title);
    }
  });
  const borrowers = Object.entries(borrowerMap)
    .map(([name, d]) => ({ name, ...d }))
    .sort((a, b) => b.checkouts - a.checkouts);

  const titleCount = {};
  log.forEach(e => { if (e.action === "checkout" && e.title) titleCount[e.title] = (titleCount[e.title] || 0) + 1; });
  const topBooks = Object.entries(titleCount).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const totalCheckouts = log.filter(e => e.action === "checkout").length;
  const totalReturns   = log.filter(e => e.action === "checkin").length;

  const borrowerLog = borrower
    ? log.filter(e => (e.checked_out_by || "").toLowerCase().includes(borrower.toLowerCase()))
    : [];

  const TABS = [
    { id:"history",  label:"History" },
    { id:"out",      label:`Out (${checkedOut.length})` },
    { id:"borrower", label:"Borrowers" },
    { id:"stats",    label:"Stats" },
    { id:"insights", label:"Insights" },
  ];

  return (
    <>
      <div className={`drawer-backdrop ${open ? "drawer-backdrop-open" : ""}`} onClick={onClose} />
      <div className={`drawer ${open ? "drawer-open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title"><ClipboardIcon /><span>Circulation</span></div>
          <div style={{ display:"flex", gap:".4rem", alignItems:"center" }}>
            <button className="icon-btn-light" onClick={loadLog} title="Refresh"><RefreshIcon /></button>
            <button className="icon-btn-light" onClick={onClose}><CloseIcon /></button>
          </div>
        </div>
        <div className="drawer-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`drawer-tab ${tab === t.id ? "drawer-tab-active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="drawer-body">
          {loading ? (
            <div className="drawer-loading">
              <div className="loading-pulse"><div className="pulse-dot"/><div className="pulse-dot"/><div className="pulse-dot"/></div>
            </div>
          ) : tab === "history" ? (
            log.length === 0 ? <div className="drawer-empty">No circulation history yet.</div> : (
              <div className="circ-list">
                {log.map((entry, i) => (
                  <div key={i} className="circ-entry">
                    <div className={`circ-dot ${entry.action === "checkout" ? "dot-out" : entry.action === "checkin" ? "dot-in" : "dot-load"}`} />
                    <div className="circ-info">
                      <span className="circ-title">{entry.title || entry.isbn || "Unknown"}</span>
                      <span className="circ-meta">
                        <span className={`circ-action ${entry.action === "checkout" ? "action-co" : "action-ci"}`}>
                          {entry.action === "checkout" ? "Checked out" : entry.action === "checkin" ? "Returned" : entry.action}
                        </span>
                        {entry.checked_out_by && <> · <strong>{entry.checked_out_by}</strong></>}
                      </span>
                      <span className="circ-date">{formatDate(entry.checked_out_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === "out" ? (
            checkedOut.length === 0 ? <div className="drawer-empty">No books currently checked out.</div> : (
              <div className="circ-list">
                {checkedOut.map((b, i) => (
                  <div key={i} className="circ-entry">
                    <div className="circ-dot dot-out" />
                    <div className="circ-info">
                      <span className="circ-title">{b.title || b.isbn}</span>
                      <span className="circ-meta">Checked out by <strong>{b.checked_out_by}</strong></span>
                      {b.category && <span className="cat-badge" style={{marginTop:".2rem",display:"inline-block"}}>{b.category}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === "borrower" ? (
            <div>
              <div style={{ padding:"0 0 .75rem 0" }}>
                <input className="text-input" placeholder="Search borrower name…" value={borrower} onChange={e => setBorrower(e.target.value)} />
              </div>
              {borrower ? (
                borrowerLog.length === 0 ? <div className="drawer-empty">No records for "{borrower}".</div> : (
                  <div className="circ-list">
                    {borrowerLog.map((entry, i) => (
                      <div key={i} className="circ-entry">
                        <div className={`circ-dot ${entry.action === "checkout" ? "dot-out" : "dot-in"}`} />
                        <div className="circ-info">
                          <span className="circ-title">{entry.title || entry.isbn}</span>
                          <span className="circ-meta">
                            <span className={`circ-action ${entry.action === "checkout" ? "action-co" : "action-ci"}`}>
                              {entry.action === "checkout" ? "Checked out" : "Returned"}
                            </span>
                          </span>
                          <span className="circ-date">{formatDate(entry.checked_out_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div>
                  <p className="section-label">All Borrowers</p>
                  {borrowers.length === 0 ? <div className="drawer-empty">No borrower data yet.</div> : (
                    <div className="borrower-list">
                      {borrowers.map((b, i) => (
                        <div key={i} className="borrower-row" onClick={() => setBorrower(b.name)}>
                          <div className="borrower-avatar">{b.name[0]?.toUpperCase()}</div>
                          <div className="borrower-info">
                            <span className="borrower-name">{b.name}</span>
                            <span className="borrower-sub">{b.checkouts} checkout{b.checkouts !== 1 ? "s" : ""} · {b.titles.length} unique title{b.titles.length !== 1 ? "s" : ""}</span>
                          </div>
                          <span className="borrower-count">{b.checkouts}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : tab === "stats" ? (
            <div className="stats-content">
              <div className="stat-cards">
                <div className="stat-card"><div className="stat-card-num">{totalCheckouts}</div><div className="stat-card-label">Total Checkouts</div></div>
                <div className="stat-card"><div className="stat-card-num">{totalReturns}</div><div className="stat-card-label">Total Returns</div></div>
                <div className="stat-card"><div className="stat-card-num">{borrowers.length}</div><div className="stat-card-label">Unique Borrowers</div></div>
                <div className="stat-card"><div className="stat-card-num" style={{color:"var(--accent)"}}>{checkedOut.length}</div><div className="stat-card-label">Currently Out</div></div>
              </div>
              <p className="section-label" style={{marginTop:"1.5rem"}}>Most Borrowed Books</p>
              {topBooks.length === 0 ? <div className="drawer-empty">No data yet.</div> : (
                <div className="top-books">
                  {topBooks.map(([title, count], i) => (
                    <div key={i} className="top-book-row">
                      <span className="top-book-rank">#{i+1}</span>
                      <span className="top-book-title">{title}</span>
                      <span className="top-book-bar-wrap"><span className="top-book-bar" style={{ width: `${Math.round((count / topBooks[0][1]) * 100)}%` }} /></span>
                      <span className="top-book-count">{count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "insights" ? (
            <InsightsPanel books={books} log={log} />
          ) : null}
        </div>
      </div>
    </>
  );
}

// ── Checkout Modal ────────────────────────────────────────────────────────────
function CheckoutModal({ book, onClose, onSuccess, addToast }) {
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!user.trim()) { addToast("Please enter a borrower name.", "warn"); return; }
    setLoading(true);
    try {
      await axios.post(`/api/checkout`, { isbn: book.isbn, user: user.trim() }, { withCredentials: true });
      addToast(`"${book.title}" checked out to ${user.trim()}.`, "success");
      onSuccess(); onClose();
    } catch (err) { addToast(err.response?.data?.error || "Checkout failed.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Check Out Book</h3><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
        <div className="modal-body">
          <div className="book-chip"><BookIcon /><span>{book.title || "Unknown Title"}</span></div>
          <label className="field-label">Borrower Name</label>
          <input ref={inputRef} className="text-input" placeholder="Enter name…" value={user}
            onChange={e => setUser(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : <><CheckoutIcon /> Confirm Checkout</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Return Modal ──────────────────────────────────────────────────────────────
function ReturnModal({ book, onClose, onSuccess, addToast }) {
  const [loading, setLoading] = useState(false);
  const handleReturn = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/return`, { isbn: book.isbn }, { withCredentials: true });
      addToast(`"${book.title}" returned successfully.`, "success");
      onSuccess(); onClose();
    } catch (err) { addToast(err.response?.data?.error || "Return failed.", "error"); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Return Book</h3><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
        <div className="modal-body">
          <div className="book-chip"><BookIcon /><span>{book.title || "Unknown Title"}</span></div>
          <p className="return-note">Currently checked out to <strong>{book.checked_out_by || "unknown"}</strong>. Confirm return?</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={handleReturn} disabled={loading}>
            {loading ? <span className="spinner" /> : <><ReturnIcon /> Confirm Return</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ISBN Lookup Modal ─────────────────────────────────────────────────────────
function ISBNLookupModal({ onClose, onSuccess, addToast, existingBooks }) {
  const [isbn, setIsbn]           = useState("");
  const [preview, setPreview]     = useState(null);
  const [looking, setLooking]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [duplicate, setDuplicate] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleLookup = async () => {
    const val = isbn.replace(/[^0-9Xx]/g, "");
    if (val.length < 10) { addToast("Enter a valid 10 or 13-digit ISBN.", "warn"); return; }
    setLooking(true); setPreview(null); setDuplicate(null);
    try {
      const res = await axios.get(`/api/admin/isbn-lookup?isbn=${val}`, { withCredentials: true });
      setPreview(res.data);
      const match = existingBooks.find(b => normalizeISBN(b.isbn) === normalizeISBN(val));
      if (match) setDuplicate(match);
    } catch (err) { addToast(err.response?.data?.error || "Lookup failed.", "error"); }
    finally { setLooking(false); }
  };

  const handleAdd = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await axios.post("/api/admin/isbn-save", preview, { withCredentials: true });
      addToast(`"${preview.Title || preview.ISBN}" added to the library.`, "success");
      onSuccess(); onClose();
    } catch (err) { addToast(err.response?.data?.error || "Failed to save.", "error"); }
    finally { setSaving(false); }
  };

  const Field = ({ label, value }) => value ? (
    <div className="preview-field">
      <span className="preview-label">{label}</span>
      <span className="preview-value">{value}</span>
    </div>
  ) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Book by ISBN</h3>
          <button className="icon-btn" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="modal-body">
          <div className="isbn-search-row">
            <input
              ref={inputRef}
              className="text-input"
              placeholder="Enter ISBN-10 or ISBN-13…"
              value={isbn}
              onChange={e => { setIsbn(e.target.value); setDuplicate(null); setPreview(null); }}
              onKeyDown={e => e.key === "Enter" && handleLookup()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleLookup} disabled={looking}>
              {looking ? <span className="spinner" /> : "Look Up"}
            </button>
          </div>
          {duplicate && (
            <div className="duplicate-banner">
              <WarnIcon />
              <div className="duplicate-banner-text">
                <strong>Already in your library</strong>
                <span>"{duplicate.title}" by {duplicate.author || "unknown author"} is cataloged with this ISBN.</span>
              </div>
            </div>
          )}
          {preview && (
            <div className="preview-card">
              <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",marginBottom:".5rem"}}>
                <BookCover url={preview.Image_URL} title={preview.Title} size="lg" />
                <div style={{flex:1}}>
                  <div className="preview-title">{preview.Title || "Unknown Title"}</div>
                </div>
              </div>
              <Field label="Author"    value={preview.Author} />
              <Field label="Publisher" value={preview.Publisher} />
              <Field label="Year"      value={preview.Date} />
              <Field label="ISBN"      value={preview.ISBN} />
              <Field label="Dewey"     value={preview.Dewey} />
              <Field label="Pages"     value={preview.Pages} />
              <Field label="Source"    value={preview.Source} />
              {preview.Summary && <div className="preview-summary">{preview.Summary}</div>}
              {preview.Category && (
                <div style={{ display:"flex", gap:".4rem", marginTop:".4rem" }}>
                  <span className="cat-badge">{preview.Category}</span>
                  {preview.Audience && <span className="aud-badge">{preview.Audience}</span>}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          {preview && (
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? <span className="spinner" /> : <><PlusIcon /> {duplicate ? "Add Anyway" : "Add to Library"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Upload Panel ──────────────────────────────────────────────────────────────
function UploadPanel({ onSuccess, addToast, onClose, existingBooks }) {
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult]     = useState(null);
  const fileRef = useRef(null);

  const handleDrop = e => {
    e.preventDefault(); setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) setFile(dropped);
    else addToast("Please drop a .csv file.", "warn");
  };

  const handleUpload = async () => {
    if (!file) { addToast("Select a CSV file first.", "warn"); return; }
    setLoading(true); setResult(null);
    try {
      const text = await file.text();
      const lines = text.split("\n");
      const header = lines[0].split(",").map(h => h.trim().toUpperCase());
      const isbnIdx = header.indexOf("ISBN");
      const existingSet = new Set(existingBooks.map(b => normalizeISBN(b.isbn)));
      const uploadedISBNs = isbnIdx >= 0
        ? lines.slice(1).map(l => normalizeISBN(l.split(",")[isbnIdx])).filter(Boolean)
        : [];
      const duplicates = uploadedISBNs.filter(isbn => existingSet.has(isbn));

      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`/api/admin/upload-csv`, formData, { withCredentials: true });

      setResult({ saved: res.data.saved, processed: res.data.processed, duplicates });

      if (duplicates.length > 0) {
        addToast(`${duplicates.length} ISBN(s) already in library — records updated.`, "warn");
      }
      addToast(`✓ ${res.data.saved} book(s) saved (${res.data.processed} processed).`, "success");
      onSuccess();
    } catch (err) { addToast(err.response?.data?.error || "Upload failed.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3>Upload Catalog CSV</h3><button className="icon-btn" onClick={onClose}><CloseIcon /></button></div>
        <div className="modal-body">
          <div className={`drop-zone ${dragging?"drop-zone-active":""} ${file?"drop-zone-filled":""}`}
            onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
            onDrop={handleDrop} onClick={()=>fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e=>{setFile(e.target.files[0]);setResult(null);}} />
            {file
              ? (<><div className="drop-icon">📄</div><p className="drop-filename">{file.name}</p><p className="drop-sub">Click to change file</p></>)
              : (<><div className="drop-icon"><UploadIcon /></div><p className="drop-primary">Drop CSV here or click to browse</p><p className="drop-sub">ISBN column required · AI enrichment runs automatically</p></>)}
          </div>
          {result && result.duplicates.length > 0 && (
            <div className="duplicate-banner">
              <WarnIcon />
              <div className="duplicate-banner-text">
                <strong>{result.duplicates.length} duplicate ISBN{result.duplicates.length !== 1 ? "s" : ""} detected</strong>
                <span>These were already in your library and have been updated with the latest metadata.</span>
                <div className="duplicate-isbn-list">
                  {result.duplicates.slice(0, 8).map(isbn => (
                    <span key={isbn} className="duplicate-isbn-chip">{isbn}</span>
                  ))}
                  {result.duplicates.length > 8 && (
                    <span className="duplicate-isbn-chip">+{result.duplicates.length - 8} more</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>{result ? "Close" : "Cancel"}</button>
          {!result && (
            <button className="btn btn-primary" onClick={handleUpload} disabled={loading||!file}>
              {loading ? <span className="spinner" /> : <><UploadIcon /> Upload & Enrich</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin Drawer ──────────────────────────────────────────────────────────────
function AdminDrawer({ open, onClose, books, onAddBook, onUpload }) {
  const [tab, setTab]         = useState("actions");
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open && tab === "audit") loadAudit(); }, [open, tab]);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/audit-log", { withCredentials: true });
      setAuditLog(Array.isArray(res.data) ? res.data : []);
    } catch { setAuditLog([]); }
    finally { setLoading(false); }
  };

  const TABS = [
    { id: "actions", label: "Actions" },
    { id: "audit",   label: "Audit Log" },
  ];

  return (
    <>
      <div className={`drawer-backdrop ${open ? "drawer-backdrop-open" : ""}`} onClick={onClose} />
      <div className={`drawer drawer-left ${open ? "drawer-open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title"><GearIcon /><span>Admin</span></div>
          <button className="icon-btn-light" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="drawer-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`drawer-tab ${tab === t.id ? "drawer-tab-active" : ""}`}
              onClick={() => { setTab(t.id); if (t.id === "audit") loadAudit(); }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="drawer-body">
          {tab === "actions" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:".75rem" }}>
              <p className="section-label">Catalog Management</p>
              <button className="admin-action-btn" onClick={() => { onClose(); onAddBook(); }}>
                <PlusIcon />
                <div>
                  <div className="admin-action-title">Add Book by ISBN</div>
                  <div className="admin-action-sub">Look up and add a single book using its ISBN</div>
                </div>
              </button>
              <button className="admin-action-btn" onClick={() => { onClose(); onUpload(); }}>
                <UploadIcon />
                <div>
                  <div className="admin-action-title">Upload CSV</div>
                  <div className="admin-action-sub">Bulk-import a spreadsheet of ISBNs with AI enrichment</div>
                </div>
              </button>
              <button className="admin-action-btn" onClick={() => exportToCSV(books)} disabled={books.length === 0}>
                <DownloadIcon />
                <div>
                  <div className="admin-action-title">Export Catalog</div>
                  <div className="admin-action-sub">Download the full library as CSV ({books.length} books)</div>
                </div>
              </button>
            </div>
          ) : tab === "audit" ? (
            loading ? (
              <div className="drawer-loading"><div className="loading-pulse"><div className="pulse-dot"/><div className="pulse-dot"/><div className="pulse-dot"/></div></div>
            ) : auditLog.length === 0 ? (
              <div className="drawer-empty">No audit history yet.</div>
            ) : (
              <div className="circ-list">
                {auditLog.map((entry, i) => (
                  <div key={i} className="circ-entry">
                    <div className={`circ-dot ${entry.action === "book_added" ? "dot-in" : "dot-out"}`} />
                    <div className="circ-info">
                      <span className="circ-title">{entry.title || entry.isbn || "Unknown"}</span>
                      <span className="circ-meta">
                        <span className={`circ-action ${entry.action === "book_added" ? "action-ci" : "action-co"}`}>
                          {entry.action === "book_added" ? "Added" : "Updated"}
                        </span>
                        {entry.performed_by && <> · <strong>{entry.performed_by}</strong></>}
                      </span>
                      <span className="circ-date">{formatDate(entry.performed_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </div>
      </div>
    </>
  );
}

// ── Book Row ──────────────────────────────────────────────────────────────────
function BookRow({ book, onCheckout, onReturn, index }) {
  const [expanded, setExpanded] = useState(false);
  const isOut = !!book.checked_out_by;
  const tags = book.tags ? book.tags.split(",").map(t=>t.trim()).filter(Boolean) : [];
  const metaFields = [
    book.isbn        && ["ISBN",      book.isbn],
    book.publisher   && ["Publisher", book.publisher],
    book.edition     && ["Edition",   book.edition],
    book.pages       && ["Pages",     book.pages],
    book.lccn        && ["LCCN",      book.lccn],
    book.source      && ["Source",    book.source],
    book.date        && ["Date",      book.date],
  ].filter(Boolean);

  return (
    <>
      <tr className="book-row" style={{ animationDelay:`${Math.min(index*15,300)}ms` }}>
        <td className="td-title">
          <div style={{display:"flex",gap:".75rem",alignItems:"flex-start"}}>
            <BookCover url={book.image_url} title={book.title} size="sm" />
            <div style={{flex:1,minWidth:0}}>
              <div className="title-top">
                <span className="title-text">{book.title || "—"}</span>
                <button className="expand-btn" onClick={()=>setExpanded(v=>!v)} title="Show details">
                  <ChevronIcon open={expanded} />
                </button>
              </div>
              <div className="title-meta">
                {book.category && <span className="cat-badge">{book.category}</span>}
                {book.audience && <span className="aud-badge">{book.audience}</span>}
              </div>
            </div>
          </div>
        </td>
        <td className="td-author">{book.author || "—"}</td>
        <td className="td-year">{book.date ? String(book.date).slice(0,4) : "—"}</td>
        <td className="td-dewey">
          {book.dewey ? <span className="dewey-chip">{book.dewey}</span> : <span className="muted">—</span>}
        </td>
        <td className="td-status">
          <span className={`status-pill ${isOut?"status-out":"status-in"}`}>
            {isOut ? `Out · ${book.checked_out_by}` : "Available"}
          </span>
        </td>
        <td className="td-actions">
          {isOut
            ? <button className="action-btn action-return" onClick={()=>onReturn(book)}><ReturnIcon /> Return</button>
            : <button className="action-btn action-checkout" onClick={()=>onCheckout(book)}><CheckoutIcon /> Check Out</button>}
        </td>
      </tr>
      {expanded && (
        <tr className="expand-row">
          <td colSpan={6}>
            <div className="expand-body">
              {book.summary && <p className="expand-summary">{book.summary}</p>}
              {tags.length > 0 && <div className="tag-list">{tags.map(tag=><span key={tag} className="tag-chip">{tag}</span>)}</div>}
              {metaFields.length > 0 && (
                <div className="expand-meta-grid">
                  {metaFields.map(([label, value]) => (
                    <React.Fragment key={label}>
                      <span className="expand-meta-label">{label}</span>
                      <span className="expand-meta-value">{value}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [books, setBooks]                   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [search, setSearch]                 = useState("");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [sortBy, setSortBy]                 = useState("title");
  const [sortDir, setSortDir]               = useState("asc");
  const [checkoutBook, setCheckoutBook]     = useState(null);
  const [returnBook, setReturnBook]         = useState(null);
  const [showUpload, setShowUpload]         = useState(false);
  const [showLookup, setShowLookup]         = useState(false);
  const [showCirc, setShowCirc]             = useState(false);
  const [toasts, setToasts]                 = useState([]);
  const [hasFetched, setHasFetched]         = useState(false);
  const [showAdmin, setShowAdmin]           = useState(false);

  const addToast = (message, type="info") => {
    const id = Date.now() + Math.random();
    setToasts(prev=>[...prev,{id,message,type}]);
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),4000);
  };
  const removeToast = id => setToasts(prev=>prev.filter(t=>t.id!==id));

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/books`,{withCredentials:true});
      setBooks(res.data.books||[]);
      setHasFetched(true);
    } catch { addToast("Could not reach the server. Is Flask running?","error"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{loadBooks();},[]);

  const toggleSort = col => {
    if (sortBy===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const filtered = books.filter(b=>{
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (b.title||"").toLowerCase().includes(q) ||
      (b.author||"").toLowerCase().includes(q) ||
      (b.isbn||"").includes(q) ||
      (b.publisher||"").toLowerCase().includes(q) ||
      (b.tags||"").toLowerCase().includes(q) ||
      (b.summary||"").toLowerCase().includes(q);
    const isOut = !!b.checked_out_by;
    const matchStatus   = filterStatus==="all"   || (filterStatus==="available"&&!isOut) || (filterStatus==="out"&&isOut);
    const matchCategory = filterCategory==="all" || (b.category||"")===filterCategory;
    const matchAudience = filterAudience==="all" || (b.audience||"")===filterAudience;
    return matchSearch && matchStatus && matchCategory && matchAudience;
  }).sort((a,b)=>{
    let av="",bv="";
    if(sortBy==="title")    {av=a.title||"";    bv=b.title||"";}
    if(sortBy==="author")   {av=a.author||"";   bv=b.author||"";}
    if(sortBy==="date")     {av=a.date||"";     bv=b.date||"";}
    if(sortBy==="category") {av=a.category||""; bv=b.category||"";}
    const cmp=av.localeCompare(bv);
    return sortDir==="asc"?cmp:-cmp;
  });

  const stats = {
    total:     books.length,
    available: books.filter(b=>!b.checked_out_by).length,
    out:       books.filter(b=>!!b.checked_out_by).length,
  };

  const activeCategories = [...new Set(books.map(b=>b.category).filter(Boolean))].sort();
  const activeAudiences  = [...new Set(books.map(b=>b.audience).filter(Boolean))].sort();
  const hasFilters = search || filterStatus!=="all" || filterCategory!=="all" || filterAudience!=="all";

  const SortArrow = ({col}) => (
    <span className={`sort-arrow ${sortBy===col?"sort-active":""}`}>
      {sortBy===col?(sortDir==="asc"?" ↑":" ↓"):" ↕"}
    </span>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700&display=swap');

        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:        #f4f6f8;
          --surface:   #ffffff;
          --surface-2: #f0f2f5;
          --border:    #e2e6ea;
          --border-2:  #d0d6de;

          --text:      #1a1d23;
          --text-mid:  #4a5568;
          --text-muted:#8492a6;

          --accent:    #b42025;
          --accent-lt: #d03035;
          --accent-bg: #fef2f2;

          --green:     #1a6b4a;
          --green-lt:  #2d9065;
          --green-bg:  #edfaf3;
          --green-mid: #52b788;

          --gold:      #d4900a;
          --gold-bg:   #fef9ed;

          --blue:      #1e5fa8;
          --blue-bg:   #eff6ff;

          --warn:      #92600a;
          --warn-bg:   #fef3cd;
          --warn-border:#f0c040;

          --radius:    10px;
          --radius-sm: 6px;
          --radius-lg: 16px;
          --drawer-w:  520px;

          --shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04);
          --shadow:    0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04);
          --shadow-lg: 0 20px 60px rgba(0,0,0,.14), 0 4px 20px rgba(0,0,0,.06);
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }
        .app-shell { min-height: 100vh; display: flex; flex-direction: column; }

        /* ── Header ── */
        .header {
          background: var(--surface);
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: var(--shadow-sm);
          border-bottom: 1px solid var(--border);
        }
        .header-brand { display: flex; align-items: center; gap: .9rem; }
        .brand-logo { height: 42px; width: auto; object-fit: contain; flex-shrink: 0; }
        .brand-divider { width: 1px; height: 32px; background: var(--border); }
        .brand-text { display: flex; flex-direction: column; gap: 1px; }
        .brand-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
        }
        .brand-sub {
          font-size: .68rem;
          color: var(--text-muted);
          letter-spacing: .08em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .header-actions { display: flex; align-items: center; gap: .5rem; }

        /* ── Stats Bar ── */
        .stats-bar {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          padding: .75rem 2rem;
          display: flex;
          gap: 0;
          align-items: stretch;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: .4rem 2rem .4rem 0;
          gap: 1px;
        }
        .stat-item:not(:last-child) { border-right: 1px solid var(--border); margin-right: 2rem; }
        .stat-num {
          font-size: 1.6rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -.02em;
          color: var(--text);
        }
        .stat-label {
          font-size: .68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: .08em;
          font-weight: 500;
        }

        /* ── Toolbar ── */
        .toolbar {
          padding: .9rem 2rem;
          display: flex;
          gap: .6rem;
          align-items: center;
          flex-wrap: wrap;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        .search-wrap { flex: 1; min-width: 200px; max-width: 340px; position: relative; }
        .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
        .search-input {
          width: 100%;
          padding: .55rem .9rem .55rem 2.3rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: .88rem;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .search-input:focus { border-color: var(--green-mid); box-shadow: 0 0 0 3px rgba(82,183,136,.15); }
        .search-input::placeholder { color: var(--text-muted); }

        .filter-group { display: flex; border: 1.5px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .filter-btn {
          padding: .5rem .85rem;
          background: transparent;
          border: none;
          font-family: 'Inter', sans-serif;
          font-size: .8rem;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          transition: background .15s, color .15s;
          white-space: nowrap;
        }
        .filter-btn:not(:last-child) { border-right: 1px solid var(--border); }
        .filter-btn.active { background: var(--text); color: #fff; }
        .filter-btn:not(.active):hover { background: var(--surface-2); color: var(--text); }

        .filter-select {
          padding: .5rem .8rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: .8rem;
          cursor: pointer;
          outline: none;
          max-width: 155px;
          transition: border-color .15s;
        }
        .filter-select:focus { border-color: var(--green-mid); }

        .clear-btn {
          padding: .5rem .85rem;
          background: transparent;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          font-family: 'Inter', sans-serif;
          font-size: .8rem;
          color: var(--green);
          cursor: pointer;
          transition: background .15s, border-color .15s;
          font-weight: 500;
        }
        .clear-btn:hover { background: var(--green-bg); border-color: var(--green-mid); }
        .result-count { font-size: .78rem; color: var(--text-muted); white-space: nowrap; margin-left: auto; }

        /* ── Buttons ── */
        .btn {
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .55rem 1.1rem;
          border-radius: var(--radius);
          font-family: 'Inter', sans-serif;
          font-size: .84rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
          letter-spacing: -.01em;
        }
        .btn:active { transform: scale(.97); }
        .btn-primary { background: var(--green); color: #fff; }
        .btn-primary:hover { background: var(--green-lt); box-shadow: 0 4px 12px rgba(26,107,74,.25); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .btn-accent { background: var(--green); color: #fff; }
        .btn-accent:hover { background: var(--green-lt); }
        .btn-accent:disabled { opacity: .5; cursor: not-allowed; }
        .btn-ghost {
          background: transparent;
          color: var(--text-mid);
          border: 1.5px solid var(--border);
        }
        .btn-ghost:hover { background: var(--surface-2); border-color: var(--border-2); }
        .btn-outline {
          background: transparent;
          color: var(--text-mid);
          border: 1.5px solid var(--border);
        }
        .btn-outline:hover { background: var(--surface-2); border-color: var(--border-2); }
        .btn-circ {
          background: var(--green-bg);
          color: var(--green);
          border: 1.5px solid rgba(45,144,101,.2);
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .5rem .95rem;
          border-radius: var(--radius);
          font-family: 'Inter', sans-serif;
          font-size: .84rem;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .btn-circ:hover { background: var(--green); color: #fff; border-color: var(--green); }

        .icon-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: .3rem;
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          transition: color .15s, background .15s;
        }
        .icon-btn:hover { color: var(--text); background: var(--surface-2); }
        .icon-btn-light {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,.65); padding: .3rem;
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          transition: color .15s, background .15s;
        }
        .icon-btn-light:hover { color: #fff; background: rgba(255,255,255,.12); }

        /* ── Content ── */
        .content { flex: 1; padding: 1.5rem 2rem; }
        .table-wrap {
          background: var(--surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          overflow: hidden;
          box-shadow: var(--shadow);
        }
        .table-scroll { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: var(--text); }
        th {
          padding: .8rem 1rem;
          text-align: left;
          font-family: 'Inter', sans-serif;
          font-size: .68rem;
          font-weight: 600;
          color: rgba(255,255,255,.65);
          text-transform: uppercase;
          letter-spacing: .1em;
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          transition: color .15s;
        }
        th:hover { color: #fff; }
        th:last-child { cursor: default; }
        .sort-arrow { font-size: .68rem; opacity: .4; margin-left: .15rem; }
        .sort-active { opacity: 1; color: #86efac; }

        .book-row {
          border-bottom: 1px solid var(--border);
          animation: fadeSlide .25s ease both;
          transition: background .1s;
        }
        .book-row:hover { background: var(--surface-2); }
        .expand-row { border-bottom: 1px solid var(--border); background: #f8fafb; }
        @keyframes fadeSlide { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:none } }
        td { padding: .7rem 1rem; vertical-align: middle; }
        .td-title { min-width: 220px; max-width: 340px; }
        .title-top { display: flex; align-items: center; gap: .4rem; }
        .title-text { font-weight: 500; color: var(--text); line-height: 1.3; font-size: .9rem; }
        .expand-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: .1rem;
          display: flex; align-items: center; flex-shrink: 0;
          transition: color .15s;
        }
        .expand-btn:hover { color: var(--text); }
        .title-meta { display: flex; gap: .3rem; margin-top: .2rem; flex-wrap: wrap; }

        .cat-badge {
          display: inline-block;
          padding: .1rem .45rem;
          background: var(--blue-bg);
          color: var(--blue);
          border-radius: 999px;
          font-size: .65rem;
          font-weight: 600;
          letter-spacing: .02em;
        }
        .aud-badge {
          display: inline-block;
          padding: .1rem .45rem;
          background: var(--gold-bg);
          color: var(--gold);
          border-radius: 999px;
          font-size: .65rem;
          font-weight: 600;
        }
        .td-author { min-width: 140px; color: var(--text-mid); font-size: .88rem; }
        .td-year { min-width: 60px; color: var(--text-muted); font-variant-numeric: tabular-nums; font-size: .88rem; }
        .td-dewey { min-width: 90px; }
        .dewey-chip {
          display: inline-block;
          padding: .15rem .5rem;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: .7rem;
          color: var(--text-mid);
          font-variant-numeric: tabular-nums;
        }
        .muted { color: var(--text-muted); }
        .td-status { min-width: 140px; }
        .status-pill {
          display: inline-block;
          padding: .2rem .65rem;
          border-radius: 999px;
          font-size: .74rem;
          font-weight: 600;
          white-space: nowrap;
        }
        .status-in { background: var(--green-bg); color: var(--green); }
        .status-out { background: var(--gold-bg); color: var(--gold); }
        .td-actions { min-width: 130px; text-align: right; padding-right: 1.1rem; }
        .action-btn {
          display: inline-flex; align-items: center; gap: .3rem;
          padding: .35rem .8rem;
          border-radius: var(--radius-sm);
          font-family: 'Inter', sans-serif;
          font-size: .78rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all .15s;
        }
        .action-btn:active { transform: scale(.95); }
        .action-checkout { background: var(--green-bg); color: var(--green); }
        .action-checkout:hover { background: var(--green); color: #fff; }
        .action-return { background: var(--gold-bg); color: var(--gold); }
        .action-return:hover { background: #d4900a; color: #fff; }
        .expand-body { padding: .75rem 1rem .9rem 3.5rem; display: flex; flex-direction: column; gap: .55rem; }
        .expand-summary { font-size: .86rem; color: var(--text-mid); line-height: 1.6; font-style: italic; }
        .tag-list { display: flex; flex-wrap: wrap; gap: .3rem; }
        .tag-chip {
          display: inline-block;
          padding: .15rem .5rem;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: .7rem;
          color: var(--text-muted);
        }
        .empty-state { text-align: center; padding: 5rem 2rem; color: var(--text-muted); }
        .empty-icon { font-size: 2.5rem; margin-bottom: .75rem; opacity: .4; }
        .empty-title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.15rem; color: var(--text-mid); margin-bottom: .4rem; }
        .table-footer {
          padding: .65rem 1.2rem;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
          font-size: .76rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* ── Word Cloud ── */
        .word-cloud {
          display: flex;
          flex-wrap: wrap;
          gap: .5rem .75rem;
          padding: .75rem 0 .25rem;
          line-height: 1.4;
        }
        .word-cloud-item {
          color: var(--green);
          cursor: default;
          transition: opacity .15s;
          font-family: 'Inter', sans-serif;
        }
        .word-cloud-item:hover { opacity: 1 !important; text-decoration: underline; text-underline-offset: 2px; }

        /* ── Section Label ── */
        .section-label {
          font-size: .68rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: .1em;
          margin-bottom: .6rem;
        }

        /* ── Duplicate Banner ── */
        .duplicate-banner {
          display: flex; gap: .75rem; align-items: flex-start;
          padding: .85rem 1rem;
          background: var(--warn-bg);
          border: 1.5px solid var(--warn-border);
          border-radius: var(--radius);
          color: var(--warn);
          animation: fadeSlide .2s ease;
        }
        .duplicate-banner svg { flex-shrink: 0; margin-top: .15rem; }
        .duplicate-banner-text { display: flex; flex-direction: column; gap: .25rem; font-size: .84rem; }
        .duplicate-banner-text strong { font-weight: 600; color: var(--warn); }
        .duplicate-banner-text span { color: var(--text-mid); line-height: 1.45; }
        .duplicate-isbn-list { display: flex; flex-wrap: wrap; gap: .3rem; margin-top: .3rem; }
        .duplicate-isbn-chip {
          display: inline-block; padding: .1rem .5rem;
          background: #fff; border: 1px solid var(--warn-border);
          border-radius: 999px; font-size: .7rem;
          font-family: monospace; color: var(--warn);
        }

        /* ── Drawer ── */
        .drawer-backdrop {
          position: fixed; inset: 0;
          background: rgba(26,29,35,0);
          pointer-events: none; z-index: 300;
          transition: background .25s;
        }
        .drawer-backdrop-open { background: rgba(26,29,35,.45); pointer-events: all; }
        .drawer {
          position: fixed; top: 0; right: 0;
          height: 100vh; width: var(--drawer-w); max-width: 95vw;
          background: var(--surface);
          box-shadow: var(--shadow-lg);
          z-index: 400;
          display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform .28s cubic-bezier(.4,0,.2,1);
        }
        .drawer-open { transform: translateX(0); }
        .drawer-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(135deg, var(--green) 0%, var(--green-lt) 100%);
          color: #fff; flex-shrink: 0;
        }
        .drawer-title {
          display: flex; align-items: center; gap: .6rem;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.1rem; font-weight: 700;
        }
        .drawer-tabs {
          display: flex; border-bottom: 1px solid var(--border);
          flex-shrink: 0; background: var(--surface); overflow-x: auto;
        }
        .drawer-tab {
          flex: 1; padding: .7rem .5rem;
          background: transparent; border: none;
          font-family: 'Inter', sans-serif;
          font-size: .78rem; font-weight: 500;
          color: var(--text-muted); cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: color .15s, border-color .15s;
          white-space: nowrap; min-width: 70px;
        }
        .drawer-tab:hover { color: var(--text); }
        .drawer-tab-active { color: var(--green); border-bottom-color: var(--green); font-weight: 600; }
        .drawer-body { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; }
        .drawer-loading { display: flex; justify-content: center; padding: 3rem; }
        .drawer-empty { text-align: center; color: var(--text-muted); padding: 2.5rem 1rem; font-size: .9rem; }

        .circ-list { display: flex; flex-direction: column; gap: .05rem; }
        .circ-entry {
          display: flex; gap: .85rem; align-items: flex-start;
          padding: .65rem 0; border-bottom: 1px solid var(--border);
        }
        .circ-entry:last-child { border-bottom: none; }
        .circ-dot {
          width: 9px; height: 9px; border-radius: 50%;
          flex-shrink: 0; margin-top: .38rem;
        }
        .dot-out { background: var(--gold); }
        .dot-in  { background: var(--green-mid); }
        .dot-load { background: var(--text-muted); }
        .circ-info { display: flex; flex-direction: column; gap: .08rem; min-width: 0; }
        .circ-title { font-weight: 500; color: var(--text); font-size: .88rem; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .circ-meta { font-size: .77rem; color: var(--text-muted); }
        .circ-action { font-weight: 600; }
        .action-co { color: var(--gold); }
        .action-ci { color: var(--green); }
        .circ-date { font-size: .72rem; color: var(--text-muted); }

        .borrower-list { display: flex; flex-direction: column; gap: .3rem; }
        .borrower-row {
          display: flex; align-items: center; gap: .85rem;
          padding: .6rem .75rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all .15s;
        }
        .borrower-row:hover { background: var(--surface-2); border-color: var(--border-2); }
        .borrower-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, var(--green) 0%, var(--green-lt) 100%);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: .85rem; flex-shrink: 0;
        }
        .borrower-info { flex: 1; min-width: 0; }
        .borrower-name { display: block; font-weight: 600; color: var(--text); font-size: .86rem; }
        .borrower-sub { display: block; font-size: .74rem; color: var(--text-muted); }
        .borrower-count { font-size: 1rem; font-weight: 700; color: var(--text-mid); }

        .stats-content { display: flex; flex-direction: column; }
        .stat-cards { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
        .stat-card {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: .9rem 1rem;
        }
        .stat-card-num { font-size: 1.9rem; font-weight: 800; color: var(--text); letter-spacing: -.03em; line-height: 1; }
        .stat-card-label { font-size: .68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; margin-top: .2rem; font-weight: 500; }

        .top-books { display: flex; flex-direction: column; gap: .45rem; }
        .top-book-row { display: flex; align-items: center; gap: .65rem; }
        .top-book-rank { font-size: .7rem; color: var(--text-muted); min-width: 1.5rem; text-align: right; }
        .top-book-title { font-size: .82rem; color: var(--text); min-width: 0; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .top-book-bar-wrap { width: 80px; height: 7px; background: var(--border); border-radius: 999px; overflow: hidden; flex-shrink: 0; }
        .top-book-bar { display: block; height: 100%; background: var(--green-mid); border-radius: 999px; transition: width .4s; }
        .top-book-count { font-size: .78rem; color: var(--text-muted); min-width: 2rem; text-align: right; }

        /* ── Modals ── */
        .modal-card-lg { max-width: 560px; }
        .isbn-search-row { display: flex; gap: .65rem; align-items: center; }
        .preview-card {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1rem 1.1rem;
          display: flex; flex-direction: column; gap: .4rem;
        }
        .preview-title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.05rem; font-weight: 700; color: var(--text); margin-bottom: .2rem; }
        .preview-field { display: flex; gap: .5rem; font-size: .84rem; }
        .preview-label { color: var(--text-muted); min-width: 70px; flex-shrink: 0; }
        .preview-value { color: var(--text-mid); }
        .preview-summary { font-size: .82rem; color: var(--text-mid); font-style: italic; line-height: 1.5; margin-top: .3rem; padding-top: .5rem; border-top: 1px solid var(--border); }
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(26,29,35,.55);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 500;
          animation: fadeIn .15s ease;
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .modal-card {
          background: var(--surface);
          border-radius: var(--radius-lg);
          width: 90%; max-width: 460px;
          box-shadow: var(--shadow-lg);
          animation: slideUp .2s cubic-bezier(.34,1.56,.64,1);
          overflow: hidden;
        }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) scale(.98) } to { opacity:1; transform:none } }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.2rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .modal-header h3 { font-family: 'Playfair Display', Georgia, serif; font-size: 1.1rem; font-weight: 700; }
        .modal-body { padding: 1.4rem 1.5rem; display: flex; flex-direction: column; gap: .9rem; }
        .modal-footer {
          display: flex; justify-content: flex-end; gap: .65rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
        }
        .book-chip {
          display: flex; align-items: center; gap: .6rem;
          padding: .6rem .9rem;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: .9rem;
        }
        .book-chip svg { color: var(--green); flex-shrink: 0; }
        .field-label {
          font-family: 'Inter', sans-serif;
          font-size: .75rem;
          font-weight: 600;
          color: var(--text-mid);
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .text-input {
          width: 100%;
          padding: .6rem .9rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: .9rem;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .text-input:focus { border-color: var(--green-mid); box-shadow: 0 0 0 3px rgba(82,183,136,.15); }
        .return-note { font-size: .9rem; color: var(--text-mid); }
        .return-note strong { color: var(--text); }

        .drop-zone {
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .drop-zone:hover, .drop-zone-active { border-color: var(--green-mid); background: var(--green-bg); }
        .drop-zone-filled { border-color: var(--green-mid); background: var(--green-bg); }
        .drop-icon { font-size: 1.8rem; margin-bottom: .75rem; color: var(--text-muted); display: flex; justify-content: center; }
        .drop-primary, .drop-filename { font-size: .9rem; font-weight: 500; color: var(--text); margin-bottom: .25rem; }
        .drop-filename { color: var(--green); }
        .drop-sub { font-size: .76rem; color: var(--text-muted); }

        /* ── Toasts ── */
        .toast {
          display: flex; align-items: center; gap: .65rem;
          padding: .7rem .95rem;
          border-radius: var(--radius);
          min-width: 260px; max-width: 380px;
          font-size: .86rem;
          box-shadow: var(--shadow-lg);
          animation: toastIn .25s cubic-bezier(.34,1.56,.64,1);
          font-weight: 500;
        }
        @keyframes toastIn { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:none } }
        .toast span { flex: 1; }
        .toast-success { background: var(--green); color: #fff; }
        .toast-error   { background: #c53030; color: #fff; }
        .toast-warn    { background: #d4900a; color: #fff; }
        .toast-info    { background: var(--text); color: #f4f6f8; }
        .toast-close { background: none; border: none; cursor: pointer; color: inherit; opacity: .7; padding: 0; display: flex; }
        .toast-close:hover { opacity: 1; }

        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .6s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform:rotate(360deg) } }
        .loading-row td { text-align: center; padding: 4rem; }
        .loading-pulse { display: flex; gap: .5rem; justify-content: center; align-items: center; }
        .pulse-dot {
          width: 8px; height: 8px;
          background: var(--green-mid);
          border-radius: 50%;
          animation: pulse 1.2s ease infinite;
        }
        .pulse-dot:nth-child(2) { animation-delay: .2s }
        .pulse-dot:nth-child(3) { animation-delay: .4s }
        @keyframes pulse { 0%,80%,100% { transform:scale(.6); opacity:.4 } 40% { transform:scale(1); opacity:1 } }
        .hidden { display: none !important; }

        /* ── Admin Drawer (left side) ── */
        .drawer-left {
          left: 0; right: auto;
          transform: translateX(-100%);
        }
        .drawer-left.drawer-open { transform: translateX(0); }

        .admin-action-btn {
          display: flex; align-items: flex-start; gap: .9rem;
          padding: .9rem 1rem;
          background: var(--surface-2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer; text-align: left; width: 100%;
          transition: all .15s;
          color: var(--text); font-family: 'Inter', sans-serif;
        }
        .admin-action-btn:hover { border-color: var(--green-mid); background: var(--green-bg); }
        .admin-action-btn:disabled { opacity: .4; cursor: not-allowed; }
        .admin-action-btn svg { flex-shrink: 0; color: var(--green); margin-top: .15rem; }
        .admin-action-title { font-weight: 600; font-size: .9rem; margin-bottom: .15rem; }
        .admin-action-sub { font-size: .76rem; color: var(--text-muted); line-height: 1.4; }

        /* ── Book detail expand ── */
        .expand-meta-grid {
          display: grid; grid-template-columns: auto 1fr;
          gap: .2rem .75rem; font-size: .8rem;
        }
        .expand-meta-label { color: var(--text-muted); font-weight: 500; white-space: nowrap; }
        .expand-meta-value { color: var(--text-mid); font-family: monospace; font-size: .78rem; }

        /* ── Responsive: Tablet ── */
        @media (max-width: 980px) {
          .header { padding: 0 1.25rem; height: auto; min-height: 62px; flex-wrap: wrap; gap: .65rem; padding-top: .65rem; padding-bottom: .65rem; }
          .header-actions { flex-wrap: wrap; gap: .4rem; justify-content: flex-end; }
          .stats-bar { padding: .65rem 1.25rem; }
          .toolbar { padding: .75rem 1.25rem; }
          .search-wrap { min-width: 180px; max-width: 100%; flex-basis: 100%; }
          .content { padding: 1.1rem 1.25rem; }
          .drawer { --drawer-w: 420px; }
        }

        /* ── Responsive: Mobile ── */
        @media (max-width: 640px) {
          .header { padding: .65rem .9rem; flex-direction: column; align-items: stretch; gap: .55rem; }
          .header-brand { justify-content: center; }
          .brand-logo { height: 32px; }
          .brand-title { font-size: .95rem; }
          .header-actions { justify-content: center; gap: .35rem; flex-wrap: wrap; }
          .header-actions .btn, .header-actions .btn-circ { font-size: .75rem; padding: .42rem .65rem; }
          .stats-bar { padding: .55rem .9rem; gap: 0; flex-wrap: wrap; }
          .stat-item { padding: .3rem 1.25rem .3rem 0; }
          .stat-num { font-size: 1.3rem; }
          .toolbar { padding: .55rem .9rem; flex-direction: column; align-items: stretch; gap: .45rem; }
          .search-wrap { max-width: 100%; min-width: 0; }
          .filter-group { width: 100%; }
          .filter-btn { flex: 1; text-align: center; padding: .42rem .4rem; font-size: .74rem; }
          .filter-select { width: 100%; }
          .content { padding: .65rem .65rem; }

          table, thead, tbody, th, td, tr { display: block; }
          thead tr { position: absolute; top: -9999px; left: -9999px; }
          .book-row { border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: .5rem; padding: .75rem; background: var(--surface); display: flex; flex-direction: column; gap: .35rem; }
          .book-row:hover { background: var(--surface-2); }
          td { padding: 0; border: none; }
          .td-title { max-width: 100%; min-width: 0; }
          .td-author::before { content:"Author: "; font-size: .68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
          .td-year::before { content:"Year: "; font-size: .68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
          .td-dewey::before { content:"Dewey: "; font-size: .68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
          .td-status { margin-top: .2rem; }
          .td-actions { text-align: left; padding-right: 0; margin-top: .3rem; }
          .action-btn { width: 100%; justify-content: center; padding: .48rem; }
          .table-footer { flex-direction: column; text-align: center; gap: .2rem; padding: .55rem .9rem; }
          .expand-row td { padding: .4rem 0; }
          .expand-body { padding: .65rem .75rem; }

          .modal-card, .modal-card-lg { width: 95%; max-width: 95%; }
          .modal-header, .modal-body, .modal-footer { padding-left: 1rem; padding-right: 1rem; }
          .isbn-search-row { flex-direction: column; }

          .drawer { --drawer-w: 100vw; }
          .stat-cards { grid-template-columns: 1fr 1fr; gap: .45rem; }
          .stat-card { padding: .6rem .75rem; }
          .stat-card-num { font-size: 1.5rem; }
          .toast { min-width: 0; max-width: calc(100vw - 1.5rem); font-size: .8rem; }
        }
      `}</style>

      <div className="app-shell">
        <header className="header">
          <div className="header-brand">
            <img src="/WMUMC-Logo.png" alt="Wesley Monumental UMC" className="brand-logo" />
            <div className="brand-divider" />
            <div className="brand-text">
              <div className="brand-title">Wesley Monumental UMC</div>
              <div className="brand-sub">Church Library</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-circ" onClick={()=>setShowCirc(true)}><ClipboardIcon /> Circulation</button>
            <button className="btn btn-outline" onClick={loadBooks} disabled={loading}><RefreshIcon /></button>
            <button className="btn btn-primary" onClick={()=>setShowAdmin(true)}><GearIcon /> Admin</button>
          </div>
        </header>

        {hasFetched && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-num">{stats.total}</span>
              <span className="stat-label">Total Books</span>
            </div>
            <div className="stat-item">
              <span className="stat-num" style={{color:"var(--green)"}}>{stats.available}</span>
              <span className="stat-label">Available</span>
            </div>
            <div className="stat-item">
              <span className="stat-num" style={{color:"var(--gold)"}}>{stats.out}</span>
              <span className="stat-label">Checked Out</span>
            </div>
          </div>
        )}

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon"><SearchIcon /></span>
            <input className="search-input" placeholder="Search title, author, tags, summary…"
              value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="filter-group">
            {[["all","All"],["available","Available"],["out","Checked Out"]].map(([val,label])=>(
              <button key={val} className={`filter-btn ${filterStatus===val?"active":""}`} onClick={()=>setFilterStatus(val)}>{label}</button>
            ))}
          </div>
          <select className="filter-select" value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {activeCategories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={filterAudience} onChange={e=>setFilterAudience(e.target.value)}>
            <option value="all">All Audiences</option>
            {activeAudiences.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <select className="filter-select" value={`${sortBy}-${sortDir}`} onChange={e=>{const[col,dir]=e.target.value.split("-");setSortBy(col);setSortDir(dir);}}>
            <option value="title-asc">Title A→Z</option>
            <option value="title-desc">Title Z→A</option>
            <option value="author-asc">Author A→Z</option>
            <option value="author-desc">Author Z→A</option>
            <option value="category-asc">Category A→Z</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>
          {hasFilters && <button className="clear-btn" onClick={()=>{setSearch("");setFilterStatus("all");setFilterCategory("all");setFilterAudience("all");}}>Clear</button>}
          {hasFilters && <span className="result-count">{filtered.length} of {books.length}</span>}
        </div>

        <main className="content">
          <div className="table-wrap">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th onClick={()=>toggleSort("title")}>Title <SortArrow col="title"/></th>
                    <th onClick={()=>toggleSort("author")}>Author <SortArrow col="author"/></th>
                    <th onClick={()=>toggleSort("date")}>Year <SortArrow col="date"/></th>
                    <th>Dewey</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="loading-row"><td colSpan={6}><div className="loading-pulse"><div className="pulse-dot"/><div className="pulse-dot"/><div className="pulse-dot"/></div></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <div className="empty-title">{books.length===0?"Catalog is empty":"No results found"}</div>
                        <div style={{fontSize:".88rem"}}>{books.length===0?"Upload a CSV to add books.":"Try adjusting your filters."}</div>
                      </div>
                    </td></tr>
                  ) : (
                    filtered.map((book,i)=>(
                      <BookRow key={book.isbn||i} book={book} index={i} onCheckout={setCheckoutBook} onReturn={setReturnBook}/>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="table-footer">
                <span>Showing {filtered.length} {filtered.length===1?"book":"books"}</span>
                <span>Expand any row for AI summary &amp; tags</span>
              </div>
            )}
          </div>
        </main>
      </div>

      <AdminDrawer open={showAdmin} onClose={()=>setShowAdmin(false)} books={books} onAddBook={()=>setShowLookup(true)} onUpload={()=>setShowUpload(true)} />
      <CirculationDrawer open={showCirc} onClose={()=>setShowCirc(false)} books={books} />
      {showLookup   && <ISBNLookupModal onSuccess={loadBooks} addToast={addToast} onClose={()=>setShowLookup(false)} existingBooks={books}/>}
      {checkoutBook && <CheckoutModal book={checkoutBook} onClose={()=>setCheckoutBook(null)} onSuccess={loadBooks} addToast={addToast}/>}
      {returnBook   && <ReturnModal   book={returnBook}   onClose={()=>setReturnBook(null)}   onSuccess={loadBooks} addToast={addToast}/>}
      {showUpload   && <UploadPanel   onSuccess={loadBooks} addToast={addToast} onClose={()=>setShowUpload(false)} existingBooks={books}/>}
      <Toast toasts={toasts} removeToast={removeToast}/>
    </>
  );
}
