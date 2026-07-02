import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import {
  scanAndFireViews,
  handleDocumentClick,
  handleDocumentFocusIn,
  handleDocumentFocusOut,
  handleDocumentSubmit,
  fireSessionStart,
  resetBeaconDedup,
} from "~/lib/cio-beacon";

// Constructor's client drops behavioral events at enqueue time until it has
// seen a genuine human interaction (it sets the _constructorio_is_human session
// flag on the first pointermove / scroll / keydown / etc). View/load events
// that fire on initial page render — before the user has touched anything —
// would therefore be silently dropped.
//
// To avoid losing them, we hold the first view scan until humanity is
// established: either the flag is already set (same-tab navigation) or the user
// performs one interaction. After that, scans run normally.
const HUMAN_STORAGE_KEY = "_constructorio_is_human";
const HUMAN_EVENTS = [
  "pointermove",
  "pointerdown",
  "mousemove",
  "scroll",
  "keydown",
  "touchstart",
] as const;

function isHumanEstablished(): boolean {
  try {
    return window.sessionStorage.getItem(HUMAN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

// Mounts the data-driven beacon once for the whole app.
//
// - A delegated click listener on the document captures all result / CTA /
//   autocomplete clicks (added once, never re-added).
// - A MutationObserver + a route-change effect re-scan the DOM for newly
//   rendered results containers and fire their load/view events — but only
//   after humanity is established, so the events actually send.
export function CioBeacon() {
  const location = useLocation();
  const humanReadyRef = useRef(false);

  // Delegated listeners — mounted once for the app lifetime.
  // click: result / CTA / autocomplete clicks
  // focusin/out: search input focus tracking
  // submit: search form submit
  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("focusin", handleDocumentFocusIn);
    document.addEventListener("focusout", handleDocumentFocusOut);
    document.addEventListener("submit", handleDocumentSubmit);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("focusin", handleDocumentFocusIn);
      document.removeEventListener("focusout", handleDocumentFocusOut);
      document.removeEventListener("submit", handleDocumentSubmit);
    };
  }, []);

  // Establish humanity, then observe DOM mutations and re-scan for view events.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleScan = () => {
      if (!humanReadyRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(scanAndFireViews, 250);
    };

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, { childList: true, subtree: true });

    // Once humanity is established, mark ready and run the first scan for any
    // content already on the page.
    const markReady = () => {
      if (humanReadyRef.current) return;
      humanReadyRef.current = true;
      fireSessionStart();
      scheduleScan();
    };

    let cleanupInteraction: (() => void) | undefined;
    if (isHumanEstablished()) {
      markReady();
    } else {
      const onInteract = () => markReady();
      HUMAN_EVENTS.forEach((evt) =>
        window.addEventListener(evt, onInteract, { once: true, passive: true }),
      );
      cleanupInteraction = () =>
        HUMAN_EVENTS.forEach((evt) => window.removeEventListener(evt, onInteract));
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      cleanupInteraction?.();
    };
  }, []);

  // On route change, clear per-page view dedup so the new page's results fire.
  // Only scans if humanity is already established (otherwise the mutation
  // observer / interaction handler will pick it up once ready).
  useEffect(() => {
    resetBeaconDedup();
    if (!humanReadyRef.current) return;
    const id = setTimeout(scanAndFireViews, 300);
    return () => clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
}
