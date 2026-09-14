import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import socket from "../lib/socket";
import Timer from "../components/Timer";
import ProgressTracker from "../components/ProgressTracker";

export default function Coordinator() {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinError, setPinError] = useState("");
  const [teams, setTeams] = useState([]);
  const [broadcast, setBroadcast] = useState("");
  const [newTeamCode, setNewTeamCode] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [addError, setAddError] = useState("");
  const [timerRunning, setTimerRunning] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.on("coord:authed", ({ teams: t, timer }) => {
      setAuthed(true);
      setTeams(t);
      setTimerRunning(timer.running);
    });
    socket.on("coord:authFailed", () => setPinError("[!] INVALID PIN. Access Denied."));
    socket.on("coord:teamUpdate", setTeams);
    socket.on("coord:teamAdded", (team) => setTeams(prev => [...prev, team]));
    socket.on("coord:error", msg => setAddError(msg));
    socket.on("timer:sync", ({ running }) => setTimerRunning(running));
    return () => {
      socket.off("coord:authed"); socket.off("coord:authFailed");
      socket.off("coord:teamUpdate"); socket.off("coord:teamAdded");
      socket.off("coord:error"); socket.off("timer:sync");
    };
  }, []);

  function handlePinSubmit(e) {
    e.preventDefault();
    socket.emit("coord:auth", { pin });
  }

  function handleTimer(action) {
    socket.emit("coord:timer", { action });
  }

  function handleBroadcast(e) {
    e.preventDefault();
    if (!broadcast.trim()) return;
    socket.emit("coord:broadcast", { message: broadcast.trim() });
    setBroadcast("");
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 2000);
  }

  function handleAddTeam(e) {
    e.preventDefault();
    if (!newTeamCode.trim()) return;
    setAddError("");
    socket.emit("coord:addTeam", { teamCode: newTeamCode.toUpperCase().trim(), teamName: newTeamName.trim() || newTeamCode.toUpperCase().trim() });
    setNewTeamCode(""); setNewTeamName("");
  }

  function forceComplete(teamCode, station) {
    socket.emit("coord:forceComplete", { teamCode, station });
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--void)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.23,1,0.32,1] }}
          style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "6px", padding: "40px", width: "360px" }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--rust)", letterSpacing: "0.14em", marginBottom: "24px" }}>
            COORDINATOR CONSOLE — RESTRICTED ACCESS
          </div>
          <form onSubmit={handlePinSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label htmlFor="coordPin" style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.1em" }}>
              AUTHENTICATION PIN
            </label>
            <input
              id="coordPin"
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError(""); }}
              placeholder="enter PIN"
              autoFocus
              style={{
                padding: "12px 14px",
                background: "var(--void)",
                border: `1px solid ${pinError ? "var(--rust)" : "var(--hairline)"}`,
                borderRadius: "4px",
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                color: "var(--signal)",
                letterSpacing: "0.1em"
              }}
            />
            {pinError && <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--rust)" }}>{pinError}</div>}
            <button type="submit" className="btn-rust" style={{ width: "100%", padding: "12px", fontSize: "12px", letterSpacing: "0.1em" }}>
              AUTHENTICATE
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--void)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "var(--panel)", borderBottom: "1px solid var(--hairline)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--rust)", letterSpacing: "0.1em" }}>COORDINATOR CONSOLE</div>
        <Timer size="lg" showLabel={true} />
        <div style={{ display: "flex", gap: "8px" }}>
          {!timerRunning
            ? <button className="btn-rust" onClick={() => handleTimer("start")} style={{ fontSize: "11px", padding: "8px 16px" }}>START</button>
            : <button className="btn-ghost" onClick={() => handleTimer("pause")} style={{ fontSize: "11px", padding: "8px 16px" }}>PAUSE</button>
          }
          <button className="btn-ghost" onClick={() => handleTimer("reset")} style={{ fontSize: "11px", padding: "8px 16px", color: "var(--rust)", borderColor: "var(--rust)" }}>RESET</button>
        </div>
      </header>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", gap: "0", minHeight: 0 }}>

        {/* Main: team table */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", letterSpacing: "0.1em" }}>
            TEAMS — {teams.length} REGISTERED
          </div>

          <div style={{ background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "4px", overflow: "hidden" }}>
            {/* Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "120px 140px 1fr 80px 60px auto",
              gap: "8px",
              padding: "8px 12px",
              borderBottom: "1px solid var(--hairline)",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--static)",
              letterSpacing: "0.08em"
            }}>
              <span>CODE</span><span>NAME</span><span>STATIONS</span><span>SCORE</span><span>HINTS</span><span>ACTION</span>
            </div>

            {teams.length === 0 && (
              <div style={{ padding: "24px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--static)", textAlign: "center" }}>
                No teams registered yet. Add teams using the panel on the right.
              </div>
            )}

            {teams.map((t, i) => (
              <div key={t.teamCode} style={{
                display: "grid",
                gridTemplateColumns: "120px 140px 1fr 80px 60px auto",
                gap: "8px",
                padding: "10px 12px",
                borderBottom: "1px solid var(--hairline)",
                alignItems: "center",
                background: i % 2 === 0 ? "transparent" : "rgba(22,26,31,0.5)"
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--signal)" }}>{t.teamCode}</span>
                <span style={{ fontSize: "12px", color: "var(--signal)" }}>{t.teamName}</span>
                <div>
                  <ProgressTracker completedStations={t.completedStations} currentStation={t.currentStation} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--signal)" }}>{t.score}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--static)" }}>{t.hintsUsed}</span>
                <button
                  className="btn-ghost"
                  onClick={() => forceComplete(t.teamCode, t.currentStation)}
                  style={{ fontSize: "10px", padding: "4px 10px", whiteSpace: "nowrap" }}
                >
                  FORCE S{t.currentStation}
                </button>
              </div>
            ))}
          </div>

          {/* Add team */}
          <form onSubmit={handleAddTeam} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.08em", marginBottom: "4px" }}>CODE</div>
              <input
                type="text"
                placeholder="TEAM-0001"
                value={newTeamCode}
                onChange={e => { setNewTeamCode(e.target.value.toUpperCase()); setAddError(""); }}
                style={{ width: "130px", padding: "8px 12px", background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "3px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--signal)" }}
              />
            </div>
            <div>
              <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.08em", marginBottom: "4px" }}>NAME</div>
              <input
                type="text"
                placeholder="Team name"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                style={{ width: "160px", padding: "8px 12px", background: "var(--panel)", border: "1px solid var(--hairline)", borderRadius: "3px", fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--signal)" }}
              />
            </div>
            <button type="submit" className="btn-ghost" style={{ fontSize: "11px", alignSelf: "flex-end" }}>+ ADD TEAM</button>
            {addError && <div style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--rust)" }}>{addError}</div>}
          </form>
        </div>

        {/* Right sidebar: broadcast */}
        <div style={{ borderLeft: "1px solid var(--hairline)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", letterSpacing: "0.1em" }}>
            BROADCAST COMPOSER
          </div>
          <form onSubmit={handleBroadcast} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <textarea
              value={broadcast}
              onChange={e => setBroadcast(e.target.value)}
              placeholder="Message to all teams..."
              rows={4}
              style={{
                padding: "12px",
                background: "var(--void)",
                border: "1px solid var(--hairline)",
                borderRadius: "4px",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                color: "var(--signal)",
                resize: "vertical"
              }}
            />
            <button type="submit" className="btn-rust" disabled={!broadcast.trim()} style={{ fontSize: "12px", letterSpacing: "0.08em" }}>
              {broadcastSent ? "[✓] SENT" : "SEND TO ALL"}
            </button>
          </form>

          <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: "16px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", letterSpacing: "0.1em", marginBottom: "12px" }}>
              QUICK LINKS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <a href="/leaderboard" target="_blank" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)", letterSpacing: "0.06em", transition: "color 150ms" }}
                onMouseOver={e=>e.target.style.color="var(--signal)"} onMouseOut={e=>e.target.style.color="var(--static)"}>
                → PROJECTOR LEADERBOARD
              </a>
              <a href="/print/TEAM-0001" target="_blank" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)", letterSpacing: "0.06em", transition: "color 150ms" }}
                onMouseOver={e=>e.target.style.color="var(--signal)"} onMouseOut={e=>e.target.style.color="var(--static)"}>
                → PRINT POSTERS (/print/CODE)
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){div[style*="gridTemplateColumns: 1fr 360px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
