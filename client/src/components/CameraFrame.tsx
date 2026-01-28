import { useRef, useEffect } from "react";
import Webcam from "react-webcam";
import { motion } from "framer-motion";

interface CameraFrameProps {
  onVideoReady?: (video: HTMLVideoElement) => void;
  className?: string;
  overlay?: React.ReactNode;
}

export function CameraFrame({ onVideoReady, className, overlay }: CameraFrameProps) {
  const webcamRef = useRef<Webcam>(null);

  const handleUserMedia = () => {
    if (webcamRef.current?.video && onVideoReady) {
      onVideoReady(webcamRef.current.video);
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-black border border-white/10 shadow-2xl ${className}`}>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: "user"
        }}
        onUserMedia={handleUserMedia}
        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
      />
      
      {/* Decorative Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Corners */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-primary/50 rounded-tr-xl" />
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-primary/50 rounded-bl-xl" />
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />
        
        {/* Scan line */}
        <div className="scan-line opacity-50" />
      </div>

      {overlay && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-8">
          {overlay}
        </div>
      )}
    </div>
  );
}
