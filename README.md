# CYBER HEIST
### Techsium 2026 · HKBK College of Engineering · ISE Department

A live, LAN-hosted cybersecurity incident-response simulation for college tech fests.

---

## Quick Start

```bash
# 1. Install all dependencies
npm install
npm install --prefix server
npm install --prefix client

# 2. Start development (server + client hot-reload)
npm run dev

# 3. Or production: build client first, then start server only
npm run build --prefix client
npm start
```

The server prints the LAN URL on startup:
```
╔══════════════════════════════════════════╗
║  CYBER HEIST — Server Online             ║
╠══════════════════════════════════════════╣
║  Student LAN URL: http://192.168.x.x:3000
║  Coordinator:     http://192.168.x.x:3000/coordinator
║  Leaderboard:     http://192.168.x.x:3000/leaderboard
╚══════════════════════════════════════════╝
```

---

## Fonts (Required for full design)

Place these woff2 files in `client/public/fonts/`:

- **Cabinet Grotesk** (free at fontshare.com/fonts/cabinet-grotesk)
  - `CabinetGrotesk-Regular.woff2`
  - `CabinetGrotesk-Medium.woff2`
  - `CabinetGrotesk-SemiBold.woff2`
  - `CabinetGrotesk-Bold.woff2`
- **JetBrains Mono** (free at jetbrains.com/lp/mono/)
  - `JetBrainsMono-Regular.woff2`
  - `JetBrainsMono-Medium.woff2`

---

## URLs

| Route | Purpose |
|-------|---------|
| `/` | Central Portal — team entry |
| `/terminal` | Team terminal shell (all 6 stations) |
| `/coordinator` | Coordinator console (PIN: `TECHSIUM2026`) |
| `/leaderboard` | Projector leaderboard |
| `/print/:teamCode` | A4 printable posters + team badge |

---

## Architecture

- **Backend**: Node.js + Express + Socket.io (real-time, LAN-hosted)
- **Frontend**: React 18 + Vite + Framer Motion
- **Seeded Variant Engine**: mulberry32 PRNG seeded from djb2 team code hash
- **Anti-cheat**: Server-side validation only; cross-team copy detection
- **State**: In-memory (single-event run); session token survives page refresh

---

## Scoring

- 20 pts per station completed (max 100)
- −3 pts per hint used
- Tiebreak: finish time → fewest hints

---

*Built for Techsium 2026, ISE Department, HKBK College of Engineering*
