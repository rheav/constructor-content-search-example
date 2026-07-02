import { useState, useEffect, useCallback, useRef } from "react";

const CONSTRUCTOR_FAVICON_URL = "https://constructor.io/favicon.ico";

const OVERLAY_CONTAINER_ID = "cnstrc-highlight-container";

interface Palette {
  border: string;
  bg: string;
  borderSolid: string;
  accent: string;
}

type ElementType = "item-card" | "autocomplete-item" | "action-btn" | "container";

interface OverlayEntry {
  box: HTMLDivElement;
  label: HTMLDivElement;
  attributes: string[];
  elementType: ElementType;
}

interface LabelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Color palette for items (always blue)
const ITEM_PALETTE: Palette = {
  border: "#3b82f6",
  bg: "rgba(59, 130, 246, 0.06)",
  borderSolid: "1px solid rgba(59, 130, 246, 0.25)",
  accent: "3px solid #3b82f6",
};

// Rotating color palettes for containers — each container gets a unique color
const CONTAINER_PALETTES: Palette[] = [
  {
    border: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.06)",
    borderSolid: "1px solid rgba(139, 92, 246, 0.25)",
    accent: "3px solid #8b5cf6",
  },
  {
    border: "#14b8a6",
    bg: "rgba(20, 184, 166, 0.06)",
    borderSolid: "1px solid rgba(20, 184, 166, 0.25)",
    accent: "3px solid #14b8a6",
  },
  {
    border: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.06)",
    borderSolid: "1px solid rgba(245, 158, 11, 0.25)",
    accent: "3px solid #f59e0b",
  },
  {
    border: "#ec4899",
    bg: "rgba(236, 72, 153, 0.06)",
    borderSolid: "1px solid rgba(236, 72, 153, 0.25)",
    accent: "3px solid #ec4899",
  },
  {
    border: "#10b981",
    bg: "rgba(16, 185, 129, 0.06)",
    borderSolid: "1px solid rgba(16, 185, 129, 0.25)",
    accent: "3px solid #10b981",
  },
];

const ROW_THRESHOLD = 30; // px — items within this vertical distance are considered same row

const SPECIAL_TAGS = [
  "data-cnstrc-search",
  "data-cnstrc-num-results",
  "data-cnstrc-browse",
  "data-cnstrc-filter-name",
  "data-cnstrc-filter-value",
  "data-cnstrc-recommendations",
  "data-cnstrc-product-detail",
];

// Responsive configuration based on viewport width
function getResponsiveConfig() {
  const width = window.innerWidth;
  if (width < 640) {
    return { fontSize: 9, padding: "2px 4px", maxLabelWidth: 200, lineHeight: 13 };
  }
  if (width < 1024) {
    return { fontSize: 10, padding: "3px 5px", maxLabelWidth: 280, lineHeight: 14 };
  }
  return { fontSize: 11, padding: "4px 6px", maxLabelWidth: 360, lineHeight: 16 };
}

// 2D rectangle overlap check
function rectsOverlap(a: LabelRect, b: LabelRect) {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

export function CnstrcHighlighter() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("cnstrc-highlighter-enabled");
    return stored === null ? false : stored === "true";
  });
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window === "undefined" ? false : window.innerWidth < 640,
  );
  const [faviconError, setFaviconError] = useState(false);

  const overlayContainerRef = useRef<HTMLDivElement | null>(null);
  const overlayMapRef = useRef<Map<Element, OverlayEntry>>(new Map());
  const labelRectsRef = useRef<LabelRect[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const redrawTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isDrawingRef = useRef(false);

  // Track mobile breakpoint for toggle button responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Create or retrieve the single overlay container
  const getOverlayContainer = useCallback(() => {
    if (!overlayContainerRef.current) {
      const container = document.createElement("div");
      container.id = OVERLAY_CONTAINER_ID;
      container.style.cssText =
        "position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:9999;";
      document.body.appendChild(container);
      overlayContainerRef.current = container;
    }
    return overlayContainerRef.current;
  }, []);

  const clearHighlights = useCallback(() => {
    if (overlayContainerRef.current) {
      overlayContainerRef.current.remove();
      overlayContainerRef.current = null;
    }
    overlayMapRef.current.clear();
    labelRectsRef.current = [];
  }, []);

  // Viewport-aware label position computation
  const computeLabelPosition = useCallback(
    (
      rect: DOMRect,
      labelWidth: number,
      labelHeight: number,
      isSpecial: boolean,
      elementType: ElementType,
    ) => {
      const vw = window.innerWidth;
      const margin = 8;

      // Anchor to the element in PAGE coordinates so the label scrolls with
      // the element instead of floating / jumping within the viewport.
      const pageTop = window.scrollY + rect.top;
      const pageBottom = window.scrollY + rect.bottom;
      const pageLeft = window.scrollX + rect.left;

      let left: number;
      let top: number;

      if (isSpecial) {
        // Anchor at the element's top-left, just above it — but if there isn't
        // room above within the viewport (element near the top edge), place it
        // below instead so it never gets clipped. The decision uses the
        // viewport-relative rect.top so it stays stable while scrolling.
        left = pageLeft;
        const roomAbove = rect.top >= labelHeight + 8 + margin;
        top = roomAbove ? pageTop - labelHeight - 8 : pageBottom + 4;
      } else if (elementType === "item-card" || elementType === "autocomplete-item") {
        left = pageLeft;
        top = pageBottom + 4;
      } else if (rect.width > 60 && rect.height > labelHeight + 10) {
        left = pageLeft + 5;
        top = pageTop + 5;
      } else {
        left = pageLeft;
        top = pageBottom + 4;
      }

      // Clamp horizontally to the viewport width only; never clamp vertically
      // (vertical clamping is what caused the label to jump on scroll).
      const maxLeft = window.scrollX + vw - labelWidth - margin;
      left = Math.max(window.scrollX + margin, Math.min(left, maxLeft));

      return { left, top };
    },
    [],
  );

  // 2D collision avoidance — nudge labels down to avoid overlap
  const resolveCollision = useCallback((labelRect: LabelRect) => {
    const placed = labelRectsRef.current;
    const config = getResponsiveConfig();

    for (let attempts = 0; attempts < 20; attempts += 1) {
      let overlap = false;
      for (let i = 0; i < placed.length; i += 1) {
        if (rectsOverlap(labelRect, placed[i])) {
          overlap = true;
          break;
        }
      }
      if (!overlap) break;
      labelRect.top += config.lineHeight + 4;
    }

    placed.push({ ...labelRect });
    return labelRect;
  }, []);

  // Estimate label dimensions for positioning
  const estimateLabelSize = useCallback((attributes: string[]) => {
    const config = getResponsiveConfig();
    const charWidth = config.fontSize * 0.6;
    const longestLine = attributes.reduce((max, attr) => Math.max(max, attr.length), 0);
    return {
      width: Math.min(config.maxLabelWidth, longestLine * charWidth + 16),
      height: attributes.length * config.lineHeight + 8,
    };
  }, []);

  // Create overlay elements for a single tracked element
  const createOverlay = useCallback(
    (
      element: Element,
      matchingAttributes: string[],
      container: HTMLDivElement,
      palette: Palette,
      elementType: ElementType,
    ) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const config = getResponsiveConfig();
      const isSpecial = matchingAttributes.some((l) =>
        SPECIAL_TAGS.some((tag) => l.startsWith(tag)),
      );
      const labelText = matchingAttributes.join("\n");
      const { width: estLabelWidth, height: estLabelHeight } =
        estimateLabelSize(matchingAttributes);

      const isAutocomplete =
        element.hasAttribute("data-cnstrc-autosuggest") ||
        element.hasAttribute("data-cnstrc-item-section") ||
        element.hasAttribute("data-cnstrc-search-form") ||
        element.hasAttribute("data-cnstrc-search-input") ||
        element.hasAttribute("data-cnstrc-search-submit-btn") ||
        !!element.closest("[data-cnstrc-autosuggest]");
      const boxZ = isAutocomplete ? "10050" : "9999";
      const labelZ = isAutocomplete ? "10051" : "10000";

      const box = document.createElement("div");
      box.classList.add("cnstrc-highlight-box");
      Object.assign(box.style, {
        position: "absolute",
        border: `2px solid ${palette.border}`,
        background: palette.bg,
        left: `${window.scrollX + rect.left}px`,
        top: `${window.scrollY + rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        pointerEvents: "none",
        zIndex: boxZ,
        borderRadius: "3px",
      });

      const label = document.createElement("div");
      label.classList.add("cnstrc-highlight-label");
      label.innerText = labelText;
      Object.assign(label.style, {
        position: "absolute",
        backgroundColor: "rgba(255, 255, 255, 0.97)",
        color: "#1a1a1a",
        fontSize: `${config.fontSize}px`,
        fontFamily: "'SF Mono','Monaco','Menlo','Consolas',monospace",
        padding: config.padding,
        border: palette.borderSolid,
        borderLeft: palette.accent,
        whiteSpace: "pre",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        zIndex: labelZ,
        maxWidth: "none",
        lineHeight: `${config.lineHeight}px`,
        overflow: "hidden",
        textOverflow: "ellipsis",
        pointerEvents: "none",
      });

      const pos = computeLabelPosition(
        rect,
        estLabelWidth,
        estLabelHeight,
        isSpecial,
        elementType,
      );
      const resolved = resolveCollision({
        left: pos.left,
        top: pos.top,
        width: estLabelWidth,
        height: estLabelHeight,
      });
      label.style.left = `${resolved.left}px`;
      label.style.top = `${resolved.top}px`;

      container.appendChild(box);
      container.appendChild(label);
      overlayMapRef.current.set(element, {
        box,
        label,
        attributes: matchingAttributes,
        elementType,
      });
    },
    [computeLabelPosition, resolveCollision, estimateLabelSize],
  );

  // Classify an element based on its data-cnstrc-* attributes
  const classifyElement = useCallback((el: Element): ElementType => {
    const hasItemId = el.hasAttribute("data-cnstrc-item-id");
    const hasProductDetail = el.hasAttribute("data-cnstrc-product-detail");
    const hasBtn = el.hasAttribute("data-cnstrc-btn");
    const hasItemSection = el.hasAttribute("data-cnstrc-item-section");

    if (hasBtn) return "action-btn";
    if (hasItemSection) return "autocomplete-item";
    if (hasItemId && !hasProductDetail) return "item-card";
    return "container";
  }, []);

  // Full redraw: scan entire DOM, create all overlays from scratch
  const fullRedraw = useCallback(() => {
    isDrawingRef.current = true;
    clearHighlights();
    const container = getOverlayContainer();
    labelRectsRef.current = [];

    interface Entry {
      el: Element;
      matchingAttributes: string[];
    }

    const itemCards: Entry[] = [];
    const autocompleteItems: Entry[] = [];
    const actionBtns: Entry[] = [];
    const containers: Entry[] = [];

    document.querySelectorAll("*").forEach((el) => {
      if (el.closest(`#${OVERLAY_CONTAINER_ID}`) || el.id === OVERLAY_CONTAINER_ID) {
        return;
      }

      const matchingAttributes: string[] = [];
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith("data-cnstrc-")) {
          matchingAttributes.push(`${attr.name}${attr.value ? `='${attr.value}'` : ""}`);
        }
      }
      if (matchingAttributes.length === 0) return;

      const type = classifyElement(el);
      const entry: Entry = { el, matchingAttributes };

      if (type === "item-card") itemCards.push(entry);
      else if (type === "autocomplete-item") autocompleteItems.push(entry);
      else if (type === "action-btn") actionBtns.push(entry);
      else containers.push(entry);
    });

    // Group autocomplete items by section and pick 1 per section
    const acSections: Record<string, Entry[]> = {};
    autocompleteItems.forEach((item) => {
      const section = item.el.getAttribute("data-cnstrc-item-section") || "other";
      if (!acSections[section]) acSections[section] = [];
      acSections[section].push(item);
    });

    const selectedAutocomplete = new Set<Element>();
    Object.values(acSections).forEach((sectionItems) => {
      const idx = Math.floor(sectionItems.length / 2);
      selectedAutocomplete.add(sectionItems[idx].el);
    });

    // Group item cards by visual row and pick 1 per row
    const rows: { top: number; items: Entry[] }[] = [];
    itemCards.forEach((item) => {
      const rect = item.el.getBoundingClientRect();
      let foundRow = false;
      for (let i = 0; i < rows.length; i += 1) {
        if (Math.abs(rows[i].top - rect.top) < ROW_THRESHOLD) {
          rows[i].items.push(item);
          foundRow = true;
          break;
        }
      }
      if (!foundRow) {
        rows.push({ top: rect.top, items: [item] });
      }
    });

    const selectedItems = new Set<Element>();
    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 !== 0) return;
      const idx = Math.abs(Math.floor(row.top)) % row.items.length;
      selectedItems.add(row.items[idx].el);
    });

    const autosuggestOpen = !!document.querySelector("[data-cnstrc-autosuggest]");

    let containerColorIdx = 0;
    containers.forEach(({ el, matchingAttributes }) => {
      const isAcContainer =
        el.hasAttribute("data-cnstrc-autosuggest") ||
        el.hasAttribute("data-cnstrc-search-form") ||
        el.hasAttribute("data-cnstrc-search-input") ||
        el.hasAttribute("data-cnstrc-search-submit-btn") ||
        !!el.closest("[data-cnstrc-autosuggest]");
      if (autosuggestOpen && !isAcContainer) return;

      const pal = CONTAINER_PALETTES[containerColorIdx % CONTAINER_PALETTES.length];
      containerColorIdx += 1;
      createOverlay(el, matchingAttributes, container, pal, "container");
    });

    autocompleteItems.forEach(({ el, matchingAttributes }) => {
      if (selectedAutocomplete.has(el)) {
        createOverlay(el, matchingAttributes, container, ITEM_PALETTE, "autocomplete-item");
      }
    });

    if (!autosuggestOpen) {
      itemCards.forEach(({ el, matchingAttributes }) => {
        if (selectedItems.has(el)) {
          createOverlay(el, matchingAttributes, container, ITEM_PALETTE, "item-card");
        }
      });

      actionBtns.forEach(({ el, matchingAttributes }) => {
        const parentItem = el.closest("[data-cnstrc-item-id]");
        if (
          !parentItem ||
          selectedItems.has(parentItem) ||
          parentItem.hasAttribute("data-cnstrc-product-detail")
        ) {
          createOverlay(el, matchingAttributes, container, ITEM_PALETTE, "action-btn");
        }
      });
    }

    setTimeout(() => {
      isDrawingRef.current = false;
    }, 0);
  }, [clearHighlights, getOverlayContainer, createOverlay, classifyElement]);

  // Lightweight reposition: update positions of existing overlays without recreating DOM
  const repositionAll = useCallback(() => {
    isDrawingRef.current = true;
    labelRectsRef.current = [];
    const config = getResponsiveConfig();

    overlayMapRef.current.forEach(({ box, label, attributes, elementType }, element) => {
      const rect = element.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        box.style.display = "none";
        label.style.display = "none";
        return;
      }

      box.style.display = "";
      label.style.display = "";

      Object.assign(box.style, {
        left: `${window.scrollX + rect.left}px`,
        top: `${window.scrollY + rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });

      const isSpecial = attributes.some((l) =>
        SPECIAL_TAGS.some((tag) => l.startsWith(tag)),
      );
      const { width: estLabelWidth, height: estLabelHeight } =
        estimateLabelSize(attributes);
      const pos = computeLabelPosition(
        rect,
        estLabelWidth,
        estLabelHeight,
        isSpecial,
        elementType,
      );
      const resolved = resolveCollision({
        left: pos.left,
        top: pos.top,
        width: estLabelWidth,
        height: estLabelHeight,
      });

      Object.assign(label.style, {
        left: `${resolved.left}px`,
        top: `${resolved.top}px`,
        fontSize: `${config.fontSize}px`,
        padding: config.padding,
        maxWidth: "none",
        lineHeight: `${config.lineHeight}px`,
      });
    });
    isDrawingRef.current = false;
  }, [computeLabelPosition, resolveCollision, estimateLabelSize]);

  // Throttled reposition via requestAnimationFrame (scroll/resize)
  const scheduleReposition = useCallback(() => {
    if (!enabled) return;
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      repositionAll();
      rafIdRef.current = null;
    });
  }, [enabled, repositionAll]);

  // Debounced full redraw (DOM mutations)
  const scheduleRedraw = useCallback(() => {
    if (!enabled) return;
    clearTimeout(redrawTimeoutRef.current);
    redrawTimeoutRef.current = setTimeout(fullRedraw, 300);
  }, [enabled, fullRedraw]);

  const handleToggle = useCallback(() => {
    setEnabled((prev) => {
      const newValue = !prev;
      window.localStorage.setItem("cnstrc-highlighter-enabled", String(newValue));
      // Broadcast so other overlay surfaces (the event feed) share this toggle.
      window.dispatchEvent(
        new CustomEvent("cnstrc-overlay-toggle", { detail: { enabled: newValue } }),
      );
      return newValue;
    });
  }, []);

  // Toggle on/off
  useEffect(() => {
    if (enabled) {
      fullRedraw();
    } else {
      clearHighlights();
    }
  }, [enabled, fullRedraw, clearHighlights]);

  // MutationObserver: full redraw on relevant DOM changes
  useEffect(() => {
    if (!enabled) return undefined;

    const observer = new MutationObserver((mutations) => {
      if (isDrawingRef.current) return;
      const isRelevant = mutations.some((m) => {
        const target = m.target as Element;
        if (target.id === OVERLAY_CONTAINER_ID) return false;
        if (
          target.closest?.(`.${OVERLAY_CONTAINER_ID}`) ||
          target.closest?.(`#${OVERLAY_CONTAINER_ID}`)
        )
          return false;
        if (
          m.type === "attributes" &&
          m.attributeName &&
          !m.attributeName.startsWith("data-cnstrc-")
        )
          return false;
        return true;
      });
      if (isRelevant) scheduleRedraw();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [enabled, scheduleRedraw]);

  // Scroll/resize: throttled lightweight reposition
  useEffect(() => {
    if (!enabled) return undefined;

    window.addEventListener("scroll", scheduleReposition, { passive: true });
    window.addEventListener("resize", scheduleReposition, { passive: true });

    return () => {
      window.removeEventListener("scroll", scheduleReposition);
      window.removeEventListener("resize", scheduleReposition);
    };
  }, [enabled, scheduleReposition]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      clearHighlights();
      clearTimeout(redrawTimeoutRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    },
    [clearHighlights],
  );

  const faviconSize = isMobile ? "24px" : "32px";

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled ? "Hide data-cnstrc-* highlights" : "Show data-cnstrc-* highlights"}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        background: enabled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
        border: enabled ? "2px solid #3b82f6" : "2px solid transparent",
        cursor: "pointer",
        zIndex: 10001,
        padding: "8px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        transition: "all 0.2s ease-in-out",
        opacity: enabled ? 1 : 0.7,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      aria-label={
        enabled ? "Disable Constructor highlighting" : "Enable Constructor highlighting"
      }
    >
      {!faviconError ? (
        <img
          src={CONSTRUCTOR_FAVICON_URL}
          alt="Constructor.io"
          onError={() => setFaviconError(true)}
          style={{
            width: faviconSize,
            height: faviconSize,
            filter: enabled ? "none" : "grayscale(100%)",
            transition: "filter 0.2s ease-in-out",
          }}
        />
      ) : (
        <span
          style={{
            width: faviconSize,
            height: faviconSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile ? "16px" : "20px",
            fontWeight: 700,
            color: enabled ? "#3b82f6" : "#888",
            fontFamily: "system-ui, -apple-system, sans-serif",
            transition: "color 0.2s ease-in-out",
          }}
        >
          C
        </span>
      )}
      {!isMobile && (
        <span
          style={{
            fontSize: "9px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: enabled ? "#3b82f6" : "#888",
            fontWeight: 600,
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
            transition: "color 0.2s ease-in-out",
          }}
        >
          Toggle Overlay
        </span>
      )}
    </button>
  );
}
