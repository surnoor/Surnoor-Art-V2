import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

export default function TawkToWidget() {
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  useEffect(() => {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    window.Tawk_API.onLoad = function () {
      setIsWidgetLoaded(true);
      window.Tawk_API.hideWidget();
    };

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/6a8cf3664c5edd344f72706d/default';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }

    return () => {
      // Cleanup script on unmount
      if (s1 && s1.parentNode) {
        s1.parentNode.removeChild(s1);
      }
    };
  }, []);

  const handleCustomButtonClick = () => {
    if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
      window.Tawk_API.maximize();
    }
  };

  return (
    <>
      {/* Custom Profile Picture Floating Button */}
      <div 
        className="fixed bottom-6 right-6 z-50 cursor-pointer hover:scale-105 transition-transform"
        onClick={handleCustomButtonClick}
      >
        <div className="relative">
          <img 
            src="/profile.jpg" 
            alt="Profile" 
            className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-white"
          />
          {/* Green Status Dot indicating Online Availability */}
          <span className="absolute bottom-0 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
      </div>
    </>
  );
}
