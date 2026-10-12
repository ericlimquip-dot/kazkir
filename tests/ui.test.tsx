import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TabList } from "@/components/ui/tab-list";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("joins truthy classes", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

function Harness() {
  const [active, setActive] = useState("a");
  return (
    <TabList
      label="Days"
      activeId={active}
      onSelect={setActive}
      items={[
        { id: "a", label: "Day 1" },
        { id: "b", label: "Day 2" },
        { id: "c", label: "Day 3" },
      ]}
    />
  );
}

describe("TabList", () => {
  it("selects on click", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("tab", { name: "Day 2" }));
    expect(screen.getByRole("tab", { name: "Day 2" })).toHaveAttribute("aria-selected", "true");
  });

  it("moves selection with arrow keys and wraps around", () => {
    render(<Harness />);
    const list = screen.getByRole("tablist", { name: "Days" });
    fireEvent.keyDown(list, { key: "ArrowUp" });
    expect(screen.getByRole("tab", { name: "Day 3" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Day 3" })).toHaveFocus();
    fireEvent.keyDown(list, { key: "Home" });
    expect(screen.getByRole("tab", { name: "Day 1" })).toHaveAttribute("aria-selected", "true");
  });

  it("only the active tab is in the tab order", () => {
    render(<Harness />);
    expect(screen.getByRole("tab", { name: "Day 1" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Day 2" })).toHaveAttribute("tabindex", "-1");
  });
});
