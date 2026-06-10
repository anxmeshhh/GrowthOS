import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Compass, Save, ShieldAlert, User } from "lucide-react";
import { useGrowthState, type LearningPath, type LearningRole } from "@/hooks/use-growth-state";
import { LEARNING_PATHS, LEARNING_ROLES } from "@/lib/roadmaps";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · GrowthOS" },
      { name: "description", content: "Preferences, roles, and learning paths." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, setProfile, resetAll } = useGrowthState();
  const [successMsg, setSuccessMsg] = useState("");
  const [paths, setPaths] = useState<LearningPath[]>(state.profile.paths);
  const [roles, setRoles] = useState<LearningRole[]>(state.profile.roles);

  const togglePath = (path: LearningPath) => {
    setPaths((current) => {
      if (current.includes(path)) {
        return current.length === 1 ? current : current.filter((item) => item !== path);
      }
      return [...current, path];
    });
  };

  const toggleRole = (role: LearningRole) => {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const preferredPath = formData.get("path") as LearningPath;

    setProfile({
      name: formData.get("name") as string,
      githubUser: (formData.get("githubUser") as string) || null,
      dailyGoalHours: Number(formData.get("dailyGoalHours") || 2),
      timezone: formData.get("timezone") as string,
      theme: formData.get("theme") as "dark" | "light" | "system",
      paths,
      roles,
      path: paths.includes(preferredPath) ? preferredPath : paths[0],
    });

    setSuccessMsg("Workspace preferences saved.");
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  const handleReset = () => {
    if (confirm("Reset all local progress, notes, sketches, and repo links?")) {
      resetAll();
      setSuccessMsg("Progress reset for the selected paths.");
      setTimeout(() => setSuccessMsg(""), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <header>
        <div className="text-xs font-mono text-[var(--in-progress)] font-bold tracking-wider mb-2">
          SETTINGS
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Learning Workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select every path and role GrowthOS should guide. One path stays active for the roadmap
          view.
        </p>
      </header>

      {successMsg && (
        <div className="bg-[var(--surface-2)] border border-[var(--completed)]/40 text-[var(--completed)] px-4 py-3 rounded-md text-sm font-medium">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-3">
            <User className="w-4 h-4 text-[var(--in-progress)]" />
            Basic Info
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Field label="Display Name">
              <input
                name="name"
                defaultValue={state.profile.name}
                required
                className="w-full bg-[var(--surface)] border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--in-progress)]"
              />
            </Field>
            <Field label="GitHub Username">
              <input
                name="githubUser"
                defaultValue={state.profile.githubUser || ""}
                placeholder="anxmeshhh"
                className="w-full bg-[var(--surface)] border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--in-progress)]"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-3">
            <Compass className="w-4 h-4 text-[var(--available)]" />
            Paths And Roles
          </h2>

          <div>
            <div className="text-xs text-muted-foreground uppercase font-mono mb-2">
              Learning Paths
            </div>
            <div className="grid md:grid-cols-5 gap-2">
              {Object.values(LEARNING_PATHS).map((path) => {
                const checked = paths.includes(path.id);
                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => togglePath(path.id)}
                    className={`text-left rounded-md border p-3 transition-colors ${
                      checked
                        ? "border-[var(--in-progress)] bg-[var(--surface-2)]"
                        : "border-border bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{path.shortTitle}</span>
                      <span
                        className={`w-3 h-3 rounded-[4px] border ${checked ? "bg-[var(--in-progress)] border-[var(--in-progress)]" : "border-border"}`}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-3">
                      {path.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Field label="Active Roadmap View">
              <select
                name="path"
                defaultValue={state.profile.path}
                className="w-full bg-[var(--surface)] border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--in-progress)]"
              >
                {paths.map((path) => (
                  <option key={path} value={path}>
                    {LEARNING_PATHS[path].title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Daily Goal">
              <select
                name="dailyGoalHours"
                defaultValue={state.profile.dailyGoalHours}
                className="w-full bg-[var(--surface)] border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--in-progress)]"
              >
                <option value="1">1 checkpoint per day</option>
                <option value="2">2 checkpoints per day</option>
                <option value="3">3 checkpoints per day</option>
                <option value="4">4 checkpoints per day</option>
              </select>
            </Field>
          </div>

          <div>
            <div className="text-xs text-muted-foreground uppercase font-mono mb-2">
              Target Roles
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              {LEARNING_ROLES.map((role) => {
                const checked = roles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`text-left rounded-md border p-3 transition-colors ${
                      checked
                        ? "border-[var(--completed)] bg-[var(--surface-2)]"
                        : "border-border bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    <div className="text-sm font-medium">{role.title}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">{role.summary}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-3">
            <Award className="w-4 h-4 text-[var(--completed)]" />
            Display And Timezone
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <Field label="Interface Theme">
              <select
                name="theme"
                defaultValue={state.profile.theme}
                className="w-full bg-[var(--surface)] border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--in-progress)]"
              >
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="system">System Default</option>
              </select>
            </Field>
            <Field label="Timezone">
              <select
                name="timezone"
                defaultValue={state.profile.timezone}
                className="w-full bg-[var(--surface)] border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--in-progress)]"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC / GMT</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </Field>
          </div>
        </section>

        <button
          type="submit"
          className="w-full py-2.5 rounded-md bg-foreground text-background font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Workspace
        </button>
      </form>

      <section className="rounded-lg border border-destructive/40 bg-destructive/5 p-5 md:p-6 space-y-4">
        <h2 className="text-sm font-semibold text-destructive flex items-center gap-2 border-b border-destructive/20 pb-3">
          <ShieldAlert className="w-4 h-4 text-destructive" />
          Danger Zone
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Resetting clears local progress, checklist state, notes, sketches, and project repo links.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-destructive/40 rounded-md text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer"
        >
          Reset All Progress
        </button>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-xs text-muted-foreground uppercase font-mono block">{label}</span>
      {children}
    </label>
  );
}
