import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Mail, Instagram, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: easing },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

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

export default function ContactPage() {
  const [view, setView] = useState<"contact" | "form" | "success">("contact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    interestType: "",
    availability: "",
  });

  useEffect(() => {
    document.title = "Contact — Surnoor Sembhi";
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
      const res = await fetch('/api/showcase-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          location: form.location,
          interestType: form.interestType,
          availability: form.availability,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
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

        {/* ── Main contact list ── */}
        {view === "contact" && (
          <motion.div
            key="contact"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageVariants}
          >
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="max-w-4xl mr-auto ml-0 w-full"
            >
              <motion.div
                variants={stagger}
                className="divide-y divide-border/40"
              >
                {/* Item 1: Schedule Studio Showcase */}
                <motion.div variants={fadeUp} className="py-8 md:py-10">
                  <button
                    onClick={() => setView("form")}
                    className="group flex flex-row items-center justify-between gap-6 w-full text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="space-y-3 max-w-2xl">
                      <h2 className="font-serif text-xl md:text-2xl tracking-[0.15em] uppercase font-light text-foreground">
                        Schedule a Studio Showcase
                      </h2>
                      <div className="flex gap-4 items-start pl-4 border-l border-border/40">
                        <p className="font-sans text-xs md:text-sm font-light leading-relaxed text-muted-foreground/80">
                          Meet me on Zoom for a 30-min private video tour or a
                          studio visit if you are in the area.
                        </p>
                      </div>
                    </div>
                    <div className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                      <ArrowUpRight className="w-5 h-5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </button>
                </motion.div>

                {/* Item 2: Email */}
                <motion.div variants={fadeUp} className="py-8 md:py-10">
                  <a
                    href="mailto:surnoorsingh@gmail.com"
                    className="group flex flex-row items-center justify-between gap-6 hover:opacity-80 transition-opacity"
                  >
                    <div className="space-y-1">
                      <span className="block text-[10px] tracking-[0.3em] text-muted-foreground uppercase font-sans">
                        Email
                      </span>
                      <h2 className="font-serif text-xl md:text-2xl tracking-[0.15em] uppercase font-light text-foreground break-all">
                        surnoorsingh@gmail.com
                      </h2>
                    </div>
                    <div className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                      <Mail className="w-5 h-5 transform group-hover:scale-105 transition-transform" />
                    </div>
                  </a>
                </motion.div>

                {/* Item 3: Instagram */}
                <motion.div variants={fadeUp} className="py-8 md:py-10">
                  <a
                    href="https://instagram.com/surnoorsembhi"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-row items-center justify-between gap-6 hover:opacity-80 transition-opacity"
                  >
                    <div className="space-y-1">
                      <span className="block text-[10px] tracking-[0.3em] text-muted-foreground uppercase font-sans">
                        Instagram
                      </span>
                      <h2 className="font-serif text-xl md:text-2xl tracking-[0.15em] uppercase font-light text-foreground break-all">
                        @surnoorsembhi
                      </h2>
                    </div>
                    <div className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                      <Instagram className="w-5 h-5 transform group-hover:scale-105 transition-transform" />
                    </div>
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* ── Inquiry form ── */}
        {view === "form" && (
          <motion.div
            key="form"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={pageVariants}
            className="max-w-2xl mr-auto ml-0 w-full"
          >
            <button
              onClick={() => setView("contact")}
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-10"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>

            <div className="mb-10 space-y-2">
              <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
                Studio Showcase
              </p>
              <h1 className="font-serif text-2xl md:text-3xl tracking-[0.15em] uppercase font-light">
                Tell me about yourself
              </h1>
              <p className="text-xs text-muted-foreground/70 font-light leading-relaxed pt-1">
                I'll reach out within 48 hours to arrange a time that works for both of us.
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

        {/* ── Success state ── */}
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
              onClick={() => { setView("contact"); setForm({ name: "", email: "", location: "", interestType: "", availability: "" }); }}
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors mt-6"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Contact
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}
