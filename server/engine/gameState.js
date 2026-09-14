"use strict";
const { v4: uuidv4 } = require("uuid");

/**
 * In-memory game state. Survives page refresh via session token.
 * Lost on server restart (single-event use).
 */

const teams = new Map();   // teamCode -> teamData
const sessions = new Map(); // sessionToken -> teamCode

// Timer state
let timerState = {
  durationMs: 60 * 60 * 1000,
  remainingMs: 60 * 60 * 1000,
  running: false,
  startedAt: null,
  pausedAt: null
};

let timerInterval = null;
let onTimerUpdate = null; // callback set by server

function setTimerCallback(cb) { onTimerUpdate = cb; }

function startTimer() {
  if (timerState.running) return;
  timerState.running = true;
  timerState.startedAt = Date.now();
  timerInterval = setInterval(() => {
    if (!timerState.running) return;
    const elapsed = Date.now() - timerState.startedAt;
    timerState.remainingMs = Math.max(0, timerState.durationMs - elapsed);
    if (timerState.remainingMs === 0) {
      timerState.running = false;
      clearInterval(timerInterval);
    }
    if (onTimerUpdate) onTimerUpdate(getTimerSnapshot());
  }, 500);
}

function pauseTimer() {
  if (!timerState.running) return;
  timerState.running = false;
  timerState.remainingMs -= (Date.now() - timerState.startedAt);
  timerState.durationMs = timerState.remainingMs;
  timerState.pausedAt = Date.now();
  clearInterval(timerInterval);
  timerInterval = null;
  if (onTimerUpdate) onTimerUpdate(getTimerSnapshot());
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerState = {
    durationMs: 60 * 60 * 1000,
    remainingMs: 60 * 60 * 1000,
    running: false,
    startedAt: null,
    pausedAt: null
  };
  if (onTimerUpdate) onTimerUpdate(getTimerSnapshot());
}

function getTimerSnapshot() {
  return {
    remainingMs: timerState.remainingMs,
    running: timerState.running
  };
}

// ── Team management ──

function createTeam(teamCode, teamName) {
  const code = teamCode.toUpperCase().trim();
  if (teams.has(code)) throw new Error("Team code already exists");
  const team = {
    teamCode: code,
    teamName: teamName || code,
    currentStation: 1,
    completedStations: [],
    score: 0,
    hintsUsed: 0,
    fragments: [],
    finishTime: null,
    joinedAt: Date.now()
  };
  teams.set(code, team);
  return team;
}

function getTeam(teamCode) {
  return teams.get(teamCode.toUpperCase().trim()) || null;
}

function getAllTeams() {
  return Array.from(teams.values());
}

function createSession(teamCode) {
  const token = uuidv4();
  sessions.set(token, teamCode.toUpperCase().trim());
  return token;
}

function getTeamBySession(token) {
  const code = sessions.get(token);
  if (!code) return null;
  return teams.get(code) || null;
}

function completeStation(teamCode, station, fragment) {
  const team = getTeam(teamCode);
  if (!team) return null;
  if (team.completedStations.includes(station)) return team;
  team.completedStations.push(station);
  team.score += 20;
  if (team.currentStation === station) team.currentStation = Math.min(station + 1, 6);
  if (fragment) team.fragments.push(fragment);
  return team;
}

function useHint(teamCode) {
  const team = getTeam(teamCode);
  if (!team) return null;
  team.hintsUsed += 1;
  team.score = Math.max(0, team.score - 3);
  return team;
}

function lockFinish(teamCode) {
  const team = getTeam(teamCode);
  if (!team) return null;
  if (!team.finishTime) team.finishTime = Date.now();
  return team;
}

function forceCompleteStation(teamCode, station) {
  const team = getTeam(teamCode);
  if (!team) return null;
  if (!team.completedStations.includes(station)) {
    team.completedStations.push(station);
    team.score += 20;
    if (team.currentStation === station) team.currentStation = Math.min(station + 1, 6);
  }
  return team;
}

function getLeaderboard() {
  return getAllTeams()
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.finishTime && b.finishTime) return a.finishTime - b.finishTime;
      if (a.finishTime) return -1;
      if (b.finishTime) return 1;
      return a.hintsUsed - b.hintsUsed;
    })
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

module.exports = {
  createTeam, getTeam, getAllTeams,
  createSession, getTeamBySession,
  completeStation, useHint, lockFinish, forceCompleteStation,
  getLeaderboard,
  startTimer, pauseTimer, resetTimer, getTimerSnapshot, setTimerCallback
};
