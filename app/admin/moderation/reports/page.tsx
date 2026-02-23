"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Flag,
  AlertOctagon,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Trash2,
  UserX,
  MessageSquare,
  FileText,
  User,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Eye,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Priority    = "high" | "med" | "low";
type ContentType = "post" | "comment" | "resource" | "user";
type Status      = "pending" | "resolved";

interface Report {
  id:           string;
  priority:     Priority;
  count:        number;
  type:         ContentType;
  snippet:      string;
  reason:       string;
  reporter:     string;
  others:       number;
  time:         string;
  status:       Status;
  username:     string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const REPORTS: Report[] = [
  { id:"r1", priority:"high", count:12, type:"post",     snippet:"Need help hacking into accounts and bypassing 2FA...",         reason:"Harassment",       reporter:"Alex K.",   others:11, time:"2h ago",  status:"pending",  username:"@darkphoenix99"  },
  { id:"r2", priority:"high", count:8,  type:"resource", snippet:"Sharing copyrighted exam papers and premium course material...", reason:"Copyright",        reporter:"Priya S.",  others:7,  time:"4h ago",  status:"pending",  username:"@resource_king"  },
  { id:"r3", priority:"med",  count:4,  type:"post",     snippet:"Political propaganda inside a chemistry study thread...",        reason:"Off-Topic",        reporter:"Sam R.",    others:3,  time:"6h ago",  status:"pending",  username:"@politicalbot"   },
  { id:"r4", priority:"med",  count:3,  type:"comment",  snippet:"Spam and self-promotional content for an external scam site...", reason:"Spam",             reporter:"Jordan L.", others:2,  time:"1d ago",  status:"pending",  username:"@spambot_42"     },
  { id:"r5", priority:"low",  count:1,  type:"user",     snippet:"Display name contains explicit profanity and offensive slurs...",reason:"Profile Violation",reporter:"Taylor M.", others:0,  time:"3d ago",  status:"resolved", username:"@offensive_usr"  },
  { id:"r6", priority:"low",  count:2,  type:"comment",  snippet:"Personal attacks on a mentor's teaching across sessions...",     reason:"Harassment",       reporter:"Jamie O.",  others:1,  time:"2d ago",  status:"resolved", username:"@angry_student"  },
];

// ─── Config ────────────────────────────────────────────────────────────────────
const PRIORITY_CFG = {
  high: { label:"High",   color:"#ef4444", bg:"rgba(239,68,68,0.12)",  border:"rgba(239,68,68,0.3)"  },
  med:  { label:"Med",    color:"#f59e0b", bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.3)" },
  low:  { label:"Low",    color:"#10b981", bg:"rgba(16,185,129,0.12)", border:"rgba(16,185,129,0.3)" },
};

const TYPE_CFG: Record<ContentType, { label:string; color:string; Icon: React.ElementType }> = {
  post:     { label:"Post",     color:"#8b5cf6", Icon: MessageSquare },
  comment:  { label:"Comment",  color:"#3b82f6", Icon: MessageSquare },
  resource: { label:"Resource", color:"#06b6d4", Icon: FileText      },
  user:     { label:"User",     color:"#ec4899", Icon: User          },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function PriorityBadge({ priority, count }: { priority: Priority; count: number }) {
  const c = PRIORITY_CFG[priority];
  return (
    <span
      style={{
        display:"inline-flex", alignItems:"center", gap:5,
        padding:"4px 9px", borderRadius:20, whiteSpace:"nowrap",
        background:c.bg, border:`1px solid ${c.border}`, color:c.color,
        fontSize:11, fontWeight:700,
      }}
    >
      <span
        style={{
          width:6, height:6, borderRadius:"50%", flexShrink:0,
          background:c.color,
          boxShadow: priority === "high" ? `0 0 5px ${c.color}` : "none",
        }}
      />
      {c.label}
      <span style={{ opacity:0.65 }}>· {count}</span>
    </span>
  );
}

function TypeChip({ type }: { type: ContentType }) {
  const { label, color, Icon } = TYPE_CFG[type];
  return (
    <span
      style={{
        display:"inline-flex", alignItems:"center", gap:4,
        padding:"3px 8px", borderRadius:7, whiteSpace:"nowrap", flexShrink:0,
        background: color + "20", color, fontSize:11, fontWeight:600,
      }}
    >
      <Icon size={11} /> {label}
    </span>
  );
}

function GhostBtn({
  icon: Icon, label, color,
}: {
  icon: React.ElementType; label: string; color: "blue"|"green"|"orange"|"red";
}) {
  const clr = { blue:"#3b82f6", green:"#10b981", orange:"#f59e0b", red:"#ef4444" }[color];
  return (
    <button
      style={{
        display:"flex", alignItems:"center", gap:3, padding:"5px 8px",
        borderRadius:7, background:"transparent", border:"1px solid transparent",
        color:clr, cursor:"pointer", fontSize:11, fontWeight:600, whiteSpace:"nowrap",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = clr + "18")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function BanBtn() {
  return (
    <button
      style={{
        display:"flex", alignItems:"center", gap:3, padding:"5px 9px",
        borderRadius:7, background:"#dc2626", border:"none",
        color:"#fff", cursor:"pointer", fontSize:11, fontWeight:700,
        boxShadow:"0 2px 6px rgba(220,38,38,0.4)", whiteSpace:"nowrap",
      }}
    >
      <UserX size={12} /> Ban
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsQueuePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted]   = useState(false);
  
  const [tab, setTab]           = useState<Status>("pending");
  const [selected, setSelected] = useState<string[]>([]);
  const [filterType, setFilter] = useState("all");
  const [sort, setSort]         = useState("priority");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Theme tokens (Synced with next-themes) ───────────────────────────────────
  const isDark = resolvedTheme === "dark";
  
  const tk = isDark ? {
    pageBg:    "transparent", // Let the layout handle the background
    surface:   "#110e1c",
    surfaceAlt:"rgba(255,255,255,0.025)",
    border:    "rgba(255,255,255,0.07)",
    text:      "#ede9ff",
    textSub:   "rgba(237,233,255,0.5)",
    textMuted: "rgba(237,233,255,0.28)",
    inputBg:   "rgba(255,255,255,0.04)",
    rowDanger: "rgba(239,68,68,0.07)",
    rowSel:    "rgba(124,58,237,0.07)",
    stat: {
      red:    { bg:"rgba(239,68,68,0.09)",   border:"rgba(239,68,68,0.22)",   icon:"#f87171", text:"#fca5a5" },
      orange: { bg:"rgba(245,158,11,0.09)",  border:"rgba(245,158,11,0.22)",  icon:"#fbbf24", text:"#fcd34d" },
      green:  { bg:"rgba(16,185,129,0.09)",  border:"rgba(16,185,129,0.22)",  icon:"#34d399", text:"#6ee7b7" },
    },
  } : {
    pageBg:    "transparent", // Let the layout handle the background
    surface:   "#ffffff",
    surfaceAlt:"rgba(0,0,0,0.02)",
    border:    "rgba(0,0,0,0.08)",
    text:      "#1a1030",
    textSub:   "rgba(26,16,48,0.55)",
    textMuted: "rgba(26,16,48,0.35)",
    inputBg:   "rgba(0,0,0,0.04)",
    rowDanger: "rgba(239,68,68,0.05)",
    rowSel:    "rgba(124,58,237,0.05)",
    stat: {
      red:    { bg:"rgba(239,68,68,0.07)",   border:"rgba(239,68,68,0.18)",   icon:"#ef4444", text:"#dc2626" },
      orange: { bg:"rgba(245,158,11,0.07)",  border:"rgba(245,158,11,0.18)",  icon:"#f59e0b", text:"#d97706" },
      green:  { bg:"rgba(16,185,129,0.07)",  border:"rgba(16,185,129,0.18)",  icon:"#10b981", text:"#059669" },
    },
  };

  // ── Filter / Sort ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = REPORTS.filter(r => r.status === tab);

    if (filterType !== "all") {
      const map: Record<string, ContentType> = {
        posts:"post", comments:"comment", resources:"resource", users:"user",
      };
      list = list.filter(r => r.type === map[filterType]);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.snippet.toLowerCase().includes(q)   ||
        r.reason.toLowerCase().includes(q)    ||
        r.reporter.toLowerCase().includes(q)  ||
        r.username.toLowerCase().includes(q)
      );
    }

    if (sort === "priority") {
      const w = (p: Priority) => p==="high"?3:p==="med"?2:1;
      list = [...list].sort((a,b) => w(b.priority) - w(a.priority) || b.count - a.count);
    }

    return list;
  }, [tab, filterType, sort, search]);

  const pendingCount = REPORTS.filter(r => r.status === "pending").length;
  const allSel       = filtered.length > 0 && selected.length === filtered.length;
  const toggleAll    = () => allSel ? setSelected([]) : setSelected(filtered.map(r => r.id));
  const toggleOne    = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // ── Shared input/select style ──────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    padding:"7px 12px", borderRadius:9,
    border:`1px solid ${tk.border}`, background:tk.inputBg,
    fontSize:13, color:tk.text, outline:"none",
    fontFamily:"inherit",
  };

  // Wait for client to mount to avoid hydration mismatch with inline styles
  if (!mounted) return <div style={{ minHeight: "100vh" }} />;

  // Responsive: stacked cards for mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 700;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background:tk.pageBg,
      padding:"10px 0px", boxSizing:"border-box",
      transition:"background 0.25s",
    }}>
      {/* ════════ HEADER ════════ */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:26 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:44, height:44, borderRadius:12, flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:"rgba(124,58,237,0.12)", border:"1px solid rgba(124,58,237,0.22)",
            color:"#7c3aed",
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:tk.text, letterSpacing:"-0.3px" }}>
              Reports Queue
            </h1>
            <p style={{ margin:"2px 0 0", fontSize:13, color:tk.textSub }}>
              Triage, review, and resolve user-submitted reports.
            </p>
          </div>
        </div>
        
        {/* MANUAL THEME TOGGLE REMOVED - NOW SYNCED WITH NAVBAR */}
      </div>

      {/* ════════ STAT CARDS ════════ */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(250px, 1fr))", gap:14, marginBottom:24 }}>
        {([
          { s:tk.stat.red,    Icon:AlertOctagon, label:"High Priority Pending", value:5  },
          { s:tk.stat.orange, Icon:Flag,         label:"Total Pending",         value:24 },
          { s:tk.stat.green,  Icon:CheckCircle,  label:"Resolved Today",        value:18 },
        ] as const).map(({ s, Icon, label, value }, i) => (
          <div key={i} style={{
            background:s.bg, border:`1px solid ${s.border}`,
            borderRadius:14, padding:"16px 20px",
            display:"flex", alignItems:"center", gap:14,
          }}>
            <div style={{ color:s.icon, flexShrink:0 }}><Icon size={22} /></div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.07em", color:s.text }}>
                {label}
              </div>
              <div style={{ fontSize:26, fontWeight:700, color:tk.text, lineHeight:1.1, marginTop:3 }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════════ CONTROLS ════════ */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:12, marginBottom:16,
      }}>

        {/* Left: tabs + bulk actions */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {/* Tab group */}
          <div style={{
            display:"flex", background:tk.surfaceAlt, borderRadius:12,
            padding:4, border:`1px solid ${tk.border}`,
          }}>
            {(["pending","resolved"] as Status[]).map(t2 => {
              const active = tab === t2;
              return (
                <button
                  key={t2}
                  onClick={() => { setTab(t2); setSelected([]); }}
                  style={{
                    padding:"6px 16px", borderRadius:9, border:"none", outline:"none",
                    background: active ? "#7c3aed" : "transparent",
                    color:      active ? "#fff"    : tk.textSub,
                    fontSize:13, fontWeight:600, cursor:"pointer",
                    boxShadow: active ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
                    transition:"all 0.2s", fontFamily:"inherit",
                  }}
                >
                  {t2 === "pending" ? "Pending Action" : "Resolved"}
                  {t2 === "pending" && (
                    <span style={{
                      marginLeft:6, padding:"1px 6px", borderRadius:20,
                      background: active ? "rgba(255,255,255,0.2)" : tk.inputBg,
                      color:      active ? "#fff" : tk.textMuted,
                      fontSize:11, fontWeight:700,
                    }}>{pendingCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <>
              <button
                style={{
                  display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
                  borderRadius:9, background:"#059669", color:"#fff", border:"none",
                  cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit",
                  boxShadow:"0 2px 8px rgba(5,150,105,0.35)",
                }}
              >
                <CheckCircle size={14}/> Bulk Resolve ({selected.length})
              </button>
              <button
                onClick={() => setSelected([])}
                style={{
                  display:"flex", alignItems:"center", gap:5, padding:"7px 11px",
                  borderRadius:9, background:"transparent", border:`1px solid ${tk.border}`,
                  color:tk.textSub, cursor:"pointer", fontSize:13, fontFamily:"inherit",
                }}
              >
                <X size={13}/> Clear
              </button>
            </>
          )}
        </div>

        {/* Right: search + filters */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Search */}
          <div style={{ position:"relative" }}>
            <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:tk.textMuted }} />
            <input
              style={{ ...inputStyle, paddingLeft:30, width:190 }}
              placeholder="Search reports..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filter type */}
          <div style={{ position:"relative" }}>
            <select
              style={{ ...inputStyle, paddingRight:28, appearance:"none", cursor:"pointer" }}
              value={filterType}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="posts">Posts</option>
              <option value="comments">Comments</option>
              <option value="resources">Resources</option>
              <option value="users">Users</option>
            </select>
            <ChevronDown size={13} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:tk.textMuted, pointerEvents:"none" }} />
          </div>

          {/* Sort */}
          <div style={{ position:"relative" }}>
            <SlidersHorizontal size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:tk.textMuted, pointerEvents:"none" }} />
            <select
              style={{ ...inputStyle, paddingLeft:30, paddingRight:28, appearance:"none", cursor:"pointer" }}
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="priority">Priority: High → Low</option>
              <option value="newest">Newest First</option>
            </select>
            <ChevronDown size={13} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", color:tk.textMuted, pointerEvents:"none" }} />
          </div>
        </div>
      </div>

      {/* ════════ TABLE / CARD LIST ════════ */}
      <div style={{
        background:tk.surface, border:`1px solid ${tk.border}`,
        borderRadius:16, overflow:"hidden", overflowX: "auto"
      }}>
        <div style={{ minWidth: 900 }}>
          {/* ── Table Head ── */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"36px 120px 280px 130px 160px 80px 1fr",
            alignItems:"center",
            padding:"11px 20px",
            borderBottom:`1px solid ${tk.border}`,
            background:tk.surfaceAlt,
            gap:12,
          }}>
            {["","PRIORITY","CONTENT","REASON","REPORTER","TIME","ACTIONS"].map((h,i) => (
              <div key={i} style={{
                fontSize:10, fontWeight:700, color:tk.textMuted,
                textTransform:"uppercase", letterSpacing:"0.08em",
                textAlign: i === 6 ? "right" : "left",
              }}>
                {i === 0
                  ? <input type="checkbox" style={{ width:14, height:14, cursor:"pointer", accentColor:"#7c3aed" }} checked={allSel} onChange={toggleAll} />
                  : h
                }
              </div>
            ))}
          </div>

          {/* ── Rows ── */}
          {filtered.length === 0 ? (
            <div style={{ padding:"52px 20px", textAlign:"center", color:tk.textMuted }}>
              <CheckCircle size={36} style={{ margin:"0 auto 10px", opacity:0.3 }} />
              <p style={{ margin:0, fontSize:14 }}>No reports found.</p>
            </div>
          ) : (
            isMobile ? (
              filtered.map(r => {
                const isDanger = r.count > 5;
                const isSel    = selected.includes(r.id);
                return (
                  <div
                    key={r.id}
                    style={{
                      margin:"12px 0", padding:"16px 14px", borderRadius:12,
                      border:`1px solid ${tk.border}`,
                      background: isDanger ? tk.rowDanger : isSel ? tk.rowSel : tk.surfaceAlt,
                      boxShadow: isDanger ? `0 0 0 3px #ef4444` : undefined,
                      transition:"background 0.15s, box-shadow 0.15s",
                      position:"relative",
                    }}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input
                        type="checkbox"
                        style={{ width:14, height:14, cursor:"pointer", accentColor:"#7c3aed" }}
                        checked={isSel}
                        onChange={() => toggleOne(r.id)}
                        aria-label="Select report"
                      />
                      <PriorityBadge priority={r.priority} count={r.count} />
                      <TypeChip type={r.type} />
                      <span style={{ fontSize:11, color:tk.textMuted, fontFamily:"monospace" }}>{r.username}</span>
                    </div>
                    <p style={{ margin:"8px 0 0", fontSize:12, color:tk.textSub, lineHeight:1.4 }}>{r.snippet}</p>
                    <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:tk.textSub }}>{r.reason}</span>
                      <span style={{ fontSize:11, color:tk.textSub }}>Reported by {r.reporter}{r.others > 0 ? ` +${r.others} others` : ""}</span>
                      <span style={{ fontSize:11, color:tk.textMuted }}>{r.time}</span>
                    </div>
                    <div style={{ marginTop:10, display:"flex", gap:4, justifyContent:"flex-end" }}>
                      <GhostBtn icon={Eye} label="View" color="blue" />
                      <GhostBtn icon={CheckCircle} label="Dismiss" color="green" />
                      <GhostBtn icon={AlertTriangle} label="Warn" color="orange" />
                      <GhostBtn icon={Trash2} label="Remove" color="red" />
                      <BanBtn />
                    </div>
                  </div>
                );
              })
            ) : (
              filtered.map(r => {
                const isDanger = r.count > 5;
                const isSel    = selected.includes(r.id);
                return (
                  <div
                    key={r.id}
                    style={{
                      display:"grid",
                      gridTemplateColumns:"36px 120px 280px 130px 160px 80px 1fr",
                      alignItems:"center",
                      padding:"13px 20px",
                      borderBottom:`1px solid ${tk.border}`,
                      borderLeft:`3px solid ${isDanger ? "#ef4444" : isSel ? "#7c3aed" : "transparent"}`,
                      background: isDanger ? tk.rowDanger : isSel ? tk.rowSel : "transparent",
                      gap:12,
                      transition:"background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDanger ? tk.rowDanger : tk.surfaceAlt}
                    onMouseLeave={e => e.currentTarget.style.background = isDanger ? tk.rowDanger : isSel ? tk.rowSel : "transparent"}
                  >
                    {/* Checkbox */}
                    <div>
                      <input
                        type="checkbox"
                        style={{ width:14, height:14, cursor:"pointer", accentColor:"#7c3aed" }}
                        checked={isSel}
                        onChange={() => toggleOne(r.id)}
                        aria-label="Select report"
                      />
                    </div>
                    {/* Priority */}
                    <div>
                      <PriorityBadge priority={r.priority} count={r.count} />
                    </div>
                    {/* Content */}
                    <div style={{ minWidth:0, overflow:"hidden" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                        <TypeChip type={r.type} />
                        <span style={{ fontSize:11, color:tk.textMuted, fontFamily:"monospace", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:100 }}>{r.username}</span>
                      </div>
                      <p style={{ margin:0, fontSize:12, color:tk.textSub, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.snippet}</p>
                    </div>
                    {/* Reason */}
                    <div>
                      <span style={{ display:"inline-block", padding:"3px 9px", borderRadius:7, whiteSpace:"nowrap", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", border:`1px solid ${tk.border}`, fontSize:11, fontWeight:600, color:tk.textSub }}>{r.reason}</span>
                    </div>
                    {/* Reporter */}
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:tk.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.reporter}</div>
                      {r.others > 0 && (<div style={{ fontSize:11, color:tk.textMuted, marginTop:1 }}>+{r.others} others</div>)}
                    </div>
                    {/* Time */}
                    <div style={{ fontSize:12, color:tk.textMuted, whiteSpace:"nowrap" }}>{r.time}</div>
                    {/* Actions */}
                    <div style={{ display:"flex", alignItems:"center", gap:3, justifyContent:"flex-end" }}>
                      <GhostBtn icon={Eye} label="View" color="blue" tooltip="View report details" />
                      <GhostBtn icon={CheckCircle} label="Dismiss" color="green" tooltip="Mark as resolved" />
                      <GhostBtn icon={AlertTriangle} label="Warn" color="orange" tooltip="Warn user" />
                      <GhostBtn icon={Trash2} label="Remove" color="red" tooltip="Remove content" />
                      <BanBtn />
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* ════════ FOOTER ════════ */}
      <div style={{
        marginTop:12, display:"flex", justifyContent:"space-between",
        fontSize:12, color:tk.textMuted,
      }}>
        <span>Showing {filtered.length} of {REPORTS.filter(r => r.status === tab).length} reports</span>
        <span>StudyBuddy Admin · Last synced just now</span>
      </div>

    </div>
  );
}