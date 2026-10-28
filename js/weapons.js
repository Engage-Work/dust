'use strict';
// ======================================================================
//  weapons.js - weapon data (realistic ballistics parameters) and recoil patterns (spray control)
//  Spread unit: milliradians (mrad); recoil pattern unit: degrees (pitch up is positive, yaw right is positive)
// ======================================================================

// AK-47: climbs vertically for ~9 shots, then pulls left, then right, then back left (the classic '7' shape)
const AK_PATTERN = [
  [0, 0], [0.45, 0.05], [1.2, 0.05], [2.15, -0.05], [3.2, 0.1], [4.25, 0.3], [5.2, 0.2], [6.0, -0.15], [6.6, -0.7], [7.05, -1.45],
  [7.35, -2.2], [7.55, -2.75], [7.75, -2.9], [7.85, -2.6], [7.95, -1.7], [8.05, -0.6], [8.15, 0.5], [8.25, 1.5], [8.3, 2.3], [8.4, 2.85],
  [8.5, 3.1], [8.55, 2.7], [8.65, 1.9], [8.7, 0.9], [8.8, -0.1], [8.85, -1.0], [8.95, -1.6], [9.0, -1.9], [9.05, -2.0], [9.1, -1.8],
];
// M4A4: climb -> right -> left -> right, smaller amplitude
const M4_PATTERN = [
  [0, 0], [0.35, 0], [0.95, 0.05], [1.7, 0.15], [2.5, 0.1], [3.3, -0.05], [4.0, 0.05], [4.55, 0.25], [5.0, 0.55], [5.3, 0.95],
  [5.5, 1.45], [5.65, 1.85], [5.8, 2.0], [5.9, 1.7], [6.0, 1.1], [6.05, 0.4], [6.1, -0.35], [6.15, -1.05], [6.2, -1.55], [6.25, -1.8],
  [6.3, -1.7], [6.35, -1.3], [6.4, -0.7], [6.4, 0.0], [6.45, 0.6], [6.5, 1.0], [6.55, 1.2], [6.55, 1.1], [6.6, 0.8], [6.6, 0.5],
];
function genPattern(n, step, decay, yawAmp, yawFreq, phase = 0) {
  const p = [[0, 0]];
  let pitch = 0;
  for (let i = 1; i < n; i++) {
    pitch += step * Math.exp(-(i - 1) * decay);
    p.push([pitch, yawAmp * Math.sin(i * yawFreq + phase) * Math.min(1, i / 4)]);
  }
  return p;
}

// Every weapon: `slot` 1 primary / 2 secondary / 3 knife / 4 grenade / 5 C4. `type` picks the hold pose and
// the reload choreography (pistol, smg, rifle, sniper, shotgun). `team` limits who can buy it.
// Shotguns fire `pellets` rounds per trigger pull and reload one shell at a time (`shellReload` seconds each).
const WEAPONS = {
  knife: {
    id: 'knife', name: 'Knife', short: 'Knife', slot: 3, type: 'knife', speed: 250 * U, draw: 0.6, price: 0, killReward: 1500, armorPen: 0.85, rangeMod: 1,
  },
  butterfly: {
    id: 'butterfly', name: 'Butterfly Knife', short: 'Knife', slot: 3, type: 'knife', speed: 250 * U, draw: 0.6, price: 0, killReward: 1500, armorPen: 0.85, rangeMod: 1,
  },
  // ---------------- Pistols ----------------
  glock: {
    id: 'glock', name: 'Glock-18', slot: 2, type: 'pistol', team: 'T', price: 200, killReward: 300,
    damage: 30, armorPen: 0.47, rangeMod: 0.85, pen: 0.1, cycle: 0.15, auto: false, mag: 20, reserve: 120,
    reload: 2.27, draw: 1.0, speed: 240 * U,
    spread: 2.0, inaccStand: 7.0, inaccCrouch: 5.5, inaccMove: 16, inaccJump: 220, inaccLand: 60, inaccFire: 28, recovery: 0.35,
    pattern: genPattern(20, 0.95, 0.12, 0.35, 1.7), recoilRecover: 8, viewKick: [0.9, 0.3], tracer: 0, sound: 'glock', vol: 0.85,
  },
  usp: {
    id: 'usp', name: 'USP-S', slot: 2, type: 'pistol', team: 'CT', price: 200, killReward: 300,
    damage: 35, armorPen: 0.505, rangeMod: 0.91, pen: 0.12, cycle: 0.17, auto: false, mag: 12, reserve: 24,
    reload: 2.2, draw: 1.0, speed: 240 * U,
    spread: 1.5, inaccStand: 5.0, inaccCrouch: 4.0, inaccMove: 18, inaccJump: 220, inaccLand: 60, inaccFire: 25, recovery: 0.33,
    pattern: genPattern(12, 1.05, 0.1, 0.3, 2.1), recoilRecover: 7, viewKick: [1.0, 0.3], tracer: 0, sound: 'usp', vol: 0.7, suppressed: true,
  },
  p250: {
    id: 'p250', name: 'P250', slot: 2, type: 'pistol', price: 300, killReward: 300,
    damage: 38, armorPen: 0.64, rangeMod: 0.85, pen: 0.14, cycle: 0.15, auto: false, mag: 13, reserve: 26,
    reload: 2.2, draw: 1.0, speed: 240 * U,
    spread: 2.2, inaccStand: 7.5, inaccCrouch: 5.6, inaccMove: 20, inaccJump: 220, inaccLand: 60, inaccFire: 36, recovery: 0.4,
    pattern: genPattern(13, 1.3, 0.1, 0.4, 1.9), recoilRecover: 7, viewKick: [1.3, 0.35], tracer: 0, sound: 'p250', vol: 0.9,
  },
  fiveseven: {
    id: 'fiveseven', name: 'Five-SeveN', slot: 2, type: 'pistol', team: 'CT', price: 500, killReward: 300,
    damage: 32, armorPen: 0.912, rangeMod: 0.91, pen: 0.16, cycle: 0.14, auto: false, mag: 20, reserve: 100,
    reload: 2.2, draw: 1.0, speed: 240 * U,
    spread: 1.6, inaccStand: 6.0, inaccCrouch: 4.5, inaccMove: 18, inaccJump: 220, inaccLand: 60, inaccFire: 30, recovery: 0.36,
    pattern: genPattern(20, 1.0, 0.1, 0.35, 2.0), recoilRecover: 8, viewKick: [1.0, 0.3], tracer: 0, sound: 'fiveseven', vol: 0.85,
  },
  tec9: {
    id: 'tec9', name: 'Tec-9', slot: 2, type: 'pistol', team: 'T', price: 500, killReward: 300,
    damage: 33, armorPen: 0.906, rangeMod: 0.91, pen: 0.16, cycle: 0.12, auto: false, mag: 18, reserve: 90,
    reload: 2.4, draw: 1.0, speed: 240 * U,
    spread: 2.6, inaccStand: 9.0, inaccCrouch: 7.0, inaccMove: 14, inaccJump: 220, inaccLand: 60, inaccFire: 44, recovery: 0.42,
    pattern: genPattern(18, 1.2, 0.1, 0.5, 2.3), recoilRecover: 8, viewKick: [1.1, 0.4], tracer: 0, sound: 'tec9', vol: 0.9,
  },
  deagle: {
    id: 'deagle', name: 'Desert Eagle', slot: 2, type: 'pistol', price: 700, killReward: 300,
    damage: 63, armorPen: 0.932, rangeMod: 0.81, pen: 0.24, cycle: 0.225, auto: false, mag: 7, reserve: 35,
    reload: 2.2, draw: 1.0, speed: 230 * U,
    spread: 2.0, inaccStand: 6.0, inaccCrouch: 4.0, inaccMove: 45, inaccJump: 300, inaccLand: 90, inaccFire: 55, recovery: 0.65,
    pattern: genPattern(7, 2.4, 0.05, 0.6, 2.4), recoilRecover: 3.6, viewKick: [2.6, 0.6], tracer: 0, sound: 'deagle', vol: 1.0,
  },
  // ---------------- SMGs ----------------
  mac10: {
    id: 'mac10', name: 'MAC-10', slot: 1, type: 'smg', team: 'T', price: 1050, killReward: 600,
    damage: 29, armorPen: 0.575, rangeMod: 0.82, pen: 0.1, cycle: 0.075, auto: true, mag: 30, reserve: 100,
    reload: 2.6, draw: 1.0, speed: 240 * U,
    spread: 1.6, inaccStand: 15, inaccCrouch: 12, inaccMove: 30, inaccJump: 140, inaccLand: 60, inaccFire: 7.5, recovery: 0.32,
    pattern: genPattern(30, 0.6, 0.08, 1.4, 0.5, 0.2), recoilRecover: 55, viewKick: [0.4, 0.35], tracer: 1, sound: 'mac10', vol: 0.85,
  },
  mp9: {
    id: 'mp9', name: 'MP9', slot: 1, type: 'smg', team: 'CT', price: 1250, killReward: 600,
    damage: 26, armorPen: 0.6, rangeMod: 0.87, pen: 0.12, cycle: 0.07, auto: true, mag: 30, reserve: 120,
    reload: 2.13, draw: 1.0, speed: 240 * U,
    spread: 1.2, inaccStand: 12, inaccCrouch: 9, inaccMove: 32, inaccJump: 150, inaccLand: 60, inaccFire: 6.5, recovery: 0.3,
    pattern: genPattern(30, 0.55, 0.09, 1.1, 0.55, 0.4), recoilRecover: 55, viewKick: [0.35, 0.3], tracer: 1, sound: 'mp9', vol: 0.85,
  },
  ump45: {
    id: 'ump45', name: 'UMP-45', slot: 1, type: 'smg', price: 1200, killReward: 600,
    damage: 35, armorPen: 0.65, rangeMod: 0.75, pen: 0.14, cycle: 0.089, auto: true, mag: 25, reserve: 100,
    reload: 3.5, draw: 1.0, speed: 230 * U,
    spread: 1.4, inaccStand: 11, inaccCrouch: 8, inaccMove: 30, inaccJump: 140, inaccLand: 60, inaccFire: 7.0, recovery: 0.34,
    pattern: genPattern(25, 0.7, 0.09, 1.0, 0.6, 0.3), recoilRecover: 50, viewKick: [0.45, 0.3], tracer: 1, sound: 'ump45', vol: 0.9,
  },
  // ---------------- Rifles ----------------
  galil: {
    id: 'galil', name: 'Galil AR', slot: 1, type: 'rifle', team: 'T', price: 1800, killReward: 300,
    damage: 30, armorPen: 0.775, rangeMod: 0.98, pen: 0.26, cycle: 0.09, auto: true, mag: 35, reserve: 90,
    reload: 3.0, draw: 1.0, speed: 215 * U,
    spread: 0.9, inaccStand: 8.0, inaccCrouch: 6.0, inaccMove: 130, inaccJump: 400, inaccLand: 150, inaccFire: 8.5, recovery: 0.4,
    pattern: genPattern(35, 0.42, 0.05, 1.6, 0.42, 0.6), recoilScale: 1, recoilRecover: 52, viewKick: [0.5, 0.35], tracer: 1, sound: 'galil', vol: 1.0,
  },
  famas: {
    id: 'famas', name: 'FAMAS', slot: 1, type: 'rifle', team: 'CT', price: 2050, killReward: 300,
    damage: 30, armorPen: 0.7, rangeMod: 0.96, pen: 0.26, cycle: 0.09, auto: true, mag: 25, reserve: 90,
    reload: 3.3, draw: 1.0, speed: 220 * U,
    spread: 0.8, inaccStand: 7.0, inaccCrouch: 5.2, inaccMove: 125, inaccJump: 400, inaccLand: 150, inaccFire: 8.0, recovery: 0.38,
    pattern: genPattern(25, 0.4, 0.06, 1.3, 0.5, 0.2), recoilScale: 1, recoilRecover: 55, viewKick: [0.45, 0.3], tracer: 1, sound: 'famas', vol: 0.95,
  },
  ak47: {
    id: 'ak47', name: 'AK-47', slot: 1, type: 'rifle', team: 'T', price: 2700, killReward: 300,
    damage: 36, armorPen: 0.775, rangeMod: 0.98, pen: 0.3, cycle: 0.1, auto: true, mag: 30, reserve: 90,
    reload: 2.43, draw: 1.0, speed: 215 * U,
    spread: 0.6, inaccStand: 6.4, inaccCrouch: 4.8, inaccMove: 140, inaccJump: 400, inaccLand: 150, inaccFire: 7.8, recovery: 0.38,
    pattern: AK_PATTERN, recoilScale: 0.92, recoilRecover: 55, viewKick: [0.55, 0.3], tracer: 1, sound: 'ak', vol: 1.0,
  },
  m4a4: {
    id: 'm4a4', name: 'M4A4', slot: 1, type: 'rifle', team: 'CT', price: 3100, killReward: 300,
    damage: 33, armorPen: 0.7, rangeMod: 0.97, pen: 0.28, cycle: 0.09, auto: true, mag: 30, reserve: 90,
    reload: 3.07, draw: 1.0, speed: 225 * U,
    spread: 0.5, inaccStand: 5.0, inaccCrouch: 3.7, inaccMove: 120, inaccJump: 400, inaccLand: 140, inaccFire: 7.0, recovery: 0.34,
    pattern: M4_PATTERN, recoilScale: 0.92, recoilRecover: 58, viewKick: [0.45, 0.25], tracer: 1, sound: 'm4', vol: 0.95,
  },
  sg553: {
    id: 'sg553', name: 'SG 553', slot: 1, type: 'rifle', team: 'T', price: 3000, killReward: 300,
    damage: 30, armorPen: 1.0, rangeMod: 0.98, pen: 0.3, cycle: 0.09, auto: true, mag: 30, reserve: 90,
    reload: 2.8, draw: 1.1, speed: 210 * U, scopedSpeed: 180 * U,
    spread: 0.6, inaccStand: 6.0, inaccScoped: 3.4, inaccCrouch: 4.4, inaccMove: 130, inaccJump: 400, inaccLand: 150, inaccFire: 7.6, recovery: 0.4,
    pattern: genPattern(30, 0.5, 0.06, 1.5, 0.45, 0.2), recoilScale: 1, recoilRecover: 55, viewKick: [0.5, 0.3], tracer: 1, sound: 'sg553', vol: 1.0,
    scope: true, zoom: [45],
  },
  aug: {
    id: 'aug', name: 'AUG', slot: 1, type: 'rifle', team: 'CT', price: 3300, killReward: 300,
    damage: 28, armorPen: 0.9, rangeMod: 0.98, pen: 0.3, cycle: 0.09, auto: true, mag: 30, reserve: 90,
    reload: 3.8, draw: 1.1, speed: 220 * U, scopedSpeed: 180 * U,
    spread: 0.5, inaccStand: 5.2, inaccScoped: 3.0, inaccCrouch: 3.8, inaccMove: 120, inaccJump: 400, inaccLand: 140, inaccFire: 7.0, recovery: 0.36,
    pattern: genPattern(30, 0.45, 0.06, 1.3, 0.5, 0.4), recoilScale: 1, recoilRecover: 58, viewKick: [0.45, 0.28], tracer: 1, sound: 'aug', vol: 0.95,
    scope: true, zoom: [45],
  },
  // ---------------- Snipers ----------------
  ssg08: {
    id: 'ssg08', name: 'SSG 08', slot: 1, type: 'sniper', price: 1700, killReward: 300,
    damage: 88, armorPen: 0.85, rangeMod: 0.99, pen: 0.4, cycle: 1.25, auto: false, mag: 10, reserve: 90,
    reload: 3.4, draw: 1.1, speed: 230 * U, scopedSpeed: 200 * U,
    spread: 0.25, inaccStand: 60, inaccScoped: 1.6, inaccCrouch: 1.2, inaccMove: 60, inaccJump: 180, inaccLand: 120, inaccFire: 90, recovery: 0.3,
    pattern: [[0, 0], [0, 0]], recoilRecover: 2, viewKick: [2.4, 0.5], tracer: 1, sound: 'ssg08', vol: 1.0,
    scope: true, zoom: [40, 12], light: true,
  },
  awp: {
    id: 'awp', name: 'AWP', slot: 1, type: 'sniper', price: 4750, killReward: 100,
    damage: 115, armorPen: 0.975, rangeMod: 0.99, pen: 0.48, cycle: 1.46, auto: false, mag: 5, reserve: 30,
    reload: 3.67, draw: 1.25, speed: 200 * U, scopedSpeed: 100 * U,
    spread: 0.2, inaccStand: 80, inaccScoped: 1.6, inaccCrouch: 1.2, inaccMove: 190, inaccJump: 520, inaccLand: 200, inaccFire: 110, recovery: 0.25,
    pattern: [[0, 0], [0, 0]], recoilRecover: 2, viewKick: [3.6, 0.6], tracer: 1, sound: 'awp', vol: 1.1,
    scope: true, zoom: [40, 12],
  },
  // ---------------- Shotguns ----------------
  nova: {
    id: 'nova', name: 'Nova', slot: 1, type: 'shotgun', price: 1050, killReward: 900,
    damage: 26, pellets: 9, armorPen: 0.5, rangeMod: 0.7, pen: 0.08, cycle: 0.88, auto: false, mag: 8, reserve: 32,
    reload: 0.5, shellReload: 0.5, draw: 1.1, speed: 220 * U,
    spread: 18, inaccStand: 20, inaccCrouch: 16, inaccMove: 40, inaccJump: 200, inaccLand: 80, inaccFire: 30, recovery: 0.5,
    pattern: genPattern(8, 3.0, 0.0, 0.8, 2.0), recoilRecover: 4, viewKick: [3.2, 0.8], tracer: 0, sound: 'nova', vol: 1.1,
  },
  // ---------------- Grenades / C4 ----------------
  he: { id: 'he', name: 'HE Grenade', short: 'HE', slot: 4, type: 'grenade', price: 300, speed: 245 * U, draw: 0.6, max: 1 },
  flash: { id: 'flash', name: 'Flashbang', short: 'Flash', slot: 4, type: 'grenade', price: 200, speed: 245 * U, draw: 0.6, max: 2 },
  smoke: { id: 'smoke', name: 'Smoke Grenade', short: 'Smoke', slot: 4, type: 'grenade', price: 300, speed: 245 * U, draw: 0.6, max: 1 },
  c4: { id: 'c4', name: 'C4 Bomb', short: 'C4', slot: 5, type: 'c4', speed: 250 * U, draw: 0.8, price: 0 },
};
const GRENADE_ORDER = ['he', 'flash', 'smoke'];

const EQUIP = {
  kevlar: { id: 'kevlar', name: 'Kevlar', price: 650 },
  helmet: { id: 'helmet', name: 'Kevlar + Helmet', price: 1000 },
  defuser: { id: 'defuser', name: 'Defuse Kit', price: 400, team: 'CT' },
};

const BUY_MENU = [
  { title: 'Pistols', items: ['glock', 'usp', 'p250', 'tec9', 'fiveseven', 'deagle'] },
  { title: 'SMGs & Shotguns', items: ['mac10', 'mp9', 'ump45', 'nova'] },
  { title: 'Rifles', items: ['galil', 'famas', 'ak47', 'm4a4', 'sg553', 'aug'] },
  { title: 'Snipers', items: ['ssg08', 'awp'] },
  { title: 'Gear & Grenades', items: ['kevlar', 'helmet', 'defuser', 'he', 'flash', 'smoke'] },
];

// Rate of fire in rounds per minute and a few derived readouts for the buy menu's weapon card
function weaponStats(def) {
  if (!def || !def.damage) return null;
  const rpm = Math.round(60 / def.cycle);
  const dps = Math.round(def.damage * (def.pellets || 1) / def.cycle);
  return { rpm, dps, pen: def.armorPen, range: def.rangeMod, mag: def.mag, reserve: def.reserve, reward: def.killReward, speed: Math.round(def.speed / U), dmg: def.damage * (def.pellets || 1) };
}

function patternAt(def, idx) {
  const p = def.pattern;
  if (!p) return [0, 0];
  const sc = def.recoilScale || 1;
  const i0 = Math.floor(idx), f = idx - i0;
  if (i0 >= p.length - 1) { const l = p[p.length - 1]; return [l[0] * sc, l[1] * sc]; }
  const a = p[i0], b = p[i0 + 1];
  return [(a[0] + (b[0] - a[0]) * f) * sc, (a[1] + (b[1] - a[1]) * f) * sc];
}

class WeaponInst {
  constructor(id) {
    this.def = WEAPONS[id];
    this.id = id;
    this.mag = this.def.mag || 0;
    this.reserve = this.def.reserve || 0;
  }
}
