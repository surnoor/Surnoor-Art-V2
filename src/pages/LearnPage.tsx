import { useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function LearnPage() {
  useEffect(() => {
    document.title = "Learn — Surnoor Sembhi";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center pt-8 sm:pt-10 pb-16 px-6 selection:bg-black selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl flex flex-col items-center"
      >
        {/* Banner reduced by ~20% (max-w-3xl / max-w-[760px]) and 2:1 ratio */}
        <Link
          href="/wetonwet"
          className="w-full aspect-[2/1] block overflow-hidden shadow-sm hover:opacity-95 transition-opacity duration-200"
        >
          <img
            src="/web/wet-on-wet-blue.png"
            alt="WET / ON / WET"
            className="w-full h-full object-cover object-center block"
          />
        </Link>

        {/* Learn more button placed cleanly below */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/wetonwet"
            className="h-7 px-5 text-[9px] tracking-[0.18em] uppercase border border-black text-black hover:bg-black hover:text-white transition-colors flex items-center justify-center font-normal"
          >
            Learn more
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
