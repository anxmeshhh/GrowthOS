import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export type HandGestureState = {
  isPinching: boolean;
  pointerX: number; // 0 to 1 normalized
  pointerY: number; // 0 to 1 normalized
  isActive: boolean;
};

export function useHandTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gestureState, setGestureState] = useState<HandGestureState>({
    isPinching: false,
    pointerX: 0.5,
    pointerY: 0.5,
    isActive: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let active = true;

    async function initModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (active) {
          landmarkerRef.current = landmarker;
        }
      } catch (err) {
        console.error("Failed to initialize HandLandmarker", err);
        if (active) setError("Failed to load gesture model");
      }
    }

    initModel();

    return () => {
      active = false;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
    };
  }, []);

  const detectHand = useCallback(() => {
    if (!videoRef.current || !landmarkerRef.current) return;
    const video = videoRef.current;

    if (video.readyState >= 2) {
      const startTimeMs = performance.now();
      if (lastVideoTimeRef.current !== video.currentTime) {
        lastVideoTimeRef.current = video.currentTime;
        const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

        if (results.landmarks && results.landmarks.length > 0) {
          const hand = results.landmarks[0];
          // Index finger tip is 8, Thumb tip is 4
          const indexTip = hand[8];
          const thumbTip = hand[4];

          // Calculate distance to determine pinch
          const dx = indexTip.x - thumbTip.x;
          const dy = indexTip.y - thumbTip.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // We mirror X because webcam is mirrored
          const pointerX = 1 - indexTip.x;
          const pointerY = indexTip.y;
          
          const isPinching = distance < 0.05; // Pinch threshold

          setGestureState({
            isPinching,
            pointerX,
            pointerY,
            isActive: true,
          });
        } else {
          setGestureState((prev) => (prev.isActive ? { ...prev, isActive: false } : prev));
        }
      }
    }

    requestRef.current = requestAnimationFrame(detectHand);
  }, []);

  const startTracking = useCallback(async () => {
    if (!landmarkerRef.current) {
      setError("Model is not ready yet");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;

      if (!videoRef.current) {
        videoRef.current = document.createElement("video");
        videoRef.current.playsInline = true;
      }
      
      const video = videoRef.current;
      video.srcObject = stream;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });

      setIsTracking(true);
      setIsLoading(false);
      
      // Start the detection loop
      requestRef.current = requestAnimationFrame(detectHand);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Failed to access camera");
      setIsLoading(false);
    }
  }, [detectHand]);

  const stopTracking = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTracking(false);
    setGestureState({ isPinching: false, pointerX: 0.5, pointerY: 0.5, isActive: false });
  }, []);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    isTracking,
    isLoading,
    error,
    gestureState,
    startTracking,
    stopTracking,
    videoRef, // You can attach this to a visible video element if you want Picture-in-Picture
  };
}
