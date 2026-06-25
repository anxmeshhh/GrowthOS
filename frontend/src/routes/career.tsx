import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageShell, PageHeader, Card, Btn } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import {
  Briefcase, FileText, Upload, CheckCircle2, XCircle, Clock,
  Loader2, ChevronDown, ChevronUp, Zap, Target, Map, Mic,
  TrendingUp, BookOpen, ArrowRight, Star, AlertTriangle, Plus,
} from "lucide-react";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Career Intelligence — GrowthOS" },
      { name: "description", content: "Map job descriptions and your resume to your exact learning roadmap." },
    ],
  }),
  component: CareerPage,
});

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, label, size = 96 }: { score: number; label: string; size?: number }) {
  const r = size * 0.4, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? "#00FF66" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a1a" strokeWidth={size * 0.08} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={size * 0.08}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{score}%</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>{label}</span>
    </div>
  );
}

// ── Weeks Badge ───────────────────────────────────────────────────────────────
function WeeksBadge({ weeks }: { weeks: number | null }) {
  if (!weeks && weeks !== 0) return null;
  const color = weeks <= 4 ? "#00FF66" : weeks <= 8 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 20 }}>
      <Clock size={11} style={{ color }} />
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{weeks === 0 ? "Ready now!" : `~${weeks}w to ready`}</span>
    </div>
  );
}

// ── Skill Matrix ──────────────────────────────────────────────────────────────
function SkillMatrix({ gap }: { gap: any }) {
  const navigate = useNavigate();
  const completed = gap.completed || [];
  const inProgress = gap.in_progress || [];
  const notStarted = gap.not_started || [];

  const col = (items: any[], icon: React.ReactNode, label: string, color: string, bg: string) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: "6px 10px", background: bg, borderRadius: 8 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontSize: 11, color, marginLeft: "auto", fontWeight: 700 }}>{items.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {items.slice(0, 6).map((item: any, i: number) => (
          <div key={i} style={{ padding: "8px 10px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#ccc", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.skill}</span>
            {item.topic_slug && label !== "MASTERED" && (
              <button
                onClick={() => navigate({ to: `/topic/${item.topic_slug}` })}
                style={{ fontSize: 10, color: "#00FF66", background: "rgba(0,255,102,0.06)", border: "1px solid rgba(0,255,102,0.2)", borderRadius: 4, padding: "2px 6px", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
              >
                Study →
              </button>
            )}
          </div>
        ))}
        {items.length > 6 && (
          <div style={{ fontSize: 11, color: "#555", padding: "4px 10px" }}>+{items.length - 6} more</div>
        )}
      </div>
    </div>
  );

  if (!completed.length && !inProgress.length && !notStarted.length) {
    return <div style={{ padding: "24px", textAlign: "center", color: "#555", fontSize: 13 }}>No matching skills found in GrowthOS for this analysis.</div>;
  }

  return (
    <div style={{ display: "flex", gap: 12 }}>
      {col(completed, <CheckCircle2 size={13} style={{ color: "#00FF66" }} />, "Mastered", "#00FF66", "rgba(0,255,102,0.05)")}
      {col(inProgress, <Clock size={13} style={{ color: "#f59e0b" }} />, "In Progress", "#f59e0b", "rgba(245,158,11,0.05)")}
      {col(notStarted, <XCircle size={13} style={{ color: "#ef4444" }} />, "Gap", "#ef4444", "rgba(239,68,68,0.05)")}
    </div>
  );
}

// ── Action Items ──────────────────────────────────────────────────────────────
function ActionPlan({ items }: { items: any[] }) {
  const navigate = useNavigate();
  if (!items?.length) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Your Next Steps</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item: any, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, transition: "border-color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#222")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a1a1a")}
          >
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,255,102,0.08)", border: "1px solid rgba(0,255,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#00FF66" }}>{i + 1}</span>
            </div>
            <BookOpen size={13} style={{ color: "#555", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{item.skill}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{item.path_title}</div>
            </div>
            {item.topic_slug && (
              <button
                onClick={() => navigate({ to: `/topic/${item.topic_slug}` })}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#00FF66", background: "rgba(0,255,102,0.06)", border: "1px solid rgba(0,255,102,0.2)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}
              >
                Study Now <ArrowRight size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── JD Panel ─────────────────────────────────────────────────────────────────
function JDPanel({ onAnalyzed }: { onAnalyzed?: (data: any) => void }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ["jd_history"],
    queryFn: async () => {
      const r = await apiFetch("/career/jd/");
      return r.ok ? r.json() : [];
    },
  });

  const analyze = useMutation({
    mutationFn: async (payload: { text?: string; file?: File }) => {
      const fd = new FormData();
      if (payload.file) fd.append("file", payload.file);
      else fd.append("text", payload.text || "");
      const r = await apiFetch("/career/jd/", { method: "POST", body: fd });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Analysis failed"); }
      return r.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setActiveHistoryId(data.id);
      qc.invalidateQueries({ queryKey: ["jd_history"] });
      onAnalyzed?.(data);
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) analyze.mutate({ file: f });
  };

  const loadHistory = (h: any) => {
    setResult(h);
    setActiveHistoryId(h.id);
    onAnalyzed?.(h);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* History tab strip */}
      {(history || []).length > 0 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {(history as any[]).map((h: any) => (
            <button key={h.id} onClick={() => loadHistory(h)} style={{
              padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 500, flexShrink: 0,
              background: activeHistoryId === h.id ? "rgba(0,255,102,0.08)" : "#111",
              border: `1px solid ${activeHistoryId === h.id ? "rgba(0,255,102,0.3)" : "#1e1e1e"}`,
              color: activeHistoryId === h.id ? "#00FF66" : "#666",
            }}>
              {h.job_title || "JD"} {h.match_pct != null && <span style={{ opacity: 0.7 }}>· {h.match_pct}%</span>}
            </button>
          ))}
          <button onClick={() => { setResult(null); setActiveHistoryId(null); setText(""); }} style={{
            padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, background: "#111",
            border: "1px solid #1e1e1e", color: "#555",
          }}>
            <Plus size={12} />
          </button>
        </div>
      )}

      <Card className="p-6">
        {!result ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,255,102,0.08)", border: "1px solid rgba(0,255,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={18} style={{ color: "#00FF66" }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>Job Description Mapper</div>
                <div style={{ fontSize: 12, color: "#666" }}>Paste any JD or upload PDF — see your exact gap</div>
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste the job description here…"
              style={{ width: "100%", minHeight: 160, background: "#0d0d0d", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ccc", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = "#00FF66")}
              onBlur={e => (e.target.style.borderColor = "#222")}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <Btn onClick={() => text.trim() && analyze.mutate({ text })} disabled={!text.trim() || analyze.isPending} variant="solid" tone="green">
                {analyze.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Target size={14} /> Analyze JD</>}
              </Btn>
              <Btn onClick={() => fileRef.current?.click()} variant="outline" disabled={analyze.isPending}>
                <Upload size={14} /> Upload PDF
              </Btn>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFile} />
            </div>
            {analyze.isError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{(analyze.error as Error).message}</p>}
          </>
        ) : (
          <JDResult result={result} onNew={() => { setResult(null); setActiveHistoryId(null); setText(""); }} />
        )}
      </Card>
    </div>
  );
}

// ── JD Result ─────────────────────────────────────────────────────────────────
function JDResult({ result, onNew }: { result: any; onNew: () => void }) {
  const navigate = useNavigate();
  const [generatingPath, setGeneratingPath] = useState(false);
  const [pathResult, setPathResult] = useState<any>(null);
  const [pathErr, setPathErr] = useState("");

  async function generatePath() {
    setGeneratingPath(true); setPathErr("");
    try {
      const r = await apiFetch("/career/generate-path/", { method: "POST", body: JSON.stringify({ source: "jd", jd_id: result.id }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setPathResult(data);
    } catch (e: any) { setPathErr(e.message); }
    finally { setGeneratingPath(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero row */}
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <ScoreRing score={result.match_pct ?? 0} label="Job Match" size={88} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#e5e5e5", lineHeight: 1.2 }}>{result.job_title || "Role"}</div>
          {result.company && <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{result.company}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {result.experience_level && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 20, padding: "2px 8px" }}>
                {result.experience_level}
              </span>
            )}
            <WeeksBadge weeks={result.weeks_to_ready} />
          </div>
        </div>
        <button onClick={onNew} style={{ fontSize: 11, color: "#555", background: "none", border: "1px solid #222", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}>
          New JD
        </button>
      </div>

      {/* Skill matrix */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Skill Breakdown</div>
        <SkillMatrix gap={result.gap_report} />
      </div>

      {/* Action plan */}
      {(result.action_items || []).length > 0 && <ActionPlan items={result.action_items} />}

      {/* CTAs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!pathResult ? (
          <Btn onClick={generatePath} disabled={generatingPath} variant="outline" size="sm">
            {generatingPath ? <Loader2 size={13} className="animate-spin" /> : <><Map size={13} /> Generate Roadmap</>}
          </Btn>
        ) : (
          <div style={{ padding: "10px 14px", background: "rgba(0,255,102,0.06)", border: "1px solid rgba(0,255,102,0.2)", borderRadius: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#00FF66" }}>{pathResult.message}</span>
            <button onClick={() => navigate({ to: "/custom-paths" })} style={{ display: "block", fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0 }}>
              Go to My Paths →
            </button>
          </div>
        )}
        {pathErr && <p style={{ fontSize: 12, color: "#ef4444" }}>{pathErr}</p>}
        <Btn onClick={() => navigate({ to: "/interview" })} variant="outline" size="sm">
          <Mic size={13} /> Mock Interview
        </Btn>
      </div>
    </div>
  );
}

// ── Resume Panel ──────────────────────────────────────────────────────────────
function ResumePanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useQuery({
    queryKey: ["resume_analysis"],
    queryFn: async () => {
      const r = await apiFetch("/career/resume/");
      if (!r.ok) return null;
      const data = await r.json();
      if (data) setResult(data);
      return data;
    },
  });

  const analyze = useMutation({
    mutationFn: async (payload: { text?: string; file?: File }) => {
      const fd = new FormData();
      if (payload.file) fd.append("file", payload.file);
      else fd.append("text", payload.text || "");
      const r = await apiFetch("/career/resume/", { method: "POST", body: fd });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Analysis failed"); }
      return r.json();
    },
    onSuccess: (data) => { setResult(data); setShowUpload(false); },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) analyze.mutate({ file: f });
  };

  if (!result || showUpload) {
    return (
      <Card className="p-6">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,255,102,0.08)", border: "1px solid rgba(0,255,102,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={18} style={{ color: "#00FF66" }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>Resume Analyzer</div>
            <div style={{ fontSize: 12, color: "#666" }}>Upload your resume — get an AI score + skill coverage</div>
          </div>
          {showUpload && (
            <button onClick={() => setShowUpload(false)} style={{ marginLeft: "auto", fontSize: 11, color: "#555", background: "none", border: "1px solid #222", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your resume content here, or upload a PDF below…"
          style={{ width: "100%", minHeight: 160, background: "#0d0d0d", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ccc", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = "#00FF66")}
          onBlur={e => (e.target.style.borderColor = "#222")}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <Btn onClick={() => text.trim() && analyze.mutate({ text })} disabled={!text.trim() || analyze.isPending} variant="solid" tone="green">
            {analyze.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Zap size={14} /> Analyze Resume</>}
          </Btn>
          <Btn onClick={() => fileRef.current?.click()} variant="outline" disabled={analyze.isPending}>
            <Upload size={14} /> Upload PDF
          </Btn>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFile} />
        </div>
        {analyze.isError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{(analyze.error as Error).message}</p>}
      </Card>
    );
  }

  // ── Resume Result ──────────────────────────────────────────────────────────
  const scoreColor = (result.resume_score ?? 0) >= 70 ? "#00FF66" : (result.resume_score ?? 0) >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <Card className="p-6">
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Hero row */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <ScoreRing score={result.resume_score ?? 0} label="Resume Score" size={88} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e5e5e5", lineHeight: 1.2 }}>
              {result.experience_level ? `${result.experience_level} Developer` : "Your Resume"}
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>{result.extracted_skills?.length || 0} skills detected</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {result.match_pct != null && <WeeksBadge weeks={result.weeks_to_ready} />}
              {result.analyzed_at && (
                <span style={{ fontSize: 11, color: "#555" }}>Updated {new Date(result.analyzed_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <button onClick={() => setShowUpload(true)} style={{ fontSize: 11, color: "#555", background: "none", border: "1px solid #222", borderRadius: 6, padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}>
            Update
          </button>
        </div>

        {/* Resume tips */}
        {(result.resume_tips || []).length > 0 && (
          <div style={{ padding: "14px 16px", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
              <AlertTriangle size={12} /> Improve Your Resume
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(result.resume_tips as string[]).map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#aaa" }}>
                  <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}>•</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills detected */}
        {(result.extracted_skills || []).length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Skills on Your Resume</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(result.extracted_skills as string[]).map((s, i) => (
                <span key={i} style={{ fontSize: 12, color: "#aaa", background: "rgba(0,255,102,0.05)", border: "1px solid rgba(0,255,102,0.12)", borderRadius: 20, padding: "3px 10px" }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Skill matrix */}
        {result.gap_report && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>GrowthOS Coverage</div>
            <SkillMatrix gap={result.gap_report} />
          </div>
        )}

        {/* Generate path CTA */}
        <GeneratePathFromResume />
      </div>
    </Card>
  );
}

function GeneratePathFromResume() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");

  async function generate() {
    setLoading(true); setErr("");
    try {
      const r = await apiFetch("/career/generate-path/", { method: "POST", body: JSON.stringify({ source: "resume" }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  }

  if (result) return (
    <div style={{ padding: "10px 14px", background: "rgba(0,255,102,0.06)", border: "1px solid rgba(0,255,102,0.2)", borderRadius: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#00FF66" }}>{result.message}</span>
      <button onClick={() => navigate({ to: "/custom-paths" })} style={{ display: "block", fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0 }}>
        Go to My Paths →
      </button>
    </div>
  );

  return (
    <div>
      {err && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{err}</p>}
      <Btn onClick={generate} disabled={loading} variant="outline" size="sm">
        {loading ? <Loader2 size={13} className="animate-spin" /> : <><Map size={13} /> Generate Path from Resume</>}
      </Btn>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function CareerPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"jd" | "resume">("jd");
  const [lastJdData, setLastJdData] = useState<any>(null);

  return (
    <PageShell>
      <PageHeader
        kicker="Career Intelligence"
        title="Land Your Next Role"
        subtitle="Map any job description or your resume against your learning progress. Know exactly what to study next."
      />

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { id: "jd", label: "Job Description", icon: <Briefcase size={13} /> },
          { id: "resume", label: "My Resume", icon: <FileText size={13} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 500,
            background: activeTab === t.id ? "rgba(0,255,102,0.08)" : "transparent",
            border: `1px solid ${activeTab === t.id ? "rgba(0,255,102,0.25)" : "#1e1e1e"}`,
            color: activeTab === t.id ? "#00FF66" : "#666",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
        <button onClick={() => navigate({ to: "/interview" })} style={{
          display: "flex", alignItems: "center", gap: 5, marginLeft: "auto",
          padding: "8px 14px", borderRadius: 8, cursor: "pointer",
          fontSize: 12, fontWeight: 500, color: "#888",
          background: "transparent", border: "1px solid #1e1e1e",
        }}>
          <Mic size={13} /> Practice Interview
        </button>
      </div>

      {/* Content */}
      {activeTab === "jd" && <JDPanel onAnalyzed={setLastJdData} />}
      {activeTab === "resume" && <ResumePanel />}

      {/* How it works footer */}
      <div style={{ marginTop: 28, padding: "14px 18px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, fontSize: 12, color: "#555", lineHeight: 1.6 }}>
        <span style={{ color: "#888", fontWeight: 600 }}>How it works — </span>
        AI extracts required skills from your JD or resume, then cross-references them with your GrowthOS progress.
        <span style={{ color: "#00FF66" }}> Green = mastered. </span>
        <span style={{ color: "#f59e0b" }}>Amber = in progress. </span>
        <span style={{ color: "#ef4444" }}>Red = not started. </span>
        Hit "Study Now" on any gap skill to jump straight to the topic.
      </div>
    </PageShell>
  );
}
