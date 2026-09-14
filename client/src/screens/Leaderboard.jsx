import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import socket from "../lib/socket";
import Timer from "../components/Timer";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    socket.connect();
    socket.emit("leaderboard:subscribe");
    socket.on("leaderboard:update", setTeams);
    return () => socket.off("leaderboard:update", setTeams);
  }, []);

  function fmtFinish(ts) {
    if (!ts) return "—";
    return new Date(ts).toTimeString().slice(0, 8);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--void)",
      display: "flex",
      flexDirection: "column",
      padding: "32px 48px"
    }}>
      {/* Header: countdown + title */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "40px" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--rust)", letterSpacing: "0.16em", marginBottom: "8px" }}>
            INCIDENT #ZD-2026 · TECHSIUM 2026 · HKBK ISE
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--signal)" }}>
            CYBER HEIST
          </h1>
        </div>
        <Timer size="xl" showLabel={true} />
      </div>

      {/* Leaderboard — FLIP-animated rows */}
      <div style={{ flex: 1 }}>
        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "60px 1fr 120px 160px",
          gap: "16px",
          padding: "0 20px 12px",
          borderBottom: "1px solid var(--hairline)",
          marginBottom: "0"
        }}>
          {["RANK","TEAM","SCORE","FINISH"].map(h => (
            <div key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", letterSpacing: "0.12em" }}>{h}</div>
          ))}
        </div>

        <LayoutGroup>
          <AnimatePresence initial={false}>
            {teams.map((team, i) => {
              const isTop3 = team.rank <= 3;
              return (
                <motion.div
                  key={team.teamCode}
                  layoutId={team.teamCode}
                  layout
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{
                    layout: { type: "spring", duration: 0.4, bounce: 0.1 },
                    opacity: { duration: 0.25, ease: [0.23,1,0.32,1] }
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 120px 160px",
                    gap: "16px",
                    padding: "20px",
                    borderBottom: "1px solid var(--hairline)",
                    borderLeft: isTop3 ? "3px solid var(--rust)" : "3px solid transparent",
                    alignItems: "center"
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(18px, 2.5vw, 28px)",
                    fontWeight: 700,
                    color: isTop3 ? "var(--rust)" : "var(--static)",
                    fontVariantNumeric: "tabular-nums"
                  }}>
                    {String(team.rank).padStart(2, "0")}
                  </div>

                  {/* Team name */}
                  <div>
                    <div style={{ fontSize: "clamp(18px, 2.5vw, 28px)", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--signal)", lineHeight: 1.15 }}>
                      {team.teamName}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)", letterSpacing: "0.06em", marginTop: "2px" }}>
                      {team.teamCode} · {team.completedStations.length}/6 stations
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(20px, 2.5vw, 32px)",
                    fontWeight: 500,
                    color: "var(--signal)",
                    fontVariantNumeric: "tabular-nums"
                  }}>
                    {team.score}
                    <span style={{ fontSize: "12px", color: "var(--static)", marginLeft: "4px" }}>pts</span>
                  </div>

                  {/* Finish timestamp */}
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "clamp(13px, 1.5vw, 18px)",
                    color: team.finishTime ? "var(--rust)" : "var(--static)",
                    fontVariantNumeric: "tabular-nums"
                  }}>
                    {fmtFinish(team.finishTime)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </LayoutGroup>

        {teams.length === 0 && (
          <div style={{
            padding: "60px 20px",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--static)",
            letterSpacing: "0.08em"
          }}>
            AWAITING TEAM REGISTRATIONS...
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "16px",
        borderTop: "1px solid var(--hairline)"
      }}>
        <img src="/hkbk-logo.png" alt="HKBK College" style={{ height: "28px", filter: "brightness(0.5)", objectFit: "contain" }} />
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", letterSpacing: "0.08em" }}>
          SCORING: 20 PTS/STATION · −3 PTS/HINT · TIEBREAK: FINISH TIME
        </div>
      </div>
    </div>
  );
}
