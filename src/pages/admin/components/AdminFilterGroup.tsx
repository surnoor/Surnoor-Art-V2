import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function AdminFilterGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: readonly string[] | string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-[9px] tracking-[0.2em] uppercase font-bold text-zinc-400 hover:text-zinc-700 transition-colors mb-2.5"
      >
        {label}
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`text-left text-[12px] px-2.5 py-1.5 rounded-md transition-colors ${
                selected === opt
                  ? "bg-zinc-900 text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
