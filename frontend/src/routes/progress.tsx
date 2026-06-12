import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Flame } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts";
import { PageShell, PageHeader, Card, Progress } from "@/components/growth-ui";
import { useGrowth, computeStreak, moduleCompletion } from "@/lib/growth-store";
import { MODULES, PATHS } from "@/lib/growth-data";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — GrowthOS" }, { name: "description", content: "Heatmap, streaks and per-module completion." }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const { state } = useGrowth();
  const path = PATHS.find((p) => p.id === state.settings.pathId)!;
  const streak = computeStreak(state.activeDays);
  const longest = useMemo(() => {
    const sorted = [...state.activeDays].sort();
    let best = 0, cur = 0;
    let prev: Date | null = null;
    for (const d of sorted) {
      const dt = new Date(d);
      if (prev) {
        const diff = (dt.getTime() - prev.getTime()) / 86400000;
        if (Math.round(diff) === 1) cur++;
        else cur = 1;
      } else cur = 1;
      best = Math.max(best, cur);
      prev = dt;
    }
    return best;
  }, [state.activeDays]);

  // Heatmap: last 52 weeks * 7 days
  const weeks = 26; // half year for layout density
  const set = new Set(state.activeDays);
  const cells: { date: string; level: number }[][] = [];
  const today = new Date();
  // align to Sunday
  const dayOfWeek = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - (weeks * 7 - 1 - (6 - dayOfWeek)));
  for (let w = 0; w < weeks; w++) {
    const col: { date: string; level: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      const key = dt.toISOString().slice(0, 10);
      const active = set.has(key) && dt <= today;
      col.push({ date: key, level: active ? 2 + Math.floor(Math.random() * 2) : 0 });
    }
    cells.push(col);
  }
  const color = (lvl: number) => lvl === 0 ? "bg-[#1a1a1a]" : lvl === 1 ? "bg-[#14532d]" : lvl === 2 ? "bg-[#16a34a]" : "bg-[#22c55e]";

  // Weekly chart data: last 8 weeks topics completed
  const weekly = useMemo(() => {
    const buckets: { week: string; topics: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const count = Object.values(state.progress).filter((p) => {
        if (!p.completedAt) return false;
        const d = new Date(p.completedAt);
        return d >= start && d <= end;
      }).length;
      buckets.push({ week: `W-${i}`, topics: count });
    }
    return buckets;
  }, [state.progress]);

  const daily = useMemo(() => {
    const buckets: { day: string; rate: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.push({ day: key.slice(5), rate: set.has(key) ? 100 : 0 });
    }
    return buckets;
  }, [state.activeDays]);

  return (
    <PageShell>
      <PageHeader kicker="Your Progress" title={path.name} subtitle="Streaks, heatmap, and what's still ahead." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card className="p-5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">Current Streak</div>
          <div className="flex items-center gap-3">
            <Flame size={28} className="text-[#22c55e]" />
            <div className="text-4xl font-semibold font-mono tracking-tight text-[#22c55e]">{streak}</div>
            <div className="text-xs text-[#999] font-mono uppercase">days</div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">Longest Streak</div>
          <div className="text-3xl font-semibold font-mono">{longest}d</div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">Active Days (30d)</div>
          <div className="text-3xl font-semibold font-mono">{state.activeDays.filter((d) => Date.now() - new Date(d).getTime() < 30 * 86400000).length}</div>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="p-5 mb-6">
        <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-4">Activity</div>
        <div className="flex gap-1 overflow-x-auto">
          {cells.map((col, i) => (
            <div key={i} className="flex flex-col gap-1">
              {col.map((c) => (
                <div key={c.date} title={c.date} className={`h-3 w-3 rounded-sm ${color(c.level)}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#666]">
          Less <div className="h-3 w-3 rounded-sm bg-[#1a1a1a]" /><div className="h-3 w-3 rounded-sm bg-[#14532d]" /><div className="h-3 w-3 rounded-sm bg-[#16a34a]" /><div className="h-3 w-3 rounded-sm bg-[#22c55e]" /> More
        </div>
      </Card>

      {/* Per module */}
      <Card className="p-5 mb-6">
        <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-4">By Module</div>
        <ul className="space-y-3">
          {MODULES.map((m) => {
            const c = moduleCompletion(state, m.id);
            return (
              <li key={m.id} className="flex items-center gap-3 text-sm">
                <div className="w-44 truncate">{m.title}</div>
                <div className="flex-1"><Progress value={c.pct} /></div>
                <div className="font-mono text-xs text-[#999] w-20 text-right">{c.pct}% · {c.done}/{c.total}</div>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-3">Topics / Week</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="#666" fontSize={11} tickLine={false} axisLine={{ stroke: "#222" }} />
                <YAxis stroke="#666" fontSize={11} allowDecimals={false} tickLine={false} axisLine={{ stroke: "#222" }} />
                <Tooltip cursor={{ fill: "#161616" }} contentStyle={{ background: "#0a0a0a", border: "1px solid #222", fontSize: 12 }} />
                <Bar dataKey="topics" fill="#22c55e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-3">Mission Completion (30d)</div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#666" fontSize={10} tickLine={false} axisLine={{ stroke: "#222" }} />
                <YAxis stroke="#666" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={{ stroke: "#222" }} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #222", fontSize: 12 }} />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}