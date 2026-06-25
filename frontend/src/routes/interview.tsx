import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { PageShell, PageHeader, Card, Btn } from "@/components/growth-ui";
import {
  Mic, MicOff, BookOpen, ChevronRight, CheckCircle2, Circle, Loader2,
  Target, BarChart2, Trophy, AlertCircle, RefreshCw, History,
} from "lucide-react";

export const Route = createFileRoute("/interview")({
  head: () => ({ meta: [{ title: "Mock Interview — GrowthOS" }] }),
  component: InterviewPage,
});

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 40, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#00FF66" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <svg width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r={r} fill="none" stroke="#1a1a1a" strokeWidth="8" />
          <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{score}%</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: "#666", textAlign: "center" }}>{label}</span>
    </div>
  );
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
function DiffBadge({ d }: { d: string }) {
  const m: Record<string, { c: string; bg: string }> = {
    easy: { c: "#00FF66", bg: "rgba(0,255,102,0.08)" },
    medium: { c: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
    hard: { c: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  };
  const s = m[d] || m.medium;
  return <span style={{ fontSize: 10, fontWeight: 700, color: s.c, background: s.bg, borderRadius: 20, padding: "2px 8px", textTransform: "capitalize" }}>{d}</span>;
}

// ── Active Interview ──────────────────────────────────────────────────────────
function ActiveInterview({ interview, onFinish }: { interview: any; onFinish: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Record<number, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<any>(null);
  const baseAnswerRef = useRef("");

  const questions = interview.questions || [];
  const current = questions[currentIdx];
  const answeredIds = new Set(Object.keys(feedback).map(Number));

  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("Speech recognition not supported in this browser. Try Chrome or Edge.");
      return;
    }
    setVoiceError("");
    baseAnswerRef.current = answer;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let finalChunk = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (finalChunk) {
        baseAnswerRef.current += (baseAnswerRef.current ? " " : "") + finalChunk.trim();
      }
      setAnswer(baseAnswerRef.current + (interim ? " " + interim : ""));
    };
    rec.onend = () => { setIsListening(false); };
    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e.error !== "aborted") setVoiceError("Mic error: " + e.error);
    };
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function submitAnswer() {
    if (!answer.trim() || !current) return;
    setSubmitting(true);
    try {
      const r = await apiFetch(`/interview/${interview.interview_id}/answer/`, {
        method: "POST",
        body: JSON.stringify({ question_id: current.id, answer }),
      });
      const data = await r.json();
      setFeedback(f => ({ ...f, [current.id]: data }));
      setAnswer("");
      if (data.all_answered) {
        setDone(true);
        setFinalResult(data);
      } else if (currentIdx < questions.length - 1) {
        setCurrentIdx(i => i + 1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done && finalResult) {
    return (
      <div style={{ textAlign: "center", padding: "40px 24px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 32 }}>
          <ScoreRing score={finalResult.overall_score || 0} label="Overall Score" />
          <ScoreRing score={finalResult.interview_readiness_pct || 0} label="Interview Ready" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#e5e5e5", marginBottom: 8 }}>
          {(finalResult.overall_score || 0) >= 70 ? "Strong performance!" : (finalResult.overall_score || 0) >= 50 ? "Good effort — room to grow." : "Keep practicing."}
        </div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 24, maxWidth: 420, margin: "0 auto 24px" }}>
          Review each answer below to understand where you lost points.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn onClick={onFinish} variant="solid" tone="green"><RefreshCw size={14} /> New Interview</Btn>
        </div>

        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
          {questions.map((q: any) => {
            const fb = feedback[q.id];
            return (
              <div key={q.id} style={{ padding: "14px 16px", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                  <DiffBadge d={q.difficulty} />
                  <span style={{ fontSize: 13, color: "#ddd", fontWeight: 500 }}>{q.question}</span>
                </div>
                {fb && (
                  <div>
                    <div style={{ fontSize: 12, color: "#888", background: "#0d0d0d", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>{fb.answer}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: fb.score >= 70 ? "#00FF66" : fb.score >= 50 ? "#f59e0b" : "#ef4444" }}>{fb.score}/100</span>
                      <span style={{ fontSize: 12, color: "#777" }}>{fb.feedback}</span>
                    </div>
                    {fb.missed_keywords?.length > 0 && (
                      <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#555" }}>Missed:</span>
                        {fb.missed_keywords.map((k: string, i: number) => (
                          <span key={i} style={{ fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.06)", borderRadius: 4, padding: "1px 6px" }}>{k}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 4, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${(answeredIds.size / questions.length) * 100}%`, height: "100%", background: "#00FF66", transition: "width 0.4s" }} />
        </div>
        <span style={{ fontSize: 12, color: "#666", flexShrink: 0 }}>{answeredIds.size}/{questions.length}</span>
      </div>

      {/* Question nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {questions.map((q: any, i: number) => (
          <button key={q.id} onClick={() => !answeredIds.has(q.id) && setCurrentIdx(i)} style={{
            width: 28, height: 28, borderRadius: "50%", border: "none", cursor: answeredIds.has(q.id) ? "default" : "pointer",
            background: currentIdx === i ? "#00FF66" : answeredIds.has(q.id) ? "rgba(0,255,102,0.15)" : "#1a1a1a",
            color: currentIdx === i ? "#0a0a0a" : answeredIds.has(q.id) ? "#00FF66" : "#555",
            fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {answeredIds.has(q.id) ? <CheckCircle2 size={13} /> : i + 1}
          </button>
        ))}
      </div>

      {current && (
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <DiffBadge d={current.difficulty} />
            <span style={{ fontSize: 11, color: "#555" }}>{current.type}</span>
            <span style={{ fontSize: 11, color: "#7c3aed" }}>↳ {current.skill}</span>
          </div>

          <div style={{ fontSize: 16, fontWeight: 600, color: "#e5e5e5", lineHeight: 1.5, marginBottom: 20, padding: "16px 20px", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
            {current.question}
          </div>

          {feedback[current.id] ? (
            <div style={{ padding: "16px", background: "rgba(0,255,102,0.04)", border: "1px solid rgba(0,255,102,0.15)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <CheckCircle2 size={16} style={{ color: "#00FF66" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#00FF66" }}>{feedback[current.id].score}/100</span>
              </div>
              <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{feedback[current.id].feedback}</p>
              {currentIdx < questions.length - 1 && (
                <Btn onClick={() => setCurrentIdx(i => i + 1)} variant="outline" size="sm" style={{ marginTop: 12 }}>
                  Next question <ChevronRight size={14} />
                </Btn>
              )}
            </div>
          ) : (
            <>
              <div style={{ position: "relative" }}>
                <textarea
                  value={answer}
                  onChange={e => { if (!isListening) setAnswer(e.target.value); }}
                  placeholder={isListening ? "Listening… speak your answer." : "Type your answer or press the mic to speak."}
                  style={{
                    width: "100%", minHeight: 140, background: isListening ? "rgba(0,255,102,0.03)" : "#0d0d0d",
                    border: `1px solid ${isListening ? "rgba(0,255,102,0.4)" : "#222"}`,
                    borderRadius: 12, padding: "12px 48px 12px 14px", fontSize: 13, color: "#ccc",
                    resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                    lineHeight: 1.6, transition: "border-color 0.2s",
                  }}
                  onFocus={e => { if (!isListening) e.target.style.borderColor = "#00FF66"; }}
                  onBlur={e => { if (!isListening) e.target.style.borderColor = "#222"; }}
                />
                <button
                  onClick={isListening ? stopVoice : startVoice}
                  title={isListening ? "Stop recording" : "Speak your answer"}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: isListening ? "rgba(239,68,68,0.15)" : "rgba(0,255,102,0.08)",
                    color: isListening ? "#ef4444" : "#00FF66",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              </div>
              {isListening && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
                  <span style={{ fontSize: 12, color: "#ef4444" }}>Recording… press mic to stop</span>
                </div>
              )}
              {voiceError && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{voiceError}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <Btn onClick={submitAnswer} disabled={!answer.trim() || submitting} variant="solid" tone="green">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Target size={14} /> Submit Answer</>}
                </Btn>
                <span style={{ fontSize: 12, color: "#444" }}>{answer.length}/2000 chars</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Setup Panel ───────────────────────────────────────────────────────────────
function SetupPanel({ onStart }: { onStart: (data: any) => void }) {
  const [mode, setMode] = useState<"jd" | "custom" | "notes">("jd");
  const [customRole, setCustomRole] = useState("");
  const [selectedJd, setSelectedJd] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState("");

  const { data: jdHistory } = useQuery({
    queryKey: ["jd_history"],
    queryFn: async () => {
      const r = await apiFetch("/career/jd/");
      return r.ok ? r.json() : [];
    },
  });

  const { data: notesTopics } = useQuery({
    queryKey: ["interview_notes_topics"],
    queryFn: async () => {
      const r = await apiFetch("/interview/notes-topics/");
      return r.ok ? r.json() : [];
    },
    enabled: mode === "notes",
  });

  const MODES = [
    { id: "jd", label: "Job Description" },
    { id: "notes", label: "My Notes" },
    { id: "custom", label: "Custom Role" },
  ] as const;

  function isStartDisabled() {
    if (starting) return true;
    if (mode === "jd") return !selectedJd;
    if (mode === "notes") return !selectedTopicId;
    return !customRole.trim();
  }

  async function start() {
    setErr(""); setStarting(true);
    try {
      let body: any;
      if (mode === "jd" && selectedJd) body = { jd_id: selectedJd };
      else if (mode === "notes" && selectedTopicId) body = { topic_id: selectedTopicId };
      else body = { job_title: customRole };

      const r = await apiFetch("/interview/start/", { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Failed"); }
      const data = await r.json();
      onStart(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{
            flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: mode === m.id ? "rgba(0,255,102,0.08)" : "#111",
            border: `1px solid ${mode === m.id ? "rgba(0,255,102,0.3)" : "#222"}`,
            color: mode === m.id ? "#00FF66" : "#666",
          }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === "jd" && (
        <div>
          {(jdHistory || []).length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#555", fontSize: 13, background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
              No JD analyses yet. Go to Career Intel and analyze a job description first.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(jdHistory as any[]).map((j: any) => (
                <button key={j.id} onClick={() => setSelectedJd(j.id)} style={{
                  padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                  background: selectedJd === j.id ? "rgba(0,255,102,0.06)" : "#111",
                  border: `1px solid ${selectedJd === j.id ? "rgba(0,255,102,0.25)" : "#1e1e1e"}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{j.job_title || "Unnamed JD"}</div>
                    {j.company && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{j.company}</div>}
                  </div>
                  {selectedJd === j.id && <CheckCircle2 size={16} style={{ color: "#00FF66" }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "notes" && (
        <div>
          {!notesTopics ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#555", fontSize: 13 }}>
              <Loader2 size={16} className="animate-spin" style={{ margin: "0 auto 8px", display: "block" }} />
              Loading your notes…
            </div>
          ) : (notesTopics as any[]).length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#555", fontSize: 13, background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
              No notes found. Open a topic and write some notes first.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {(notesTopics as any[]).map((t: any) => (
                <button key={t.topic_id} onClick={() => setSelectedTopicId(t.topic_id)} style={{
                  padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                  background: selectedTopicId === t.topic_id ? "rgba(0,255,102,0.06)" : "#111",
                  border: `1px solid ${selectedTopicId === t.topic_id ? "rgba(0,255,102,0.25)" : "#1e1e1e"}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <BookOpen size={13} style={{ color: "#555" }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{t.topic_title}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                      {t.path_title} · {t.note_length} chars
                    </div>
                  </div>
                  {selectedTopicId === t.topic_id && <CheckCircle2 size={16} style={{ color: "#00FF66" }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === "custom" && (
        <input
          value={customRole}
          onChange={e => setCustomRole(e.target.value)}
          placeholder="e.g. Junior React Developer, Backend Engineer…"
          style={{ width: "100%", background: "#0d0d0d", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ccc", outline: "none", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = "#00FF66")}
          onBlur={e => (e.target.style.borderColor = "#222")}
        />
      )}

      {err && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 10 }}>{err}</p>}

      <Btn
        onClick={start}
        disabled={isStartDisabled()}
        variant="solid" tone="green"
        style={{ marginTop: 20, width: "100%", justifyContent: "center", height: 44 }}
      >
        {starting ? <Loader2 size={16} className="animate-spin" /> : <><Mic size={15} /> Start Interview</>}
      </Btn>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function InterviewPage() {
  const [activeInterview, setActiveInterview] = useState<any>(null);
  const [view, setView] = useState<"setup" | "active" | "history">("setup");
  const qc = useQueryClient();

  const { data: history } = useQuery({
    queryKey: ["interview_history"],
    queryFn: async () => {
      const r = await apiFetch("/interview/");
      return r.ok ? r.json() : [];
    },
  });

  function handleStart(data: any) {
    setActiveInterview(data);
    setView("active");
  }

  function handleFinish() {
    setActiveInterview(null);
    setView("setup");
    qc.invalidateQueries({ queryKey: ["interview_history"] });
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Mock Interview"
        title="Practice for Your Target Role"
        subtitle="AI asks real interview questions based on your JD analysis and weak areas. Get scored instantly."
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { id: "setup", label: "New Interview", icon: <Mic size={13} /> },
          { id: "history", label: `Past Interviews (${(history || []).length})`, icon: <History size={13} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id as any)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: view === t.id ? "rgba(0,255,102,0.08)" : "transparent",
            border: `1px solid ${view === t.id ? "rgba(0,255,102,0.25)" : "#1e1e1e"}`,
            color: view === t.id ? "#00FF66" : "#666",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {view === "setup" && <SetupPanel onStart={handleStart} />}
        {view === "active" && activeInterview && (
          <ActiveInterview interview={activeInterview} onFinish={handleFinish} />
        )}
        {view === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(history || []).length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#555", fontSize: 13 }}>
                No interviews yet. Start your first mock interview above.
              </div>
            ) : (history as any[]).map((h: any) => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "#161616", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Trophy size={18} style={{ color: h.overall_score >= 70 ? "#00FF66" : h.overall_score >= 50 ? "#f59e0b" : "#ef4444" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#ddd" }}>{h.job_title}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    {h.answers_count}/{h.questions_count} answered · {new Date(h.created_at).toLocaleDateString()}
                  </div>
                </div>
                {h.overall_score != null && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: h.overall_score >= 70 ? "#00FF66" : h.overall_score >= 50 ? "#f59e0b" : "#ef4444" }}>{h.overall_score}%</div>
                    <div style={{ fontSize: 11, color: "#555" }}>score</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
