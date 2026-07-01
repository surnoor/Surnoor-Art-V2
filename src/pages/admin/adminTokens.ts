// Shared admin design tokens — use these across all admin pages

export const pillColors: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  sold: "bg-zinc-100 text-zinc-600 border border-zinc-200/60",
  archive: "bg-violet-50 text-violet-700 border border-violet-200/60",
  hide: "bg-zinc-50 text-zinc-400 border border-zinc-100",
  hold: "bg-amber-50 text-amber-700 border border-amber-200/60",
  watercolor: "bg-sky-50 text-sky-700 border border-sky-200/60",
  oil: "bg-amber-50 text-amber-800 border border-amber-200/60",
  acrylic: "bg-rose-50 text-rose-700 border border-rose-200/60",
  ink: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
  digital: "bg-cyan-50 text-cyan-700 border border-cyan-200/60",
  "mixed media": "bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/60",
  graphite: "bg-zinc-100 text-zinc-700 border border-zinc-200/60",
  charcoal: "bg-zinc-200 text-zinc-800 border border-zinc-300/60",
  original: "bg-teal-50 text-teal-700 border border-teal-200/60",
  print: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
  sketch: "bg-orange-50 text-orange-700 border border-orange-200/60",
  study: "bg-lime-50 text-lime-700 border border-lime-200/60",
};

export const getPillColor = (value: string | null | undefined): string => {
  if (!value) return "bg-zinc-50 text-zinc-500 border border-zinc-200/50";
  return (
    pillColors[value.toLowerCase()] ??
    "bg-zinc-50 text-zinc-600 border border-zinc-200/50"
  );
};

/** Shared input base class */
export const inputBase =
  "w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 placeholder:text-zinc-400";

/** Shared select base class */
export const selectBase =
  "w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg outline-none transition-colors focus:border-zinc-400 cursor-pointer appearance-none";

/** Small label above form fields */
export const fieldLabel =
  "block text-[10px] font-semibold tracking-widest uppercase text-zinc-400 mb-1.5";

/** Section divider label */
export const sectionLabel =
  "text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-400 px-3 mb-2 mt-5 first:mt-0";
