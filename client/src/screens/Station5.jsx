import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import socket from "../lib/socket";
import { getStoredToken } from "../lib/session";

const NONSTANDARD_PORTS = [4444, 8888, 9999, 1337];

// Beacon diagram — custom SVG dot-and-line, pulses with frequency
function BeaconDiagram({ flows, flaggedRow, beaconFrequency }) {
  const [pulse, setPulse] = useState(0);
  const W = 280, H = 180;

  // Pulse interval driven by frequency
  useEffect(() => {
    const interval = Math.max(200, 3000 - beaconFrequency);
    const iv = setInterval(() => setPulse(p => p + 1), interval);
    return () => clearInterval(iv);
  }, [beaconFrequency]);

  const anomaly = flows.find(f => f.isAnomaly);
  const normal = flows.filter(f => !f.isAnomaly).slice(0, 6);
  const isFlagged = flaggedRow !== null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: "300px" }} role="img" aria-label="Network beacon diagram">
      {/* Internal network node */}
      <circle cx="60" cy="90" r="18" fill="var(--panel)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
      <text x="60" y="85" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill="var(--static)">INTERNAL</text>
      <text x="60" y="97" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill="var(--signal)">HOST</text>

      {/* Normal connections */}
      {normal.map((f, i) => {
        const y = 20 + i * 26;
        return (
          <g key={i}>
            <line x1="78" y1="90" x2="200" y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
            <circle cx="200" cy={y} r="5" fill="var(--panel)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
          </g>
        );
      })}

      {/* External node (normal) */}
      <text x="210" y="88" fontFamily="var(--font-mono)" fontSize="7" fill="var(--static)">INTERNET</text>

      {/* Anomalous C2 beacon */}
      {anomaly && (
        <g>
          <motion.line
            x1="78" y1="90"
            x2="240" y2="150"
            stroke={isFlagged ? "var(--rust)" : "rgba(255,255,255,0.2)"}
            strokeWidth={isFlagged ? "2" : "1"}
            strokeDasharray="4,3"
            animate={{ strokeOpacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Pulse dot — orchestrated moment 4 */}
          <motion.circle
            cx={0} cy={0}
            r="4"
            fill={isFlagged ? "var(--rust)" : "rgba(255,255,255,0.6)"}
            animate={{
              cx: [78, 240],
              cy: [90, 150],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: Math.max(0.3, 1.5 - beaconFrequency / 3000),
              repeat: Infinity,
              ease: [0.23, 1, 0.32, 1],
              repeatDelay: Math.max(0.1, 2 - beaconFrequency / 2000)
            }}
          />

          {/* C2 node */}
          <motion.circle
            cx="240" cy="150" r="12"
            fill="var(--panel)"
            stroke={isFlagged ? "var(--rust)" : "rgba(255,100,50,0.4)"}
            strokeWidth={isFlagged ? "2" : "1"}
            animate={{ strokeOpacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <text x="240" y="147" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={isFlagged ? "var(--rust)" : "var(--static)"}>C2</text>
          <text x="240" y="158" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="7" fill={isFlagged ? "var(--rust)" : "var(--static)"}>{anomaly.port}</text>
        </g>
      )}

      <text x="4" y={H - 4} fontFamily="var(--font-mono)" fontSize="7" fill="var(--static)">
        {beaconFrequency} pkts/hr
      </text>
    </svg>
  );
}

export default function Station5({ team, variant, onComplete }) {
  const [flaggedRow, setFlaggedRow] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { netflow, beaconFrequency } = variant.station5;

  function handleFlag(row) {
    if (!NONSTANDARD_PORTS.includes(row.port)) {
      setError("[!] ERROR: This connection does not match C2 signature. Review port numbers.");
      return;
    }
    setFlaggedRow(row);
    setConfirming(true);
    setError("");
  }

  function handleConfirm() {
    if (!flaggedRow) return;
    setLoading(true);
    const token = getStoredToken();
    const answer = `${flaggedRow.src}:${flaggedRow.port}`;
    socket.emit("team:submit", { token, station: 5, answer });
    socket.once("team:result", ({ correct, message, team: updated }) => {
      setLoading(false);
      if (correct) onComplete(updated);
      else { setError(message); setConfirming(false); setFlaggedRow(null); }
    });
  }

  return (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr auto", gap: "24px", padding: "20px 24px", minHeight: 0 }}>
      {/* NetFlow table */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", letterSpacing: "0.1em" }}>
          NETFLOW CAPTURE — BREACH WINDOW
        </div>

        <div style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "4px", overflow: "auto" }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "140px 160px 60px 60px 80px",
            gap: "8px",
            padding: "8px 12px",
            borderBottom: "1px solid var(--hairline)",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--static)",
            letterSpacing: "0.08em"
          }}>
            <span>SRC IP</span><span>DST IP</span><span>PORT</span><span>PROTO</span><span>FREQ/HR</span>
          </div>

          {netflow.map((row, i) => {
            const isAnomaly = row.isAnomaly;
            const isFlagged = flaggedRow && flaggedRow.src === row.src && flaggedRow.port === row.port;
            return (
              <motion.div
                key={i}
                onClick={() => handleFlag(row)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 160px 60px 60px 80px",
                  gap: "8px",
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--hairline)",
                  cursor: "pointer",
                  background: isFlagged ? "rgba(201,85,47,0.12)" : i % 2 === 0 ? "transparent" : "rgba(22,26,31,0.5)",
                  borderLeft: isFlagged ? "2px solid var(--rust)" : "2px solid transparent",
                  transition: "background 100ms"
                }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: isAnomaly && isFlagged ? "var(--rust)" : "var(--static)" }}>{row.src}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)" }}>{row.dst}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: NONSTANDARD_PORTS.includes(row.port) ? (isFlagged ? "var(--rust)" : "rgba(201,85,47,0.7)") : "var(--static)" }}>{row.port}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)" }}>{row.proto}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: row.freq > 800 ? "var(--signal)" : "var(--static)", fontWeight: row.freq > 800 ? 600 : 400 }}>{row.freq}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Confirm banner */}
        {confirming && flaggedRow && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "var(--panel)", border: "1px solid var(--rust)", borderRadius: "4px", padding: "12px 16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", flex: 1, color: "var(--signal)" }}>
              Flag <span style={{ color: "var(--rust)" }}>{flaggedRow.src}:{flaggedRow.port}</span> as C2 beacon?
            </div>
            <button className="btn-rust" onClick={handleConfirm} disabled={loading} style={{ fontSize: "11px" }}>
              {loading ? "VERIFYING..." : "CONFIRM"}
            </button>
            <button className="btn-ghost" onClick={() => { setConfirming(false); setFlaggedRow(null); }} style={{ fontSize: "11px" }}>CANCEL</button>
          </motion.div>
        )}

        {error && <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--rust)" }}>{error}</div>}
      </div>

      {/* Beacon diagram */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", minWidth: "300px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", letterSpacing: "0.1em" }}>
          CONNECTION MAP
        </div>
        <BeaconDiagram flows={netflow} flaggedRow={flaggedRow} beaconFrequency={beaconFrequency} />
      </div>

      <style>{`@media(max-width:768px){div[style*="gridTemplateColumns: 1fr auto"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
