import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Users, Play, X, Loader2, Timer, UserCircle2 } from "lucide-react";

interface Room {
  id: number;
  name: string;
  pomodoro_end: string | null;
  participant_count: number;
  participants: { username: string; joined_at: string }[];
}

function PomodoroCountdown({ end }: { end: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(end).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Done!"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#00FF66", fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>
      <Timer size={13} /> {remaining}
    </div>
  );
}

export function StudyRoom({ topicId, topicSlug }: { topicId: string; topicSlug: string }) {
  const [open, setOpen] = useState(false);
  const [joinedRoomId, setJoinedRoomId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["study_rooms", topicId],
    queryFn: async () => {
      const r = await apiFetch(`/rooms/?topic_id=${topicId}`);
      return r.ok ? r.json() : { rooms: [] };
    },
    enabled: open,
    refetchInterval: open ? 15000 : false,
  });

  const rooms: Room[] = data?.rooms || [];
  const myRoom = rooms.find(r => r.participants.some(p => p.username === "me") || r.id === joinedRoomId);

  // Ping heartbeat when in a room
  useEffect(() => {
    if (!joinedRoomId) return;
    const ping = async () => {
      await apiFetch("/rooms/", { method: "POST", body: JSON.stringify({ action: "ping", room_id: joinedRoomId }) });
    };
    ping();
    const id = setInterval(ping, 60000);
    return () => clearInterval(id);
  }, [joinedRoomId]);

  const roomAction = useMutation({
    mutationFn: async (body: object) => {
      const r = await apiFetch("/rooms/", { method: "POST", body: JSON.stringify(body) });
      return r.json();
    },
    onSuccess: (data, vars: any) => {
      if (vars.action === "join" || vars.action === "create") {
        setJoinedRoomId(data.room_id || vars.room_id);
      } else if (vars.action === "leave") {
        setJoinedRoomId(null);
      }
      qc.invalidateQueries({ queryKey: ["study_rooms", topicId] });
    },
  });

  const totalStudying = rooms.reduce((s, r) => s + r.participant_count, 0);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 14px", borderRadius: 10, cursor: "pointer",
          background: totalStudying > 0 ? "rgba(0,255,102,0.08)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${totalStudying > 0 ? "rgba(0,255,102,0.25)" : "rgba(255,255,255,0.08)"}`,
          color: totalStudying > 0 ? "#00FF66" : "#888",
          fontSize: 13, fontWeight: 600, transition: "all 0.15s",
        }}
      >
        <Users size={14} />
        {totalStudying > 0 ? `${totalStudying} studying now` : "Study together"}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 80, right: 24, width: 320, zIndex: 500,
          background: "#141414", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={15} style={{ color: "#00FF66" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e5e5e5" }}>Study Rooms</span>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#555" }}><X size={16} /></button>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto", padding: 12 }}>
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                <Loader2 size={18} style={{ color: "#444" }} className="animate-spin" />
              </div>
            )}

            {!isLoading && rooms.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>No active rooms. Start one and study with others.</p>
              </div>
            )}

            {rooms.map(room => (
              <div key={room.id} style={{ padding: "12px 14px", background: "#1a1a1a", border: "1px solid #242424", borderRadius: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{room.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <Users size={11} style={{ color: "#555" }} />
                      <span style={{ fontSize: 11, color: "#555" }}>{room.participant_count} person{room.participant_count !== 1 ? "s" : ""}</span>
                      {room.pomodoro_end && <PomodoroCountdown end={room.pomodoro_end} />}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {room.participants.slice(0, 5).map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#888", background: "#111", borderRadius: 20, padding: "2px 8px" }}>
                      <UserCircle2 size={11} /> {p.username}
                    </div>
                  ))}
                  {room.participant_count > 5 && <span style={{ fontSize: 11, color: "#555" }}>+{room.participant_count - 5} more</span>}
                </div>

                {joinedRoomId === room.id ? (
                  <button
                    onClick={() => roomAction.mutate({ action: "leave", room_id: room.id })}
                    style={{ width: "100%", padding: "7px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Leave Room
                  </button>
                ) : (
                  <button
                    onClick={() => roomAction.mutate({ action: "join", room_id: room.id })}
                    disabled={roomAction.isPending}
                    style={{ width: "100%", padding: "7px", borderRadius: 8, border: "1px solid rgba(0,255,102,0.25)", background: "rgba(0,255,102,0.08)", color: "#00FF66", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Join Room
                  </button>
                )}
              </div>
            ))}

            {/* Create Room */}
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed #2a2a2a", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Play size={12} /> Start a 25-min focus room
              </button>
            ) : (
              <div style={{ padding: "12px", background: "#1a1a1a", border: "1px solid #252525", borderRadius: 12 }}>
                <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Start a Pomodoro session and invite others studying this topic.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      roomAction.mutate({ action: "create", topic_id: topicId, duration_min: 25 });
                      setCreating(false);
                    }}
                    style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#00FF66", color: "#0a0a0a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    <Play size={12} style={{ display: "inline", marginRight: 5 }} /> 25 min
                  </button>
                  <button
                    onClick={() => {
                      roomAction.mutate({ action: "create", topic_id: topicId, duration_min: 50 });
                      setCreating(false);
                    }}
                    style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#888", fontSize: 12, cursor: "pointer" }}
                  >
                    50 min
                  </button>
                  <button onClick={() => setCreating(false)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #333", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer" }}><X size={13} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
