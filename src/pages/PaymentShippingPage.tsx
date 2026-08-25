import { useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Truck, ShieldCheck, Package } from "lucide-react";
import PaymentLogos from "../components/PaymentLogos";

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
    transition: { staggerChildren: 0.12 },
  },
};

export default function PaymentShippingPage() {
  useEffect(() => {
    document.title = "Payment & Shipping — Surnoor Sembhi";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <main className="min-h-screen bg-background pt-12 md:pt-16 pb-24 px-6 md:px-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="max-w-4xl mx-auto space-y-16"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="space-y-4">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-sans">
            Studio Information
          </p>
          <h1 className="font-serif text-3xl md:text-5xl tracking-[0.05em] uppercase font-light text-foreground">
            Payment & Shipping
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-light leading-relaxed max-w-2xl">
            We are committed to clear, ethical, and reliable service for every order. Below you will find detailed information regarding our payment processing, shipping timelines, packaging standards, and delivery terms.
          </p>
        </motion.div>

        {/* Policy Grid */}
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Payment Policy */}
          <motion.div
            variants={fadeUp}
            className="p-8 border border-border/40 rounded-sm bg-card/30 space-y-4"
          >
            <div className="flex items-center gap-3 text-foreground">
              <CreditCard className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-serif text-xl tracking-[0.1em] uppercase font-light">
                Payment Methods & Security
              </h2>
            </div>
            <ul className="space-y-3 text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
              <li>
                We accept all major credit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and Crypto securely processed through Stripe.
              </li>
              <li>
                All transactions are protected by industry-standard SSL encryption, and your payment details are never stored on our servers.
              </li>
              <li>
                Prices are listed in CAD, and applicable taxes or duties are clearly displayed before you finalize your checkout.
              </li>
            </ul>
            <div className="pt-2">
              <PaymentLogos />
            </div>
          </motion.div>

          {/* Processing & Packaging */}
          <motion.div
            variants={fadeUp}
            className="p-8 border border-border/40 rounded-sm bg-card/30 space-y-4"
          >
            <div className="flex items-center gap-3 text-foreground">
              <Package className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-serif text-xl tracking-[0.1em] uppercase font-light">
                Packaging & Handling
              </h2>
            </div>
            <ul className="space-y-3 text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
              <li>
                Every artwork and print is personally inspected, signed, and hand-packaged with care.
              </li>
              <li>
                We prioritize eco-friendly, recyclable, and acid-free protective materials to minimize environmental impact.
              </li>
              <li>
                Standard orders are processed and dispatched from our studio in British Columbia within 3 to 5 business days.
              </li>
            </ul>
          </motion.div>

          {/* Delivery & Shipping */}
          <motion.div
            variants={fadeUp}
            className="p-8 border border-border/40 rounded-sm bg-card/30 space-y-4"
          >
            <div className="flex items-center gap-3 text-foreground">
              <Truck className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-serif text-xl tracking-[0.1em] uppercase font-light">
                Shipping & Delivery
              </h2>
            </div>
            <ul className="space-y-3 text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
              <li>
                We ship worldwide using trusted carriers like Canada Post and FedEx. All purchases over $100 CAD qualify for free global delivery.
              </li>
              <li>
                For orders under $100 CAD, we offer a $15 CAD flat rate for North America and $35 CAD flat rate for the rest of the world.
              </li>
              <li>
                Domestic delivery within North America typically takes 3 to 7 business days, while international shipping requires 7 to 14 business days.
              </li>
              <li>
                A shipping confirmation email containing your tracking number is sent as soon as your package is dispatched.
              </li>
            </ul>
          </motion.div>

          {/* Ethics & Returns */}
          <motion.div
            variants={fadeUp}
            className="p-8 border border-border/40 rounded-sm bg-card/30 space-y-4"
          >
            <div className="flex items-center gap-3 text-foreground">
              <ShieldCheck className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              <h2 className="font-serif text-xl tracking-[0.1em] uppercase font-light">
                Ethics & Guarantee
              </h2>
            </div>
            <ul className="space-y-3 text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
              <li>
                We operate with full pricing transparency and ensure no hidden fees are added during your purchase.
              </li>
              <li>
                If your item arrives damaged or lost in transit, please notify us within 7 days so we can arrange a replacement or full refund.
              </li>
              <li>
                We respect your privacy and will never sell or misuse your contact details.
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Contact Note */}
        <motion.div variants={fadeUp} className="pt-8 border-t border-border/40 text-center space-y-2">
          <p className="text-xs text-muted-foreground font-light">
            Have questions about your order or custom shipping requirements?
          </p>
          <a
            href="/contact"
            className="inline-block text-[10px] tracking-[0.2em] uppercase text-foreground hover:text-muted-foreground transition-colors border-b border-foreground/50 pb-0.5"
          >
            Contact the Studio
          </a>
        </motion.div>
      </motion.div>
    </main>
  );
}
