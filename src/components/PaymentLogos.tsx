import React from "react";

interface PaymentLogosProps {
  className?: string;
}

export default function PaymentLogos({ className = "" }: PaymentLogosProps) {
  return (
    <div className={`flex items-center gap-3 opacity-60 grayscale transition-all hover:grayscale-0 hover:opacity-100 ${className}`}>
      <img src="/assets/images/applepay.svg" alt="Apple Pay" className="h-7 w-auto object-contain" />
      <img src="/assets/images/gpay.svg" alt="Google Pay" className="h-7 w-auto object-contain" />
      <img src="/assets/images/visa.svg" alt="Visa" className="h-8 w-auto object-contain" />
      <img src="/assets/images/mastercard.svg" alt="Mastercard" className="h-[22px] w-auto object-contain" />
      <img src="/assets/images/amex.svg" alt="American Express" className="h-[22px] w-auto object-contain" />
      <img src="/assets/images/crypto.svg" alt="Bitcoin" className="h-5 w-auto object-contain" />
    </div>
  );
}
