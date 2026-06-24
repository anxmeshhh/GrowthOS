import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Timer } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/toast-context";
import { useGrowth } from "@/lib/growth-store";

export function PomodoroTimer() {
  const { state } = useGrowth();
  const focusTime = (state?.settings?.pomodoroFocus || 25) * 60;
  const breakTime = (state?.settings?.pomodoroShortBreak || 5) * 60;

  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(focusTime);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create audio for completion sound
    audioRef.current = new Audio("https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3"); // Simple bell chime

    // Click outside to close
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync timeLeft when settings change, but only if not active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(mode === "focus" ? focusTime : breakTime);
    }
  }, [focusTime, breakTime, mode, isActive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      setIsActive(false);
      if (audioRef.current) audioRef.current.play().catch(() => {});

      if (mode === "focus") {
        showToast("Deep Work Session Completed! +25 XP", "xp");

        // Log to backend
        apiFetch("/pomodoro/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration_minutes: 25 }),
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["heatmap"] });
          queryClient.invalidateQueries({ queryKey: ["user_profile"] });
          queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
        });

        // Switch to break
        setMode("break");
        setTimeLeft(breakTime);
      } else {
        showToast("Break over! Ready to focus?", "info");
        setMode("focus");
        setTimeLeft(focusTime);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, queryClient, showToast]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "focus" ? focusTime : breakTime);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress =
    mode === "focus"
      ? ((focusTime - timeLeft) / focusTime) * 100
      : ((breakTime - timeLeft) / breakTime) * 100;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        zIndex: 8999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "12px",
      }}
      className="bottom-[76px] right-[84px] lg:bottom-6 lg:right-[92px]"
    >
      {/* Widget Panel */}
      {isOpen && (
        <div
          style={{
            width: "280px",
            background: "rgba(10, 10, 10, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
            animation: "slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            transformOrigin: "bottom right",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              {mode === "focus" ? "Deep Work" : "Break Time"}
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => {
                  setMode("focus");
                  setIsActive(false);
                  setTimeLeft(focusTime);
                }}
                style={{
                  fontSize: "10px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: 600,
                  background: mode === "focus" ? "rgba(0,255,102,0.15)" : "transparent",
                  color: mode === "focus" ? "#00FF66" : "#888",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Focus
              </button>
              <button
                onClick={() => {
                  setMode("break");
                  setIsActive(false);
                  setTimeLeft(breakTime);
                }}
                style={{
                  fontSize: "10px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontWeight: 600,
                  background: mode === "break" ? "rgba(59,130,246,0.15)" : "transparent",
                  color: mode === "break" ? "#3b82f6" : "#888",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Break
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div style={{ textAlign: "center", marginBottom: "20px", position: "relative" }}>
            <div
              style={{
                fontSize: "48px",
                fontWeight: 800,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                letterSpacing: "-0.05em",
                color: mode === "focus" ? "#00FF66" : "#3b82f6",
                textShadow:
                  mode === "focus"
                    ? "0 0 20px rgba(0,255,102,0.3)"
                    : "0 0 20px rgba(59,130,246,0.3)",
                lineHeight: 1,
              }}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>

            {/* Minimal Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "4px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "2px",
                marginTop: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: mode === "focus" ? "#00FF66" : "#3b82f6",
                  transition: "width 1s linear",
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <button
              onClick={toggleTimer}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: isActive
                  ? "rgba(255,255,255,0.1)"
                  : mode === "focus"
                    ? "#00FF66"
                    : "#3b82f6",
                color: isActive ? "#fff" : mode === "focus" ? "#000" : "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isActive
                  ? "none"
                  : mode === "focus"
                    ? "0 4px 16px rgba(0,255,102,0.4)"
                    : "0 4px 16px rgba(59,130,246,0.4)",
                transition: "all 150ms ease",
              }}
              className="hover:scale-105 active:scale-95"
            >
              {isActive ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" style={{ marginLeft: "4px" }} />
              )}
            </button>

            <button
              onClick={resetTimer}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                color: "#aaa",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 150ms ease",
              }}
              className="hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
            >
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: isActive ? (mode === "focus" ? "#00FF66" : "#3b82f6") : "rgba(20,20,20,0.9)",
          backdropFilter: "blur(8px)",
          border: isActive ? "none" : "1px solid rgba(255,255,255,0.1)",
          color: isActive ? (mode === "focus" ? "#000" : "#fff") : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: isActive
            ? mode === "focus"
              ? "0 4px 20px rgba(0,255,102,0.4)"
              : "0 4px 20px rgba(59,130,246,0.4)"
            : "0 8px 32px rgba(0,0,0,0.5)",
          transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
        }}
        className="hover:scale-110 active:scale-95"
      >
        <Timer size={24} />

        {/* Active Indicator Ring */}
        {isActive && (
          <div
            style={{
              position: "absolute",
              inset: "-4px",
              borderRadius: "50%",
              border: `2px solid ${mode === "focus" ? "#00FF66" : "#3b82f6"}`,
              opacity: 0.5,
              animation: "pulse-ring 2s infinite cubic-bezier(0.4, 0, 0.6, 1)",
            }}
          />
        )}
      </button>

      <style>{`
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
