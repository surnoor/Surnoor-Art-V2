import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { NotionRenderer } from "react-notion-x";
import "react-notion-x/src/styles.css";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

const PAGE_ID = "416274d7b6d9800aa902e368c698fde2";

export default function WetOnWetPage() {
  const [recordMap, setRecordMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "WET / ON / WET — Surnoor Sembhi";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add timestamp to bust browser cache
      const res = await fetch(`/api/notion?pageId=${PAGE_ID}&t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load page: ${res.statusText}`);
      }
      const data = await res.json();
      setRecordMap(data);
    } catch (err: any) {
      console.error("Notion loading error:", err);
      setError(err?.message || "Failed to load course details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      {/* Sub-navigation bar without border line */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <Link
          href="/learn"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Learn
        </Link>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <Loader2 className="w-7 h-7 text-black animate-spin" />
            <p className="text-xs tracking-widest uppercase text-muted-foreground">Loading syllabus & curriculum...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-8 rounded-xl border border-border bg-muted/20">
            <p className="text-destructive text-sm">{error}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-black text-black hover:bg-black hover:text-white text-xs uppercase tracking-widest transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && recordMap && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="notion-container-light"
          >
            <NotionRenderer
              recordMap={recordMap}
              fullPage={false}
              darkMode={false}
              showTableOfContents={false}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}
