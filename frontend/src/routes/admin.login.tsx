import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { apiFetch, setAuthTokens } from "@/lib/api-client";
import { Shield, Lock, ArrowRight } from "lucide-react";
// Removed PageShell import

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First authenticate normally
      const res = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }

      setAuthTokens(data.access, data.refresh);

      // Now verify if user is admin
      const profileRes = await apiFetch("/profile/");
      const profileData = await profileRes.json();

      if (!profileData.user.is_staff) {
        throw new Error("Unauthorized. Admin access required.");
      }

      navigate({ to: "/admin/dashboard" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-red-500/30">
      <div className="flex items-center gap-3 p-6 max-w-7xl mx-auto absolute top-0 left-0 w-full z-10">
        <button
          onClick={() => navigate({ to: "/login" })}
          className="text-gray-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-1"
        >
          ← Return to User Login
        </button>
      </div>
      <div className="flex min-h-[100vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-[#222] bg-[#0a0a0a] p-8 shadow-2xl relative overflow-hidden">
          {/* Top accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-900" />

          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#111] border border-[#333] flex items-center justify-center mb-4">
              <Shield size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">System Override</h1>
            <p className="text-sm font-mono text-red-500/80 uppercase tracking-widest">
              Admin Access Only
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-950/50 border border-red-900 text-red-400 text-sm font-mono">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-gray-400">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder="root_user"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-gray-400">
                Master Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] rounded px-4 py-3 pl-10 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-gray-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <>
                  Initialize Session <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
