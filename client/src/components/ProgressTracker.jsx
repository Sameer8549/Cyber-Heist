import { motion } from "framer-motion";

const STATION_LABELS = ["S1", "S2", "S3", "S4", "S5", "S6"];

// Lock glyph — SVG
function LockIcon() {
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
      <rect x="1" y="5" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export default function ProgressTracker({ completedStations = [], currentStation = 1 }) {
  return (
    <div style={{
      display: "flex",
      gap: "6px",
      alignItems: "center"
    }} role="list" aria-label="Station progress">
      {STATION_LABELS.map((label, i) => {
        const stationNum = i + 1;
        const isDone = completedStations.includes(stationNum);
        const isCurrent = currentStation === stationNum;
        const isLocked = !isDone && !isCurrent;

        return (
          <motion.div
            key={stationNum}
            role="listitem"
            aria-label={`Station ${stationNum}: ${isDone ? "complete" : isCurrent ? "active" : "locked"}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{
              width: "36px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "3px",
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
              fontWeight: 500,
              position: "relative",
              background: isDone
                ? "var(--rust)"
                : isCurrent
                  ? "transparent"
                  : "transparent",
              border: isDone
                ? "1px solid var(--rust)"
                : isCurrent
                  ? "1px solid var(--rust)"
                  : "1px solid var(--hairline)",
              color: isDone
                ? "var(--signal)"
                : isCurrent
                  ? "var(--rust)"
                  : "var(--static)",
              opacity: isLocked ? 0.5 : 1
            }}
          >
            {isLocked ? <LockIcon /> : label}
          </motion.div>
        );
      })}
    </div>
  );
}
