import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// ── Icons ────────────────────────────────────────────────────────────────────
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
const DownloadIcon  = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);

// ── Book Cover ────────────────────────────────────────────────────────────────
function BookCover({ url, title, size = "sm" }) {
  const [err, setErr] = React.useState(false);
  const dim = size === "lg"
    ? { width: 90, height: 120, fontSize: "1.8rem" }
    : { width: 36, height: 48, fontSize: ".85rem" };
  const style = {
    width: dim.width, height: dim.height, flexShrink: 0,
    borderRadius: 4, overflow: "hidden",
    background: "var(--cream)", border: "1px solid var(--border)",
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
    <div style={{ ...style, color: "var(--ink-light)", fontSize: dim.fontSize }}>
      📖
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return val; }
}

// ── CSV Export ────────────────────────────────────────────────────────────────
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

// Normalize ISBN to digits-only uppercase for comparison
const normalizeISBN = s => String(s || "").replace(/[^0-9Xx]/g, "").toUpperCase();

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position:"fixed", bottom:"2rem", right:"2rem", zIndex:9999, display:"flex", flexDirection:"column", gap:"0.6rem" }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="toast-close"><CrossIcon /></button>
        </div>
      ))}
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
    { id:"borrower", label:"By Borrower" },
    { id:"stats",    label:"Stats" },
  ];

  return (
    <>
      <div className={`drawer-backdrop ${open ? "drawer-backdrop-open" : ""}`} onClick={onClose} />
      <div className={`drawer ${open ? "drawer-open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-title"><ClipboardIcon /><span>Circulation Log</span></div>
          <div style={{ display:"flex", gap:".5rem", alignItems:"center" }}>
            <button className="icon-btn" onClick={loadLog} title="Refresh"><RefreshIcon /></button>
            <button className="icon-btn" onClick={onClose}><CloseIcon /></button>
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
                  <p className="drawer-section-label">All Borrowers</p>
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
              <p className="drawer-section-label" style={{marginTop:"1.25rem"}}>Most Borrowed Books</p>
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
              <p className="drawer-section-label" style={{marginTop:"1.25rem"}}>Catalog by Category</p>
              {(() => {
                const cats = {};
                books.forEach(b => { if (b.category) cats[b.category] = (cats[b.category]||0)+1; });
                const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
                const max = sorted[0]?.[1] || 1;
                return sorted.length === 0 ? <div className="drawer-empty">No category data.</div> : (
                  <div className="top-books">
                    {sorted.map(([cat, count]) => (
                      <div key={cat} className="top-book-row">
                        <span className="cat-badge" style={{minWidth:"6rem",textAlign:"center"}}>{cat}</span>
                        <span className="top-book-bar-wrap"><span className="top-book-bar" style={{ width:`${Math.round((count/max)*100)}%`, background:"var(--sage)" }} /></span>
                        <span className="top-book-count">{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
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
      const res = await axios.get(`/api/books/lookup?isbn=${val}`, { withCredentials: true });
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
      await axios.post("/api/books/add", preview, { withCredentials: true });
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
                <span>"{duplicate.title}" by {duplicate.author || "unknown author"} is cataloged with this ISBN. You can still add it if this is a different edition.</span>
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
                <span>These were already in your library and have been updated with the latest metadata. If these are different editions, add them individually via "Add Book."</span>
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

// ── Book Row ──────────────────────────────────────────────────────────────────
function BookRow({ book, onCheckout, onReturn, index }) {
  const [expanded, setExpanded] = useState(false);
  const isOut = !!book.checked_out_by;
  const tags = book.tags ? book.tags.split(",").map(t=>t.trim()).filter(Boolean) : [];

  return (
    <>
      <tr className="book-row" style={{ animationDelay:`${Math.min(index*20,400)}ms` }}>
        <td className="td-title">
          <div className="title-cell" style={{display:"flex",gap:".75rem",alignItems:"flex-start"}}>
            <BookCover url={book.image_url} title={book.title} size="sm" />
            <div style={{flex:1,minWidth:0}}>
            <div className="title-top">
              <span className="title-text">{book.title || "—"}</span>
              {(book.summary || tags.length > 0) && (
                <button className="expand-btn" onClick={()=>setExpanded(v=>!v)} title="Show summary & tags">
                  <ChevronIcon open={expanded} />
                </button>
              )}
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
        @import url('https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,300;1,400&family=Open+Sans:wght@300;400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          /* ── Wesley Monumental UMC Color Palette ── */
          --ink:#353535;--ink-mid:#5a5550;--ink-light:#8a857e;
          --cream:#f8f6f3;--warm-white:#ffffff;--parchment:#f0ede8;
          --accent:#b42025;--accent-lt:#d03035;--accent-bg:#fdeced;
          --sage:#75ad99;--sage-lt:#8ec4ae;--sage-bg:#edf7f1;
          --gold:#e5b43a;--gold-bg:#fdf6e3;
          --blue:#2a5c8b;--blue-bg:#edf3fd;
          --warn:#92600a;--warn-bg:#fef3cd;--warn-border:#f0c040;
          --border:#ddd8d0;--shadow:rgba(53,53,53,.08);
          --radius:8px;--radius-sm:5px;
          --drawer-w:480px;
          --green:#2d6a4f;--green-lt:#52b788;--green-bg:#edf7f1;
        }
        body{background:var(--cream);color:var(--ink);font-family:'Lato',Helvetica,Arial,sans-serif;font-size:15px;line-height:2em;}
        .app-shell{min-height:100vh;display:flex;flex-direction:column;}

        /* ── Header ── */
        .header{background:var(--warm-white);color:var(--ink);padding:0 2.5rem;display:flex;align-items:center;justify-content:space-between;height:80px;position:sticky;top:0;z-index:200;box-shadow:0 2px 12px rgba(0,0,0,.08);border-bottom:1px solid var(--border);}
        .header-brand{display:flex;align-items:center;gap:1rem;}
        .brand-logo{height:48px;width:auto;object-fit:contain;flex-shrink:0;}
        .brand-divider{width:1px;height:40px;background:var(--border);margin:0 .25rem;}
        .brand-text{display:flex;flex-direction:column;}
        .brand-title{font-family:'Arvo',Georgia,serif;font-size:1.15rem;font-weight:700;color:var(--ink);line-height:1.25;}
        .brand-sub{font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:.68rem;color:var(--ink-light);letter-spacing:.1em;text-transform:uppercase;line-height:1.3;}
        .header-actions{display:flex;align-items:center;gap:.65rem;}

        /* ── Stats Bar ── */
        .stats-bar{background:var(--warm-white);border-bottom:1px solid var(--border);padding:.85rem 2.5rem;display:flex;gap:2.5rem;align-items:center;}
        .stat-item{display:flex;align-items:baseline;gap:.4rem;}
        .stat-num{font-family:'Arvo',Georgia,serif;font-size:1.5rem;font-weight:700;}
        .stat-label{font-family:'Open Sans',Helvetica,Arial,sans-serif;font-size:.72rem;color:var(--ink-light);text-transform:uppercase;letter-spacing:.07em;}
        .stat-divider{width:1px;height:28px;background:var(--border);}

        /* ── Toolbar ── */
        .toolbar{padding:1rem 2.5rem;display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;background:var(--warm-white);border-bottom:1px solid var(--border);}
        .search-wrap{flex:1;min-width:220px;max-width:380px;position:relative;}
        .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--ink-light);pointer-events:none;}
        .search-input{width:100%;padding:.6rem 1rem .6rem 2.4rem;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--cream);color:var(--ink);font-family:'Lato',sans-serif;font-size:.9rem;outline:none;transition:border-color .15s,box-shadow .15s;}
        .search-input:focus{border-color:var(--sage);box-shadow:0 0 0 3px rgba(117,173,153,.15);}
        .search-input::placeholder{color:var(--ink-light);}
        .filter-group{display:flex;border:1.5px solid var(--border);border-radius:var(--radius);overflow:hidden;}
        .filter-btn{padding:.5rem .9rem;background:transparent;border:none;font-family:'Open Sans',sans-serif;font-size:.8rem;font-weight:500;color:var(--ink-light);cursor:pointer;transition:background .15s,color .15s;white-space:nowrap;}
        .filter-btn:not(:last-child){border-right:1px solid var(--border);}
        .filter-btn.active{background:var(--ink);color:var(--warm-white);}
        .filter-btn:not(.active):hover{background:var(--parchment);color:var(--ink);}
        .filter-select{padding:.5rem .85rem;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--cream);color:var(--ink);font-family:'Open Sans',sans-serif;font-size:.8rem;cursor:pointer;outline:none;max-width:160px;}
        .filter-select:focus{border-color:var(--sage);}
        .clear-btn{padding:.5rem .85rem;background:transparent;border:1.5px solid var(--border);border-radius:var(--radius);font-family:'Open Sans',sans-serif;font-size:.8rem;color:var(--sage);cursor:pointer;transition:background .15s;}
        .clear-btn:hover{background:var(--sage-bg);}
        .result-count{font-size:.78rem;color:var(--ink-light);white-space:nowrap;margin-left:auto;}

        /* ── Buttons ── */
        .btn{display:inline-flex;align-items:center;gap:.4rem;padding:.6rem 1.2rem;border-radius:var(--radius);font-family:'Open Sans',sans-serif;font-size:.88rem;font-weight:600;border:none;cursor:pointer;transition:background .15s,transform .1s,box-shadow .15s;white-space:nowrap;text-transform:none;}
        .btn:active{transform:scale(.97);}
        .btn-primary{background:var(--sage);color:#fff;}
        .btn-primary:hover{background:var(--gold);box-shadow:0 4px 12px rgba(229,180,58,.25);}
        .btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none;}
        .btn-accent{background:var(--sage);color:#fff;}
        .btn-accent:hover{background:var(--gold);}
        .btn-accent:disabled{opacity:.55;cursor:not-allowed;}
        .btn-ghost{background:transparent;color:var(--ink-mid);border:1.5px solid var(--border);}
        .btn-ghost:hover{background:var(--parchment);}
        .btn-outline{background:transparent;color:var(--ink-mid);border:1.5px solid var(--border);}
        .btn-outline:hover{background:var(--parchment);border-color:var(--ink-light);}
        .btn-circ{background:var(--sage-bg);color:var(--sage);border:1.5px solid rgba(117,173,153,.25);display:inline-flex;align-items:center;gap:.4rem;padding:.55rem 1rem;border-radius:var(--radius);font-family:'Open Sans',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;transition:background .15s,color .15s;white-space:nowrap;}
        .btn-circ:hover{background:var(--sage);color:#fff;}
        .icon-btn{background:none;border:none;cursor:pointer;color:var(--ink-light);padding:.25rem;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;transition:color .15s,background .15s;}
        .icon-btn:hover{color:var(--ink);background:var(--parchment);}

        /* ── Content ── */
        .content{flex:1;padding:2rem 2.5rem;}
        .table-wrap{background:var(--warm-white);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;box-shadow:0 2px 16px var(--shadow);}
        .table-scroll{overflow-x:auto;}
        table{width:100%;border-collapse:collapse;}
        thead tr{background:var(--ink);}
        th{padding:.85rem 1rem;text-align:left;font-family:'Open Sans',sans-serif;font-size:.72rem;font-weight:500;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.09em;cursor:pointer;user-select:none;white-space:nowrap;transition:color .15s;}
        th:hover{color:#fff;}
        th:last-child{cursor:default;}
        .sort-arrow{font-size:.7rem;opacity:.5;}
        .sort-active{opacity:1;color:var(--gold);}
        .book-row{border-bottom:1px solid var(--border);animation:fadeSlide .3s ease both;transition:background .12s;}
        .book-row:hover{background:var(--parchment);}
        .expand-row{border-bottom:1px solid var(--border);background:var(--parchment);}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        td{padding:.75rem 1rem;vertical-align:middle;}
        .td-title{min-width:220px;max-width:340px;}
        .title-top{display:flex;align-items:center;gap:.4rem;}
        .title-text{font-weight:500;color:var(--ink);line-height:1.3;}
        .expand-btn{background:none;border:none;cursor:pointer;color:var(--ink-light);padding:.1rem;display:flex;align-items:center;flex-shrink:0;transition:color .15s;}
        .expand-btn:hover{color:var(--ink);}
        .title-meta{display:flex;gap:.35rem;margin-top:.25rem;flex-wrap:wrap;}
        .cat-badge{display:inline-block;padding:.1rem .5rem;background:var(--blue-bg);color:var(--blue);border-radius:999px;font-size:.68rem;font-weight:500;}
        .aud-badge{display:inline-block;padding:.1rem .5rem;background:var(--gold-bg);color:var(--gold);border-radius:999px;font-size:.68rem;font-weight:500;}
        .td-author{min-width:140px;color:var(--ink-mid);}
        .td-year{min-width:60px;color:var(--ink-light);font-variant-numeric:tabular-nums;}
        .td-dewey{min-width:90px;}
        .dewey-chip{display:inline-block;padding:.15rem .5rem;background:var(--parchment);border:1px solid var(--border);border-radius:999px;font-size:.72rem;color:var(--ink-mid);}
        .muted{color:var(--ink-light);}
        .td-status{min-width:140px;}
        .status-pill{display:inline-block;padding:.2rem .65rem;border-radius:999px;font-size:.76rem;font-weight:500;white-space:nowrap;}
        .status-in{background:var(--sage-bg);color:var(--sage);}
        .status-out{background:var(--gold-bg);color:#8b6914;}
        .td-actions{min-width:130px;text-align:right;padding-right:1.2rem;}
        .action-btn{display:inline-flex;align-items:center;gap:.35rem;padding:.38rem .85rem;border-radius:var(--radius-sm);font-family:'Open Sans',sans-serif;font-size:.8rem;font-weight:600;border:none;cursor:pointer;transition:background .15s,transform .1s;}
        .action-btn:active{transform:scale(.95);}
        .action-checkout{background:var(--sage-bg);color:var(--sage);}
        .action-checkout:hover{background:var(--sage);color:#fff;}
        .action-return{background:var(--gold-bg);color:#8b6914;}
        .action-return:hover{background:var(--gold);color:#fff;}
        .expand-body{padding:.75rem 1rem .9rem 1rem;display:flex;flex-direction:column;gap:.6rem;}
        .expand-summary{font-size:.88rem;color:var(--ink-mid);line-height:1.55;font-style:italic;}
        .tag-list{display:flex;flex-wrap:wrap;gap:.35rem;}
        .tag-chip{display:inline-block;padding:.15rem .55rem;background:var(--cream);border:1px solid var(--border);border-radius:999px;font-size:.72rem;color:var(--ink-light);}
        .empty-state{text-align:center;padding:5rem 2rem;color:var(--ink-light);}
        .empty-icon{font-size:2.5rem;margin-bottom:.75rem;opacity:.4;}
        .empty-title{font-family:'Arvo',Georgia,serif;font-size:1.2rem;color:var(--ink-mid);margin-bottom:.4rem;}
        .table-footer{padding:.7rem 1.2rem;border-top:1px solid var(--border);background:var(--parchment);font-size:.78rem;color:var(--ink-light);display:flex;align-items:center;justify-content:space-between;}

        /* ── Duplicate Banner ── */
        .duplicate-banner{display:flex;gap:.75rem;align-items:flex-start;padding:.85rem 1rem;background:var(--warn-bg);border:1.5px solid var(--warn-border);border-radius:var(--radius);color:var(--warn);animation:fadeSlide .2s ease;}
        .duplicate-banner svg{flex-shrink:0;margin-top:.15rem;}
        .duplicate-banner-text{display:flex;flex-direction:column;gap:.25rem;font-size:.85rem;}
        .duplicate-banner-text strong{font-weight:600;color:var(--warn);}
        .duplicate-banner-text span{color:var(--ink-mid);line-height:1.45;}
        .duplicate-isbn-list{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.35rem;}
        .duplicate-isbn-chip{display:inline-block;padding:.1rem .5rem;background:#fff;border:1px solid var(--warn-border);border-radius:999px;font-size:.72rem;font-family:monospace;color:var(--warn);}

        /* ── Drawer ── */
        .drawer-backdrop{position:fixed;inset:0;background:rgba(53,53,53,0);pointer-events:none;z-index:300;transition:background .25s;}
        .drawer-backdrop-open{background:rgba(53,53,53,.4);pointer-events:all;}
        .drawer{position:fixed;top:0;right:0;height:100vh;width:var(--drawer-w);max-width:95vw;background:var(--warm-white);box-shadow:-8px 0 40px rgba(0,0,0,.18);z-index:400;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);}
        .drawer-open{transform:translateX(0);}
        .drawer-header{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.5rem;border-bottom:1px solid var(--border);background:var(--sage);color:#fff;flex-shrink:0;}
        .drawer-title{display:flex;align-items:center;gap:.6rem;font-family:'Arvo',Georgia,serif;font-size:1.1rem;font-weight:700;}
        .drawer-header .icon-btn{color:rgba(255,255,255,.7);}
        .drawer-header .icon-btn:hover{color:#fff;background:rgba(255,255,255,.1);}
        .drawer-tabs{display:flex;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--warm-white);}
        .drawer-tab{flex:1;padding:.7rem .5rem;background:transparent;border:none;font-family:'Open Sans',sans-serif;font-size:.78rem;font-weight:500;color:var(--ink-light);cursor:pointer;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;white-space:nowrap;}
        .drawer-tab:hover{color:var(--ink);}
        .drawer-tab-active{color:var(--sage);border-bottom-color:var(--sage);}
        .drawer-body{flex:1;overflow-y:auto;padding:1.25rem 1.5rem;}
        .drawer-loading{display:flex;justify-content:center;padding:3rem;}
        .drawer-empty{text-align:center;color:var(--ink-light);padding:2.5rem 1rem;font-size:.9rem;}
        .drawer-section-label{font-family:'Open Sans',sans-serif;font-size:.72rem;font-weight:500;color:var(--ink-light);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem;}
        .circ-list{display:flex;flex-direction:column;gap:.1rem;}
        .circ-entry{display:flex;gap:.85rem;align-items:flex-start;padding:.6rem 0;border-bottom:1px solid var(--border);}
        .circ-entry:last-child{border-bottom:none;}
        .circ-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:.35rem;}
        .dot-out{background:var(--gold);}
        .dot-in{background:var(--sage);}
        .dot-load{background:var(--ink-light);}
        .circ-info{display:flex;flex-direction:column;gap:.1rem;min-width:0;}
        .circ-title{font-weight:500;color:var(--ink);font-size:.88rem;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .circ-meta{font-size:.78rem;color:var(--ink-light);}
        .circ-action{font-weight:500;}
        .action-co{color:#8b6914;}
        .action-ci{color:var(--sage);}
        .circ-date{font-size:.73rem;color:var(--ink-light);}
        .borrower-list{display:flex;flex-direction:column;gap:.35rem;}
        .borrower-row{display:flex;align-items:center;gap:.85rem;padding:.65rem .75rem;border-radius:var(--radius);border:1px solid var(--border);cursor:pointer;transition:background .15s;}
        .borrower-row:hover{background:var(--parchment);}
        .borrower-avatar{width:34px;height:34px;border-radius:50%;background:var(--sage);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;flex-shrink:0;}
        .borrower-info{flex:1;min-width:0;}
        .borrower-name{display:block;font-weight:500;color:var(--ink);font-size:.88rem;}
        .borrower-sub{display:block;font-size:.75rem;color:var(--ink-light);}
        .borrower-count{font-family:'Arvo',Georgia,serif;font-size:1.1rem;font-weight:700;color:var(--ink-mid);}
        .stats-content{display:flex;flex-direction:column;}
        .stat-cards{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}
        .stat-card{background:var(--parchment);border:1px solid var(--border);border-radius:var(--radius);padding:.9rem 1rem;}
        .stat-card-num{font-family:'Arvo',Georgia,serif;font-size:1.8rem;font-weight:700;color:var(--ink);}
        .stat-card-label{font-family:'Open Sans',sans-serif;font-size:.72rem;color:var(--ink-light);text-transform:uppercase;letter-spacing:.07em;}
        .top-books{display:flex;flex-direction:column;gap:.5rem;}
        .top-book-row{display:flex;align-items:center;gap:.75rem;}
        .top-book-rank{font-size:.72rem;color:var(--ink-light);min-width:1.5rem;text-align:right;}
        .top-book-title{font-size:.82rem;color:var(--ink);min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .top-book-bar-wrap{width:80px;height:8px;background:var(--border);border-radius:999px;overflow:hidden;flex-shrink:0;}
        .top-book-bar{display:block;height:100%;background:var(--sage);border-radius:999px;transition:width .4s;}
        .top-book-count{font-size:.78rem;color:var(--ink-light);min-width:2rem;text-align:right;}

        /* ── Modals ── */
        .modal-card-lg{max-width:560px;}
        .isbn-search-row{display:flex;gap:.75rem;align-items:center;}
        .preview-card{background:var(--parchment);border:1px solid var(--border);border-radius:var(--radius);padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.4rem;}
        .preview-title{font-family:'Arvo',Georgia,serif;font-size:1.05rem;font-weight:700;color:var(--ink);margin-bottom:.2rem;}
        .preview-field{display:flex;gap:.5rem;font-size:.85rem;}
        .preview-label{color:var(--ink-light);min-width:70px;flex-shrink:0;}
        .preview-value{color:var(--ink-mid);}
        .preview-summary{font-size:.83rem;color:var(--ink-mid);font-style:italic;line-height:1.5;margin-top:.3rem;padding-top:.5rem;border-top:1px solid var(--border);}
        .modal-backdrop{position:fixed;inset:0;background:rgba(53,53,53,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:500;animation:fadeIn .15s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .modal-card{background:var(--warm-white);border-radius:12px;width:90%;max-width:460px;box-shadow:0 24px 64px rgba(0,0,0,.2);animation:slideUp .2s ease;overflow:hidden;}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:1.2rem 1.5rem;border-bottom:1px solid var(--border);}
        .modal-header h3{font-family:'Arvo',Georgia,serif;font-size:1.15rem;font-weight:700;}
        .modal-body{padding:1.5rem;display:flex;flex-direction:column;gap:1rem;}
        .modal-footer{display:flex;justify-content:flex-end;gap:.75rem;padding:1rem 1.5rem;border-top:1px solid var(--border);background:var(--parchment);}
        .book-chip{display:flex;align-items:center;gap:.6rem;padding:.6rem .9rem;background:var(--parchment);border:1px solid var(--border);border-radius:var(--radius);font-size:.9rem;}
        .book-chip svg{color:var(--accent);flex-shrink:0;}
        .field-label{font-family:'Open Sans',sans-serif;font-size:.8rem;font-weight:500;color:var(--ink-mid);letter-spacing:.04em;text-transform:uppercase;}
        .text-input{width:100%;padding:.65rem .9rem;border:1.5px solid var(--border);border-radius:var(--radius);background:var(--cream);color:var(--ink);font-family:'Lato',sans-serif;font-size:.95rem;outline:none;transition:border-color .15s,box-shadow .15s;}
        .text-input:focus{border-color:var(--sage);box-shadow:0 0 0 3px rgba(117,173,153,.15);}
        .return-note{font-size:.9rem;color:var(--ink-mid);}
        .return-note strong{color:var(--ink);}
        .drop-zone{border:2px dashed var(--border);border-radius:var(--radius);padding:2.5rem 1.5rem;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;}
        .drop-zone:hover,.drop-zone-active{border-color:var(--sage);background:var(--sage-bg);}
        .drop-zone-filled{border-color:var(--sage);background:var(--sage-bg);}
        .drop-icon{font-size:1.8rem;margin-bottom:.75rem;color:var(--ink-light);display:flex;justify-content:center;}
        .drop-primary,.drop-filename{font-size:.92rem;font-weight:500;color:var(--ink);margin-bottom:.25rem;}
        .drop-filename{color:var(--sage);}
        .drop-sub{font-size:.78rem;color:var(--ink-light);}

        /* ── Toasts ── */
        .toast{display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;border-radius:var(--radius);min-width:280px;max-width:400px;font-size:.88rem;box-shadow:0 8px 24px rgba(0,0,0,.15);animation:toastIn .25s ease;}
        @keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
        .toast span{flex:1;}
        .toast-success{background:var(--sage);color:#fff;}
        .toast-error{background:#c44;color:#fff;}
        .toast-warn{background:var(--gold);color:var(--ink);}
        .toast-info{background:var(--ink);color:var(--cream);}
        .toast-close{background:none;border:none;cursor:pointer;color:inherit;opacity:.7;padding:0;display:flex;}
        .toast-close:hover{opacity:1;}
        .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;display:inline-block;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .loading-row td{text-align:center;padding:4rem;}
        .loading-pulse{display:flex;gap:.5rem;justify-content:center;align-items:center;}
        .pulse-dot{width:8px;height:8px;background:var(--sage);border-radius:50%;animation:pulse 1.2s ease infinite;}
        .pulse-dot:nth-child(2){animation-delay:.2s}.pulse-dot:nth-child(3){animation-delay:.4s}
        @keyframes pulse{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}
        .hidden{display:none!important;}

        /* ── Responsive: Tablet (≤ 980px) ── */
        @media (max-width:980px) {
          .header{padding:0 1.5rem;height:auto;min-height:70px;flex-wrap:wrap;gap:.75rem;padding-top:.75rem;padding-bottom:.75rem;}
          .header-brand{gap:.75rem;}
          .brand-logo{height:38px;}
          .brand-title{font-size:1rem;}
          .header-actions{flex-wrap:wrap;gap:.5rem;justify-content:flex-end;}
          .stats-bar{padding:.75rem 1.5rem;gap:1.5rem;flex-wrap:wrap;}
          .toolbar{padding:.75rem 1.5rem;gap:.5rem;}
          .search-wrap{min-width:180px;max-width:100%;flex-basis:100%;}
          .content{padding:1.25rem 1.5rem;}
          .drawer{--drawer-w:380px;}
        }

        /* ── Responsive: Mobile (≤ 640px) ── */
        @media (max-width:640px) {
          .header{padding:.75rem 1rem;flex-direction:column;align-items:stretch;gap:.6rem;}
          .header-brand{justify-content:center;}
          .brand-logo{height:34px;}
          .brand-divider{height:30px;}
          .brand-title{font-size:.95rem;}
          .brand-sub{font-size:.6rem;}
          .header-actions{justify-content:center;gap:.4rem;flex-wrap:wrap;}
          .header-actions .btn,.header-actions .btn-circ{font-size:.75rem;padding:.45rem .7rem;}
          .stats-bar{padding:.6rem 1rem;gap:1rem;justify-content:center;}
          .stat-num{font-size:1.2rem;}
          .stat-label{font-size:.65rem;}
          .toolbar{padding:.6rem 1rem;flex-direction:column;align-items:stretch;gap:.5rem;}
          .search-wrap{max-width:100%;min-width:0;}
          .filter-group{width:100%;display:flex;}
          .filter-btn{flex:1;text-align:center;padding:.45rem .5rem;font-size:.75rem;}
          .filter-select{width:100%;}
          .content{padding:.75rem .75rem;}

          /* Table → Card layout on mobile */
          .table-scroll{overflow-x:visible;}
          table,thead,tbody,th,td,tr{display:block;}
          thead tr{position:absolute;top:-9999px;left:-9999px;}
          .book-row{border:1px solid var(--border);border-radius:var(--radius);margin-bottom:.6rem;padding:.75rem;background:var(--warm-white);display:flex;flex-direction:column;gap:.4rem;}
          .book-row:hover{background:var(--parchment);}
          td{padding:0;border:none;}
          .td-title{max-width:100%;min-width:0;}
          .td-author::before{content:"Author: ";font-size:.7rem;color:var(--ink-light);text-transform:uppercase;letter-spacing:.05em;}
          .td-year::before{content:"Year: ";font-size:.7rem;color:var(--ink-light);text-transform:uppercase;letter-spacing:.05em;}
          .td-dewey::before{content:"Dewey: ";font-size:.7rem;color:var(--ink-light);text-transform:uppercase;letter-spacing:.05em;}
          .td-status{margin-top:.25rem;}
          .td-actions{text-align:left;padding-right:0;margin-top:.35rem;}
          .action-btn{width:100%;justify-content:center;padding:.5rem;}
          .table-footer{flex-direction:column;text-align:center;gap:.25rem;padding:.6rem 1rem;}
          .expand-row td{padding:.5rem 0;}

          /* Modals */
          .modal-card,.modal-card-lg{width:95%;max-width:95%;}
          .modal-header{padding:1rem;}
          .modal-body{padding:1rem;}
          .modal-footer{padding:.75rem 1rem;}
          .isbn-search-row{flex-direction:column;}

          /* Drawer full-width on mobile */
          .drawer{--drawer-w:100vw;}
          .stat-cards{grid-template-columns:1fr 1fr;gap:.5rem;}
          .stat-card{padding:.65rem .75rem;}
          .stat-card-num{font-size:1.4rem;}

          /* Toasts */
          .toast{min-width:0;max-width:calc(100vw - 2rem);font-size:.82rem;}
        }

        /* ── Responsive: Small phones (≤ 380px) ── */
        @media (max-width:380px) {
          .header-actions .btn,.header-actions .btn-circ{font-size:.7rem;padding:.4rem .55rem;gap:.25rem;}
          .brand-logo{height:28px;}
          .brand-title{font-size:.85rem;}
          .stat-cards{grid-template-columns:1fr;}
        }
      `}</style>

      <div className="app-shell">
        <header className="header">
          <div className="header-brand">
            <img
              src="/WMUMC-Logo.png"
              alt="Wesley Monumental UMC"
              className="brand-logo"
            />
            <div className="brand-divider" />
            <div className="brand-text">
              <div className="brand-title">Wesley Monumental UMC</div>
              <div className="brand-sub">Church Library</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-circ" onClick={()=>setShowCirc(true)}><ClipboardIcon /> Circulation</button>
            <button className="btn btn-outline" onClick={()=>setShowLookup(true)}><PlusIcon /> Add Book</button>
            <button className="btn btn-outline" onClick={()=>exportToCSV(books)} disabled={books.length===0}><DownloadIcon /> Export CSV</button>
            <button className="btn btn-outline" onClick={loadBooks} disabled={loading}><RefreshIcon /> Refresh</button>
            <button className="btn btn-primary" onClick={()=>setShowUpload(true)}><UploadIcon /> Upload CSV</button>
          </div>
        </header>

        {hasFetched && (
          <div className="stats-bar">
            <div className="stat-item"><span className="stat-num">{stats.total}</span><span className="stat-label">Total Books</span></div>
            <div className="stat-divider"/>
            <div className="stat-item"><span className="stat-num" style={{color:"var(--sage)"}}>{stats.available}</span><span className="stat-label">Available</span></div>
            <div className="stat-divider"/>
            <div className="stat-item"><span className="stat-num" style={{color:"var(--accent)"}}>{stats.out}</span><span className="stat-label">Checked Out</span></div>
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
          {hasFilters && <button className="clear-btn" onClick={()=>{setSearch("");setFilterStatus("all");setFilterCategory("all");setFilterAudience("all");}}>Clear filters</button>}
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
                        <div style={{fontSize:".9rem"}}>{books.length===0?"Upload a CSV to add books.":"Try adjusting your filters."}</div>
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
                <span>Click ↓ on any row to see AI summary &amp; tags</span>
              </div>
            )}
          </div>
        </main>
      </div>

      <CirculationDrawer open={showCirc} onClose={()=>setShowCirc(false)} books={books} />
      {showLookup   && <ISBNLookupModal onSuccess={loadBooks} addToast={addToast} onClose={()=>setShowLookup(false)} existingBooks={books}/>}
      {checkoutBook && <CheckoutModal book={checkoutBook} onClose={()=>setCheckoutBook(null)} onSuccess={loadBooks} addToast={addToast}/>}
      {returnBook   && <ReturnModal   book={returnBook}   onClose={()=>setReturnBook(null)}   onSuccess={loadBooks} addToast={addToast}/>}
      {showUpload   && <UploadPanel   onSuccess={loadBooks} addToast={addToast} onClose={()=>setShowUpload(false)} existingBooks={books}/>}
      <Toast toasts={toasts} removeToast={removeToast}/>
    </>
  );
}