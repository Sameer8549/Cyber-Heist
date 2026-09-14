import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import socket from "../lib/socket";
import { getStoredToken } from "../lib/session";

function Chip({ value, type }) {
  const color = type === "pass" ? "#3a6" : type === "none" ? "#6B7178" : "#C9552F";
  return (
    <span style={{
      fontFamily: "var(--font-mono)",
      fontSize: "10px",
      padding: "2px 8px",
      borderRadius: "3px",
      border: `1px solid ${color}`,
      color,
      letterSpacing: "0.06em"
    }}>
      {value?.toUpperCase()}
    </span>
  );
}

// URL tooltip that also works on tap (mobile)
function URLTooltip({ displayURL, trueURL, highlight }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  // Highlight substituted char in the true URL
  function renderTrueURL(url) {
    if (!highlight || !trueURL) return url;
    // Find the differing char
    const idx = [...url].findIndex((c, i) => displayURL[i] !== url[i]);
    if (idx < 0) return url;
    return (
      <>
        {url.slice(0, idx)}
        <span style={{ color: "var(--rust)", fontWeight: 700, textDecoration: "underline" }}>{url[idx]}</span>
        {url.slice(idx + 1)}
      </>
    );
  }

  function show() {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  }
  function hide() {
    timeoutRef.current = setTimeout(() => setVisible(false), 200);
  }

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <a
        href="#"
        onClick={e => { e.preventDefault(); setVisible(v => !v); }}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          color: "var(--rust)",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          textDecoration: "underline",
          cursor: "pointer",
          letterSpacing: "0.04em"
        }}
      >
        {displayURL || trueURL}
      </a>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            onMouseEnter={show}
            onMouseLeave={hide}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--panel)",
              border: "1px solid var(--rust)",
              borderRadius: "4px",
              padding: "8px 12px",
              whiteSpace: "nowrap",
              zIndex: 50,
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)"
            }}
          >
            <div style={{ fontSize: "9px", color: "var(--static)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>TRUE URL</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--signal)" }}>
              {renderTrueURL(trueURL || displayURL)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

export default function Station3({ team, variant, onComplete }) {
  const [selectedEmail, setSelectedEmail] = useState(0);
  const [flagged, setFlagged] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const emails = variant.station3.emails;
  const email = emails[selectedEmail];

  function handleFlag() {
    if (!email.isPhishing) {
      setError("[!] ERROR: This email did not originate from a malicious domain.");
      return;
    }
    setConfirmed(true);
  }

  function handleConfirm() {
    setError("");
    setLoading(true);
    const token = getStoredToken();
    // Submit the typosquatted domain
    const from = email.from.split("@")[1];
    socket.emit("team:submit", { token, station: 3, answer: from });
    socket.once("team:result", ({ correct, message, team: updated }) => {
      setLoading(false);
      if (correct) onComplete(updated);
      else setError(message);
    });
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Webmail chrome */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 0 }}>

        {/* Email list */}
        <div style={{ borderRight: "1px solid var(--hairline)", overflow: "auto" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--hairline)", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", letterSpacing: "0.1em" }}>
            INBOX — {emails.length} MESSAGES
          </div>
          {emails.map((em, i) => (
            <div
              key={em.id}
              onClick={() => { setSelectedEmail(i); setError(""); setConfirmed(false); }}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--hairline)",
                cursor: "pointer",
                background: selectedEmail === i ? "var(--panel)" : "transparent",
                borderLeft: `3px solid ${selectedEmail === i ? "var(--rust)" : "transparent"}`,
                transition: "background 150ms, border-color 150ms"
              }}
            >
              <div style={{ fontSize: "12px", color: "var(--signal)", fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {em.fromDisplay}
              </div>
              <div style={{ fontSize: "11px", color: "var(--static)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {em.subject}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)" }}>{em.timestamp}</div>
            </div>
          ))}
        </div>

        {/* Email body + inspector */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Body */}
          <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
            <div style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--hairline)" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>{email.subject}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--static)" }}>
                From: <span style={{ color: "var(--signal)" }}>{email.fromDisplay}</span> &lt;{email.from}&gt;
              </div>
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--static)", whiteSpace: "pre-wrap" }}>
              {email.body.split("\n").map((line, i) => {
                if (line.startsWith("https://")) {
                  return (
                    <div key={i}>
                      <URLTooltip
                        displayURL={email.displayURL || line}
                        trueURL={email.trueURL || line}
                        highlight={email.isPhishing}
                      />
                    </div>
                  );
                }
                return <div key={i}>{line || <br />}</div>;
              })}
            </div>
          </div>

          {/* Header inspector */}
          <div style={{ borderTop: "1px solid var(--hairline)", padding: "12px 24px", background: "var(--panel)" }}>
            <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--static)", letterSpacing: "0.1em", marginBottom: "10px" }}>
              EMAIL AUTHENTICATION HEADERS
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)" }}>SPF</span>
              <Chip value={email.spf} type={email.spf} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", marginLeft: "8px" }}>DKIM</span>
              <Chip value={email.dkim} type={email.dkim} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--static)", marginLeft: "8px" }}>DMARC</span>
              <Chip value={email.dmarc} type={email.dmarc} />

              {/* Flag action */}
              <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                {!confirmed ? (
                  <button className="btn-ghost" onClick={handleFlag} style={{ fontSize: "11px", color: "var(--rust)", borderColor: "var(--rust)" }}>
                    FLAG AS PHISHING
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ display: "flex", gap: "8px", alignItems: "center" }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--signal)" }}>
                      Flag: <span style={{ color: "var(--rust)" }}>{email.from.split("@")[1]}</span>
                    </span>
                    <button className="btn-rust" onClick={handleConfirm} disabled={loading} style={{ fontSize: "11px" }}>
                      {loading ? "VERIFYING..." : "CONFIRM"}
                    </button>
                    <button className="btn-ghost" onClick={() => setConfirmed(false)} style={{ fontSize: "11px" }}>CANCEL</button>
                  </motion.div>
                )}
              </div>
            </div>
            {error && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--rust)", marginTop: "8px" }}>{error}</div>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){div[style*="gridTemplateColumns: 260px"]{grid-template-columns:1fr!important;}.email-list{border-right:none!important;border-bottom:1px solid var(--hairline)}}`}</style>
    </div>
  );
}
