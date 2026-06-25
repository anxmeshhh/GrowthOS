import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { OnboardingModal } from "@/components/onboarding-modal";
import {
  CheckCircle2, Circle, Flame, Target, Zap, BookOpen,
  BarChart2, Brain, TrendingUp, Clock, ChevronRight,
  Loader2, Award, AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/command")({
  head: () => ({ meta: [{ title: "Command Center — GrowthOS" }] }),
  component: CommandPage,
});

// ── Job Readiness Meter ───────────────────────────────────────────────────────

function JobReadinessMeter({ pct, weeks }: { pct: number; weeks?: number | null }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? "#00FF66" : pct >= 40 ? "#f59e0b" : "#7c3aed";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 128, height: 128 }}>
        <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="64" cy="64" r={r} fill="none" stroke="#1a1a1a" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: 10, color: "#555", marginTop: 2 }}>job-ready</span>
        </div>
      </div>
      {weeks != null && (
        <div style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
          ~{weeks} {weeks === 1 ? "week" : "weeks"} at current pace
        </div>
      )}
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────

const TASK_ICONS: Record<string, React.ReactNode> = {
  flashcards: <Brain size={15} style={{ color: "#a78bfa" }} />,
  topic: <BookOpen size={15} style={{ color: "#3b82f6" }} />,
  quiz: <Zap size={15} style={{ color: "#f59e0b" }} />,
  career: <Target size={15} style={{ color: "#00FF66" }} />,
  project: <TrendingUp size={15} style={{ color: "#06b6d4" }} />,
};

const PRIORITY_DOT: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#555",
};

function TaskCard({
  task,
  onComplete,
  completing,
}: {
  task: any;
  onComplete: (id: string) => void;
  completing: string | null;
}) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "14px 16px", borderRadius: 12,
      background: task.completed ? "rgba(0,255,102,0.03)" : "#111",
      border: `1px solid ${task.completed ? "rgba(0,255,102,0.1)" : "#1e1e1e"}`,
      opacity: task.completed ? 0.6 : 1,
      transition: "all 0.2s",
    }}>
      {/* Complete button */}
      <button
        onClick={() => !task.completed && onComplete(task.id)}
        disabled={task.completed || completing === task.id}
        style={{ background: "none", border: "none", cursor: task.completed ? "default" : "pointer", padding: 0, marginTop: 1, flexShrink: 0 }}
      >
        {completing === task.id
          ? <Loader2 size={20} style={{ color: "#666" }} className="animate-spin" />
          : task.completed
            ? <CheckCircle2 size={20} style={{ color: "#00FF66" }} />
            : <Circle size={20} style={{ color: "#333" }} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          {TASK_ICONS[task.type] || <Circle size={15} />}
          <span style={{
            fontSize: 14, fontWeight: 600,
            color: task.completed ? "#555" : "#ddd",
            textDecoration: task.completed ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {task.title}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{task.description}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "#444", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={10} /> {task.duration_min} min
          </span>
          <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>+{task.xp} XP</span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: PRIORITY_DOT[task.priority] || "#555" }} />
        </div>
      </div>

      {/* Go button */}
      {!task.completed && (
        <button
          onClick={() => navigate({ to: task.link })}
          style={{
            flexShrink: 0, background: "#161616", border: "1px solid #222",
            borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#888",
            display: "flex", alignItems: "center", gap: 4, fontSize: 12, marginTop: 1,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#ddd"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#333"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#888"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#222"; }}
        >
          Go <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

// ── Insights Panel ────────────────────────────────────────────────────────────

function InsightsPanel({ insights }: { insights: any }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Topics done", value: `${insights.topics.completed}/${insights.topics.total}`, color: "#00FF66", icon: <BookOpen size={14} /> },
          { label: "Avg quiz score", value: `${insights.quizzes.avg_score}%`, color: "#f59e0b", icon: <Zap size={14} /> },
          { label: "Weekly XP", value: insights.weekly_xp, color: "#a78bfa", icon: <Flame size={14} /> },
          { label: "Cards mastered", value: `${insights.flashcards.mastery_pct}%`, color: "#3b82f6", icon: <Brain size={14} /> },
        ].map(s => (
          <div key={s.label} style={{ padding: "14px", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "#555" }}>{s.icon}<span style={{ fontSize: 11 }}>{s.label}</span></div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Weak topics */}
      {insights.weak_topics?.length > 0 && (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertCircle size={12} style={{ color: "#ef4444" }} /> Needs attention
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.weak_topics.map((t: any) => (
              <div key={t.topic_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{t.title}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 20, padding: "2px 8px" }}>{t.best_score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong topics */}
      {insights.strong_topics?.length > 0 && (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Award size={12} style={{ color: "#00FF66" }} /> Your strengths
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.strong_topics.map((t: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{t.title}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#00FF66", background: "rgba(0,255,102,0.08)", border: "1px solid rgba(0,255,102,0.15)", borderRadius: 20, padding: "2px 8px" }}>{t.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-day mission history */}
      {insights.mission_history?.length > 0 && (
        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Mission history (7 days)
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {insights.mission_history.map((m: any) => {
              const pct = m.tasks_total > 0 ? m.tasks_done / m.tasks_total : 0;
              const h = Math.round(pct * 44);
              return (
                <div key={m.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", height: 44, background: "#1a1a1a", borderRadius: 4, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
                    <div style={{ width: "100%", height: h, background: pct >= 0.8 ? "#00FF66" : pct >= 0.4 ? "#f59e0b" : "#333", borderRadius: 4, transition: "height 0.5s" }} />
                  </div>
                  <span style={{ fontSize: 9, color: "#444" }}>{new Date(m.date).toLocaleDateString("en", { weekday: "short" })}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

// ── Level badge ───────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    beginner: { label: "Beginner", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    intermediate: { label: "Intermediate", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    expert: { label: "Expert", color: "#00FF66", bg: "rgba(0,255,102,0.1)" },
  };
  const s = map[level] || map.beginner;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: "3px 10px", border: `1px solid ${s.color}33` }}>
      {s.label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function CommandPage() {
  const qc = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);

  const { data: onboarding, isLoading: loadingOnboard } = useQuery({
    queryKey: ["onboarding"],
    queryFn: async () => {
      const r = await apiFetch("/onboarding/");
      return r.json();
    },
  });

  const { data: mission, isLoading: loadingMission } = useQuery({
    queryKey: ["daily_mission"],
    queryFn: async () => {
      const r = await apiFetch("/mission/today/");
      return r.json();
    },
    enabled: !!onboarding?.onboarding_completed,
  });

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ["learning_insights"],
    queryFn: async () => {
      const r = await apiFetch("/analytics/insights/");
      return r.json();
    },
    enabled: !!onboarding?.onboarding_completed,
  });

  const complete = useMutation({
    mutationFn: async (taskId: string) => {
      const r = await apiFetch("/mission/today/", {
        method: "POST",
        body: JSON.stringify({ task_id: taskId }),
      });
      return r.json();
    },
    onMutate: (taskId) => setCompleting(taskId),
    onSettled: () => {
      setCompleting(null);
      qc.invalidateQueries({ queryKey: ["daily_mission"] });
    },
  });

  if (loadingOnboard) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Loader2 size={28} style={{ color: "#555" }} className="animate-spin" />
      </div>
    );
  }

  if (!onboarding?.onboarding_completed) {
    return <OnboardingModal onComplete={() => qc.invalidateQueries({ queryKey: ["onboarding"] })} />;
  }

  const tasks: any[] = mission?.tasks || [];
  const doneCount = tasks.filter(t => t.completed).length;
  const allDone = tasks.length > 0 && doneCount === tasks.length;

  return (
    <div style={{ padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ padding: "28px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#e5e5e5", margin: 0 }}>Command Center</h1>
              {mission?.skill_level && <LevelBadge level={mission.skill_level} />}
            </div>
            {mission?.focus_message && (
              <p style={{ fontSize: 14, color: "#777", margin: 0, maxWidth: 560, lineHeight: 1.6 }}>
                {mission.focus_message}
              </p>
            )}
          </div>
          {insights && (
            <JobReadinessMeter
              pct={insights.job_readiness_pct}
              weeks={mission?.estimated_weeks_to_ready}
            />
          )}
        </div>
      </div>

      {/* Content grid */}
      <div style={{ padding: "24px 28px 0", display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>

        {/* LEFT: Today's Mission */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Today's Mission
            </div>
            {tasks.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 12, color: "#666" }}>{doneCount}/{tasks.length} done</div>
                <div style={{ width: 80, height: 4, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${tasks.length ? (doneCount / tasks.length * 100) : 0}%`, height: "100%", background: "#00FF66", borderRadius: 4, transition: "width 0.4s" }} />
                </div>
                {mission?.total_xp_available > 0 && (
                  <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>+{mission.total_xp_available} XP today</span>
                )}
              </div>
            )}
          </div>

          {loadingMission ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 80, background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, opacity: 0.5 }} />
              ))}
            </div>
          ) : allDone ? (
            <div style={{ padding: "40px 24px", textAlign: "center", background: "rgba(0,255,102,0.04)", border: "1px solid rgba(0,255,102,0.15)", borderRadius: 16 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#00FF66", marginBottom: 8 }}>Mission complete!</div>
              <div style={{ fontSize: 13, color: "#666" }}>You've finished all tasks for today. Rest up — tomorrow's mission will be waiting.</div>
            </div>
          ) : tasks.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", background: "#111", border: "1px solid #1e1e1e", borderRadius: 16 }}>
              <div style={{ fontSize: 13, color: "#555" }}>No tasks generated yet. Start a learning path to get your first mission.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tasks.map((t: any) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onComplete={(id) => complete.mutate(id)}
                  completing={completing}
                />
              ))}
            </div>
          )}

          {/* Weak topics callout */}
          {(mission?.weak_topics || []).length > 0 && (
            <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)", borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={12} /> Focus area
              </div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                Your quiz scores show you're weakest in{" "}
                <strong style={{ color: "#ddd" }}>
                  {mission.weak_topics.map((t: any) => t.title).join(", ")}
                </strong>
                . Today's mission prioritizes fixing these gaps.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Insights */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <BarChart2 size={12} /> Learning Insights
          </div>
          {loadingInsights ? (
            <div style={{ height: 300, background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, opacity: 0.5 }} />
          ) : insights ? (
            <InsightsPanel insights={insights} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
