"use strict";
/**
 * Seeded Variant Engine — CYBER HEIST
 * Deterministic per-team puzzle generation.
 * Never sends answers to client; validation happens server-side.
 */

// djb2 hash → 32-bit unsigned integer
function hashTeamCode(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h;
}

// mulberry32 PRNG — fast, deterministic, seed-based
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function randInt(rng, min, max) { return min + Math.floor(rng() * (max - min + 1)); }

const FIRST_NAMES = ['Arjun','Meera','Kiran','Divya','Rahul','Priya','Suresh','Ananya','Vikram','Shreya','Aditya','Lakshmi','Rohan','Deepa','Harsha'];
const LAST_NAMES  = ['Kumar','Sharma','Reddy','Nair','Iyer','Rao','Gupta','Singh','Patel','Joshi','Menon','Pillai','Das','Bhat','Hegde'];
const PET_NAMES   = ['shadow','tiffany','max','cleo','biscuit','oreo','rusty','mango','kitty','rocky','tiger','pepper','bella','charlie'];
const SPECIAL_CHARS = ['!','@','#','$','%','&','*'];
const OP_CODES = ['OMEGA','PHANTOM','SPECTRE','ECLIPSE','VORTEX','CIPHER','WRAITH','COBALT','NEXUS','RAPTOR','HYDRA','VECTOR'];
const LEGIT_DOMAINS = ['hkbkce.edu.in','ise.hkbk.ac.in','techsium.hkbkce.in','portal.hkbkece.edu'];
const PHP_DIRS = ['admin','uploads','includes','system','core','lib','api','modules','backend','portal'];
const PHP_FILES = ['upload_files','shell_access','backdoor_init','remote_exec','file_manager','config_reset','debug_console'];
const INTERNAL_IPS_24 = ['10.0.','192.168.1.','172.16.0.','10.10.10.','192.168.100.'];
const PORTS = [4444, 8888, 9999, 1337];

function letterSub(domain, rng) {
  const map = { a:'4', e:'3', i:'1', o:'0', s:'5', t:'7', l:'1' };
  // Find all substitutable chars
  const subs = [];
  for (let i = 0; i < domain.length; i++) {
    const c = domain[i].toLowerCase();
    if (map[c]) subs.push(i);
  }
  if (!subs.length) {
    // fallback: insert digit in hostname part
    const dot = domain.indexOf('.');
    const pos = Math.floor(rng() * dot);
    return domain.slice(0, pos) + '0' + domain.slice(pos);
  }
  const idx = subs[Math.floor(rng() * subs.length)];
  const c = domain[idx].toLowerCase();
  return {
    typo: domain.slice(0, idx) + map[c] + domain.slice(idx + 1),
    char: c,
    digit: map[c],
    position: idx
  };
}

function caesarEncrypt(text, shift) {
  return text.split('').map(c => {
    if (c >= 'A' && c <= 'Z') return String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26) + 65);
    if (c >= 'a' && c <= 'z') return String.fromCharCode(((c.charCodeAt(0) - 97 + shift) % 26) + 97);
    return c;
  }).join('');
}

/**
 * Generate all station variants for a team code.
 * Returns ONLY puzzle context — never the answers directly accessible to client.
 * Answers are stored server-side via generateAnswers().
 */
function generateVariant(teamCode) {
  const rng = mulberry32(hashTeamCode(teamCode.toUpperCase().trim()));

  // S1 — Workstation Audit
  const firstName = pick(rng, FIRST_NAMES);
  const lastName  = pick(rng, LAST_NAMES);
  const adminName = `${firstName} ${lastName}`;
  const joinYear  = randInt(rng, 2018, 2023);
  const petMoniker = pick(rng, PET_NAMES);
  const specialChar = pick(rng, SPECIAL_CHARS);
  // Password = firstName + joinYear + petMoniker + specialChar (team sees clues, not password)
  const s1Password = `${firstName.toLowerCase()}${joinYear}${petMoniker}${specialChar}`;

  // S2 — Cryptographic Intercept
  const shift = randInt(rng, 3, 9);
  const opCode = pick(rng, OP_CODES);
  const ciphertext = caesarEncrypt(`OPERATION ${opCode} INITIATED`, shift);

  // S3 — Phishing Forensics
  const legitDomain = pick(rng, LEGIT_DOMAINS);
  const subResult = letterSub(legitDomain, rng);
  const typoInfo = typeof subResult === 'object' ? subResult : { typo: subResult, char: '?', digit: '0', position: 0 };

  // S4 — Server Forensics
  const phpDir   = pick(rng, PHP_DIRS);
  const phpFile  = pick(rng, PHP_FILES);
  const backdoorPath = `/${phpDir}/${phpFile}.php`;

  // S5 — Network Traffic Analysis
  const ipPrefix = pick(rng, INTERNAL_IPS_24);
  const lastOctet = randInt(rng, 2, 254);
  const internalIP = `${ipPrefix}${lastOctet}`;
  const destIP = `${pick(rng,['185.','91.','45.','77.'])}${randInt(rng,1,254)}.${randInt(rng,1,254)}.${randInt(rng,1,254)}`;
  const port = pick(rng, PORTS);
  const frequency = randInt(rng, 847, 2400);

  // S6 — fragments assembled into master key
  const f1 = `${firstName.slice(0,3).toUpperCase()}${joinYear}`;
  const f2 = opCode.slice(0,3) + shift.toString().padStart(2,'0');
  const f3 = typoInfo.typo.replace(/\./g,'').slice(0,6).toUpperCase();
  const f4 = phpFile.slice(0,4).toUpperCase() + randInt(rng,10,99);
  const f5 = port.toString() + lastOctet.toString().padStart(3,'0');
  const masterKey = `${f1}-${f2}-${f3}-${f4}-${f5}`;

  return {
    station1: { adminName, joinYear, petMoniker, specialChar, password: s1Password },
    station2: { shift, opCode, ciphertext, plaintext: `OPERATION ${opCode} INITIATED` },
    station3: { legitDomain, typoSquatted: typoInfo.typo, substitutedChar: typoInfo.char, digit: typoInfo.digit, position: typoInfo.position },
    station4: { backdoorPath },
    station5: { internalIP, destIP, port, frequency },
    station6: {
      fragments: [f1, f2, f3, f4, f5],
      masterKey
    }
  };
}

/**
 * Client-safe variant — strips answers, returns only puzzle context.
 */
function generateClientVariant(teamCode) {
  const v = generateVariant(teamCode);
  return {
    station1: {
      adminName: v.station1.adminName,
      joinYear: v.station1.joinYear,
      petMoniker: v.station1.petMoniker,
      specialChar: v.station1.specialChar
      // password deliberately omitted
    },
    station2: {
      shift: null, // client discovers via slider
      ciphertext: v.station2.ciphertext
      // opCode deliberately omitted
    },
    station3: {
      legitDomain: v.station3.legitDomain,
      typoSquatted: v.station3.typoSquatted,
      substitutedChar: null, // client must identify
      emails: buildPhishingEmails(v)
    },
    station4: {
      logs: buildServerLogs(v)
    },
    station5: {
      netflow: buildNetflow(v),
      beaconFrequency: v.station5.frequency
    },
    station6: {
      fragments: null // filled in as team completes stations
    }
  };
}

function buildPhishingEmails(v) {
  return [
    {
      id: 1,
      from: `admin@${v.station3.legitDomain}`,
      fromDisplay: 'IT Admin',
      subject: 'Password Reset Required',
      timestamp: '08:14',
      body: `Dear User,\n\nYour account requires an immediate password reset.\nPlease click the link below:\n\nhttps://portal.${v.station3.legitDomain}/reset`,
      link: `https://portal.${v.station3.legitDomain}/reset`,
      spf: 'pass', dkim: 'pass', dmarc: 'pass',
      isPhishing: false
    },
    {
      id: 2,
      from: `noreply@${v.station3.typoSquatted}`,
      fromDisplay: 'Security Team',
      subject: 'URGENT: Account Suspended',
      timestamp: '09:31',
      body: `Your academic account has been suspended due to suspicious activity.\nClick here immediately to verify:\n\nhttps://${v.station3.typoSquatted}/verify-account`,
      link: `https://${v.station3.typoSquatted}/verify-account`,
      trueURL: `https://${v.station3.typoSquatted}/verify-account`,
      displayURL: `https://${v.station3.legitDomain}/verify-account`,
      spf: 'fail', dkim: 'none', dmarc: 'fail',
      isPhishing: true
    },
    {
      id: 3,
      from: 'librarian@hkbkce.edu.in',
      fromDisplay: 'Library Services',
      subject: 'Book Return Reminder',
      timestamp: '10:02',
      body: `This is a reminder that you have books due for return.\nPlease visit the library portal at:\n\nhttps://library.hkbkce.edu.in/account`,
      link: 'https://library.hkbkce.edu.in/account',
      spf: 'pass', dkim: 'pass', dmarc: 'pass',
      isPhishing: false
    },
    {
      id: 4,
      from: 'placement@hkbkce.edu.in',
      fromDisplay: 'Placement Cell',
      subject: 'Interview Schedule Update',
      timestamp: '11:45',
      body: `Dear Student,\n\nYour interview with Accenture has been rescheduled.\nPlease check the placement portal for updated timings.`,
      link: 'https://placement.hkbkce.edu.in',
      spf: 'pass', dkim: 'pass', dmarc: 'pass',
      isPhishing: false
    }
  ];
}

function buildServerLogs(v) {
  const timestamp = (h, m, s) => `2026-03-15 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const ips = ['10.0.0.14','10.0.0.23','10.0.0.87','10.0.0.102','192.168.1.5','192.168.1.42','172.16.0.8'];
  const methods = ['GET','POST','GET','GET','GET','POST'];
  const normalPaths = ['/index.php','/login.php','/dashboard.php','/api/students','/api/grades','/uploads/resume.pdf','/css/main.css','/js/app.js','/favicon.ico','/logout.php','/profile.php','/api/courses','/search.php','/notifications.php'];

  const logs = [];
  let h = 6, m = 0, s = 0;

  function tick() {
    s += Math.floor(Math.random() * 45) + 5;
    if (s >= 60) { s -= 60; m++; }
    if (m >= 60) { m -= 60; h++; }
  }

  // 50 normal logs
  for (let i = 0; i < 50; i++) {
    tick();
    const ip = ips[Math.floor(Math.random() * ips.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const path = normalPaths[Math.floor(Math.random() * normalPaths.length)];
    const status = path === '/login.php' && method === 'POST' ? (Math.random() > 0.7 ? 401 : 200) : 200;
    logs.push({ ts: timestamp(h,m,s), ip, method, path, status, id: i });
  }

  // Inject the backdoor entry at a semi-random position (between row 15-35)
  const insertAt = 20 + Math.floor(Math.random() * 10);
  tick();
  logs.splice(insertAt, 0, {
    ts: timestamp(h,m,s),
    ip: '10.0.0.188',
    method: 'POST',
    path: v.station4.backdoorPath,
    status: 200,
    id: 999,
    isBackdoor: true
  });

  // Add some 404s and 500s
  for (let i = 0; i < 6; i++) {
    tick();
    logs.push({ ts: timestamp(h,m,s), ip: ips[Math.floor(Math.random() * ips.length)], method: 'GET', path: '/'+['missing','old-page','test.php','setup.old','config.bak'][i%5], status: [404,500][i%2], id: 100+i });
  }

  return logs;
}

function buildNetflow(v) {
  const normalFlows = [
    { src: '10.0.0.14', dst: '10.0.0.1', port: 443, proto: 'TCP', freq: 312 },
    { src: '10.0.0.23', dst: '8.8.8.8', port: 53, proto: 'UDP', freq: 1024 },
    { src: '10.0.0.87', dst: '10.0.0.254', port: 80, proto: 'TCP', freq: 248 },
    { src: '10.0.0.102', dst: '10.0.0.1', port: 443, proto: 'TCP', freq: 519 },
    { src: '192.168.1.5', dst: '10.0.0.50', port: 3306, proto: 'TCP', freq: 87 },
    { src: '192.168.1.42', dst: '8.8.4.4', port: 53, proto: 'UDP', freq: 632 },
    { src: '172.16.0.8', dst: '10.0.0.1', port: 80, proto: 'TCP', freq: 156 },
    { src: '10.0.0.14', dst: '10.0.0.200', port: 22, proto: 'TCP', freq: 43 },
    { src: '10.0.0.102', dst: '172.217.14.100', port: 443, proto: 'TCP', freq: 204 },
    // The anomalous beacon
    { src: v.station5.internalIP, dst: v.station5.destIP, port: v.station5.port, proto: 'TCP', freq: v.station5.frequency, isAnomaly: true }
  ];
  // Shuffle with the anomaly kept at end for stable detection
  return normalFlows;
}

module.exports = { generateVariant, generateClientVariant, hashTeamCode };
