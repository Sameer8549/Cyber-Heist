"use strict";
const { generateVariant } = require("./seed");

// All other teams' correct answers, to detect cross-team copying
const ALL_TEAMS_ANSWERS_CACHE = new Map();

function getAnswers(teamCode) {
  const code = teamCode.toUpperCase().trim();
  if (!ALL_TEAMS_ANSWERS_CACHE.has(code)) {
    ALL_TEAMS_ANSWERS_CACHE.set(code, generateVariant(code));
  }
  return ALL_TEAMS_ANSWERS_CACHE.get(code);
}

/**
 * Validate a team's answer for a station.
 * Returns { correct: boolean, message: string, fragment?: string }
 */
function validateAnswer(teamCode, station, rawAnswer) {
  const code = teamCode.toUpperCase().trim();
  const answer = typeof rawAnswer === "string" ? rawAnswer.trim() : String(rawAnswer).trim();
  const variant = getAnswers(code);

  // Check if this answer matches ANOTHER team's correct answer
  // (anti-cheat: neighbour copying detection)
  const isCrossTeamAnswer = checkCrossTeamCopy(code, station, answer);
  if (isCrossTeamAnswer) {
    return { correct: false, message: "[!] ERROR: INVALID CREDENTIAL HASH. Access Denied." };
  }

  let correct = false;
  let fragment = null;

  switch (station) {
    case 1:
      correct = answer.toLowerCase() === variant.station1.password.toLowerCase();
      if (correct) fragment = `${variant.station1.adminName.split(" ")[0].slice(0,3).toUpperCase()}${variant.station1.joinYear}`;
      break;
    case 2:
      // Accept the operation code or the full plaintext
      correct = answer.toUpperCase() === variant.station2.opCode.toUpperCase()
             || answer.toUpperCase() === variant.station2.plaintext.toUpperCase();
      if (correct) fragment = variant.station2.opCode.slice(0,3) + variant.station2.shift.toString().padStart(2,"0");
      break;
    case 3:
      correct = answer.toLowerCase() === variant.station3.typoSquatted.toLowerCase();
      if (correct) {
        const f3 = variant.station3.typoSquatted.replace(/\./g,"").slice(0,6).toUpperCase();
        fragment = f3;
      }
      break;
    case 4:
      correct = answer.toLowerCase() === variant.station4.backdoorPath.toLowerCase();
      // Build f4 same way as seed.js
      if (correct) {
        const v = getAnswers(code);
        const phpFile = v.station4.backdoorPath.split("/").pop().replace(".php","");
        // We need the same rng to get f4 - recompute via generateVariant
        const fullV = generateVariant(code);
        fragment = fullV.station6.fragments[3];
      }
      break;
    case 5:
      // Accept "IP:PORT" format
      const expected5 = `${variant.station5.internalIP}:${variant.station5.port}`;
      correct = answer === expected5
             || answer === `${variant.station5.internalIP} ${variant.station5.port}`
             || answer === variant.station5.port.toString();
      if (correct) {
        const fullV = generateVariant(code);
        fragment = fullV.station6.fragments[4];
      }
      break;
    case 6:
      correct = answer === variant.station6.masterKey
             || answer.toUpperCase() === variant.station6.masterKey.toUpperCase();
      break;
    default:
      return { correct: false, message: "[!] ERROR: UNKNOWN STATION." };
  }

  if (correct) {
    return { correct: true, message: "[✓] ACCESS GRANTED.", fragment };
  }
  return { correct: false, message: "[!] ERROR: INVALID CREDENTIAL. Access Denied." };
}

// Cross-team copy detection: if answer matches any OTHER team's correct answer
// We check a rolling set of known team codes
const knownTeamCodes = new Set();

function registerTeamCode(teamCode) {
  knownTeamCodes.add(teamCode.toUpperCase().trim());
}

function checkCrossTeamCopy(teamCode, station, answer) {
  for (const otherCode of knownTeamCodes) {
    if (otherCode === teamCode) continue;
    const otherV = getAnswers(otherCode);
    let otherAnswer = null;
    switch(station) {
      case 1: otherAnswer = otherV.station1.password; break;
      case 2: otherAnswer = otherV.station2.opCode; break;
      case 3: otherAnswer = otherV.station3.typoSquatted; break;
      case 4: otherAnswer = otherV.station4.backdoorPath; break;
      case 5: otherAnswer = `${otherV.station5.internalIP}:${otherV.station5.port}`; break;
      case 6: otherAnswer = otherV.station6.masterKey; break;
    }
    if (otherAnswer && answer.toLowerCase() === otherAnswer.toLowerCase()) return true;
  }
  return false;
}

module.exports = { validateAnswer, registerTeamCode };
