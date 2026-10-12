"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export type CitySuggestion = {
  name: string;
  countryCode: string;
  province: string;
  timezone: string;
};

/**
 * City text box with suggestions from /api/cities. Typing freely is always allowed
 * (small towns aren't in the dataset); picking a suggestion also sets country and time zone.
 */
export function CityCombobox({
  value,
  country,
  onChange,
  onPick,
  countryName,
  label,
  placeholder,
  className,
}: {
  value: string;
  country: string;
  onChange: (name: string) => void;
  onPick: (city: CitySuggestion) => void;
  countryName: (code: string) => string;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [query, setQuery] = useState<string | null>(null); // null = don't search
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query === null) return;
    const q = query.trim();
    if (!q && !country) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q });
        if (country) params.set("country", country);
        const res = await fetch(`/api/cities?${params}`, { signal: controller.signal });
        if (!res.ok) return;
        const body = (await res.json()) as { cities: CitySuggestion[] };
        setSuggestions(body.cities);
        setActive(-1);
        setOpen(true);
      } catch {
        // Aborted or offline: keep free typing working.
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, country]);

  const pick = (city: CitySuggestion) => {
    onPick(city);
    setOpen(false);
    setQuery(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (event.key === "ArrowDown") setQuery(value);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      pick(suggestions[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <div className="relative min-w-0 flex-1">
      <input
        role="combobox"
        aria-label={label}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className={className}
        value={value}
        maxLength={80}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
        }}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setQuery(value);
        }}
        // Delay so a tap on a suggestion lands before the list closes.
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKeyDown}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-line bg-white p-1 shadow-card"
        >
          {suggestions.map((city, i) => (
            <li
              key={`${city.name}-${city.countryCode}-${city.province}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(city)}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col justify-center rounded-xl px-3 py-1.5",
                i === active ? "bg-sky-100" : "hover:bg-hover",
              )}
            >
              <span className="text-[15px] font-medium text-ink">{city.name}</span>
              <span className="text-[12px] font-medium text-muted-grey">
                {[city.province, countryName(city.countryCode)].filter(Boolean).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
