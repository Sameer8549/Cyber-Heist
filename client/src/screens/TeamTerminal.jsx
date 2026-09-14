import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import socket from "../lib/socket";
import { getStoredToken } from "../lib/session";
import Timer from "../components/Timer";
import ProgressTracker from "../components/ProgressTracker";
import BroadcastBanner from "../components/BroadcastBanner";
import HintButton from "../components/HintButton";
import Station1 from "./Station1";
import Station2 from "./Station2";
import Station3 from "./Station3";
import Station4 from "./Station4";
import Station5 from "./Station5";
import Station6 from "./Station6";

const STATION_COMPONENTS = { 1: Station1, 2: Station2, 3: Station3, 4: Station4, 5: Station5, 6: Station6 };
const STATION_NAMES = { 1: "WORKSTATION AUDIT", 2: "CRYPTOGRAPHIC INTERCEPT", 3: "PHISHING FORENSICS", 4: "SERVER FORENSICS", 5: "NETWORK ANALYSIS", 6: "THE VAULT" };

export default function TeamTerminal() {
  const location = useLocation();
  const navigate = useNavigate();
  const [team, setTeam] = useState(location.state?.team || null);
  const [variant, setVariant] = useState(location.state?.variant || null);

  useEffect(() => {
    if (!team) { navigate("/"); return; }
    socket.connect();

    // Listen for force-complete from coordinator
    function onForceCompleted({ team: updated, station }) {
      setTeam(updated);
    }
    socket.on("team:forceCompleted", onForceCompleted);

    return () => socket.off("team:forceCompleted", onForceCompleted);
  }, []);

  if (!team || !variant) return null;

  const CurrentStation = STATION_COMPONENTS[team.currentStation] || Station1;

  function onStationComplete(updatedTeam) {
    setTeam(updatedTeam);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--void)", display: "flex", flexDirection: "column" }}>
      <BroadcastBanner />

      {/* Top bar */}
      <header style={{
        background: "var(--panel)",
        borderBottom: "1px solid var(--hairline)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        {/* Team identity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--signal)" }}>
            {team.teamName}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)", letterSpacing: "0.08em" }}>
            {team.teamCode}
          </div>
        </div>

        {/* Countdown — largest element */}
        <Timer size="lg" showLabel={true} />

        {/* Progress tracker */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
          <div style={{ fontSize: "10px", letterSpacing: "0.12em", color: "var(--static)", fontFamily: "var(--font-mono)" }}>
            STATIONS
          </div>
          <ProgressTracker completedStations={team.completedStations} currentStation={team.currentStation} />
        </div>

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 500, color: "var(--signal)", letterSpacing: "0.04em" }}>
            {team.score}<span style={{ fontSize: "14px", color: "var(--static)" }}>pts</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)" }}>
            {team.hintsUsed} hint{team.hintsUsed !== 1 ? "s" : ""}
          </div>
        </div>
      </header>

      {/* Station label */}
      <div style={{
        padding: "16px 24px 0",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--rust)", letterSpacing: "0.14em" }}>
          STATION {String(team.currentStation).padStart(2,"0")} — {STATION_NAMES[team.currentStation]}
        </div>
      </div>

      {/* Station content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={team.currentStation}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <CurrentStation
              team={team}
              variant={variant}
              onComplete={onStationComplete}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      <HintButton
        station={team.currentStation}
        hintsUsed={team.hintsUsed}
        onHintGranted={setTeam}
      />
    </div>
  );
}
