import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

const pageVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easing } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.3, ease: easing } },
};

const INTEREST_OPTIONS = [
  "A specific piece from the Archive",
  "A custom commission",
  "Just exploring — I'd love to see the studio",
];

export default function ShowcasePage() {
  const [view, setView] = useState<"form" | "success">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    interestType: "",
    availability: "",
  });

  useEffect(() => {
    document.title = "Studio Showcase — Surnoor Sembhi";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/showcase-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          location: form.location,
          interestType: form.interestType,
          availability: form.availability,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setView("success");
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-6 md:pt-8 pb-24 px-6 md:px-12">
      <AnimatePresence mode="wait">

        {/* ── Form ── */}
        {view === "form" && (
          <motion.div
            key="form"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageVariants}
            className="max-w-2xl mr-auto ml-0 w-full"
          >
            <div className="mb-10 space-y-2">
              <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
                Studio Showcase
              </p>
              <h1 className="font-serif text-2xl md:text-3xl tracking-[0.15em] uppercase font-light">
                Tell me about yourself
              </h1>
              <p className="text-xs text-muted-foreground/70 font-light leading-relaxed pt-1">
                I'll reach out within 48 hours to arrange a private video tour or studio visit.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Q1: Name */}
              <div className="space-y-2">
                <label className="block text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  01 — Your name
                </label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="w-full bg-transparent border-0 border-b border-border/60 py-2 text-sm font-light text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              {/* Q2: Email */}
              <div className="space-y-2">
                <label className="block text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  02 — Your email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-transparent border-0 border-b border-border/60 py-2 text-sm font-light text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              {/* Q3: Location */}
              <div className="space-y-2">
                <label className="block text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  03 — Where are you based?
                </label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="w-full bg-transparent border-0 border-b border-border/60 py-2 text-sm font-light text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              {/* Q4: Interest type */}
              <div className="space-y-4">
                <label className="block text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  04 — What are you interested in?
                </label>
                <div className="space-y-2">
                  {INTEREST_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-3 py-3 border-b border-border/20 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="interestType"
                        value={opt}
                        checked={form.interestType === opt}
                        onChange={() =>
                          setForm((prev) => ({ ...prev, interestType: opt }))
                        }
                        className="accent-foreground w-3 h-3"
                      />
                      <span className="text-sm font-light text-muted-foreground group-hover:text-foreground transition-colors">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q5: Availability */}
              <div className="space-y-2">
                <label className="block text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  05 — When are you generally available?
                </label>
                <p className="text-[10px] text-muted-foreground/60 font-light">
                  e.g. "Weekday afternoons PST", "Weekends", "Mornings after 9am"
                </p>
                <textarea
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  placeholder="Days and times that work best for you..."
                  rows={3}
                  className="w-full bg-transparent border-0 border-b border-border/60 py-2 text-sm font-light text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase font-medium text-foreground hover:text-muted-foreground transition-colors disabled:opacity-50 mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
                {isSubmitting ? "Sending..." : "Send Inquiry"}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Success ── */}
        {view === "success" && (
          <motion.div
            key="success"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageVariants}
            className="max-w-2xl mr-auto ml-0 w-full pt-12 space-y-6"
          >
            <CheckCircle className="w-8 h-8 text-foreground" strokeWidth={1} />
            <div className="space-y-3">
              <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
                Received
              </p>
              <h1 className="font-serif text-2xl md:text-3xl tracking-[0.15em] uppercase font-light">
                Thank you, {form.name.split(" ")[0]}.
              </h1>
              <p className="text-sm font-light text-muted-foreground/80 leading-relaxed max-w-md">
                I'll be in touch within 48 hours to arrange your Studio Showcase.
                Looking forward to it.
              </p>
            </div>
            <button
              onClick={() => {
                setView("form");
                setForm({ name: "", email: "", location: "", interestType: "", availability: "" });
              }}
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors mt-6"
            >
              <ArrowLeft className="w-3 h-3" />
              Submit another
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}
