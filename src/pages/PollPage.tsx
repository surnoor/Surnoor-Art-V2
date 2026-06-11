import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemAnim: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

export default function PollPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q6Selections, setQ6Selections] = useState<string[]>([]);

  const handleQ6Change = (val: string) => {
    setQ6Selections(prev => {
      if (prev.includes(val)) return prev.filter(item => item !== val);
      if (prev.length < 3) return [...prev, val];
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      q1: formData.get('q1'),
      q2: formData.getAll('q2'),
      q3: formData.get('q3'),
      q4: formData.get('q4'),
      q5: formData.get('q5'),
      q6: q6Selections,
      q7: formData.get('q7'),
      q8: formData.get('q8'),
    };

    try {
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(errJson.error || 'Failed to submit survey');
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-6 md:px-12 py-16 md:py-28 bg-background">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="max-w-3xl w-full"
      >
        {!submitted ? (
          <>
            <motion.div variants={itemAnim} className="mb-14 space-y-6">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                Artistic Sentiment Survey
              </p>
              <h1 className="font-serif text-3xl md:text-5xl font-light leading-snug">
                Intentionality Statement
              </h1>
              
              <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed font-light">
                <p>
                  Taking a little temperature check for this account. This has been an incredible space to host and connect with everyone. My artistic goals are evolving and I just want to do a quick check in with everyone who views the things I publish and interacts with this space. I need to find out how many people are engaged with the artistic sentiment we've been developing here and in what capacities.
                </p>
                <p>
                  I think any artwork needs the viewer's gaze to arrive at an ultimate completion. Because it completes the cycle it becomes sort of a dialogue—something alive, something more than the sum of its parts. The artist can only do half the work by making it.
                </p>
                <p>
                  It was important for me to be aware that making the artwork is only half the work, while the other half is always for the viewer to complete, which ultimately finishes the artwork.
                </p>
                <p>
                  Therefore, knowing the viewer has developed most of my work. Sometimes it was in regards to the artist community and spaces I existed in (the plein air community, the figurative art community in Vancouver, my time at Charles's gallery, transit sketches, and other artistic colleagues in Vancouver).
                </p>
                <p>
                  My intention with this space is to keep that certain artistic sentiment and grow it—but it takes a bit of effort, and knowing how many of you are aligned with that sentiment will help plan this space's future. So if you've enjoyed engaging with it, please help me get a sense of your engagement by filling out this short survey.
                </p>
                <p className="text-foreground">
                  Your honest answers will help me understand how to keep growing this space in a way that's true to the work. <br/><br/>
                  <span className="italic text-primary">Everyone who fills this out gets added to my close friends list for behind-the-scenes access.</span>
                </p>
              </div>
            </motion.div>

            <motion.form variants={itemAnim} onSubmit={handleSubmit} className="space-y-12">
              
              {/* SECTION 1 */}
              <div className="space-y-6 pt-8 border-t border-border">
                <div className="mb-6">
                  <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-1">Section 1</h2>
                  <h3 className="font-serif text-xl md:text-2xl font-light">Who Are You in This Space?</h3>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm text-foreground">How did you find this account?</label>
                  <div className="space-y-2">
                    {[
                      "Someone I know shared it",
                      "Through an art community (plein air, figurative, gallery spaces, etc.)",
                      "I'm connected to Vancouver's art scene",
                      "Instagram recommended it",
                      "I was searching for art / landscape work",
                      "Other"
                    ].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 p-4 border border-border bg-card/30 rounded cursor-pointer hover:border-primary/50 transition-colors">
                        <input type="radio" name="q1" value={opt} className="accent-primary" required />
                        <span className="text-sm font-light text-muted-foreground">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2 */}
              <div className="space-y-6 pt-8 border-t border-border">
                <div className="mb-6">
                  <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-1">Section 2</h2>
                  <h3 className="font-serif text-xl md:text-2xl font-light">Your Relationship to the Work</h3>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm text-foreground">What resonates with you about this practice? <span className="text-muted-foreground text-xs">(Select all that apply)</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "The finished paintings themselves",
                      "The process and how the work is made",
                      "The thinking behind the work / artistic philosophy",
                      "The specific landscapes (Chilliwack, Vancouver)",
                      "Being part of a thoughtful creative community",
                      "The authentic voice and perspective of the artist"
                    ].map((opt) => (
                      <label key={opt} className="flex items-start gap-3 p-4 border border-border bg-card/30 rounded cursor-pointer hover:border-primary/50 transition-colors h-full">
                        <input type="checkbox" name="q2" value={opt} className="accent-primary mt-0.5" />
                        <span className="text-sm font-light text-muted-foreground leading-snug">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm text-foreground">Do you see art as a dialogue between artist and viewer? <span className="text-muted-foreground text-xs">(Honest answer—no judgment)</span></label>
                  <div className="space-y-2">
                    {[
                      "Yes, absolutely. The viewer completes the work.",
                      "I think so, but I hadn't thought about it deeply",
                      "Not really sure",
                      "I see art more as a finished object to enjoy"
                    ].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 p-4 border border-border bg-card/30 rounded cursor-pointer hover:border-primary/50 transition-colors">
                        <input type="radio" name="q3" value={opt} className="accent-primary" required />
                        <span className="text-sm font-light text-muted-foreground">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3 */}
              <div className="space-y-6 pt-8 border-t border-border">
                <div className="mb-6">
                  <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-1">Section 3</h2>
                  <h3 className="font-serif text-xl md:text-2xl font-light">How You Engage</h3>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm text-foreground">How do you typically interact with this account?</label>
                  <div className="space-y-2">
                    {[
                      "I scroll past most posts",
                      "I like or comment sometimes",
                      "I regularly engage with posts",
                      "I save posts to revisit later",
                      "I share this work with others"
                    ].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 p-4 border border-border bg-card/30 rounded cursor-pointer hover:border-primary/50 transition-colors">
                        <input type="radio" name="q4" value={opt} className="accent-primary" required />
                        <span className="text-sm font-light text-muted-foreground">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm text-foreground">Have you purchased or considered purchasing any work?</label>
                  <div className="space-y-2">
                    {[
                      "Yes, an original painting",
                      "Yes, a print",
                      "I've thought about it",
                      "Not yet, but interested",
                      "I'm not in a position to purchase, but I value the work"
                    ].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 p-4 border border-border bg-card/30 rounded cursor-pointer hover:border-primary/50 transition-colors">
                        <input type="radio" name="q5" value={opt} className="accent-primary" required />
                        <span className="text-sm font-light text-muted-foreground">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 4 */}
              <div className="space-y-6 pt-8 border-t border-border">
                <div className="mb-6">
                  <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-1">Section 4</h2>
                  <h3 className="font-serif text-xl md:text-2xl font-light">What Matters to You About Social Media & Art</h3>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm text-foreground">What's most important to you when it comes to how artists share work online? <span className="text-primary text-xs">(Select up to 3)</span></label>
                  <div className="space-y-2">
                    {[
                      "Authenticity and genuine perspective (not algorithm-optimized)",
                      "Insight into the process and thinking",
                      "Consistent quality and vision (not chasing trends)",
                      "Active engagement and conversation with followers",
                      "Showcasing finished work (not constant content creation)",
                      "Building a real community, not just followers"
                    ].map((opt) => {
                      const isSelected = q6Selections.includes(opt);
                      const isMaxedOut = q6Selections.length >= 3;
                      const disabled = !isSelected && isMaxedOut;

                      return (
                        <label 
                          key={opt} 
                          className={`flex items-start gap-3 p-4 border rounded cursor-pointer transition-colors ${
                            disabled ? 'opacity-50 cursor-not-allowed border-border/50 bg-background' : 
                            isSelected ? 'border-primary/50 bg-primary/5' : 'border-border bg-card/30 hover:border-primary/30'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            name="q6" 
                            value={opt} 
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() => handleQ6Change(opt)}
                            className="accent-primary mt-0.5" 
                          />
                          <span className="text-sm font-light text-muted-foreground leading-snug">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 5 */}
              <div className="space-y-8 pt-8 border-t border-border">
                <div className="mb-6">
                  <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase mb-1">Section 5</h2>
                  <h3 className="font-serif text-xl md:text-2xl font-light">Open Space</h3>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm text-foreground">If there were something you'd like to see more of, what would it be?</label>
                  <textarea
                    name="q7"
                    className="w-full bg-card/30 border border-border text-sm p-4 rounded focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-y placeholder:text-muted-foreground/50 text-foreground"
                    placeholder="Be honest. Process videos? More about specific pieces? Stories from Vancouver? Or maybe less of something?"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm text-foreground">Anything else on your mind about this practice or space?</label>
                  <textarea
                    name="q8"
                    className="w-full bg-card/30 border border-border text-sm p-4 rounded focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-y placeholder:text-muted-foreground/50 text-foreground"
                    placeholder="Questions, observations, feedback—anything that feels relevant to you."
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs tracking-wide rounded">
                  {error}. Please try again later or contact me directly.
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="pt-10">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-3 bg-primary text-background text-xs tracking-[0.15em] uppercase px-6 py-5 hover:bg-foreground transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Survey'} <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
                <p className="text-center text-[10px] text-muted-foreground mt-6 uppercase tracking-wider">
                  Thank you. Everyone who fills this out gets added to my close friends list for behind-the-scenes access.
                </p>
              </div>
            </motion.form>
          </>
        ) : (
          <motion.div variants={itemAnim} className="text-center py-20 md:py-32 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-8">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">Thank You.</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-10 leading-relaxed font-light">
              Your answers help me understand who's actually here and how to grow this space with intention. You will be added to my close friends list shortly.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary hover:text-foreground transition-colors border-b border-primary/30 hover:border-foreground pb-1"
            >
              Return to Gallery <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
