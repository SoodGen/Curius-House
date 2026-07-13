import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users, Globe, DollarSign, Plus, Search, Mail, CheckCircle2, Clock, Pencil,
  Trash2, X, Copy, Eye, LayoutDashboard, RefreshCw, Download,
  Image as ImageIcon, ArrowRight, Lock, ExternalLink, FileText, Smartphone, LogOut, Send, MapPin,
  Mic, Square, Activity, Calendar, Bell, StickyNote, UserPlus, Star, Share2, Briefcase
} from "lucide-react";
import { storage } from "./supabase";

const K_FOUNDERS = "cv-founders-v3";
const K_ADMIN = "cv-admin-v1";
const K_PLACES = "cv-places-v1";
const K_HISTORY = "cv-founders-history-v1";
const K_IMG = (id) => `cv-img-${id}`;
const K_NOTE = (id) => `cv-note-${id}`;
const K_INVESTORS = "cv-investors-v1";
const K_CONNECTS = "cv-connects-v1";
const K_NODES = "cv-nodes-v1";

// Directory of startup societies (source: ns.com/dashboard). r = rising / newly emerging.
const NETWORK_STATES = [
  { n: "Network School", t: "Startup Society", l: "Singapore–Johor SEZ", d: "Turning internet communities into physical societies.", r: false },
  { n: "Ârc", t: "Startup Society", l: "Network School", d: "Network School's first permanent Layer 2, building toward a charter city.", r: false },
  { n: "Zu-Grama", t: "Popup Village", l: "India", d: "An onchain village fusing coliving with deep tech.", r: true },
  { n: "Próspera", t: "SEZ", l: "Honduras", d: "A startup city on Roatán with its own legal code and governance.", r: false },
  { n: "Edge City", t: "Popup Village", l: "Global", d: "Month-long popup villages for frontier tech, science and culture.", r: false },
  { n: "Forma", t: "Popup Village", l: "Global · UK", d: "Solana economic zones, now building a permanent UK campus.", r: false },
  { n: "Crecimiento", t: "Startup Society", l: "Buenos Aires", d: "Making Argentina a global hub for tech innovation.", r: false },
  { n: "Frontier Tower", t: "Vertical Village", l: "San Francisco", d: "A 16-floor vertical village for frontier tech pioneers.", r: false },
  { n: "4Seas", t: "Startup Society", l: "Chiang Mai, Thailand", d: "A permanent node of the Zuzalu movement.", r: false },
  { n: "Akiya Collective", t: "Startup Society", l: "Japan", d: "Transforming Japan's vacant akiya homes into residencies.", r: false },
  { n: "Amagi Life", t: "Startup Society", l: "Thailand", d: "Regenerative villages with a contribution-driven economy.", r: true },
  { n: "ArkPad", t: "Construction", l: "Philippines", d: "Floating structures for human habitation on the water.", r: true },
  { n: "Bitcoin Learning Center", t: "Hub", l: "Chiang Mai, Thailand", d: "Asia's most active physical Bitcoin hub.", r: false },
  { n: "Cafe Cursor", t: "Popup", l: "Global", d: "Popup cafe takeovers where builders code together.", r: true },
  { n: "Ciudad Morazán", t: "Startup City", l: "Honduras", d: "Safe housing and modern amenities for blue-collar entrepreneurs.", r: false },
  { n: "Commons Hub", t: "Popup Village", l: "Austrian Alps", d: "A popup village for regenerative commons.", r: false },
  { n: "Culdesac", t: "Startup City", l: "Tempe, Arizona", d: "Walkable neighborhoods built for belonging.", r: false },
  { n: "Futura Camp (ZuBerlin)", t: "Popup Village", l: "Berlin", d: "Immersive coliving bridging technology and human connection.", r: false },
  { n: "Gelephu Mindfulness City", t: "Startup City", l: "Bhutan", d: "An emerging startup city and SEZ in Bhutan.", r: true },
  { n: "Hacker Residency Group", t: "Popup Village", l: "Da Nang, Vietnam", d: "A residency for ambitious indie hackers to lock in.", r: true },
  { n: "Infinita", t: "Startup Society", l: "Roatán, Honduras", d: "A network city focused on longevity and biotech.", r: false },
  { n: "Ipê City", t: "Popup Village", l: "Brazil · Global", d: "Techno-optimists building internet-native cities.", r: true },
  { n: "mtndao", t: "Popup Village", l: "Salt Lake City, Utah", d: "Month-long popups for Solana founders.", r: false },
  { n: "Noma Collective", t: "Popup Village", l: "Global", d: "A network society for digital nomads and remote builders.", r: false },
  { n: "Nomad", t: "Construction", l: "USA · Honduras", d: "Coliving villages from the future.", r: false },
  { n: "Proto-Town", t: "Startup City", l: "Lockhart, Texas", d: "A place to build hardware.", r: true },
  { n: "RNS.ID", t: "Digital ID", l: "Palau · Global", d: "Government-backed digital residency from the Republic of Palau.", r: false },
  { n: "ShanHaiWoo", t: "Popup Village", l: "Global", d: "Popup villages shipping real Ethereum and AI applications.", r: false },
  { n: "Starbase", t: "Startup City", l: "Texas", d: "Gateway to Mars.", r: false },
  { n: "The Mu", t: "Popup Village", l: "Global", d: "Facilitating popup villages worldwide.", r: false },
  { n: "Traditional Dream Factory", t: "Startup Society", l: "Portugal", d: "A regenerative coliving village.", r: false },
  { n: "Vibecamp", t: "Popup Village", l: "USA · Global", d: "A recurring IRL festival for internet communities.", r: false },
  { n: "Zanzalu", t: "Popup Village", l: "Zanzibar", d: "Builders from Africa and overseas living and collaborating.", r: false },
  { n: "ZuAfrique", t: "Popup Village", l: "Ghana · Kenya", d: "Helping African builders ship real-world projects.", r: true },
  { n: "Zuitzerland", t: "Popup Village", l: "Swiss Alps", d: "A Swiss village for d/acc and open-source acceleration.", r: false },
  { n: "ZuJapan", t: "Startup City", l: "Japan", d: "A permanent Zuzalu village, partnered with Akiya Collective.", r: true },
  { n: "ZuKaş", t: "Startup Society", l: "Kaş, Turkey", d: "Focused on Lycian democracy and participatory governance.", r: false },
  { n: "Zuzalu", t: "Startup Society", l: "Montenegro · Global", d: "The umbrella community of popup villages anchored to Ethereum.", r: false },
];
const NS_TYPES = ["All", "Startup Society", "Popup Village", "Startup City", "SEZ", "Other"];

const blobToDataUrl = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(blob);
});
const isoDate = (d) => d.toISOString().slice(0, 10);
const todayISO = () => isoDate(new Date());
// Build a human reminder for a founder's scheduled check-in date.
const checkInInfo = (f) => {
  if (!f.checkInDate) return null;
  const days = Math.round((new Date(f.checkInDate + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 86400000);
  const nice = new Date(f.checkInDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (days < 0) return { text: `Check-in overdue · ${Math.abs(days)}d`, due: true };
  if (days === 0) return { text: "Check-in due today", due: true };
  if (days === 1) return { text: `Check-in tomorrow · ${nice}`, due: false };
  return { text: `Check-in ${nice} · in ${days}d`, due: false };
};

const CATEGORIES = ["Consumer AI", "Consumer Web3", "Creator Economy", "Micro-earning", "Other"];
const STAGES = ["Idea", "MVP", "Pre-seed", "Seed", "Series A+"];
const FUNDING_STATUS = ["Not raised", "Raising now", "Funded"];
const INVESTOR_STATUS = ["In conversation", "Soft commitment", "Term sheet", "Invested", "Passed"];
const ROUND_TYPES = ["Angel", "Pre-seed", "Seed", "Series A", "Bridge", "Grant", "Other"];
const INSTRUMENTS = ["Equity", "SAFE", "SAFT", "Convertible note", "Other"];

const DEFAULT_PLACES = ["Network School (Forest City)", "Bali"];
const ADMIN_PASSCODE = "CuriousVentures2026";

const EMPTY_FOUNDER = {
  founderName: "", startupName: "", oneLiner: "", networkState: "",
  category: CATEGORIES[0], stage: STAGES[0], fundingStatus: FUNDING_STATUS[0],
  email: "", password: "", twitter: "", latestUpdate: "", metAt: "",
  website: "", appLink: "", docsLink: "", imageCount: 0,
  currentRoundType: "Seed", currentValuation: "", currentInstrument: "Equity",
  currentTarget: "", currentEquityPct: "", currentInvestors: [],
  previousRounds: [],
  adminNote: "", hasAudioNote: false, checkInDate: "", lastCheckIn: "", completedOn: ""
};

// Parse "20,000,000", "$1.5M"-style strings safely into numbers.
const num = (x) => {
  if (x === null || x === undefined || x === "") return 0;
  const str = String(x).trim().replace(/[$,\s]/g, "");
  const mult = /m$/i.test(str) ? 1000000 : /k$/i.test(str) ? 1000 : 1;
  const v = parseFloat(str.replace(/[mk]$/i, ""));
  return isNaN(v) ? 0 : v * mult;
};
// Safe date label: returns "" instead of "Invalid Date".
const safeDate = (d, opts) => {
  if (!d) return "";
  const dt = new Date(String(d).includes("T") ? d : d + "T00:00:00");
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString(undefined, opts || { month: "short", day: "numeric", year: "numeric" });
};
const fmtMoney = (n) => {
  const v = num(n);
  if (v >= 1000000) return `$${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return v > 0 ? `$${v}` : "$0";
};
// Admin-owned fields a founder's own save must never overwrite with a stale copy.
const PRESERVE_FROM_SERVER = (f) => ({
  adminNote: f.adminNote, hasAudioNote: f.hasAudioNote, checkInDate: f.checkInDate, lastCheckIn: f.lastCheckIn,
  pinned: f.pinned, approved: f.approved, approvedOn: f.approvedOn, requestedOn: f.requestedOn, addedOn: f.addedOn,
});
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
const daysAgo = (iso) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const normUrl = (u) => !u ? "" : (u.startsWith("http") ? u : `https://${u}`);
const cleanEmail = (e) => (e || "").trim().toLowerCase();

// Total raised across a founder's declared previous rounds (with legacy fallback)
const totalRaised = (f) => {
  const rounds = f.previousRounds || [];
  const sum = rounds.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  if (sum > 0) return sum;
  return Number(f.amountRaised) || 0; // legacy records
};
const hasRaised = (f) => totalRaised(f) > 0;
const latestValuation = (f) => {
  if (f.fundingStatus === "Raising now" && Number(f.currentValuation) > 0) return Number(f.currentValuation);
  const vals = (f.previousRounds || []).map(r => Number(r.valuation) || 0);
  return vals.length ? Math.max(...vals) : 0;
};
const investorTally = (f) => {
  const inv = f.currentInvestors || [];
  const t = { "Invested": 0, "Term sheet": 0, "Soft commitment": 0, "In conversation": 0, "Passed": 0 };
  inv.forEach(i => { if (t[i.status] !== undefined) t[i.status]++; });
  return t;
};
const investorSummary = (f) => {
  const t = investorTally(f);
  const parts = [];
  if (t["Invested"]) parts.push(`${t["Invested"]} invested`);
  if (t["Term sheet"]) parts.push(`${t["Term sheet"]} term sheet`);
  if (t["Soft commitment"]) parts.push(`${t["Soft commitment"]} soft`);
  if (t["In conversation"]) parts.push(`${t["In conversation"]} in talks`);
  return parts.join(" · ");
};
const committedAmount = (f) => (f.currentInvestors || [])
  .filter(i => i.status === "Invested" || i.status === "Term sheet" || i.status === "Soft commitment")
  .reduce((s, i) => s + (Number(i.amount) || 0), 0);
const remainingToRaise = (f) => {
  const t = Number(f.currentTarget) || 0;
  if (t <= 0) return null;
  return Math.max(0, t - committedAmount(f));
};

const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 700;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const r = Math.min(MAX / width, MAX / height);
        width = Math.round(width * r); height = Math.round(height * r);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = reject;
    img.src = e.target.result;
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const sGet = async (key, fallback) => {
  try { const r = await storage.get(key); return r && r.value ? JSON.parse(r.value) : fallback; }
  catch { return fallback; }
};
const sSet = async (key, val) => { try { await storage.set(key, JSON.stringify(val)); } catch (e) { console.error(e); } };

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA", fontFamily: "'Inter', system-ui, sans-serif", padding: 24 }}>
          <div style={{ maxWidth: 480, background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E63946", textTransform: "uppercase", letterSpacing: "0.1em" }}>Something broke</div>
            <p style={{ fontSize: 14, color: "#444", marginTop: 8 }}>Your data is safe in the database — this is only a display crash. Screenshot the message below and send it to get it fixed, then reload.</p>
            <pre style={{ fontSize: 11, background: "#f6f6f6", padding: 12, borderRadius: 8, marginTop: 10, whiteSpace: "pre-wrap", color: "#666" }}>{String(this.state.error && (this.state.error.message || this.state.error))}</pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: 12, padding: "10px 18px", borderRadius: 8, border: 0, background: "#0A0A0A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return <ErrorBoundary><CuriousDashboard /></ErrorBoundary>;
}

function CuriousDashboard() {
  const [view, setView] = useState("landing");
  const [founders, setFounders] = useState([]);
  const [adminCfg, setAdminCfg] = useState(undefined);
  const [places, setPlaces] = useState([]);
  const [newPlace, setNewPlace] = useState("");
  const [loading, setLoading] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [reqForm, setReqForm] = useState({ founderName: "", startupName: "", email: "", password: "", networkState: "", metAt: "", note: "" });
  const [reqError, setReqError] = useState("");
  const [me, setMe] = useState(null);
  const [myImages, setMyImages] = useState([]);
  const [myUpdate, setMyUpdate] = useState("");
  const [mySaved, setMySaved] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [confirmPost, setConfirmPost] = useState(false);

  const [passInput, setPassInput] = useState("");
  const [gateError, setGateError] = useState("");
  const [tab, setTab] = useState("dashboard");
  // Investors + connects
  const [investors, setInvestors] = useState([]);
  const [connects, setConnects] = useState([]);
  const [inv, setInv] = useState(null);
  const [invLoginEmail, setInvLoginEmail] = useState("");
  const [invLoginPass, setInvLoginPass] = useState("");
  const [invLoginError, setInvLoginError] = useState("");
  const [invReq, setInvReq] = useState({ name: "", firm: "", focus: "", checkSize: "", email: "", password: "" });
  const [invReqError, setInvReqError] = useState("");
  const [invSearch, setInvSearch] = useState("");
  // Public page
  const [nsSearch, setNsSearch] = useState("");
  const [nsType, setNsType] = useState("All");
  // Founders page filters
  const [fCat, setFCat] = useState("");
  const [fStage, setFStage] = useState("");
  const [fFund, setFFund] = useState("");
  const [fPlace, setFPlace] = useState("");
  const [fSort, setFSort] = useState("updated");
  const [fOrigin, setFOrigin] = useState("");
  // Network state nodes
  const [nodes, setNodes] = useState([]);
  const [node, setNode] = useState(null);
  const [nodeLoginEmail, setNodeLoginEmail] = useState("");
  const [nodeLoginPass, setNodeLoginPass] = useState("");
  const [nodeLoginError, setNodeLoginError] = useState("");
  const [nodeReq, setNodeReq] = useState({ stateName: "", contactName: "", email: "", password: "" });
  const [nodeReqError, setNodeReqError] = useState("");
  const [leadForm, setLeadForm] = useState({ founderName: "", email: "", password: "", startupName: "", oneLiner: "", metAt: "" });
  const [leadError, setLeadError] = useState("");
  const [leadSaved, setLeadSaved] = useState(false);
  // Invested / portfolio
  const [investPanel, setInvestPanel] = useState(null);
  const [investDraft, setInvestDraft] = useState(null);
  const [markDraft, setMarkDraft] = useState({});
  const [roundPanel, setRoundPanel] = useState(null);
  const [roundDraft, setRoundDraft] = useState({ roundName: "Seed", date: todayISO(), postMoney: "", roundSize: "", participated: false, followOnAmount: "", equityAfter: "" });
  const [search, setSearch] = useState("");
  const [adminEditingId, setAdminEditingId] = useState(null);
  const [addMode, setAddMode] = useState("full"); // full | invite

  const [form, setForm] = useState({ ...EMPTY_FOUNDER });
  const [formImages, setFormImages] = useState([]);
  const [imgError, setImgError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [updateDrafts, setUpdateDrafts] = useState({});
  const [expandedImages, setExpandedImages] = useState({});
  const [cardImages, setCardImages] = useState({});
  // Admin private notes + check-ins
  const [notePanel, setNotePanel] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});
  const [checkInDraft, setCheckInDraft] = useState({});
  const [noteSaved, setNoteSaved] = useState(null);
  const [audioCache, setAudioCache] = useState({});
  const [recordingFor, setRecordingFor] = useState(null);
  const [recError, setRecError] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [digestPeriod, setDigestPeriod] = useState(7);
  const [digestCopied, setDigestCopied] = useState(false);
  const [copied, setCopied] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    let [f, a, p, iv, cn, nd] = await Promise.all([sGet(K_FOUNDERS, []), sGet(K_ADMIN, null), sGet(K_PLACES, null), sGet(K_INVESTORS, []), sGet(K_CONNECTS, []), sGet(K_NODES, [])]);
    if (!a) { a = { passcode: ADMIN_PASSCODE, createdOn: new Date().toISOString() }; await sSet(K_ADMIN, a); }
    if (!p) { p = [...DEFAULT_PLACES]; await sSet(K_PLACES, p); }
    setFounders(f); setAdminCfg(a); setPlaces(p); setInvestors(Array.isArray(iv) ? iv : []); setConnects(Array.isArray(cn) ? cn : []); setNodes(Array.isArray(nd) ? nd : []); setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  // Re-fetch latest data from Supabase (so changes from other devices appear)
  const refetchData = async () => {
    const [f, p, iv, cn, nd] = await Promise.all([sGet(K_FOUNDERS, []), sGet(K_PLACES, []), sGet(K_INVESTORS, []), sGet(K_CONNECTS, []), sGet(K_NODES, [])]);
    setFounders(f);
    if (Array.isArray(p)) setPlaces(p);
    if (Array.isArray(iv)) setInvestors(iv);
    if (Array.isArray(cn)) setConnects(cn);
    if (Array.isArray(nd)) setNodes(nd);
  };

  // While in the admin dashboard, keep data fresh: on entry, on window focus, and on a light timer.
  useEffect(() => {
    if (view !== "admin" && view !== "investorHome") return;
    refetchData();
    const onFocus = () => refetchData();
    window.addEventListener("focus", onFocus);
    const iv = setInterval(refetchData, 15000);
    return () => { window.removeEventListener("focus", onFocus); clearInterval(iv); };
  }, [view]);

  // Preload founder images for admin cards
  useEffect(() => {
    if (view !== "admin" && view !== "investorHome") return;
    let cancelled = false;
    (async () => {
      const need = founders.filter(f => (f.imageCount > 0) && cardImages[f.id] === undefined);
      if (!need.length) return;
      const entries = await Promise.all(need.map(async f => [f.id, await sGet(K_IMG(f.id), [])]));
      if (cancelled) return;
      setCardImages(prev => { const n = { ...prev }; entries.forEach(([id, imgs]) => { n[id] = imgs; }); return n; });
    })();
    return () => { cancelled = true; };
  }, [view, founders]);
  const persistFounders = async (next) => { setFounders(next); await sSet(K_FOUNDERS, next); };
  // Keep a rolling set of the last 20 saves, so any bad write can be rolled back.
  const snapshotHistory = async (next) => {
    try {
      const hist = await sGet(K_HISTORY, []);
      const list = Array.isArray(hist) ? hist : [];
      const entry = { ts: new Date().toISOString(), count: next.length, founders: next };
      await sSet(K_HISTORY, [entry, ...list].slice(0, 20));
    } catch (e) { console.error("snapshot failed (non-fatal)", e); }
  };
  // Read-modify-write against the LATEST server data, so two devices saving at once don't overwrite each other.
  const mutateFounders = async (updater) => {
    const latest = await sGet(K_FOUNDERS, []);
    const next = updater(Array.isArray(latest) ? latest : []);
    setFounders(next);
    await sSet(K_FOUNDERS, next);
    await snapshotHistory(next);
    return next;
  };
  const persistPlaces = async (next) => { setPlaces(next); await sSet(K_PLACES, next); };
  // One-tap offline backup: downloads the current founders + places as a JSON file.
  const downloadBackup = async () => {
    try {
      const f = await sGet(K_FOUNDERS, []);
      const p = await sGet(K_PLACES, []);
      const payload = { exportedAt: new Date().toISOString(), founders: f, places: p };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `curious-house-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { console.error("backup failed", e); alert("Backup failed — check your connection and try again."); }
  };
  // Pin / track a startup we like (shows up on the Tracked page)
  const togglePin = (id) => node
    ? mutateFounders(prev => prev.map(x => x.id === id ? { ...x, nodeHighlight: x.nodeHighlight === node.stateName ? "" : node.stateName } : x))
    : mutateFounders(prev => prev.map(x => x.id === id ? { ...x, pinned: !x.pinned } : x));
  const isStarred = (f) => node ? f.nodeHighlight === node.stateName : !!f.pinned;
  // ---- Invested / portfolio ----
  const portfolioFounders = useMemo(() => founders.filter(f => f.invested && f.approved !== false)
    .sort((a, b) => new Date(b.investedOn || 0) - new Date(a.investedOn || 0)), [founders]);
  const fundStats = useMemo(() => {
    const deployed = portfolioFounders.reduce((sum, f) => sum + companyCost(f), 0);
    const value = portfolioFounders.reduce((sum, f) => sum + companyValue(f), 0);
    return { deployed, value, moic: deployed > 0 ? (value / deployed) : 0, count: portfolioFounders.length };
  }, [portfolioFounders]);
  const openInvest = (f) => {
    setInvestDraft({
      id: f.id,
      deal: f.deal || { amount: "", instrument: f.currentInstrument || "SAFE", valuation: f.currentValuation || "", valuationType: "Post-money cap", discount: "", ownershipPct: f.currentEquityPct || "", roundName: f.currentRoundType || "Pre-seed", coInvestors: (f.currentInvestors || []).filter(i => i.status === "Invested" || i.status === "Term sheet").map(i => i.name).join(", "), date: todayISO() },
      memo: f.memo || { why: "", thesisFit: "", risks: "", mustBeTrue: "", expectedOutcome: "" },
      docs: f.docs && f.docs.length ? f.docs : [{ label: "SAFE agreement", url: "", status: "Draft" }, { label: "Side letter", url: "", status: "Draft" }],
      checklist: f.checklist || { termSheet: false, docsSigned: false, wired: false, confirmed: false },
    });
    setInvestPanel(f.id);
  };
  const saveInvest = async () => {
    if (!investDraft) return;
    const d = investDraft;
    const now = new Date().toISOString();
    await mutateFounders(prev => prev.map(f => f.id === d.id
      ? { ...f, invested: true, investedOn: f.investedOn || now, deal: d.deal, memo: d.memo, docs: d.docs, checklist: d.checklist,
          currentMark: f.currentMark || d.deal.amount, fundingStatus: "Funded", lastUpdated: now,
          checkInDate: f.checkInDate || isoDate(new Date(Date.now() + 30 * 86400000)) }
      : f));
    setInvestPanel(null); setInvestDraft(null);
  };
  const removeFromPortfolio = async (id) => {
    await mutateFounders(prev => prev.map(f => f.id === id ? { ...f, invested: false } : f));
  };
  const saveMark = async (id) => {
    const v = markDraft[id];
    if (v === undefined) return;
    await mutateFounders(prev => prev.map(f => f.id === id ? { ...f, currentMark: v } : f));
    setMarkDraft(d => { const n = { ...d }; delete n[id]; return n; });
  };
  // Position math: cost = initial + follow-ons; value = equity after latest round x its post-money.
  const companyCost = (f) => num(f.deal?.amount) + (f.newRounds || []).reduce((sum, r) => sum + num(r.followOnAmount), 0);
  const companyEquity = (f) => {
    const rs = f.newRounds || [];
    return rs.length ? num(rs[rs.length - 1].equityAfter) : num(f.deal?.ownershipPct);
  };
  const companyValue = (f) => {
    const rs = f.newRounds || [];
    if (rs.length) {
      const last = rs[rs.length - 1];
      const eq = num(last.equityAfter);
      const val = num(last.postMoney);
      if (eq && val) return (eq / 100) * val;
    }
    return num(f.currentMark) || num(f.deal?.amount);
  };
  const openRound = (f) => {
    setRoundDraft({ roundName: "Seed", date: todayISO(), postMoney: "", roundSize: "", participated: false, followOnAmount: "", equityAfter: "" });
    setRoundPanel(f.id);
  };
  const suggestEquity = (f) => {
    const prevEq = companyEquity(f);
    const pm = num(roundDraft.postMoney);
    const rs = num(roundDraft.roundSize);
    if (!pm) return;
    let eq = prevEq * (rs ? (1 - rs / pm) : 1);
    if (roundDraft.participated && num(roundDraft.followOnAmount)) eq += (num(roundDraft.followOnAmount) / pm) * 100;
    setRoundDraft(d => ({ ...d, equityAfter: eq.toFixed(2) }));
  };
  const saveRound = async (fid) => {
    if (!roundDraft.postMoney || !roundDraft.equityAfter) return;
    const entry = { ...roundDraft };
    await mutateFounders(prev => prev.map(f => f.id === fid ? { ...f, newRounds: [...(f.newRounds || []), entry].sort((a, b) => new Date(a.date) - new Date(b.date)) } : f));
    setRoundPanel(null);
  };
  const deleteRound = async (fid, idx) => {
    await mutateFounders(prev => prev.map(f => f.id === fid ? { ...f, newRounds: (f.newRounds || []).filter((_, i) => i !== idx) } : f));
  };
  // Shareable startup card
  const [shareFounder, setShareFounder] = useState(null);
  const [shareImg, setShareImg] = useState(null);
  const cardRef = useRef(null);
  const openShare = async (f) => {
    setShareFounder(f); setShareImg(null);
    try { const imgs = await sGet(K_IMG(f.id), []); if (Array.isArray(imgs) && imgs[0]) setShareImg(imgs[0]); } catch {}
  };
  const renderCardCanvas = async () => {
    if (!window.html2canvas || !cardRef.current) { alert("Card tool still loading — try again in a second."); return null; }
    return await window.html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true, logging: false });
  };
  const downloadCard = async () => {
    const canvas = await renderCardCanvas(); if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${(shareFounder.startupName || shareFounder.founderName || "startup").replace(/[^a-z0-9]/gi, "-").toLowerCase()}-curious-ventures.png`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  const shareCard = async () => {
    const canvas = await renderCardCanvas(); if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "startup-card.png", { type: "image/png" });
      const data = { files: [file], title: shareFounder.startupName || shareFounder.founderName, text: `${shareFounder.startupName || shareFounder.founderName} — via Curious Ventures` };
      if (navigator.canShare && navigator.canShare(data)) {
        try { await navigator.share(data); } catch {}
      } else { downloadCard(); }
    }, "image/png");
  };
  // Node sessions see only their state's slice; their "star" is a highlight surfaced to the main admin.
  const inNodeScope = (f) => !node || f.networkState === node.stateName || f.origin === node.stateName;
  const pinnedFounders = useMemo(() => node
    ? founders.filter(f => f.approved !== false && f.nodeHighlight === node.stateName)
    : founders.filter(f => f.pinned), [founders, node]);
  const nodeHighlighted = useMemo(() => founders.filter(f => f.approved !== false && f.nodeHighlight), [founders]);

  const addPlace = async () => {
    const name = newPlace.trim();
    if (!name) return;
    if (places.some(p => p.toLowerCase() === name.toLowerCase())) { setNewPlace(""); return; }
    await persistPlaces([...places, name]);
    setNewPlace("");
  };
  const removePlace = async (name) => { await persistPlaces(places.filter(p => p !== name)); };
  const placeUsage = (name) => founders.filter(f => f.networkState === name).length;

  const activeFounders = useMemo(() => founders.filter(f => f.approved !== false && inNodeScope(f)), [founders, node]);
  const pendingRequests = useMemo(() => founders.filter(f => f.approved === false && inNodeScope(f)).sort((a, b) => new Date(b.addedOn) - new Date(a.addedOn)), [founders, node]);

  const stats = useMemo(() => {
    const total = activeFounders.length;
    const funded = activeFounders.filter(hasRaised);
    const raising = activeFounders.filter(f => f.fundingStatus === "Raising now");
    const totalRaisedAll = funded.reduce((s, f) => s + totalRaised(f), 0);
    const totalTarget = raising.reduce((s, f) => s + (Number(f.currentTarget) || 0), 0);
    const totalCommitted = raising.reduce((s, f) => s + committedAmount(f), 0);
    const complete = activeFounders.filter(f => f.profileComplete !== false);
    const states = {}; complete.forEach(f => { states[f.networkState] = states[f.networkState] || { count: 0, raised: 0 }; states[f.networkState].count++; if (hasRaised(f)) states[f.networkState].raised++; });
    const cats = {}; complete.forEach(f => { cats[f.category] = (cats[f.category] || 0) + 1; });
    const stageCounts = {}; complete.forEach(f => { stageCounts[f.stage] = (stageCounts[f.stage] || 0) + 1; });
    // founders per month (last 6)
    const months = [];
    const base = new Date(); base.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-GB", { month: "short" });
      const ym = `${d.getFullYear()}-${d.getMonth()}`;
      const c = complete.filter(f => { const fd = new Date(f.completedOn || f.addedOn); return `${fd.getFullYear()}-${fd.getMonth()}` === ym; }).length;
      months.push({ key, c });
    }
    return { total, funded, raising, totalRaisedAll, totalTarget, totalCommitted, states, cats, stageCounts, months };
  }, [activeFounders]);

  const awaitingOnboarding = useMemo(() => activeFounders.filter(f => f.profileComplete === false).sort((a, b) => new Date(a.addedOn) - new Date(b.addedOn)), [activeFounders]);
  const checkInsDue = useMemo(() => activeFounders.filter(f => f.checkInDate && f.checkInDate <= todayISO()).sort((a, b) => a.checkInDate.localeCompare(b.checkInDate)), [activeFounders]);

  const activityFeed = useMemo(() => {
    const events = [];
    activeFounders.forEach(f => {
      if (f.profileComplete !== false) events.push({ type: "joined", id: f.id, founder: f, date: f.completedOn || f.addedOn });
      (f.updates || []).forEach(u => events.push({ type: "update", id: f.id, founder: f, date: u.date, text: u.text, by: u.by }));
    });
    return events.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 60);
  }, [activeFounders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = activeFounders
      .filter(f => !q || [f.startupName, f.founderName, f.networkState, f.category, f.email].some(v => (v || "").toLowerCase().includes(q)))
      .filter(f => !fCat || f.category === fCat)
      .filter(f => !fStage || f.stage === fStage)
      .filter(f => !fFund || f.fundingStatus === fFund)
      .filter(f => !fPlace || f.networkState === fPlace)
      .filter(f => !fOrigin || (fOrigin === "__direct" ? !f.origin : fOrigin === "__highlighted" ? !!f.nodeHighlight : f.origin === fOrigin));
    const by = {
      updated: (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated),
      newest: (a, b) => new Date(b.addedOn) - new Date(a.addedOn),
      raising: (a, b) => (b.fundingStatus === "Raising now") - (a.fundingStatus === "Raising now") || new Date(b.lastUpdated) - new Date(a.lastUpdated),
      az: (a, b) => (a.startupName || a.founderName || "").localeCompare(b.startupName || b.founderName || ""),
    };
    return list.sort(by[fSort] || by.updated);
  }, [activeFounders, search, fCat, fStage, fFund, fPlace, fSort, fOrigin]);
  const filtersOn = !!(fCat || fStage || fFund || fPlace || fOrigin);
  const clearFilters = () => { setFCat(""); setFStage(""); setFFund(""); setFPlace(""); setFOrigin(""); };

  const founderLogin = async () => {
    const email = cleanEmail(loginEmail);
    // Pull the latest data so a just-approved founder can log in without refreshing.
    const latest = await sGet(K_FOUNDERS, []);
    const list = Array.isArray(latest) ? latest : [];
    setFounders(list);
    const f = list.find(x => cleanEmail(x.email) === email);
    if (!f || !f.password || f.password !== loginPass) { setLoginError("Email or password not recognized. Check with the Curious Ventures team."); return; }
    if (f.approved === false) { setLoginError("Your request is still pending approval. We'll be in touch once you're in."); return; }
    setLoginError("");
    setMe(f);
    const imgs = await sGet(K_IMG(f.id), []);
    setMyImages(imgs);
    setMyUpdate("");
    setConfirmPost(false);
    setEditingProfile(false);
    if (f.profileComplete === false) {
      setForm({ ...EMPTY_FOUNDER, ...f });
      setFormImages(imgs);
      setFormError("");
      setView("founderOnboard");
    } else {
      setView("founderHome");
    }
  };

  const submitRequest = async () => {
    setReqError("");
    if (!reqForm.founderName.trim()) { setReqError("Please add your name."); return; }
    if (!cleanEmail(reqForm.email)) { setReqError("A valid email is required."); return; }
    if (reqForm.password.trim().length < 4) { setReqError("Choose a password of at least 4 characters."); return; }
    if (!reqForm.networkState) { setReqError("Please pick where we met."); return; }
    if (founders.find(f => cleanEmail(f.email) === cleanEmail(reqForm.email))) { setReqError("That email already has an account or a pending request."); return; }
    const now = new Date().toISOString();
    const entry = {
      ...EMPTY_FOUNDER, ...reqForm, email: cleanEmail(reqForm.email),
      id: uid(), addedOn: now, lastUpdated: now,
      approved: false, profileComplete: false, requestedOn: now, updates: []
    };
    await mutateFounders(prev => [entry, ...prev]);
    setReqForm({ founderName: "", startupName: "", email: "", password: "", networkState: "", metAt: "", note: "" });
    setView("requestSent");
  };

  const approveRequest = async (id) => {
    const now = new Date().toISOString();
    await mutateFounders(prev => prev.map(f => f.id === id ? { ...f, approved: true, approvedOn: now } : f));
  };
  const declineRequest = async (id) => {
    await mutateFounders(prev => prev.filter(f => f.id !== id));
    setConfirmDelete(null);
  };
  const founderLogout = () => { setMe(null); setLoginEmail(""); setLoginPass(""); setForm({ ...EMPTY_FOUNDER }); setFormImages([]); setEditingProfile(false); setConfirmPost(false); setView("landing"); };

  const submitOnboarding = async () => {
    setFormError("");
    if (!form.founderName.trim() || !form.startupName.trim()) { setFormError("Please add your name and startup name."); return; }
    if (!form.networkState) { setFormError("Please pick where we met."); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const next = await mutateFounders(prev => prev.map(f => f.id === me.id
      ? { ...f, ...form, ...PRESERVE_FROM_SERVER(f), email: f.email, password: f.password, profileComplete: true,
          completedOn: f.completedOn || now, imageCount: formImages.length, lastUpdated: now,
          updates: form.latestUpdate.trim() && form.latestUpdate !== f.latestUpdate
            ? [{ text: form.latestUpdate.trim(), date: now, by: "founder" }, ...(f.updates || [])]
            : (f.updates || []) }
      : f));
    if (formImages.length > 0) await sSet(K_IMG(me.id), formImages);
    const mine = next.find(f => f.id === me.id); if (mine) setMe(mine);
    setMyImages(formImages); setSaving(false); setView("founderHome");
  };

  const postMyUpdate = async () => {
    const text = myUpdate.trim();
    if (!text || !me) return;
    const now = new Date().toISOString();
    const next = await mutateFounders(prev => prev.map(f => f.id === me.id
      ? { ...f, latestUpdate: text, lastUpdated: now, updates: [{ text, date: now, by: "founder" }, ...(f.updates || [])] }
      : f));
    const mine = next.find(f => f.id === me.id); if (mine) setMe(mine);
    setMyUpdate(""); setConfirmPost(false); setMySaved(true); setTimeout(() => setMySaved(false), 2500);
  };

  const startEditProfile = () => { setForm({ ...EMPTY_FOUNDER, ...me }); setFormImages(myImages); setImgError(""); setFormError(""); setEditingProfile(true); };
  const cancelEditProfile = () => { setEditingProfile(false); setFormError(""); };
  const saveMyProfile = async () => {
    setFormError("");
    if (!form.founderName.trim() || !form.startupName.trim()) { setFormError("Name and startup name are required."); return; }
    if (!form.networkState) { setFormError("Please pick where we met."); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const next = await mutateFounders(prev => prev.map(f => f.id === me.id
      ? { ...f, ...form, ...PRESERVE_FROM_SERVER(f), email: f.email, password: f.password, profileComplete: true, imageCount: formImages.length, lastUpdated: now }
      : f));
    if (formImages.length > 0) await sSet(K_IMG(me.id), formImages);
    else { try { await storage.delete(K_IMG(me.id), true); } catch {} }
    const mine = next.find(f => f.id === me.id); if (mine) setMe(mine);
    setMyImages(formImages); setSaving(false); setEditingProfile(false);
  };

  const handleImageFiles = async (fileList) => {
    setImgError("");
    const files = Array.from(fileList).slice(0, 3 - formImages.length);
    if (files.length === 0) { setImgError("Maximum 3 images."); return; }
    try { const c = await Promise.all(files.map(compressImage)); setFormImages(p => [...p, ...c].slice(0, 3)); }
    catch { setImgError("Couldn't process that image — try a JPG or PNG."); }
  };

  const saveFounder = async () => {
    setFormError("");
    const inviteOnly = addMode === "invite" && !adminEditingId;
    if (!cleanEmail(form.email)) { setFormError("Email is required — it's their login."); return; }
    if (!form.password.trim()) { setFormError("Set a password so they can log in."); return; }
    if (!inviteOnly && (!form.founderName.trim() || !form.startupName.trim())) { setFormError("Founder name and startup name are required."); return; }
    if (!inviteOnly && !form.networkState) { setFormError("Pick where you met them (or add the place in the Places tab)."); return; }
    const dupe = founders.find(f => cleanEmail(f.email) === cleanEmail(form.email) && f.id !== adminEditingId);
    if (dupe) { setFormError("Another founder already uses that email."); return; }

    setSaving(true);
    const now = new Date().toISOString();
    let id = adminEditingId;
    if (adminEditingId) {
      await mutateFounders(prev => prev.map(f => f.id === adminEditingId
        ? { ...f, ...form, email: cleanEmail(form.email), imageCount: formImages.length, lastUpdated: now,
            updates: form.latestUpdate.trim() && form.latestUpdate !== f.latestUpdate
              ? [{ text: form.latestUpdate.trim(), date: now, by: "admin" }, ...(f.updates || [])] : f.updates }
        : f));
    } else {
      id = uid();
      const entry = { ...form, email: cleanEmail(form.email), id, addedOn: now, lastUpdated: now,
        profileComplete: !inviteOnly, completedOn: inviteOnly ? "" : now,
        imageCount: formImages.length,
        updates: (!inviteOnly && form.latestUpdate.trim()) ? [{ text: form.latestUpdate.trim(), date: now, by: "admin" }] : [] };
      if (node) { entry.networkState = node.stateName; entry.origin = node.stateName; entry.originNodeId = node.id; }
      await mutateFounders(prev => [entry, ...prev]);
    }
    if (formImages.length > 0) await sSet(K_IMG(id), formImages);
    setCardImages(prev => ({ ...prev, [id]: formImages }));
    setSaving(false);
    setForm({ ...EMPTY_FOUNDER }); setFormImages([]); setAdminEditingId(null); setAddMode("full"); setTab("founders");
  };

  const adminLogin = () => {
    if (passInput === ADMIN_PASSCODE) { setView("admin"); setPassInput(""); setGateError(""); }
    else setGateError("Wrong passcode.");
  };
  const copyText = async (text, mark) => { try { await navigator.clipboard.writeText(text); setCopied(mark); setTimeout(() => setCopied(""), 1800); } catch {} };
  const goToFounder = (f) => { setSearch(f.startupName || f.founderName || ""); setTab("founders"); };

  // Open a pre-filled email (BCC, so founders don't see each other) to a group of founders.
  const emailGroup = (list, kind) => {
    const emails = (list || []).filter(f => f.email).map(f => f.email);
    if (!emails.length) { alert("No founder emails to send to."); return; }
    const subject = encodeURIComponent(
      kind === "nudge" ? "You're approved — finish your Curious Ventures profile"
                       : "Your Curious Ventures founder profile"
    );
    const body = encodeURIComponent(
      kind === "nudge"
        ? "Hi,\n\nYou're approved on the Curious Ventures founder tracker. Log in at house.curiousventures.xyz with the email and password you chose, then add your startup details. You can post updates anytime after.\n\nThe updates you post are what I share with the LPs and investors in my network.\n\n- Sood"
        : "Hi,\n\nQuick note from Curious Ventures. Log in at house.curiousventures.xyz to keep your startup details current and post any recent milestones - that's what I pass along to the LPs and investors in my network.\n\n- Sood"
    );
    openMail(`mailto:?bcc=${emails.join(",")}&subject=${subject}&body=${body}`);
  };

  // ---- Admin private notes & check-ins ----
  const openNote = async (f) => {
    if (notePanel === f.id) { setNotePanel(null); return; }
    setNotePanel(f.id); setRecError("");
    setNoteDraft(d => ({ ...d, [f.id]: f.adminNote || "" }));
    setCheckInDraft(d => ({ ...d, [f.id]: f.checkInDate || "" }));
    if (f.hasAudioNote && audioCache[f.id] === undefined) {
      const a = await sGet(K_NOTE(f.id), null);
      if (a) setAudioCache(p => ({ ...p, [f.id]: a }));
    }

  };
  const saveNote = async (id) => {
    await mutateFounders(prev => prev.map(f => f.id === id
      ? { ...f, adminNote: noteDraft[id] || "", checkInDate: checkInDraft[id] || "" } : f));
    setNoteSaved(id); setTimeout(() => setNoteSaved(null), 2000);
  };
  const markCheckedIn = async (id) => {
    const now = new Date().toISOString();
    await mutateFounders(prev => prev.map(f => f.id === id ? { ...f, lastCheckIn: now, checkInDate: "" } : f));
    setCheckInDraft(d => ({ ...d, [id]: "" }));
  };
  const startRecording = async (id) => {
    setRecError("");
    if (!navigator.mediaDevices || !window.MediaRecorder) { setRecError("Voice notes aren't supported in this view — use a written note."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const dataUrl = await blobToDataUrl(blob);
        await sSet(K_NOTE(id), dataUrl);
        setAudioCache(p => ({ ...p, [id]: dataUrl }));
        await mutateFounders(prev => prev.map(f => f.id === id ? { ...f, hasAudioNote: true } : f));
        stream.getTracks().forEach(t => t.stop());
      };
      recorderRef.current = mr; mr.start(); setRecordingFor(id);
    } catch (e) {
      setRecError("Couldn't access the microphone here. You can still type a written note.");
    }
  };
  const stopRecording = () => {
    if (recorderRef.current && recordingFor) { try { recorderRef.current.stop(); } catch {} setRecordingFor(null); }
  };
  const deleteAudio = async (id) => {
    try { await storage.delete(K_NOTE(id), true); } catch {}
    setAudioCache(p => { const n = { ...p }; delete n[id]; return n; });
    await mutateFounders(prev => prev.map(f => f.id === id ? { ...f, hasAudioNote: false } : f));
  };
  const checkInEmail = (f) => {
    const subj = encodeURIComponent(`Checking in — ${f.startupName || "your startup"}`);
    const body = encodeURIComponent(`Hi ${(f.founderName || "there").split(" ")[0]},\n\nWanted to check in and see how things are going with ${f.startupName || "the startup"}. Any updates since we last spoke?\n\nBest,\nSood`);
    return `mailto:${f.email}?subject=${subj}&body=${body}`;
  };
  // Open mail drafts and external links in a new tab/window
  const openMail = (url) => { try { window.open(url, "_blank", "noopener"); } catch { window.location.href = url; } };
  // ---- Investors ----
  const mutateInvestors = async (updater) => {
    const latest = await sGet(K_INVESTORS, []);
    const next = updater(Array.isArray(latest) ? latest : []);
    setInvestors(next);
    await sSet(K_INVESTORS, next);
    return next;
  };
  const mutateConnects = async (updater) => {
    const latest = await sGet(K_CONNECTS, []);
    const next = updater(Array.isArray(latest) ? latest : []);
    setConnects(next);
    await sSet(K_CONNECTS, next);
    return next;
  };
  const pendingInvestors = useMemo(() => investors.filter(i => i.approved === false).sort((a, b) => new Date(b.requestedOn) - new Date(a.requestedOn)), [investors]);
  const activeInvestors = useMemo(() => investors.filter(i => i.approved !== false), [investors]);
  const submitInvestorRequest = async () => {
    const email = cleanEmail(invReq.email);
    if (!invReq.name.trim()) { setInvReqError("Please add your name."); return; }
    if (!email || !email.includes("@")) { setInvReqError("Please add a valid email."); return; }
    if (!invReq.password || invReq.password.length < 4) { setInvReqError("Pick a password (4+ characters)."); return; }
    const latest = await sGet(K_INVESTORS, []);
    if ((Array.isArray(latest) ? latest : []).some(i => cleanEmail(i.email) === email)) { setInvReqError("That email already has access or a pending request."); return; }
    const entry = { ...invReq, email, id: uid(), approved: false, requestedOn: new Date().toISOString() };
    await mutateInvestors(prev => [entry, ...prev]);
    setInvReq({ name: "", firm: "", focus: "", checkSize: "", email: "", password: "" });
    setInvReqError("");
    setView("investorRequestSent");
  };
  const approveInvestor = async (id) => { await mutateInvestors(prev => prev.map(i => i.id === id ? { ...i, approved: true, approvedOn: new Date().toISOString() } : i)); };
  const declineInvestor = async (id) => { await mutateInvestors(prev => prev.filter(i => i.id !== id)); };
  const investorLogin = async () => {
    const email = cleanEmail(invLoginEmail);
    const latest = await sGet(K_INVESTORS, []);
    const list = Array.isArray(latest) ? latest : [];
    setInvestors(list);
    const i = list.find(x => cleanEmail(x.email) === email);
    if (!i || !i.password || i.password !== invLoginPass) { setInvLoginError("Email or password not recognized. Check with the Curious Ventures team."); return; }
    if (i.approved === false) { setInvLoginError("Your request is still pending approval. We'll be in touch once you're in."); return; }
    setInvLoginError("");
    setInv(i);
    await refetchData();
    setView("investorHome");
  };
  const requestConnect = async (f) => {
    if (!inv) return;
    await mutateConnects(prev => prev.some(c => c.investorId === inv.id && c.founderId === f.id) ? prev
      : [{ id: uid(), investorId: inv.id, investorName: inv.name, investorFirm: inv.firm || "", founderId: f.id, startupName: f.startupName || f.founderName || "Startup", date: new Date().toISOString() }, ...prev]);
  };
  const hasRequestedConnect = (fid) => inv && connects.some(c => c.investorId === inv.id && c.founderId === fid);
  const removeConnect = async (id) => { await mutateConnects(prev => prev.filter(c => c.id !== id)); };
  const investorApprovalMsg = (i) => `Hi ${(i.name || "there").split(" ")[0]},\n\nYou're approved on Curious House — the live deal flow from Curious Ventures' network state sourcing.\n\nLog in at house.curiousventures.xyz with the email and password you chose. You'll see every startup in our current flow, including who's raising right now. Tap "Request intro" on anything interesting and we'll connect you directly.\n\n— Curious Ventures`;
  // ---- Network state nodes ----
  const mutateNodes = async (updater) => {
    const latest = await sGet(K_NODES, []);
    const next = updater(Array.isArray(latest) ? latest : []);
    setNodes(next);
    await sSet(K_NODES, next);
    return next;
  };
  const pendingNodes = useMemo(() => nodes.filter(n => n.approved === false).sort((a, b) => new Date(b.requestedOn) - new Date(a.requestedOn)), [nodes]);
  const activeNodes = useMemo(() => nodes.filter(n => n.approved !== false), [nodes]);
  const nodeOriginCount = (stateName) => founders.filter(f => f.origin === stateName).length;
  const submitNodeRequest = async () => {
    const email = cleanEmail(nodeReq.email);
    if (!nodeReq.stateName.trim()) { setNodeReqError("Please add your network state or community name."); return; }
    if (!nodeReq.contactName.trim()) { setNodeReqError("Please add a contact person."); return; }
    if (!email || !email.includes("@")) { setNodeReqError("Please add a valid email."); return; }
    if (!nodeReq.password || nodeReq.password.length < 4) { setNodeReqError("Pick a password (4+ characters)."); return; }
    const latest = await sGet(K_NODES, []);
    if ((Array.isArray(latest) ? latest : []).some(n => cleanEmail(n.email) === email)) { setNodeReqError("That email already has access or a pending request."); return; }
    const entry = { ...nodeReq, stateName: nodeReq.stateName.trim(), email, id: uid(), approved: false, requestedOn: new Date().toISOString() };
    await mutateNodes(prev => [entry, ...prev]);
    setNodeReq({ stateName: "", contactName: "", email: "", password: "" });
    setNodeReqError("");
    setView("nodeRequestSent");
  };
  const approveNode = async (id) => {
    const nd = nodes.find(n => n.id === id);
    await mutateNodes(prev => prev.map(n => n.id === id ? { ...n, approved: true, approvedOn: new Date().toISOString() } : n));
    // Make sure the state exists as a place so founder requests can route to it.
    if (nd && nd.stateName && !places.includes(nd.stateName)) await persistPlaces([...places, nd.stateName]);
  };
  const declineNode = async (id) => { await mutateNodes(prev => prev.filter(n => n.id !== id)); };
  const nodeLogin = async () => {
    const email = cleanEmail(nodeLoginEmail);
    const latest = await sGet(K_NODES, []);
    const list = Array.isArray(latest) ? latest : [];
    setNodes(list);
    const n = list.find(x => cleanEmail(x.email) === email);
    if (!n || !n.password || n.password !== nodeLoginPass) { setNodeLoginError("Email or password not recognized. Check with the Curious Ventures team."); return; }
    if (n.approved === false) { setNodeLoginError("Your request is still pending approval. We'll be in touch once you're in."); return; }
    setNodeLoginError("");
    setNode(n);
    await refetchData();
    setTab("dashboard");
    setView("admin");
  };
  const nodeAddLead = async () => {
    if (!node) return;
    const email = cleanEmail(leadForm.email);
    if (!leadForm.founderName.trim()) { setLeadError("Please add the founder's name."); return; }
    if (!email || !email.includes("@")) { setLeadError("Please add a valid founder email."); return; }
    if (!leadForm.password || leadForm.password.length < 4) { setLeadError("Set a starting password (4+ characters) — the founder logs in with it."); return; }
    const latest = await sGet(K_FOUNDERS, []);
    if ((Array.isArray(latest) ? latest : []).some(f => cleanEmail(f.email) === email)) { setLeadError("A founder with that email is already in the system."); return; }
    const now = new Date().toISOString();
    const entry = {
      id: uid(), founderName: leadForm.founderName.trim(), startupName: leadForm.startupName.trim(), oneLiner: leadForm.oneLiner.trim(),
      email, password: leadForm.password, networkState: node.stateName, metAt: leadForm.metAt.trim() || node.stateName,
      origin: node.stateName, originNodeId: node.id,
      approved: true, profileComplete: false, addedOn: now, lastUpdated: now, updates: [], currentInvestors: [], previousRounds: [],
    };
    await mutateFounders(prev => [entry, ...prev]);
    setLeadForm({ founderName: "", email: "", password: "", startupName: "", oneLiner: "", metAt: "" });
    setLeadError("");
    setLeadSaved(true); setTimeout(() => setLeadSaved(false), 2500);
  };
  const nodePipeline = useMemo(() => !node ? [] : founders
    .filter(f => f.approved !== false)
    .filter(f => f.origin === node.stateName || f.networkState === node.stateName)
    .sort((a, b) => new Date(b.addedOn) - new Date(a.addedOn)), [founders, node]);
  const nodePendingReqs = useMemo(() => !node ? [] : founders
    .filter(f => f.approved === false && f.networkState === node.stateName)
    .sort((a, b) => new Date(b.addedOn) - new Date(a.addedOn)), [founders, node]);
  const nodeApprovalMsg = (n) => `Hi ${(n.contactName || "there").split(" ")[0]},\n\n${n.stateName} is live as a trusted node on Curious House.\n\nLog in at house.curiousventures.xyz — tap "Network State Login" and use the email and password you chose. From your console you can add founder leads from your community, approve founders who request access via ${n.stateName}, and track your pipeline.\n\nEvery deal you originate carries your state's name through to our investor network.\n\n— Curious Ventures`;
  const leadInviteMsg = (f) => `Hi ${(f.founderName || "there").split(" ")[0]},\n\nYou've been added to Curious House — Curious Ventures' founder network — via ${f.origin || f.networkState}.\n\nLog in at house.curiousventures.xyz with:\nEmail: ${f.email}\nPassword: ${f.password}\n\nTakes 2 minutes to complete your profile — your progress goes in front of the LPs and investors in the network.\n\n— Curious Ventures`;

  // Investor deal board list (approved founders with a completed profile)
  const dealFlow = useMemo(() => {
    const q = invSearch.toLowerCase();
    return activeFounders
      .filter(f => f.profileComplete !== false)
      .filter(f => f.fundingStatus === "Raising now" && !f.invested) // investors see available deals only
      .filter(f => !q || [f.startupName, f.founderName, f.networkState, f.category, f.oneLiner].some(v => (v || "").toLowerCase().includes(q)))
      .filter(f => !fCat || f.category === fCat)
      .filter(f => !fStage || f.stage === fStage)
      .filter(f => !fPlace || f.networkState === fPlace)
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }, [activeFounders, invSearch, fCat, fStage, fPlace]);
  // Live stats for the public page
  const pubStats = useMemo(() => ({
    met: activeFounders.length,
    states: new Set(activeFounders.map(f => f.networkState).filter(Boolean)).size || places.length,
    raising: activeFounders.filter(f => f.fundingStatus === "Raising now").length,
    raised: activeFounders.reduce((sum, f) => sum + (totalRaised(f) || 0), 0),
  }), [activeFounders, places]);
  const removeFounder = async (id) => {
    await mutateFounders(prev => prev.filter(f => f.id !== id));
    try { await storage.delete(K_IMG(id), true); } catch {}
    setConfirmDelete(null);
  };
  const addUpdate = async (id) => {
    const text = (updateDrafts[id] || "").trim(); if (!text) return;
    const now = new Date().toISOString();
    await mutateFounders(prev => prev.map(f => f.id === id
      ? { ...f, updates: [{ text, date: now, by: "admin" }, ...(f.updates || [])], latestUpdate: text, lastUpdated: now } : f));
    setUpdateDrafts(d => ({ ...d, [id]: "" }));
  };
  const toggleImages = async (f) => {
    if (expandedImages[f.id]) { setExpandedImages(p => { const n = { ...p }; delete n[f.id]; return n; }); return; }
    setExpandedImages(p => ({ ...p, [f.id]: "loading" }));
    const imgs = await sGet(K_IMG(f.id), []);
    setExpandedImages(p => ({ ...p, [f.id]: imgs }));
  };
  const startAdminEdit = async (f) => {
    setForm({ ...EMPTY_FOUNDER, ...f }); setAdminEditingId(f.id); setAddMode("full");
    setFormImages(await sGet(K_IMG(f.id), [])); setFormError(""); setTab("add");
  };

  const digestText = useMemo(() => {
    const since = Date.now() - digestPeriod * 86400000;
    const newF = activeFounders.filter(f => new Date(f.addedOn).getTime() >= since && f.startupName);
    const upd = activeFounders.filter(f => (f.updates || []).some(u => new Date(u.date).getTime() >= since) && !newF.find(n => n.id === f.id));
    const raisingNow = activeFounders.filter(f => f.fundingStatus === "Raising now");
    const L = [];
    L.push(`Subject: Curious Ventures — Network State Dealflow Update (${fmtDate(new Date().toISOString())})`, "", "Hi {{FirstName}},", "");
    L.push(`Quick pulse from the ground. We're tracking ${stats.total} founders building out of network state communities — ${raisingNow.length} actively raising right now, and ${stats.funded.length} who have already closed a round (${fmtMoney(stats.totalRaisedAll)} raised to date).`, "");
    if (newF.length) { L.push(`NEW FOUNDERS THIS ${digestPeriod === 7 ? "WEEK" : "FORTNIGHT"} (${newF.length})`); newF.forEach(f => L.push(`• ${f.startupName} — ${f.founderName} (${f.networkState}). ${f.oneLiner || f.category}${f.website ? ` ${normUrl(f.website)}` : ""}`)); L.push(""); }
    if (raisingNow.length) {
      L.push(`RAISING NOW (${raisingNow.length})`);
      raisingNow.forEach(f => {
        const val = Number(f.currentValuation) > 0 ? ` at ${fmtMoney(f.currentValuation)} ${f.currentInstrument === "Equity" ? "valuation" : "cap"}` : "";
        const tgt = Number(f.currentTarget) > 0 ? `${fmtMoney(f.currentTarget)} ` : "";
        const pipe = investorSummary(f);
        L.push(`• ${f.startupName} — raising ${tgt}${val}${pipe ? ` (${pipe})` : ""}.`);
      });
      L.push("");
    }
    if (upd.length) { L.push(`MOMENTUM (${upd.length})`); upd.forEach(f => { const u = (f.updates || [])[0]; L.push(`• ${f.startupName}: ${u ? u.text : f.latestUpdate}`); }); L.push(""); }
    L.push("WHY THIS MATTERS", "Network states are becoming the densest founder sourcing channel we know. Every founder above came through community, not cold inbound. This is the distribution edge Curious Ventures is built on.", "", "Reply if you want an intro to any founder above.", "", "— Sood", "GP, Curious Ventures");
    return L.join("\n");
  }, [activeFounders, digestPeriod, stats]);

  const input = "w-full bg-white border border-neutral-200 rounded-md px-3 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors";
  const label = "block text-[11px] font-semibold tracking-widest uppercase text-neutral-500 mb-1.5";
  const RED = "#E63946", BLACK = "#0A0A0A";

  // Animated globe: wireframe sphere, pulsing network-state nodes, connection arcs, rotating orbit.
  const GlobeArt = ({ size = 150 }) => (
    <svg viewBox="0 0 160 160" width={size} height={size} className="block" aria-hidden="true">
      {/* faint stars */}
      {[[12,22],[30,120],[146,40],[140,128],[8,80],[152,86],[52,10],[104,152]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1" fill="#555">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2.4 + i * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {/* wireframe sphere */}
      <circle cx="80" cy="80" r="52" fill="none" stroke="#333" strokeWidth="1" />
      <ellipse cx="80" cy="80" rx="20" ry="52" fill="none" stroke="#2a2a2a" strokeWidth="1" />
      <ellipse cx="80" cy="80" rx="38" ry="52" fill="none" stroke="#2a2a2a" strokeWidth="1" />
      <ellipse cx="80" cy="80" rx="52" ry="12" fill="none" stroke="#2a2a2a" strokeWidth="1" />
      <ellipse cx="80" cy="55" rx="43" ry="8" fill="none" stroke="#2a2a2a" strokeWidth="1" />
      <ellipse cx="80" cy="106" rx="42" ry="8" fill="none" stroke="#2a2a2a" strokeWidth="1" />
      {/* connection arcs */}
      <path d="M 52 62 Q 80 30 108 70" fill="none" stroke="#E63946" strokeWidth="1" opacity="0.5" />
      <path d="M 60 104 Q 90 128 112 88" fill="none" stroke="#E63946" strokeWidth="1" opacity="0.35" />
      <path d="M 52 62 Q 40 95 60 104" fill="none" stroke="#E63946" strokeWidth="1" opacity="0.3" />
      {/* pulsing nodes */}
      {[[52,62,0],[108,70,0.6],[60,104,1.2],[112,88,1.8],[84,44,0.9]].map(([x, y, d], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="2.5" fill="#E63946" />
          <circle cx={x} cy={y} r="2.5" fill="none" stroke="#E63946" strokeWidth="1">
            <animate attributeName="r" values="2.5;9" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="2.4s" begin={`${d}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {/* rotating orbit ring */}
      <g>
        <ellipse cx="80" cy="80" rx="70" ry="24" fill="none" stroke="#E63946" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.5" transform="rotate(-18 80 80)">
          <animateTransform attributeName="transform" type="rotate" from="-18 80 80" to="342 80 80" dur="26s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );

  const Brand = ({ sub }) => (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />
        <span className="text-xl font-bold tracking-tight">Curious Ventures</span>
      </div>
      {sub && <p className="text-sm text-neutral-500 mt-1">{sub}</p>}
    </div>
  );

  const LinkChips = ({ f }) => {
    const items = [
      f.website && { icon: ExternalLink, label: "Website", url: f.website },
      f.appLink && { icon: Smartphone, label: "App", url: f.appLink },
      f.docsLink && { icon: FileText, label: "Docs / Deck", url: f.docsLink },
    ].filter(Boolean);
    if (!items.length) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {items.map((it, i) => (
          <a key={i} href={normUrl(it.url)} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900">
            <it.icon size={11} /> {it.label}
          </a>
        ))}
      </div>
    );
  };

  const Badge = ({ children, solid }) => (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${solid ? "text-white" : "bg-neutral-100 text-neutral-600"}`}
      style={solid ? { background: BLACK } : {}}>{children}</span>
  );

  const statusColor = (s) => {
    if (s === "Invested") return { background: BLACK, color: "#fff" };
    if (s === "Term sheet") return { background: "#E63946", color: "#fff" };
    if (s === "Soft commitment") return { background: "#FDF2F3", color: "#E63946" };
    if (s === "Passed") return { background: "#F3F3F3", color: "#999" };
    return { background: "#F0F0F0", color: "#666" };
  };

  const FundingSummary = ({ f, compact }) => {
    const raising = f.fundingStatus === "Raising now";
    const rounds = f.previousRounds || [];
    const investors = f.currentInvestors || [];
    if (!raising && rounds.length === 0) return null;
    return (
      <div className={compact ? "mt-2 space-y-2" : "mt-4 space-y-3"}>
        {raising && (
          <div className="rounded-md p-3" style={{ background: "#FDF2F3" }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>Raising {f.currentRoundType || ""}</span>
              {Number(f.currentValuation) > 0 && (
                <span className="text-xs font-semibold text-neutral-700">
                  {Number(f.currentTarget) > 0 ? `${fmtMoney(f.currentTarget)} @ ` : ""}{fmtMoney(f.currentValuation)} {f.currentInstrument === "Equity" ? "valuation" : "cap"} · {f.currentInstrument}
                </span>
              )}
              {Number(f.currentEquityPct) > 0 && <span className="text-xs text-neutral-500">{f.currentEquityPct}% offered</span>}
            </div>
            {Number(f.currentTarget) > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-600">{fmtMoney(committedAmount(f))} committed</span>
                  <span className="font-semibold" style={{ color: RED }}>{fmtMoney(remainingToRaise(f))} left of {fmtMoney(f.currentTarget)}</span>
                </div>
                <div className="h-1.5 bg-white rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${num(f.currentTarget) > 0 ? Math.min(100, (committedAmount(f) / num(f.currentTarget)) * 100) : 0}%`, background: RED }} />
                </div>
              </div>
            )}
            {investors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {investors.map((inv, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={statusColor(inv.status)}>
                    {inv.name || "Investor"}{Number(inv.amount) > 0 ? ` ${fmtMoney(inv.amount)}` : ""} <span className="opacity-70">· {inv.status}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {rounds.length > 0 && (
          <div className={raising ? "" : "rounded-md border border-neutral-100 p-3"}>
            {!raising && <div className="text-[10px] font-semibold tracking-widest uppercase text-neutral-400 mb-1.5">Previous rounds</div>}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {rounds.map((r, i) => (
                <span key={i} className="text-xs text-neutral-600">
                  <span className="font-semibold">{r.type}</span> {fmtMoney(r.amount)}{Number(r.valuation) > 0 ? ` @ ${fmtMoney(r.valuation)} ${r.instrument === "Equity" ? "" : "cap"}` : ""}{r.year ? ` (${r.year})` : ""}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---- Fundraising editors (operate on form) ----
  const setCurrentInvestors = (list) => setForm({ ...form, currentInvestors: list });
  const addInvestor = () => setCurrentInvestors([...(form.currentInvestors || []), { name: "", status: INVESTOR_STATUS[0], amount: "" }]);
  const updateInvestor = (i, patch) => setCurrentInvestors((form.currentInvestors || []).map((x, j) => j === i ? { ...x, ...patch } : x));
  const removeInvestor = (i) => setCurrentInvestors((form.currentInvestors || []).filter((_, j) => j !== i));

  const setRounds = (list) => setForm({ ...form, previousRounds: list });
  const addRound = () => setRounds([...(form.previousRounds || []), { type: ROUND_TYPES[0], instrument: "Equity", amount: "", valuation: "", year: "" }]);
  const updateRound = (i, patch) => setRounds((form.previousRounds || []).map((x, j) => j === i ? { ...x, ...patch } : x));
  const removeRound = (i) => setRounds((form.previousRounds || []).filter((_, j) => j !== i));

  const renderFundingDetails = (asFounder) => (
    <div className="space-y-5">
      {form.fundingStatus === "Raising now" && (
        <div className="p-4 rounded-md border border-neutral-200 space-y-4" style={{ background: "#FDF2F3" }}>
          <div className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: RED }}>Current round{asFounder ? " — your live raise" : ""}</div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><span className={label}>Which round</span>
              <select className={input} value={form.currentRoundType} onChange={e => setForm({ ...form, currentRoundType: e.target.value })}>{ROUND_TYPES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><span className={label}>Instrument</span>
              <select className={input} value={form.currentInstrument} onChange={e => setForm({ ...form, currentInstrument: e.target.value })}>{INSTRUMENTS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div><span className={label}>{form.currentInstrument === "Equity" ? "Valuation (USD)" : "Cap (USD)"}</span>
              <input className={input} type="number" value={form.currentValuation} onChange={e => setForm({ ...form, currentValuation: e.target.value })} placeholder="8000000" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><span className={label}>Target raise (USD)</span>
              <input className={input} type="number" value={form.currentTarget} onChange={e => setForm({ ...form, currentTarget: e.target.value })} placeholder="1000000" /></div>
            <div><span className={label}>Equity offered in this round (%)</span>
              <input className={input} type="number" value={form.currentEquityPct} onChange={e => setForm({ ...form, currentEquityPct: e.target.value })} placeholder="12.5" /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={label} style={{ marginBottom: 0 }}>Investors in this round</span>
              <button onClick={addInvestor} className="text-xs font-semibold flex items-center gap-1" style={{ color: RED }}><Plus size={12} /> Add investor</button>
            </div>
            {(form.currentInvestors || []).length === 0 ? (
              <p className="text-xs text-neutral-400">No investors added yet. Add each one with the amount and commitment status.</p>
            ) : (
              <div className="space-y-2">
                {(form.currentInvestors || []).map((inv, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                    <input className={input} value={inv.name} onChange={e => updateInvestor(i, { name: e.target.value })} placeholder="Investor / fund name" />
                    <input className={`${input} sm:max-w-[130px]`} type="number" value={inv.amount} onChange={e => updateInvestor(i, { amount: e.target.value })} placeholder="Amount $" />
                    <select className={`${input} sm:max-w-[160px]`} value={inv.status} onChange={e => updateInvestor(i, { status: e.target.value })}>{INVESTOR_STATUS.map(s => <option key={s}>{s}</option>)}</select>
                    <button onClick={() => removeInvestor(i)} className="p-2 text-neutral-400 hover:text-red-600"><X size={15} /></button>
                  </div>
                ))}
                {committedAmount(form) > 0 && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Soft + committed: <span className="font-semibold">{fmtMoney(committedAmount(form))}</span>
                    {Number(form.currentTarget) > 0 && <> · <span className="font-semibold" style={{ color: RED }}>{fmtMoney(remainingToRaise(form))} left</span> of {fmtMoney(form.currentTarget)} target</>}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous rounds — always available */}
      <div className="p-4 rounded-md border border-neutral-200 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">Previous rounds</div>
            <p className="text-[11px] text-neutral-400 mt-0.5">{asFounder ? "Raised before? Add each past round — angel, pre-seed, a SAFE, etc." : "Any rounds this founder has already closed."}</p>
          </div>
          <button onClick={addRound} className="text-xs font-semibold flex items-center gap-1 whitespace-nowrap" style={{ color: RED }}><Plus size={12} /> Add round</button>
        </div>
        {(form.previousRounds || []).length === 0 ? (
          <p className="text-xs text-neutral-400">No previous rounds added.</p>
        ) : (
          <div className="space-y-3">
            {(form.previousRounds || []).map((r, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end bg-neutral-50 p-3 rounded-md">
                <div><span className={label}>Round</span>
                  <select className={input} value={r.type} onChange={e => updateRound(i, { type: e.target.value })}>{ROUND_TYPES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><span className={label}>Instrument</span>
                  <select className={input} value={r.instrument} onChange={e => updateRound(i, { instrument: e.target.value })}>{INSTRUMENTS.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><span className={label}>Amount</span>
                  <input className={input} type="number" value={r.amount} onChange={e => updateRound(i, { amount: e.target.value })} placeholder="250000" /></div>
                <div><span className={label}>{r.instrument === "Equity" ? "Valuation" : "Cap"}</span>
                  <input className={input} type="number" value={r.valuation} onChange={e => updateRound(i, { valuation: e.target.value })} placeholder="5000000" /></div>
                <div className="flex gap-1 items-end">
                  <div className="flex-1"><span className={label}>Year</span>
                    <input className={input} value={r.year} onChange={e => updateRound(i, { year: e.target.value })} placeholder="2024" /></div>
                  <button onClick={() => removeRound(i)} className="p-2 text-neutral-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Editable profile fields (no login) — used in founder self-onboarding
  const ProfileFields = () => (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div><span className={label}>Your name *</span>
          <input className={input} value={form.founderName} onChange={e => setForm({ ...form, founderName: e.target.value })} placeholder="Riya Sharma" /></div>
        <div><span className={label}>Startup name *</span>
          <input className={input} value={form.startupName} onChange={e => setForm({ ...form, startupName: e.target.value })} placeholder="LoopLabs" /></div>
      </div>
      <div><span className={label}>One-liner</span>
        <input className={input} value={form.oneLiner} onChange={e => setForm({ ...form, oneLiner: e.target.value })} placeholder="AI copilot for creator monetization" /></div>
      <div><span className={label}>Where did we meet? *</span>
        <select className={input} value={form.networkState} onChange={e => setForm({ ...form, networkState: e.target.value })}>
          <option value="" disabled>Select a place…</option>
          {places.map(n => <option key={n}>{n}</option>)}
        </select></div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div><span className={label}>Category</span>
          <select className={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><span className={label}>Stage</span>
          <select className={input} value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>{STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><span className={label}>Funding status</span>
          <select className={input} value={form.fundingStatus} onChange={e => setForm({ ...form, fundingStatus: e.target.value })}>{FUNDING_STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
      </div>
      {renderFundingDetails(true)}
      <div className="grid sm:grid-cols-3 gap-4">
        <div><span className={label}>Website</span>
          <input className={input} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="startup.com" /></div>
        <div><span className={label}>App / product link</span>
          <input className={input} value={form.appLink} onChange={e => setForm({ ...form, appLink: e.target.value })} placeholder="App Store, demo…" /></div>
        <div><span className={label}>Deck / docs link</span>
          <input className={input} value={form.docsLink} onChange={e => setForm({ ...form, docsLink: e.target.value })} placeholder="Notion, Drive, DocSend…" /></div>
      </div>
      <div><span className={label}>X / Twitter</span>
        <input className={input} value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="@handle" /></div>
      <div>
        <span className={label}>Images — logo, product screenshots (up to 3)</span>
        <div className="flex flex-wrap gap-3">
          {formImages.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="w-24 h-24 object-cover rounded-md border border-neutral-200" />
              <button onClick={() => setFormImages(formImages.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-neutral-900 text-white rounded-full p-1"><X size={11} /></button>
            </div>
          ))}
          {formImages.length < 3 && (
            <label className="w-24 h-24 border-2 border-dashed border-neutral-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-neutral-900 text-neutral-400 hover:text-neutral-900">
              <ImageIcon size={18} /><span className="text-[10px] mt-1">Add image</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => { handleImageFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
        {imgError && <p className="text-xs mt-1.5" style={{ color: RED }}>{imgError}</p>}
      </div>
      <div><span className={label}>What are you working on right now?</span>
        <textarea className={input} rows={3} value={form.latestUpdate} onChange={e => setForm({ ...form, latestUpdate: e.target.value })} placeholder="Shipped v2, 10K users, raising pre-seed…" /></div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen bg-neutral-50 flex items-center justify-center text-neutral-400 gap-2 text-sm" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <RefreshCw size={16} className="animate-spin" /> Loading…
    </div>;
  }

  if (view === "landing") {
    const openRounds = founders.filter(f => f.approved !== false && f.fundingStatus === "Raising now");
    const openTarget = openRounds.reduce((sum, f) => sum + (Number(f.currentTarget) || 0), 0);
    const statesCovered = new Set(founders.filter(f => f.approved !== false).map(f => f.networkState).filter(Boolean)).size || places.length;
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: BLACK, fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500">Curious Ventures · Curious House</span>
            </div>
            <button onClick={() => { setView("adminGate"); setGateError(""); setPassInput(""); }} className="p-2 text-neutral-600 hover:text-neutral-300 transition-colors" title="Curious Ventures team"><Lock size={14} /></button>
          </div>

          <div className="flex items-start justify-between gap-6 mt-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              <span className="text-white">Talent is leaving cities and joining networks.</span>{" "}
              <span style={{ color: RED }}>We invest where it lands.</span>
            </h1>
            <div className="hidden sm:block shrink-0"><GlobeArt size={120} /></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-8">
            {[
              { k: "Founders met", v: founders.filter(f => f.approved !== false).length },
              { k: "States covered", v: statesCovered },
              { k: "Raising right now", v: openRounds.length },
              { k: "In open rounds", v: fmtMoney(openTarget) },
            ].map(x => (
              <div key={x.k} className="rounded-lg p-3.5" style={{ background: "#161616" }}>
                <div className="text-xl font-extrabold" style={{ color: RED }}>{x.v}</div>
                <div className="text-[10px] uppercase tracking-wide text-neutral-500 mt-1">{x.k}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-2.5 mt-8">
            <button onClick={() => { setView("founderLogin"); setLoginError(""); setLoginEmail(""); setLoginPass(""); }}
              className="py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: RED }}>
              Founder login
            </button>
            <button onClick={() => { setView("investorLogin"); setInvLoginError(""); setInvLoginEmail(""); setInvLoginPass(""); }}
              className="py-3 rounded-lg text-sm font-semibold bg-white text-neutral-900 transition-colors hover:bg-neutral-200">
              Investor login
            </button>
            <button onClick={() => { setView("nodeLogin"); setNodeLoginError(""); setNodeLoginEmail(""); setNodeLoginPass(""); }}
              className="py-3 rounded-lg text-sm font-semibold text-neutral-200 border border-neutral-700 transition-colors hover:border-neutral-400">
              Network state login
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-7 pt-5 border-t border-neutral-900">
            <button onClick={() => setView("publicStates")} className="text-sm text-neutral-400 hover:text-white transition-colors">
              Exploring network states? <span className="font-semibold" style={{ color: RED }}>See the map →</span>
            </button>
            <a href="https://soodgen.substack.com" target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">Read the thesis ↗</a>
          </div>
        </div>
      </div>
    );
  }

  const renderFounderCard = (f, opts = {}) => {
                  const pending = f.profileComplete === false;
                  const loginMsg = pending
                    ? `Hey ${(f.founderName || "there").split(" ")[0]}! Great meeting you. Add your startup to the Curious Ventures founder tracker — log in and fill in your details (takes 2 min). You can post updates anytime after.\n\nLink: [paste this dashboard's link]\nEmail: ${f.email}\nPassword: ${f.password}`
                    : `Hey ${(f.founderName || "there").split(" ")[0]}! Your Curious Ventures founder profile is live. Log in to post updates anytime:\n\nLink: [paste this dashboard's link]\nEmail: ${f.email}\nPassword: ${f.password}\n\nUse it to share milestones — that's what reaches our LPs.`;
                  return (
                    <div key={f.id} className="bg-white border rounded-lg p-5" style={f.invested ? { background: "#F7FCF9", borderColor: "#BDE5CB" } : { borderColor: "#e5e5e5" }}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold">{f.startupName || f.founderName || "Invited founder"}</span>
                            {pending ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>Awaiting profile</span>
                            ) : f.invested ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: "#16A34A" }}>✓ Invested</span>
                            ) : f.fundingStatus === "Raising now" ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>Raising now</span>
                            ) : hasRaised(f) ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-900 text-white">Raised {fmtMoney(totalRaised(f))}</span>
                            ) : (
                              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{f.fundingStatus}</span>
                            )}
                          </div>
                          <div className="text-sm text-neutral-600 mt-1">{pending ? (f.founderName || "Hasn't logged in yet") : `${f.founderName}${f.oneLiner ? ` — ${f.oneLiner}` : ""}`}</div>
                          <div className="text-xs text-neutral-400 mt-1">{pending ? `Invited${f.metAt ? ` · Met: ${f.metAt}` : ""}` : `${f.networkState} · ${f.category} · ${f.stage}`}</div>
                          <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Mail size={11} /> {f.email || "no login email"}{f.origin && <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">via {f.origin}</span>}{f.nodeHighlight && <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">★ {f.nodeHighlight}</span>}</div>
                          {f.note && <div className="text-xs text-neutral-500 mt-1.5 italic">"{f.note}" <span className="not-italic text-neutral-400">— from their request</span></div>}
                          {checkInInfo(f) && (
                            <div className="mt-1.5">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${checkInInfo(f).due ? "text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`} style={checkInInfo(f).due ? { background: RED } : {}}>
                                <Bell size={11} /> {checkInInfo(f).text}
                              </span>
                            </div>
                          )}
                          {!pending && <FundingSummary f={f} compact />}
                          <LinkChips f={f} />
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => togglePin(f.id)} className={`p-2 rounded-md hover:bg-neutral-100 ${isStarred(f) ? "text-amber-500" : "text-neutral-400 hover:text-neutral-900"}`} title={node ? (isStarred(f) ? "Highlighted to Curious Ventures — click to remove" : "Highlight this deal to Curious Ventures") : (f.pinned ? "Tracked — click to untrack" : "Track this startup")}>
                            <Star size={15} fill={isStarred(f) ? "currentColor" : "none"} />
                          </button>
                          <button onClick={() => openNote(f)} className={`p-2 rounded-md hover:bg-neutral-100 relative ${(f.adminNote || f.hasAudioNote || f.checkInDate) ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-900"}`} title="Private note & check-in">
                            <StickyNote size={15} />
                            {f.checkInDate && f.checkInDate <= todayISO() && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: RED }} />}
                          </button>
                          <button onClick={() => startAdminEdit(f)} className="p-2 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100" title="Edit"><Pencil size={15} /></button>
                          {confirmDelete === f.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => removeFounder(f.id)} className="text-xs px-2 py-1 rounded text-white" style={{ background: RED }}>Delete</button>
                              <button onClick={() => setConfirmDelete(null)} className="p-2 text-neutral-400"><X size={15} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(f.id)} className="p-2 text-neutral-400 hover:text-red-600 rounded-md hover:bg-neutral-100" title="Delete"><Trash2 size={15} /></button>
                          )}
                        </div>
                      </div>

                      {(cardImages[f.id] && cardImages[f.id].length > 0) && (
                        <div className="mt-3 flex gap-3 flex-wrap">
                          {cardImages[f.id].map((src, i) => <img key={i} src={src} alt="" className="h-24 rounded-md border border-neutral-200 object-cover" />)}
                        </div>
                      )}

                      {(f.updates || []).length > 0 && (
                        <div className="mt-3 border-l-2 pl-3 space-y-1.5" style={{ borderColor: RED }}>
                          {(f.updates || []).slice(0, 3).map((u, i) => (
                            <div key={i} className="text-xs">
                              <span className="text-neutral-700">{u.text}</span>
                              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={u.by === "admin" ? { background: "#FDF2F3", color: RED } : { background: "#F0F0F0", color: "#666" }}>
                                {u.by === "admin" ? "by admin" : "by founder"}
                              </span>
                              <span className="text-neutral-400 ml-2">· {daysAgo(u.date)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <input value={updateDrafts[f.id] || ""} onChange={e => setUpdateDrafts(d => ({ ...d, [f.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") addUpdate(f.id); }}
                          placeholder="Log an update on their behalf…"
                          className="flex-1 min-w-[180px] bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-neutral-900" />
                        <button onClick={() => addUpdate(f.id)} className="px-3 py-2 rounded-md text-xs font-medium text-white" style={{ background: BLACK }}>Log</button>
                        <button onClick={() => copyText(loginMsg, f.id)} className="px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900 flex items-center gap-1.5">
                          <Copy size={12} /> {copied === f.id ? "Copied!" : pending ? "Copy invite" : "Copy login details"}
                        </button>
                        <button onClick={() => openShare(f)} className="px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900 flex items-center gap-1.5">
                          <Share2 size={12} /> Share card
                        </button>
                        {!node && !f.invested && (
                          <button onClick={() => openInvest(f)} className="px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border" style={{ borderColor: RED, color: RED }}>
                            <Briefcase size={12} /> Mark as invested
                          </button>
                        )}
                        {!node && f.invested && (
                          <button onClick={() => setTab("portfolio")} className="px-3 py-2 rounded-md text-xs font-semibold text-white flex items-center gap-1.5" style={{ background: "#0A0A0A" }}>
                            <Briefcase size={12} /> In portfolio ✓
                          </button>
                        )}
                      </div>

                      {notePanel === f.id && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-neutral-500">
                            <Lock size={11} /> Private note — only you see this
                          </div>
                          <textarea value={noteDraft[f.id] || ""} onChange={e => setNoteDraft(d => ({ ...d, [f.id]: e.target.value }))}
                            rows={3} placeholder="Your read on this founder — conviction, gaps, next steps…"
                            className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-900" />

                          {/* Voice note */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {recordingFor === f.id ? (
                              <button onClick={stopRecording} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md text-white" style={{ background: RED }}>
                                <Square size={12} /> Stop recording
                              </button>
                            ) : (
                              <button onClick={() => startRecording(f.id)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-neutral-200 hover:border-neutral-900">
                                <Mic size={12} /> {f.hasAudioNote ? "Re-record voice note" : "Record voice note"}
                              </button>
                            )}
                            {f.hasAudioNote && audioCache[f.id] && (
                              <>
                                <audio controls src={audioCache[f.id]} className="h-8" style={{ maxWidth: 200 }} />
                                <button onClick={() => deleteAudio(f.id)} className="p-1.5 text-neutral-400 hover:text-red-600"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                          {recError && <p className="text-xs" style={{ color: RED }}>{recError}</p>}

                          {/* Check-in */}
                          <div className="flex items-end gap-2 flex-wrap">
                            <div>
                              <span className="block text-[11px] font-semibold tracking-widest uppercase text-neutral-500 mb-1.5 flex items-center gap-1"><Calendar size={11} /> Check in again on</span>
                              <input type="date" value={checkInDraft[f.id] || ""} onChange={e => setCheckInDraft(d => ({ ...d, [f.id]: e.target.value }))}
                                className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-neutral-900" />
                            </div>
                            {f.email && <a href={checkInEmail(f)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-neutral-200 hover:border-neutral-900"><Mail size={12} /> Email them</a>}
                            <button onClick={() => markCheckedIn(f.id)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border border-neutral-200 hover:border-neutral-900"><CheckCircle2 size={12} /> Mark checked in</button>
                          </div>
                          {f.lastCheckIn && <p className="text-[11px] text-neutral-400">Last checked in {daysAgo(f.lastCheckIn)}.</p>}
                          <div className="flex items-center gap-3 pt-1">
                            <button onClick={() => saveNote(f.id)} className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ background: BLACK }}>Save note</button>
                            <button onClick={() => setNotePanel(null)} className="text-sm text-neutral-500 hover:text-neutral-900">Close</button>
                            {noteSaved === f.id && <span className="text-sm font-medium" style={{ color: RED }}>Saved ✓</span>}
                          </div>
                        </div>
                      )}
                      {opts.portfolio && f.invested && (() => {
                        const cost = companyCost(f);
                        const value = companyValue(f);
                        const moic = cost > 0 ? (value / cost) : 0;
                        const rounds = f.newRounds || [];
                        const eqNow = companyEquity(f);
                        const cl = f.checklist || {};
                        const clDone = [cl.termSheet, cl.docsSigned, cl.wired, cl.confirmed].filter(Boolean).length;
                        return (
                          <div className="mt-4 pt-4 border-t" style={{ borderColor: "#BDE5CB" }}>
                            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#16A34A" }}>
                              <Briefcase size={11} /> Our investment
                            </div>
                            <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
                              <div className="text-sm font-semibold">
                                {fmtMoney(f.deal?.amount)} · {f.deal?.instrument || "SAFE"}{f.deal?.valuation ? ` at ${fmtMoney(f.deal.valuation)} ${f.deal?.valuationType || "cap"}` : ""}{f.deal?.ownershipPct ? ` · ${f.deal.ownershipPct}%` : ""}{safeDate(f.deal?.date) ? ` · ${safeDate(f.deal.date)}` : ""}
                                {f.deal?.coInvestors && <div className="text-xs text-neutral-500 font-normal mt-0.5">Alongside: {f.deal.coInvestors}</div>}
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-extrabold" style={{ color: "#16A34A" }}>{moic ? `${moic.toFixed(2)}x` : "—"}</div>
                                <div className="text-[11px] text-neutral-500 mt-0.5">In: {fmtMoney(cost)} · Now: {fmtMoney(value)}</div>
                                <div className="text-[11px] text-neutral-400">{eqNow ? `${eqNow}% stake` : ""}{rounds.length === 0 ? " · held at entry" : ""}</div>
                              </div>
                            </div>
                            {f.memo?.why && (
                              <div className="mt-2 text-xs text-neutral-600 leading-relaxed">
                                <span className="font-bold text-neutral-900">Why we invested:</span> {f.memo.why}
                                {f.memo.risks && <div className="mt-1"><span className="font-bold text-neutral-900">Risks:</span> {f.memo.risks}</div>}
                                {f.memo.mustBeTrue && <div className="mt-1"><span className="font-bold text-neutral-900">Must be true:</span> {f.memo.mustBeTrue}</div>}
                                {f.memo.expectedOutcome && <div className="mt-1"><span className="font-bold text-neutral-900">Expected outcome:</span> {f.memo.expectedOutcome}</div>}
                              </div>
                            )}
                            <div className="mt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">Rounds since we invested</span>
                                <button onClick={() => roundPanel === f.id ? setRoundPanel(null) : openRound(f)} className="text-xs font-semibold" style={{ color: "#16A34A" }}>{roundPanel === f.id ? "Cancel" : "+ Log new round"}</button>
                              </div>
                              {rounds.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {rounds.map((r, idx) => (
                                    <div key={idx} className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white border border-neutral-200 rounded-md px-3 py-2">
                                      <div>
                                        <span className="font-bold">{r.roundName || "Round"}</span>
                                        <span className="text-neutral-500"> · {fmtMoney(r.postMoney)} post{safeDate(r.date, { month: "short", year: "numeric" }) ? ` · ${safeDate(r.date, { month: "short", year: "numeric" })}` : ""}</span>
                                        <span className="text-neutral-500"> · {r.participated ? `defended with ${fmtMoney(r.followOnAmount)}` : "did not participate"} → {r.equityAfter}%</span>
                                      </div>
                                      <button onClick={() => deleteRound(f.id, idx)} className="text-neutral-300 hover:text-red-600" title="Delete round"><Trash2 size={12} /></button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {roundPanel === f.id && (
                                <div className="mt-2 bg-white border border-neutral-200 rounded-md p-3">
                                  <div className="grid sm:grid-cols-4 gap-2">
                                    <input value={roundDraft.roundName} onChange={e => setRoundDraft(d => ({ ...d, roundName: e.target.value }))} placeholder="Round (Seed…)" className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 focus:outline-none focus:border-neutral-900" />
                                    <input type="date" value={roundDraft.date} onChange={e => setRoundDraft(d => ({ ...d, date: e.target.value }))} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 focus:outline-none focus:border-neutral-900" />
                                    <input value={roundDraft.postMoney} onChange={e => setRoundDraft(d => ({ ...d, postMoney: e.target.value }))} placeholder="Post-money valuation *" className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 focus:outline-none focus:border-neutral-900" />
                                    <input value={roundDraft.roundSize} onChange={e => setRoundDraft(d => ({ ...d, roundSize: e.target.value }))} placeholder="Round size" className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 focus:outline-none focus:border-neutral-900" />
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <button onClick={() => setRoundDraft(d => ({ ...d, participated: !d.participated }))}
                                      className={`text-xs px-3 py-2 rounded-md border font-medium ${roundDraft.participated ? "text-white border-transparent" : "border-neutral-200 text-neutral-600"}`}
                                      style={roundDraft.participated ? { background: "#16A34A" } : {}}>
                                      {roundDraft.participated ? "✓ We defended (pro-rata)" : "We did not participate"}
                                    </button>
                                    {roundDraft.participated && <input value={roundDraft.followOnAmount} onChange={e => setRoundDraft(d => ({ ...d, followOnAmount: e.target.value }))} placeholder="Our follow-on ($)" className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 w-32 focus:outline-none focus:border-neutral-900" />}
                                    <input value={roundDraft.equityAfter} onChange={e => setRoundDraft(d => ({ ...d, equityAfter: e.target.value }))} placeholder="Our equity after (%) *" className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 w-40 focus:outline-none focus:border-neutral-900" />
                                    <button onClick={() => suggestEquity(f)} className="text-xs font-semibold text-neutral-500 hover:text-neutral-900">Auto-calc</button>
                                    <button onClick={() => saveRound(f.id)} disabled={!roundDraft.postMoney || !roundDraft.equityAfter}
                                      className={`ml-auto text-xs px-4 py-2 rounded-md font-semibold text-white ${(!roundDraft.postMoney || !roundDraft.equityAfter) ? "opacity-40" : ""}`} style={{ background: "#16A34A" }}>Save round</button>
                                  </div>
                                  <p className="text-[10px] text-neutral-400 mt-2">Auto-calc estimates dilution from round size ({"new % = old % x (1 - size/post) + follow-on/post"}). Override with the real number from the cap table when you have it.</p>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${clDone === 4 ? "text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`} style={clDone === 4 ? { background: "#16A34A" } : {}}>Closing: {clDone}/4</span>
                              {(f.docs || []).filter(d => d.url).map((d, i) => (
                                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold flex items-center gap-1" style={{ color: "#16A34A" }}><FileText size={11} /> {d.label} ({d.status})</a>
                              ))}
                              <div className="ml-auto flex items-center gap-2">
                                <button onClick={() => openInvest(f)} className="px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900 flex items-center gap-1.5 bg-white"><Pencil size={12} /> Edit deal</button>
                                <button onClick={() => removeFromPortfolio(f.id)} className="p-2 rounded-md text-neutral-300 hover:text-red-600" title="Remove from portfolio"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
  };

  if (view === "publicStates") {
    const q = nsSearch.toLowerCase();
    const dir = NETWORK_STATES
      .filter(x => nsType === "All" || (nsType === "Other" ? !["Startup Society", "Popup Village", "Startup City", "SEZ"].includes(x.t) : x.t === nsType))
      .filter(x => !q || [x.n, x.l, x.t, x.d].some(v => v.toLowerCase().includes(q)));
    const rising = NETWORK_STATES.filter(x => x.r);
    const placeCounts = places.map(pl => ({ place: pl, count: activeFounders.filter(f => f.networkState === pl).length }));
    return (
      <div className="min-h-screen bg-neutral-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: BLACK }} className="text-white">
          <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: RED }} />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-400">Curious Ventures</span>
            </div>
            <button onClick={() => setView("landing")} className="text-xs text-neutral-400 hover:text-white">← Curious House</button>
          </div>
          <div className="max-w-5xl mx-auto px-5 pt-10 pb-14">
            <div className="flex items-start justify-between gap-6">
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight max-w-3xl">Talent is leaving cities and joining networks. We invest where it lands.</h1>
              <div className="hidden md:block shrink-0 -mt-2"><GlobeArt size={190} /></div>
            </div>
            <p className="mt-5 text-neutral-300 max-w-2xl text-sm sm:text-base leading-relaxed">Network states — startup societies, popup villages, special economic zones — are pulling the world's most ambitious builders into dense physical communities. Curious Ventures lives inside them. We meet founders months before their rounds hit anyone's inbox. We think this is the biggest sourcing edge in early-stage venture right now, and we are unapologetically bullish.</p>
            <div className={`mt-8 grid grid-cols-2 gap-3 ${activeNodes.length > 0 ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
              {[
                { k: "Founders met", v: pubStats.met },
                { k: "Network states covered", v: pubStats.states },
                { k: "Raising right now", v: pubStats.raising },
                { k: "Raised by the network", v: fmtMoney(pubStats.raised) },
                ...(activeNodes.length > 0 ? [{ k: "Trusted nodes", v: activeNodes.length }] : []),
              ].map(x => (
                <div key={x.k} className="rounded-lg p-4" style={{ background: "#161616" }}>
                  <div className="text-2xl font-extrabold" style={{ color: RED }}>{x.v}</div>
                  <div className="text-[11px] uppercase tracking-wide text-neutral-400 mt-1">{x.k}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">Live numbers from Curious House, our founder network.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 py-10">
          <h2 className="text-lg font-bold tracking-tight">Where we're embedded</h2>
          <p className="text-sm text-neutral-500 mt-0.5">The archipelago — communities we source from in person.</p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {placeCounts.map(x => (
              <div key={x.place} className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="font-semibold text-sm flex items-center gap-1.5"><MapPin size={13} style={{ color: RED }} /> {x.place}</div>
                <div className="text-xs text-neutral-500 mt-1">{x.count} founder{x.count === 1 ? "" : "s"} met</div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-bold tracking-tight">Rising states we're watching</h2>
            <p className="text-sm text-neutral-500 mt-0.5">New societies coming online — where we expect the next wave of founders.</p>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {rising.map(x => (
                <div key={x.n} className="min-w-[220px] bg-white border border-neutral-200 rounded-lg p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>Rising</span>
                  <div className="font-semibold text-sm mt-2">{x.n}</div>
                  <div className="text-[11px] text-neutral-400">{x.l}</div>
                  <div className="text-xs text-neutral-600 mt-1.5 leading-relaxed">{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight">The map of the movement</h2>
                <p className="text-sm text-neutral-500 mt-0.5">{NETWORK_STATES.length} startup societies worldwide, and counting.</p>
              </div>
              <input value={nsSearch} onChange={e => setNsSearch(e.target.value)} placeholder="Search society or place…"
                className="text-sm border border-neutral-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-neutral-900 w-full sm:w-64" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {NS_TYPES.map(t => (
                <button key={t} onClick={() => setNsType(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${nsType === t ? "text-white border-transparent" : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-900"}`}
                  style={nsType === t ? { background: BLACK } : {}}>{t}</button>
              ))}
            </div>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dir.map(x => (
                <div key={x.n} className="bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm">{x.n}</div>
                    {x.r && <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: RED }}>Rising</span>}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{x.t} · {x.l}</div>
                  <div className="text-xs text-neutral-600 mt-1.5 leading-relaxed">{x.d}</div>
                </div>
              ))}
              {dir.length === 0 && <div className="text-sm text-neutral-400 col-span-full py-8 text-center">No societies match that search.</div>}
            </div>
            <p className="text-[11px] text-neutral-400 mt-3">Directory sourced from the community-maintained dashboard at ns.com.</p>
          </div>

          <div className="mt-12 rounded-2xl p-6 sm:p-8 text-white" style={{ background: BLACK }}>
            <h2 className="text-xl sm:text-2xl font-extrabold">This is where we invest. Come inside.</h2>
            <p className="text-sm text-neutral-300 mt-2 max-w-2xl">If you're building from a network state, we want to track you. If you're an investor, our deal flow is live. If you're an LP or just network-state-curious, the thesis is public.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => { setView("founderRequest"); setReqError(""); }} className="px-5 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: RED }}>I'm a founder →</button>
              <button onClick={() => { setView("investorLogin"); setInvLoginError(""); }} className="px-5 py-2.5 rounded-md text-sm font-semibold bg-white text-neutral-900">I'm an investor →</button>
              <a href="https://soodgen.substack.com" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-md text-sm font-semibold border border-neutral-600 hover:border-white">Read the thesis →</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "investorLogin") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-sm">
          <Brand sub="Investor access" />
          <div className="bg-white border border-neutral-200 rounded-lg p-5 mt-6 space-y-3">
            <div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">Email</span>
              <input className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm mt-1 focus:outline-none focus:border-neutral-900" value={invLoginEmail} onChange={e => setInvLoginEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && investorLogin()} placeholder="you@fund.com" autoFocus />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">Password</span>
              <input type="password" className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm mt-1 focus:outline-none focus:border-neutral-900" value={invLoginPass} onChange={e => setInvLoginPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && investorLogin()} placeholder="••••••••" />
            </div>
            {invLoginError && <p className="text-xs" style={{ color: RED }}>{invLoginError}</p>}
            <button onClick={investorLogin} className="w-full py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: BLACK }}>Log in</button>
            <p className="text-[11px] text-neutral-400 text-center">Curious Ventures creates your login. Forgot it, just ask them.</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4 mt-3 text-center">
            <p className="text-xs text-neutral-500">Want access to the deal flow?</p>
            <button onClick={() => { setView("investorRequest"); setInvReqError(""); }} className="text-sm font-semibold mt-1" style={{ color: RED }}>Request access →</button>
          </div>
          <button onClick={() => setView("landing")} className="block mx-auto mt-4 text-xs text-neutral-400 hover:text-neutral-900">← Back</button>
        </div>
      </div>
    );
  }

  if (view === "investorRequest") {
    const label = "text-[11px] font-semibold tracking-widest uppercase text-neutral-500";
    const input = "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm mt-1 focus:outline-none focus:border-neutral-900";
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-md">
          <Brand sub="Investor access request" />
          <div className="bg-white border border-neutral-200 rounded-lg p-5 mt-6">
            <p className="text-sm text-neutral-600">Tell us who you are and pick a password. Once Curious Ventures approves you, log in with this email and password to see the live deal flow.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div><span className={label}>Your name *</span><input className={input} value={invReq.name} onChange={e => setInvReq({ ...invReq, name: e.target.value })} placeholder="Jane Doe" autoFocus /></div>
              <div><span className={label}>Firm / fund</span><input className={input} value={invReq.firm} onChange={e => setInvReq({ ...invReq, firm: e.target.value })} placeholder="Fund name or angel" /></div>
              <div className="sm:col-span-2"><span className={label}>What you invest in</span><input className={input} value={invReq.focus} onChange={e => setInvReq({ ...invReq, focus: e.target.value })} placeholder="Consumer AI, crypto consumer, pre-seed…" /></div>
              <div><span className={label}>Typical check</span><input className={input} value={invReq.checkSize} onChange={e => setInvReq({ ...invReq, checkSize: e.target.value })} placeholder="$25K–$100K" /></div>
              <div><span className={label}>Email *</span><input className={input} type="email" value={invReq.email} onChange={e => setInvReq({ ...invReq, email: e.target.value })} placeholder="you@fund.com" /></div>
              <div className="sm:col-span-2"><span className={label}>Pick a password *</span><input className={input} value={invReq.password} onChange={e => setInvReq({ ...invReq, password: e.target.value })} placeholder="Simple password you'll remember" /></div>
            </div>
            {invReqError && <p className="text-xs mt-3" style={{ color: RED }}>{invReqError}</p>}
            <button onClick={submitInvestorRequest} className="w-full mt-4 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: RED }}>Request access</button>
          </div>
          <button onClick={() => setView("investorLogin")} className="block mx-auto mt-4 text-xs text-neutral-400 hover:text-neutral-900">← Back to login</button>
        </div>
      </div>
    );
  }

  if (view === "investorRequestSent") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-md text-center">
          <Brand sub="Request received" />
          <div className="bg-white border border-neutral-200 rounded-lg p-8 mt-6">
            <CheckCircle2 size={32} className="mx-auto" style={{ color: RED }} />
            <h2 className="text-lg font-bold mt-3">You're in the queue</h2>
            <p className="text-sm text-neutral-500 mt-2">Thanks — Curious Ventures will review and approve you. Once you're in, log in with the email and password you just chose to see the deal flow.</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => { setView("investorLogin"); setInvLoginError(""); }} className="px-5 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: RED }}>Log in</button>
              <button onClick={() => setView("landing")} className="px-5 py-2.5 rounded-md text-sm font-semibold border border-neutral-300 hover:border-neutral-900">Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "investorHome" && inv) {
    return (
      <div className="min-h-screen bg-neutral-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: RED }} />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-neutral-500">Curious House · Deal flow</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 hidden sm:inline">{inv.name}{inv.firm ? ` · ${inv.firm}` : ""}</span>
              <button onClick={refetchData} className="p-2 text-neutral-400 hover:text-neutral-900" title="Refresh"><RefreshCw size={14} /></button>
              <button onClick={() => { setInv(null); setView("landing"); }} className="p-2 text-neutral-400 hover:text-neutral-900" title="Log out"><LogOut size={14} /></button>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-5 py-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { k: "Available deals", v: dealFlow.length },
              { k: "Combined round targets", v: fmtMoney(dealFlow.reduce((sum, f) => sum + (Number(f.currentTarget) || 0), 0)) },
              { k: "Raised by the network", v: fmtMoney(pubStats.raised) },
            ].map(x => (
              <div key={x.k} className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="text-xl font-extrabold" style={{ color: RED }}>{x.v}</div>
                <div className="text-[11px] uppercase tracking-wide text-neutral-400 mt-0.5">{x.k}</div>
              </div>
            ))}
          </div>
          {portfolioFounders.length > 0 && (
            <div className="mt-4 bg-white border border-neutral-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest uppercase text-neutral-400">Backed by Curious Ventures:</span>
              {portfolioFounders.map(f => <span key={f.id} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100">{f.startupName || f.founderName}</span>)}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-6 mb-4">
            <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Search deals…"
              className="text-sm border border-neutral-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:border-neutral-900 w-full sm:w-56" />
            <select value={fCat} onChange={e => setFCat(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
              <option value="">Category: all</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={fStage} onChange={e => setFStage(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
              <option value="">Stage: all</option>{STAGES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={fPlace} onChange={e => setFPlace(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
              <option value="">Place: all</option>{places.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {(filtersOn || invSearch) && <button onClick={() => { clearFilters(); setInvSearch(""); }} className="text-xs font-semibold" style={{ color: RED }}>Clear</button>}
          </div>
          <div className="space-y-3">
            {dealFlow.map(f => {
              const imgs = cardImages[f.id] || [];
              const requested = hasRequestedConnect(f.id);
              return (
                <div key={f.id} className="bg-white border border-neutral-200 rounded-lg p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{f.startupName || f.founderName}</span>
                        {f.fundingStatus === "Raising now" && <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>Raising now</span>}
                        {f.fundingStatus === "Funded" && <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-900 text-white">Funded</span>}
                      </div>
                      <div className="text-sm text-neutral-600 mt-0.5">{f.founderName}{f.oneLiner ? ` — ${f.oneLiner}` : ""}</div>
                      <div className="text-xs text-neutral-400 mt-1">{[f.networkState, f.category, f.stage].filter(Boolean).join(" · ")}{f.origin && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">Sourced by {f.origin}</span>}</div>
                    </div>
                    <button onClick={() => requestConnect(f)} disabled={requested}
                      className={`px-4 py-2 rounded-md text-xs font-semibold ${requested ? "bg-neutral-100 text-neutral-400" : "text-white"}`}
                      style={requested ? {} : { background: RED }}>
                      {requested ? "Intro requested ✓" : "Request intro"}
                    </button>
                  </div>
                  {imgs.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {imgs.map((src, i) => <img key={i} src={src} alt="" className="h-24 rounded-md object-cover" />)}
                    </div>
                  )}
                  {f.fundingStatus === "Raising now" && (
                    <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-600 space-y-1">
                      <div className="font-semibold text-neutral-900">{f.currentRoundType || "Round"}{f.currentInstrument ? ` · ${f.currentInstrument}` : ""}{f.currentTarget ? ` · raising ${fmtMoney(f.currentTarget)}` : ""}{f.currentValuation ? ` at ${fmtMoney(f.currentValuation)}` : ""}{f.currentEquityPct ? ` (${f.currentEquityPct}%)` : ""}</div>
                      {Number(f.currentTarget) > 0 && (
                        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden max-w-xs">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (committedAmount(f) / Number(f.currentTarget)) * 100)}%`, background: RED }} />
                        </div>
                      )}
                      {(f.currentInvestors || []).length > 0 && <div>{(f.currentInvestors || []).map(iv2 => `${iv2.name} (${iv2.status}${iv2.amount ? `, ${fmtMoney(iv2.amount)}` : ""})`).join(" · ")}</div>}
                    </div>
                  )}
                  {(f.previousRounds || []).length > 0 && (
                    <div className="mt-2 text-xs text-neutral-500">Previously: {(f.previousRounds || []).map(r => `${r.type || "Round"} ${fmtMoney(r.amount)}${r.valuation ? ` at ${fmtMoney(r.valuation)}` : ""}${r.year ? ` (${r.year})` : ""}`).join(" · ")}</div>
                  )}
                  {f.latestUpdate && <div className="mt-2 text-xs text-neutral-600"><span className="font-semibold text-neutral-900">Latest:</span> {f.latestUpdate}</div>}
                  <div className="mt-3 flex items-center gap-3">
                    {f.website && <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold flex items-center gap-1" style={{ color: RED }}><ExternalLink size={11} /> Website</a>}
                    {f.twitter && <a href={`https://x.com/${(f.twitter || "").replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold flex items-center gap-1 text-neutral-600 hover:text-neutral-900"><ExternalLink size={11} /> X</a>}
                    {f.appLink && <a href={f.appLink} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold flex items-center gap-1 text-neutral-600 hover:text-neutral-900"><ExternalLink size={11} /> App</a>}
                    {f.docsLink && <a href={f.docsLink} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold flex items-center gap-1 text-neutral-600 hover:text-neutral-900"><ExternalLink size={11} /> Deck</a>}
                  </div>
                </div>
              );
            })}
            {dealFlow.length === 0 && <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-12 text-center text-sm text-neutral-500">No open rounds right now — new deals appear here the moment a founder starts raising.</div>}
          </div>
          <p className="text-[11px] text-neutral-400 mt-6 text-center">Intros route through Curious Ventures — tap "Request intro" and we'll connect you.</p>
        </main>
      </div>
    );
  }

  if (view === "nodeLogin") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-sm">
          <Brand sub="Network state node" />
          <div className="bg-white border border-neutral-200 rounded-lg p-5 mt-6 space-y-3">
            <div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">Node email</span>
              <input className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm mt-1 focus:outline-none focus:border-neutral-900" value={nodeLoginEmail} onChange={e => setNodeLoginEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && nodeLogin()} placeholder="node@yourstate.xyz" autoFocus />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-neutral-500">Password</span>
              <input type="password" className="w-full border border-neutral-200 rounded-md px-3 py-2 text-sm mt-1 focus:outline-none focus:border-neutral-900" value={nodeLoginPass} onChange={e => setNodeLoginPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && nodeLogin()} placeholder="••••••••" />
            </div>
            {nodeLoginError && <p className="text-xs" style={{ color: RED }}>{nodeLoginError}</p>}
            <button onClick={nodeLogin} className="w-full py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: BLACK }}>Log in</button>
            <p className="text-[11px] text-neutral-400 text-center">One login per state — shared by the community's core team.</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4 mt-3 text-center">
            <p className="text-xs text-neutral-500">Run a network state or community?</p>
            <button onClick={() => { setView("nodeRequest"); setNodeReqError(""); }} className="text-sm font-semibold mt-1" style={{ color: RED }}>Become a node →</button>
          </div>
          <button onClick={() => setView("landing")} className="block mx-auto mt-4 text-xs text-neutral-400 hover:text-neutral-900">← Back</button>
        </div>
      </div>
    );
  }

  if (view === "nodeRequest") {
    const label = "text-[11px] font-semibold tracking-widest uppercase text-neutral-500";
    const input = "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm mt-1 focus:outline-none focus:border-neutral-900";
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-md">
          <Brand sub="Become a trusted node" />
          <div className="bg-white border border-neutral-200 rounded-lg p-5 mt-6">
            <p className="text-sm text-neutral-600">This login belongs to your state, not a person — the core team shares it. Once Curious Ventures approves you, you can add founder leads from your community and they flow straight to our investor network with your state's name on them.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <div className="sm:col-span-2"><span className={label}>Network state / community name *</span><input className={input} value={nodeReq.stateName} onChange={e => setNodeReq({ ...nodeReq, stateName: e.target.value })} placeholder="e.g. Network School, Zu-Grama…" autoFocus /></div>
              <div><span className={label}>Contact person *</span><input className={input} value={nodeReq.contactName} onChange={e => setNodeReq({ ...nodeReq, contactName: e.target.value })} placeholder="Who runs this login" /></div>
              <div><span className={label}>Email *</span><input className={input} type="email" value={nodeReq.email} onChange={e => setNodeReq({ ...nodeReq, email: e.target.value })} placeholder="node@yourstate.xyz" /></div>
              <div className="sm:col-span-2"><span className={label}>Pick a shared password *</span><input className={input} value={nodeReq.password} onChange={e => setNodeReq({ ...nodeReq, password: e.target.value })} placeholder="Your core team will share this" /></div>
            </div>
            {nodeReqError && <p className="text-xs mt-3" style={{ color: RED }}>{nodeReqError}</p>}
            <button onClick={submitNodeRequest} className="w-full mt-4 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: RED }}>Request node access</button>
          </div>
          <button onClick={() => setView("nodeLogin")} className="block mx-auto mt-4 text-xs text-neutral-400 hover:text-neutral-900">← Back to login</button>
        </div>
      </div>
    );
  }

  if (view === "nodeRequestSent") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-md text-center">
          <Brand sub="Request received" />
          <div className="bg-white border border-neutral-200 rounded-lg p-8 mt-6">
            <CheckCircle2 size={32} className="mx-auto" style={{ color: RED }} />
            <h2 className="text-lg font-bold mt-3">Your node request is in</h2>
            <p className="text-sm text-neutral-500 mt-2">Curious Ventures will review and approve your state. Once you're in, log in with the email and password you chose to open your node console.</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => { setView("nodeLogin"); setNodeLoginError(""); }} className="px-5 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: RED }}>Log in</button>
              <button onClick={() => setView("landing")} className="px-5 py-2.5 rounded-md text-sm font-semibold border border-neutral-300 hover:border-neutral-900">Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "founderLogin") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-sm">
          <Brand sub="Founder login" />
          <div className="bg-white border border-neutral-200 rounded-lg p-6 mt-8 space-y-4">
            <div>
              <span className={label}>Email</span>
              <input className={input} type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && founderLogin()} placeholder="you@startup.com" autoFocus />
            </div>
            <div>
              <span className={label}>Password</span>
              <input className={input} type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && founderLogin()} placeholder="••••••••" />
            </div>
            {loginError && <p className="text-xs" style={{ color: RED }}>{loginError}</p>}
            <button onClick={founderLogin} className="w-full py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: BLACK }}>Log in</button>
            <p className="text-[11px] text-neutral-400 text-center">Curious Ventures creates your login. Forgot it, just ask them.</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4 mt-3 text-center">
            <p className="text-xs text-neutral-500">Don't have a login yet?</p>
            <button onClick={() => { setView("founderRequest"); setReqError(""); }} className="text-sm font-semibold mt-1" style={{ color: RED }}>Request access →</button>
          </div>
          <button onClick={() => setView("landing")} className="block mx-auto mt-4 text-xs text-neutral-400 hover:text-neutral-900">← Back</button>
        </div>
      </div>
    );
  }

  if (view === "founderHome" && me) {
    return (
      <div className="min-h-screen bg-neutral-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <header className="bg-white border-b border-neutral-200">
          <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />
              <span className="font-bold tracking-tight">Curious Ventures</span>
            </div>
            <button onClick={founderLogout} className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900">
              <LogOut size={14} /> Log out
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 py-8">
          <p className="text-sm text-neutral-500">Welcome back,</p>
          <h1 className="text-2xl font-bold tracking-tight">{me.founderName}</h1>

          {editingProfile ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-6 mt-5">
              <h2 className="font-semibold text-sm mb-4">Edit your details</h2>
              {ProfileFields()}
              {formError && <p className="text-sm mt-4" style={{ color: RED }}>{formError}</p>}
              <div className="flex items-center gap-3 mt-6">
                <button onClick={saveMyProfile} disabled={saving}
                  className="px-5 py-2.5 rounded-md text-sm font-semibold text-white disabled:opacity-40" style={{ background: BLACK }}>
                  {saving ? "Saving…" : "Save details"}
                </button>
                <button onClick={cancelEditProfile} className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-lg p-6 mt-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-lg font-bold">{me.startupName}</div>
                  {me.oneLiner && <div className="text-sm text-neutral-600 mt-0.5">{me.oneLiner}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge solid={hasRaised(me)}>
                    {hasRaised(me) ? `Raised ${fmtMoney(totalRaised(me))}` : me.fundingStatus}
                  </Badge>
                  <button onClick={startEditProfile} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-neutral-200 hover:border-neutral-900">
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Badge>{me.networkState}</Badge><Badge>{me.category}</Badge><Badge>{me.stage}</Badge>
              </div>

              <FundingSummary f={me} />

              {myImages.length > 0 && (
                <div className="flex gap-3 flex-wrap mt-4">
                  {myImages.map((src, i) => <img key={i} src={src} alt="" className="h-24 rounded-md border border-neutral-200 object-cover" />)}
                </div>
              )}

              <LinkChips f={me} />
            </div>
          )}

          {!editingProfile && (
          <div className="bg-white border border-neutral-200 rounded-lg p-6 mt-5">
            <h2 className="font-semibold text-sm">Post an update</h2>
            <p className="text-xs text-neutral-500 mt-1 mb-3">What's new since last time? Shipped something, hit a milestone, started raising — this is what reaches our LPs.</p>
            <textarea className={input} rows={4} value={myUpdate} onChange={e => { setMyUpdate(e.target.value); setConfirmPost(false); }}
              placeholder="e.g. Crossed 10K weekly active users and opened our pre-seed round." />
            <p className="text-[11px] mt-2 flex items-center gap-1.5" style={{ color: RED }}>
              <Lock size={11} /> Updates are final. Once posted you can't edit or delete them, so give it a quick reread.
            </p>
            {!confirmPost ? (
              <div className="flex items-center gap-3 mt-3">
                <button onClick={() => myUpdate.trim() && setConfirmPost(true)} disabled={!myUpdate.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold text-white disabled:opacity-40" style={{ background: BLACK }}>
                  <Send size={14} /> Post update
                </button>
                {mySaved && <span className="text-sm font-medium" style={{ color: RED }}>Posted ✓</span>}
              </div>
            ) : (
              <div className="mt-3 p-4 rounded-md border" style={{ borderColor: RED, background: "#FDF2F3" }}>
                <p className="text-sm font-semibold">Ready to post? This can't be edited afterward.</p>
                <p className="text-sm text-neutral-700 mt-2 italic">"{myUpdate}"</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={postMyUpdate} disabled={saving}
                    className="px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ background: BLACK }}>Yes, post it</button>
                  <button onClick={() => setConfirmPost(false)} className="px-4 py-2 rounded-md text-sm font-medium border border-neutral-200 hover:border-neutral-900">
                    Let me recheck
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          {!editingProfile && (me.updates || []).length > 0 && (
            <div className="mt-5">
              <h2 className="font-semibold text-sm mb-3">Your updates</h2>
              <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                {(me.updates || []).map((u, i) => (
                  <div key={i} className="p-4">
                    <div className="text-sm text-neutral-700">{u.text}</div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                      {daysAgo(u.date)}
                      {u.by === "admin" && <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-medium">Added by Curious Ventures</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (view === "founderRequest") {
    return (
      <div className="min-h-screen bg-neutral-50 p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="max-w-lg mx-auto">
          <Brand sub="Request access" />
          <div className="bg-white border border-neutral-200 rounded-lg p-6 mt-8 space-y-4">
            <p className="text-sm text-neutral-600">Tell us who you are and pick a password. Once Curious Ventures approves you, log in with this email and password to finish your profile.</p>
            <div>
              <span className={label}>Your name *</span>
              <input className={input} value={reqForm.founderName} onChange={e => setReqForm({ ...reqForm, founderName: e.target.value })} placeholder="Riya Sharma" autoFocus />
            </div>
            <div>
              <span className={label}>Startup name</span>
              <input className={input} value={reqForm.startupName} onChange={e => setReqForm({ ...reqForm, startupName: e.target.value })} placeholder="LoopLabs" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className={label}>Email *</span>
                <input className={input} type="email" value={reqForm.email} onChange={e => setReqForm({ ...reqForm, email: e.target.value })} placeholder="you@startup.com" />
              </div>
              <div>
                <span className={label}>Choose a password *</span>
                <input className={input} value={reqForm.password} onChange={e => setReqForm({ ...reqForm, password: e.target.value })} placeholder="at least 4 characters" />
              </div>
            </div>
            <div>
              <span className={label}>Where did we meet? *</span>
              <select className={input} value={reqForm.networkState} onChange={e => setReqForm({ ...reqForm, networkState: e.target.value })}>
                <option value="" disabled>Select a place…</option>
                {places.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <span className={label}>Anything you'd like to add? (optional)</span>
              <textarea className={input} rows={3} value={reqForm.note} onChange={e => setReqForm({ ...reqForm, note: e.target.value })} placeholder="One line on what you're building." />
            </div>
            {reqError && <p className="text-xs" style={{ color: RED }}>{reqError}</p>}
            <button onClick={submitRequest} className="w-full py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: BLACK }}>Send request</button>
          </div>
          <button onClick={() => setView("founderLogin")} className="block mx-auto mt-4 text-xs text-neutral-400 hover:text-neutral-900">← Back to login</button>
        </div>
      </div>
    );
  }

  if (view === "requestSent") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="text-center max-w-sm">
          <CheckCircle2 size={40} className="mx-auto" style={{ color: RED }} />
          <h2 className="text-xl font-bold mt-4">Request sent.</h2>
          <p className="text-sm text-neutral-500 mt-2">Thanks — Curious Ventures will review and approve you. Once you're in, come back and log in with the email and password you just chose to finish your profile.</p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button onClick={() => { setView("founderLogin"); setLoginError(""); }} className="px-5 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: RED }}>Log in</button>
            <button onClick={() => setView("landing")} className="px-5 py-2.5 rounded-md text-sm font-semibold border border-neutral-300 hover:border-neutral-900">Done</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "founderOnboard" && me) {
    return (
      <div className="min-h-screen bg-neutral-50 p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="max-w-2xl mx-auto">
          <Brand sub="Tell us about your startup" />
          <div className="bg-white border border-neutral-200 rounded-lg p-6 mt-8">
            <p className="text-sm text-neutral-600 mb-5">Welcome, {me.founderName || "founder"} — your login is ready. Fill in your startup below. You can post updates anytime after this.</p>
            {ProfileFields()}
            {formError && <p className="text-sm mt-4" style={{ color: RED }}>{formError}</p>}
            <div className="flex items-center gap-3 mt-6">
              <button onClick={submitOnboarding} disabled={saving}
                className="px-5 py-2.5 rounded-md text-sm font-semibold text-white disabled:opacity-40" style={{ background: BLACK }}>
                {saving ? "Saving…" : "Save my profile"}
              </button>
              <button onClick={founderLogout} className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</button>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 mt-4 text-center">Your info is shared with the Curious Ventures team and may be referenced in LP updates.</p>
        </div>
      </div>
    );
  }

  if (view === "adminGate") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-sm">
          <Brand sub="Team access" />
          <div className="bg-white border border-neutral-200 rounded-lg p-6 mt-8">
            <span className={label}>Passcode</span>
            <input type="password" className={input} value={passInput} onChange={e => setPassInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && adminLogin()} autoFocus />
            {gateError && <p className="text-xs mt-2" style={{ color: RED }}>{gateError}</p>}
            <button onClick={adminLogin} className="w-full mt-4 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: BLACK }}>Enter dashboard</button>
          </div>
          <button onClick={() => setView("landing")} className="block mx-auto mt-4 text-xs text-neutral-400 hover:text-neutral-900">← Back</button>
        </div>
      </div>
    );
  }

  const TabBtn = ({ id, icon: Icon, children }) => (
    <button onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${tab === id ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
      <Icon size={15} /><span className="hidden sm:inline">{children}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} />
              <h1 className="text-lg font-bold tracking-tight">Curious Ventures</h1>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 ml-5">Network State Founder Tracker</p>
          </div>
          <nav className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1 flex-wrap">
            <TabBtn id="dashboard" icon={LayoutDashboard}>LP View</TabBtn>
            <button onClick={() => setTab("activity")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${tab === "activity" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
              <Activity size={15} /><span className="hidden sm:inline">Activity</span>
              {(awaitingOnboarding.length + checkInsDue.length) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: RED }}>{awaitingOnboarding.length + checkInsDue.length}</span>
              )}
            </button>
            <TabBtn id="founders" icon={Users}>Founders</TabBtn>
            <button onClick={() => setTab("tracked")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${tab === "tracked" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
              <Star size={15} /><span className="hidden sm:inline">Tracked</span>
              {pinnedFounders.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "#f59e0b" }}>{pinnedFounders.length}</span>
              )}
            </button>
            {!node && <button onClick={() => setTab("portfolio")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${tab === "portfolio" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
              <Briefcase size={15} /><span className="hidden sm:inline">Portfolio</span>
              {portfolioFounders.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "#0A0A0A" }}>{portfolioFounders.length}</span>
              )}
            </button>}
            {!node && <button onClick={() => setTab("nodes")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${tab === "nodes" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
              <MapPin size={15} /><span className="hidden sm:inline">Nodes</span>
              {pendingNodes.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: RED }}>{pendingNodes.length}</span>
              )}
            </button>}
            {!node && <button onClick={() => setTab("investors")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${tab === "investors" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
              <DollarSign size={15} /><span className="hidden sm:inline">Investors</span>
              {pendingInvestors.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: RED }}>{pendingInvestors.length}</span>
              )}
            </button>}
            <button onClick={() => setTab("requests")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${tab === "requests" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
              <Clock size={15} /><span className="hidden sm:inline">Requests</span>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: RED }}>{pendingRequests.length}</span>
              )}
            </button>
            <TabBtn id="add" icon={Plus}>Add founder</TabBtn>
            {!node && <TabBtn id="places" icon={MapPin}>Places</TabBtn>}
            <TabBtn id="digest" icon={Mail}>Digest</TabBtn>
            {node && <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-md text-white mr-1" style={{ background: RED }}>{node.stateName} · Node</span>}
            {!node && <button onClick={downloadBackup} className="px-3 py-2.5 text-sm text-neutral-400 hover:text-neutral-900" title="Download backup"><Download size={14} /></button>}
            <button onClick={refetchData} className="px-3 py-2.5 text-sm text-neutral-400 hover:text-neutral-900" title="Refresh data"><RefreshCw size={14} /></button>
            <button onClick={() => { setNode(null); setView("landing"); }} className="px-3 py-2.5 text-sm text-neutral-400 hover:text-neutral-900" title={node ? "Log out" : "Lock"}><Lock size={14} /></button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        {tab === "dashboard" && (
          <div>
            <div className="mb-8">
              <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: RED }}>The Network State Signal</p>
              <h2 className="text-2xl font-bold tracking-tight mt-1">Founders sourced from inside the networks</h2>
              <p className="text-sm text-neutral-500 mt-1 max-w-xl">Every founder below was met in person inside a network state community — proprietary dealflow, not cold inbound.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {[
                { icon: Users, label: "Founders met", value: stats.total },
                { icon: DollarSign, label: "Currently raising", value: stats.raising.length },
                { icon: CheckCircle2, label: "Have raised a round", value: stats.funded.length },
                { icon: Globe, label: "Network states", value: Object.keys(stats.states).length },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-neutral-200 rounded-lg p-5">
                  <s.icon size={16} style={{ color: RED }} />
                  <div className="text-3xl font-bold tracking-tight mt-3">{s.value}</div>
                  <div className="text-xs text-neutral-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            {founders.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-12 text-center">
                <p className="text-neutral-500 text-sm">No founders yet. Add your first founder and hand them their login.</p>
                <button onClick={() => setTab("add")} className="mt-4 px-4 py-2 rounded-md text-sm font-medium text-white" style={{ background: BLACK }}>Add a founder</button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <h3 className="text-sm font-semibold mb-3">Raising right now</h3>
                  {stats.raising.length === 0 ? (
                    <div className="bg-white border border-neutral-200 rounded-lg p-6 text-sm text-neutral-500">No one's actively raising at the moment.</div>
                  ) : (
                    <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                      {stats.raising.map(f => {
                        const summary = investorSummary(f);
                        return (
                          <button key={f.id} onClick={() => goToFounder(f)} className="w-full text-left p-4 hover:bg-neutral-50 transition-colors group">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm group-hover:underline">{f.startupName}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>{f.currentRoundType || "Live round"}</span>
                              </div>
                              {Number(f.currentValuation) > 0 && (
                                <span className="text-xs font-semibold text-neutral-700">
                                  {Number(f.currentTarget) > 0 ? `${fmtMoney(f.currentTarget)} @ ` : ""}{fmtMoney(f.currentValuation)} {f.currentInstrument === "Equity" ? "val" : "cap"}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {f.founderName} · {f.networkState}{Number(f.currentEquityPct) > 0 ? ` · ${f.currentEquityPct}% offered` : ""}
                            </div>
                            {Number(f.currentTarget) > 0 && (
                              <div className="mt-1.5">
                                <div className="flex justify-between text-[11px] mb-1">
                                  <span className="text-neutral-500">{fmtMoney(committedAmount(f))} committed</span>
                                  <span className="font-semibold" style={{ color: RED }}>{fmtMoney(remainingToRaise(f))} left</span>
                                </div>
                                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${num(f.currentTarget) > 0 ? Math.min(100, (committedAmount(f) / num(f.currentTarget)) * 100) : 0}%`, background: RED }} />
                                </div>
                              </div>
                            )}
                            {summary && <div className="text-xs text-neutral-400 mt-1.5">Pipeline: {summary}</div>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <h3 className="text-sm font-semibold mb-3 mt-6">Startups that have already raised</h3>
                  {stats.funded.length === 0 ? (
                    <div className="bg-white border border-neutral-200 rounded-lg p-6 text-sm text-neutral-500">No closed rounds logged yet — once a founder records a round, they appear here.</div>
                  ) : (
                    <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                      {stats.funded.map(f => (
                        <button key={f.id} onClick={() => goToFounder(f)} className="w-full text-left p-4 hover:bg-neutral-50 transition-colors group">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-sm group-hover:underline">{f.startupName}</div>
                              <div className="text-xs text-neutral-500 mt-0.5">{f.founderName} · {f.networkState}</div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <div className="text-sm font-bold" style={{ color: RED }}>{fmtMoney(totalRaised(f))}</div>
                              <div className="text-[11px] text-neutral-400">total raised</div>
                            </div>
                          </div>
                          {(f.previousRounds || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                              {(f.previousRounds || []).map((r, i) => (
                                <span key={i} className="text-xs text-neutral-600">
                                  <span className="font-semibold">{r.type}</span> {fmtMoney(r.amount)}{Number(r.valuation) > 0 ? ` @ ${fmtMoney(r.valuation)}${r.instrument === "Equity" ? "" : " cap"}` : ""}{r.year ? ` (${r.year})` : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2 space-y-6">
                  {(stats.totalTarget > 0 || stats.totalCommitted > 0) && (
                    <div className="rounded-lg p-5 text-white" style={{ background: BLACK }}>
                      <div className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#FF8A93" }}>Live raise across the network</div>
                      <div className="text-2xl font-bold mt-2">{fmtMoney(stats.totalTarget)}</div>
                      <div className="text-xs text-neutral-300 mt-1">being raised right now · {fmtMoney(stats.totalCommitted)} already soft-committed</div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Founders met over time</h3>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-end justify-between gap-2 h-24">
                        {stats.months.map((m, i) => {
                          const max = Math.max(1, ...stats.months.map(x => x.c));
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                              <div className="text-[10px] text-neutral-500 mb-1">{m.c || ""}</div>
                              <div className="w-full rounded-t" style={{ height: `${(m.c / max) * 100}%`, minHeight: m.c ? 4 : 0, background: RED }} />
                              <div className="text-[10px] text-neutral-400 mt-1">{m.key}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Founders met out of network states</h3>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
                      {Object.entries(stats.states).sort((a, b) => b[1].count - a[1].count).map(([name, v]) => (
                        <div key={name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-neutral-700 truncate pr-2">{name}</span>
                            <span className="font-semibold">{v.count}{v.raised > 0 ? <span className="font-normal text-neutral-400"> · {v.raised} raised</span> : ""}</span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(v.count / stats.total) * 100}%`, background: BLACK }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3">By stage</h3>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap gap-2">
                      {Object.entries(stats.stageCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                        <span key={name} className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700">{name} <span className="font-bold">{count}</span></span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-3">By thesis category</h3>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap gap-2">
                      {Object.entries(stats.cats).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                        <span key={name} className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700">{name} <span className="font-bold">{count}</span></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "activity" && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold tracking-tight mb-1">Activity</h2>
            <p className="text-sm text-neutral-500 mb-6">Everything happening across your founders, newest first — plus who still needs a nudge.</p>

            {/* Attention: awaiting onboarding */}
            {awaitingOnboarding.length > 0 && (
              <div className="bg-white border rounded-lg p-5 mb-4" style={{ borderColor: "#F4C7CB" }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><UserPlus size={15} style={{ color: RED }} /> Invited, not onboarded yet ({awaitingOnboarding.length})</h3>
                  {awaitingOnboarding.some(f => f.email) && (
                    <button onClick={() => emailGroup(awaitingOnboarding, "nudge")} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-neutral-200 hover:border-neutral-900">
                      <Mail size={12} /> Email all
                    </button>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-1 mb-3">They have a login but haven't filled in their details. Nudge them.</p>
                <div className="space-y-2">
                  {awaitingOnboarding.map(f => {
                    const inviteMsg = `Hey ${(f.founderName || "there").split(" ")[0]}! Just a nudge to set up your Curious Ventures founder profile — log in and add your details.\n\nLink: [paste this dashboard's link]\nEmail: ${f.email}\nPassword: ${f.password}`;
                    return (
                      <div key={f.id} className="flex items-center justify-between gap-3 flex-wrap text-sm">
                        <div>
                          <span className="font-medium">{f.founderName || f.email}</span>
                          <span className="text-xs text-neutral-400 ml-2">invited {daysAgo(f.addedOn)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => copyText(inviteMsg, f.id + "-nudge")} className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-200 hover:border-neutral-900">{copied === f.id + "-nudge" ? "Copied!" : "Copy nudge"}</button>
                          {f.email && <a href={checkInEmail(f)} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1.5 rounded-md text-white" style={{ background: BLACK }}>Email</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attention: check-ins due */}
            {checkInsDue.length > 0 && (
              <div className="bg-white border rounded-lg p-5 mb-4" style={{ borderColor: "#F4C7CB" }}>
                <h3 className="text-sm font-semibold flex items-center gap-2"><Bell size={15} style={{ color: RED }} /> Check-ins due ({checkInsDue.length})</h3>
                <div className="space-y-2 mt-3">
                  {checkInsDue.map(f => (
                    <div key={f.id} className="flex items-center justify-between gap-3 flex-wrap text-sm">
                      <button onClick={() => goToFounder(f)} className="text-left">
                        <span className="font-medium hover:underline">{f.startupName || f.founderName}</span>
                        <span className="text-xs text-neutral-400 ml-2">due {fmtDate(f.checkInDate)}</span>
                      </button>
                      <div className="flex items-center gap-2">
                        {f.email && <a href={checkInEmail(f)} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-200 hover:border-neutral-900">Email</a>}
                        <button onClick={() => markCheckedIn(f.id)} className="text-xs px-2.5 py-1.5 rounded-md text-white" style={{ background: BLACK }}>Mark checked in</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed */}
            {activityFeed.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-12 text-center text-sm text-neutral-500">No activity yet.</div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                {activityFeed.map((ev, i) => (
                  <button key={i} onClick={() => goToFounder(ev.founder)} className="w-full text-left p-4 hover:bg-neutral-50 flex items-start gap-3 group">
                    <div className="mt-0.5">
                      {ev.type === "joined"
                        ? <UserPlus size={15} style={{ color: RED }} />
                        : <StickyNote size={15} className="text-neutral-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {ev.type === "joined" ? (
                        <div className="text-sm"><span className="font-semibold group-hover:underline">{ev.founder.startupName || ev.founder.founderName}</span> <span className="text-neutral-500">joined the tracker</span></div>
                      ) : (
                        <div className="text-sm">
                          <span className="font-semibold group-hover:underline">{ev.founder.startupName || ev.founder.founderName}</span>
                          <span className="text-neutral-700"> — {ev.text}</span>
                          {ev.by === "admin" && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#FDF2F3", color: RED }}>by admin</span>}
                        </div>
                      )}
                      <div className="text-xs text-neutral-400 mt-0.5">{daysAgo(ev.date)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "tracked" && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">{node ? `Highlighted deals (${pinnedFounders.length})` : `Tracked startups (${pinnedFounders.length})`}</h2>
              <p className="text-sm text-neutral-500 mt-0.5">{node ? `Deals ${node.stateName} has flagged for Curious Ventures. Star any founder to highlight them.` : "Your watchlist — the startups you're keeping an eye on. Star any founder to add them here."}</p>
            </div>
            {!node && nodeHighlighted.length > 0 && (
              <div className="mb-6 rounded-lg p-4" style={{ background: "#0A0A0A" }}>
                <div className="text-[11px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: RED }}>★ Highlighted by network states</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {nodeHighlighted.map(f => (
                    <div key={f.id} className="bg-white rounded-lg p-3.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{f.startupName || f.founderName}</div>
                        <div className="text-xs text-neutral-500 truncate">{f.oneLiner || f.founderName}</div>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">★ {f.nodeHighlight}</span>
                      </div>
                      <button onClick={() => goToFounder(f)} className="px-3 py-2 rounded-md text-xs font-medium text-white shrink-0 flex items-center gap-1.5" style={{ background: RED }}>View <ArrowRight size={12} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pinnedFounders.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-12 text-center text-sm text-neutral-500">
                No tracked startups yet. Open the Founders tab and tap the star on anyone you want to watch.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {pinnedFounders.map(f => (
                  <div key={f.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold truncate">{f.startupName || f.founderName || "Founder"}</div>
                        <div className="text-sm text-neutral-600 truncate">{f.founderName}{f.oneLiner ? ` — ${f.oneLiner}` : ""}</div>
                      </div>
                      <button onClick={() => togglePin(f.id)} className="p-1.5 rounded-md text-amber-500 hover:bg-neutral-100 shrink-0" title="Untrack"><Star size={15} fill="currentColor" /></button>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">{[f.networkState, f.category, f.stage].filter(Boolean).join(" · ") || "Profile pending"}</div>
                    {checkInInfo(f) && (
                      <div className="mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${checkInInfo(f).due ? "text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`} style={checkInInfo(f).due ? { background: RED } : {}}>
                          <Bell size={11} /> {checkInInfo(f).text}
                        </span>
                      </div>
                    )}
                    <div className="mt-2">
                      {f.fundingStatus === "Raising now" ? <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>Raising now</span>
                        : hasRaised(f) ? <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-900 text-white">Raised {fmtMoney(totalRaised(f))}</span>
                        : <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{f.fundingStatus || "—"}</span>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-2">
                      <button onClick={() => openShare(f)} className="flex-1 px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900 flex items-center justify-center gap-1.5"><Share2 size={12} /> Share card</button>
                      <button onClick={() => goToFounder(f)} className="px-3 py-2 rounded-md text-xs font-medium text-white flex items-center gap-1.5" style={{ background: BLACK }}>Details <ArrowRight size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "founders" && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">All founders ({filtered.length}{filtersOn || search ? ` of ${activeFounders.length}` : ""})</h2>
              <div className="flex items-center gap-2">
                {activeFounders.some(f => f.email) && (
                  <button onClick={() => emailGroup(activeFounders, "general")} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-neutral-200 hover:border-neutral-900">
                    <Mail size={14} /> Email approved
                  </button>
                )}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search startup, founder, email…"
                    className="pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-md text-sm w-64 focus:outline-none focus:border-neutral-900" />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <select value={fCat} onChange={e => setFCat(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
                <option value="">Category: all</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={fStage} onChange={e => setFStage(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
                <option value="">Stage: all</option>
                {STAGES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={fFund} onChange={e => setFFund(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
                <option value="">Funding: all</option>
                {FUNDING_STATUS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={fPlace} onChange={e => setFPlace(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
                <option value="">Place: all</option>
                {places.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {!node && (
                <select value={fOrigin} onChange={e => setFOrigin(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
                  <option value="">Source: all</option>
                  <option value="__direct">Direct</option>
                  <option value="__highlighted">★ Highlighted by nodes</option>
                  {[...new Set(founders.map(f => f.origin).filter(Boolean))].map(o => <option key={o} value={o}>via {o}</option>)}
                </select>
              )}
              <select value={fSort} onChange={e => setFSort(e.target.value)} className="text-xs border border-neutral-200 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:border-neutral-900">
                <option value="updated">Sort: recently updated</option>
                <option value="newest">Sort: newest</option>
                <option value="raising">Sort: raising first</option>
                <option value="az">Sort: A–Z</option>
              </select>
            </div>
            {(filtersOn || search) && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[11px] uppercase tracking-wide text-neutral-400 font-semibold">Active:</span>
                {search && <button onClick={() => setSearch("")} className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-white flex items-center gap-1.5">"{search}" <X size={11} /></button>}
                {fCat && <button onClick={() => setFCat("")} className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-white flex items-center gap-1.5">{fCat} <X size={11} /></button>}
                {fStage && <button onClick={() => setFStage("")} className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-white flex items-center gap-1.5">{fStage} <X size={11} /></button>}
                {fFund && <button onClick={() => setFFund("")} className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-white flex items-center gap-1.5">{fFund} <X size={11} /></button>}
                {fPlace && <button onClick={() => setFPlace("")} className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-white flex items-center gap-1.5">{fPlace} <X size={11} /></button>}
                {fOrigin && <button onClick={() => setFOrigin("")} className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-white flex items-center gap-1.5">{fOrigin === "__direct" ? "Direct" : fOrigin === "__highlighted" ? "★ Highlighted" : `via ${fOrigin}`} <X size={11} /></button>}
                <button onClick={() => { clearFilters(); setSearch(""); }} className="text-xs font-bold" style={{ color: RED }}>Clear all — show all founders</button>
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-12 text-center text-sm text-neutral-500">
                {activeFounders.length === 0 ? "Nothing yet — add your first founder from the Add tab." : (
                  <>
                    No founders match these filters.
                    <button onClick={() => { clearFilters(); setSearch(""); }} className="block mx-auto mt-3 text-sm font-bold" style={{ color: RED }}>Clear all filters — show all {activeFounders.length} founders</button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                            {filtered.map(f => renderFounderCard(f))}
              </div>
            )}
          </div>
        )}

        {tab === "requests" && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold tracking-tight mb-1">Access requests {pendingRequests.length > 0 && <span style={{ color: RED }}>({pendingRequests.length})</span>}</h2>
            <p className="text-sm text-neutral-500 mb-6">Founders who asked to join via the app link. Approve them to let them log in and onboard, or decline to remove the request.</p>
            {pendingRequests.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-12 text-center text-sm text-neutral-500">
                No pending requests. Share the app link and the "Request access" option with founders you've met.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(r => {
                  const approveMsg = `Hey ${(r.founderName || "there").split(" ")[0]}! You're approved for the Curious Ventures founder tracker. Log in with the email and password you chose to finish your profile:\n\nLink: [paste this dashboard's link]\nEmail: ${r.email}`;
                  return (
                    <div key={r.id} className="bg-white border border-neutral-200 rounded-lg p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="font-bold">{r.founderName}{r.startupName ? ` · ${r.startupName}` : ""}</div>
                          <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1"><Mail size={11} /> {r.email}</div>
                          {r.networkState && <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><MapPin size={11} /> {r.networkState}</div>}
                          {r.note && <div className="text-sm text-neutral-600 mt-2 italic">"{r.note}"</div>}
                          <div className="text-[11px] text-neutral-400 mt-2">Requested {daysAgo(r.requestedOn || r.addedOn)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {confirmDelete === r.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => declineRequest(r.id)} className="text-xs px-2 py-1.5 rounded text-white" style={{ background: RED }}>Decline</button>
                              <button onClick={() => setConfirmDelete(null)} className="p-2 text-neutral-400"><X size={15} /></button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(r.id)} className="text-xs px-3 py-2 rounded-md border border-neutral-200 hover:border-red-500 hover:text-red-600">Decline</button>
                          )}
                          <button onClick={() => approveRequest(r.id)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-md text-white font-semibold" style={{ background: BLACK }}>
                            <CheckCircle2 size={13} /> Approve
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-neutral-100">
                        <button onClick={() => copyText(approveMsg, r.id + "-app")} className="text-xs px-3 py-1.5 rounded-md border border-neutral-200 hover:border-neutral-900 flex items-center gap-1.5">
                          <Copy size={12} /> {copied === r.id + "-app" ? "Copied!" : "Copy approval message"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "add" && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold tracking-tight mb-1">{adminEditingId ? "Edit founder" : "Add a founder"}</h2>
            <p className="text-sm text-neutral-500 mb-5">{adminEditingId ? "Update their details below." : "Create their login. Either fill in their details yourself, or just invite them and let them fill it in when they log in."}</p>

            {!adminEditingId && (
              <div className="flex gap-2 mb-6">
                <button onClick={() => setAddMode("full")}
                  className={`flex-1 text-left p-3 rounded-lg border ${addMode === "full" ? "border-neutral-900 bg-white" : "border-neutral-200 bg-neutral-50"}`}>
                  <div className="text-sm font-semibold">I'll add the details</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Fill everything in now.</div>
                </button>
                <button onClick={() => setAddMode("invite")}
                  className={`flex-1 text-left p-3 rounded-lg border ${addMode === "invite" ? "border-neutral-900 bg-white" : "border-neutral-200 bg-neutral-50"}`}>
                  <div className="text-sm font-semibold">Just invite them</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Founder fills it in on first login.</div>
                </button>
              </div>
            )}

            <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-5">
              {addMode === "full" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div><span className={label}>Founder name *</span>
                  <input className={input} value={form.founderName} onChange={e => setForm({ ...form, founderName: e.target.value })} placeholder="Riya Sharma" /></div>
                <div><span className={label}>Startup name *</span>
                  <input className={input} value={form.startupName} onChange={e => setForm({ ...form, startupName: e.target.value })} placeholder="LoopLabs" /></div>
              </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-md border border-neutral-200 bg-neutral-50">
                <div className="sm:col-span-2 text-[11px] font-semibold tracking-widest uppercase text-neutral-500 flex items-center gap-1.5"><Lock size={11} /> Founder login</div>
                <div><span className={label}>Email *</span>
                  <input className={input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="founder@startup.com" /></div>
                <div><span className={label}>Password *</span>
                  <input className={input} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="set a simple password" /></div>
                <p className="sm:col-span-2 text-[11px] text-neutral-400">They use these to log in. After saving, hit "Copy login details" on their card to send it over.</p>
              </div>

              {addMode === "invite" && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><span className={label}>Founder name (optional)</span>
                    <input className={input} value={form.founderName} onChange={e => setForm({ ...form, founderName: e.target.value })} placeholder="So you recognize them" /></div>
                  <div><span className={label}>Where did you meet? (optional)</span>
                    <input className={input} value={form.metAt} onChange={e => setForm({ ...form, metAt: e.target.value })} placeholder="NS July cohort, Bali pitch night…" /></div>
                  <p className="sm:col-span-2 text-[11px] text-neutral-400">That's all you need — the founder adds their startup, links, and images when they first log in.</p>
                </div>
              )}

              {addMode === "full" && (<>
              <div><span className={label}>One-liner</span>
                <input className={input} value={form.oneLiner} onChange={e => setForm({ ...form, oneLiner: e.target.value })} placeholder="AI copilot for creator monetization" /></div>

              <div><span className={label}>Where did you meet them? *</span>
                <select className={input} value={form.networkState} onChange={e => setForm({ ...form, networkState: e.target.value })}>
                  <option value="" disabled>Select a place…</option>
                  {places.map(n => <option key={n}>{n}</option>)}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1.5">Manage this list in the Places tab.</p></div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div><span className={label}>Category</span>
                  <select className={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><span className={label}>Stage</span>
                  <select className={input} value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}>{STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><span className={label}>Funding status</span>
                  <select className={input} value={form.fundingStatus} onChange={e => setForm({ ...form, fundingStatus: e.target.value })}>{FUNDING_STATUS.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>

              {renderFundingDetails(false)}

              <div className="grid sm:grid-cols-3 gap-4">
                <div><span className={label}>Website</span>
                  <input className={input} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="startup.com" /></div>
                <div><span className={label}>App / product link</span>
                  <input className={input} value={form.appLink} onChange={e => setForm({ ...form, appLink: e.target.value })} placeholder="App Store, demo…" /></div>
                <div><span className={label}>Deck / docs link</span>
                  <input className={input} value={form.docsLink} onChange={e => setForm({ ...form, docsLink: e.target.value })} placeholder="Notion, Drive, DocSend…" /></div>
              </div>

              <div><span className={label}>X / Twitter</span>
                <input className={input} value={form.twitter} onChange={e => setForm({ ...form, twitter: e.target.value })} placeholder="@handle" /></div>

              <div>
                <span className={label}>Images — logo, product screenshots (up to 3)</span>
                <div className="flex flex-wrap gap-3">
                  {formImages.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt="" className="w-24 h-24 object-cover rounded-md border border-neutral-200" />
                      <button onClick={() => setFormImages(formImages.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 bg-neutral-900 text-white rounded-full p-1"><X size={11} /></button>
                    </div>
                  ))}
                  {formImages.length < 3 && (
                    <label className="w-24 h-24 border-2 border-dashed border-neutral-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-neutral-900 text-neutral-400 hover:text-neutral-900">
                      <ImageIcon size={18} /><span className="text-[10px] mt-1">Add image</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => { handleImageFiles(e.target.files); e.target.value = ""; }} />
                    </label>
                  )}
                </div>
                {imgError && <p className="text-xs mt-1.5" style={{ color: RED }}>{imgError}</p>}
              </div>

              <div><span className={label}>Latest update</span>
                <textarea className={input} rows={3} value={form.latestUpdate} onChange={e => setForm({ ...form, latestUpdate: e.target.value })} placeholder="What are they working on right now?" /></div>
              </>)}

              {formError && <p className="text-sm" style={{ color: RED }}>{formError}</p>}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={saveFounder} disabled={saving}
                  className="px-5 py-2.5 rounded-md text-sm font-semibold text-white disabled:opacity-40" style={{ background: BLACK }}>
                  {saving ? "Saving…" : adminEditingId ? "Save changes" : addMode === "invite" ? "Create invite" : "Add founder"}
                </button>
                {adminEditingId && <button onClick={() => { setAdminEditingId(null); setForm({ ...EMPTY_FOUNDER }); setFormImages([]); setFormError(""); }} className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</button>}
              </div>
            </div>
          </div>
        )}

        {!node && tab === "places" && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold tracking-tight mb-1">Places you've visited</h2>
            <p className="text-sm text-neutral-500 mb-6">These are the only options founders can pick from when they say where they met you. They also drive the network-state breakdown on the LP View.</p>

            <div className="bg-white border border-neutral-200 rounded-lg p-5 mb-6">
              <span className={label}>Add a place</span>
              <div className="flex gap-2">
                <input className={input} value={newPlace} onChange={e => setNewPlace(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addPlace()} placeholder="e.g. Edge City Lanna, Zuzalu, Dubai…" />
                <button onClick={addPlace} className="px-4 py-2 rounded-md text-sm font-semibold text-white whitespace-nowrap" style={{ background: RED }}>Add place</button>
              </div>
            </div>

            {places.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-10 text-center text-sm text-neutral-500">No places yet — add the first one above.</div>
            ) : (
              <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
                {places.map(p => {
                  const used = placeUsage(p);
                  return (
                    <div key={p} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-neutral-400" />
                        <span className="font-medium text-sm">{p}</span>
                        {used > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{used} founder{used > 1 ? "s" : ""}</span>}
                      </div>
                      {confirmDelete === "place-" + p ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { removePlace(p); setConfirmDelete(null); }} className="text-xs px-2 py-1 rounded text-white" style={{ background: RED }}>Remove</button>
                          <button onClick={() => setConfirmDelete(null)} className="p-2 text-neutral-400"><X size={15} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete("place-" + p)} className="p-2 text-neutral-400 hover:text-red-600 rounded-md hover:bg-neutral-100" title="Remove"><Trash2 size={15} /></button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-neutral-400 mt-3">Removing a place won't change founders already tagged with it — they keep the label, it just stops appearing as a new option.</p>
          </div>
        )}

        {!node && tab === "portfolio" && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">Portfolio ({fundStats.count})</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Companies Curious Ventures has invested in — deal terms, memos, documents, and marks.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { k: "Deployed", v: fmtMoney(fundStats.deployed) },
                { k: "Portfolio value", v: fmtMoney(fundStats.value) },
                { k: "Blended MOIC", v: fundStats.moic ? `${fundStats.moic.toFixed(2)}x` : "—" },
                { k: "Companies", v: fundStats.count },
              ].map(x => (
                <div key={x.k} className="bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="text-xl font-extrabold" style={{ color: RED }}>{x.v}</div>
                  <div className="text-[11px] uppercase tracking-wide text-neutral-400 mt-0.5">{x.k}</div>
                </div>
              ))}
            </div>
            {portfolioFounders.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-12 text-center text-sm text-neutral-500">
                No investments yet. When you close a deal, open the founder's card and tap "Mark as invested".
              </div>
            ) : (
              <div className="space-y-4">
                {portfolioFounders.map(f => renderFounderCard(f, { portfolio: true }))}
              </div>
            )}
          </div>
        )}

        {!node && tab === "nodes" && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">Network state nodes ({activeNodes.length})</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Trusted communities that originate deal flow. One shared login per state.</p>
            </div>

            {pendingNodes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold mb-2">Node requests ({pendingNodes.length})</h3>
                <div className="space-y-2">
                  {pendingNodes.map(n => (
                    <div key={n.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{n.stateName}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">Contact: {n.contactName}</div>
                        <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Mail size={11} /> {n.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => approveNode(n.id)} className="px-3 py-2 rounded-md text-xs font-semibold text-white" style={{ background: RED }}>Approve node</button>
                        <button onClick={() => declineNode(n.id)} className="px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-sm font-bold mb-2">Active nodes</h3>
            {activeNodes.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-10 text-center text-sm text-neutral-500">
                No nodes yet. When you meet a community's core team, send them to house.curiousventures.xyz → "Network State Login" → "Become a node".
              </div>
            ) : (
              <div className="space-y-2">
                {activeNodes.map(n => (
                  <div key={n.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-2">{n.stateName}
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{nodeOriginCount(n.stateName)} lead{nodeOriginCount(n.stateName) === 1 ? "" : "s"} originated</span>
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">Contact: {n.contactName}</div>
                      <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Mail size={11} /> {n.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyText(nodeApprovalMsg(n), `node-${n.id}`)} className="px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900 flex items-center gap-1.5">
                        <Copy size={12} /> {copied === `node-${n.id}` ? "Copied!" : "Copy welcome msg"}
                      </button>
                      <button onClick={() => declineNode(n.id)} className="p-2 rounded-md text-neutral-400 hover:text-red-600" title="Remove node"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!node && tab === "investors" && (
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">Investors ({activeInvestors.length})</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Approve access requests, see your investor network, and handle intro requests.</p>
            </div>

            {pendingInvestors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold mb-2">Access requests ({pendingInvestors.length})</h3>
                <div className="space-y-2">
                  {pendingInvestors.map(i => (
                    <div key={i.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{i.name}{i.firm ? ` · ${i.firm}` : ""}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{[i.focus, i.checkSize].filter(Boolean).join(" · ") || "No focus given"}</div>
                        <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Mail size={11} /> {i.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => approveInvestor(i.id)} className="px-3 py-2 rounded-md text-xs font-semibold text-white" style={{ background: RED }}>Approve</button>
                        <button onClick={() => declineInvestor(i.id)} className="px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900">Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {connects.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold mb-2">Intro requests ({connects.length})</h3>
                <div className="space-y-2">
                  {connects.map(c => (
                    <div key={c.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm">
                        <span className="font-semibold">{c.investorName}</span>{c.investorFirm ? ` (${c.investorFirm})` : ""} wants an intro to <span className="font-semibold">{c.startupName}</span>
                        <span className="text-xs text-neutral-400 ml-2">{daysAgo(c.date)}</span>
                      </div>
                      <button onClick={() => removeConnect(c.id)} className="px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900">Mark handled</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="text-sm font-bold mb-2">Approved investors</h3>
            {activeInvestors.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-10 text-center text-sm text-neutral-500">
                No investors yet. Send them to house.curiousventures.xyz — they tap "Investor Login" and request access.
              </div>
            ) : (
              <div className="space-y-2">
                {activeInvestors.map(i => (
                  <div key={i.id} className="bg-white border border-neutral-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{i.name}{i.firm ? ` · ${i.firm}` : ""}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{[i.focus, i.checkSize].filter(Boolean).join(" · ") || "No focus given"}</div>
                      <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Mail size={11} /> {i.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyText(investorApprovalMsg(i), `inv-${i.id}`)} className="px-3 py-2 rounded-md text-xs font-medium border border-neutral-200 hover:border-neutral-900 flex items-center gap-1.5">
                        <Copy size={12} /> {copied === `inv-${i.id}` ? "Copied!" : "Copy login msg"}
                      </button>
                      <button onClick={() => declineInvestor(i.id)} className="p-2 rounded-md text-neutral-400 hover:text-red-600" title="Remove investor"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "digest" && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold tracking-tight mb-1">LP digest generator</h2>
            <p className="text-sm text-neutral-500 mb-5">Auto-drafted from tracked founders and the updates they post. Copy, personalize the first name, send.</p>
            <div className="flex items-center gap-2 mb-4">
              {[{ d: 7, l: "Weekly" }, { d: 14, l: "Biweekly" }].map(o => (
                <button key={o.d} onClick={() => setDigestPeriod(o.d)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${digestPeriod === o.d ? "text-white" : "bg-white border border-neutral-200 text-neutral-600"}`}
                  style={digestPeriod === o.d ? { background: BLACK } : {}}>{o.l}</button>
              ))}
              <button onClick={() => { copyText(digestText, "digest"); setDigestCopied(true); setTimeout(() => setDigestCopied(false), 2000); }}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold text-white" style={{ background: RED }}>
                <Copy size={14} /> {digestCopied ? "Copied!" : "Copy email"}
              </button>
            </div>
            <textarea readOnly value={digestText} rows={22} className="w-full bg-white border border-neutral-200 rounded-lg p-5 text-sm font-mono text-neutral-800 focus:outline-none" />
            <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1.5"><Clock size={12} /> Pulls founders added and updates posted in the last {digestPeriod} days.</p>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-5 py-6 text-[11px] text-neutral-400 flex items-center gap-1.5">
        <Eye size={11} /> Shared workspace — founder data and logins live in shared storage.
      </footer>

      {investPanel && investDraft && (() => {
        const f = founders.find(x => x.id === investPanel);
        if (!f) return null;
        const iL = "text-[11px] font-semibold tracking-widest uppercase text-neutral-500";
        const iI = "w-full border border-neutral-200 rounded-md px-3 py-2 text-sm mt-1 focus:outline-none focus:border-neutral-900";
        const D = investDraft;
        const set = (patch) => setInvestDraft({ ...D, ...patch });
        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-auto" onClick={() => { setInvestPanel(null); setInvestDraft(null); }}>
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full my-8" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: RED }}>Investment record</div>
                  <h2 className="text-lg font-bold mt-0.5">{f.startupName || f.founderName}</h2>
                </div>
                <button onClick={() => { setInvestPanel(null); setInvestDraft(null); }} className="p-1 text-neutral-400 hover:text-neutral-900"><X size={18} /></button>
              </div>

              <div className="mt-5">
                <div className="text-sm font-bold flex items-center gap-2"><DollarSign size={14} style={{ color: RED }} /> The deal</div>
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                  <div><span className={iL}>Amount (USD) *</span><input className={iI} value={D.deal.amount} onChange={e => set({ deal: { ...D.deal, amount: e.target.value } })} placeholder="100000" /></div>
                  <div><span className={iL}>Instrument</span>
                    <select className={iI} value={D.deal.instrument} onChange={e => set({ deal: { ...D.deal, instrument: e.target.value } })}>
                      {["SAFE", "Equity", "SAFT", "Convertible note", "Other"].map(x => <option key={x}>{x}</option>)}
                    </select></div>
                  <div><span className={iL}>Round</span><input className={iI} value={D.deal.roundName} onChange={e => set({ deal: { ...D.deal, roundName: e.target.value } })} placeholder="Pre-seed" /></div>
                  <div><span className={iL}>Valuation / cap</span><input className={iI} value={D.deal.valuation} onChange={e => set({ deal: { ...D.deal, valuation: e.target.value } })} placeholder="10000000" /></div>
                  <div><span className={iL}>Valuation type</span>
                    <select className={iI} value={D.deal.valuationType} onChange={e => set({ deal: { ...D.deal, valuationType: e.target.value } })}>
                      {["Post-money cap", "Pre-money", "Post-money"].map(x => <option key={x}>{x}</option>)}
                    </select></div>
                  <div><span className={iL}>Ownership %</span><input className={iI} value={D.deal.ownershipPct} onChange={e => set({ deal: { ...D.deal, ownershipPct: e.target.value } })} placeholder="1.0" /></div>
                  <div><span className={iL}>Discount %</span><input className={iI} value={D.deal.discount} onChange={e => set({ deal: { ...D.deal, discount: e.target.value } })} placeholder="0" /></div>
                  <div><span className={iL}>Date</span><input type="date" className={iI} value={D.deal.date} onChange={e => set({ deal: { ...D.deal, date: e.target.value } })} /></div>
                  <div><span className={iL}>Co-investors</span><input className={iI} value={D.deal.coInvestors} onChange={e => set({ deal: { ...D.deal, coInvestors: e.target.value } })} placeholder="Polaris, angels" /></div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-bold flex items-center gap-2"><StickyNote size={14} style={{ color: RED }} /> Investment memo <span className="text-[10px] font-normal text-neutral-400 normal-case">(private to you)</span></div>
                <div className="space-y-3 mt-3">
                  <div><span className={iL}>Why we're investing *</span><textarea rows={2} className={iI} value={D.memo.why} onChange={e => set({ memo: { ...D.memo, why: e.target.value } })} placeholder="The core reason this deal, this founder, now." /></div>
                  <div><span className={iL}>Thesis fit</span><input className={iI} value={D.memo.thesisFit} onChange={e => set({ memo: { ...D.memo, thesisFit: e.target.value } })} placeholder="Which Behavioral Fork pillar this rides" /></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><span className={iL}>Key risks</span><textarea rows={2} className={iI} value={D.memo.risks} onChange={e => set({ memo: { ...D.memo, risks: e.target.value } })} placeholder="What kills this" /></div>
                    <div><span className={iL}>What must be true in 18 months</span><textarea rows={2} className={iI} value={D.memo.mustBeTrue} onChange={e => set({ memo: { ...D.memo, mustBeTrue: e.target.value } })} placeholder="The milestones that validate the bet" /></div>
                  </div>
                  <div><span className={iL}>Expected outcome</span><input className={iI} value={D.memo.expectedOutcome} onChange={e => set({ memo: { ...D.memo, expectedOutcome: e.target.value } })} placeholder="e.g. 10–20x on a $50M+ outcome" /></div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-bold flex items-center gap-2"><FileText size={14} style={{ color: RED }} /> Documents <span className="text-[10px] font-normal text-neutral-400 normal-case">(links to DocuSign / Drive)</span></div>
                <div className="space-y-2 mt-3">
                  {D.docs.map((d, i) => (
                    <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
                      <input className="border border-neutral-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-neutral-900" value={d.label} onChange={e => set({ docs: D.docs.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} placeholder="Document name" />
                      <input className="border border-neutral-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-neutral-900" value={d.url} onChange={e => set({ docs: D.docs.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })} placeholder="https:// link to the doc" />
                      <select className="border border-neutral-200 rounded-md px-2 py-2 text-xs focus:outline-none focus:border-neutral-900" value={d.status} onChange={e => set({ docs: D.docs.map((x, j) => j === i ? { ...x, status: e.target.value } : x) })}>
                        {["Draft", "Sent", "Signed"].map(x => <option key={x}>{x}</option>)}
                      </select>
                    </div>
                  ))}
                  <button onClick={() => set({ docs: [...D.docs, { label: "", url: "", status: "Draft" }] })} className="text-xs font-semibold" style={{ color: RED }}>+ Add document</button>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-bold flex items-center gap-2"><CheckCircle2 size={14} style={{ color: RED }} /> Closing checklist</div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[["termSheet", "Term sheet sent"], ["docsSigned", "Docs signed"], ["wired", "Money wired"], ["confirmed", "Confirmation received"]].map(([k, lbl]) => (
                    <button key={k} onClick={() => set({ checklist: { ...D.checklist, [k]: !D.checklist[k] } })}
                      className={`text-xs px-3 py-2 rounded-md border font-medium ${D.checklist[k] ? "text-white border-transparent" : "border-neutral-200 text-neutral-600 hover:border-neutral-900"}`}
                      style={D.checklist[k] ? { background: "#0A0A0A" } : {}}>
                      {D.checklist[k] ? "✓ " : ""}{lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-7 pt-4 border-t border-neutral-100">
                <button onClick={saveInvest} disabled={!D.deal.amount || !D.memo.why}
                  className={`px-5 py-2.5 rounded-md text-sm font-semibold text-white ${(!D.deal.amount || !D.memo.why) ? "opacity-40" : ""}`} style={{ background: RED }}>
                  {f.invested ? "Save changes" : "Confirm investment"}
                </button>
                <button onClick={() => { setInvestPanel(null); setInvestDraft(null); }} className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</button>
                {(!D.deal.amount || !D.memo.why) && <span className="text-[11px] text-neutral-400">Amount and "why" are required — future you will thank you.</span>}
              </div>
            </div>
          </div>
        );
      })()}

      {shareFounder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-auto" onClick={() => setShareFounder(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Share card</span>
              <button onClick={() => setShareFounder(null)} className="p-1 text-neutral-400 hover:text-neutral-900"><X size={18} /></button>
            </div>
            <div ref={cardRef} style={{ width: "100%", background: "#0A0A0A", color: "#fff", borderRadius: 18, padding: 26, fontFamily: "'Inter', system-ui, sans-serif", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 99, background: RED }} />
                  <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#9a9a9a", fontWeight: 700 }}>Curious Ventures</span>
                </div>
                <span style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: RED, fontWeight: 700 }}>
                  {shareFounder.fundingStatus === "Raising now" ? "Raising now" : hasRaised(shareFounder) ? "Funded" : "On our radar"}
                </span>
              </div>
              {shareImg && <img src={shareImg} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12, marginTop: 18, display: "block" }} />}
              <div style={{ marginTop: 18, fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>{shareFounder.startupName || shareFounder.founderName || "Startup"}</div>
              {shareFounder.founderName && <div style={{ marginTop: 5, fontSize: 13, color: "#b5b5b5" }}>{shareFounder.founderName}</div>}
              {shareFounder.oneLiner && <div style={{ marginTop: 12, fontSize: 14, color: "#e2e2e2", lineHeight: 1.45 }}>{shareFounder.oneLiner}</div>}
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 7 }}>
                {[shareFounder.stage, shareFounder.category, shareFounder.networkState].filter(Boolean).map((t, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 99, background: "#1b1b1b", color: "#cccccc" }}>{t}</span>
                ))}
              </div>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #232323", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: shareFounder.fundingStatus === "Raising now" ? RED : "#e2e2e2" }}>
                  {shareFounder.fundingStatus === "Raising now" ? `Raising${shareFounder.currentTarget ? ` ${fmtMoney(shareFounder.currentTarget)}` : ""}` : hasRaised(shareFounder) ? `Raised ${fmtMoney(totalRaised(shareFounder))}` : (shareFounder.fundingStatus || "")}
                </span>
                <span style={{ fontSize: 11, color: "#777" }}>house.curiousventures.xyz</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button onClick={shareCard} className="flex-1 py-2.5 rounded-md text-sm font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: RED }}><Share2 size={14} /> Share</button>
              <button onClick={downloadCard} className="flex-1 py-2.5 rounded-md text-sm font-semibold border border-neutral-300 hover:border-neutral-900 flex items-center justify-center gap-1.5"><Download size={14} /> Download</button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 text-center">Send this to introduce {shareFounder.startupName || "this startup"} to someone in your network.</p>
          </div>
        </div>
      )}
    </div>
  );
}
