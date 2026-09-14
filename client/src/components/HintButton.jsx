import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import socket from "../lib/socket";
import { getStoredToken } from "../lib/session";

export default function HintButton({ station, hintsUsed = 0, onHintGranted }) {
  const [phase, setPhase] = useState("idle"); // idle | confirm | revealed
  const [hint, setHint] = useState("");

  function handleClick() {
    if (phase === "idle") setPhase("confirm");
    else if (phase === "confirm") {
      const token = getStoredToken();
      socket.emit("team:hint", { token, station });
      socket.once("team:hintGranted", ({ hint: h, team }) => {
        setHint(h);
        setPhase("revealed");
        if (onHintGranted) onHintGranted(team);
      });
    }
  }

  function handleDismiss() { setPhase("idle"); setHint(""); }

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 100 }}>
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.button
            key="idle"
            onClick={handleClick}
            className="btn-ghost"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ fontSize: "11px", letterSpacing: "0.08em" }}
          >
            HINT {hintsUsed > 0 && <span style={{ color: "var(--rust)", marginLeft: "6px" }}>−{hintsUsed * 3}pts</span>}
          </motion.button>
        )}

        {phase === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--rust)",
              borderRadius: "6px",
              padding: "16px 20px",
              maxWidth: "280px",
              textAlign: "right"
            }}
          >
            <div style={{ fontSize: "12px", color: "var(--static)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
              [COST WARNING]
            </div>
            <div style={{ fontSize: "13px", color: "var(--signal)", marginBottom: "12px", lineHeight: 1.5 }}>
              Requesting a hint deducts <span style={{ color: "var(--rust)", fontWeight: 700 }}>3 points</span> from your team score.
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={handleDismiss} style={{ fontSize: "11px" }}>CANCEL</button>
              <button className="btn-rust" onClick={handleClick} style={{ fontSize: "11px" }}>REVEAL HINT (−3)</button>
            </div>
          </motion.div>
        )}

        {phase === "revealed" && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--hairline)",
              borderRadius: "6px",
              padding: "16px 20px",
              maxWidth: "320px"
            }}
          >
            <div style={{ fontSize: "10px", color: "var(--rust)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", marginBottom: "8px" }}>
              [HINT UNLOCKED — −3 PTS]
            </div>
            <div style={{ fontSize: "13px", color: "var(--signal)", lineHeight: 1.6, marginBottom: "12px" }}>
              {hint}
            </div>
            <button className="btn-ghost" onClick={handleDismiss} style={{ fontSize: "11px" }}>DISMISS</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
