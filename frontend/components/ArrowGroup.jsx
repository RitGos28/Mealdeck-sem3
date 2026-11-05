"use client";

// Arrow-key navigation for a list or a row of links: Up/Down/Left/Right move
// focus to the next or previous item, Home and End jump to the ends. Tab
// still walks every control as usual; this just makes long lists quick on a
// keyboard. It never takes arrows from a text field, select or radio group,
// where they already mean something.
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const OWN_ARROWS = "input, textarea, select, [contenteditable='true']";

function firstFocusable(element) {
  return element.matches(FOCUSABLE) ? element : element.querySelector(FOCUSABLE);
}

export function arrowKeyHandler(itemSelector) {
  return (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest?.(OWN_ARROWS)) return;
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (step === undefined && event.key !== "Home" && event.key !== "End") return;

    const items = [...event.currentTarget.querySelectorAll(itemSelector)].filter(firstFocusable);
    const current = items.findIndex((item) => item === event.target || item.contains(event.target));
    if (current === -1) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : current + step;
    if (next < 0 || next >= items.length || next === current) return;

    event.preventDefault();
    const target = firstFocusable(items[next]);
    target.focus();
    target.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  };
}

export default function ArrowGroup({ as: Tag = "ul", itemSelector = ":scope > li", onKeyDown, ...props }) {
  return (
    <Tag
      {...props}
      onKeyDown={(event) => {
        arrowKeyHandler(itemSelector)(event);
        onKeyDown?.(event);
      }}
    />
  );
}
