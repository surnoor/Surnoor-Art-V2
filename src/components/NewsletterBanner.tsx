import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NewsletterForm from './NewsletterForm';

export default function NewsletterBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-zinc-50 py-1 px-6 md:px-12 flex items-center justify-center min-h-[34px] overflow-hidden z-[60]">
      <AnimatePresence mode="wait">
        {index === 0 && (
          <motion.div
            key="newsletter"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-10 w-full max-w-4xl"
          >
            <p className="hidden md:block text-[9px] tracking-[0.25em] uppercase text-muted-foreground whitespace-nowrap">
              Join the studio newsletter for updates and new works
            </p>
            <div className="w-full max-w-xs md:max-w-md">
              <NewsletterForm variant="banner" />
            </div>
          </motion.div>
        )}
        
        {index === 1 && (
          <motion.div
            key="delivery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center w-full"
          >
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground whitespace-nowrap text-center">
              Free Worldwide Delivery over $100 CAD
            </p>
          </motion.div>
        )}

        {index === 2 && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center w-full"
          >
            <p className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground whitespace-nowrap text-center hidden md:block">
              Accepting Apple Pay, Google Pay, Visa, Mastercard, Amex, and Crypto
            </p>
            <p className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground whitespace-nowrap text-center md:hidden">
              Apple Pay • Google Pay • Visa • MC • Amex • Crypto
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
