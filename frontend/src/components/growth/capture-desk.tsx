import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  Loader2,
  Mic,
  MicOff,
  Square,
  Trash2,
  Wand2,
} from "lucide-react";
import type { CaptureRegion, CaptureWorkflow } from "@/hooks/use-growth-state";
import { detectShapesFromCanvas } from "@/lib/capture/shape-detector";

type DrawTool = "box" | "arrow" | "select";

export function CaptureDesk({
  topicId,
  workflow,
  onSave,
}: {
  topicId: string;
  workflow: CaptureWorkflow | null;
  onSave: (workflow: CaptureWorkflow) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [frozen, setFrozen] = useState<string | null>(workflow?.imageData ?? null);
  const [regions, setRegions] = useState<CaptureRegion[]>(workflow?.regions ?? []);
  const [tool, setTool] = useState<DrawTool>("box");
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [listening, setListening] = useState(false);
  const [labelInput, setLabelInput] = useState("");

  const selected = regions.find((r) => r.id === selectedId);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      alert("Camera access is needed for Capture mode. Allow camera permission and try again.");
    }
  };

  useEffect(() => () => stopCamera(), [stopCamera]);

  const snapFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const data = canvas.toDataURL("image/jpeg", 0.85);
    setFrozen(data);
    stopCamera();
  };

  const autoDetect = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !frozen) return;
    setDetecting(true);
    const img = new Image();
    img.src = frozen;
    await new Promise((r) => {
      img.onload = r;
    });
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d")?.drawImage(img, 0, 0);
    const detected = await detectShapesFromCanvas(canvas);
    if (detected.length > 0) {
      setRegions((prev) => [...prev, ...detected]);
    }
    setDetecting(false);
  };

  const redrawOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    regions.forEach((r) => {
      const isSelected = r.id === selectedId;
      ctx.strokeStyle = isSelected ? "#3b82f6" : "#1e3a5f";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.fillStyle = isSelected ? "rgba(59,130,246,0.15)" : "rgba(30,58,95,0.1)";

      if (r.kind === "box") {
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
      } else {
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.w, r.y + r.h);
        ctx.stroke();
        const angle = Math.atan2(r.h, r.w);
        const len = 10;
        ctx.beginPath();
        ctx.moveTo(r.x + r.w, r.y + r.h);
        ctx.lineTo(
          r.x + r.w - len * Math.cos(angle - 0.4),
          r.y + r.h - len * Math.sin(angle - 0.4),
        );
        ctx.moveTo(r.x + r.w, r.y + r.h);
        ctx.lineTo(
          r.x + r.w - len * Math.cos(angle + 0.4),
          r.y + r.h - len * Math.sin(angle + 0.4),
        );
        ctx.stroke();
      }

      if (r.label) {
        ctx.fillStyle = "#2c2825";
        ctx.font = "14px Inter, sans-serif";
        ctx.fillText(r.label.slice(0, 40), r.x + 4, r.y - 6 > 12 ? r.y - 6 : r.y + 16);
      }
    });
  }, [regions, selectedId]);

  useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay, frozen]);

  useEffect(() => {
    if (!frozen || !overlayRef.current) return;
    const img = new Image();
    img.onload = () => {
      if (overlayRef.current) {
        overlayRef.current.width = img.width;
        overlayRef.current.height = img.height;
        redrawOverlay();
      }
    };
    img.src = frozen;
  }, [frozen, redrawOverlay]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const overlay = overlayRef.current!;
    const rect = overlay.getBoundingClientRect();
    const scaleX = overlay.width / rect.width;
    const scaleY = overlay.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!frozen) return;
    const pt = getCanvasCoords(e);
    const hit = regions.find(
      (r) =>
        r.kind === "box" &&
        pt.x >= r.x &&
        pt.x <= r.x + r.w &&
        pt.y >= r.y &&
        pt.y <= r.y + r.h,
    );
    if (hit) {
      setSelectedId(hit.id);
      setLabelInput(hit.label);
      return;
    }
    if (tool === "select") return;
    setDrawing(true);
    setStart(pt);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !frozen) return;
    const pt = getCanvasCoords(e);
    const w = pt.x - start.x;
    const h = pt.y - start.y;
    if (Math.abs(w) < 10 && Math.abs(h) < 10) {
      setDrawing(false);
      return;
    }
    const region: CaptureRegion = {
      id: `manual-${Date.now()}`,
      kind: tool === "arrow" ? "arrow" : "box",
      x: tool === "box" ? Math.min(start.x, pt.x) : start.x,
      y: tool === "box" ? Math.min(start.y, pt.y) : start.y,
      w: tool === "box" ? Math.abs(w) : w,
      h: tool === "box" ? Math.abs(h) : h,
      label: "",
    };
    setRegions((prev) => [...prev, region]);
    setSelectedId(region.id);
    setDrawing(false);
  };

  const saveLabel = () => {
    if (!selectedId) return;
    setRegions((prev) =>
      prev.map((r) => (r.id === selectedId ? { ...r, label: labelInput } : r)),
    );
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance })
        .webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      const text = ev.results[0][0].transcript;
      setLabelInput(text);
      if (selectedId) {
        setRegions((prev) =>
          prev.map((r) => (r.id === selectedId ? { ...r, label: text } : r)),
        );
      }
    };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const persist = () => {
    onSave({
      imageData: frozen,
      regions,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-4 py-2 border-b border-[var(--paper-line)]">
        {!frozen && !cameraOn && (
          <button
            type="button"
            onClick={startCamera}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-[var(--paper-line)] text-[var(--paper-ink)]"
          >
            <Camera className="w-3.5 h-3.5" />
            Start camera
          </button>
        )}
        {cameraOn && (
          <button
            type="button"
            onClick={snapFrame}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-[#1e3a5f] text-white"
          >
            <Camera className="w-3.5 h-3.5" />
            Capture frame
          </button>
        )}
        {frozen && (
          <>
            <button
              type="button"
              onClick={() => setTool("box")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs ${tool === "box" ? "bg-[var(--paper-line)]" : ""}`}
            >
              <Square className="w-3 h-3" /> Box
            </button>
            <button
              type="button"
              onClick={() => setTool("arrow")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs ${tool === "arrow" ? "bg-[var(--paper-line)]" : ""}`}
            >
              <ArrowRight className="w-3 h-3" /> Arrow
            </button>
            <button
              type="button"
              onClick={autoDetect}
              disabled={detecting}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
            >
              {detecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
              Auto-detect
            </button>
            <button
              type="button"
              onClick={() => {
                setFrozen(null);
                setRegions([]);
                setSelectedId(null);
              }}
              className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs text-red-700"
            >
              <Trash2 className="w-3 h-3" /> Reset
            </button>
          </>
        )}
      </div>

      <div className="flex-1 relative min-h-[360px] bg-[var(--paper-bg)] overflow-auto">
        {cameraOn && !frozen && (
          <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
        )}
        {!cameraOn && !frozen && (
          <div className="grid place-items-center h-full p-8 text-center">
            <p className="text-sm text-[var(--paper-muted)] italic max-w-sm">
              Put your paper on the desk. Draw boxes and arrows by hand, then capture — we&apos;ll
              turn your sketch into a study workflow.
            </p>
          </div>
        )}
        {frozen && (
          <div className="relative inline-block max-w-full">
            <img src={frozen} alt="Captured paper" className="max-w-full block" />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            />
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {selected && (
        <div className="shrink-0 border-t border-[var(--paper-line)] p-3 space-y-2">
          <label className="text-xs text-[var(--paper-muted)]">Label this {selected.kind}</label>
          <div className="flex gap-2">
            <input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onBlur={saveLabel}
              placeholder="Type or speak a label…"
              className="flex-1 text-sm px-3 py-2 rounded border border-[var(--paper-line)] bg-white/60 paper-editor focus:outline-none"
            />
            <button
              type="button"
              onClick={startVoice}
              className={`p-2 rounded border border-[var(--paper-line)] ${listening ? "bg-red-100 text-red-700" : ""}`}
              title="Voice input"
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {regions.length > 0 && (
        <div className="shrink-0 border-t border-[var(--paper-line)] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[var(--paper-muted)] mb-2">
            Your workflow ({regions.filter((r) => r.label).length}/{regions.length} labeled)
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {regions.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedId(r.id);
                  setLabelInput(r.label);
                }}
                className={`text-xs px-2 py-1 rounded border ${
                  r.id === selectedId
                    ? "border-[#1e3a5f] bg-[var(--paper-line)]"
                    : "border-[var(--paper-line)]"
                }`}
              >
                {i + 1}. {r.label || `Untitled ${r.kind}`}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={persist}
            className="w-full text-xs py-2 rounded-md bg-[#1e3a5f] text-white hover:opacity-90"
          >
            Save workflow to topic
          </button>
        </div>
      )}
    </div>
  );
}

interface SpeechRecognitionInstance {
  lang: string;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
