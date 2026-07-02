import { useEffect, useRef, useState } from "react";
import { subscribeBeaconEvents, type BeaconEventRecord } from "~/lib/cio-beacon";

const MAX_EVENTS = 50;
const TOGGLE_STORAGE_KEY = "cnstrc-highlighter-enabled";

// Human-friendly grouping/color per event type.
function eventColor(event: string): string {
  if (event.includes("Click") || event.includes("Select")) return "#3b82f6"; // blue
  if (event.includes("Conversion") || event.includes("Purchase")) return "#10b981"; // green
  if (event.includes("Loaded") || event.includes("View") || event.includes("Load"))
    return "#8b5cf6"; // purple
  return "#f59e0b"; // amber fallback
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const millis = String(d.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${millis}`;
}

function EventRow({ rec }: { rec: BeaconEventRecord }) {
  const [open, setOpen] = useState(false);
  const color = eventColor(rec.event);

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        fontFamily: "'SF Mono','Monaco','Menlo','Consolas',monospace",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "6px 10px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            color: "#9ca3af",
            fontSize: "10px",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          ▶
        </span>
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span style={{ color: "#1a1a1a", fontSize: "11px", fontWeight: 600, flex: 1 }}>
          {rec.event}
        </span>
        <span style={{ color: "#9ca3af", fontSize: "10px" }}>{formatTime(rec.time)}</span>
      </button>
      {open && (
        <pre
          style={{
            margin: 0,
            padding: "8px 10px 10px 25px",
            fontSize: "10.5px",
            lineHeight: "1.45",
            color: "#374151",
            background: "rgba(0,0,0,0.02)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "220px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(rec.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

// A live, in-DOM feed of behavioral events fired by the beacon. Shares the
// "Toggle Overlay" button's on/off state (via localStorage + the
// cnstrc-overlay-toggle CustomEvent) and has its own collapse chevron.
export function CioEventFeed() {
  const [enabled, setEnabled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [events, setEvents] = useState<BeaconEventRecord[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Drag state. `pos` null → anchored bottom-left by default; once dragged it
  // holds an explicit top-left in viewport pixels.
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    // Ignore drags that start on the header's buttons (Clear / collapse).
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setPos({ left: rect.left, top: rect.top });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onHeaderPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const w = panelRef.current?.offsetWidth ?? 380;
    const h = panelRef.current?.offsetHeight ?? 200;
    const margin = 8;
    const left = Math.max(
      margin,
      Math.min(e.clientX - drag.dx, window.innerWidth - w - margin),
    );
    const top = Math.max(
      margin,
      Math.min(e.clientY - drag.dy, window.innerHeight - h - margin),
    );
    setPos({ left, top });
  };

  const onHeaderPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Initial enabled state + live updates from the shared toggle button.
  useEffect(() => {
    setEnabled(window.localStorage.getItem(TOGGLE_STORAGE_KEY) === "true");

    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
      setEnabled(!!detail?.enabled);
    };
    // Cross-tab: respond to storage changes too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOGGLE_STORAGE_KEY) setEnabled(e.newValue === "true");
    };

    window.addEventListener("cnstrc-overlay-toggle", onToggle);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("cnstrc-overlay-toggle", onToggle);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Subscribe to beacon events for the whole app lifetime, so the feed is
  // populated even while hidden (events that fired before you opened it show up).
  useEffect(() => {
    return subscribeBeaconEvents((rec) => {
      setEvents((prev) => {
        const next = [rec, ...prev];
        return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next;
      });
    });
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        ...(pos
          ? { left: `${pos.left}px`, top: `${pos.top}px` }
          : { bottom: "20px", left: "20px" }),
        width: "380px",
        maxWidth: "calc(100vw - 40px)",
        background: "rgba(255,255,255,0.98)",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: "10px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        zIndex: 10002,
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header — drag handle */}
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 12px",
          borderBottom: collapsed ? "none" : "1px solid rgba(0,0,0,0.08)",
          background: "rgba(59,130,246,0.06)",
          cursor: dragRef.current ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#3b82f6",
          }}
        />
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#1a1a1a", flex: 1 }}>
          Behavioral Events
          <span style={{ color: "#9ca3af", fontWeight: 500, marginLeft: "6px" }}>
            {events.length}
          </span>
        </span>
        {events.length > 0 && (
          <button
            type="button"
            onClick={() => setEvents([])}
            title="Clear events"
            style={{
              fontSize: "10px",
              color: "#6b7280",
              background: "transparent",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: "5px",
              padding: "2px 6px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            fontSize: "12px",
            color: "#6b7280",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "0 4px",
          }}
        >
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div ref={listRef} style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {events.length === 0 ? (
            <div
              style={{
                padding: "20px 12px",
                fontSize: "11.5px",
                color: "#9ca3af",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              No events yet. Search, browse, click a result, or open an article to
              see behavioral events fire in real time.
            </div>
          ) : (
            events.map((rec) => <EventRow key={rec.id} rec={rec} />)
          )}
        </div>
      )}
    </div>
  );
}
