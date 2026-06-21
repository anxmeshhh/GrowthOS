import { createFileRoute, Link } from "@tanstack/react-router";
import { Github, User, Mail, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { useState, useEffect } from "react";
import { useToast } from "@/components/toast-context";
import { apiFetch, setAuthTokens } from "@/lib/api-client";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — GrowthOS" }] }),
  component: SignupPage,
});

const QUOTES = [
  "The compound interest of learning — small gains, enormous results.",
  "An investment in knowledge pays the best interest.",
  "Consistency is the ultimate competitive advantage.",
  "What looks like talent is usually just a lot of practice.",
  "Mastery is not an accident. It is a process.",
];

// ── Password strength meter ────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special character", ok: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;

  const barColor =
    score <= 1
      ? "bg-red-500"
      : score === 2
        ? "bg-yellow-500"
        : score === 3
          ? "bg-blue-400"
          : "bg-[#22c55e]";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? barColor : "bg-[#1e1e1e]"
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-xs font-mono transition-colors duration-200 ${
              c.ok ? "text-[#22c55e]" : "text-[#777]"
            }`}
          >
            {c.ok ? "✓" : "·"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Decorative left panel ──────────────────────────────────────────────────────
function LeftPanel() {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const steps = [
    {
      icon: "01",
      title: "Pick a learning path",
      body: "Structured, opinionated tracks built for depth.",
    },
    { icon: "02", title: "Build in public", body: "Ship real projects as you learn each concept." },
    {
      icon: "03",
      title: "Track your velocity",
      body: "See compounding growth across every skill.",
    },
  ];

  return (
    <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-12 overflow-hidden bg-[#050505]">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-[#22c55e] opacity-[0.05] blur-[80px]" />
        <div className="absolute top-[30%] left-[5%] w-[250px] h-[250px] rounded-full bg-[#22c55e] opacity-[0.04] blur-[60px]" />
      </div>

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.035]"
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

      {/* Center: how it works */}
      <div className="relative z-10 space-y-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.4em] font-mono text-[#555]">How it works</p>
          <h3 className="text-xl font-bold text-[#f0f0f0] leading-snug">
            Three steps to compound skills
          </h3>
        </div>

        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={s.icon} className="flex gap-4 items-start">
              <div className="shrink-0 w-8 h-8 rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] flex items-center justify-center">
                <span className="text-xs font-mono text-[#22c55e]">{s.icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#ddd]">{s.title}</p>
                <p className="text-xs text-[#555] mt-0.5 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Avatars / social proof */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex -space-x-2">
            {["#22c55e", "#16a34a", "#15803d", "#14532d"].map((c, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[#050505] flex items-center justify-center text-xs font-bold text-[#000]"
                style={{ backgroundColor: c }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#555]">
            <span className="text-[#888]">12,400+ learners</span> already inside
          </p>
        </div>

        {/* Quote */}
        <div className="border-l-2 border-[#22c55e]/40 pl-4 mt-8">
          <p className="text-[#888] text-sm leading-relaxed italic transition-opacity duration-500">
            "{quote}"
          </p>
        </div>
      </div>

      {/* Bottom tag */}
      <div className="relative z-10 flex items-center gap-2 text-[#666] text-xs font-mono">
        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
        Free to start, no credit card
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`min-h-screen bg-[#000] flex transition-opacity duration-700 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <LeftPanel />

      {/* Right: form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12">
        <div className="w-full max-w-[400px] mx-auto lg:mx-0 space-y-8">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 lg:hidden mb-6">
              <Logo size={22} />
              <span className="text-[#f0f0f0] font-semibold text-base tracking-tight">
                GrowthOS
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] font-mono text-[#666]">Get started</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">Create your account</h2>
            <p className="text-base text-[#888]">Free forever on core features.</p>
          </div>

          {/* Form */}
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              const fd = new FormData(e.currentTarget);

              try {
                if (step === 1) {
                  // Send OTP
                  const inputEmail = fd.get("email") as string;
                  const res = await apiFetch("/auth/send-otp/", {
                    method: "POST",
                    body: JSON.stringify({ email: inputEmail }),
                  });
                  if (res.ok) {
                    setEmail(inputEmail);
                    setStep(2);
                    showToast("Verification code sent to your email", "success");
                  } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(
                      err.error || "Failed to send code. Email might be registered.",
                      "error",
                    );
                  }
                } else if (step === 2) {
                  // Verify OTP
                  const otp = fd.get("otp") as string;
                  const res = await apiFetch("/auth/verify-otp/", {
                    method: "POST",
                    body: JSON.stringify({ email, otp }),
                  });
                  if (res.ok) {
                    setStep(3);
                    showToast("Email verified!", "success");
                  } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(err.error || "Invalid verification code.", "error");
                  }
                } else if (step === 3) {
                  // Final Registration
                  const name = fd.get("name") as string;
                  const pwd = fd.get("password") as string;
                  const res = await apiFetch("/auth/register/", {
                    method: "POST",
                    body: JSON.stringify({ username: email, email, password: pwd }),
                  });
                  if (res.ok || res.status === 201) {
                    // Auto-login
                    const loginRes = await apiFetch("/auth/login/", {
                      method: "POST",
                      body: JSON.stringify({ username: email, password: pwd }),
                    });
                    if (loginRes.ok) {
                      const data = await loginRes.json();
                      setAuthTokens(data.access, data.refresh);
                      showToast("Account created! Welcome to GrowthOS.", "success");
                      window.location.href = "/dashboard";
                    }
                  } else {
                    const errData = await res.json().catch(() => ({}));
                    const msg = errData.detail || errData.error || "Failed to register.";
                    showToast(msg, "error");
                  }
                }
              } catch (err) {
                console.error(err);
                showToast("Error connecting to server.", "error");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {step === 1 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <label htmlFor="email" className="block text-sm font-semibold text-[#ccc]">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    defaultValue={email}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#252525] bg-[#0d0d0d] text-white text-sm placeholder-[#3a3a3a] transition-all duration-200 focus:outline-none focus:border-[#22c55e]/60 focus:ring-1 focus:ring-[#22c55e]/25 focus:bg-[#0f0f0f]"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                <label htmlFor="otp" className="block text-sm font-semibold text-[#ccc]">
                  Verification Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#252525] bg-[#0d0d0d] text-white text-sm tracking-[0.5em] text-center placeholder-[#3a3a3a] transition-all duration-200 focus:outline-none focus:border-[#22c55e]/60 focus:ring-1 focus:ring-[#22c55e]/25 focus:bg-[#0f0f0f]"
                  />
                </div>
                <p className="text-xs text-[#555] mt-2">
                  Code sent to {email}.{" "}
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[#22c55e] hover:underline"
                  >
                    Change email
                  </button>
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-[#ccc]">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#252525] bg-[#0d0d0d] text-white text-sm placeholder-[#3a3a3a] transition-all duration-200 focus:outline-none focus:border-[#22c55e]/60 focus:ring-1 focus:ring-[#22c55e]/25 focus:bg-[#0f0f0f]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-[#ccc]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#252525] bg-[#0d0d0d] text-white text-sm placeholder-[#3a3a3a] transition-all duration-200 focus:outline-none focus:border-[#22c55e]/60 focus:ring-1 focus:ring-[#22c55e]/25 focus:bg-[#0f0f0f]"
                    />
                  </div>
                  <PasswordStrength password={password} />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#22c55e] text-[#000] text-sm font-bold tracking-wide transition-all duration-200 hover:bg-[#16a34a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000] overflow-hidden mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10">
                {step === 1 ? "Continue" : step === 2 ? "Verify Email" : "Create Account"}
              </span>
              <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              <div className="absolute inset-0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 bg-white/10" />
            </button>
          </form>

          {/* Terms */}
          <p className="text-center text-xs text-[#777] leading-relaxed">
            By creating an account you agree to our{" "}
            <a
              href="#"
              className="text-[#666] hover:text-[#999] underline underline-offset-2 transition-colors"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-[#666] hover:text-[#999] underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </a>
            .
          </p>

          {/* Footer */}
          <p className="text-center text-sm text-[#666]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#22c55e] hover:text-[#16a34a] font-semibold transition-colors"
            >
              Log in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
