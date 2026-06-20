import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
// Removed PageShell import
import { 
  Users, Map, BookOpen, Shield, 
  Activity, ArrowUpRight, Search, 
  MoreVertical, ShieldAlert, CheckCircle2, XCircle
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/toast-context";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");

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

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const res = await apiFetch("/admin/users/");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (!res.ok) throw new Error("Update failed");
      showToast(`User ${currentStatus ? 'suspended' : 'activated'} successfully`, 'xp');
      refetchUsers();
    } catch (e) {
      showToast("Action failed", "error");
    }
  };

  const filteredUsers = users.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const { data: adminRequests = [], refetch: refetchRequests } = useQuery({
    queryKey: ["admin_requests"],
    queryFn: async () => {
      const res = await apiFetch("/admin/requests/");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const handleAdminRequest = async (reqId: number, status: 'approved' | 'rejected') => {
    try {
      const res = await apiFetch(`/admin/requests/${reqId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status })
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
      const a = document.createElement('a');
      a.href = url;
      a.download = `growthos_backup_${new Date().toISOString().split('T')[0]}.json`;
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
                className="text-gray-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-1"
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

        {/* Top Stats - Bento Box Style */}
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
                  onChange={e => setSearch(e.target.value)}
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
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222]">User</th>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222]">Status</th>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222]">Total XP</th>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222]">Joined</th>
                    <th className="py-3 px-4 text-xs font-mono text-gray-400 font-medium uppercase tracking-wider border-b border-[#222] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111]">
                  {usersLoading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading users...</td></tr>
                  ) : filteredUsers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-[#111] transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-xs font-bold text-gray-300">
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
                      <td className="py-3 px-4 font-mono text-sm text-gray-300">
                        {user.total_xp}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!user.is_staff && (
                          <button 
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                            className="text-xs px-3 py-1.5 rounded border border-[#333] hover:bg-[#222] text-gray-300 transition-colors"
                          >
                            {user.is_active ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
                  <span className="text-green-500 font-mono">{stats?.system_health?.database_load ?? 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${stats?.system_health?.database_load ?? 0}%` }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-yellow-500 font-mono">{stats?.system_health?.memory_usage ?? 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${stats?.system_health?.memory_usage ?? 0}%` }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Storage</span>
                  <span className="text-blue-500 font-mono">{stats?.system_health?.storage ?? 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${stats?.system_health?.storage ?? 0}%` }} />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[#111]">
                <h3 className="text-sm font-medium text-gray-300 mb-4 uppercase tracking-wider">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111] hover:border-red-500/50 hover:bg-red-950/20 transition-all group">
                    <span className="text-sm text-gray-300 group-hover:text-red-400">Flush Cache</span>
                    <ArrowUpRight size={14} className="text-gray-500 group-hover:text-red-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111] hover:border-red-500/50 hover:bg-red-950/20 transition-all group">
                    <span className="text-sm text-gray-300 group-hover:text-red-400">Restart Workers</span>
                    <ArrowUpRight size={14} className="text-gray-500 group-hover:text-red-400" />
                  </button>
                  <button 
                    onClick={downloadBackup}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111] hover:border-red-500/50 hover:bg-red-950/20 transition-all group"
                  >
                    <span className="text-sm text-gray-300 group-hover:text-red-400">Download Backup (JSON)</span>
                    <ArrowUpRight size={14} className="text-gray-500 group-hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Admin Requests Panel */}
              <div className="pt-6 mt-6 border-t border-[#111]">
                <h3 className="text-sm font-medium text-gray-300 mb-4 uppercase tracking-wider flex justify-between items-center">
                  Admin Requests
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{adminRequests.filter((r: any) => r.status === 'pending').length}</span>
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {adminRequests.length === 0 ? (
                    <p className="text-xs text-gray-500">No requests.</p>
                  ) : (
                    adminRequests.map((req: any) => (
                      <div key={req.id} className="p-3 border border-[#222] rounded-md bg-[#111]">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs font-medium text-white">{req.username}</p>
                            <p className="text-[10px] text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            req.status === 'pending' ? 'bg-yellow-950 text-yellow-500 border border-yellow-900' :
                            req.status === 'approved' ? 'bg-green-950 text-green-500 border border-green-900' :
                            'bg-red-950 text-red-500 border border-red-900'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        {req.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAdminRequest(req.id, 'approved')}
                              className="flex-1 text-[10px] py-1 bg-green-950 hover:bg-green-900 text-green-400 rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleAdminRequest(req.id, 'rejected')}
                              className="flex-1 text-[10px] py-1 bg-red-950 hover:bg-red-900 text-red-400 rounded transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function StatBox({ title, value, icon, loading }: { title: string; value: number | string; icon: React.ReactNode; loading: boolean }) {
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
