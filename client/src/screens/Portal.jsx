import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import socket from "../lib/socket";
import { setStoredToken, setStoredTeamCode, getStoredToken } from "../lib/session";

// Typewriter hook — orchestrated moment 1
function useTypewriter(text, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return { displayed, done };
}

// Live elapsed time since incident "00:00:00 ago"
function useElapsedTicker() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const STATUS_TEXT = "INCIDENT #ZD-2026 · DETECTED";

export default function Portal() {
  const navigate = useNavigate();
  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const { displayed: statusLine, done: typeDone } = useTypewriter(STATUS_TEXT, 45);
  const elapsed = useElapsedTicker();

  // Reconnect on mount, try session restore
  useEffect(() => {
    socket.connect();
    const token = getStoredToken();
    if (token) {
      socket.emit("team:join", { token });
      socket.once("team:joined", ({ team, variant, token: newToken }) => {
        setStoredToken(newToken);
        setStoredTeamCode(team.teamCode);
        navigate("/terminal", { state: { team, variant } });
      });
    }
    return () => {
      socket.off("team:joined");
      socket.off("team:error");
    };
  }, []);

  function handleJoin(e) {
    e.preventDefault();
    if (!teamCode.trim()) { setError("Team code required"); return; }
    setError("");
    setLoading(true);
    socket.emit("team:join", { teamCode: teamCode.toUpperCase().trim(), teamName: teamName.trim() || teamCode.toUpperCase().trim() });
    socket.once("team:joined", ({ team, variant, token }) => {
      setStoredToken(token);
      setStoredTeamCode(team.teamCode);
      setLoading(false);
      navigate("/terminal", { state: { team, variant } });
    });
    socket.once("team:error", (msg) => {
      setError(msg);
      setLoading(false);
    });
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--void)",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Left — Briefing */}
      <div style={{ padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          {/* Status line — orchestrated moment 1: types itself, then counter starts */}
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "0.12em",
            color: "var(--rust)",
            marginBottom: "64px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "16px"
          }}>
            <span>{statusLine}</span>
            {typeDone && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                {elapsed} AGO
              </motion.span>
            )}
            {!typeDone && <span style={{ animation: "blink 1s step-end infinite", color: "var(--rust)" }}>█</span>}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <h1 style={{
              fontSize: "clamp(42px, 5vw, 72px)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              marginBottom: "32px",
              color: "var(--signal)"
            }}>
              CYBER<br />HEIST
            </h1>
            <p style={{
              fontSize: "15px",
              lineHeight: 1.75,
              color: "var(--static)",
              maxWidth: "52ch",
              marginBottom: "16px"
            }}>
              The ISE Department server infrastructure has been compromised by ransomware attributed
              to the Zero-Day Collective. Grade records, research databases and academic vaults
              are encrypted.
            </p>
            <p style={{
              fontSize: "15px",
              lineHeight: 1.75,
              color: "var(--static)",
              maxWidth: "52ch"
            }}>
              Your unit has 60 minutes to work through six investigative stations, recover five
              key fragments and assemble the master decryption key. Every hint costs three points.
              Rank is determined by score, then finish time, then fewest hints.
            </p>
          </motion.div>
        </div>

        {/* HKBK Logo + attribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{ display: "flex", alignItems: "center", gap: "16px" }}
        >
          <img
            src="/hkbk-logo.png"
            alt="HKBK College of Engineering"
            style={{ height: "40px", objectFit: "contain", filter: "brightness(0.7)" }}
          />
          <span style={{
            fontSize: "11px",
            color: "var(--static)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
            lineHeight: 1.5
          }}>
            HKBK College of Engineering<br />
            ISE Department · Techsium 2026
          </span>
        </motion.div>
      </div>

      {/* Right — Team Access panel (vertically offset — asymmetric) */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 56px",
        paddingTop: "128px" // vertical offset — asymmetric per spec
      }}>
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            borderRadius: "6px",
            padding: "40px",
            width: "100%",
            maxWidth: "360px"
          }}
        >
          <div style={{
            fontSize: "10px",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.14em",
            color: "var(--static)",
            marginBottom: "24px"
          }}>
            INCIDENT RESPONSE UNIT — AUTHENTICATION
          </div>

          <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label htmlFor="teamCode" style={{ fontSize: "11px", color: "var(--static)", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", display: "block", marginBottom: "6px" }}>
                TEAM CODE
              </label>
              <input
                id="teamCode"
                ref={inputRef}
                type="text"
                placeholder="TEAM-████"
                value={teamCode}
                onChange={e => setTeamCode(e.target.value.toUpperCase())}
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--void)",
                  border: `1px solid ${error ? "var(--rust)" : "var(--hairline)"}`,
                  borderRadius: "4px",
                  color: "var(--signal)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "15px",
                  letterSpacing: "0.1em"
                }}
              />
            </div>
            <div>
              <label htmlFor="teamName" style={{ fontSize: "11px", color: "var(--static)", letterSpacing: "0.08em", fontFamily: "var(--font-mono)", display: "block", marginBottom: "6px" }}>
                TEAM NAME <span style={{ opacity: 0.5 }}>(optional)</span>
              </label>
              <input
                id="teamName"
                type="text"
                placeholder="e.g. Ghost Protocol"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--void)",
                  border: "1px solid var(--hairline)",
                  borderRadius: "4px",
                  color: "var(--signal)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px"
                }}
              />
            </div>

            {error && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--rust)", letterSpacing: "0.04em" }}>
                [!] {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-rust"
              disabled={loading}
              style={{ marginTop: "8px", width: "100%", padding: "14px", fontSize: "13px", letterSpacing: "0.1em" }}
            >
              {loading ? "AUTHENTICATING..." : "ACCESS TERMINAL"}
            </button>
          </form>

          {/* Hairline divider + Coordinator ghost link */}
          <div style={{ borderTop: "1px solid var(--hairline)", marginTop: "28px", paddingTop: "20px" }}>
            <a
              href="/coordinator"
              style={{
                fontSize: "11px",
                color: "var(--static)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                display: "block",
                textAlign: "center",
                transition: "color 150ms ease",
              }}
              onMouseOver={e => e.target.style.color = "var(--signal)"}
              onMouseOut={e => e.target.style.color = "var(--static)"}
            >
              COORDINATOR CONSOLE →
            </a>
          </div>
        </motion.div>
      </div>

      {/* Vertical hairline divider */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: "10%",
        bottom: "10%",
        width: "1px",
        background: "var(--hairline)"
      }} />

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
