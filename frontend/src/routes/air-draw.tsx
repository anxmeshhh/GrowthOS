import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { PageShell, PageHeader, Btn } from "@/components/growth-ui";
import {
  Loader2,
  Sparkles,
  RefreshCw,
  PenTool,
  Circle,
  Eraser,
  UserSquare2,
  Maximize,
  Type,
} from "lucide-react";
import { toast } from "sonner";

type Point = { x: number; y: number };

type TaskbarShapeType = "circle" | "triangle" | "rectangle" | "square" | "line";
type TaskbarIcon = { type: TaskbarShapeType; x: number; y: number; size: number };
const TASKBAR_ICONS: TaskbarIcon[] = [
  { type: "circle", x: 300, y: 50, size: 50 },
  { type: "triangle", x: 450, y: 50, size: 50 },
  { type: "rectangle", x: 600, y: 50, size: 50 },
  { type: "square", x: 750, y: 50, size: 50 },
  { type: "line", x: 900, y: 50, size: 50 },
];
type DraggedShape = {
  type: TaskbarShapeType;
  x: number;
  y: number;
  size: number;
  rotation: number;
};

type BaseStroke = { color: string; thickness: number; rotation?: number; text?: string };
type RawStroke = BaseStroke & { type: "raw"; points: Point[] };
type LineStroke = BaseStroke & { type: "line"; start: Point; end: Point };
type CircleStroke = BaseStroke & { type: "circle"; center: Point; radius: number };
type RectStroke = BaseStroke & {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
};
type SquareStroke = BaseStroke & {
  type: "square";
  x: number;
  y: number;
  width: number;
  height: number;
};
type TriStroke = BaseStroke & { type: "triangle"; p1: Point; p2: Point; p3: Point };
type ConnectionStroke = BaseStroke & { type: "connection"; path: Point[] };

type Stroke =
  | RawStroke
  | LineStroke
  | CircleStroke
  | RectStroke
  | SquareStroke
  | TriStroke
  | ConnectionStroke;

function detectShape(points: Point[], color: string): Stroke {
  const thickness = 6;
  if (points.length < 10) return { type: "raw", points, color, thickness };

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  points.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);
  const start = points[0];
  const end = points[points.length - 1];

  const dist = (p1: Point, p2: Point) => Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += dist(points[i], points[i - 1]);
  }
  const startEndDist = dist(start, end);

  if (maxDim < 20) return { type: "raw", points, color, thickness };

  // 1. Line
  if (startEndDist > maxDim * 0.7 && totalLength / startEndDist < 1.3) {
    return { type: "line", start, end, color, thickness };
  }

  // Check if stroke is somewhat closed
  if (startEndDist < maxDim * 0.8) {
    const cx = minX + width / 2;
    const cy = minY + height / 2;
    const center = { x: cx, y: cy };

    // Circle error
    let totalRadius = 0;
    points.forEach((p) => (totalRadius += dist(p, center)));
    const avgRadius = totalRadius / points.length;

    let circleError = 0;
    points.forEach((p) => (circleError += Math.abs(dist(p, center) - avgRadius)));
    const avgCircleError = circleError / points.length;
    const normCircleError = avgCircleError / maxDim;

    // Rectangle error (using 10th and 90th percentile to avoid outlier sensitivity)
    const sortedX = [...points].sort((a, b) => a.x - b.x);
    const sortedY = [...points].sort((a, b) => a.y - b.y);
    const p10X = sortedX[Math.floor(points.length * 0.1)].x;
    const p90X = sortedX[Math.floor(points.length * 0.9)].x;
    const p10Y = sortedY[Math.floor(points.length * 0.1)].y;
    const p90Y = sortedY[Math.floor(points.length * 0.9)].y;

    let rectError = 0;
    points.forEach((p) => {
      const dx = Math.min(Math.abs(p.x - p10X), Math.abs(p.x - p90X));
      const dy = Math.min(Math.abs(p.y - p10Y), Math.abs(p.y - p90Y));
      rectError += Math.min(dx, dy);
    });
    const avgRectError = rectError / points.length;
    const normRectError = avgRectError / maxDim;

    // Triangle error
    const p0 = points[0];
    let p1 = points[0];
    let maxD = 0;
    points.forEach((p) => {
      const d = dist(p, p0);
      if (d > maxD) {
        maxD = d;
        p1 = p;
      }
    });

    const distToSegSq = (p: Point, v: Point, w: Point) => {
      const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
      if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
      let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
    };

    let p2 = points[0];
    let maxD2 = 0;
    points.forEach((p) => {
      const d = distToSegSq(p, p0, p1);
      if (d > maxD2) {
        maxD2 = d;
        p2 = p;
      }
    });

    let triErrorSqSum = 0;
    points.forEach((p) => {
      const d1 = distToSegSq(p, p0, p1);
      const d2 = distToSegSq(p, p1, p2);
      const d3 = distToSegSq(p, p2, p0);
      triErrorSqSum += Math.sqrt(Math.min(d1, d2, d3));
    });
    const avgTriError = triErrorSqSum / points.length;
    const normTriError = avgTriError / maxDim;

    // 2. Triangle
    if (normTriError < 0.18 && normTriError <= normCircleError && normTriError <= normRectError) {
      return { type: "triangle", p1: p0, p2: p1, p3: p2, color, thickness };
    }

    // 3. Circle
    if (normCircleError < 0.2 && normCircleError <= normRectError) {
      if (minDim / maxDim > 0.4) {
        return { type: "circle", center, radius: maxDim / 2, color, thickness };
      }
    }

    // 4. Rectangle
    if (normRectError < 0.2) {
      return {
        type: "rectangle",
        x: p10X,
        y: p10Y,
        width: p90X - p10X,
        height: p90Y - p10Y,
        color,
        thickness,
      };
    }
  }

  return { type: "raw", points, color, thickness };
}

function inverseRotate(px: number, py: number, cx: number, cy: number, rot: number) {
  if (!rot) return { x: px, y: py };
  const dx = px - cx;
  const dy = py - cy;
  const cos = Math.cos(-rot);
  const sin = Math.sin(-rot);
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

function isInsideShape(px: number, py: number, stroke: Stroke): boolean {
  let pad = 0; // 0 padding ensures it perfectly touches the line
  if (stroke.type === "circle") {
    return Math.hypot(px - stroke.center.x, py - stroke.center.y) < stroke.radius + pad;
  } else if (stroke.type === "rectangle") {
    const cx = stroke.x + stroke.width / 2;
    const cy = stroke.y + stroke.height / 2;
    const rp = inverseRotate(px, py, cx, cy, stroke.rotation || 0);
    return (
      rp.x > stroke.x - pad &&
      rp.x < stroke.x + stroke.width + pad &&
      rp.y > stroke.y - pad &&
      rp.y < stroke.y + stroke.height + pad
    );
  } else if (stroke.type === "square") {
    const cx = stroke.x + stroke.width / 2;
    const cy = stroke.y + stroke.height / 2;
    const rp = inverseRotate(px, py, cx, cy, stroke.rotation || 0);
    return (
      rp.x > stroke.x - pad &&
      rp.x < stroke.x + stroke.width + pad &&
      rp.y > stroke.y - pad &&
      rp.y < stroke.y + stroke.height + pad
    );
  } else if (stroke.type === "line") {
    const cx = (stroke.start.x + stroke.end.x) / 2;
    const cy = (stroke.start.y + stroke.end.y) / 2;
    const rp = inverseRotate(px, py, cx, cy, stroke.rotation || 0);
    const dist = distToSegment(rp, stroke.start, stroke.end);
    return dist < pad;
  } else if (stroke.type === "triangle") {
    const cx = (stroke.p1.x + stroke.p2.x + stroke.p3.x) / 3;
    const cy = (stroke.p1.y + stroke.p2.y + stroke.p3.y) / 3;
    const rp = inverseRotate(px, py, cx, cy, stroke.rotation || 0);

    const sign = (p1: Point, p2: Point, p3: Point) => {
      return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    };
    const d1 = sign(rp, stroke.p1, stroke.p2);
    const d2 = sign(rp, stroke.p2, stroke.p3);
    const d3 = sign(rp, stroke.p3, stroke.p1);
    const has_neg = d1 < 0 || d2 < 0 || d3 < 0;
    const has_pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(has_neg && has_pos);
  } else if (stroke.type === "raw") {
    if (stroke.points.length === 0) return false;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    stroke.points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return px > minX - pad && px < maxX + pad && py > minY - pad && py < maxY + pad;
  }
  return false;
}

function trimPath(path: Point[], shape1: Stroke, shape2: Stroke): Point[] {
  if (path.length < 2) return path;

  let startIdx = 0;
  let exitPoint = path[0];
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.ceil(dist / 2);
    let exited = false;
    for (let j = 0; j <= steps; j++) {
      const px = p1.x + (p2.x - p1.x) * (j / steps);
      const py = p1.y + (p2.y - p1.y) * (j / steps);
      if (!isInsideShape(px, py, shape1)) {
        exitPoint = { x: px, y: py };
        exited = true;
        break;
      }
    }
    if (exited) {
      startIdx = i + 1;
      break;
    }
  }

  let endIdx = path.length - 1;
  let enterPoint = path[path.length - 1];
  for (let i = path.length - 1; i > 0; i--) {
    const p1 = path[i];
    const p2 = path[i - 1];
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.ceil(dist / 2);
    let entered = false;
    for (let j = 0; j <= steps; j++) {
      const px = p1.x + (p2.x - p1.x) * (j / steps);
      const py = p1.y + (p2.y - p1.y) * (j / steps);
      if (!isInsideShape(px, py, shape2)) {
        enterPoint = { x: px, y: py };
        entered = true;
        break;
      }
    }
    if (entered) {
      endIdx = i - 1;
      break;
    }
  }

  const trimmed = [exitPoint];
  for (let i = startIdx; i <= endIdx; i++) {
    trimmed.push(path[i]);
  }
  trimmed.push(enterPoint);
  return trimmed;
}

function distToSegment(p: Point, v: Point, w: Point) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function isBlocked(px: number, py: number, strokes: Stroke[]): boolean {
  const pad = 30;
  for (const stroke of strokes) {
    if (stroke.type === "circle") {
      const d = Math.hypot(px - stroke.center.x, py - stroke.center.y);
      if (d < stroke.radius + pad) return true;
    } else if (stroke.type === "rectangle") {
      const cx = stroke.x + stroke.width / 2;
      const cy = stroke.y + stroke.height / 2;
      const rp = inverseRotate(px, py, cx, cy, stroke.rotation || 0);
      if (
        rp.x > stroke.x - pad &&
        rp.x < stroke.x + stroke.width + pad &&
        rp.y > stroke.y - pad &&
        rp.y < stroke.y + stroke.height + pad
      )
        return true;
    } else if (stroke.type === "line") {
      const cx = (stroke.start.x + stroke.end.x) / 2;
      const cy = (stroke.start.y + stroke.end.y) / 2;
      const rp = inverseRotate(px, py, cx, cy, stroke.rotation || 0);
      const dist = distToSegment(rp, stroke.start, stroke.end);
      if (dist < pad) return true;
    } else if (stroke.type === "triangle") {
      const cx = (stroke.p1.x + stroke.p2.x + stroke.p3.x) / 3;
      const cy = (stroke.p1.y + stroke.p2.y + stroke.p3.y) / 3;
      const rp = inverseRotate(px, py, cx, cy, stroke.rotation || 0);
      const r1 = Math.hypot(stroke.p1.x - cx, stroke.p1.y - cy);
      const r2 = Math.hypot(stroke.p2.x - cx, stroke.p2.y - cy);
      const r3 = Math.hypot(stroke.p3.x - cx, stroke.p3.y - cy);
      const maxR = Math.max(r1, r2, r3);
      if (Math.hypot(rp.x - cx, rp.y - cy) < maxR + pad) return true;
    } else if (stroke.type === "raw") {
      if (stroke.points.length === 0) continue;
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      stroke.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });
      if (px > minX - pad && px < maxX + pad && py > minY - pad && py < maxY + pad) return true;
    }
  }
  return false;
}

function hasLineOfSight(p1: Point, p2: Point, obstacles: Stroke[]): boolean {
  const steps = Math.ceil(Math.hypot(p1.x - p2.x, p1.y - p2.y) / 10);
  for (let i = 1; i < steps; i++) {
    const px = p1.x + (p2.x - p1.x) * (i / steps);
    const py = p1.y + (p2.y - p1.y) * (i / steps);
    if (isBlocked(px, py, obstacles)) return false;
  }
  return true;
}

function findPath(
  start: Point,
  end: Point,
  obstacles: Stroke[],
  width: number,
  height: number,
): Point[] {
  const cellSize = 20;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);

  const startC = Math.floor(start.x / cellSize);
  const startR = Math.floor(start.y / cellSize);
  const endC = Math.floor(end.x / cellSize);
  const endR = Math.floor(end.y / cellSize);

  const sc = Math.max(0, Math.min(cols - 1, startC));
  const sr = Math.max(0, Math.min(rows - 1, startR));
  const ec = Math.max(0, Math.min(cols - 1, endC));
  const er = Math.max(0, Math.min(rows - 1, endR));

  const grid = new Array(cols * rows).fill(false);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = c * cellSize + cellSize / 2;
      const py = r * cellSize + cellSize / 2;
      if (Math.hypot(px - start.x, py - start.y) < 40) continue;
      if (Math.hypot(px - end.x, py - end.y) < 40) continue;

      if (isBlocked(px, py, obstacles)) {
        grid[r * cols + c] = true;
      }
    }
  }

  const openSet = [{ c: sc, r: sr, f: 0, g: 0, parent: null as any }];
  const closedSet = new Set<string>();

  let bestNode = null;
  let minDist = Infinity;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const curr = openSet.shift()!;
    const key = `${curr.c},${curr.r}`;
    if (closedSet.has(key)) continue;
    closedSet.add(key);

    const dToTarget = Math.hypot(curr.c - ec, curr.r - er);
    if (dToTarget < minDist) {
      minDist = dToTarget;
      bestNode = curr;
    }

    if (curr.c === ec && curr.r === er) {
      bestNode = curr;
      break;
    }

    const neighbors = [
      { c: curr.c + 1, r: curr.r },
      { c: curr.c - 1, r: curr.r },
      { c: curr.c, r: curr.r + 1 },
      { c: curr.c, r: curr.r - 1 },
    ];

    for (const n of neighbors) {
      if (n.c >= 0 && n.c < cols && n.r >= 0 && n.r < rows) {
        if (!grid[n.r * cols + n.c]) {
          const g = curr.g + 1;
          const h = Math.hypot(n.c - ec, n.r - er);
          openSet.push({ c: n.c, r: n.r, f: g + h, g, parent: curr });
        }
      }
    }

    if (closedSet.size > 2000) break;
  }

  const path: Point[] = [];
  let n = bestNode;
  while (n) {
    path.push({ x: n.c * cellSize + cellSize / 2, y: n.r * cellSize + cellSize / 2 });
    n = n.parent;
  }
  path.reverse();

  if (path.length > 0) {
    path[0] = start;
    path[path.length - 1] = end;
  } else {
    path.push(start, end);
  }

  const smoothPath = [path[0]];
  let currIdx = 0;
  while (currIdx < path.length - 1) {
    let furthestSight = currIdx + 1;
    for (let i = path.length - 1; i > currIdx + 1; i--) {
      if (hasLineOfSight(path[currIdx], path[i], obstacles)) {
        furthestSight = i;
        break;
      }
    }
    smoothPath.push(path[furthestSight]);
    currIdx = furthestSight;
  }

  return smoothPath;
}

function getCenter(stroke: Stroke): Point {
  if (stroke.type === "circle") return stroke.center;
  if (stroke.type === "rectangle")
    return { x: stroke.x + stroke.width / 2, y: stroke.y + stroke.height / 2 };
  if (stroke.type === "triangle")
    return {
      x: (stroke.p1.x + stroke.p2.x + stroke.p3.x) / 3,
      y: (stroke.p1.y + stroke.p2.y + stroke.p3.y) / 3,
    };
  if (stroke.type === "line")
    return { x: (stroke.start.x + stroke.end.x) / 2, y: (stroke.start.y + stroke.end.y) / 2 };
  if (stroke.type === "raw" && stroke.points.length > 0)
    return stroke.points[Math.floor(stroke.points.length / 2)];
  if (stroke.type === "connection" && stroke.path.length > 0)
    return stroke.path[Math.floor(stroke.path.length / 2)];
  return { x: 0, y: 0 };
}

function drawTextInShape(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, maxWidth: number, maxHeight: number) {
  if (!text) return;
  let fontSize = 40;
  let lines: string[] = [];
  let lineHeight = fontSize * 1.2;

  // Decrease font size until it fits
  while (fontSize > 8) {
    ctx.font = `bold ${fontSize}px sans-serif`;
    lineHeight = fontSize * 1.2;
    const words = text.split(/\s+/);
    lines = [];
    let line = "";
    let wordTooLong = false;

    for (let n = 0; n < words.length; n++) {
      const wordWidth = ctx.measureText(words[n]).width;
      if (wordWidth > maxWidth) {
        wordTooLong = true;
        break;
      }

      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }

    if (wordTooLong) {
      fontSize -= 2;
      continue;
    }

    lines.push(line);

    if (lines.length * lineHeight <= maxHeight) {
      break; // Fits!
    }
    fontSize -= 2;
  }

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const totalHeight = lines.length * lineHeight;
  let startY = cy - totalHeight / 2 + lineHeight / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(-1, 1);
  ctx.translate(-cx, -cy);

  lines.forEach((l) => {
    ctx.fillText(l.trim(), cx, startY);
    startY += lineHeight;
  });

  ctx.restore();
}

export const Route = createFileRoute("/air-draw")({
  head: () => ({ meta: [{ title: "Air Draw — GrowthOS" }] }),
  component: AirDrawPage,
});

function AirDrawPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [color, setColor] = useState("#3b82f6"); // Default to blue since they clicked it
  const [activeMode, setActiveMode] = useState<"draw" | "text" | "hover">("draw");
  const [isFakeBgEnabled, setIsFakeBgEnabled] = useState(false);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [currentText, setCurrentText] = useState("");

  // Use refs to ensure the requestAnimationFrame loop always sees the latest state
  const colorRef = useRef(color);
  const activeModeRef = useRef(activeMode);
  const isFakeBgEnabledRef = useRef(isFakeBgEnabled);
  const selectedTextShapeRef = useRef<Stroke | null>(null);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);
  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);
  useEffect(() => {
    isFakeBgEnabledRef.current = isFakeBgEnabled;
  }, [isFakeBgEnabled]);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const animationRef = useRef<number>(0);
  const isPinchingRef = useRef(false);
  const lastDrawPosRef = useRef<{ x: number; y: number } | null>(null);

  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokePointsRef = useRef<Point[]>([]);
  const draggedShapeRef = useRef<DraggedShape | null>(null);
  const initialPinchDistRef = useRef<number | null>(null);
  const initialShapeSizeRef = useRef<number | null>(null);
  const initialHandsAngleRef = useRef<number | null>(null);
  const initialShapeRotationRef = useRef<number | null>(null);

  const connectionModeRef = useRef(false);
  const selectedShapesForConnectionRef = useRef<Stroke[]>([]);
  const currentHoverPosRef = useRef<Point | null>(null);
  const sPinchingRef = useRef(false);
  const previousHoveredBtnRef = useRef<HTMLElement | null>(null);

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    let stream: MediaStream | null = null;
    let isMounted = true;

    async function init() {
      try {
        setIsLoading(true);
        // 1. Initialize MediaPipe
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });

        if (!isMounted) {
          landmarker.close();
          return;
        }
        handLandmarkerRef.current = landmarker;

        // 2. Request Camera
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
        });

        if (!isMounted) {
          // Prevent camera leak if component unmounts while waiting for permissions
          userStream.getTracks().forEach((track) => track.stop());
          return;
        }

        stream = userStream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setErrorMsg(err.message || "Failed to initialize camera or AI model.");
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, [hasStarted]);

  const redrawCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Taskbar Background
    ctx.fillStyle = "rgba(20, 20, 20, 0.6)";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(200, 10, 800, 80, 20);
      ctx.fill();
    } else {
      ctx.fillRect(200, 10, 800, 80);
    }

    // Draw Taskbar Icons
    TASKBAR_ICONS.forEach((icon) => {
      ctx.beginPath();
      ctx.arc(icon.x, icon.y, icon.size * 0.8, 0, Math.PI * 2);
      if (icon.type === "line" && connectionModeRef.current) {
        ctx.fillStyle = "rgba(34, 197, 94, 0.3)";
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      }
      ctx.fill();

      ctx.strokeStyle =
        icon.type === "line" && connectionModeRef.current ? "#22c55e" : "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const cx = icon.x;
      const cy = icon.y;
      const r = icon.size / 2;
      if (icon.type === "circle") {
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      } else if (icon.type === "triangle") {
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy + r);
        ctx.lineTo(cx - r, cy + r);
        ctx.closePath();
      } else if (icon.type === "rectangle") {
        ctx.rect(cx - r, cy - r * 0.6, icon.size, icon.size * 0.6);
      } else if (icon.type === "square") {
        ctx.rect(cx - r, cy - r, icon.size, icon.size);
      } else if (icon.type === "line") {
        ctx.moveTo(cx - r, cy + r);
        ctx.lineTo(cx + r, cy - r);
      }
      ctx.stroke();
    });

    strokesRef.current.forEach((stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const rot = stroke.rotation || 0;

      if (stroke.type === "raw") {
        if (stroke.points.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.type === "line") {
        ctx.save();
        const cx = (stroke.start.x + stroke.end.x) / 2;
        const cy = (stroke.start.y + stroke.end.y) / 2;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(stroke.start.x - cx, stroke.start.y - cy);
        ctx.lineTo(stroke.end.x - cx, stroke.end.y - cy);
        ctx.stroke();
        ctx.restore();
      } else if (stroke.type === "circle") {
        ctx.save();
        const cx = stroke.center.x;
        const cy = stroke.center.y;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.arc(0, 0, stroke.radius, 0, 2 * Math.PI);
        if (stroke.text || stroke === selectedTextShapeRef.current) {
          ctx.fillStyle = "white";
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
        if (stroke.text) {
          drawTextInShape(ctx, stroke.text, cx, cy, stroke.radius * 1.5, stroke.radius * 1.5);
        }
      } else if (stroke.type === "rectangle") {
        ctx.save();
        const cx = stroke.x + stroke.width / 2;
        const cy = stroke.y + stroke.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.rect(-stroke.width / 2, -stroke.height / 2, stroke.width, stroke.height);
        if (stroke.text || stroke === selectedTextShapeRef.current) {
          ctx.fillStyle = "white";
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
        if (stroke.text) {
          drawTextInShape(ctx, stroke.text, cx, cy, stroke.width * 0.9, stroke.height * 0.9);
        }
      } else if (stroke.type === "triangle") {
        ctx.save();
        const cx = (stroke.p1.x + stroke.p2.x + stroke.p3.x) / 3;
        const cy = (stroke.p1.y + stroke.p2.y + stroke.p3.y) / 3;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(stroke.p1.x - cx, stroke.p1.y - cy);
        ctx.lineTo(stroke.p2.x - cx, stroke.p2.y - cy);
        ctx.lineTo(stroke.p3.x - cx, stroke.p3.y - cy);
        ctx.closePath();
        if (stroke.text || stroke === selectedTextShapeRef.current) {
          ctx.fillStyle = "white";
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
        if (stroke.text) {
          drawTextInShape(ctx, stroke.text, cx, cy, 80, 80);
        }
      } else if (stroke.type === "square") {
        ctx.save();
        const cx = stroke.x + stroke.width / 2;
        const cy = stroke.y + stroke.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.rect(-stroke.width / 2, -stroke.height / 2, stroke.width, stroke.height);
        if (stroke.text || stroke === selectedTextShapeRef.current) {
          ctx.fillStyle = "white";
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
        if (stroke.text) {
          drawTextInShape(ctx, stroke.text, cx, cy, stroke.width * 0.9, stroke.height * 0.9);
        }
      } else if (stroke.type === "connection") {
        if (stroke.path.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(stroke.path[0].x, stroke.path[0].y);
        for (let i = 1; i < stroke.path.length; i++) {
          ctx.lineTo(stroke.path[i].x, stroke.path[i].y);
        }
        ctx.stroke();
      }
    });

    selectedShapesForConnectionRef.current.forEach((stroke) => {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = stroke.thickness + 10;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const rot = stroke.rotation || 0;
      if (stroke.type === "raw") {
        if (stroke.points.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.type === "line") {
        ctx.save();
        const cx = (stroke.start.x + stroke.end.x) / 2;
        const cy = (stroke.start.y + stroke.end.y) / 2;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(stroke.start.x - cx, stroke.start.y - cy);
        ctx.lineTo(stroke.end.x - cx, stroke.end.y - cy);
        ctx.stroke();
        ctx.restore();
      } else if (stroke.type === "circle") {
        ctx.save();
        const cx = stroke.center.x;
        const cy = stroke.center.y;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.arc(0, 0, stroke.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
      } else if (stroke.type === "rectangle") {
        ctx.save();
        const cx = stroke.x + stroke.width / 2;
        const cy = stroke.y + stroke.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.rect(-stroke.width / 2, -stroke.height / 2, stroke.width, stroke.height);
        ctx.stroke();
        ctx.restore();
      } else if (stroke.type === "triangle") {
        ctx.save();
        const cx = (stroke.p1.x + stroke.p2.x + stroke.p3.x) / 3;
        const cy = (stroke.p1.y + stroke.p2.y + stroke.p3.y) / 3;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(stroke.p1.x - cx, stroke.p1.y - cy);
        ctx.lineTo(stroke.p2.x - cx, stroke.p2.y - cy);
        ctx.lineTo(stroke.p3.x - cx, stroke.p3.y - cy);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    });

    const dragged = draggedShapeRef.current;
    if (dragged) {
      ctx.save();
      const cx = dragged.x;
      const cy = dragged.y;
      ctx.translate(cx, cy);
      ctx.rotate(dragged.rotation);

      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const r = dragged.size / 2;
      if (dragged.type === "circle") {
        ctx.arc(0, 0, r, 0, Math.PI * 2);
      } else if (dragged.type === "triangle") {
        ctx.moveTo(0, (-r * 4) / 3);
        ctx.lineTo(r, (r * 2) / 3);
        ctx.lineTo(-r, (r * 2) / 3);
        ctx.closePath();
      } else if (dragged.type === "rectangle") {
        ctx.rect(-r, -r * 0.6, dragged.size, dragged.size * 0.6);
      } else if (dragged.type === "square") {
        ctx.rect(-r, -r, dragged.size, dragged.size);
      } else if (dragged.type === "line") {
        ctx.moveTo(-r, r);
        ctx.lineTo(r, -r);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (
      connectionModeRef.current &&
      selectedShapesForConnectionRef.current.length === 1 &&
      currentHoverPosRef.current
    ) {
      const startPos = getCenter(selectedShapesForConnectionRef.current[0]);
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentHoverPosRef.current.x, currentHoverPosRef.current.y);
      ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (connectionModeRef.current) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      if (selectedShapesForConnectionRef.current.length === 0) {
        ctx.fillText("Connect Mode: Pinch the first shape", -canvas.width / 2, canvas.height - 40);
      } else {
        ctx.fillText("Connect Mode: Pinch the second shape", -canvas.width / 2, canvas.height - 40);
      }
      ctx.restore();
    }
  };

  const predictWebcam = () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !cursorCanvasRef.current ||
      !handLandmarkerRef.current
    )
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const cursorCanvas = cursorCanvasRef.current;

    // Ensure canvases match video dimensions
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      cursorCanvas.width = video.videoWidth;
      cursorCanvas.height = video.videoHeight;
      redrawCanvas(canvas);
    }

    let startTimeMs = performance.now();
    if (lastVideoTimeRef.current !== video.currentTime) {
      lastVideoTimeRef.current = video.currentTime;

      const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);

      const cursorCtx = cursorCanvas.getContext("2d");
      if (cursorCtx) {
        cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

        let pPinching = false,
          pPx = 0,
          pPy = 0;
        let sPinching = false,
          sPx = 0,
          sPy = 0;

        if (results.landmarks && results.landmarks.length > 0) {
          const processHand = (landmarks: any, wasPinching: boolean) => {
            const thumb = landmarks[4];
            const index = landmarks[8];
            const dx = thumb.x - index.x;
            const dy = thumb.y - index.y;
            const pinchDistance = Math.sqrt(dx * dx + dy * dy);
            const wrist = landmarks[0];
            const indexMcp = landmarks[5];
            const pxMcp = wrist.x - indexMcp.x;
            const pyMcp = wrist.y - indexMcp.y;
            const handSize = Math.sqrt(pxMcp * pxMcp + pyMcp * pyMcp);

            const ratio = pinchDistance / handSize;
            let isPinching = wasPinching;
            if (wasPinching && ratio > 0.45) isPinching = false;
            else if (!wasPinching && ratio < 0.25) isPinching = true;

            return {
              isPinching,
              px: index.x * cursorCanvas.width,
              py: index.y * cursorCanvas.height,
            };
          };

          const primary = processHand(results.landmarks[0], isPinchingRef.current);
          pPinching = primary.isPinching;
          pPx = primary.px;
          pPy = primary.py;

          currentHoverPosRef.current = { x: pPx, y: pPy };

          if (results.landmarks.length > 1) {
            const secondary = processHand(results.landmarks[1], sPinchingRef.current);
            sPinching = secondary.isPinching;
            sPx = secondary.px;
            sPy = secondary.py;
          }

          // Draw Cursors
          cursorCtx.beginPath();
          cursorCtx.arc(pPx, pPy, pPinching ? 12 : 8, 0, 2 * Math.PI);
          if (results.landmarks.length > 1) {
            cursorCtx.moveTo(sPx + (sPinching ? 12 : 8), sPy);
            cursorCtx.arc(sPx, sPy, sPinching ? 12 : 8, 0, 2 * Math.PI);
          }
          cursorCtx.fillStyle =
            pPinching || sPinching ? colorRef.current : "rgba(255, 255, 255, 0.8)";
          cursorCtx.fill();
          if (!pPinching) {
            cursorCtx.beginPath();
            cursorCtx.arc(pPx, pPy, 8, 0, 2 * Math.PI);
            cursorCtx.lineWidth = 2;
            cursorCtx.strokeStyle = colorRef.current;
            cursorCtx.stroke();
          }

          let hitDOMButton = false;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const containerRatio = rect.width / rect.height;
            const videoRatio = 1280 / 720;
            let renderWidth = rect.width;
            let renderHeight = rect.height;
            let offsetX = 0;
            let offsetY = 0;
            if (containerRatio > videoRatio) {
              renderWidth = rect.height * videoRatio;
              offsetX = (rect.width - renderWidth) / 2;
            } else {
              renderHeight = rect.width / videoRatio;
              offsetY = (rect.height - renderHeight) / 2;
            }
            // Add a small offset to ensure we hit the DOM properly
            const viewportX = rect.left + offsetX + renderWidth - (pPx / 1280) * renderWidth;
            const viewportY = rect.top + offsetY + (pPy / 720) * renderHeight;

            const el = document.elementFromPoint(viewportX, viewportY) as HTMLElement;
            const hoveredBtn = el?.closest("button");

            if (previousHoveredBtnRef.current && previousHoveredBtnRef.current !== hoveredBtn) {
              previousHoveredBtnRef.current.classList.remove("ring-4", "ring-white/50");
            }
            if (hoveredBtn) {
              hoveredBtn.classList.add("ring-4", "ring-white/50");
              previousHoveredBtnRef.current = hoveredBtn;
              hitDOMButton = true;

              if (pPinching && !isPinchingRef.current) {
                hoveredBtn.click();
              }
            }
          }

          if (hitDOMButton) {
            isPinchingRef.current = pPinching;
            sPinchingRef.current = sPinching;
            lastDrawPosRef.current = null;
            currentStrokePointsRef.current = [];
          } else {
            if (activeModeRef.current === "text") {
              if (pPinching && !isPinchingRef.current) {
                // Find shape
                let hitShapeIndex = -1;
                for (let i = strokesRef.current.length - 1; i >= 0; i--) {
                  const s = strokesRef.current[i];
                  if (s.type === "raw" || s.type === "connection") continue;
                  const center = getCenter(s);
                  const dist = Math.sqrt((pPx - center.x) ** 2 + (pPy - center.y) ** 2);
                  let radius = 50;
                  if (s.type === "circle") radius = s.radius!;
                  else if (s.type === "square") radius = s.width! / 2;
                  else if (s.type === "rectangle") radius = s.width! / 2;
                  else if (s.type === "triangle") radius = 60;
                  
                  if (dist < radius) {
                    hitShapeIndex = i;
                    break;
                  }
                }
                if (hitShapeIndex !== -1) {
                  const s = strokesRef.current[hitShapeIndex];
                  selectedTextShapeRef.current = s;
                  setIsTextEditing(true);
                  setCurrentText(s.text || "");
                  redrawCanvas(canvasRef.current!);
                }
              }
            } else if (activeModeRef.current === "draw") {
              if (pPinching) {
                if (!isPinchingRef.current) {
                  // Just started pinching
                  // Check if clicking a taskbar icon
                  let hitIcon = null;
                  for (const icon of TASKBAR_ICONS) {
                    const dist = Math.sqrt((pPx - icon.x) ** 2 + (pPy - icon.y) ** 2);
                    if (dist < icon.size) {
                      // a generous hit area
                      hitIcon = icon;
                      break;
                    }
                  }

                  if (hitIcon) {
                    if (hitIcon.type === "line") {
                      connectionModeRef.current = !connectionModeRef.current;
                      if (connectionModeRef.current) {
                        toast.info("Connect Mode: Pinch 2 shapes to connect");
                      } else {
                        selectedShapesForConnectionRef.current = [];
                        toast.info("Connect Mode: Off");
                      }
                      redrawCanvas(canvas);
                    } else {
                      draggedShapeRef.current = {
                        type: hitIcon.type,
                        x: pPx,
                        y: pPy,
                        size: 100,
                        rotation: 0,
                      };
                    }
                  } else {
                    if (connectionModeRef.current) {
                      const hitStroke = strokesRef.current.find((s) => isBlocked(pPx, pPy, [s]));
                      if (hitStroke) {
                        if (!selectedShapesForConnectionRef.current.includes(hitStroke)) {
                          selectedShapesForConnectionRef.current.push(hitStroke);
                          redrawCanvas(canvas);
                          if (selectedShapesForConnectionRef.current.length === 2) {
                            const s1 = selectedShapesForConnectionRef.current[0];
                            const s2 = selectedShapesForConnectionRef.current[1];
                            let path = findPath(
                              getCenter(s1),
                              getCenter(s2),
                              strokesRef.current.filter((s) => s !== s1 && s !== s2),
                              canvas.width,
                              canvas.height,
                            );
                            path = trimPath(path, s1, s2);
                            strokesRef.current.push({
                              type: "connection",
                              path,
                              color: colorRef.current,
                              thickness: 4,
                            });
                            selectedShapesForConnectionRef.current = [];
                            connectionModeRef.current = false;
                            toast.success("Shapes connected!");
                            redrawCanvas(canvas);
                          }
                        }
                      }
                    } else {
                      // Check if picking up an existing shape
                      let hitShapeIndex = -1;
                      for (let i = strokesRef.current.length - 1; i >= 0; i--) {
                        const s = strokesRef.current[i];
                        if (s.type === "raw" || s.type === "connection") continue;
                        const center = getCenter(s);
                        const dist = Math.sqrt((pPx - center.x) ** 2 + (pPy - center.y) ** 2);
                        let radius = 50;
                        if (s.type === "circle") radius = s.radius!;
                        else if (s.type === "square") radius = s.width! / 2;
                        else if (s.type === "rectangle") radius = s.width! / 2;
                        else if (s.type === "triangle") radius = 60;
                        else if (s.type === "line") {
                          radius =
                            Math.sqrt((s.start!.x - s.end!.x) ** 2 + (s.start!.y - s.end!.y) ** 2) /
                            2;
                        }

                        if (dist < radius) {
                          hitShapeIndex = i;
                          break;
                        }
                      }

                      if (hitShapeIndex !== -1) {
                        const s = strokesRef.current.splice(hitShapeIndex, 1)[0];
                        let size = 100;
                        if (s.type === "circle") size = s.radius! * 2;
                        else if (s.type === "square") size = s.width!;
                        else if (s.type === "rectangle") size = s.width!;
                        else if (s.type === "triangle" && s.p1 && s.p2) {
                          size = Math.abs(s.p2.x - s.p3!.x);
                          if (size < 20) size = 100;
                        } else if (s.type === "line" && s.start && s.end) {
                          size = Math.sqrt((s.start.x - s.end.x) ** 2 + (s.start.y - s.end.y) ** 2);
                        }

                        draggedShapeRef.current = {
                          type: s.type as any,
                          x: getCenter(s).x,
                          y: getCenter(s).y,
                          size: size,
                          rotation: s.rotation || 0,
                        };
                        redrawCanvas(canvas);
                      } else {
                        // Free drawing
                        lastDrawPosRef.current = { x: pPx, y: pPy };
                        currentStrokePointsRef.current = [{ x: pPx, y: pPy }];
                      }
                    }
                  }
                } else {
                  if (draggedShapeRef.current) {
                    // Drag shape
                    draggedShapeRef.current.x = pPx;
                    draggedShapeRef.current.y = pPy;

                    // Handle scaling with secondary hand
                    if (sPinching) {
                      const currentHandsDist = Math.sqrt((pPx - sPx) ** 2 + (pPy - sPy) ** 2);
                      const currentAngle = Math.atan2(sPy - pPy, sPx - pPx);
                      if (
                        initialPinchDistRef.current === null ||
                        initialShapeSizeRef.current === null
                      ) {
                        initialPinchDistRef.current = currentHandsDist;
                        initialShapeSizeRef.current = draggedShapeRef.current.size;
                        initialHandsAngleRef.current = currentAngle;
                        initialShapeRotationRef.current = draggedShapeRef.current.rotation;
                      } else {
                        const ratio = currentHandsDist / Math.max(initialPinchDistRef.current, 1);
                        draggedShapeRef.current.size = Math.max(
                          20,
                          initialShapeSizeRef.current * ratio,
                        );
                        if (
                          initialHandsAngleRef.current !== null &&
                          initialShapeRotationRef.current !== null
                        ) {
                          const deltaAngle = currentAngle - initialHandsAngleRef.current;
                          draggedShapeRef.current.rotation =
                            initialShapeRotationRef.current + deltaAngle;
                        }
                      }
                    } else {
                      initialPinchDistRef.current = null;
                      initialShapeSizeRef.current = null;
                      initialHandsAngleRef.current = null;
                      initialShapeRotationRef.current = null;
                    }
                    redrawCanvas(canvas); // Need to redraw to show moving shape
                  } else if (lastDrawPosRef.current) {
                    // Continue drawing
                    currentStrokePointsRef.current.push({ x: pPx, y: pPy });
                    const drawCtx = canvas.getContext("2d");
                    if (drawCtx) {
                      drawCtx.beginPath();
                      drawCtx.moveTo(lastDrawPosRef.current.x, lastDrawPosRef.current.y);
                      drawCtx.lineTo(pPx, pPy);
                      drawCtx.strokeStyle = colorRef.current;
                      drawCtx.lineWidth = 6;
                      drawCtx.lineCap = "round";
                      drawCtx.lineJoin = "round";
                      drawCtx.stroke();
                    }
                    lastDrawPosRef.current = { x: pPx, y: pPy };
                  }
                }
              } else {
                if (isPinchingRef.current) {
                  // Just stopped pinching.
                  if (draggedShapeRef.current) {
                    const dragged = draggedShapeRef.current;
                    const r = dragged.size / 2;
                    const cx = dragged.x;
                    const cy = dragged.y;
                    let newStroke: Stroke | null = null;
                    if (dragged.type === "circle") {
                      newStroke = {
                        type: "circle",
                        center: { x: cx, y: cy },
                        radius: r,
                        color: colorRef.current,
                        thickness: 6,
                        rotation: dragged.rotation,
                      };
                    } else if (dragged.type === "triangle") {
                      newStroke = {
                        type: "triangle",
                        p1: { x: cx, y: cy - (r * 4) / 3 },
                        p2: { x: cx + r, y: cy + (r * 2) / 3 },
                        p3: { x: cx - r, y: cy + (r * 2) / 3 },
                        color: colorRef.current,
                        thickness: 6,
                        rotation: dragged.rotation,
                      };
                    } else if (dragged.type === "rectangle") {
                      newStroke = {
                        type: "rectangle",
                        x: cx - r,
                        y: cy - r * 0.6,
                        width: dragged.size,
                        height: dragged.size * 0.6,
                        color: colorRef.current,
                        thickness: 6,
                        rotation: dragged.rotation,
                      };
                    } else if (dragged.type === "square") {
                      newStroke = {
                        type: "rectangle",
                        x: cx - r,
                        y: cy - r,
                        width: dragged.size,
                        height: dragged.size,
                        color: colorRef.current,
                        thickness: 6,
                        rotation: dragged.rotation,
                      };
                    } else if (dragged.type === "line") {
                      newStroke = {
                        type: "line",
                        start: { x: cx - r, y: cy + r },
                        end: { x: cx + r, y: cy - r },
                        color: colorRef.current,
                        thickness: 6,
                        rotation: dragged.rotation,
                      };
                    }
                    if (newStroke) strokesRef.current.push(newStroke);
                    draggedShapeRef.current = null;
                    initialPinchDistRef.current = null;
                    initialShapeSizeRef.current = null;
                    initialHandsAngleRef.current = null;
                    initialShapeRotationRef.current = null;
                    redrawCanvas(canvas);
                  } else {
                    const points = currentStrokePointsRef.current;
                    if (points.length > 2) {
                      const shape = detectShape(points, colorRef.current);
                      strokesRef.current.push(shape);
                      if (shape.type !== "raw") {
                        toast.success(`Snapped to ${shape.type}`);
                      }
                      redrawCanvas(canvas);
                    }
                  }
                  currentStrokePointsRef.current = [];
                }
                lastDrawPosRef.current = null;
              }
            }
          }
          isPinchingRef.current = pPinching;
        } else {
          // Hand lost
          if (isPinchingRef.current && activeModeRef.current === "draw") {
            if (draggedShapeRef.current) {
              // Place it where it was
              const dragged = draggedShapeRef.current;
              const r = dragged.size / 2;
              const cx = dragged.x;
              const cy = dragged.y;
              let newStroke: Stroke | null = null;
              if (dragged.type === "circle") {
                newStroke = {
                  type: "circle",
                  center: { x: cx, y: cy },
                  radius: r,
                  color: colorRef.current,
                  thickness: 6,
                  rotation: dragged.rotation,
                };
              } else if (dragged.type === "triangle") {
                newStroke = {
                  type: "triangle",
                  p1: { x: cx, y: cy - r },
                  p2: { x: cx + r, y: cy + r },
                  p3: { x: cx - r, y: cy + r },
                  color: colorRef.current,
                  thickness: 6,
                  rotation: dragged.rotation,
                };
              } else if (dragged.type === "rectangle") {
                newStroke = {
                  type: "rectangle",
                  x: cx - r,
                  y: cy - r * 0.6,
                  width: dragged.size,
                  height: dragged.size * 0.6,
                  color: colorRef.current,
                  thickness: 6,
                  rotation: dragged.rotation,
                };
              } else if (dragged.type === "square") {
                newStroke = {
                  type: "rectangle",
                  x: cx - r,
                  y: cy - r,
                  width: dragged.size,
                  height: dragged.size,
                  color: colorRef.current,
                  thickness: 6,
                  rotation: dragged.rotation,
                };
              } else if (dragged.type === "line") {
                newStroke = {
                  type: "line",
                  start: { x: cx - r, y: cy + r },
                  end: { x: cx + r, y: cy - r },
                  color: colorRef.current,
                  thickness: 6,
                  rotation: dragged.rotation,
                };
              }
              if (newStroke) strokesRef.current.push(newStroke);
              draggedShapeRef.current = null;
              initialPinchDistRef.current = null;
              initialShapeSizeRef.current = null;
              initialHandsAngleRef.current = null;
              initialShapeRotationRef.current = null;
              redrawCanvas(canvas);
            } else {
              const points = currentStrokePointsRef.current;
              if (points.length > 2) {
                const shape = detectShape(points, colorRef.current);
                strokesRef.current.push(shape);
                if (shape.type !== "raw") {
                  toast.success(`Snapped to ${shape.type}`);
                }
                redrawCanvas(canvas);
              }
            }
            currentStrokePointsRef.current = [];
          }
          isPinchingRef.current = false;
          sPinchingRef.current = false;
          lastDrawPosRef.current = null;
        }
      }
    }

    animationRef.current = requestAnimationFrame(predictWebcam);
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    selectedShapesForConnectionRef.current = [];
    connectionModeRef.current = false;
    if (canvasRef.current) {
      redrawCanvas(canvasRef.current);
    }
  };

  const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#eab308", "#a855f7", "#f97316", "#ffffff"];

  if (hasStarted) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col w-screen h-screen overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]">
            <Loader2 size={40} className="animate-spin text-[#22c55e] mb-4" />
            <p className="text-[#eee] font-medium">Loading AI Vision Models...</p>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 max-w-md text-center">
              {errorMsg}
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="relative overflow-hidden bg-[#0a0a0a] w-full h-full flex-grow">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width="1280"
            height="720"
            className={`absolute top-0 left-0 w-full h-full object-contain scale-x-[-1] ${isFakeBgEnabled ? "opacity-0" : "opacity-100"}`}
          />
          <canvas
            ref={canvasRef}
            width="1280"
            height="720"
            className="absolute top-0 left-0 w-full h-full object-contain scale-x-[-1] z-10 pointer-events-none"
          />
          <canvas
            ref={cursorCanvasRef}
            width="1280"
            height="720"
            className="absolute top-0 left-0 w-full h-full object-contain scale-x-[-1] z-20 pointer-events-none"
          />

          {/* AI Status Badge */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 z-30">
            <Sparkles size={14} className="text-[#22c55e]" />
            <span className="text-xs font-medium tracking-wide text-white uppercase">
              AI Active
            </span>
          </div>

          {/* Text Editing Modal Overlay */}
          {isTextEditing && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center min-w-[300px]">
                <h3 className="text-black font-bold mb-4">Enter Text</h3>
                <textarea
                  autoFocus
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-black mb-4 focus:ring-2 focus:ring-green-500 outline-none"
                  rows={4}
                  placeholder="Type inside shape..."
                />
                <div className="flex gap-4">
                  <Btn
                    variant="solid"
                    tone="green"
                    onClick={() => {
                      if (selectedTextShapeRef.current) {
                        selectedTextShapeRef.current.text = currentText;
                      }
                      setIsTextEditing(false);
                      selectedTextShapeRef.current = null;
                      if (canvasRef.current) redrawCanvas(canvasRef.current);
                    }}
                  >
                    Save
                  </Btn>
                  <Btn
                    variant="outline"
                    tone="neutral"
                    onClick={() => {
                      setIsTextEditing(false);
                      selectedTextShapeRef.current = null;
                      if (canvasRef.current) redrawCanvas(canvasRef.current);
                    }}
                  >
                    Cancel
                  </Btn>
                </div>
              </div>
            </div>
          )}

          {/* Floating Controls Panel */}
          <div className="absolute right-4 top-4 bottom-4 w-48 bg-black/60 backdrop-blur-lg rounded-2xl border border-white/10 p-4 flex flex-col gap-6 overflow-y-auto z-30 shadow-2xl">
            <div className="flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-wider text-white/50 font-semibold">
                Colors
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setActiveMode("draw");
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform mx-auto ${color === c && activeMode === "draw" ? "scale-125 border-white" : "border-transparent hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="h-px w-full bg-white/10" />

            <div className="flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-wider text-white/50 font-semibold">
                Tools
              </h3>
              <Btn
                variant={activeMode === "draw" ? "solid" : "outline"}
                tone={activeMode === "draw" ? "green" : "neutral"}
                onClick={() => setActiveMode("draw")}
                className="w-full justify-start"
              >
                <PenTool size={16} className="mr-2" /> Draw
              </Btn>
              <Btn
                variant={activeMode === "text" ? "solid" : "outline"}
                tone={activeMode === "text" ? "green" : "neutral"}
                onClick={() => setActiveMode("text")}
                className="w-full justify-start"
              >
                <Type size={16} className="mr-2" /> Text
              </Btn>
              <Btn
                variant={activeMode === "hover" ? "solid" : "outline"}
                tone={activeMode === "hover" ? "green" : "neutral"}
                onClick={() => setActiveMode("hover")}
                className="w-full justify-start"
              >
                <Eraser size={16} className="mr-2" /> Hover
              </Btn>

              <div className="h-px w-full bg-white/10 my-1" />

              <Btn
                variant={isFakeBgEnabled ? "solid" : "outline"}
                tone={isFakeBgEnabled ? "green" : "neutral"}
                onClick={() => setIsFakeBgEnabled(!isFakeBgEnabled)}
                className="w-full justify-start"
              >
                <UserSquare2 size={16} className="mr-2" /> Fake BG
              </Btn>
              <Btn variant="outline" onClick={clearCanvas} className="w-full justify-start">
                <RefreshCw size={16} className="mr-2" /> Clear
              </Btn>

              <div className="h-px w-full bg-white/10 my-1" />

              <Btn
                variant="outline"
                onClick={() => setHasStarted(false)}
                className="w-full justify-start"
              >
                <Maximize size={16} className="mr-2" /> Exit Air Draw
              </Btn>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          kicker="Experimental"
          title="Air Draw Canvas"
          subtitle="Pinch your index finger and thumb together in mid-air to draw! Ensure your camera is enabled."
        />

        <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-6 w-full space-y-4 items-center justify-center rounded-2xl border border-[#1a1a1a]">
          <Sparkles size={40} className="text-[#22c55e] mb-6" />
          <h2 className="text-2xl font-semibold text-white mb-2">Ready to Draw?</h2>
          <p className="text-[#888] text-center max-w-md mb-8 leading-relaxed">
            Air Draw requires access to your webcam to track your hand movements using AI. No video
            data ever leaves your device.
          </p>
          <Btn
            variant="solid"
            tone="green"
            onClick={() => setHasStarted(true)}
            className="px-8 py-4 text-lg"
          >
            Start Camera
          </Btn>
        </div>
      </div>
    </PageShell>
  );
}
