import { useState, useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import socket from "../lib/socket";

function fmt(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(n => String(n).padStart(2, "0")).join(":");
}

export default function Timer({ size = "md", showLabel = false }) {
  const [remaining, setRemaining] = useState(3600000);
  const [running, setRunning] = useState(false);
  const controls = useAnimationControls();
  const intervalRef = useRef(null);
  const lastSyncRef = useRef({ remainingMs: 3600000, running: false, receivedAt: Date.now() });

  useEffect(() => {
    function onSync({ remainingMs, running: r }) {
      lastSyncRef.current = { remainingMs, running: r, receivedAt: Date.now() };
      setRemaining(remainingMs);
      setRunning(r);
    }
    socket.on("timer:sync", onSync);
    return () => socket.off("timer:sync", onSync);
  }, []);

  // Interpolate locally between syncs for smooth display
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (running) {
      intervalRef.current = setInterval(() => {
        const { remainingMs, receivedAt } = lastSyncRef.current;
        const elapsed = Date.now() - receivedAt;
        setRemaining(Math.max(0, remainingMs - elapsed));
      }, 100);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Orchestrated moment: slow rust pulse ONLY in final 5 minutes
  const isCritical = remaining > 0 && remaining <= 5 * 60 * 1000;

  useEffect(() => {
    if (isCritical && running) {
      controls.start({
        opacity: [1, 0.6, 1],
        transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
      });
    } else {
      controls.stop();
      controls.set({ opacity: 1 });
    }
  }, [isCritical, running]);

  const sizes = {
    sm:  { fontSize: "22px", letterSpacing: "0.04em" },
    md:  { fontSize: "36px", letterSpacing: "0.05em" },
    lg:  { fontSize: "72px", letterSpacing: "0.06em" },
    xl:  { fontSize: "112px", letterSpacing: "0.06em" }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      {showLabel && (
        <div style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--static)", fontFamily: "var(--font-mono)", marginBottom: "4px", textTransform: "uppercase" }}>
          ARENA COUNTDOWN
        </div>
      )}
      <motion.div
        animate={controls}
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 500,
          color: isCritical ? "var(--rust)" : "var(--signal)",
          transition: "color 800ms ease",
          ...sizes[size],
          lineHeight: 1
        }}
      >
        {fmt(remaining)}
      </motion.div>
    </div>
  );
}
