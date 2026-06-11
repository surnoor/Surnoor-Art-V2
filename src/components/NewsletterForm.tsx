import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNewsletter } from '../context/NewsletterContext';

interface NewsletterFormProps {
  variant?: 'banner' | 'footer';
}

export default function NewsletterForm({ variant = 'banner' }: NewsletterFormProps) {
  const { isSubscribed, subscribe } = useNewsletter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(isSubscribed ? 'success' : 'idle');
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keep local status in sync with global subscription status
  useEffect(() => {
    if (isSubscribed) {
      setStatus('success');
    }
  }, [isSubscribed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        subscribe(); // Update global state
        setEmail('');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (status === 'success' || isSubscribed) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-xs tracking-[0.15em] uppercase font-serif ${variant === 'banner' ? 'text-primary' : 'text-primary'}`}
      >
        Your email has been added to the newsletter!
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex items-center ${variant === 'banner' ? 'max-w-md mx-auto' : 'w-full max-w-sm'}`}>
      <input
        type="email"
        placeholder={variant === 'banner' && isMobile ? "STUDIO UPDATES & NEW WORKS" : "EMAIL ADDRESS"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'loading'}
        className={`bg-transparent border-b border-border text-[10px] tracking-widest px-0 ${variant === 'banner' ? 'py-1' : 'py-2'} focus:outline-none focus:border-primary transition-colors flex-grow ${variant === 'banner' ? 'placeholder:text-muted-foreground/50' : 'placeholder:text-muted-foreground/30'}`}
        required
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className={`ml-6 text-[10px] tracking-[0.2em] uppercase font-medium hover:text-primary transition-colors disabled:opacity-50`}
      >
        {status === 'loading' ? '...' : 'Join'}
      </button>
      {status === 'error' && (
        <p className="absolute mt-10 text-[9px] tracking-widest text-destructive uppercase">
          {message}
        </p>
      )}
    </form>
  );
}
