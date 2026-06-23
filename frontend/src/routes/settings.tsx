import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, clearAuthTokens } from "@/lib/api-client";
import {
  Github,
  LogOut,
  AlertTriangle,
  Save,
  Loader2,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  ShieldAlert,
} from "lucide-react";
import { useGrowth } from "@/lib/growth-store";
import { useAppTutorial } from "@/components/tutorial-overlay";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — GrowthOS" },
      { name: "description", content: "Configure your account and integrations." },
    ],
  }),
  component: SettingsPage,
});

/* ── helpers ──────────────────────────────────────────────────────────── */

function minutesToDisplay(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function Skel({ className = "" }: { className?: string }) {
  return <div className={`rounded-[3px] bg-[#0f0f0f] animate-pulse ${className}`} />;
}

/* ── sub-components ───────────────────────────────────────────────────── */

function CardHeader({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-header">
      <div className="card-header-left">
        {icon}
        <span className="section-label">{title}</span>
      </div>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <p className="settings-row-label">{label}</p>
        {sub && <p className="settings-row-sub">{sub}</p>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state, update, reset } = useGrowth();
  const { startTutorial } = useAppTutorial();
  const [confirm, setConfirm] = useState(false);
  const [githubInput, setGithubInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [adminRequested, setAdminRequested] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const res = await apiFetch("/profile/");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  useEffect(() => {
    if (profile?.github_username) setGithubInput(profile.github_username);
  }, [profile]);

  const saveGithub = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiFetch("/profile/", {
        method: "PATCH",
        body: JSON.stringify({ github_username: username }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
      queryClient.invalidateQueries({ queryKey: ["github_repos"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleLogout = () => {
    clearAuthTokens();
    navigate({ to: "/login" });
  };

  const requestAdmin = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/auth/request-admin/", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to request admin access");
      return res.json();
    },
    onSuccess: () => {
      setAdminRequested(true);
    },
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-16 text-[#fff]">
          <Loader2 className="w-4 h-4 animate-spin mr-3" />
          <span className="text-sm font-mono uppercase tracking-widest">Loading…</span>
        </div>
      </PageShell>
    );
  }

  const joined = profile?.date_joined
    ? new Date(profile.date_joined).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <PageShell>
      {/* Page title row — matches profile's implicit heading style */}
      <div className="settings-page-header">
        <span className="section-label">Settings</span>
        <h1 className="settings-title">Configuration</h1>
        <p className="settings-subtitle">Account, integrations, and preferences.</p>
      </div>

      <div className="settings-stack">
        {/* ── Account ──────────────────────────────────────────────────── */}
        <div className="settings-card">
          <CardHeader icon={<User size={10} className="text-[#22c55e]" />} title="Account" />

          <div className="settings-card-body">
            <div className="account-fields">
              <div className="account-field">
                <span className="section-label" style={{ marginBottom: 6, display: "block" }}>
                  Username
                </span>
                <div className="readonly-field">
                  {isLoading ? <Skel className="h-4 w-28" /> : (profile?.username ?? "—")}
                </div>
              </div>
              <div className="account-field">
                <span className="section-label" style={{ marginBottom: 6, display: "block" }}>
                  Member Since
                </span>
                <div className="readonly-field">
                  <Calendar size={10} className="inline mr-1.5 opacity-40" />
                  {joined}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── GitHub Integration ───────────────────────────────────────── */}
        <div className="settings-card">
          <CardHeader
            icon={<Github size={10} className="text-[#f5f5f5]" />}
            title="GitHub Integration"
          />

          <div className="settings-card-body">
            <p className="settings-desc">
              Securely connect your GitHub account to enable advanced features like One-Click Repo
              Creation, Gist Publishing, and Automated Project Verification.
            </p>

            <div className="github-input-row mt-4">
              {profile?.github_username ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#161616] rounded-md p-3">
                    <span className="github-status-connected">
                      <CheckCircle2 size={12} className="text-[#22c55e]" />
                      Connected as&nbsp;
                      <a
                        href={`https://github.com/${profile.github_username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="github-link font-bold text-[#f0f0f0]"
                      >
                        {profile.github_username}
                      </a>
                    </span>
                    <button
                      className="settings-btn"
                      onClick={() => {
                        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
                        const redirectUri = `${window.location.origin}/auth/github/callback`;
                        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email,repo,gist&state=connect_workspace`;
                      }}
                    >
                      Reconnect Workspace
                    </button>
                  </div>
                  {profile?.has_github_workspace_access ? (
                    <p className="text-xs text-[#4ade80] font-mono tracking-wide uppercase">
                      ✓ Workspace permissions granted & encrypted
                    </p>
                  ) : (
                    <p className="text-xs text-[#ef4444] font-mono tracking-wide uppercase">
                      ⚠ Missing workspace permissions. Please reconnect.
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-full">
                  <button
                    className="w-full group flex items-center justify-center gap-3 h-10 px-4 rounded-md border border-[#1e1e1e] bg-[#0a0a0a] text-[#bbb] text-xs font-medium transition-all duration-200 hover:border-[#2a2a2a] hover:bg-[#111] hover:text-[#f0f0f0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
                    onClick={() => {
                      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
                      const redirectUri = `${window.location.origin}/auth/github/callback`;
                      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email,repo,gist&state=connect_workspace`;
                    }}
                  >
                    <Github size={14} className="text-[#fff]" />
                    Connect GitHub Workspace
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Preferences ─────────────────────────────────────────────── */}
        <div className="settings-card">
          <CardHeader
            icon={<CheckCircle2 size={10} className="text-[#f5f5f5]" />}
            title="Preferences"
          />
          <div className="settings-card-body">
            <SettingsRow
              label="Interactive Tutorial"
              sub="Restart the onboarding tutorial to learn the system's core features."
            >
              <button className="settings-btn-outline" onClick={startTutorial}>
                Restart Tutorial
              </button>
            </SettingsRow>
          </div>
        </div>

        {/* ── Daily Time Budget ────────────────────────────────────────── */}
        <div className="settings-card">
          <CardHeader
            icon={<Clock size={10} className="text-[#f59e0b]" />}
            title="Daily Time Budget"
          >
            <span className="section-label" style={{ color: "#22c55e" }}>
              {minutesToDisplay(state.settings.dailyMinutes)}
            </span>
          </CardHeader>

          <div className="settings-card-body">
            <p className="settings-desc">Set how much time you want to spend learning each day.</p>
            <input
              type="range"
              min={20}
              max={180}
              step={5}
              value={state.settings.dailyMinutes}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  settings: { ...s.settings, dailyMinutes: Number(e.target.value) },
                }))
              }
              className="time-slider"
            />
            <div className="slider-ticks">
              {[20, 60, 120, 180].map((v) => (
                <span key={v} className="slider-tick">
                  {minutesToDisplay(v)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Focus Engine (Pomodoro) ─────────────────────────────────── */}
        <div className="settings-card">
          <CardHeader icon={<Clock size={10} className="text-[#f5f5f5]" />} title="Focus Engine" />

          <div className="settings-card-body space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="settings-row-label">Focus Duration</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    placeholder="0"
                    value={state.settings.pomodoroFocus === 0 ? "" : state.settings.pomodoroFocus}
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        settings: { ...s.settings, pomodoroFocus: Number(e.target.value) },
                      }))
                    }
                    className="w-16 bg-[#0a0a0a] border border-[#161616] rounded-md px-2 py-1 text-xs text-[#22c55e] font-mono text-center focus:outline-none focus:border-[#22c55e]/50 placeholder:text-[#22c55e]/30"
                  />
                  <span className="text-xs text-[#555] font-mono">min</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="settings-row-label">Short Break</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    placeholder="0"
                    value={
                      state.settings.pomodoroShortBreak === 0
                        ? ""
                        : state.settings.pomodoroShortBreak
                    }
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        settings: { ...s.settings, pomodoroShortBreak: Number(e.target.value) },
                      }))
                    }
                    className="w-16 bg-[#0a0a0a] border border-[#161616] rounded-md px-2 py-1 text-xs text-[#3b82f6] font-mono text-center focus:outline-none focus:border-[#3b82f6]/50 placeholder:text-[#3b82f6]/30"
                  />
                  <span className="text-xs text-[#555] font-mono">min</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="settings-row-label">Long Break</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    placeholder="0"
                    value={
                      state.settings.pomodoroLongBreak === 0 ? "" : state.settings.pomodoroLongBreak
                    }
                    onChange={(e) =>
                      update((s) => ({
                        ...s,
                        settings: { ...s.settings, pomodoroLongBreak: Number(e.target.value) },
                      }))
                    }
                    className="w-16 bg-[#0a0a0a] border border-[#161616] rounded-md px-2 py-1 text-xs text-[#a855f7] font-mono text-center focus:outline-none focus:border-[#a855f7]/50 placeholder:text-[#a855f7]/30"
                  />
                  <span className="text-xs text-[#555] font-mono">min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Admin Privileges ────────────────────────────────────────── */}
        {!profile?.user?.is_staff && (
          <div className="settings-card">
            <CardHeader
              icon={<ShieldAlert size={10} className="text-[#f5f5f5]" />}
              title="Admin Privileges"
            />
            <div className="settings-card-body">
              <SettingsRow
                label="Request Admin Access"
                sub="Request superuser permissions to manage users and view the Command Override."
              >
                <button
                  className="settings-btn-outline"
                  onClick={() => requestAdmin.mutate()}
                  disabled={requestAdmin.isPending || adminRequested}
                >
                  <ShieldAlert size={11} />
                  {adminRequested ? "Request Pending" : "Request Access"}
                </button>
              </SettingsRow>
            </div>
          </div>
        )}

        {/* ── Sign Out ─────────────────────────────────────────────────── */}
        <div className="settings-card">
          <CardHeader icon={<LogOut size={10} className="text-[#f5f5f5]" />} title="Session" />
          <div className="settings-card-body">
            <SettingsRow label="Sign out" sub="Ends your current session on this device.">
              <button className="settings-btn-outline" onClick={handleLogout}>
                <LogOut size={11} /> Sign out
              </button>
            </SettingsRow>
          </div>
        </div>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <div className="settings-card settings-card-danger">
          <CardHeader
            icon={<AlertTriangle size={10} className="text-[#ef4444]" />}
            title="Danger Zone"
          />
          <div className="settings-card-body">
            <SettingsRow
              label="Reset all progress"
              sub="Permanently wipes all topics, XP, and flashcards. Cannot be undone."
            >
              {confirm ? (
                <div className="confirm-row">
                  <button
                    className="settings-btn-red"
                    onClick={async () => {
                      await apiFetch("/profile/reset/", { method: "POST" });
                      reset();
                      setConfirm(false);
                      window.location.reload();
                    }}
                  >
                    Confirm reset
                  </button>
                  <button className="settings-btn-ghost" onClick={() => setConfirm(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="settings-btn-red-outline" onClick={() => setConfirm(true)}>
                  Reset
                </button>
              )}
            </SettingsRow>
          </div>
        </div>
      </div>

      {/* ── styles ────────────────────────────────────────────────────── */}
      <style>{`

        /* ── Page header ── */
        .settings-page-header {
          padding: 6px 2px 18px;
        }
        .settings-title {
          font-size: 20px;
          font-weight: 600;
          color: #f5f5f5;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 4px 0 3px;
        }
        .settings-subtitle {
          font-size: 11px;
          color: #555;
          font-family: ui-monospace, monospace;
        }

        /* ── Stack ── */
        .settings-stack {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* ── Card shell — mirrors .profile-card exactly ── */
        .settings-card {
          border: 1px solid #131313;
          border-radius: 6px;
          background: #060606;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .settings-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #1c1c1c 30%, #1c1c1c 70%, transparent 100%);
          pointer-events: none;
        }
        .settings-card-danger {
          border-color: rgba(239,68,68,0.12);
        }
        .settings-card-danger::before {
          background: linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.1) 30%, rgba(239,68,68,0.1) 70%, transparent 100%);
        }

        /* ── Card header — mirrors .card-header exactly ── */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 14px;
          border-bottom: 1px solid #0f0f0f;
          flex-shrink: 0;
          background: #080808;
        }
        .card-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Section label — mirrors .section-label exactly ── */
        .section-label {
          font-size: 8px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #333;
        }

        /* ── Card body ── */
        .settings-card-body {
          padding: 14px 16px;
        }

        /* ── Desc text ── */
        .settings-desc {
          font-size: 11px;
          color: #666;
          font-family: ui-monospace, monospace;
          line-height: 1.6;
          margin-bottom: 12px;
        }

        /* ── Account fields ── */
        .account-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 480px) {
          .account-fields { grid-template-columns: 1fr; }
        }
        .account-field {}
        .readonly-field {
          font-size: 12px;
          font-family: ui-monospace, monospace;
          color: #e0e0e0;
          background: #0a0a0a;
          border: 1px solid #161616;
          border-radius: 4px;
          padding: 6px 10px;
          letter-spacing: 0.03em;
        }

        /* ── GitHub ── */
        .github-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .github-input-wrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          background: #0a0a0a;
          border: 1px solid #161616;
          border-radius: 4px;
          transition: border-color 0.15s ease;
        }
        .github-input-wrap:focus-within {
          border-color: rgba(34,197,94,0.3);
        }
        .github-prefix {
          font-size: 11px;
          font-family: ui-monospace, monospace;
          color: #333;
          padding: 0 0 0 10px;
          white-space: nowrap;
          user-select: none;
          pointer-events: none;
        }
        .github-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 12px;
          font-family: ui-monospace, monospace;
          color: #e0e0e0;
          padding: 7px 10px 7px 2px;
          min-width: 0;
        }
        .github-input::placeholder { color: #252525; }

        .github-status {
          margin-top: 8px;
          height: 16px;
          display: flex;
          align-items: center;
        }
        .github-status-connected {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-family: ui-monospace, monospace;
          color: #22c55e;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .github-status-disconnected {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          font-family: ui-monospace, monospace;
          color: #2a2a2a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .github-link {
          color: #22c55e;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.15s;
        }
        .github-link:hover { color: #4ade80; }

        /* ── Slider ── */
        .time-slider {
          width: 100%;
          accent-color: #22c55e;
          height: 2px;
          cursor: pointer;
        }
        .slider-ticks {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
        }
        .slider-tick {
          font-size: 8px;
          font-family: ui-monospace, monospace;
          color: #282828;
          letter-spacing: 0.08em;
        }

        /* ── Settings row ── */
        .settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .settings-row-text { flex: 1; min-width: 0; }
        .settings-row-label {
          font-size: 12px;
          font-weight: 500;
          color: #e0e0e0;
          font-family: ui-monospace, monospace;
          letter-spacing: 0.02em;
        }
        .settings-row-sub {
          font-size: 10px;
          color: #3a3a3a;
          font-family: ui-monospace, monospace;
          margin-top: 3px;
          line-height: 1.4;
        }
        .settings-row-control { flex-shrink: 0; }

        /* ── Confirm row ── */
        .confirm-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Buttons ── */
        .settings-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid #1e1e1e;
          background: #0e0e0e;
          font-size: 10px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #d0d0d0;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }
        .settings-btn:hover:not(:disabled) {
          border-color: #2a2a2a;
          color: #f0f0f0;
        }
        .settings-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .settings-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid #1e1e1e;
          background: transparent;
          font-size: 10px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #aaa;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }
        .settings-btn-outline:hover {
          border-color: #2e2e2e;
          color: #e0e0e0;
        }

        .settings-btn-red {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid rgba(239,68,68,0.3);
          background: rgba(239,68,68,0.08);
          font-size: 10px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #ef4444;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
          white-space: nowrap;
        }
        .settings-btn-red:hover {
          background: rgba(239,68,68,0.14);
          border-color: rgba(239,68,68,0.5);
        }

        .settings-btn-red-outline {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid rgba(239,68,68,0.2);
          background: transparent;
          font-size: 10px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #7a2a2a;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }
        .settings-btn-red-outline:hover {
          border-color: rgba(239,68,68,0.4);
          color: #ef4444;
        }

        .settings-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 4px;
          border: none;
          background: transparent;
          font-size: 10px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #333;
          cursor: pointer;
          transition: color 0.15s ease;
          white-space: nowrap;
        }
        .settings-btn-ghost:hover { color: #888; }
      `}</style>
    </PageShell>
  );
}
