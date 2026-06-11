import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";

export default function AdminLoader({ 
  isDone, 
  onComplete 
}: { 
  isDone: boolean; 
  onComplete: () => void; 
}) {
  const controls = useAnimation();
  const isDoneRef = useRef(isDone);

  useEffect(() => {
    isDoneRef.current = isDone;
  }, [isDone]);

  useEffect(() => {
    let mounted = true;

    async function runCycle() {
      while (mounted) {
        // Expand horizontally from the left
        await controls.start({ 
          scaleX: 4, 
          originX: 0,
          transition: { duration: 0.35, ease: "circOut" } 
        });
        
        if (!mounted) break;

        // Shrink horizontally to the right
        await controls.start({ 
          scaleX: 1, 
          originX: 1,
          transition: { duration: 0.35, ease: "circOut" } 
        });

        if (!mounted) break;

        // Pause briefly
        await new Promise((resolve) => setTimeout(resolve, 150));

        if (!mounted) break;

        // If data is loaded by the end of this cycle, signal to unmount
        if (isDoneRef.current) {
          onComplete();
          break;
        }
      }
    }

    runCycle();
    return () => { mounted = false; };
  }, [controls, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div
        animate={controls}
        className="w-5 h-5 bg-primary"
        style={{ originX: 0 }}
      />
    </div>
  );
}
