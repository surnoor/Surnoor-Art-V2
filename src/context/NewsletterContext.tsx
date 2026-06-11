import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NewsletterContextType {
  isSubscribed: boolean;
  subscribe: () => void;
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

export function NewsletterProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const subscribe = () => {
    setIsSubscribed(true);
  };

  return (
    <NewsletterContext.Provider value={{ isSubscribed, subscribe }}>
      {children}
    </NewsletterContext.Provider>
  );
}

export function useNewsletter() {
  const context = useContext(NewsletterContext);
  if (context === undefined) {
    throw new Error('useNewsletter must be used within a NewsletterProvider');
  }
  return context;
}
