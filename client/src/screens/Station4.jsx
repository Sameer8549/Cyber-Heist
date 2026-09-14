import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import socket from "../lib/socket";
import { getStoredToken } from "../lib/session";

const STATUS_FILTERS = [null, 200, 404, 500];

function StatusBadge({ status }) {
  const color = status >= 500 ? "#C9552F" : status >= 400 ? "#9a7020" : "var(--static)";
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color, letterSpacing: "0.04em" }}>
      {status}
    </span>
  );
}

const ROW_HEIGHT = 34;
const VISIBLE_ROWS = 18;

export default function Station4({ team, variant, onComplete }) {
  const [filter, setFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const logs = variant.station4.logs;

  const filtered = useMemo(() => {
    return logs.filter(row => {
      if (filter && row.status !== filter) return false;
      if (search && !row.path.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [logs, filter, search]);

  // Virtualized window
  const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
  const endIdx = Math.min(startIdx + VISIBLE_ROWS + 2, filtered.length);
  const visibleRows = filtered.slice(startIdx, endIdx);
  const totalHeight = filtered.length * ROW_HEIGHT;
  const offsetY = startIdx * ROW_HEIGHT;

  function handleScroll(e) { setScrollTop(e.target.scrollTop); }

  function handleSubmit() {
    if (!selected) return;
    setError("");
    setLoading(true);
    const token = getStoredToken();
    socket.emit("team:submit", { token, station: 4, answer: selected.path });
    socket.once("team:result", ({ correct, message, team: updated }) => {
      setLoading(false);
      if (correct) onComplete(updated);
      else setError(message);
    });
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 24px", gap: "12px" }}>

      {/* Controls */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Filter pills */}
        <div style={{ display: "flex", gap: "6px" }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f ?? "all"}
              onClick={() => { setFilter(f); setScrollTop(0); }}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                padding: "5px 12px",
                borderRadius: "3px",
                border: `1px solid ${filter === f ? "var(--rust)" : "var(--hairline)"}`,
                background: filter === f ? "var(--rust)" : "transparent",
                color: filter === f ? "var(--signal)" : "var(--static)",
                cursor: "pointer",
                transition: "all 150ms var(--ease-out)",
                letterSpacing: "0.06em"
              }}
            >
              {f ?? "ALL"}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="filter by path..."
          value={search}
          onChange={e => { setSearch(e.target.value); setScrollTop(0); }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            padding: "6px 12px",
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            borderRadius: "3px",
            color: "var(--signal)",
            width: "240px"
          }}
        />

        <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)" }}>
          {filtered.length} rows
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "4px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "180px 120px 54px 1fr 54px",
          padding: "8px 12px",
          borderBottom: "1px solid var(--hairline)",
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--static)",
          letterSpacing: "0.08em",
          gap: "8px"
        }}>
          <span>TIMESTAMP</span><span>IP</span><span>MTD</span><span>PATH</span><span>STS</span>
        </div>

        {/* Virtualized body */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{ flex: 1, overflow: "auto", position: "relative" }}
        >
          <div style={{ height: `${totalHeight}px`, position: "relative" }}>
            <div style={{ position: "absolute", top: `${offsetY}px`, left: 0, right: 0 }}>
              {visibleRows.map((row, i) => {
                const absoluteIdx = startIdx + i;
                const isEven = absoluteIdx % 2 === 0;
                const isSelected = selected?.id === row.id;
                return (
                  <div
                    key={row.id}
                    onClick={() => { setSelected(isSelected ? null : row); setConfirming(false); setError(""); }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 120px 54px 1fr 54px",
                      gap: "8px",
                      padding: "0 12px",
                      height: `${ROW_HEIGHT}px`,
                      alignItems: "center",
                      background: isSelected
                        ? "rgba(201,85,47,0.12)"
                        : isEven ? "transparent" : "rgba(22,26,31,0.6)", // imperceptible zebra
                      borderLeft: isSelected ? "2px solid var(--rust)" : "2px solid transparent",
                      cursor: "pointer",
                      transition: "background 100ms"
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)" }}>{row.ts}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)" }}>{row.ip}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: row.method === "POST" ? "var(--signal)" : "var(--static)" }}>{row.method}</span>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: row.isBackdoor ? "var(--rust)" : "var(--static)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>{row.path}</span>
                    <StatusBadge status={row.status} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row detail / flag */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "4px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", overflow: "hidden" }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--signal)", flex: 1 }}>
              <span style={{ color: "var(--static)" }}>SELECTED PATH: </span>{selected.path}
            </div>
            {!confirming ? (
              <button
                className="btn-ghost"
                onClick={() => setConfirming(true)}
                style={{ fontSize: "11px", color: "var(--rust)", borderColor: "var(--rust)" }}
              >
                FLAG AS BACKDOOR
              </button>
            ) : (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--signal)" }}>
                  Flag <span style={{ color: "var(--rust)" }}>{selected.path}</span>?
                </span>
                <button className="btn-rust" onClick={handleSubmit} disabled={loading} style={{ fontSize: "11px" }}>
                  {loading ? "VERIFYING..." : "CONFIRM"}
                </button>
                <button className="btn-ghost" onClick={() => setConfirming(false)} style={{ fontSize: "11px" }}>CANCEL</button>
              </div>
            )}
            {error && <div style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--rust)" }}>{error}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
