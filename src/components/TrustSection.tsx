import { motion } from "framer-motion";

interface TrustCardProps {
  number: string;
  title: string;
  description: string;
  delay?: number;
}

function TrustCard({ number, title, description, delay = 0 }: TrustCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="bg-background border-[0.5px] border-border/40 p-8 md:p-10 flex flex-col h-full"
    >
      <div className="flex flex-col flex-grow">
        <span className="text-[10px] tracking-[0.3em] text-primary/60 uppercase mb-3 font-sans">
          {number}
        </span>
        <h3 className="font-serif text-lg tracking-[0.15em] uppercase font-light mb-4 text-foreground">
          {title}
        </h3>
        <p className="font-sans text-xs font-light leading-relaxed text-muted-foreground/80 max-w-[280px]">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default function TrustSection() {
  const pillars = [
    {
      number: "01",
      title: "Authentic & Secure",
      description: "Every original work is hand-signed and accompanied by a Certificate of Authenticity. Your acquisition is protected by industry-leading encryption.",
    },
    {
      number: "02",
      title: "Archival-Grade Handling",
      description: "We use acid-free materials and custom-engineered, double-walled crates to ensure your artwork remains in pristine condition during its journey.",
    },
    {
      number: "03",
      title: "Fully Insured Transit",
      description: "Worldwide tracked shipping with specialized art couriers. Every shipment is fully insured from the studio to your door.",
    }
  ];

  return (
    <section className="mt-20 md:mt-32 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-4">The Studio-to-Sanctuary Promise</p>
          <h2 className="font-serif text-2xl md:text-3xl font-light italic text-foreground/90">Handled with museum-grade precision</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {pillars.map((pillar, idx) => (
            <TrustCard
              key={pillar.number}
              number={pillar.number}
              title={pillar.title}
              description={pillar.description}
              delay={idx * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
