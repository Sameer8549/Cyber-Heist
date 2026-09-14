import { useState } from "react";
import { motion } from "framer-motion";
import socket from "../lib/socket";
import { getStoredToken } from "../lib/session";

// Flat SVG illustrations — not photos
function EmployeeBadge({ name, year }) {
  return (
    <svg viewBox="0 0 220 140" width="220" height="140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Employee badge">
      <rect x="1" y="1" width="218" height="138" rx="6" stroke="#C9552F" strokeWidth="1.5" fill="#161A1F"/>
      <rect x="12" y="12" width="40" height="44" rx="3" fill="#0D0F12" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      {/* Simple person icon */}
      <circle cx="32" cy="26" r="7" fill="rgba(255,255,255,0.15)"/>
      <path d="M19 50c0-7 6-12 13-12s13 5 13 12" fill="rgba(255,255,255,0.15)"/>
      <rect x="62" y="14" width="148" height="2" rx="1" fill="rgba(255,255,255,0.1)"/>
      <text x="62" y="34" fontFamily="monospace" fontSize="13" fontWeight="700" fill="#E8EAED">{name}</text>
      <text x="62" y="50" fontFamily="monospace" fontSize="10" fill="#6B7178">ISE Department</text>
      <text x="62" y="66" fontFamily="monospace" fontSize="10" fill="#6B7178">Joined: {year}</text>
      <rect x="12" y="90" width="196" height="1" fill="rgba(255,255,255,0.08)"/>
      <text x="12" y="112" fontFamily="monospace" fontSize="9" fill="#C9552F" letterSpacing="3">HKBK COLLEGE OF ENGINEERING</text>
      <text x="12" y="126" fontFamily="monospace" fontSize="9" fill="#6B7178">ACCESS LEVEL: ADMIN</text>
    </svg>
  );
}

function StickyNote({ pet }) {
  return (
    <svg viewBox="0 0 200 120" width="200" height="120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sticky note">
      <rect width="200" height="120" rx="2" fill="#2a2408" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <text x="16" y="32" fontFamily="monospace" fontSize="11" fill="#a09060" style={{fontStyle:"italic"}}>Remember:</text>
      <text x="16" y="56" fontFamily="monospace" fontSize="11" fill="#c8b87a">"{pet}'s adoption day</text>
      <text x="16" y="74" fontFamily="monospace" fontSize="11" fill="#c8b87a"> was everything."</text>
      <text x="16" y="104" fontFamily="monospace" fontSize="9" fill="#6B7178">— sticky note from desk</text>
    </svg>
  );
}

function CalendarPage({ year, specialChar }) {
  return (
    <svg viewBox="0 0 200 140" width="200" height="140" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Calendar page">
      <path d="M0 0 L200 0 L200 140 L30 140 L0 110 Z" fill="#161A1F" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <path d="M0 110 L30 140 L30 110 Z" fill="rgba(255,255,255,0.04)"/>
      <text x="12" y="30" fontFamily="monospace" fontSize="9" fill="#6B7178" letterSpacing="2">MARCH {year}</text>
      <rect x="12" y="36" width="176" height="1" fill="rgba(255,255,255,0.06)"/>
      {/* Calendar grid simplified */}
      {["M","T","W","T","F","S","S"].map((d,i) => (
        <text key={i} x={16 + i*24} y="54" fontFamily="monospace" fontSize="9" fill="#6B7178">{d}</text>
      ))}
      {/* Corner pin with special char */}
      <circle cx="176" cy="20" r="12" fill="#0D0F12" stroke="#C9552F" strokeWidth="1.5"/>
      <text x="176" y="25" fontFamily="monospace" fontSize="14" fontWeight="700" fill="#C9552F" textAnchor="middle">{specialChar}</text>
      <text x="12" y="120" fontFamily="monospace" fontSize="9" fill="#6B7178">pinned character</text>
    </svg>
  );
}

export default function Station1({ team, variant, onComplete }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { station1: s1 } = variant;

  function handleSubmit(e) {
    e.preventDefault();
    if (!password) return;
    setError("");
    setLoading(true);
    const token = getStoredToken();
    socket.emit("team:submit", { token, station: 1, answer: password });
    socket.once("team:result", ({ correct, message, team: updated }) => {
      setLoading(false);
      if (correct) {
        onComplete(updated);
      } else {
        setError(message);
      }
    });
  }

  return (
    <div style={{
      flex: 1,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0",
      padding: "24px"
    }}>
      {/* Left: Physical evidence */}
      <div style={{ paddingRight: "32px", borderRight: "1px solid var(--hairline)", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.1em", marginBottom: "4px" }}>
          PHYSICAL EVIDENCE — RECOVERED ARTEFACTS
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3, ease: [0.23,1,0.32,1] }}>
          <div style={{ fontSize: "10px", color: "var(--static)", fontFamily: "var(--font-mono)", marginBottom: "10px", letterSpacing: "0.08em" }}>
            ARTEFACT 01 — EMPLOYEE BADGE
          </div>
          <EmployeeBadge name={s1.adminName} year={s1.joinYear} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3, ease: [0.23,1,0.32,1] }}>
          <div style={{ fontSize: "10px", color: "var(--static)", fontFamily: "var(--font-mono)", marginBottom: "10px", letterSpacing: "0.08em" }}>
            ARTEFACT 02 — DESK STICKY NOTE
          </div>
          <StickyNote pet={s1.petMoniker} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3, ease: [0.23,1,0.32,1] }}>
          <div style={{ fontSize: "10px", color: "var(--static)", fontFamily: "var(--font-mono)", marginBottom: "10px", letterSpacing: "0.08em" }}>
            ARTEFACT 03 — DESK CALENDAR
          </div>
          <CalendarPage year={s1.joinYear} specialChar={s1.specialChar} />
        </motion.div>
      </div>

      {/* Right: Locked terminal */}
      <div style={{ paddingLeft: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: [0.23,1,0.32,1] }}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--hairline)",
            borderRadius: "6px",
            padding: "32px",
            maxWidth: "380px"
          }}
        >
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--rust)", letterSpacing: "0.1em", marginBottom: "8px" }}>
            WORKSTATION ACCESS TERMINAL
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--static)", marginBottom: "24px", lineHeight: 1.6 }}>
            $ sudo authenticate --user admin<br/>
            <span style={{ color: "var(--rust)" }}>⚠ Password required to continue</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label htmlFor="adminPassword" style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
                ADMINISTRATOR PASSWORD
              </label>
              <input
                id="adminPassword"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="enter password"
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--void)",
                  border: `1px solid ${error ? "var(--rust)" : "var(--hairline)"}`,
                  borderRadius: "4px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "14px",
                  color: "var(--signal)",
                  letterSpacing: "0.08em"
                }}
              />
              {/* Inline error — never a toast */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.23,1,0.32,1] }}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--rust)", marginTop: "8px", letterSpacing: "0.04em" }}
                >
                  {error}
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              className="btn-rust"
              disabled={loading || !password}
              style={{ width: "100%", marginTop: "8px", letterSpacing: "0.1em", fontSize: "12px" }}
            >
              {loading ? "AUTHENTICATING..." : "UNLOCK TERMINAL"}
            </button>
          </form>

          <div style={{ marginTop: "20px", padding: "12px", background: "var(--void)", borderRadius: "3px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)", lineHeight: 1.7 }}>
            Pattern: [firstname][joinyear][petname][special]
          </div>
        </motion.div>
      </div>

      {/* Responsive */}
      <style>{`@media(max-width:768px){div[style*="gridTemplateColumns"]{grid-template-columns:1fr!important;}div[style*="paddingRight"]{padding-right:0!important;border-right:none!important;border-bottom:1px solid var(--hairline);padding-bottom:24px}div[style*="paddingLeft"]{padding-left:0!important;padding-top:24px}}`}</style>
    </div>
  );
}
