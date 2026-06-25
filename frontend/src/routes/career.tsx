import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageShell, PageHeader, Card, Btn, Badge } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import {
  Briefcase, FileText, Upload, CheckCircle2, XCircle,
  Clock, Loader2, ChevronDown, ChevronUp, Zap, Target, Map, Mic,
} from "lucide-react";

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: "Career Intelligence — GrowthOS" },
      { name: "description", content: "Map job descriptions and your resume to your learning roadmap." },
    ],
  }),
  component: CareerPage,
});

// ── Gap Report Renderer ──────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 size={14} style={{ color: "#00FF66", flexShrink: 0 }} />;
  if (status === "in_progress" || status === "available") return <Clock size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />;
  return <XCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />;
}

function statusLabel(status: string) {
  if (status === "completed") return { text: "Done", color: "#00FF66", bg: "rgba(0,255,102,0.08)", border: "rgba(0,255,102,0.2)" };
  if (status === "in_progress" || status === "available") return { text: "In Progress", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
  return { text: "Not Started", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" };
}

function GapReport({ gap, title }: { gap: any; title: string }) {
  const all = [
    ...(gap.completed || []).map((x: any) => ({ ...x, status: "completed" })),
    ...(gap.in_progress || []).map((x: any) => ({ ...x })),
    ...(gap.not_started || []).map((x: any) => ({ ...x, status: "not_started" })),
  ];

  if (!all.length) return (
    <div style={{ padding: "24px", textAlign: "center", color: "#555", fontSize: 13 }}>
      No matching topics found in GrowthOS for these skills yet.
    </div>
  );

  const done = (gap.completed || []).length;
  const total = all.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#888" }}>{done}/{total} skills covered</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 120, height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#00FF66,#00cc55)", borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, color: "#00FF66", fontWeight: 600 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {all.map((item: any, i: number) => {
          const s = statusLabel(item.status);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#161616", border: "1px solid #222", borderRadius: 10 }}>
              <StatusIcon status={item.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.skill}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{item.topic_title} · {item.path_title}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 20, padding: "2px 8px", flexShrink: 0 }}>{s.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── JD Panel ─────────────────────────────────────────────────────────────────

function JDPanel({ onAnalyzed }: { onAnalyzed?: (id: number) => void }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ["jd_history"],
    queryFn: async () => {
      const r = await apiFetch("/career/jd/");
      if (!r.ok) return [];
      return r.json();
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
    onSuccess: (data) => { setResult(data); qc.invalidateQueries({ queryKey: ["jd_history"] }); onAnalyzed?.(data.id); },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) analyze.mutate({ file: f });
  };

  return (
    <Card className="p-6">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Briefcase size={18} style={{ color: "#7c3aed" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>Job Description Mapper</div>
          <div style={{ fontSize: 12, color: "#666" }}>Paste a JD or upload PDF — get your exact study roadmap</div>
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste the job description here…"
        style={{ width: "100%", minHeight: 140, background: "#0d0d0d", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ccc", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        onFocus={e => (e.target.style.borderColor = "#7c3aed")}
        onBlur={e => (e.target.style.borderColor = "#222")}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <Btn onClick={() => text.trim() && analyze.mutate({ text })} disabled={!text.trim() || analyze.isPending} variant="solid" tone="green">
          {analyze.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Target size={14} className="mr-2" />Analyze JD</>}
        </Btn>
        <Btn onClick={() => fileRef.current?.click()} variant="outline" disabled={analyze.isPending}>
          <Upload size={14} className="mr-2" /> Upload PDF
        </Btn>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFile} />
        {(history || []).length > 0 && (
          <Btn onClick={() => setShowHistory(h => !h)} variant="ghost" size="sm" style={{ marginLeft: "auto" }}>
            History {showHistory ? <ChevronUp size={13} className="ml-1" /> : <ChevronDown size={13} className="ml-1" />}
          </Btn>
        )}
      </div>

      {analyze.isError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{(analyze.error as Error).message}</p>}

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {result.job_title && <Badge tone="blue">{result.job_title}</Badge>}
            {result.company && <Badge tone="amber">{result.company}</Badge>}
            {result.experience_level && <Badge tone="green">{result.experience_level}</Badge>}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Your Learning Gap</div>
            <GapReport gap={result.gap_report} title="JD Gap" />
          </div>
          {result.required_skills?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Required Skills Detected</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.required_skills.map((s: string, i: number) => (
                  <span key={i} style={{ fontSize: 12, color: "#999", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 20, padding: "3px 10px" }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showHistory && (history || []).length > 0 && (
        <div style={{ marginTop: 20, borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>Recent analyses</div>
          {(history as any[]).map((h: any) => (
            <button key={h.id} onClick={() => setResult(h)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", marginBottom: 6, textAlign: "left" }} className="hover:border-[#333]">
              <Briefcase size={13} style={{ color: "#7c3aed", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#ccc", flex: 1 }}>{h.job_title || "Unnamed JD"}</span>
              <span style={{ fontSize: 11, color: "#555" }}>{new Date(h.created_at).toLocaleDateString()}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Resume Panel ─────────────────────────────────────────────────────────────

function ResumePanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load existing analysis
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
    onSuccess: (data) => setResult(data),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) analyze.mutate({ file: f });
  };

  return (
    <Card className="p-6">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,255,102,0.1)", border: "1px solid rgba(0,255,102,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={18} style={{ color: "#00FF66" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>Resume Analyzer</div>
          <div style={{ fontSize: 12, color: "#666" }}>Upload your resume — see exactly what skills you have and what's missing</div>
        </div>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste your resume content here, or upload a PDF below…"
        style={{ width: "100%", minHeight: 140, background: "#0d0d0d", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ccc", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        onFocus={e => (e.target.style.borderColor = "#00FF66")}
        onBlur={e => (e.target.style.borderColor = "#222")}
      />

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <Btn onClick={() => text.trim() && analyze.mutate({ text })} disabled={!text.trim() || analyze.isPending} variant="solid" tone="green">
          {analyze.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Zap size={14} className="mr-2" />Analyze Resume</>}
        </Btn>
        <Btn onClick={() => fileRef.current?.click()} variant="outline" disabled={analyze.isPending}>
          <Upload size={14} className="mr-2" /> Upload PDF
        </Btn>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFile} />
      </div>

      {analyze.isError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{(analyze.error as Error).message}</p>}

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {result.experience_level && <Badge tone="blue">{result.experience_level} level</Badge>}
            <Badge tone="green">{result.extracted_skills?.length || 0} skills detected</Badge>
            {result.analyzed_at && <span style={{ fontSize: 11, color: "#555", alignSelf: "center" }}>Last updated {new Date(result.analyzed_at).toLocaleDateString()}</span>}
          </div>

          {result.extracted_skills?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Skills on Your Resume</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.extracted_skills.map((s: string, i: number) => (
                  <span key={i} style={{ fontSize: 12, color: "#aaa", background: "rgba(0,255,102,0.06)", border: "1px solid rgba(0,255,102,0.15)", borderRadius: 20, padding: "3px 10px" }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>GrowthOS Coverage</div>
            <GapReport gap={result.gap_report} title="Resume Coverage" />
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function GeneratePathButton({ jdId, source }: { jdId?: number; source: "jd" | "resume" }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function generate() {
    setLoading(true); setErr("");
    try {
      const body: any = { source };
      if (source === "jd" && jdId) body.jd_id = jdId;
      const r = await apiFetch("/career/generate-path/", { method: "POST", body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) return (
    <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(0,255,102,0.06)", border: "1px solid rgba(0,255,102,0.2)", borderRadius: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#00FF66", marginBottom: 6 }}>{result.message}</div>
      <button onClick={() => navigate({ to: "/custom-paths" })} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#a78bfa", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
        <Map size={13} /> Go to My Paths
      </button>
    </div>
  );

  return (
    <div style={{ marginTop: 16 }}>
      {err && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{err}</p>}
      <Btn onClick={generate} disabled={loading} variant="outline" size="sm">
        {loading ? <Loader2 size={13} className="animate-spin" /> : <><Map size={13} /> Generate Custom Roadmap</>}
      </Btn>
    </div>
  );
}

function CareerPage() {
  const navigate = useNavigate();
  const [lastJdId, setLastJdId] = useState<number | undefined>();

  return (
    <PageShell>
      <PageHeader
        kicker="Career Intelligence"
        title="Land Your Next Role"
        subtitle="Paste any job description or upload your resume — GrowthOS maps it to exactly what you need to study."
      />

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Btn onClick={() => navigate({ to: "/interview" })} variant="outline" size="sm">
          <Mic size={13} /> Practice Interview
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: 24 }}>
        <div>
          <JDPanel onAnalyzed={(id) => setLastJdId(id)} />
          {lastJdId && <GeneratePathButton jdId={lastJdId} source="jd" />}
        </div>
        <div>
          <ResumePanel />
          <GeneratePathButton source="resume" />
        </div>
      </div>

      <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 12, fontSize: 13, color: "#888" }}>
        <span style={{ color: "#a78bfa", fontWeight: 600 }}>How it works: </span>
        GrowthOS uses AI to extract required skills from job descriptions and resumes, then cross-references them with your learning progress. Green = done. Orange = in progress. Red = not started. Hit "Generate Custom Roadmap" to get a personalized learning path built from your gaps.
      </div>
    </PageShell>
  );
}
