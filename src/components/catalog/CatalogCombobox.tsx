import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CatalogComboboxProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: { name: string; dosage_unit?: string | null }[];
  placeholder?: string;
  className?: string;
}

export function CatalogCombobox({
  value,
  onChange,
  suggestions,
  placeholder = "Digite para buscar...",
  className,
}: CatalogComboboxProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState(suggestions);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setFiltered(suggestions);
    } else {
      setFiltered(
        suggestions.filter((s) =>
          s.name.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/60 bg-white/60 backdrop-blur-sm px-4 py-2 text-sm text-[#1C1917] placeholder:text-[#9e837a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5859A]/10 focus-visible:border-[#E5859A]/30 transition-all",
          className
        )}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full max-h-48 overflow-y-auto rounded-2xl border border-white/60 bg-white/90 backdrop-blur-md shadow-xl">
          {filtered.map((item, i) => (
            <button
              key={`${item.name}-${i}`}
              type="button"
              onClick={() => {
                onChange(item.name);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-[#1C1917] hover:bg-[#E5859A]/10 transition-colors flex items-center justify-between"
            >
              <span>{item.name}</span>
              {item.dosage_unit && (
                <span className="text-xs text-gray-400 ml-2">{item.dosage_unit}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
