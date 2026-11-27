import { useEffect, useState } from "react";

export default function SwissGridOverlay() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("grid") === "1";
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable) {
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] print:hidden"
      aria-hidden="true"
    >
      <div className="swiss-container h-full">
        <div className="swiss-grid h-full">
          {Array.from({ length: 12 }).map((_, i) => {
            let visibilityClass = "";
            if (i >= 4 && i < 6) visibilityClass = "hidden sm:block";
            else if (i >= 6 && i < 8) visibilityClass = "hidden md:block";
            else if (i >= 8) visibilityClass = "hidden lg:block";

            return (
              <div
                key={i}
                className={`h-full bg-[#FF0133]/[0.05] border-x border-[#FF0133]/20 relative ${visibilityClass}`}
              >
                <span className="absolute top-2 left-1.5 font-mono text-[9px] text-[#FF0133]/60">
                  {i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active breakpoint indicator */}
      <div className="fixed bottom-4 left-4 bg-black/85 text-white px-3 py-1.5 font-mono text-[10px] tracking-wider uppercase flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF0133]" />
        <span className="sm:hidden">4 Cols · Mobile</span>
        <span className="hidden sm:inline md:hidden">6 Cols · sm</span>
        <span className="hidden md:inline lg:hidden">8 Cols · md</span>
        <span className="hidden lg:inline">12 Cols · lg+</span>
        <span className="text-white/50">· Shift+G</span>
      </div>
    </div>
  );
}
