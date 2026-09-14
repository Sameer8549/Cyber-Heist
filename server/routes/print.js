"use strict";
const express = require("express");
const router = express.Router();
const { generateVariant } = require("../engine/seed");

// GET /print/:teamCode — A4 printable station posters + team badge
router.get("/:teamCode", (req, res) => {
  const teamCode = req.params.teamCode.toUpperCase().trim();
  const v = generateVariant(teamCode);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CYBER HEIST — ${teamCode} Print Pack</title>
<style>
  @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap");
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'JetBrains Mono', monospace; background: #fff; color: #111; }
  .page { width: 210mm; min-height: 297mm; padding: 20mm; page-break-after: always; position: relative; }
  .badge { border: 3px solid #C9552F; padding: 12mm; margin-bottom: 8mm; }
  .badge-title { font-size: 28pt; font-weight: 700; color: #C9552F; letter-spacing: -1px; }
  .badge-code { font-size: 48pt; font-weight: 700; letter-spacing: 4px; margin: 4mm 0; }
  .badge-event { font-size: 11pt; color: #444; }
  .station { border: 1px solid #ccc; padding: 10mm; margin-top: 8mm; }
  .station-header { font-size: 10pt; color: #C9552F; font-weight: 700; letter-spacing: 2px; margin-bottom: 4mm; }
  .station-title { font-size: 16pt; font-weight: 700; margin-bottom: 3mm; }
  .station-body { font-size: 10pt; line-height: 1.7; }
  .evidence { background: #f5f5f5; padding: 4mm; margin: 3mm 0; border-left: 3px solid #C9552F; }
  .cipher { font-size: 13pt; font-weight: 700; letter-spacing: 3px; word-break: break-all; }
  h3 { font-size: 12pt; margin: 3mm 0 1mm; }
  @media print {
    .page { page-break-after: always; }
  }
</style>
</head>
<body>

<!-- ── TEAM BADGE ── -->
<div class="page">
  <div class="badge">
    <div class="badge-title">CYBER HEIST</div>
    <div class="badge-event">Techsium 2026 · HKBK College of Engineering · ISE Department</div>
    <div style="margin-top:6mm;">
      <div style="font-size:10pt;color:#666;">TEAM CODE</div>
      <div class="badge-code">${teamCode}</div>
    </div>
    <div style="font-size:10pt;margin-top:4mm;">
      Event Date: 2026 &nbsp;|&nbsp; Duration: 60 minutes &nbsp;|&nbsp; Stations: 6<br>
      Scoring: 20 pts/station · −3 pts/hint · Tiebreak: finish time
    </div>
  </div>

  <div style="font-size:10pt;margin-top:6mm;color:#555;">
    <strong>INSTRUCTIONS:</strong> Each station has a physical clue and a digital submission.
    Navigate to the Student LAN URL on your device, enter your team code, and complete each
    station in sequence. You must complete Station 6 last to decrypt the vault.
  </div>

  <div style="margin-top:8mm;font-size:9pt;color:#888;">
    Incident Reference: ZD-2026 &nbsp;·&nbsp; Threat Actor: Zero-Day Collective &nbsp;·&nbsp;
    Your team has been assigned to restore HKBK College ISE Department systems.
  </div>
</div>

<!-- ── STATION 1 POSTER ── -->
<div class="page">
  <div class="station-header">STATION 01 — WORKSTATION AUDIT</div>
  <div class="station-title">Employee Credential Recovery</div>
  <div class="station-body">
    <p>Investigators have recovered physical evidence from the compromised workstation.
    Reconstruct the administrator password from the following artefacts:</p>

    <div class="evidence">
      <h3>Employee Badge</h3>
      <strong>${v.station1.adminName}</strong><br>
      ISE Department &nbsp;·&nbsp; Joined ${v.station1.joinYear}
    </div>

    <div class="evidence">
      <h3>Sticky Note (desk)</h3>
      <em style="font-size:13pt;">"Don't forget — ${v.station1.petMoniker}'s adoption was the best day"</em>
    </div>

    <div class="evidence">
      <h3>Calendar (March ${v.station1.joinYear})</h3>
      Special character pinned to corner: <strong style="font-size:18pt;">${v.station1.specialChar}</strong>
    </div>

    <p style="margin-top:4mm;color:#C9552F;font-weight:700;">
      Pattern hint: [firstname][year][petname][special]
    </p>
  </div>
</div>

<!-- ── STATION 2 POSTER ── -->
<div class="page">
  <div class="station-header">STATION 02 — CRYPTOGRAPHIC INTERCEPT</div>
  <div class="station-title">Caesar Cipher Decryption</div>
  <div class="station-body">
    <p>Communications intercepted from the threat actor's C2 channel. The message has been
    encoded with a Caesar cipher. Decrypt it to reveal the operation codename.</p>

    <div class="evidence">
      <h3>Intercepted Ciphertext</h3>
      <div class="cipher">${v.station2.ciphertext}</div>
    </div>

    <p style="margin-top:4mm;">Use the frequency analysis tool on your terminal.
    The shift value is between 3 and 9.</p>
    <p style="margin-top:2mm;color:#C9552F;">Submit the operation codename (one word, all caps).</p>
  </div>
</div>

<!-- ── STATION 3 POSTER ── -->
<div class="page">
  <div class="station-header">STATION 03 — PHISHING FORENSICS</div>
  <div class="station-title">Email Threat Identification</div>
  <div class="station-body">
    <p>Your team's inbox has been flagged for analysis. Review the emails in your terminal
    and identify the phishing attempt.</p>

    <div class="evidence">
      <h3>Legitimate Domain (reference)</h3>
      <code>${v.station3.legitDomain}</code>
    </div>

    <p style="margin-top:4mm;">Inspect sender domains carefully. Typosquatting attacks
    substitute lookalike digits for letters (e.g., 'o' → '0', 'e' → '3').</p>

    <p style="margin-top:2mm;color:#C9552F;">
      Submit the exact typosquatted domain you identify.
    </p>
  </div>
</div>

<!-- ── STATION 4 POSTER ── -->
<div class="page">
  <div class="station-header">STATION 04 — SERVER FORENSICS</div>
  <div class="station-title">Backdoor Access Log Analysis</div>
  <div class="station-body">
    <p>The ISE department web server access logs have been exported. Analyze the 50+ entries
    to locate the backdoor installation path used by the Zero-Day Collective.</p>

    <div class="evidence">
      <h3>Log Export — Summary</h3>
      Timeframe: 2026-03-15 06:00 – 14:00<br>
      Source: Apache access.log (HKBK ISE Web Server)<br>
      Entries: 57 rows
    </div>

    <p style="margin-top:4mm;">Filter by POST method and status 200. Look for requests
    to non-standard .php paths in system directories.</p>

    <p style="margin-top:2mm;color:#C9552F;">Submit the full path (e.g. /dir/file.php).</p>
  </div>
</div>

<!-- ── STATION 5 POSTER ── -->
<div class="page">
  <div class="station-header">STATION 05 — NETWORK TRAFFIC ANALYSIS</div>
  <div class="station-title">C2 Beacon Identification</div>
  <div class="station-body">
    <p>NetFlow data from the ISE network has been captured during the breach window.
    Identify the command-and-control beacon: an internal host communicating to an
    external IP on a non-standard port with abnormally high frequency.</p>

    <div class="evidence">
      <h3>Known Non-Standard Ports</h3>
      4444 &nbsp;·&nbsp; 8888 &nbsp;·&nbsp; 9999 &nbsp;·&nbsp; 1337
    </div>

    <p style="margin-top:4mm;">Normal traffic uses ports 80, 443, 53, 22, 3306.
    The beacon frequency is significantly higher than any legitimate flow.</p>

    <p style="margin-top:2mm;color:#C9552F;">Submit as: [internal_IP]:[port]</p>
  </div>
</div>

<!-- ── STATION 6 POSTER ── -->
<div class="page">
  <div class="station-header">STATION 06 — THE VAULT</div>
  <div class="station-title">Master Decryption Key Assembly</div>
  <div class="station-body">
    <p>You have recovered 5 key fragments from the investigation. Assemble them into the
    master decryption key to unlock the encrypted HKBK ISE department vault.</p>

    <div class="evidence">
      <h3>Fragment Order</h3>
      Fragment 1 — from Station 1 (Workstation Audit)<br>
      Fragment 2 — from Station 2 (Cryptographic Intercept)<br>
      Fragment 3 — from Station 3 (Phishing Forensics)<br>
      Fragment 4 — from Station 4 (Server Forensics)<br>
      Fragment 5 — from Station 5 (Network Traffic Analysis)
    </div>

    <p style="margin-top:4mm;">Key format: [F1]-[F2]-[F3]-[F4]-[F5]</p>
    <p style="margin-top:2mm;color:#C9552F;">
      This is your final submission. Your finish timestamp determines your tiebreak rank.
    </p>
  </div>
</div>

</body>
</html>`;

  res.send(html);
});

module.exports = router;
