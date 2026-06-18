import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast-context";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/auth/github/callback")({
  component: GithubCallbackPage,
});

function GithubCallbackPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const errorParam = urlParams.get("error");

    if (errorParam) {
      setError("GitHub authorization was cancelled or failed.");
      setTimeout(() => navigate({ to: "/login" }), 3000);
      return;
    }

    if (!code) {
      setError("No authorization code found.");
      setTimeout(() => navigate({ to: "/login" }), 3000);
      return;
    }

    // Exchange the code for JWTs via our backend
    const authenticate = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/auth/github/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("access_token", data.access);
          localStorage.setItem("refresh_token", data.refresh);
          showToast("Successfully connected with GitHub!", "success");
          window.location.href = "/dashboard";
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || "Failed to authenticate with GitHub.");
          setTimeout(() => navigate({ to: "/login" }), 3000);
        }
      } catch (err) {
        setError("Error connecting to server. Please try again.");
        setTimeout(() => navigate({ to: "/login" }), 3000);
      }
    };

    authenticate();
  }, [navigate, showToast]);

  return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-[#22c55e] opacity-20 blur-2xl animate-pulse" />
          <Logo size={48} className="relative z-10 animate-bounce" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-[#f0f0f0]">
            {error ? "Authentication Failed" : "Connecting to GitHub..."}
          </h2>
          <p className="text-sm text-[#888] max-w-[300px] mx-auto">
            {error || "Securely verifying your account and pulling your profile. This will just take a second."}
          </p>
          
          {error && (
            <p className="text-xs text-[#555] mt-4">
              Redirecting you back to login...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
