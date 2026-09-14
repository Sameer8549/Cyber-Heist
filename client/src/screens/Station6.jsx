import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import socket from "../lib/socket";
import { getStoredToken } from "../lib/session";

export default function Station6({ team, variant, onComplete }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cracked, setCracked] = useState(false);
  const [finishTime, setFinishTime] = useState(null);
  const confettiFired = useRef(false);

  // Fire confetti — orchestrated moment 5 — single restrained burst
  async function fireConfetti() {
    if (confettiFired.current) return;
    confettiFired.current = true;
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#C9552F", "#E8EAED", "#8A3920", "#ffffff"],
      gravity: 0.9,
      scalar: 0.9,
      ticks: 200
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!key.trim()) return;
    setError("");
    setLoading(true);
    const token = getStoredToken();
    socket.emit("team:submit", { token, station: 6, answer: key.trim() });
    socket.once("team:result", ({ correct, message, team: updated }) => {
      setLoading(false);
      if (correct) {
        const ts = updated.finishTime || Date.now();
        setFinishTime(ts);
        setCracked(true);
        fireConfetti();
        onComplete(updated);
      } else {
        setError(message);
      }
    });
  }

  const fragments = team.fragments || [];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: "40px" }}>

      {/* Fragment chain */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        {[0,1,2,3,4].map(i => {
          const frag = fragments[i];
          const isFilled = Boolean(frag);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.25, ease: [0.23,1,0.32,1] }}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                padding: "8px 14px",
                borderRadius: "4px",
                border: `1px solid ${isFilled ? "var(--rust)" : "var(--hairline)"}`,
                background: isFilled ? "rgba(201,85,47,0.1)" : "var(--panel)",
                color: isFilled ? "var(--rust)" : "var(--static)",
                letterSpacing: "0.06em",
                minWidth: "80px",
                textAlign: "center"
              }}>
                {isFilled ? frag : `F${i+1}`}
              </div>
              {i < 4 && (
                <div style={{ color: "var(--hairline)", fontSize: "18px", fontFamily: "var(--font-mono)" }}>—</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Vault state */}
      <AnimatePresence mode="wait">
        {!cracked ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.23,1,0.32,1] }}
            style={{ width: "100%", maxWidth: "560px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)", letterSpacing: "0.1em", textAlign: "center" }}>
              VAULT KEYPAD — MASTER DECRYPTION KEY
            </div>

            {/* Vault keypad readout */}
            <form onSubmit={handleSubmit}>
              <div style={{
                background: "var(--void)",
                border: `1px solid ${error ? "var(--rust)" : "var(--hairline)"}`,
                borderRadius: "6px",
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px"
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--rust)" }}>▶</div>
                <input
                  type="text"
                  value={key}
                  onChange={e => { setKey(e.target.value); setError(""); }}
                  placeholder="F1-F2-F3-F4-F5"
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(14px, 2vw, 20px)",
                    color: "var(--signal)",
                    letterSpacing: "0.1em",
                    outline: "none",
                    fontVariantNumeric: "tabular-nums"
                  }}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--rust)", marginBottom: "12px", letterSpacing: "0.04em" }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                className="btn-rust"
                disabled={loading || !key.trim()}
                style={{ width: "100%", padding: "16px", fontSize: "14px", letterSpacing: "0.12em" }}
              >
                {loading ? "DECRYPTING..." : "SUBMIT DECRYPTION KEY"}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="cracked"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.23,1,0.32,1] }}
            style={{
              width: "100%",
              maxWidth: "560px",
              background: "var(--panel)",
              border: "1px solid var(--rust)",
              borderRadius: "8px",
              padding: "40px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              alignItems: "center"
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--rust)", letterSpacing: "0.14em" }}>
              [✓] VAULT CRACKED — DECRYPTION SUCCESSFUL
            </div>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 32px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--signal)" }}>
              FINISH TIME LOCKED
            </h2>
            {finishTime && (
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: "15px",
                color: "var(--rust)",
                letterSpacing: "0.06em",
                fontVariantNumeric: "tabular-nums"
              }}>
                {new Date(finishTime).toISOString().replace("T", " ").slice(0, -1)}Z
              </div>
            )}
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--static)", lineHeight: 1.6 }}>
              The ISE department vault has been decrypted.<br/>
              Grade records and research databases are restored.<br/>
              Incident Reference: ZD-2026 — RESOLVED.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
