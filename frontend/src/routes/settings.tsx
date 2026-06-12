import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, PageHeader, Card, Btn } from "@/components/growth-ui";
import { useGrowth } from "@/lib/growth-store";
import { PATHS } from "@/lib/growth-data";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — GrowthOS" }, { name: "description", content: "Configure your learning path, schedule and profile." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, update, reset } = useGrowth();
  const [confirm, setConfirm] = useState(false);

  return (
    <PageShell>
      <PageHeader kicker="Settings" title="Workspace" subtitle="Configure your path, schedule and profile." />

      <Card className="p-5 mb-4">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-3">Learning Path</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PATHS.map((p) => {
            const active = state.settings.pathId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => update((s) => ({ ...s, settings: { ...s.settings, pathId: p.id, enabledPaths: s.settings.enabledPaths.includes(p.id) ? s.settings.enabledPaths : [...s.settings.enabledPaths, p.id] } }))}
                className={"flex items-start gap-3 p-3 rounded border text-left transition-colors " + (active ? "border-[#22c55e]/40 bg-[#0d1a0d]" : "border-[#222] hover:bg-[#161616]")}
              >
                <div className={"mt-0.5 h-4 w-4 rounded-full border-2 " + (active ? "border-[#22c55e] bg-[#22c55e]" : "border-[#444]")} />
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mt-0.5">{p.tagline}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-2">Daily Time Budget</div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={20} max={180} step={5}
            value={state.settings.dailyMinutes}
            onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, dailyMinutes: Number(e.target.value) } }))}
            className="flex-1 accent-[#22c55e]"
          />
          <div className="font-mono text-sm text-[#22c55e] w-16 text-right">{state.settings.dailyMinutes} min</div>
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-3">Profile</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666]">Display name</label>
            <input
              value={state.settings.displayName}
              onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, displayName: e.target.value } }))}
              className="mt-1 w-full bg-[#0f0f0f] border border-[#222] rounded px-3 py-2 text-sm outline-none focus:border-[#22c55e]/50"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666]">Timezone</label>
            <select
              value={state.settings.timezone}
              onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, timezone: e.target.value } }))}
              className="mt-1 w-full bg-[#0f0f0f] border border-[#222] rounded px-3 py-2 text-sm outline-none focus:border-[#22c55e]/50"
            >
              {["Asia/Kolkata", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Singapore", "UTC"].map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-3">Paths in Workspace</div>
        <ul className="space-y-2">
          {PATHS.map((p) => {
            const on = state.settings.enabledPaths.includes(p.id);
            return (
              <li key={p.id} className="flex items-center justify-between border border-[#222] rounded px-3 py-2.5">
                <div>
                  <div className="text-sm">{p.name}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">{p.tagline}</div>
                </div>
                <button
                  onClick={() => update((s) => ({ ...s, settings: { ...s.settings, enabledPaths: on ? s.settings.enabledPaths.filter((x) => x !== p.id) : [...s.settings.enabledPaths, p.id] } }))}
                  className={"relative inline-flex h-5 w-9 rounded-full transition-colors " + (on ? "bg-[#22c55e]" : "bg-[#222]")}
                  aria-label="toggle"
                >
                  <span className={"inline-block h-4 w-4 rounded-full bg-white transition-transform translate-y-0.5 " + (on ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-5">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-3">Data</div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" onClick={() => {
            const blob = new Blob([JSON.stringify(state.notes, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "growthos-notes.json"; a.click();
            URL.revokeObjectURL(url);
          }}>Export Notes</Btn>
          {confirm ? (
            <>
              <Btn tone="red" size="sm" onClick={() => { reset(); setConfirm(false); }}>Confirm reset</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Btn>
            </>
          ) : (
            <Btn tone="red" variant="outline" size="sm" onClick={() => setConfirm(true)}>Reset Progress</Btn>
          )}
        </div>
      </Card>
    </PageShell>
  );
}