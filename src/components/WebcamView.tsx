import { useRef, useEffect, useState, useCallback } from "react";
import { Video, VideoOff, AlertTriangle, Eye, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as faceapi from "face-api.js";

interface VisualMetrics {
  eyeContact: boolean;
  dominantExpression: string;
  faceDetected: boolean;
}

interface WebcamViewProps {
  onPersonCountWarning?: (warning: boolean) => void;
  onVisualUpdate?: (metrics: VisualMetrics) => void;
  onFacePosition?: (pos: { x: number; y: number } | null) => void;
}

const WebcamView = ({ onPersonCountWarning, onVisualUpdate, onFacePosition }: WebcamViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [warning, setWarning] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<VisualMetrics>({
    eyeContact: false,
    dominantExpression: "neutral",
    faceDetected: false,
  });

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/weights";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        console.log("Face-api models loaded");
      } catch (err) {
        console.error("Failed to load face-api models:", err);
        toast.error("Failed to load face-tracking models");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const detectVisuals = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !modelsLoaded || video.readyState < 2) return;

    try {
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!detections || detections.length === 0) {
        if (warning !== "No person detected! Please stay in frame.") {
          setWarning("No person detected! Please stay in frame.");
          onPersonCountWarning?.(true);
        }
        const metrics = { eyeContact: false, dominantExpression: "none", faceDetected: false };
        setCurrentMetrics(metrics);
        onVisualUpdate?.(metrics);
        return;
      }

      // 1. Multi-person check
      if (detections.length > 1) {
        if (warning !== "Multiple persons detected! Please stay alone.") {
          setWarning("Multiple persons detected! Please stay alone.");
          onPersonCountWarning?.(true);
        }
      }

      // 2. Process primary face (first detection) for metrics
      const mainFace = detections[0];
      const resizedDetections = faceapi.resizeResults(mainFace, displaySize);
      
      // Draw minimal face mesh for all detected faces (to show we see them)
      if (ctx) {
        const resizedAll = faceapi.resizeResults(detections, displaySize);
        ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
        ctx.lineWidth = 1;
        faceapi.draw.drawFaceLandmarks(canvas, resizedAll);
      }

      const landmarks = mainFace.landmarks;
      const nose = landmarks.getNose();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      
      const eyeCenter = (leftEye[0].x + rightEye[3].x) / 2;
      const nosePos = nose[0].x;
      const eyeContact = Math.abs(eyeCenter - nosePos) < 15;

      // Draw specific eye highlights for the main face
      if (ctx) {
        const eyeLandmarks = [...resizedDetections.landmarks.getLeftEye(), ...resizedDetections.landmarks.getRightEye()];
        ctx.fillStyle = eyeContact ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";
        eyeLandmarks.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      const expressions = mainFace.expressions;
      const dominantExpression = (Object.entries(expressions) as [string, number][])
        .reduce((a, b) => (a[1] > b[1] ? a : b))[0];

      const metrics = {
        eyeContact,
        dominantExpression,
        faceDetected: true,
      };

      setCurrentMetrics(metrics);
      onVisualUpdate?.(metrics);

      // 4. Calculate face center for gaze tracking
      const box = mainFace.detection.box;
      const faceCenterX = (box.x + box.width / 2) / video.videoWidth;
      const faceCenterY = (box.y + box.height / 2) / video.videoHeight;
      onFacePosition?.({ x: faceCenterX, y: faceCenterY });

      // 3. Warning priority logic
      let newWarning = "";
      if (detections.length > 1) {
        newWarning = "Multiple persons detected! Please stay alone.";
      } else if (!eyeContact) {
        newWarning = "Look directly at the camera!";
      }

      if (newWarning !== warning) {
        setWarning(newWarning);
        onPersonCountWarning?.(!!newWarning);
      }
    } catch (err) {
      console.error("Detection error:", err);
      onFacePosition?.(null);
    }
  }, [modelsLoaded, warning, onPersonCountWarning, onVisualUpdate, onFacePosition]);

  useEffect(() => {
    if (enabled && modelsLoaded) {
      intervalRef.current = window.setInterval(detectVisuals, 100); // Faster updates for visual markers
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setWarning("");
      onPersonCountWarning?.(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, modelsLoaded, detectVisuals]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setEnabled(true);
    } catch {
      toast.error("Camera access denied");
      setEnabled(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const toggle = () => {
    if (enabled) {
      stopCamera();
      setEnabled(false);
    } else {
      startCamera();
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card aspect-video group">
      {enabled ? (
        <div className="relative w-full h-full shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ transform: "scaleX(-1)" }}
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <VideoOff className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Visual Metrics Indicators (Floating) */}
      {enabled && modelsLoaded && currentMetrics.faceDetected && (
        <div className="absolute bottom-12 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1.5 backdrop-blur-md ${currentMetrics.eyeContact ? 'bg-success/60 text-success-foreground' : 'bg-destructive/60 text-destructive-foreground'}`}>
            <Eye className="h-3 w-3" />
            {currentMetrics.eyeContact ? "Good Eye Contact" : "Look at Camera"}
          </div>
          <div className="px-2 py-1 rounded-md bg-primary/60 backdrop-blur-md text-primary-foreground text-[10px] font-medium flex items-center gap-1.5">
            <Smile className="h-3 w-3" />
            {currentMetrics.dominantExpression}
          </div>
        </div>
      )}

      {warning && (
        <div className="absolute top-2 left-2 right-2 bg-destructive/90 text-destructive-foreground text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse shadow-lg z-10">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {warning}
        </div>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="absolute bottom-2 right-2 h-8 w-8 bg-background/60 backdrop-blur-sm hover:bg-background/80"
      >
        {enabled ? <Video className="h-4 w-4 text-primary" /> : <VideoOff className="h-4 w-4 text-muted-foreground" />}
      </Button>
    </div>
  );
};

export default WebcamView;
