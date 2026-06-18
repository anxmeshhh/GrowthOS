import { createFileRoute, Link } from "@tanstack/react-router";
import { Github, Mail, ArrowRight, Zap } from "lucide-react";
import { Btn, Card } from "@/components/growth-ui";
import { Logo } from "@/components/logo";
import { useState, useEffect } from "react";
import { useToast } from "@/components/toast-context";
import { apiFetch, setAuthTokens } from "@/lib/api-client";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — GrowthOS" }] }),
  component: LoginPage,
});

const QUOTES = [
  "The compound interest of learning — small gains, enormous results.",
  "An investment in knowledge pays the best interest.",
  "Consistency is the ultimate competitive advantage.",
  "What looks like talent is usually just a lot of practice.",
  "Mastery is not an accident. It is a process.",
];

// ── Decorative left panel ────────────────────────────────────────────────────
function LeftPanel() {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);
  return (
    <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-12 overflow-hidden bg-[#050505]">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#22c55e] opacity-[0.06] blur-[100px]" />
        <div className="absolute top-[20%] left-[10%] w-[200px] h-[200px] rounded-full bg-[#22c55e] opacity-[0.04] blur-[60px]" />
      </div>

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top logo */}
      <div className="relative z-10 flex items-center gap-2.5">
        <Logo size={22} />
        <span className="text-[#f0f0f0] font-semibold tracking-tight text-base">GrowthOS</span>
      </div>

      {/* Center feature block */}
      <div className="relative z-10 space-y-8">
        {/* Stat cards */}
        <div className="space-y-3">
          {[
            { label: "Active learners", value: "12,400+", sub: "across 60+ countries" },
            { label: "Paths completed", value: "98,000+", sub: "this quarter" },
            { label: "Avg. skill velocity", value: "3.2×", sub: "faster than solo study" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm"
            >
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#555] font-mono">{item.label}</p>
                <p className="text-[11px] text-[#444] mt-0.5">{item.sub}</p>
              </div>
              <span className="text-xl font-bold text-[#22c55e] tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="border-l-2 border-[#22c55e]/40 pl-4">
          <p className="text-[#888] text-sm leading-relaxed italic transition-opacity duration-500">
            "{quote}"
          </p>
        </div>
      </div>

      {/* Bottom tag */}
      <div className="relative z-10 flex items-center gap-2 text-[#333] text-xs font-mono">
        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
        System operational
      </div>
    </div>
  );
}

import { useGoogleLogin } from "@react-oauth/google";

// ── Main page ─────────────────────────────────────────────────────────────────
function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await apiFetch("/auth/google/", {
          method: "POST",
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        if (res.ok) {
          const data = await res.json();
          setAuthTokens(data.access, data.refresh);
          showToast("Google login successful!", "success");
          window.location.href = "/dashboard";
        } else {
          showToast("Failed to authenticate with Google.", "error");
        }
      } catch (err) {
        showToast("Error connecting to server.", "error");
      }
    },
    onError: () => {
      showToast("Google login failed.", "error");
    },
  });

  const handleGithubLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email,repo,gist`;
  };

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2000);
    const t2 = setTimeout(() => {
      setShowSplash(false);
      setTimeout(() => setMounted(true), 50);
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (showSplash) {
    return (
      <div
        className={`min-h-screen bg-[#000] flex items-center justify-center transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"
          }`}
      >
        <div className="text-center space-y-4">
          <p className="text-[11px] uppercase tracking-[0.4em] font-mono text-[#444]">We present</p>
          <div className="relative flex items-center justify-center gap-3">
            <div className="absolute w-20 h-20 rounded-full bg-[#22c55e] opacity-20 blur-2xl animate-pulse" />
            <Logo size={40} className="relative z-10" />
            <h1 className="relative z-10 text-4xl sm:text-5xl font-bold tracking-tight text-[#f0f0f0]">
              GrowthOS
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#000] flex transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"
        }`}
    >
      <LeftPanel />

      {/* Right: form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12">
        <div className="w-full max-w-[400px] mx-auto lg:mx-0 space-y-8">

          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 lg:hidden mb-6">
              <Logo size={20} />
              <span className="text-[#f0f0f0] font-semibold text-sm tracking-tight">GrowthOS</span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.3em] font-mono text-[#555]">Welcome back</p>
            <h2 className="text-2xl font-bold tracking-tight text-[#f0f0f0]">
              Continue your path
            </h2>
            <p className="text-sm text-[#555]">
              Pick up exactly where you left off.
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => googleLogin()}
              className="group w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] text-[#bbb] text-sm font-medium transition-all duration-200 hover:border-[#2a2a2a] hover:bg-[#111] hover:text-[#f0f0f0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleGithubLogin}
              className="group w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] text-[#bbb] text-sm font-medium transition-all duration-200 hover:border-[#2a2a2a] hover:bg-[#111] hover:text-[#f0f0f0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22c55e]"
            >
              <Github className="w-4 h-4 shrink-0" />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1a1a1a]" />
            <span className="text-[11px] uppercase tracking-widest font-mono text-[#3a3a3a]">or</span>
            <div className="flex-1 h-px bg-[#1a1a1a]" />
          </div>

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;
              try {
                const res = await apiFetch("/auth/login/", {
                  method: "POST",
                  body: JSON.stringify({ username: email, password }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setAuthTokens(data.access, data.refresh);
                  showToast("Login successful!", "success");
                  window.location.href = "/dashboard";
                } else {
                  const errData = await res.json().catch(() => ({}));
                  showToast(errData.detail || "Invalid email or password.", "error");
                }
              } catch (err) {
                console.error(err);
                showToast("Cannot reach server. Try again.", "error");
              }
            }}
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-[#888] uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444] pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] text-[#f0f0f0] text-sm placeholder-[#333] transition-all duration-200 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/30 focus:bg-[#0d0d0d]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-[#888] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-[#22c55e] hover:text-[#16a34a] transition-colors focus-visible:outline-none"
                >
                  Forgot?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] text-[#f0f0f0] text-sm placeholder-[#333] transition-all duration-200 focus:outline-none focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/30 focus:bg-[#0d0d0d]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="group relative w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#22c55e] text-[#000] text-sm font-semibold tracking-wide transition-all duration-200 hover:bg-[#16a34a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000] overflow-hidden mt-2"
            >
              <span className="relative z-10">Sign in</span>
              <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              {/* Shimmer */}
              <div className="absolute inset-0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-white/10" />
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-[#444]">
            No account?{" "}
            <Link
              to="/signup"
              className="text-[#22c55e] hover:text-[#16a34a] font-medium transition-colors"
            >
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
