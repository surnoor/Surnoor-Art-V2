import { useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { useArchive } from "../hooks/useArchive";

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: easing },
  },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18 },
  },
};

export default function SupportPage() {
  const { archive, loading } = useArchive();
  // Find the exact artwork checked off in Airtable
  const printOfTheMonth = archive.find(p => p.artSupplyPrint);

  useEffect(() => {
    document.title = "Art Supplies Fund — Surnoor Sembhi";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <main className="min-h-screen bg-background  pt-16 md:pt-24 pb-24 px-6 md:px-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20"
      >
        {/* Text Area */}
        <motion.div variants={fadeUp} className="space-y-6 flex flex-col justify-start text-center lg:text-left lg:col-start-1 lg:row-start-1 order-1">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Support the Studio
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-light leading-tight">
            Art Supplies Fund
          </h1>
          <p className="text-muted-foreground leading-relaxed text-base">
            This donation will go towards buying art supplies and any donations above $25 will receive an 8x10 inch artist proofed print in the mail. 
            Below is the print of this month!
          </p>
        </motion.div>

        {/* Ko-fi Iframe */}
        <motion.div variants={fadeUp} className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-none lg:col-start-2 lg:row-start-1 lg:row-span-2 order-2">
          <div className="bg-card border border-border p-2 rounded-sm shadow-sm">
            <iframe
              id="kofiframe"
              src="https://ko-fi.com/surnoorsingh/?hidefeed=true&widget=true&embed=true&preview=true"
              style={{ border: "none", width: "100%", padding: "4px", background: "transparent" }}
              height="712"
              title="Support Surnoor on Ko-fi"
              className="rounded-sm"
            ></iframe>
          </div>
        </motion.div>

        {/* This Month's Artwork */}
        <motion.div variants={fadeUp} className="space-y-4 lg:col-start-1 lg:row-start-2 order-3">
          <div className=" pt-10">
            <h2 className="font-serif text-2xl font-light mb-6 text-center lg:text-left">This Month's Artwork</h2>
            {loading ? (
              <div className="aspect-[4/3] bg-muted animate-pulse rounded-sm"></div>
            ) : printOfTheMonth && printOfTheMonth.image ? (
              <div className="space-y-3">
                <img 
                  src={printOfTheMonth.image} 
                  alt={printOfTheMonth.name}
                  className="w-full h-auto object-cover rounded-sm shadow-sm"
                />
                <p className="text-sm text-muted-foreground text-center lg:text-left italic">
                  {printOfTheMonth.name} {printOfTheMonth.medium ? `— ${printOfTheMonth.medium}` : ""}
                </p>
              </div>
            ) : (
              <div className="aspect-[4/3] bg-muted rounded-sm flex items-center justify-center text-muted-foreground text-sm">
                Artwork coming soon
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
