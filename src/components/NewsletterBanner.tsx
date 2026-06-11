import NewsletterForm from './NewsletterForm';

export default function NewsletterBanner() {
  return (
    <div className="w-full bg-zinc-50 py-1.5 px-6 md:px-12 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-10 z-[60]">
      <p className="hidden md:block text-[9px] tracking-[0.25em] uppercase text-muted-foreground whitespace-nowrap">
        Join the studio newsletter for updates and new works
      </p>
      <div className="w-full max-w-xs md:max-w-md">
        <NewsletterForm variant="banner" />
      </div>
    </div>
  );
}
