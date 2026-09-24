import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchableSelectProps {
  options: string[];
  onSelect: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

/**
 * A dropdown with a search box pinned above the list, so it stays usable
 * once there are dozens of options (e.g. every table in a real schema).
 * Built as a small popover rather than on top of Radix Select \u2014 typing
 * into an input nested inside Select's own content fights its built-in
 * keyboard/focus handling, so this is simpler as its own thing.
 */
export function SearchableSelect({ options, onSelect, placeholder = "Select\u2026", searchPlaceholder = "Search\u2026", className }: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // focus the search box the moment the popover opens
    requestAnimationFrame(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  function choose(value: string) {
    onSelect(value);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className={cn("brk-relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="brk-flex brk-h-8 brk-w-full brk-items-center brk-justify-between brk-gap-2 brk-rounded-md brk-border brk-border-input brk-bg-transparent brk-px-3 brk-text-xs brk-shadow-sm focus:brk-outline-none focus:brk-ring-1 focus:brk-ring-ring"
      >
        <span className="brk-truncate brk-text-muted-foreground">{placeholder}</span>
        <ChevronDown className="brk-h-3.5 brk-w-3.5 brk-shrink-0 brk-opacity-50" />
      </button>

      {open && (
        <div className="brk-absolute brk-left-0 brk-top-full brk-z-50 brk-mt-1 brk-w-56 brk-overflow-hidden brk-rounded-md brk-border brk-border-border brk-bg-card brk-text-card-foreground brk-shadow-md">
          <div className="brk-relative brk-border-b brk-border-border brk-p-1">
            <Search className="brk-pointer-events-none brk-absolute brk-left-3 brk-top-1/2 brk-h-3.5 brk-w-3.5 brk--translate-y-1/2 brk-text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="brk-h-7 brk-pl-7 brk-text-xs"
            />
          </div>
          <div className="brk-max-h-56 brk-overflow-y-auto brk-p-1">
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => choose(option)}
                className="brk-block brk-w-full brk-rounded-sm brk-px-2 brk-py-1.5 brk-text-left brk-text-xs hover:brk-bg-secondary"
              >
                {option}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="brk-px-2 brk-py-4 brk-text-center brk-text-xs brk-text-muted-foreground">No matches.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
