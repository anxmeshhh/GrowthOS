import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell, PageHeader, Card, Btn } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, clearAuthTokens } from "@/lib/api-client";
import { Github, LogOut, AlertTriangle, Save, Loader2, User, Clock } from "lucide-react";
import { useGrowth } from "@/lib/growth-store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — GrowthOS" }, { name: "description", content: "Configure your account and integrations." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { state, update, reset } = useGrowth();
  const [confirm, setConfirm] = useState(false);
  const [githubInput, setGithubInput] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => {
      const res = await apiFetch("/profile/");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  useEffect(() => {
    if (profile?.github_username) {
      setGithubInput(profile.github_username);
    }
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
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      queryClient.invalidateQueries({ queryKey: ['github_repos'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  });

  const handleLogout = () => {
    clearAuthTokens();
    navigate({ to: "/login" });
  };

  if (isLoading) {
    return <PageShell><div className="flex items-center justify-center p-12 text-[#666]"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading settings...</div></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader kicker="Settings" title="Configuration" subtitle="Your account, integrations, and preferences." />

      {/* Account */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <User size={16} className="text-[#22c55e]" />
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">Account</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666]">Username</label>
            <div className="mt-1 w-full bg-[#0f0f0f] border border-[#222] rounded px-3 py-2 text-sm text-[#999]">
              {profile?.username || "—"}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#666]">Member Since</label>
            <div className="mt-1 w-full bg-[#0f0f0f] border border-[#222] rounded px-3 py-2 text-sm text-[#999]">
              {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "—"}
            </div>
          </div>
        </div>
      </Card>

      {/* GitHub Integration */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Github size={16} className="text-[#f0f0f0]" />
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">GitHub Integration</div>
        </div>
        <p className="text-xs text-[#888] mb-3">
          Connect your GitHub username to import your repositories for AI project assessments.
        </p>
        <div className="flex items-center gap-3">
          <input
            value={githubInput}
            onChange={(e) => setGithubInput(e.target.value)}
            placeholder="e.g. anxmeshhh"
            className="flex-1 bg-[#0f0f0f] border border-[#222] rounded px-3 py-2 text-sm outline-none focus:border-[#22c55e]/50 text-[#f0f0f0] placeholder:text-[#555]"
          />
          <Btn
            size="sm"
            onClick={() => saveGithub.mutate(githubInput)}
            disabled={saveGithub.isPending || githubInput === profile?.github_username}
          >
            {saveGithub.isPending ? <Loader2 size={14} className="animate-spin" /> : saved ? "Saved ✓" : <><Save size={14} /> Save</>}
          </Btn>
        </div>
        {profile?.github_username && (
          <div className="mt-2 text-xs text-[#22c55e]">
            ✓ Connected as <span className="font-mono">{profile.github_username}</span>
          </div>
        )}
      </Card>

      {/* Daily Time Budget */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={16} className="text-[#f59e0b]" />
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">Daily Time Budget</div>
        </div>
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

      {/* Sign Out */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[#f0f0f0]">Sign Out</div>
            <div className="text-xs text-[#888]">Log out of your GrowthOS account on this device.</div>
          </div>
          <Btn variant="outline" size="sm" onClick={handleLogout}>
            <LogOut size={14} /> Sign Out
          </Btn>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-5 border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={16} className="text-[#ef4444]" />
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#ef4444]">Danger Zone</div>
        </div>
        <p className="text-xs text-[#888] mb-3">Reset all local progress data. This cannot be undone. Server data (notes, contributions) is not affected.</p>
        <div className="flex flex-wrap gap-2">
          {confirm ? (
            <>
              <Btn tone="red" size="sm" onClick={() => { reset(); setConfirm(false); }}>Confirm Reset</Btn>
              <Btn variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Btn>
            </>
          ) : (
            <Btn tone="red" variant="outline" size="sm" onClick={() => setConfirm(true)}>Reset Local Progress</Btn>
          )}
        </div>
      </Card>
    </PageShell>
  );
}