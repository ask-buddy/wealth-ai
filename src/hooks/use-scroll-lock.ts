"use client";

import { useEffect } from "react";

let lockCount = 0;
let originalOverflow = "";
let originalPaddingRight = "";

export function lockScroll() {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    originalOverflow = document.body.style.overflow;
    originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
  }
  lockCount++;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
  }
}

/**
 * Hook to lock background body scroll when a modal or dialog is open.
 * Handles nested/stacked modals gracefully by tracking active lock count.
 */
export function useScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isOpen]);
}
