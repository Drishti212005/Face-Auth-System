import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { useCreateUser } from "@/hooks/use-users";
import { CameraFrame } from "@/components/CameraFrame";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { User, Loader2, Camera, Check, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Register() {
  const [name, setName] = useState("");
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [initializing, setInitializing] = useState(true);

  const createUser = useCreateUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      try {
        await Promise.all([
           faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
           faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
           faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setInitializing(false);
      } catch (err) {
        console.error(err);
      }
    };
    loadModels();
  }, []);

  const handleCapture = async () => {
    if (!videoRef || !name || videoRef.videoWidth === 0) return;
    
    setIsCapturing(true);
    try {
      // Single detection with high confidence threshold
      const detection = await faceapi
        .detectSingleFace(videoRef)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setDescriptor(detection.descriptor);
        toast({
          title: "Face Captured",
          description: "Face biometric data extracted successfully.",
        });
      } else {
        toast({
          title: "Detection Failed",
          description: "Could not detect a clear face. Please look at the camera and try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
         title: "Error",
         description: "Failed to process face data.",
         variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !descriptor) return;

    try {
      await createUser.mutateAsync({
        name,
        faceDescriptor: Array.from(descriptor),
      });
      
      toast({
        title: "Registration Complete",
        description: `${name} has been added to the system.`,
      });
      
      setLocation("/");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24">
       <header className="flex flex-col items-center mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          New User Registration
        </h1>
        <p className="text-muted-foreground mt-2 max-w-lg">
          Add a new employee to the biometric database. Ensure good lighting for best accuracy.
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-start">
        {/* Left: Form */}
        <div className="bg-card rounded-3xl p-8 border border-white/5 shadow-xl space-y-8">
           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-2">
               <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
               <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                 <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-background border border-border rounded-xl px-12 py-4 text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    required
                 />
               </div>
             </div>

             <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Face Data</label>
                <div className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-colors ${descriptor ? 'border-green-500/50 bg-green-500/10' : 'border-border bg-background/50'}`}>
                  {descriptor ? (
                    <>
                      <Check className="text-green-500" />
                      <span className="text-green-500 font-medium">Biometric Data Ready</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-muted-foreground" />
                      <span className="text-muted-foreground">No face captured yet</span>
                    </>
                  )}
                </div>
             </div>

             <button
               type="submit"
               disabled={!name || !descriptor || createUser.isPending}
               className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
             >
               {createUser.isPending ? (
                 <span className="flex items-center justify-center gap-2">
                   <Loader2 className="animate-spin" /> Saving...
                 </span>
               ) : "Complete Registration"}
             </button>
           </form>

           <div className="text-xs text-muted-foreground bg-secondary/50 p-4 rounded-lg">
             <p className="font-bold mb-1">PRIVACY NOTICE</p>
             <p>Face data is converted to a mathematical representation (hash) and stored locally. The original image is never saved.</p>
           </div>
        </div>

        {/* Right: Camera */}
        <div className="space-y-6">
          <CameraFrame 
            onVideoReady={setVideoRef}
            className={`w-full aspect-square border-2 ${descriptor ? 'border-green-500' : 'border-border'}`}
          />
          
          <button
            onClick={handleCapture}
            disabled={!name || initializing || isCapturing}
            className="w-full group relative overflow-hidden rounded-xl bg-secondary hover:bg-secondary/80 border border-white/10 p-6 transition-all"
          >
             <div className="flex items-center justify-center gap-3">
               {isCapturing ? (
                 <Loader2 className="animate-spin text-primary" size={24} />
               ) : (
                 <Camera className="text-primary group-hover:scale-110 transition-transform" size={24} />
               )}
               <span className="text-lg font-bold text-foreground">
                 {isCapturing ? "Scanning..." : "Capture Face"}
               </span>
             </div>
          </button>
        </div>
      </div>
    </div>
  );
}
