import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast-context";
import { Logo } from "@/components/logo";
import { apiFetch } from "@/lib/api-client";

let isAuthenticating = false;

export const Route = createFileRoute("/auth/github/callback")({
  component: GithubCallbackPage,
});

function GithubCallbackPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticating) return;

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

    const state = urlParams.get("state");
    const intent = urlParams.get("intent") || "login";

    // Choose backend endpoint based on state
    const isConnect = state === "connect_workspace";
    const endpoint = isConnect ? "/auth/github/connect/" : "/auth/github/";
    const redirectUrl = isConnect ? "/settings" : "/dashboard";

    // Exchange the code via our backend
    const authenticate = async () => {
      isAuthenticating = true;
      try {
        const redirectUri = window.location.origin + "/auth/github/callback";
        const res = await apiFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirect_uri: redirectUri, intent }),
        });

        if (res.ok) {
          if (!isConnect) {
            const data = await res.json();
            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
          }
          showToast(
            isConnect
              ? "Successfully connected GitHub Workspace!"
              : "Successfully connected with GitHub!",
            "success",
          );
          window.location.href = redirectUrl;
        } else {
          const errData = await res.json().catch(() => ({}));
          const isNotFound = res.status === 404;
          setError(
            errData.error ||
              `Failed to ${isConnect ? "connect workspace" : "authenticate"} with GitHub.`,
          );
          
          setTimeout(() => {
            if (isConnect) {
              navigate({ to: "/settings" });
            } else {
              navigate({ to: isNotFound ? "/signup" : "/login" });
            }
          }, 3000);
        }
      } catch (err) {
        setError("Error connecting to server. Please try again.");
        setTimeout(() => navigate({ to: isConnect ? "/settings" : "/login" }), 3000);
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
            {error ||
              "Securely verifying your account and pulling your profile. This will just take a second."}
          </p>

          {error && <p className="text-xs text-[#555] mt-4">Redirecting you back to login...</p>}
        </div>
      </div>
    </div>
  );
}
