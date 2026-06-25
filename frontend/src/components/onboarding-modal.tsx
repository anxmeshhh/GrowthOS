import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Loader2, Target, Briefcase, Zap, BookOpen, Clock, ChevronRight } from "lucide-react";

interface Props {
  onComplete: () => void;
}

const LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    desc: "Just starting out — I need clear structure and hand-holding.",
    icon: "🌱",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    desc: "I know the basics but have gaps — I need to identify and fix them.",
    icon: "🔥",
  },
  {
    id: "expert",
    label: "Expert",
    desc: "I'm experienced — I need to target specific skills and career gaps.",
    icon: "⚡",
  },
];

const GOALS = [
  { id: "get_job", label: "Get a dev job", icon: <Briefcase size={16} /> },
  { id: "upskill", label: "Upskill at my job", icon: <Zap size={16} /> },
  { id: "freelance", label: "Start freelancing", icon: <Target size={16} /> },
  { id: "hobby", label: "Learn for fun", icon: <BookOpen size={16} /> },
];

const HOURS = [
  { value: 0.5, label: "~30 min / day" },
  { value: 1, label: "~1 hr / day" },
  { value: 2, label: "~2 hrs / day" },
  { value: 4, label: "4+ hrs / day" },
];

export function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [role, setRole] = useState("");
  const [hours, setHours] = useState(1);
  const [saving, setSaving] = useState(false);

  const canNext = [
    !!level,
    !!goal,
    true,
  ][step];

  async function finish() {
    setSaving(true);
    try {
      await apiFetch("/onboarding/", {
        method: "POST",
        body: JSON.stringify({
          skill_level: level,
          learning_goal: goal,
          target_role: role,
          available_hours_per_day: hours,
        }),
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "#111", border: "1px solid #222", borderRadius: 16,
        width: "100%", maxWidth: 480, padding: "32px 28px",
        boxShadow: "0 0 0 1px #1a1a1a, 0 32px 64px rgba(0,0,0,0.6)",
      }}>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: i <= step ? "#00FF66" : "#222",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Step 0: Skill level */}
        {step === 0 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e5e5e5", marginBottom: 6 }}>
                Where are you right now?
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>
                GrowthOS adapts everything to your level — tasks, pace, depth.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => setLevel(l.id)} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "14px 16px", borderRadius: 12,
                  background: level === l.id ? "rgba(0,255,102,0.08)" : "#161616",
                  border: `1px solid ${level === l.id ? "rgba(0,255,102,0.35)" : "#222"}`,
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 22, lineHeight: 1, marginTop: 1 }}>{l.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: level === l.id ? "#00FF66" : "#ddd", marginBottom: 3 }}>
                      {l.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{l.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Learning goal */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e5e5e5", marginBottom: 6 }}>
                What's your main goal?
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>
                Your daily missions and career tracking will be tuned to this.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => setGoal(g.id)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "20px 12px", borderRadius: 12,
                  background: goal === g.id ? "rgba(0,255,102,0.08)" : "#161616",
                  border: `1px solid ${goal === g.id ? "rgba(0,255,102,0.35)" : "#222"}`,
                  cursor: "pointer", transition: "all 0.15s",
                  color: goal === g.id ? "#00FF66" : "#888",
                }}>
                  {g.icon}
                  <span style={{ fontSize: 13, fontWeight: 600, color: goal === g.id ? "#00FF66" : "#ccc" }}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Role + hours */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e5e5e5", marginBottom: 6 }}>
                Last step
              </div>
              <div style={{ fontSize: 13, color: "#666" }}>
                This helps GrowthOS give you a realistic timeline.
              </div>
            </div>

            {goal === "get_job" && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                  Target role (optional)
                </label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Junior React Developer, Backend Engineer…"
                  style={{
                    width: "100%", background: "#0d0d0d", border: "1px solid #222",
                    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ccc",
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#00FF66")}
                  onBlur={e => (e.target.style.borderColor = "#222")}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                <Clock size={12} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />
                How much time can you study daily?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {HOURS.map(h => (
                  <button key={h.value} onClick={() => setHours(h.value)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 16px", borderRadius: 10,
                    background: hours === h.value ? "rgba(0,255,102,0.08)" : "#161616",
                    border: `1px solid ${hours === h.value ? "rgba(0,255,102,0.35)" : "#222"}`,
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 13, color: hours === h.value ? "#00FF66" : "#ccc" }}>{h.label}</span>
                    {hours === h.value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00FF66" }} />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              padding: "10px 20px", borderRadius: 10, background: "transparent",
              border: "1px solid #222", color: "#888", fontSize: 13, cursor: "pointer",
            }}>
              Back
            </button>
          )}
          <button
            disabled={!canNext || saving}
            onClick={() => step < 2 ? setStep(s => s + 1) : finish()}
            style={{
              flex: 1, padding: "11px 20px", borderRadius: 10,
              background: canNext ? "#00FF66" : "#1a1a1a",
              border: "none", color: canNext ? "#0a0a0a" : "#444",
              fontSize: 14, fontWeight: 700, cursor: canNext ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.15s",
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : step < 2 ? (<>Continue <ChevronRight size={16} /></>) : "Set up my Command Center"}
          </button>
        </div>
      </div>
    </div>
  );
}
