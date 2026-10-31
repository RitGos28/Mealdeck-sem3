"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The phone/tablet bag: a modal bottom sheet. Focus moves in on open, stays
// inside while open (Tab wraps), and returns to the bag button on close.
export default function BagSheet({ onClose, children, label = "Your bag" }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    panel?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-[#0B1F14]/50" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="relative max-h-[85vh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-ink outline-none md:max-w-xl md:px-8">
        <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-white px-5 pt-2 pb-1 md:-mx-8 md:px-8">
          <span className="mx-auto h-1 w-10 rounded-full bg-field" aria-hidden="true" />
          <button type="button" onClick={onClose} aria-label={`Close ${label.toLowerCase()}`} className="absolute top-1.5 right-3 flex size-11 items-center justify-center rounded-full text-2xl text-muted hover:bg-[#F4F6F3] hover:text-ink md:right-6">×</button>
        </div>
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}

