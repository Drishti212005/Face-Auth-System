import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Initializing Neural Networks..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center gap-6">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative w-24 h-24"
      >
        <div className="absolute inset-0 rounded-full border-t-4 border-primary border-r-4 border-r-transparent animate-spin" />
        <Loader2 className="w-full h-full text-primary/20 p-4" />
      </motion.div>
      
      <h2 className="text-xl md:text-2xl font-display font-bold text-foreground tracking-widest uppercase">
        {message}
      </h2>
      
      <div className="w-64 h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
