import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import socket from "../lib/socket";

export default function BroadcastBanner() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    function onBroadcast({ message, ts }) {
      const id = ts || Date.now();
      setMessages(prev => [...prev, { id, message }]);
      // Auto-dismiss after 15s
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== id));
      }, 15000);
    }
    socket.on("broadcast:message", onBroadcast);
    return () => socket.off("broadcast:message", onBroadcast);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, pointerEvents: "none" }}>
      <AnimatePresence>
        {messages.map(({ id, message }) => (
          <motion.div
            key={id}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{
              background: "var(--rust)",
              color: "var(--signal)",
              padding: "12px 24px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.05em",
              borderBottom: "1px solid rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              pointerEvents: "auto"
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>[BROADCAST]</span>
            {message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
