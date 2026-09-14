"use strict";
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const os = require("os");
const path = require("path");

const gs = require("./engine/gameState");
const { validateAnswer, registerTeamCode } = require("./engine/validator");
const { generateClientVariant } = require("./engine/seed");

const app = express();
app.use(cors());
app.use(express.json());

// Serve built client
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));

// Print routes
const printRouter = require("./routes/print");
app.use("/print", printRouter);

// API routes
const apiRouter = require("./routes/api");
app.use("/api", apiRouter);

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Detect LAN IP
function getLANIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "127.0.0.1";
}

const PORT = process.env.PORT || 3000;

// ── Timer callbacks ──
gs.setTimerCallback((snapshot) => {
  io.emit("timer:sync", snapshot);
});

// ── Socket.io event hub ──
io.on("connection", (socket) => {
  // ── Team join / session restore ──
  socket.on("team:join", ({ token, teamCode, teamName }) => {
    // Try session restore
    if (token) {
      const team = gs.getTeamBySession(token);
      if (team) {
        socket.join(`team:${team.teamCode}`);
        const clientVariant = generateClientVariant(team.teamCode);
        socket.emit("team:joined", { team, variant: clientVariant, token });
        io.emit("leaderboard:update", gs.getLeaderboard());
        return;
      }
    }
    // New join
    if (!teamCode) { socket.emit("team:error", "Team code required"); return; }
    const code = teamCode.toUpperCase().trim();
    let team = gs.getTeam(code);
    if (!team) {
      try { team = gs.createTeam(code, teamName); }
      catch (e) { socket.emit("team:error", e.message); return; }
    }
    registerTeamCode(code);
    const newToken = gs.createSession(code);
    socket.join(`team:${code}`);
    const clientVariant = generateClientVariant(code);
    socket.emit("team:joined", { team, variant: clientVariant, token: newToken });
    io.emit("leaderboard:update", gs.getLeaderboard());
  });

  // ── Station submission ──
  socket.on("team:submit", ({ token, station, answer }) => {
    const team = gs.getTeamBySession(token);
    if (!team) { socket.emit("team:result", { correct: false, message: "[!] SESSION EXPIRED." }); return; }

    const result = validateAnswer(team.teamCode, station, answer);

    if (result.correct) {
      const updated = gs.completeStation(team.teamCode, station, result.fragment);
      if (station === 6) gs.lockFinish(team.teamCode);
      socket.emit("team:result", { correct: true, message: result.message, team: updated, fragment: result.fragment });
      io.emit("leaderboard:update", gs.getLeaderboard());
      io.to("coord").emit("coord:teamUpdate", gs.getAllTeams());
    } else {
      socket.emit("team:result", { correct: false, message: result.message });
    }
  });

  // ── Hint request ──
  socket.on("team:hint", ({ token, station }) => {
    const team = gs.getTeamBySession(token);
    if (!team) return;
    const updated = gs.useHint(team.teamCode);
    socket.emit("team:hintGranted", { team: updated, hint: getHint(team.teamCode, station) });
    io.emit("leaderboard:update", gs.getLeaderboard());
    io.to("coord").emit("coord:teamUpdate", gs.getAllTeams());
  });

  // ── Coordinator auth ──
  socket.on("coord:auth", ({ pin }) => {
    if (pin === "TECHSIUM2026") {
      socket.join("coord");
      socket.emit("coord:authed", {
        teams: gs.getAllTeams(),
        timer: gs.getTimerSnapshot()
      });
    } else {
      socket.emit("coord:authFailed");
    }
  });

  // ── Timer control (coordinator only) ──
  socket.on("coord:timer", ({ action }) => {
    if (!socket.rooms.has("coord")) return;
    if (action === "start") gs.startTimer();
    else if (action === "pause") gs.pauseTimer();
    else if (action === "reset") gs.resetTimer();
    io.emit("timer:sync", gs.getTimerSnapshot());
  });

  // ── Broadcast ──
  socket.on("coord:broadcast", ({ message }) => {
    if (!socket.rooms.has("coord")) return;
    io.emit("broadcast:message", { message, ts: Date.now() });
  });

  // ── Force complete station ──
  socket.on("coord:forceComplete", ({ teamCode, station }) => {
    if (!socket.rooms.has("coord")) return;
    const updated = gs.forceCompleteStation(teamCode, station);
    if (updated) {
      io.emit("leaderboard:update", gs.getLeaderboard());
      io.to("coord").emit("coord:teamUpdate", gs.getAllTeams());
      io.to(`team:${teamCode}`).emit("team:forceCompleted", { team: updated, station });
    }
  });

  // ── Add team (coordinator) ──
  socket.on("coord:addTeam", ({ teamCode, teamName }) => {
    if (!socket.rooms.has("coord")) return;
    try {
      const team = gs.createTeam(teamCode, teamName);
      registerTeamCode(teamCode);
      io.to("coord").emit("coord:teamUpdate", gs.getAllTeams());
      socket.emit("coord:teamAdded", team);
    } catch (e) {
      socket.emit("coord:error", e.message);
    }
  });

  // ── Leaderboard subscribe ──
  socket.on("leaderboard:subscribe", () => {
    socket.join("leaderboard");
    socket.emit("leaderboard:update", gs.getLeaderboard());
    socket.emit("timer:sync", gs.getTimerSnapshot());
  });
});

// Hint content (client-visible clues, not answers)
function getHint(teamCode, station) {
  const { generateVariant } = require("./engine/seed");
  const v = generateVariant(teamCode);
  const hints = {
    1: `The password combines: first name (lowercase) + join year + pet name + special character "${v.station1.specialChar}"`,
    2: `Try shift values between 3 and 9. The decrypted message follows: OPERATION [CODENAME] INITIATED`,
    3: `Look carefully at the sender domain. One character has been replaced with a digit that looks similar.`,
    4: `Search for POST requests to paths ending in .php that are not standard application files.`,
    5: `The C2 beacon uses a non-standard port. Look for ports: 4444, 8888, 9999, or 1337.`,
    6: `Assemble all 5 fragments in order, separated by hyphens. Each fragment was revealed when you solved its station.`
  };
  return hints[station] || "No hint available for this station.";
}

server.listen(PORT, "0.0.0.0", () => {
  const lanIP = getLANIP();
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  CYBER HEIST — Server Online             ║`);
  console.log(`╠══════════════════════════════════════════╣`);
  console.log(`║  Student LAN URL: http://${lanIP}:${PORT}`.padEnd(44) + `║`);
  console.log(`║  Coordinator:     http://${lanIP}:${PORT}/coordinator`.padEnd(44) + `║`);
  console.log(`║  Leaderboard:     http://${lanIP}:${PORT}/leaderboard`.padEnd(44) + `║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
});
