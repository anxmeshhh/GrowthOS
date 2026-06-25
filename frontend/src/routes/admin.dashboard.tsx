import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getAuthToken } from "@/lib/api-client";
import {
  Users,
  Map,
  BookOpen,
  Shield,
  Activity,
  ArrowUpRight,
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  X,
  Flame,
  Award,
  Trophy,
  Zap,
  TrendingUp,
  Trash2,
  Lock,
  Unlock,
  Github,
  FileText,
  LayoutList,
  LayoutDashboard,
  BarChart3,
  Database,
  Download,
  Settings as SettingsIcon,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/toast-context";
import { ActivityCalendar } from "react-activity-calendar";

export const Route = createFileRoute("/admin/dashboard")({
  // H5: don't render the admin console for unauthenticated visitors. The
  // server still enforces is_staff/superuser on every /admin/* endpoint.
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getAuthToken()) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminDashboard,
});

type AdminTab = "overview" | "users" | "content" | "analytics" | "settings" | "operations";

function AdminDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const res = await apiFetch("/admin/stats/");
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) navigate({ to: "/admin/login" });
        throw new Error("Failed to fetch stats");
      }
      return res.json();
    },
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const res = await apiFetch("/admin/users/");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: adminRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["admin_requests"],
    queryFn: async () => {
      const res = await apiFetch("/admin/requests/");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const toggleUserStatus = async (userId: number, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await apiFetch(`/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      showToast(`User ${currentStatus ? "suspended" : "activated"} successfully`, "xp");
      refetchUsers();
      if (selectedUserId === userId) {
        queryClient.invalidateQueries({ queryKey: ["admin_user_detail", userId] });
      }
    } catch {
      showToast("Action failed", "error");
    }
  };

  const handleAdminRequest = async (reqId: number, status: "approved" | "rejected") => {
    try {
      const res = await apiFetch(`/admin/requests/${reqId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Only main admin can approve.");
        throw new Error("Action failed");
      }
      showToast(`Request ${status}`, "xp");
      refetchRequests();
      refetchUsers();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const downloadBackup = async () => {
    try {
      showToast("Generating backup...", "xp");
      const res = await apiFetch("/admin/export-data/");
      if (!res.ok) throw new Error("Super admin clearance required.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `growthos_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      showToast("Backup downloaded", "xp");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const filteredUsers = users.filter(
    (u: any) =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard size={15} /> },
    { id: "users", label: "Users", icon: <Users size={15} />, badge: adminRequests.length || undefined },
    { id: "content", label: "Content", icon: <BookOpen size={15} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={15} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={15} /> },
    { id: "operations", label: "Operations", icon: <Database size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-auto selection:bg-red-500/30">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="text-gray-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-1 cursor-pointer mb-2"
            >
              ← Return to GrowthOS
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <ShieldAlert className="text-red-500" />
              Command Override
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">Admin Control Center</p>
          </div>
          <div className="px-3 py-1 rounded-full border border-red-900 bg-red-950/30 text-red-500 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Live System
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-1 mb-6 border-b border-[#1a1a1a] overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                tab === t.id
                  ? "border-red-500 text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge ? (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox title="Total Users" value={stats?.total_users} icon={<Users size={20} className="text-blue-500" />} loading={statsLoading} />
              <StatBox title="Active Users" value={stats?.active_users} icon={<Activity size={20} className="text-green-500" />} loading={statsLoading} />
              <StatBox title="Total Paths" value={stats?.total_paths} icon={<Map size={20} className="text-purple-500" />} loading={statsLoading} />
              <StatBox title="Total Notes" value={stats?.total_notes} icon={<BookOpen size={20} className="text-yellow-500" />} loading={statsLoading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Admin access requests */}
              <div className="lg:col-span-2 rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
                <SectionTitle icon={<UserCheck size={16} />}>Admin Access Requests</SectionTitle>
                <div className="p-4">
                  {adminRequests.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 text-sm font-mono">
                      No pending access requests.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adminRequests.map((r: any) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-[#1a1a1a] bg-[#111]"
                        >
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {r.username || r.user?.username || `User ${r.user}`}
                            </p>
                            <p className="text-xs text-gray-500 font-mono truncate">
                              {r.reason || r.email || "Requesting elevated access"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleAdminRequest(r.id, "approved")}
                              className="px-3 py-1.5 rounded border border-green-900/50 bg-green-950/30 text-green-400 text-xs hover:bg-green-900/40 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAdminRequest(r.id, "rejected")}
                              className="px-3 py-1.5 rounded border border-red-900/50 bg-red-950/30 text-red-400 text-xs hover:bg-red-900/40 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* System health snapshot */}
              <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
                <SectionTitle icon={<Activity size={16} />}>System Health</SectionTitle>
                <div className="p-5 space-y-5">
                  <HealthBar label="Database Load" value={stats?.system_health?.database_load ?? 0} color="#00FF66" />
                  <HealthBar label="Memory Usage" value={stats?.system_health?.memory_usage ?? 0} color="#f59e0b" />
                  <HealthBar label="Storage" value={stats?.system_health?.storage ?? 0} color="#3b82f6" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden flex flex-col h-[640px]">
            <div className="p-4 border-b border-[#111] flex items-center justify-between bg-[#0f0f0f] gap-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 shrink-0">
                <Users size={16} /> User Registry
              </h2>
              <div className="relative w-full max-w-xs">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="bg-[#111] border border-[#222] rounded-md py-1.5 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-red-500 w-full"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-gray-500" />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111] sticky top-0 z-10">
                  <tr>
                    {["User", "Status", "Total XP", "Joined", "Quick Action"].map((h, i) => (
                      <th
                        key={h}
                        className={`py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222] ${i === 4 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111]">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">Loading users...</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user: any) => (
                      <tr
                        key={user.id}
                        className="hover:bg-[#111] transition-colors group cursor-pointer"
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#666] flex items-center justify-center text-xs font-bold text-gray-300">
                              {user.username?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white flex items-center gap-2">
                                {user.username}
                                {user.is_staff && (
                                  <span title="Admin"><Shield size={12} className="text-red-500" /></span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{user.email || "No email"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-950 text-green-500 border border-green-900">
                              <CheckCircle2 size={10} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-950 text-red-500 border border-red-900">
                              <XCircle size={10} /> Suspended
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-gray-300">{user.total_xp}</td>
                        <td className="py-3 px-4 text-sm text-gray-400">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!user.is_staff && (
                            <button
                              onClick={(e) => toggleUserStatus(user.id, user.is_active, e)}
                              className="text-xs px-3 py-1.5 rounded border border-[#666] hover:bg-[#222] text-gray-300 transition-colors"
                            >
                              {user.is_active ? "Suspend" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {tab === "content" && <AdminContentSection onOpenRoadmap={() => navigate({ to: "/admin/roadmap" })} />}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && <AdminAnalyticsSection />}

        {/* ── SETTINGS ── */}
        {tab === "settings" && <AdminSettingsSection />}

        {/* ── OPERATIONS ── */}
        {tab === "operations" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
              <SectionTitle icon={<Activity size={16} />}>System Health</SectionTitle>
              <div className="p-5 space-y-5">
                <HealthBar label="Database Load" value={stats?.system_health?.database_load ?? 0} color="#00FF66" />
                <HealthBar label="Memory Usage" value={stats?.system_health?.memory_usage ?? 0} color="#f59e0b" />
                <HealthBar label="Storage" value={stats?.system_health?.storage ?? 0} color="#3b82f6" />
              </div>
            </div>

            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
              <SectionTitle icon={<Database size={16} />}>Data & Controls</SectionTitle>
              <div className="p-5 space-y-2">
                <OpButton icon={<Download size={14} />} label="Download Backup (JSON)" onClick={downloadBackup} />
                <OpButton icon={<Map size={14} />} label="Roadmap Manager" accent onClick={() => navigate({ to: "/admin/roadmap" })} />
                <OpButton
                  icon={<Database size={14} />}
                  label="Flush Cache"
                  onClick={() => {
                    queryClient.invalidateQueries();
                    showToast("Client cache flushed", "xp");
                  }}
                />
              </div>
              <div className="px-5 pb-5 pt-2 border-t border-[#1a1a1a] mt-3">
                <p className="text-xs font-mono uppercase tracking-widest text-red-500/70 mb-3">Danger Zone</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  User suspension, admin promotion, and deletion are available per-user in the
                  <button onClick={() => setTab("users")} className="text-red-400 hover:text-red-300 mx-1 underline underline-offset-2">Users</button>
                  tab via the inspector.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Inspector Sidebar (shared) */}
      {selectedUserId && (
        <UserInspectorSidebar
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onStatusChange={toggleUserStatus}
          onDelete={() => {
            setSelectedUserId(null);
            refetchUsers();
          }}
        />
      )}
    </div>
  );
}

/* ── small shared bits ───────────────────────────────────────────────────── */

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="p-4 border-b border-[#111] bg-[#0f0f0f]">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">{icon} {children}</h2>
    </div>
  );
}

function HealthBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-mono" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
        <div className="h-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function OpButton({ icon, label, onClick, accent }: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all group cursor-pointer ${
        accent
          ? "border-purple-900/50 bg-purple-950/20 hover:border-purple-500/50 hover:bg-purple-950/40"
          : "border-[#222] bg-[#111] hover:border-red-500/50 hover:bg-red-950/20"
      }`}
    >
      <span className={`text-sm flex items-center gap-2 ${accent ? "text-purple-300" : "text-gray-300 group-hover:text-red-400"}`}>
        {icon} {label}
      </span>
      <ArrowUpRight size={14} className={accent ? "text-purple-500" : "text-gray-500 group-hover:text-red-400"} />
    </button>
  );
}

function StatBox({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="p-5 rounded-xl border border-[#222] bg-[#0a0a0a] flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-400 mb-2">{title}</div>
      <div className="text-3xl font-bold text-white font-mono">
        {loading ? <span className="animate-pulse text-gray-700">---</span> : value}
      </div>
    </div>
  );
}

/* ── Content section ─────────────────────────────────────────────────────── */

function AdminContentSection({ onOpenRoadmap }: { onOpenRoadmap: () => void }) {
  const { showToast } = useToast();
  const {
    data: paths = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin_content"],
    queryFn: async () => {
      const res = await apiFetch("/admin/content/");
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
  });

  const deletePath = async (id: number, title: string) => {
    if (!window.confirm(`Delete "${title}"? This removes the path and all its topics. This cannot be undone.`)) return;
    try {
      const res = await apiFetch(`/admin/content/?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast(`Deleted "${title}"`, "xp");
      refetch();
    } catch {
      showToast("Failed to delete path", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-400 font-mono">
          {isLoading ? "Loading…" : `${paths.length} learning paths`}
        </p>
        <button
          onClick={onOpenRoadmap}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-900/50 bg-purple-950/20 text-purple-300 text-sm hover:bg-purple-950/40 transition-colors"
        >
          <Map size={14} /> Roadmap Manager
        </button>
      </div>

      <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead className="bg-[#111]">
              <tr>
                {["Path", "Type", "Topics", "Learners", "Owner", ""].map((h, i) => (
                  <th
                    key={h || i}
                    className={`py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222] ${i >= 2 && i <= 3 ? "text-right" : ""} ${i === 5 ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111]">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading paths…</td></tr>
              ) : paths.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500 font-mono">No paths yet.</td></tr>
              ) : (
                paths.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#111] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white truncate max-w-[260px]">{p.title}</div>
                      <div className="text-xs text-gray-500 font-mono">/{p.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.is_custom ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-950 text-blue-400 border border-blue-900">Custom</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1a1a1a] text-gray-400 border border-[#333]">System</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-gray-300">{p.topic_count}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-[#00FF66]">{p.learner_count}</td>
                    <td className="py-3 px-4 text-sm text-gray-400">{p.created_by || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deletePath(p.id, p.title)}
                        className="p-2 rounded hover:bg-red-950/30 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete path"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Settings section ────────────────────────────────────────────────────── */

type AdminSetting = { key: string; type: "bool" | "int" | "text"; label: string; help: string; value: string };

function AdminSettingsSection() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin_settings"],
    queryFn: async () => {
      const res = await apiFetch("/admin/settings/");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json() as Promise<{ settings: AdminSetting[] }>;
    },
  });

  const settings = data?.settings ?? [];
  const valueOf = (s: AdminSetting) => (draft[s.key] !== undefined ? draft[s.key] : s.value);
  const dirty = Object.keys(draft).length > 0;

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/admin/settings/", {
        method: "PATCH",
        body: JSON.stringify({ settings: draft }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("Settings saved", "xp");
      setDraft({});
      queryClient.invalidateQueries({ queryKey: ["admin_settings"] });
    } catch {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
        <SectionTitle icon={<SettingsIcon size={16} />}>System Settings</SectionTitle>
        <div className="divide-y divide-[#111]">
          {isLoading ? (
            <div className="p-6 text-gray-500 text-sm font-mono">Loading settings…</div>
          ) : (
            settings.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.help}</p>
                  <p className="text-[10px] font-mono text-gray-600 mt-1">{s.key}</p>
                </div>
                <div className="shrink-0">
                  {s.type === "bool" ? (
                    <button
                      onClick={() =>
                        setDraft((d) => ({ ...d, [s.key]: valueOf(s) === "true" ? "false" : "true" }))
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors ${valueOf(s) === "true" ? "bg-[#00FF66]" : "bg-[#222]"}`}
                      aria-pressed={valueOf(s) === "true"}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black transition-transform ${valueOf(s) === "true" ? "translate-x-5" : ""}`}
                      />
                    </button>
                  ) : s.type === "int" ? (
                    <input
                      type="number"
                      value={valueOf(s)}
                      onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                      className="w-24 bg-[#111] border border-[#222] rounded-md px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-red-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={valueOf(s)}
                      onChange={(e) => setDraft((d) => ({ ...d, [s.key]: e.target.value }))}
                      className="w-48 bg-[#111] border border-[#222] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg bg-[#00FF66] text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#33FF85] transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {dirty && (
          <button
            onClick={() => setDraft({})}
            className="px-4 py-2 rounded-lg border border-[#222] text-gray-400 text-sm hover:bg-[#111] transition-colors"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Analytics section ───────────────────────────────────────────────────── */

function AdminAnalyticsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_analytics"],
    queryFn: async () => {
      const res = await apiFetch("/admin/analytics/");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl border border-[#222] bg-[#0a0a0a] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox title="Signups (30d)" value={data.signups_30d} icon={<TrendingUp size={20} className="text-blue-500" />} loading={false} />
        <StatBox title="Active Users" value={data.active_users} icon={<Activity size={20} className="text-green-500" />} loading={false} />
        <StatBox title="Completions" value={data.total_completions} icon={<CheckCircle2 size={20} className="text-[#00FF66]" />} loading={false} />
        <StatBox title="Completions (30d)" value={data.completions_30d} icon={<Award size={20} className="text-yellow-500" />} loading={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
          <SectionTitle icon={<TrendingUp size={16} />}>New Signups · 14 days</SectionTitle>
          <div className="p-5"><BarSeries series={data.signup_series} color="#3b82f6" /></div>
        </div>
        <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
          <SectionTitle icon={<Activity size={16} />}>Activity · 14 days</SectionTitle>
          <div className="p-5"><BarSeries series={data.contrib_series} color="#00FF66" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top paths */}
        <div className="lg:col-span-2 rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
          <SectionTitle icon={<Map size={16} />}>Top Paths by Learners</SectionTitle>
          <div className="p-5 space-y-3">
            {data.top_paths.length === 0 ? (
              <p className="text-sm text-gray-500 font-mono py-4">No path activity yet.</p>
            ) : (
              data.top_paths.map((p: any) => {
                const max = Math.max(...data.top_paths.map((x: any) => x.learner_count), 1);
                return (
                  <div key={p.id}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm text-gray-200 truncate pr-2">{p.title}</span>
                      <span className="text-xs font-mono text-gray-400 shrink-0">
                        {p.learner_count} learners · {p.topic_count} topics
                      </span>
                    </div>
                    <div className="h-2 bg-[#111] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00FF66] rounded-full transition-all duration-700" style={{ width: `${(p.learner_count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* XP leaderboard */}
        <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
          <SectionTitle icon={<Trophy size={16} />}>XP Leaderboard</SectionTitle>
          <div className="p-4 space-y-1.5">
            {data.leaderboard.length === 0 ? (
              <p className="text-sm text-gray-500 font-mono py-4 px-1">No data yet.</p>
            ) : (
              data.leaderboard.map((u: any, i: number) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#111] transition-colors">
                  <span className={`w-5 text-center font-mono text-xs ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-600" : "text-gray-600"}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-200 truncate">{u.username}</span>
                  <span className="text-xs font-mono text-[#00FF66]">{u.xp.toLocaleString()} XP</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action breakdown */}
      <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden">
        <SectionTitle icon={<BarChart3 size={16} />}>XP Sources (action breakdown)</SectionTitle>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          {data.action_breakdown.length === 0 ? (
            <p className="text-sm text-gray-500 font-mono">No contributions yet.</p>
          ) : (
            data.action_breakdown.map((a: any) => {
              const max = Math.max(...data.action_breakdown.map((x: any) => x.count), 1);
              const label = a.action.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
              return (
                <div key={a.action}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-sm font-mono text-gray-300 uppercase tracking-wide">{label}</span>
                    <span className="text-xs font-mono text-gray-400">{a.count}× · {a.points} XP</span>
                  </div>
                  <div className="h-2 bg-[#111] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all duration-700" style={{ width: `${(a.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function BarSeries({ series, color }: { series: { date: string; count: number }[]; color: string }) {
  const max = Math.max(...series.map((s) => s.count), 1);
  return (
    <div className="flex items-end justify-between gap-1 h-32">
      {series.map((s) => (
        <div key={s.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
          <div
            className="w-full rounded-t transition-all duration-500"
            style={{ height: `${Math.max((s.count / max) * 100, s.count > 0 ? 6 : 2)}%`, background: s.count > 0 ? color : "#1a1a1a" }}
          />
          <span className="absolute -top-5 text-[10px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {s.count}
          </span>
          <span className="mt-1.5 text-[9px] font-mono text-gray-600">{s.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── User Inspector Sidebar ────────────────────────────────────────────── */

function UserInspectorSidebar({
  userId,
  onClose,
  onStatusChange,
  onDelete,
}: {
  userId: number;
  onClose: () => void;
  onStatusChange: (userId: number, currentStatus: boolean) => Promise<void>;
  onDelete: () => void;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "paths" | "github" | "notes">("overview");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin_user_detail", userId],
    queryFn: async () => {
      const res = await apiFetch(`/admin/users/${userId}/`);
      if (!res.ok) throw new Error("Failed to fetch user data");
      return res.json();
    },
  });

  const toggleAdmin = async (currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_staff: !currentStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      showToast(`User ${currentStatus ? "removed from" : "promoted to"} admin`, "xp");
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      queryClient.invalidateQueries({ queryKey: ["admin_user_detail", userId] });
    } catch {
      showToast("Action failed", "error");
    }
  };

  const deleteUser = async () => {
    if (!window.confirm("Are you absolutely sure? This cannot be undone and will delete all user data."))
      return;
    try {
      const res = await apiFetch(`/admin/users/${userId}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      showToast("User completely removed", "xp");
      onDelete();
    } catch {
      showToast("Could not delete user (cannot delete superuser)", "error");
    }
  };

  const handleAssetAction = async (action: string, targetId?: number) => {
    if (!window.confirm(`Are you sure you want to perform this administrative action?`)) return;
    try {
      const payload: any = { action };
      if (targetId) payload.target_id = targetId;
      const res = await apiFetch(`/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Action failed");
      showToast("Asset modified successfully", "xp");
      refetch();
    } catch {
      showToast("Failed to perform asset action", "error");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#0a0a0a] border-l border-red-900/30 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a] bg-[#0f0f0f]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">User Inspector</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">ID: {userId}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#222] text-gray-400 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {isLoading || !data ? (
            <div className="p-6 flex flex-col gap-4 animate-pulse">
              <div className="h-32 bg-[#161616] rounded-xl" />
              <div className="h-64 bg-[#161616] rounded-xl" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 px-6 pt-4 border-b border-[#1a1a1a] bg-[#0f0f0f] overflow-x-auto scrollbar-thin">
                {([
                  ["overview", "Overview"],
                  ["paths", `Custom Paths (${data.custom_paths?.length || 0})`],
                  ["github", `GitHub (${data.github_repos?.length || 0})`],
                  ["notes", `Notes (${data.notes?.length || 0})`],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${activeTab === id ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {activeTab === "overview" && (
                  <>
                    <div className="rounded-xl border border-white/5 bg-[#111] overflow-hidden">
                      <div className="p-6 flex items-start justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-white/10 flex items-center justify-center text-xl font-bold text-gray-300 shadow-inner">
                            {data.profile.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              {data.profile.username}
                              {data.profile.is_staff && <Shield size={14} className="text-red-500" />}
                            </h3>
                            <p className="text-sm text-gray-400">{data.profile.email || "No email provided"}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {data.profile.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-950 text-green-500 border border-green-900">
                                  <CheckCircle2 size={10} /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-950 text-red-500 border border-red-900">
                                  <XCircle size={10} /> Suspended
                                </span>
                              )}
                              <span className="text-xs text-gray-500 font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5">
                                Level {data.profile.level}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-red-950/10 flex flex-wrap gap-3">
                        <button
                          onClick={() => onStatusChange(userId, data.profile.is_active)}
                          className="flex items-center gap-2 px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm transition-colors cursor-pointer text-gray-200"
                        >
                          {data.profile.is_active ? <Lock size={14} className="text-red-400" /> : <Unlock size={14} className="text-green-400" />}
                          {data.profile.is_active ? "Suspend Account" : "Activate Account"}
                        </button>
                        <button
                          onClick={() => toggleAdmin(data.profile.is_staff)}
                          className="flex items-center gap-2 px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm transition-colors cursor-pointer text-gray-200"
                        >
                          <Shield size={14} className={data.profile.is_staff ? "text-gray-400" : "text-red-400"} />
                          {data.profile.is_staff ? "Revoke Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={deleteUser}
                          className="flex items-center gap-2 px-4 py-2 rounded border border-red-900/50 bg-red-950/30 hover:bg-red-900/50 text-sm text-red-400 transition-colors ml-auto cursor-pointer"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-white/5 bg-[#111] flex flex-col items-center justify-center text-center">
                        <Trophy size={20} className="text-yellow-500 mb-2" />
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">Total XP</p>
                        <p className="text-2xl font-bold text-white">{data.profile.total_xp}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-[#111] flex flex-col items-center justify-center text-center">
                        <Flame size={20} className="text-orange-500 mb-2" />
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">Current Streak</p>
                        <p className="text-2xl font-bold text-white">{data.profile.streak}</p>
                      </div>
                    </div>

                    <div className="p-6 rounded-xl border border-white/5 bg-[#111]">
                      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                        <Zap size={14} className="text-[#00FF66]" /> Contributions
                      </h4>
                      <div className="overflow-x-auto pb-2 custom-scrollbar">
                        <ActivityCalendar
                          data={data.heatmap.length ? data.heatmap : [{ date: new Date().toISOString().split("T")[0], count: 0, level: 0 }]}
                          theme={{ light: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"], dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"] }}
                          colorScheme="dark"
                          blockSize={11}
                          blockRadius={2}
                          blockMargin={2}
                          showColorLegend={false}
                          showTotalCount={false}
                          style={{ fontSize: "12px" }}
                        />
                      </div>
                    </div>

                    {data.profile.badges && data.profile.badges.length > 0 && (
                      <div className="p-6 rounded-xl border border-white/5 bg-[#111]">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                          <Award size={14} className="text-yellow-500" /> Earned Badges
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {data.profile.badges.map((b: any) => (
                            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5">
                              <div className="text-2xl">{b.icon || "🏆"}</div>
                              <div>
                                <p className="text-sm font-medium text-white">{b.title}</p>
                                <p className="text-xs text-gray-500">{b.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-6 rounded-xl border border-white/5 bg-[#111]">
                      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                        <TrendingUp size={14} className="text-blue-500" /> Recent Activity
                      </h4>
                      <div className="space-y-4">
                        {data.activity.length === 0 ? (
                          <p className="text-sm text-gray-500 font-mono">No activity found.</p>
                        ) : (
                          data.activity.map((a: any) => (
                            <div key={a.id} className="flex items-start gap-3">
                              <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                              <div>
                                <p className="text-sm text-gray-300">{a.label}</p>
                                <p className="text-xs text-gray-500 font-mono">{new Date(a.date).toLocaleString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "paths" && (
                  <div className="space-y-3">
                    {!data.custom_paths?.length ? (
                      <div className="p-8 text-center text-gray-500 border border-white/5 rounded-xl bg-[#111]">
                        <LayoutList className="mx-auto mb-2 opacity-50" size={24} />
                        <p>User hasn't created any custom paths.</p>
                      </div>
                    ) : (
                      data.custom_paths.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#111]">
                          <div>
                            <p className="font-medium text-white">{p.title}</p>
                            <p className="text-xs text-gray-500 font-mono">/{p.slug}</p>
                          </div>
                          <button
                            onClick={() => handleAssetAction("delete_path", p.id)}
                            className="p-2 rounded hover:bg-red-950/30 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Path"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "github" && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-xl border border-white/5 bg-[#111]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                            <Github size={16} /> Connection Status
                          </h4>
                          {data.github_connected ? (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Connected as {data.github_username}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <XCircle size={12} /> Not connected
                            </p>
                          )}
                        </div>
                        {data.github_connected && (
                          <button
                            onClick={() => handleAssetAction("disconnect_github")}
                            className="px-3 py-1.5 rounded bg-red-950/30 border border-red-900/50 text-red-400 text-xs hover:bg-red-900/50 transition-colors cursor-pointer"
                          >
                            Force Disconnect
                          </button>
                        )}
                      </div>

                      {data.github_connected && (
                        <div className="mt-6 pt-6 border-t border-white/5">
                          <h5 className="text-xs font-mono text-gray-500 mb-3 uppercase tracking-wider">Synced Repositories</h5>
                          <div className="space-y-2">
                            {!data.github_repos?.length ? (
                              <p className="text-xs text-gray-500">No repositories synced yet.</p>
                            ) : (
                              data.github_repos.map((r: any) => (
                                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/40">
                                  <p className="text-sm text-gray-300 flex items-center gap-2">
                                    <BookOpen size={14} className="text-gray-500" /> {r.repo_name}
                                  </p>
                                  <span className={`w-2 h-2 rounded-full ${r.is_active ? "bg-green-500" : "bg-gray-500"}`} title={r.is_active ? "Active" : "Inactive"} />
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-3">
                    {!data.notes?.length ? (
                      <div className="p-8 text-center text-gray-500 border border-white/5 rounded-xl bg-[#111]">
                        <FileText className="mx-auto mb-2 opacity-50" size={24} />
                        <p>User hasn't written any notes.</p>
                      </div>
                    ) : (
                      data.notes.map((n: any) => (
                        <div key={n.id} className="p-4 rounded-xl border border-white/5 bg-[#111] group">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-mono text-blue-400">{n.topic_title}</p>
                            <button
                              onClick={() => handleAssetAction("delete_note", n.id)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-950/30 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                              title="Delete Note"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-300 italic">"{n.content}..."</p>
                          <p className="text-xs text-gray-500 mt-3 font-mono">{new Date(n.updated_at).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
