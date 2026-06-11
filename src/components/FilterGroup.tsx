import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FilterGroup({
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
    <div className=" pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`text-left text-sm px-2 py-1.5 rounded transition-colors ${
                selected === opt
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
