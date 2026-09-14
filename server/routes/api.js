"use strict";
const express = require("express");
const router = express.Router();
const gs = require("../engine/gameState");
const { registerTeamCode } = require("../engine/validator");

// List all teams (coordinator use)
router.get("/teams", (req, res) => {
  res.json(gs.getAllTeams());
});

// Add a team
router.post("/teams", (req, res) => {
  const { teamCode, teamName } = req.body;
  if (!teamCode) return res.status(400).json({ error: "teamCode required" });
  try {
    const team = gs.createTeam(teamCode.toUpperCase().trim(), teamName);
    registerTeamCode(teamCode);
    res.json(team);
  } catch (e) {
    res.status(409).json({ error: e.message });
  }
});

// Get leaderboard
router.get("/leaderboard", (req, res) => {
  res.json(gs.getLeaderboard());
});

// Timer status
router.get("/timer", (req, res) => {
  res.json(gs.getTimerSnapshot());
});

module.exports = router;
