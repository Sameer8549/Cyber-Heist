// Session token persistence — survives page refresh
const TOKEN_KEY = "cyberheist_session";
const TEAM_KEY  = "cyberheist_team";

export function getStoredToken() { return sessionStorage.getItem(TOKEN_KEY); }
export function setStoredToken(t) { sessionStorage.setItem(TOKEN_KEY, t); }
export function clearStoredToken() { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TEAM_KEY); }
export function getStoredTeamCode() { return sessionStorage.getItem(TEAM_KEY); }
export function setStoredTeamCode(c) { sessionStorage.setItem(TEAM_KEY, c); }
