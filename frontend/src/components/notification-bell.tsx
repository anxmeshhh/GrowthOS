import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Zap, Flame, CreditCard, Map, Trophy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useNavigate } from "@tanstack/react-router";

interface Notification {
  id: number;
  type: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  topic_complete: Trophy,
  streak_milestone: Flame,
  flashcards_due: CreditCard,
  path_shared: Map,
  quiz_ready: Zap,
  general: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  topic_complete: "#00FF66",
  streak_milestone: "#f59e0b",
  flashcards_due: "#3b82f6",
  path_shared: "#7c3aed",
  quiz_ready: "#ec4899",
  general: "#888",
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await apiFetch("/notifications/");
      if (!r.ok) return { notifications: [], unread_count: 0 };
      return r.json();
    },
    refetchInterval: 60000,
  });

  const markRead = useMutation({
    mutationFn: async (payload: { ids?: number[]; all?: boolean }) => {
      await apiFetch("/notifications/", { method: "POST", body: JSON.stringify(payload) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const notifications: Notification[] = data?.notifications || [];
  const unread: number = data?.unread_count || 0;

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate({ ids: [n.id] });
    setOpen(false);
    if (n.link) navigate({ to: n.link });
  };

  return (
    <div style={{ position: "relative" }} ref={panelRef}>
      <button
        onClick={() => {
          setOpen(o => !o);
          if (!open && unread > 0) markRead.mutate({ all: true });
        }}
        title="Notifications"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: collapsed ? "100%" : "32px",
          height: "32px",
          borderRadius: "8px",
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          border: "1px solid rgba(255,255,255,0.06)",
          color: unread > 0 ? "#f59e0b" : "rgba(255,255,255,0.4)",
          cursor: "pointer",
          position: "relative",
          transition: "all 150ms ease",
          flexShrink: 0,
        }}
        className="notif-btn"
      >
        <Bell size={15} />
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            minWidth: "16px",
            height: "16px",
            borderRadius: "8px",
            background: "#ef4444",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            border: "2px solid #0d0d0d",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: collapsed ? "calc(100% + 8px)" : "0",
          width: "320px",
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
          zIndex: 200,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e5e5e5" }}>Notifications</span>
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={() => markRead.mutate({ all: true })}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#00FF66", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#555", fontSize: 13 }}>
                No notifications yet
              </div>
            ) : notifications.map(n => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              const color = TYPE_COLORS[n.type] || "#888";
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 16px",
                    background: n.is_read ? "transparent" : "rgba(255,255,255,0.03)",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 100ms",
                  }}
                  className="notif-item"
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: n.is_read ? "#888" : "#ddd", lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00FF66", flexShrink: 0, marginTop: 6 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .notif-btn:hover { color: #fff !important; background: rgba(255,255,255,0.06) !important; }
        .notif-item:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>
    </div>
  );
}
