import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { useUsers } from "@/hooks/use-users";
import { useMarkAttendance } from "@/hooks/use-attendance";
import { CameraFrame } from "@/components/CameraFrame";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, User, Fingerprint, LogIn, LogOut, XCircle, Smile } from "lucide-react";

export default function Home() {
  const [initializing, setInitializing] = useState(true);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [detectedUser, setDetectedUser] = useState<{ id: number; name: string } | null>(null);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<"idle" | "success" | "processing">("idle");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: users } = useUsers();
  const markAttendance = useMarkAttendance();
  const { toast } = useToast();
  const processingRef = useRef(false);

  // 1. Load Models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setInitializing(false);
      } catch (error) {
        console.error("Failed to load models:", error);
        toast({
          title: "System Error",
          description: "Could not load biometric models. Please check /models directory.",
          variant: "destructive",
        });
      }
    };
    loadModels();
  }, [toast]);

  // 2. Detection Loop
  useEffect(() => {
    if (initializing || !videoRef || !users) return;

    let animationFrameId: number;

    const startDetection = async () => {
      // Create FaceMatcher
      const labeledDescriptors = users
        .filter(u => Array.isArray(u.faceDescriptor))
        .map(user => {
          const descriptor = new Float32Array(user.faceDescriptor as number[]);
          return new faceapi.LabeledFaceDescriptors(String(user.id), [descriptor]);
        });
      
      const faceMatcher = labeledDescriptors.length > 0 
        ? new faceapi.FaceMatcher(labeledDescriptors, 0.6) 
        : null;

      const detect = async () => {
        if (!videoRef.paused && !videoRef.ended && attendanceMode === 'idle' && videoRef.videoWidth > 0) {
          // Detect face with expressions
          const detections = await faceapi
            .detectAllFaces(videoRef)
            .withFaceLandmarks()
            .withFaceExpressions()
            .withFaceDescriptors();

          // Clear previous drawings
          if (canvasRef.current) {
            const dims = faceapi.matchDimensions(canvasRef.current, videoRef, true);
            const resizedDetections = faceapi.resizeResults(detections, dims);

            // Draw detections for visual feedback (optional, maybe distracting)
            // faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            
            if (resizedDetections.length > 0) {
              const detection = resizedDetections[0];
              if (!detection.detection || !detection.detection.box) return;
              
              const expressions = detection.expressions;
              
              // Liveness Check: Smile
              const isSmiling = expressions.happy > 0.7;
              
              // Identify User
              if (faceMatcher) {
                const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                
                if (bestMatch.label !== "unknown") {
                  const userId = parseInt(bestMatch.label);
                  const user = users.find(u => u.id === userId);
                  
                  if (user && (!detectedUser || detectedUser.id !== userId)) {
                    setDetectedUser({ id: user.id, name: user.name });
                    setLivenessPassed(false); // Reset liveness on new user
                  }
                  
                  // If we have a user and they smile, mark liveness passed
                  if (user && isSmiling) {
                    setLivenessPassed(true);
                  }
                } else {
                  setDetectedUser(null);
                  setLivenessPassed(false);
                }
              }
            } else {
               // No face detected
               setDetectedUser(null);
               setLivenessPassed(false);
            }
          }
        }
        animationFrameId = requestAnimationFrame(detect);
      };

      detect();
    };

    startDetection();

    return () => cancelAnimationFrame(animationFrameId);
  }, [initializing, videoRef, users, detectedUser, attendanceMode]);


  const handlePunch = async (type: "in" | "out") => {
    if (!detectedUser || !livenessPassed || processingRef.current) return;
    
    processingRef.current = true;
    setAttendanceMode("processing");

    try {
      await markAttendance.mutateAsync({
        userId: detectedUser.id,
        type,
        livenessScore: 0.99 // Simulated for now since we passed smile check
      });
      
      setAttendanceMode("success");
      
      toast({
        title: type === 'in' ? "Welcome back!" : "Goodbye!",
        description: `Successfully punched ${type} for ${detectedUser.name}`,
      });

      // Reset after delay
      setTimeout(() => {
        setAttendanceMode("idle");
        setDetectedUser(null);
        setLivenessPassed(false);
        processingRef.current = false;
      }, 3000);

    } catch (err) {
      setAttendanceMode("idle");
      processingRef.current = false;
      toast({
        title: "Error",
        description: "Failed to record attendance. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (initializing) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            BioGate
          </h1>
          <p className="text-muted-foreground font-mono mt-2">SECURE ATTENDANCE SYSTEM</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-500">SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8 flex-1 max-w-7xl mx-auto w-full items-center">
        
        {/* Camera Section */}
        <div className="relative aspect-video lg:aspect-square max-h-[600px] w-full mx-auto">
          <CameraFrame 
            onVideoReady={setVideoRef}
            className="w-full h-full border-2 border-primary/20"
            overlay={
              <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full pointer-events-none" 
              />
            }
          />
          
          {/* Status Overlay */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-40">
            {detectedUser ? (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-primary/30"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-primary/80 uppercase font-bold tracking-wider">Identified</p>
                  <p className="text-lg font-bold text-white font-display">{detectedUser.name}</p>
                </div>
              </motion.div>
            ) : (
               <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
              >
                <p className="text-sm text-white/60 font-mono">SCANNING FOR FACES...</p>
              </motion.div>
            )}

            {livenessPassed ? (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/30 font-bold flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                LIVENESS CONFIRMED
              </motion.div>
            ) : detectedUser ? (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full border border-yellow-500/30 font-bold flex items-center gap-2"
              >
                <Smile size={16} />
                PLEASE SMILE
              </motion.div>
            ) : null}
          </div>
        </div>

        {/* Interaction Panel */}
        <div className="flex flex-col gap-6 justify-center h-full">
          <AnimatePresence mode="wait">
            {attendanceMode === "success" ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-green-500/10 border border-green-500/30 rounded-3xl p-8 text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 text-green-500 mx-auto flex items-center justify-center">
                  <Fingerprint size={40} />
                </div>
                <h2 className="text-3xl font-display font-bold text-green-400">Attendance Recorded</h2>
                <p className="text-green-200/60">Your punch has been successfully logged in the system.</p>
              </motion.div>
            ) : detectedUser && livenessPassed ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-display font-bold text-white">
                    Hello, <span className="text-primary">{detectedUser.name.split(' ')[0]}</span>
                  </h2>
                  <p className="text-muted-foreground text-lg">Please select an action below to proceed.</p>
                </div>

                <div className="grid gap-4">
                  <button
                    onClick={() => handlePunch("in")}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-blue-600 p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
                  >
                    <div className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/10" />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Punch In</h3>
                        <p className="text-blue-100/80">Start your work shift</p>
                      </div>
                      <LogIn className="h-10 w-10 text-white opacity-80" />
                    </div>
                  </button>

                  <button
                    onClick={() => handlePunch("out")}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20"
                  >
                    <div className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/10" />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white">Punch Out</h3>
                        <p className="text-orange-100/80">End your work shift</p>
                      </div>
                      <LogOut className="h-10 w-10 text-white opacity-80" />
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-3xl p-10 text-center space-y-6"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 mx-auto flex items-center justify-center animate-pulse">
                  <User size={40} className="text-white/20" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold text-white">Waiting for User</h2>
                  <p className="text-muted-foreground">
                    Please stand in front of the camera and smile to verify liveness.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
