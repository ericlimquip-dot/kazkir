"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconTile } from "./icon-tile";

export type TabItem = {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
};

const NEXT_KEYS = ["ArrowDown", "ArrowRight"];
const PREV_KEYS = ["ArrowUp", "ArrowLeft"];

/**
 * Selectable list in the Features 01 style. Vertical = rich rows with icon + description
 * (day lists, item lists); horizontal = compact pills (trip tab bar).
 */
export function TabList({
  items,
  activeId,
  onSelect,
  label,
  orientation = "vertical",
  idPrefix = "tab",
  className,
}: {
  items: TabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  label: string;
  orientation?: "vertical" | "horizontal";
  idPrefix?: string;
  className?: string;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === activeId);
    if (index < 0) return;
    let next = index;
    if (NEXT_KEYS.includes(event.key)) next = (index + 1) % items.length;
    else if (PREV_KEYS.includes(event.key)) next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    const nextId = items[next].id;
    onSelect(nextId);
    document.getElementById(`${idPrefix}-${nextId}`)?.focus();
  };

  const vertical = orientation === "vertical";

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={cn(
        vertical ? "flex flex-col gap-2.5" : "flex gap-1 overflow-x-auto rounded-2xl bg-hover p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            id={`${idPrefix}-${item.id}`}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(item.id)}
            className={cn(
              "relative flex min-h-11 min-w-0 cursor-pointer touch-manipulation items-center gap-3 rounded-xl border text-left",
              "transition-[background-color,border-color,box-shadow] duration-500 ease-out-soft motion-reduce:transition-none",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
              vertical ? "w-full p-3" : "shrink-0 px-4 py-2",
              active
                ? "border-sky-300 bg-sky-100 shadow-active"
                : "border-transparent bg-white [@media(hover:hover)_and_(pointer:fine)]:hover:bg-hover",
            )}
          >
            {vertical && item.icon ? <IconTile active={active}>{item.icon}</IconTile> : null}
            <span className="flex min-w-0 flex-col gap-1.25">
              <span className="text-[15px] font-medium leading-[1.1] tracking-[-0.01em] text-ink">
                {item.label}
              </span>
              {vertical && item.description ? (
                <span
                  className={cn(
                    "text-[13px] font-medium leading-[1.2] tracking-[-0.01em]",
                    active ? "text-muted-teal" : "text-muted-grey",
                  )}
                >
                  {item.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
