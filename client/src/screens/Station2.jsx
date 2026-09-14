import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import socket from "../lib/socket";
import { getStoredToken } from "../lib/session";

function caesarDecrypt(text, shift) {
  return text.split("").map(c => {
    if (c >= "A" && c <= "Z") return String.fromCharCode(((c.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
    if (c >= "a" && c <= "z") return String.fromCharCode(((c.charCodeAt(0) - 97 - shift + 26) % 26) + 97);
    return c;
  }).join("");
}

function getFrequency(text) {
  const freq = {};
  for (const c of text.toUpperCase()) {
    if (c >= "A" && c <= "Z") freq[c] = (freq[c] || 0) + 1;
  }
  return freq;
}

// Custom SVG Frequency Histogram — no D3
function FrequencyHistogram({ text, shift }) {
  const decrypted = caesarDecrypt(text, shift);
  const freq = useMemo(() => getFrequency(decrypted), [decrypted]);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const maxCount = Math.max(...Object.values(freq), 1);

  const W = 520, H = 100, barW = 14, barGap = 6;
  const totalW = letters.length * (barW + barGap);

  return (
    <svg
      viewBox={`0 0 ${totalW} ${H + 32}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
      role="img"
      aria-label="Letter frequency histogram"
    >
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map(p => (
        <line
          key={p}
          x1="0" y1={H - H * p}
          x2={totalW} y2={H - H * p}
          stroke="var(--static)" strokeOpacity="0.2" strokeWidth="0.5"
          strokeDasharray={p === 1 ? "0" : "2,3"}
        />
      ))}

      {/* Bars */}
      {letters.map((letter, i) => {
        const count = freq[letter] || 0;
        const h = count === 0 ? 0 : Math.max(3, (count / maxCount) * H);
        const x = i * (barW + barGap);
        return (
          <g key={letter}>
            <motion.rect
              x={x}
              y={H - h}
              width={barW}
              height={h}
              fill="var(--rust)"
              rx="1"
              initial={{ height: 0, y: H }}
              animate={{ height: h, y: H - h }}
              transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
            />
            <text
              x={x + barW / 2}
              y={H + 16}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="9"
              fill={count > 0 ? "var(--signal)" : "var(--static)"}
            >
              {letter}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Check if decrypted looks like the expected pattern
function isValidCode(text) {
  return /^OPERATION [A-Z]+ INITIATED$/.test(text.trim());
}

export default function Station2({ team, variant, onComplete }) {
  const [shift, setShift] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { station2: s2 } = variant;

  const decrypted = useMemo(() => caesarDecrypt(s2.ciphertext, shift), [s2.ciphertext, shift]);
  const valid = isValidCode(decrypted);

  // Extract operation code from decrypted
  const opCode = useMemo(() => {
    const m = decrypted.match(/^OPERATION ([A-Z]+) INITIATED$/);
    return m ? m[1] : null;
  }, [decrypted]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!valid || !opCode) return;
    setError("");
    setLoading(true);
    const token = getStoredToken();
    socket.emit("team:submit", { token, station: 2, answer: opCode });
    socket.once("team:result", ({ correct, message, team: updated }) => {
      setLoading(false);
      if (correct) onComplete(updated);
      else setError(message);
    });
  }

  return (
    <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" }}>

      {/* Intercepted ciphertext */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "6px", padding: "20px 24px" }}
      >
        <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.1em", marginBottom: "12px" }}>
          INTERCEPTED C2 CHANNEL — RAW TRANSMISSION
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(15px, 2.5vw, 24px)",
          color: "var(--rust)",
          letterSpacing: "0.12em",
          wordBreak: "break-all",
          lineHeight: 1.5
        }}>
          {s2.ciphertext}
        </div>
      </motion.div>

      {/* Frequency histogram — orchestrated moment 3 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "6px", padding: "20px 24px" }}
      >
        <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.1em", marginBottom: "16px" }}>
          LETTER FREQUENCY ANALYSIS — SHIFT: <span style={{ color: "var(--signal)" }}>{shift}</span>
        </div>
        <FrequencyHistogram text={s2.ciphertext} shift={shift} />
      </motion.div>

      {/* Shift slider */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
          CAESAR SHIFT
        </div>
        <input
          type="range"
          min="0"
          max="25"
          value={shift}
          onChange={e => { setShift(Number(e.target.value)); setError(""); }}
          style={{
            flex: 1,
            accentColor: "var(--rust)",
            height: "2px",
            cursor: "pointer"
          }}
          aria-label="Caesar shift value"
        />
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "20px",
          color: "var(--signal)",
          minWidth: "28px",
          textAlign: "right"
        }}>
          {shift}
        </div>
      </div>

      {/* Live decrypted preview */}
      <div style={{ background: "var(--panel)", border: `1px solid ${valid ? "var(--rust)" : "var(--hairline)"}`, borderRadius: "6px", padding: "16px 20px", transition: "border-color 200ms" }}>
        <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.1em", marginBottom: "8px" }}>
          DECRYPTED OUTPUT
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: "15px",
          color: valid ? "var(--signal)" : "var(--static)",
          letterSpacing: "0.06em",
          transition: "color 200ms"
        }}>
          {decrypted}
        </div>
        {valid && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--rust)", marginTop: "8px" }}
          >
            [✓] VALID TRANSMISSION FORMAT DETECTED — SUBMIT TO CONFIRM
          </motion.div>
        )}
      </div>

      {/* Submit */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--rust)", marginBottom: "12px" }}>{error}</div>
        )}
        <button
          type="submit"
          className="btn-rust"
          disabled={!valid || loading}
          style={{ fontSize: "12px", letterSpacing: "0.1em", opacity: valid ? 1 : 0.4, transition: "opacity 300ms" }}
        >
          {loading ? "VERIFYING..." : `SUBMIT OPERATION CODE${opCode ? `: ${opCode}` : ""}`}
        </button>
      </form>
    </div>
  );
}
