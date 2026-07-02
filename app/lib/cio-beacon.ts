// A small, transparent data-driven beacon.
//
// Constructor's real beacon reads data-cnstrc-* attributes off the DOM and
// fires behavioral events for you. This module does the same thing in code you
// can read: it scans those same attributes, maps them to cio.tracker.* calls,
// and fires them. Nothing here is magic — every event is an explicit tracker
// call you can follow.
//
// Two kinds of events:
//   - Load / view events: fired when a results container appears in the DOM.
//   - Click events: fired from a single delegated click listener.

import { getCioClient } from "./cio-client";
import type {
  BeaconItem,
  ContainerContext,
  ContainerKind,
} from "./cio-beacon.types";

const DEBUG_STORAGE_KEY = "cnstrc-beacon-debug";

function debugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEBUG_STORAGE_KEY) === "true";
}

// --- Event bus ----------------------------------------------------------------
// Every fired behavioral event is broadcast to subscribers (the in-DOM event
// feed) and, when the debug flag is on, also logged to the console. This is the
// single choke point through which all tracker.* calls are announced.

export interface BeaconEventRecord {
  id: number;
  event: string;
  payload: unknown;
  time: number;
}

type BeaconListener = (rec: BeaconEventRecord) => void;

const beaconListeners = new Set<BeaconListener>();
let beaconSeq = 0;

export function subscribeBeaconEvents(fn: BeaconListener): () => void {
  beaconListeners.add(fn);
  return () => {
    beaconListeners.delete(fn);
  };
}

function log(event: string, payload: unknown) {
  const rec: BeaconEventRecord = {
    id: (beaconSeq += 1),
    event,
    payload,
    time: Date.now(),
  };
  beaconListeners.forEach((fn) => {
    try {
      fn(rec);
    } catch {
      // a bad subscriber must not break event dispatch
    }
  });
  if (debugEnabled()) {
    // eslint-disable-next-line no-console
    console.log(`%c[cio-beacon] ${event}`, "color:#3b82f6;font-weight:600", payload);
  }
}

// --- Attribute reading helpers ------------------------------------------------

function attr(el: Element, name: string): string | undefined {
  const value = el.getAttribute(name);
  return value === null ? undefined : value;
}

function numAttr(el: Element, name: string): number | undefined {
  const value = el.getAttribute(name);
  if (value === null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function containerKind(el: Element): ContainerKind | null {
  if (el.hasAttribute("data-cnstrc-search")) return "search";
  if (el.hasAttribute("data-cnstrc-browse")) return "browse";
  if (el.hasAttribute("data-cnstrc-recommendations")) return "recommendations";
  if (el.hasAttribute("data-cnstrc-product-detail")) return "product-detail";
  return null;
}

function readContainer(el: HTMLElement): ContainerContext {
  const kind = containerKind(el)!;
  return {
    kind,
    element: el,
    section: attr(el, "data-cnstrc-section"),
    resultId: attr(el, "data-cnstrc-result-id"),
    numResults: numAttr(el, "data-cnstrc-num-results"),
    resultPage: numAttr(el, "data-cnstrc-result-page"),
    zeroResult: el.hasAttribute("data-cnstrc-zero-result"),
    filterName: attr(el, "data-cnstrc-filter-name"),
    filterValue: attr(el, "data-cnstrc-filter-value"),
    podId: attr(el, "data-cnstrc-recommendations-pod-id"),
    seedItems: attr(el, "data-cnstrc-recommendations-seed-items"),
  };
}

function readItem(el: Element): BeaconItem | null {
  const itemId = attr(el, "data-cnstrc-item-id");
  if (!itemId) return null;
  return {
    itemId,
    itemName: attr(el, "data-cnstrc-item-name"),
    variationId: attr(el, "data-cnstrc-item-variation-id"),
  };
}

function collectItems(container: HTMLElement): BeaconItem[] {
  const items: BeaconItem[] = [];
  container.querySelectorAll("[data-cnstrc-item-id]").forEach((el) => {
    const item = readItem(el);
    if (item) items.push(item);
  });
  return items;
}

// Find the tracked container an element lives inside (for click events).
function closestContainer(el: Element): HTMLElement | null {
  const selector =
    "[data-cnstrc-search],[data-cnstrc-browse],[data-cnstrc-recommendations]";
  const found = el.closest(selector);
  return found instanceof HTMLElement ? found : null;
}

// Position (1-indexed) of an item element among its siblings in the container.
function itemPosition(container: HTMLElement, itemEl: Element): number | undefined {
  const all = Array.from(container.querySelectorAll("[data-cnstrc-item-id]"));
  const idx = all.indexOf(itemEl);
  return idx === -1 ? undefined : idx + 1;
}

// --- Deduplication ------------------------------------------------------------
// Load/view events should fire once per unique result render, not on every DOM
// mutation. Key by kind + resultId (falling back to identifying attributes).

const firedViews = new Set<string>();

function viewKey(ctx: ContainerContext): string {
  const id =
    ctx.resultId ??
    [ctx.filterName, ctx.filterValue, ctx.podId, ctx.section].join("|");
  return `${ctx.kind}:${id}:${ctx.numResults ?? ""}:${ctx.resultPage ?? ""}`;
}

export function resetBeaconDedup() {
  firedViews.clear();
}

// --- Load / view events -------------------------------------------------------

function fireContainerLoad(ctx: ContainerContext) {
  const cio = getCioClient();
  if (!cio) return;

  // Product detail has no "results loaded" dedup need beyond its own key.
  const key = viewKey(ctx);
  if (firedViews.has(key)) return;
  firedViews.add(key);

  const url = window.location.href;

  if (ctx.kind === "search") {
    const items = collectItems(ctx.element);
    const searchTerm = attr(ctx.element, "data-cnstrc-search-term") ?? "";
    const payload = {
      searchTerm,
      parameters: { url, items },
      resultCount: ctx.numResults,
      resultPage: ctx.resultPage,
      resultId: ctx.resultId,
      section: ctx.section,
    };
    log("trackSearchResultsLoaded", payload);
    cio.tracker.trackSearchResultsLoaded(searchTerm, {
      url,
      items,
      resultCount: ctx.numResults,
      resultPage: ctx.resultPage,
      resultId: ctx.resultId,
      section: ctx.section,
    } as any);
    return;
  }

  if (ctx.kind === "browse") {
    const items = collectItems(ctx.element);
    const payload = {
      parameters: {
        url,
        filterName: ctx.filterName,
        filterValue: ctx.filterValue,
        items,
      },
      resultCount: ctx.numResults,
      resultPage: ctx.resultPage,
      resultId: ctx.resultId,
      section: ctx.section,
    };
    log("trackBrowseResultsLoaded", payload);
    cio.tracker.trackBrowseResultsLoaded({
      url,
      filterName: ctx.filterName ?? "",
      filterValue: ctx.filterValue ?? "",
      items,
      resultCount: ctx.numResults,
      resultPage: ctx.resultPage,
      resultId: ctx.resultId,
      section: ctx.section,
    } as any);
    return;
  }

  if (ctx.kind === "recommendations") {
    const items = collectItems(ctx.element);
    const payload = {
      parameters: {
        url,
        podId: ctx.podId,
        numResultsViewed: items.length,
      },
      resultCount: ctx.numResults,
      resultId: ctx.resultId,
      section: ctx.section,
      seedItemIds: ctx.seedItems,
    };
    log("trackRecommendationView", payload);
    cio.tracker.trackRecommendationView({
      url,
      podId: ctx.podId ?? "",
      numResultsViewed: items.length,
      items,
      resultCount: ctx.numResults,
      resultId: ctx.resultId,
      section: ctx.section,
      seedItemIds: ctx.seedItems ? ctx.seedItems.split(",") : undefined,
    } as any);
    return;
  }

  if (ctx.kind === "product-detail") {
    const itemId = attr(ctx.element, "data-cnstrc-item-id");
    const itemName = attr(ctx.element, "data-cnstrc-item-name");
    if (!itemId || !itemName) return;
    const payload = {
      parameters: {
        itemId,
        itemName,
        url,
        variationId: attr(ctx.element, "data-cnstrc-item-variation-id"),
      },
    };
    log("trackItemDetailLoad", payload);
    cio.tracker.trackItemDetailLoad({
      itemId,
      itemName,
      url,
      variationId: attr(ctx.element, "data-cnstrc-item-variation-id"),
    } as any);
  }
}

// Scan the whole document for tracked containers and fire load events for any
// that are populated and not yet fired.
export function scanAndFireViews() {
  if (typeof window === "undefined") return;
  const selector =
    "[data-cnstrc-search],[data-cnstrc-browse]," +
    "[data-cnstrc-recommendations],[data-cnstrc-product-detail]";

  document.querySelectorAll(selector).forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const kind = containerKind(el);
    if (!kind) return;

    const ctx = readContainer(el);

    // Wait until a results container actually has items (or is a confirmed
    // zero-result page) before firing — avoids firing mid-load.
    if (kind !== "product-detail") {
      const hasItems = el.querySelector("[data-cnstrc-item-id]") !== null;
      if (!hasItems && !ctx.zeroResult) return;
    }

    fireContainerLoad(ctx);
  });

  firePurchaseIfPresent();
}

// --- Click events -------------------------------------------------------------

function fireItemClick(container: HTMLElement, itemEl: Element) {
  const cio = getCioClient();
  if (!cio) return;

  const item = readItem(itemEl);
  if (!item) return;

  const ctx = readContainer(container);
  const position = itemPosition(container, itemEl);

  if (ctx.kind === "search") {
    const term = attr(container, "data-cnstrc-search-term") ?? "";
    log("trackSearchResultClick", { term, item, resultId: ctx.resultId });
    cio.tracker.trackSearchResultClick(term, {
      itemId: item.itemId,
      itemName: item.itemName,
      variationId: item.variationId,
      resultId: ctx.resultId,
      section: ctx.section,
    } as any);
    return;
  }

  if (ctx.kind === "browse") {
    log("trackBrowseResultClick", { item, resultId: ctx.resultId, position });
    cio.tracker.trackBrowseResultClick({
      filterName: ctx.filterName ?? "",
      filterValue: ctx.filterValue ?? "",
      itemId: item.itemId,
      itemName: item.itemName,
      variationId: item.variationId,
      resultId: ctx.resultId,
      resultCount: ctx.numResults,
      resultPage: ctx.resultPage,
      resultPositionOnPage: position,
      section: ctx.section,
    } as any);
    return;
  }

  if (ctx.kind === "recommendations") {
    const strategyId = attr(itemEl, "data-cnstrc-strategy-id") ?? "";
    if (!item.itemName) return;
    log("trackRecommendationClick", { item, podId: ctx.podId, strategyId });
    cio.tracker.trackRecommendationClick({
      podId: ctx.podId ?? "",
      strategyId,
      itemId: item.itemId,
      itemName: item.itemName,
      variationId: item.variationId,
      resultId: ctx.resultId,
      resultCount: ctx.numResults,
      resultPositionOnPage: position,
      section: ctx.section,
      seedItemIds: ctx.seedItems ? ctx.seedItems.split(",") : undefined,
    } as any);
  }
}

function fireAutocompleteSelect(itemEl: Element) {
  const cio = getCioClient();
  if (!cio) return;

  const section = attr(itemEl, "data-cnstrc-item-section");
  const term = attr(itemEl, "data-cnstrc-item-name");
  if (!section || !term) return;

  const originalQuery = readAutosuggestQuery();
  log("trackAutocompleteSelect", { term, section, originalQuery });
  cio.tracker.trackAutocompleteSelect(term, {
    originalQuery,
    section,
    itemId: attr(itemEl, "data-cnstrc-item-id"),
  } as any);
}

function fireConversion(btnEl: Element) {
  const cio = getCioClient();
  if (!cio) return;

  // Read item context from the nearest tracked item / product-detail element.
  const host =
    btnEl.closest("[data-cnstrc-item-id]") ??
    btnEl.closest("[data-cnstrc-product-detail]");
  if (!(host instanceof HTMLElement)) return;

  const itemId = attr(host, "data-cnstrc-item-id");
  if (!itemId) return;

  const type = attr(btnEl, "data-cnstrc-btn") || "read";
  const knownTypes = ["add_to_cart", "add_to_wishlist", "like", "message", "make_offer", "read"];
  const isCustomType = !knownTypes.includes(type);

  log("trackConversion", { itemId, type, isCustomType });
  cio.tracker.trackConversion({
    itemId,
    itemName: attr(host, "data-cnstrc-item-name"),
    variationId: attr(host, "data-cnstrc-item-variation-id"),
    type,
    isCustomType,
    section: attr(host, "data-cnstrc-section"),
  } as any);
}

// Read the current autosuggest query from the search input, if present.
function readAutosuggestQuery(): string {
  const input = document.querySelector<HTMLInputElement>("[data-cnstrc-search-input]");
  return input?.value ?? "";
}

// --- Session start ------------------------------------------------------------
// Not auto-fired by the client. Fire once per page-session, after humanity is
// established, to mark the session boundary for personalization/analytics.

let sessionStartFired = false;

export function fireSessionStart() {
  if (sessionStartFired) return;
  const cio = getCioClient();
  if (!cio) return;
  sessionStartFired = true;
  log("trackSessionStart", {});
  cio.tracker.trackSessionStart();
}

// --- Search input focus -------------------------------------------------------
// Fired when the user focuses the search input (powers zero-state autosuggest
// analytics). Deduped per focus session so holding focus doesn't spam.

let inputFocused = false;

export function handleDocumentFocusIn(e: FocusEvent) {
  const target = e.target as Element | null;
  if (!target) return;
  if (!target.matches("[data-cnstrc-search-input]")) return;
  if (inputFocused) return;
  inputFocused = true;

  const cio = getCioClient();
  if (!cio) return;
  log("trackInputFocus", {});
  cio.tracker.trackInputFocus();
}

export function handleDocumentFocusOut(e: FocusEvent) {
  const target = e.target as Element | null;
  if (target && target.matches("[data-cnstrc-search-input]")) {
    inputFocused = false;
  }
}

// --- Search submit ------------------------------------------------------------
// Fired when the user submits the search form (captures active query intent,
// distinct from results-loaded). term = current input value.

export function handleDocumentSubmit(e: Event) {
  const form = e.target as Element | null;
  if (!form || !form.matches("[data-cnstrc-search-form]")) return;

  const input = form.querySelector<HTMLInputElement>("[data-cnstrc-search-input]");
  const term = input?.value.trim();
  if (!term) return;

  const cio = getCioClient();
  if (!cio) return;
  log("trackSearchSubmit", { term });
  cio.tracker.trackSearchSubmit(term, { originalQuery: term } as any);
}

// Single delegated click handler for the whole document.
export function handleDocumentClick(e: MouseEvent) {
  const target = e.target as Element | null;
  if (!target) return;

  // 1. Conversion / CTA button.
  const btn = target.closest("[data-cnstrc-btn]");
  if (btn) {
    fireConversion(btn);
    return;
  }

  // 2. Autocomplete item select.
  const acItem = target.closest("[data-cnstrc-item-section]");
  if (acItem && acItem.closest("[data-cnstrc-autosuggest]")) {
    fireAutocompleteSelect(acItem);
    return;
  }

  // 3. Result item click inside a search / browse / recs container.
  const itemEl = target.closest("[data-cnstrc-item-id]");
  if (itemEl) {
    const container = closestContainer(itemEl);
    if (container) fireItemClick(container, itemEl);
  }
}

// --- Purchase -----------------------------------------------------------------

let purchaseFired = false;

export function resetPurchaseDedup() {
  purchaseFired = false;
}

function firePurchaseIfPresent() {
  if (purchaseFired) return;
  const cio = getCioClient();
  if (!cio) return;

  const data = window.cnstrc?.purchaseData;
  if (!data || !Array.isArray(data.items) || data.items.length === 0) return;

  purchaseFired = true;
  log("trackPurchase", data);
  cio.tracker.trackPurchase({
    items: data.items,
    revenue: data.revenue,
    orderId: data.order_id,
  } as any);
}
