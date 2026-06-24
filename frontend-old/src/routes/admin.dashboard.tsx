import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
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
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/toast-context";
import { ActivityCalendar } from "react-activity-calendar";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const res = await apiFetch("/admin/stats/");
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          navigate({ to: "/admin/login" });
        }
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
    } catch (e) {
      showToast("Action failed", "error");
    }
  };

  const filteredUsers = users.filter(
    (u: any) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const { data: adminRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["admin_requests"],
    queryFn: async () => {
      const res = await apiFetch("/admin/requests/");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

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

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-auto selection:bg-red-500/30">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="text-gray-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-1 cursor-pointer"
              >
                ← Return to GrowthOS
              </button>
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 mt-2">
              <ShieldAlert className="text-red-500" />
              Command Override
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">Admin Control Center</p>
          </div>
          <div className="px-3 py-1 rounded-full border border-red-900 bg-red-950/30 text-red-500 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live System
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatBox
            title="Total Users"
            value={stats?.total_users}
            icon={<Users size={20} className="text-blue-500" />}
            loading={statsLoading}
          />
          <StatBox
            title="Active Users"
            value={stats?.active_users}
            icon={<Activity size={20} className="text-green-500" />}
            loading={statsLoading}
          />
          <StatBox
            title="Total Paths"
            value={stats?.total_paths}
            icon={<Map size={20} className="text-purple-500" />}
            loading={statsLoading}
          />
          <StatBox
            title="Total Notes"
            value={stats?.total_notes}
            icon={<BookOpen size={20} className="text-yellow-500" />}
            loading={statsLoading}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Management Section */}
          <div className="lg:col-span-2 rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#111] flex items-center justify-between bg-[#0f0f0f]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users size={16} /> User Registry
              </h2>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="bg-[#111] border border-[#222] rounded-md py-1.5 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-red-500 w-64"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-gray-500" />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111] sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222]">
                      User
                    </th>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222]">
                      Status
                    </th>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222]">
                      Total XP
                    </th>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222]">
                      Joined
                    </th>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222] text-right">
                      Quick Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111]">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Loading users...
                      </td>
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
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white flex items-center gap-2">
                                {user.username}
                                {user.is_staff && (
                                  <span title="Admin">
                                    <Shield size={12} className="text-red-500" />
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.email || "No email"}
                              </div>
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
                        <td className="py-3 px-4 font-mono text-sm text-gray-300">
                          {user.total_xp}
                        </td>
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

          {/* System Status Panel */}
          <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-[#111] bg-[#0f0f0f]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity size={16} /> System Health
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Database Load</span>
                  <span className="text-green-500 font-mono">
                    {stats?.system_health?.database_load ?? 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${stats?.system_health?.database_load ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-yellow-500 font-mono">
                    {stats?.system_health?.memory_usage ?? 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${stats?.system_health?.memory_usage ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Storage</span>
                  <span className="text-blue-500 font-mono">
                    {stats?.system_health?.storage ?? 0}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${stats?.system_health?.storage ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#111]">
                <h3 className="text-sm font-medium text-gray-300 mb-4 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111] hover:border-red-500/50 hover:bg-red-950/20 transition-all group cursor-pointer">
                    <span className="text-sm text-gray-300 group-hover:text-red-400">
                      Flush Cache
                    </span>
                    <ArrowUpRight size={14} className="text-gray-500 group-hover:text-red-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111] hover:border-red-500/50 hover:bg-red-950/20 transition-all group cursor-pointer">
                    <span className="text-sm text-gray-300 group-hover:text-red-400">
                      Restart Workers
                    </span>
                    <ArrowUpRight size={14} className="text-gray-500 group-hover:text-red-400" />
                  </button>
                  <button
                    onClick={downloadBackup}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111] hover:border-red-500/50 hover:bg-red-950/20 transition-all group cursor-pointer"
                  >
                    <span className="text-sm text-gray-300 group-hover:text-red-400">
                      Download Backup (JSON)
                    </span>
                    <ArrowUpRight size={14} className="text-gray-500 group-hover:text-red-400" />
                  </button>
                  <button
                    onClick={() => navigate({ to: "/admin/roadmap" })}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-purple-900/50 bg-purple-950/20 hover:border-purple-500/50 hover:bg-purple-950/40 transition-all group cursor-pointer mt-2"
                  >
                    <span className="text-sm text-purple-300 group-hover:text-purple-400 font-medium flex items-center gap-2">
                      <Map size={14} /> Roadmap Manager
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="text-purple-500 group-hover:text-purple-400"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Inspector Sidebar */}
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
    } catch (e) {
      showToast("Action failed", "error");
    }
  };

  const deleteUser = async () => {
    if (
      !window.confirm(
        "Are you absolutely sure? This cannot be undone and will delete all user data.",
      )
    )
      return;
    try {
      const res = await apiFetch(`/admin/users/${userId}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast("User completely removed", "xp");
      onDelete();
    } catch (e) {
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
    } catch (e) {
      showToast("Failed to perform asset action", "error");
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#0a0a0a] border-l border-red-900/30 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a] bg-[#0f0f0f]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">User Inspector</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">ID: {userId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#222] text-gray-400 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {isLoading || !data ? (
            <div className="p-6 flex flex-col gap-4 animate-pulse">
              <div className="h-32 bg-[#161616] rounded-xl" />
              <div className="h-64 bg-[#161616] rounded-xl" />
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex items-center gap-4 px-6 pt-4 border-b border-[#1a1a1a] bg-[#0f0f0f]">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 cursor-pointer ${activeTab === "overview" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("paths")}
                  className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 cursor-pointer ${activeTab === "paths" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                  Custom Paths ({data.custom_paths?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("github")}
                  className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 cursor-pointer ${activeTab === "github" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                  GitHub ({data.github_repos?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 cursor-pointer ${activeTab === "notes" ? "border-red-500 text-white" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                  Notes ({data.notes?.length || 0})
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {activeTab === "overview" && (
                  <>
                    {/* Identity & Admin Controls */}
                    <div className="rounded-xl border border-white/5 bg-[#111] overflow-hidden">
                      <div className="p-6 flex items-start justify-between border-b border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] border-2 border-white/10 flex items-center justify-center text-xl font-bold text-gray-300 shadow-inner">
                            {data.profile.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              {data.profile.username}
                              {data.profile.is_staff && (
                                <Shield size={14} className="text-red-500" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {data.profile.email || "No email provided"}
                            </p>
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

                      {/* Admin Actions */}
                      <div className="p-4 bg-red-950/10 flex flex-wrap gap-3">
                        <button
                          onClick={() => onStatusChange(userId, data.profile.is_active)}
                          className="flex items-center gap-2 px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm transition-colors cursor-pointer text-gray-200"
                        >
                          {data.profile.is_active ? (
                            <Lock size={14} className="text-red-400" />
                          ) : (
                            <Unlock size={14} className="text-green-400" />
                          )}
                          {data.profile.is_active ? "Suspend Account" : "Activate Account"}
                        </button>
                        <button
                          onClick={() => toggleAdmin(data.profile.is_staff)}
                          className="flex items-center gap-2 px-4 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm transition-colors cursor-pointer text-gray-200"
                        >
                          <Shield
                            size={14}
                            className={data.profile.is_staff ? "text-gray-400" : "text-red-400"}
                          />
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

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-white/5 bg-[#111] flex flex-col items-center justify-center text-center">
                        <Trophy size={20} className="text-yellow-500 mb-2" />
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                          Total XP
                        </p>
                        <p className="text-2xl font-bold text-white">{data.profile.total_xp}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-white/5 bg-[#111] flex flex-col items-center justify-center text-center">
                        <Flame size={20} className="text-orange-500 mb-2" />
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                          Current Streak
                        </p>
                        <p className="text-2xl font-bold text-white">{data.profile.streak}</p>
                      </div>
                    </div>

                    {/* Heatmap */}
                    <div className="p-6 rounded-xl border border-white/5 bg-[#111]">
                      <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                        <Zap size={14} className="text-[#22c55e]" /> Contributions
                      </h4>
                      <div className="overflow-x-auto pb-2 custom-scrollbar">
                        <ActivityCalendar
                          data={
                            data.heatmap.length
                              ? data.heatmap
                              : [
                                  {
                                    date: new Date().toISOString().split("T")[0],
                                    count: 0,
                                    level: 0,
                                  },
                                ]
                          }
                          theme={{
                            light: ["#1a1a1a", "#0e4429", "#006d32", "#26a641", "#39d353"],
                            dark: ["#1a1a1a", "#0e4429", "#006d32", "#26a641", "#39d353"],
                          }}
                          colorScheme="dark"
                          style={{ fontSize: "12px" }}
                        />
                      </div>
                    </div>

                    {/* Badges */}
                    {data.profile.badges && data.profile.badges.length > 0 && (
                      <div className="p-6 rounded-xl border border-white/5 bg-[#111]">
                        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4 uppercase tracking-wider">
                          <Award size={14} className="text-yellow-500" /> Earned Badges
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {data.profile.badges.map((b: any) => (
                            <div
                              key={b.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-white/5"
                            >
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

                    {/* Activity Log */}
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
                                <p className="text-xs text-gray-500 font-mono">
                                  {new Date(a.date).toLocaleString()}
                                </p>
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
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#111]"
                        >
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
                          <h5 className="text-xs font-mono text-gray-500 mb-3 uppercase tracking-wider">
                            Synced Repositories
                          </h5>
                          <div className="space-y-2">
                            {!data.github_repos?.length ? (
                              <p className="text-xs text-gray-500">No repositories synced yet.</p>
                            ) : (
                              data.github_repos.map((r: any) => (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-black/40"
                                >
                                  <p className="text-sm text-gray-300 flex items-center gap-2">
                                    <BookOpen size={14} className="text-gray-500" /> {r.repo_name}
                                  </p>
                                  {r.is_active ? (
                                    <span
                                      className="w-2 h-2 rounded-full bg-green-500"
                                      title="Active"
                                    ></span>
                                  ) : (
                                    <span
                                      className="w-2 h-2 rounded-full bg-gray-500"
                                      title="Inactive"
                                    ></span>
                                  )}
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
                        <div
                          key={n.id}
                          className="p-4 rounded-xl border border-white/5 bg-[#111] group"
                        >
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
                          <p className="text-xs text-gray-500 mt-3 font-mono">
                            {new Date(n.updated_at).toLocaleString()}
                          </p>
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
