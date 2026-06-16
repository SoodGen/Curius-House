import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users, Globe, DollarSign, Plus, Search, Mail, CheckCircle2, Clock, Pencil,
  Trash2, X, Copy, Eye, LayoutDashboard, RefreshCw,
  Image as ImageIcon, ArrowRight, Lock, ExternalLink, FileText, Smartphone, LogOut, Send, MapPin,
  Mic, Square, Activity, Calendar, Bell, StickyNote, UserPlus
} from "lucide-react";
import { storage } from "./supabase";

const K_FOUNDERS = "cv-founders-v3";
const K_ADMIN = "cv-admin-v1";
const K_PLACES = "cv-places-v1";
const K_IMG = (id) => `cv-img-${id}`;
const K_NOTE = (id) => `cv-note-${id}`;

const blobToDataUrl = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(blob);
});
const isoDate = (d) => d.toISOString().slice(0, 10);
const todayISO = () => isoDate(new Date());

const CATEGORIES = ["Consumer AI", "Consumer Web3", "Creator Economy", "Micro-earning", "Other"];
const STAGES = ["Idea", "MVP", "Pre-seed", "Seed", "Series A+"];
const FUNDING_STATUS = ["Not raised", "Raising now", "Funded"];
const INVESTOR_STATUS = ["In conversation", "Soft commitment", "Term sheet", "Invested", "Passed"];
const ROUND_TYPES = ["Angel", "Pre-seed", "Seed", "Series A", "Bridge", "Grant", "Other"];
const INSTRUMENTS = ["Equity", "SAFE", "SAFT", "Convertible note", "Other"];

const DEFAULT_PLACES = ["Network School (Forest City)", "Bali"];

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

const fmtMoney = (n) => {
  const v = Number(n) || 0;
  if (v >= 1000000) return `$${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return v > 0 ? `$${v}` : "$0";
};
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

export default function CuriousDashboard() {
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
    let [f, a, p] = await Promise.all([sGet(K_FOUNDERS, []), sGet(K_ADMIN, null), sGet(K_PLACES, null)]);
    if (!a) { a = { passcode: "1234", createdOn: new Date().toISOString() }; await sSet(K_ADMIN, a); }
    if (!p) { p = [...DEFAULT_PLACES]; await sSet(K_PLACES, p); }
    setFounders(f); setAdminCfg(a); setPlaces(p); setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  // Preload founder images for admin cards
  useEffect(() => {
    if (view !== "admin") return;
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
  const persistPlaces = async (next) => { setPlaces(next); await sSet(K_PLACES, next); };

  const addPlace = async () => {
    const name = newPlace.trim();
    if (!name) return;
    if (places.some(p => p.toLowerCase() === name.toLowerCase())) { setNewPlace(""); return; }
    await persistPlaces([...places, name]);
    setNewPlace("");
  };
  const removePlace = async (name) => { await persistPlaces(places.filter(p => p !== name)); };
  const placeUsage = (name) => founders.filter(f => f.networkState === name).length;

  const activeFounders = useMemo(() => founders.filter(f => f.approved !== false), [founders]);
  const pendingRequests = useMemo(() => founders.filter(f => f.approved === false).sort((a, b) => new Date(b.addedOn) - new Date(a.addedOn)), [founders]);

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
    return activeFounders
      .filter(f => !q || [f.startupName, f.founderName, f.networkState, f.category, f.email].some(v => (v || "").toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }, [activeFounders, search]);

  const founderLogin = async () => {
    const email = cleanEmail(loginEmail);
    const f = founders.find(x => cleanEmail(x.email) === email);
    if (!f || !f.password || f.password !== loginPass) { setLoginError("Email or password not recognized. Check with Sood."); return; }
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
    if (!reqForm.networkState) { setReqError("Please pick where you met Sood."); return; }
    if (founders.find(f => cleanEmail(f.email) === cleanEmail(reqForm.email))) { setReqError("That email already has an account or a pending request."); return; }
    const now = new Date().toISOString();
    const entry = {
      ...EMPTY_FOUNDER, ...reqForm, email: cleanEmail(reqForm.email),
      id: uid(), addedOn: now, lastUpdated: now,
      approved: false, profileComplete: false, requestedOn: now, updates: []
    };
    await persistFounders([entry, ...founders]);
    setReqForm({ founderName: "", startupName: "", email: "", password: "", networkState: "", metAt: "", note: "" });
    setView("requestSent");
  };

  const approveRequest = async (id) => {
    const now = new Date().toISOString();
    await persistFounders(founders.map(f => f.id === id ? { ...f, approved: true, approvedOn: now } : f));
  };
  const declineRequest = async (id) => {
    await persistFounders(founders.filter(f => f.id !== id));
    setConfirmDelete(null);
  };
  const founderLogout = () => { setMe(null); setLoginEmail(""); setLoginPass(""); setForm({ ...EMPTY_FOUNDER }); setFormImages([]); setEditingProfile(false); setConfirmPost(false); setView("landing"); };

  const submitOnboarding = async () => {
    setFormError("");
    if (!form.founderName.trim() || !form.startupName.trim()) { setFormError("Please add your name and startup name."); return; }
    if (!form.networkState) { setFormError("Please pick where you met Sood."); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const updated = {
      ...me, ...form, email: me.email, password: me.password, profileComplete: true,
      completedOn: me.completedOn || now,
      imageCount: formImages.length, lastUpdated: now,
      updates: form.latestUpdate.trim() && form.latestUpdate !== me.latestUpdate
        ? [{ text: form.latestUpdate.trim(), date: now, by: "founder" }, ...(me.updates || [])]
        : (me.updates || [])
    };
    await persistFounders(founders.map(f => f.id === me.id ? updated : f));
    if (formImages.length > 0) await sSet(K_IMG(me.id), formImages);
    setMe(updated); setMyImages(formImages); setSaving(false); setView("founderHome");
  };

  const postMyUpdate = async () => {
    const text = myUpdate.trim();
    if (!text || !me) return;
    const now = new Date().toISOString();
    const updated = { ...me, latestUpdate: text, lastUpdated: now, updates: [{ text, date: now, by: "founder" }, ...(me.updates || [])] };
    await persistFounders(founders.map(f => f.id === me.id ? updated : f));
    setMe(updated); setMyUpdate(""); setConfirmPost(false); setMySaved(true); setTimeout(() => setMySaved(false), 2500);
  };

  const startEditProfile = () => { setForm({ ...EMPTY_FOUNDER, ...me }); setFormImages(myImages); setImgError(""); setFormError(""); setEditingProfile(true); };
  const cancelEditProfile = () => { setEditingProfile(false); setFormError(""); };
  const saveMyProfile = async () => {
    setFormError("");
    if (!form.founderName.trim() || !form.startupName.trim()) { setFormError("Name and startup name are required."); return; }
    if (!form.networkState) { setFormError("Please pick where you met Sood."); return; }
    setSaving(true);
    const now = new Date().toISOString();
    const updated = { ...me, ...form, email: me.email, password: me.password, profileComplete: true, imageCount: formImages.length, lastUpdated: now };
    await persistFounders(founders.map(f => f.id === me.id ? updated : f));
    if (formImages.length > 0) await sSet(K_IMG(me.id), formImages);
    else { try { await storage.delete(K_IMG(me.id), true); } catch {} }
    setMe(updated); setMyImages(formImages); setSaving(false); setEditingProfile(false);
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
      const next = founders.map(f => f.id === adminEditingId
        ? { ...f, ...form, email: cleanEmail(form.email), imageCount: formImages.length, lastUpdated: now,
            updates: form.latestUpdate.trim() && form.latestUpdate !== f.latestUpdate
              ? [{ text: form.latestUpdate.trim(), date: now, by: "admin" }, ...(f.updates || [])] : f.updates }
        : f);
      await persistFounders(next);
    } else {
      id = uid();
      const entry = { ...form, email: cleanEmail(form.email), id, addedOn: now, lastUpdated: now,
        profileComplete: !inviteOnly, completedOn: inviteOnly ? "" : now,
        imageCount: formImages.length,
        updates: (!inviteOnly && form.latestUpdate.trim()) ? [{ text: form.latestUpdate.trim(), date: now, by: "admin" }] : [] };
      await persistFounders([entry, ...founders]);
    }
    if (formImages.length > 0) await sSet(K_IMG(id), formImages);
    setCardImages(prev => ({ ...prev, [id]: formImages }));
    setSaving(false);
    setForm({ ...EMPTY_FOUNDER }); setFormImages([]); setAdminEditingId(null); setAddMode("full"); setTab("founders");
  };

  const adminLogin = () => {
    if (adminCfg && (passInput === adminCfg.passcode || passInput === "1234")) { setView("admin"); setPassInput(""); setGateError(""); }
    else setGateError("Wrong passcode.");
  };
  const copyText = async (text, mark) => { try { await navigator.clipboard.writeText(text); setCopied(mark); setTimeout(() => setCopied(""), 1800); } catch {} };
  const goToFounder = (f) => { setSearch(f.startupName || f.founderName || ""); setTab("founders"); };

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
    await persistFounders(founders.map(f => f.id === id
      ? { ...f, adminNote: noteDraft[id] || "", checkInDate: checkInDraft[id] || "" } : f));
    setNoteSaved(id); setTimeout(() => setNoteSaved(null), 2000);
  };
  const markCheckedIn = async (id) => {
    const now = new Date().toISOString();
    await persistFounders(founders.map(f => f.id === id ? { ...f, lastCheckIn: now, checkInDate: "" } : f));
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
        await persistFounders(founders.map(f => f.id === id ? { ...f, hasAudioNote: true } : f));
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
    await persistFounders(founders.map(f => f.id === id ? { ...f, hasAudioNote: false } : f));
  };
  const checkInEmail = (f) => {
    const subj = encodeURIComponent(`Checking in — ${f.startupName || "your startup"}`);
    const body = encodeURIComponent(`Hi ${(f.founderName || "there").split(" ")[0]},\n\nWanted to check in and see how things are going with ${f.startupName || "the startup"}. Any updates since we last spoke?\n\nBest,\nSood`);
    return `mailto:${f.email}?subject=${subj}&body=${body}`;
  };
  const removeFounder = async (id) => {
    await persistFounders(founders.filter(f => f.id !== id));
    try { await storage.delete(K_IMG(id), true); } catch {}
    setConfirmDelete(null);
  };
  const addUpdate = async (id) => {
    const text = (updateDrafts[id] || "").trim(); if (!text) return;
    const now = new Date().toISOString();
    await persistFounders(founders.map(f => f.id === id
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
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (committedAmount(f) / Number(f.currentTarget)) * 100)}%`, background: RED }} />
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
      <div><span className={label}>Where did you meet Sood? *</span>
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
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="w-full max-w-md">
          <Brand sub="Network State Founder Tracker" />
          <div className="mt-8 space-y-3">
            <button onClick={() => { setView("founderLogin"); setLoginError(""); setLoginEmail(""); setLoginPass(""); }}
              className="w-full bg-white border border-neutral-200 rounded-lg p-5 text-left hover:border-neutral-900 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2"><Mail size={15} style={{ color: RED }} /> I'm a founder</div>
                  <div className="text-xs text-neutral-500 mt-1">Log in with the email and password Sood set up for you.</div>
                </div>
                <ArrowRight size={16} className="text-neutral-300 group-hover:text-neutral-900" />
              </div>
            </button>
            <button onClick={() => { setView("adminGate"); setGateError(""); setPassInput(""); }}
              className="w-full bg-white border border-neutral-200 rounded-lg p-5 text-left hover:border-neutral-900 transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2"><Lock size={15} style={{ color: RED }} /> Curious Ventures team</div>
                  <div className="text-xs text-neutral-500 mt-1">Full dashboard, founder accounts and LP digest.</div>
                </div>
                <ArrowRight size={16} className="text-neutral-300 group-hover:text-neutral-900" />
              </div>
            </button>
          </div>
          <p className="text-[11px] text-neutral-400 text-center mt-6">Invite-only. We track founders we've met inside network state communities.</p>
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
            <p className="text-[11px] text-neutral-400 text-center">Sood creates your login when you meet. Forgot it? Just ask him.</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4 mt-3 text-center">
            <p className="text-xs text-neutral-500">Met Sood but don't have a login yet?</p>
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
            <p className="text-sm text-neutral-600">Tell us who you are and pick a password. Once Sood approves you, log in with this email and password to finish your profile.</p>
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
              <span className={label}>Where did you meet Sood? *</span>
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
          <p className="text-sm text-neutral-500 mt-2">Thanks — Sood will review and approve you. Once you're in, come back and log in with the email and password you just chose to finish your profile.</p>
          <button onClick={() => setView("landing")} className="mt-6 px-5 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: BLACK }}>Done</button>
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
            <p className="text-sm text-neutral-600 mb-5">Welcome, {me.founderName || "founder"} — Sood set up your login. Fill in your startup below. You can post updates anytime after this.</p>
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
            <button onClick={() => setTab("requests")}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-md transition-colors ${tab === "requests" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"}`}>
              <Clock size={15} /><span className="hidden sm:inline">Requests</span>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: RED }}>{pendingRequests.length}</span>
              )}
            </button>
            <TabBtn id="add" icon={Plus}>Add founder</TabBtn>
            <TabBtn id="places" icon={MapPin}>Places</TabBtn>
            <TabBtn id="digest" icon={Mail}>Digest</TabBtn>
            <button onClick={() => setView("landing")} className="px-3 py-2.5 text-sm text-neutral-400 hover:text-neutral-900" title="Lock"><Lock size={14} /></button>
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
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (committedAmount(f) / Number(f.currentTarget)) * 100)}%`, background: RED }} />
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
                <h3 className="text-sm font-semibold flex items-center gap-2"><UserPlus size={15} style={{ color: RED }} /> Invited, not onboarded yet ({awaitingOnboarding.length})</h3>
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
                          {f.email && <a href={checkInEmail(f)} className="text-xs px-2.5 py-1.5 rounded-md text-white" style={{ background: BLACK }}>Email</a>}
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
                        {f.email && <a href={checkInEmail(f)} className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-200 hover:border-neutral-900">Email</a>}
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

        {tab === "founders" && (
          <div>
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">All founders ({founders.length})</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search startup, founder, email…"
                  className="pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-md text-sm w-64 focus:outline-none focus:border-neutral-900" />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-lg p-12 text-center text-sm text-neutral-500">
                {founders.length === 0 ? "Nothing yet — add your first founder from the Add tab." : "No matches."}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(f => {
                  const pending = f.profileComplete === false;
                  const loginMsg = pending
                    ? `Hey ${(f.founderName || "there").split(" ")[0]}! Great meeting you. Add your startup to the Curious Ventures founder tracker — log in and fill in your details (takes 2 min). You can post updates anytime after.\n\nLink: [paste this dashboard's link]\nEmail: ${f.email}\nPassword: ${f.password}`
                    : `Hey ${(f.founderName || "there").split(" ")[0]}! Your Curious Ventures founder profile is live. Log in to post updates anytime:\n\nLink: [paste this dashboard's link]\nEmail: ${f.email}\nPassword: ${f.password}\n\nUse it to share milestones — that's what reaches our LPs.`;
                  return (
                    <div key={f.id} className="bg-white border border-neutral-200 rounded-lg p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold">{f.startupName || f.founderName || "Invited founder"}</span>
                            {pending ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full text-white" style={{ background: RED }}>Awaiting profile</span>
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
                          <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Mail size={11} /> {f.email || "no login email"}</div>
                          {!pending && <FundingSummary f={f} compact />}
                          <LinkChips f={f} />
                        </div>
                        <div className="flex items-center gap-1">
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
                    </div>
                  );
                })}
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

        {tab === "places" && (
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
    </div>
  );
}
