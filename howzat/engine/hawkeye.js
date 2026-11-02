window.BG = '#3d6650';
// "Hawk-Eye ko kaise pata ball stumps pe lagti?" — 1080x1920, synced to window.TL (helpers from maps.js)
const W = 1080, H = 1920;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
window.cv = cv;

const C = {
  bg1: '#070f22', bg2: '#0b1a3a',
  grid: 'rgba(100,145,255,0.07)', grid2: 'rgba(100,145,255,0.14)',
  box: 'rgba(16,33,76,0.96)', boxLine: '#4a74c9',
  text: '#eef2fc', mute: '#8fa3cb', dim: '#5d7099',
  yel: '#ffc940', grn: '#36e08b', red: '#ff4d5e', org: '#ffa53b', cyan: '#63d9ff', blue: '#4c8dff',
  screen: '#0a1430', road: '#1c3160', roadEdge: '#2b4880', block: '#0e2049', blockLine: '#183062'
};
const MONO = '"JetBrains Mono", monospace';
const SANS = 'Poppins, sans-serif';

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const P = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const L = (a, b, x) => a + (b - a) * x;
const win = (t, a, b, fi = .25, fo = .25) => Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b));
const hash = (i, j) => { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); };
const LS = i => TL.lines[i].s, LE = i => TL.lines[i].e;
const CK = p => { const c = TL.chunks.find(c => c.text.startsWith(p)); if (!c) throw new Error('chunk ' + p); return c.s; };
const END = TL.dur + 0.9;           // end card start
const TOTAL = END + 1.6;
window.TOTAL = TOTAL;

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function txt(s, x, y, font, color, align = 'center', base = 'middle') {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(s, x, y);
}
function line(pts, color, width, dash) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
}
function polyPart(pts, f) {   // first fraction f of a polyline
  const seg = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
  let rem = tot * f; const out = [pts[0]];
  for (let i = 1; i < pts.length && rem > 0; i++) {
    const k = Math.min(1, rem / seg[i - 1]);
    out.push([L(pts[i - 1][0], pts[i][0], k), L(pts[i - 1][1], pts[i][1], k)]); rem -= seg[i - 1];
  }
  return out;
}
function chip(x, y, label, col, f, opts = {}) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); const s = back(f); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 3);
  ctx.font = `700 ${opts.size || 28}px ${MONO}`; const w = ctx.measureText(label).width + (opts.pad || 48);
  const h = opts.h || 60;
  rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = opts.fill || 'rgba(10,20,48,0.96)'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
  txt(label, 0, 1, `700 ${opts.size || 28}px ${MONO}`, opts.tc || col);
  ctx.restore();
}
function warnIcon(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(28, 22); ctx.lineTo(-28, 22); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  ctx.fillStyle = '#1a0a10'; ctx.fillRect(-3, -10, 6, 18); ctx.fillRect(-3, 12, 6, 6);
  ctx.restore();
}
function pin(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-30, -34, -26, -72, 0, -72); ctx.bezierCurveTo(26, -72, 30, -34, 0, 0);
  ctx.fillStyle = col; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -46, 10, 0, 7); ctx.fillStyle = '#0a1430'; ctx.fill();
  ctx.restore();
}

// ---------- background, header ----------
function background(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const s = 54, off = (t * 12) % (s * 4);
  for (let i = 0; i * s < W + s; i++) {
    const major = i % 4 === 0; const x = i * s + .5;
    ctx.strokeStyle = major ? C.grid2 : C.grid; ctx.lineWidth = major ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let j = -4; j * s < H + s * 4; j++) {
    const major = ((j % 4) + 4) % 4 === 0; const y = j * s + off + .5;
    ctx.strokeStyle = major ? C.grid2 : C.grid; ctx.lineWidth = major ? 1.5 : 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}
function vignette() {
  const g = ctx.createRadialGradient(540, 960, 320, 540, 960, 1180);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function header(t) {
  txt('HOW IT WORKS · ', 70, 190, `500 30px ${MONO}`, C.mute, 'left');
  const w = ctx.measureText('HOW IT WORKS · ').width;
  txt('GOOGLE MAPS', 70 + w, 190, `700 30px ${MONO}`, C.yel, 'left');
  txt('@brainsnck', W - 70, 190, `500 30px ${MONO}`, C.mute, 'right');
  const steps = [[0, 'THE HACK'], [LS(4), 'ASLI RAAZ'], [LS(7), 'GREEN vs LAAL'], [LS(9), 'HACK SAMJHO'], [LS(13), 'SHARE KARO']];
  let cur = steps[0]; for (const s of steps) if (t >= s[0]) cur = s;
  const n = Math.max(0, Math.floor((t - cur[0]) * 40));
  ctx.strokeStyle = C.mute; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(70, 250); ctx.lineTo(108, 250); ctx.stroke();
  const label = cur[1].slice(0, n);
  txt(label, 122, 250, `500 28px ${MONO}`, C.text, 'left');
  if (n < cur[1].length + 6 && Math.floor(t * 4) % 2 === 0) {
    const lw = ctx.measureText(label).width; ctx.fillStyle = C.yel; ctx.fillRect(126 + lw, 235, 14, 30);
  }
}

// ---------- city map ----------
const MAIN_Y = 1000, UP_Y = 640, LOW_Y = 1300, VX = [220, 540, 860], MTOP = 360, MBOT = 1390;
function cityMap() {
  // blocks
  const xs = [0, ...VX, W], ys = [MTOP, UP_Y, MAIN_Y, LOW_Y, MBOT];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x0 = xs[i] + (i ? 24 : -40), x1 = xs[i + 1] - (i < xs.length - 2 ? 24 : -40);
    const y0 = ys[j] + (j ? (ys[j] === MAIN_Y ? 44 : 24) : 0), y1 = ys[j + 1] - (j < ys.length - 2 ? (ys[j + 1] === MAIN_Y ? 44 : 24) : 0);
    rr(x0, y0, x1 - x0, y1 - y0, 16);
    const park = (i === 3 && j === 0) || (i === 0 && j === 3);
    ctx.fillStyle = park ? 'rgba(54,224,139,0.10)' : C.block; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = park ? 'rgba(54,224,139,0.25)' : C.blockLine; ctx.stroke();
  }
  // roads
  ctx.fillStyle = C.road;
  for (const y of [UP_Y, LOW_Y]) ctx.fillRect(0, y - 20, W, 40);
  for (const x of VX) ctx.fillRect(x - 20, MTOP, 40, MBOT - MTOP);
  ctx.fillRect(0, MAIN_Y - 40, W, 80);
  ctx.strokeStyle = C.roadEdge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, MAIN_Y - 40); ctx.lineTo(W, MAIN_Y - 40); ctx.moveTo(0, MAIN_Y + 40); ctx.lineTo(W, MAIN_Y + 40); ctx.stroke();
  // fade map edges into the background
  const g1 = ctx.createLinearGradient(0, MTOP, 0, MTOP + 80); g1.addColorStop(0, C.bg1); g1.addColorStop(1, 'rgba(7,15,34,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, MTOP - 2, W, 82);
  const g2 = ctx.createLinearGradient(0, MBOT - 80, 0, MBOT); g2.addColorStop(0, 'rgba(11,26,58,0)'); g2.addColorStop(1, '#0a1834');
  ctx.fillStyle = g2; ctx.fillRect(0, MBOT - 80, W, 82);
}
// traffic layer on the main road: green everywhere, red/orange around [r0, r1]
function traffic(a, r0, r1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(0, MAIN_Y); ctx.lineTo(W, MAIN_Y); ctx.strokeStyle = C.grn; ctx.lineWidth = 14; ctx.stroke();
  if (r1 > r0) {
    const g = ctx.createLinearGradient(r0 - 120, 0, r1, 0);
    g.addColorStop(0, 'rgba(255,165,59,0)'); g.addColorStop(0.25, C.org); g.addColorStop(0.45, C.red); g.addColorStop(1, C.red);
    ctx.beginPath(); ctx.moveTo(Math.max(0, r0 - 120), MAIN_Y); ctx.lineTo(r1, MAIN_Y);
    ctx.shadowColor = C.red; ctx.shadowBlur = 18; ctx.strokeStyle = g; ctx.lineWidth = 16; ctx.stroke();
  }
  ctx.restore();
}
function cart(x, y, t, nPhones) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 9) * 1.5);
  // person pulling (top-down)
  ctx.beginPath(); ctx.ellipse(118, 0, 18, 30, 0, 0, 7); ctx.fillStyle = '#2f4f8f'; ctx.fill();
  ctx.beginPath(); ctx.arc(118, 0, 15, 0, 7); ctx.fillStyle = '#e9c39b'; ctx.fill();
  ctx.strokeStyle = '#c9d3ea'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(62, 0); ctx.lineTo(104, 0); ctx.stroke();
  // wheels
  ctx.fillStyle = '#05080f';
  for (const [wx, wy] of [[-46, -38], [30, -38], [-46, 30], [30, 30]]) { rr(wx, wy, 22, 9, 3); ctx.fill(); }
  // wagon
  rr(-62, -34, 124, 68, 10); ctx.fillStyle = '#d93a45'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#ff6b74'; ctx.stroke();
  // phones
  let k = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
    if (k++ >= nPhones) break;
    const px = -54 + c * 16, py = -27 + r * 19;
    rr(px, py, 12, 16, 2); ctx.fillStyle = '#0b1226'; ctx.fill();
    const on = hash(k, Math.floor(t * 3)) > 0.25;
    ctx.fillStyle = on ? (hash(k, 1) > 0.5 ? '#63d9ff' : '#9fe8b9') : '#22325a'; ctx.fillRect(px + 2, py + 2, 8, 12);
  }
  ctx.restore();
}
function cartX1(t) { return L(110, 520, P(t, 0.2, 12.2)); }
function cartX2(t) { return 120 + 30 * (t - LS(9)); }

// map scene, first part (the hack)
function sceneMap1(t) {
  cityMap();
  const cx = cartX1(t);
  const ta = P(t, CK('Google Maps ko') - 0.1, CK('Google Maps ko') + 0.3);
  const red = eo(P(t, CK('Google Maps ko'), CK('traffic jam') + 0.4));
  traffic(ta, cx - 60 - 260 * red, cx + 70);
  const n = Math.round(99 * eo(P(t, 0.3, 1.9)));
  cart(cx, MAIN_Y, t, Math.min(21, Math.ceil(n / 4.7)));
  // counter chip follows the cart
  chip(Math.max(170, cx), MAIN_Y - 105, `${n} PHONES`, C.yel, P(t, 0.35, 0.65));
  // empty road label
  chip(820, MAIN_Y + 100, 'KHAALI SADAK', C.mute, win(t, LS(1), CK('Google Maps ko') + 0.6, 0.25, 0.3), { size: 24 });
  // heavy traffic card
  const hc = P(t, CK('traffic jam'), CK('traffic jam') + 0.3) * (1 - P(t, LS(3) - 0.2, LS(3) + 0.1));
  if (hc > 0) {
    ctx.save(); const sh = t < CK('traffic jam') + 0.4 ? Math.sin(t * 80) * 6 * (1 - P(t, CK('traffic jam'), CK('traffic jam') + 0.4)) : 0;
    ctx.translate(690 + sh, 790); const s = back(hc); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, hc * 3);
    rr(-200, -62, 400, 124, 22); glassFill(C.red, 4);
    warnIcon(-140, -4, 1, C.red);
    txt('HEAVY TRAFFIC', 30, -18, `800 34px ${SANS}`, C.red);
    txt('+15 min delay', 30, 24, `500 24px ${MONO}`, C.mute);
    ctx.restore();
  }
  // Berlin chip
  const bf = P(t, LS(2), LS(2) + 0.3);
  if (bf > 0) {
    chip(540, 470, 'BERLIN · 2020', C.yel, bf, { size: 34, h: 72 });
    ctx.save(); ctx.globalAlpha *= P(t, CK('sach me') - 0.1, CK('sach me') + 0.2);
    rr(330, 520, 420, 46, 23); ctx.fillStyle = 'rgba(10,20,48,0.9)'; ctx.fill();
    txt('artist: Simon Weckert', 540, 544, `500 24px ${MONO}`, C.text); ctx.restore();
  }
  // "kaise?" moment
  const qa = P(t, LS(3), LS(3) + 0.3);
  if (qa > 0) {
    ctx.fillStyle = `rgba(4,9,24,${0.6 * qa})`; ctx.fillRect(0, 300, W, 1120);
    ctx.save(); ctx.translate(540, 860 + Math.sin(t * 4) * 8); const s = back(qa); ctx.scale(s, s);
    ctx.shadowColor = C.yel; ctx.shadowBlur = 50; txt('?', 0, 0, `800 360px ${SANS}`, C.yel); ctx.restore();
  }
}

// ---------- eye / phone / data scene ----------
function eye(x, y, s, look, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-110, 0); ctx.quadraticCurveTo(0, -95, 110, 0); ctx.quadraticCurveTo(0, 95, -110, 0); ctx.closePath();
  ctx.fillStyle = '#f2f5fc'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.beginPath(); ctx.arc(look[0], look[1], 38, 0, 7); ctx.fillStyle = C.blue; ctx.fill();
  ctx.beginPath(); ctx.arc(look[0], look[1], 17, 0, 7); ctx.fillStyle = '#071024'; ctx.fill();
  ctx.beginPath(); ctx.arc(look[0] + 10, look[1] - 10, 6, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore(); ctx.restore();
}
function phoneBody(cx, cy, s, screen) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.save(); ctx.shadowColor = 'rgba(99,140,255,0.45)'; ctx.shadowBlur = 50;
  rr(-200, -390, 400, 780, 58); ctx.fillStyle = '#111f45'; ctx.fill(); ctx.restore();
  rr(-200, -390, 400, 780, 58); ctx.lineWidth = 5; ctx.strokeStyle = C.boxLine; ctx.stroke();
  rr(-182, -372, 364, 744, 44); ctx.fillStyle = C.screen; ctx.fill();
  ctx.save(); rr(-182, -372, 364, 744, 44); ctx.clip(); screen(); ctx.restore();
  rr(-55, -362, 110, 26, 13); ctx.fillStyle = '#050a18'; ctx.fill();
  ctx.restore();
}

// =====================================================================
// Hawk-Eye reel scenes
// =====================================================================
window.TOPIC = 'Hawk-Eye';
function STEPS() { return [[0, 'THE MYSTERY'], [LS(2), 'HAWK-EYE KA RAAZ'], [LS(6) - 0.4, 'SHARE KARO']]; }
const SANSB = s => `800 ${s}px ${SANS}`;
const GRASS = '#5f9a6a', GRASS2 = '#578f62', SAND = '#e3cf9c', SAND2 = '#d6bf87', CREAM = '#f6efd9';

function card(x, y, w, h, r, fill, lw = 5, d = 8) {
  hardShadow(x, y, w, h, r, d);
  rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
}
function popAt(x, y, f, fn) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); const s = back(f); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 3); fn(); ctx.restore();
}
function disc(x, y, r, col, d = 5) {
  ctx.beginPath(); ctx.arc(x + d, y + d, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
}
function tickMark(x, y, r, col) {
  disc(x, y, r, col, Math.max(3, r * 0.12));
  line([[x - r * 0.45, y + r * 0.02], [x - r * 0.12, y + r * 0.34], [x + r * 0.46, y - r * 0.3]], INK, Math.max(4, r * 0.2));
}
function bubble(x, y, text, col, f, size = 40) {
  popAt(x, y, f, () => {
    ctx.font = SANSB(size); const w = ctx.measureText(text).width + 56, h = size * 2.1;
    card(-w / 2, -h / 2, w, h, 26, col, 5, 7);
    txt(text, 0, 3, SANSB(size), INK);
  });
}
function badge(x, y, n, col, f) {
  popAt(x, y, f, () => { disc(0, 0, 26, col); txt(String(n), 0, 2, SANSB(30), INK); });
}

// ---------- the Hawk-Eye view: a simple pinhole camera behind the bowler ----------
const VIEW = [40, 335, 1000, 1075, 40];            // x, y, w, h, r of the screen card
const CAM = { z: -20, y: 8, F: 12087, HY: -1530 };   // pitch: z = 0 bowler crease .. 20.12 batter's stumps (metres)
const SZ = 20.12, PADZ = 18.9, PITCHZ = 13.5;
function proj(x, y, z) { const zp = z - CAM.z; return [540 + CAM.F * x / zp, CAM.HY + CAM.F * (CAM.y - y) / zp, CAM.F / zp]; }
// the delivery, u in [0,1]: release -> pitch (0..0.62) -> pad (0.62..1)
function ballWorld(u) {
  if (u <= 0.62) { const s = u / 0.62; return [L(0.5, 0.22, s), 2.1 * (1 - 0.6 * s - 0.4 * s * s), L(0, PITCHZ, s)]; }
  const s = (u - 0.62) / 0.38; return [L(0.22, 0.1, s), 0.62 * s - 0.17 * s * s, L(PITCHZ, PADZ, s)];
}
// predicted path, s in [0,1]: pad -> stumps
function predWorld(s) { return [L(0.1, 0.03, s), 0.45 + 0.1 * s - 0.03 * s * s, L(PADZ, SZ, s)]; }
const BR = z => Math.max(12, 0.036 * 1.9 * CAM.F / (z - CAM.z));   // ball radius on screen (drawn ~2x for clarity)

function fieldView() {
  const [vx, vy, vw, vh, vr] = VIEW;
  hardShadow(vx, vy, vw, vh, vr, 12);
  ctx.save(); rr(vx, vy, vw, vh, vr); ctx.fillStyle = GRASS; ctx.fill(); ctx.clip();
  // mowing stripes across the field
  for (let z = 6; z < 40; z += 1.6) {
    const a = proj(0, 0, z)[1], b = proj(0, 0, z + 0.8)[1];
    ctx.fillStyle = GRASS2; ctx.fillRect(vx, b, vw, a - b);
  }
  // pitch
  const p = [proj(-1.525, 0, 8), proj(1.525, 0, 8), proj(1.525, 0, 22.5), proj(-1.525, 0, 22.5)];
  ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
  ctx.fillStyle = SAND; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = SAND2; ctx.stroke();
  // creases
  const wl = (pts, w) => line(pts.map(q => proj(...q).slice(0, 2)), '#ffffff', w);
  wl([[-1.83, 0, PADZ], [1.83, 0, PADZ]], 6);
  wl([[-1.32, 0, SZ], [1.32, 0, SZ]], 5);
  wl([[-1.32, 0, PADZ - 0.6], [-1.32, 0, 21.4]], 4); wl([[1.32, 0, PADZ - 0.6], [1.32, 0, 21.4]], 4);
  ctx.restore();
}
function stumps(hl) {
  const base = proj(0, 0, SZ), top = proj(0, 0.71, SZ), sp = 0.114 * base[2];
  for (const k of [-1, 0, 1]) {
    const x = base[0] + k * sp;
    hardShadow(x - 7, top[1], 14, base[1] - top[1], 4, 4);
    rr(x - 7, top[1], 14, base[1] - top[1], 4); ctx.fillStyle = hl > 0.5 ? C.red : CREAM; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  for (const k of [-1, 1]) { rr(base[0] + (k < 0 ? -sp - 6 : 6), top[1] - 9, sp, 9, 4); ctx.fillStyle = hl > 0.5 ? C.red : CREAM; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
  if (hl > 0 && hl < 1) {
    const u = hl; ctx.save(); ctx.globalAlpha *= 1 - u; ctx.lineWidth = 10; ctx.strokeStyle = C.yel;
    rr(base[0] - sp - 30 - 40 * u, top[1] - 30 - 40 * u, 2 * sp + 60 + 80 * u, base[1] - top[1] + 60 + 80 * u, 20); ctx.stroke(); ctx.restore();
  }
}
// batter's front pad (no person: just a pad and a shoe)
function pad(shake, glow) {
  const b = proj(0.12, 0, PADZ), t = proj(0.12, 0.62, PADZ), s = b[2];
  const w = 0.17 * s;
  ctx.save(); ctx.translate(shake, 0);
  if (glow > 0) { ctx.save(); ctx.globalAlpha *= glow; ctx.lineWidth = 9; ctx.strokeStyle = C.yel; rr(b[0] - w / 2 - 16, t[1] - 16, w + 32, b[1] - t[1] + 32, 30); ctx.stroke(); ctx.restore(); }
  // shoe
  rr(b[0] - w * 0.6, b[1] - 22, w * 1.2, 30, 12); ctx.fillStyle = C.box; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  hardShadow(b[0] - w / 2, t[1], w, b[1] - t[1] - 14, 22, 6);
  rr(b[0] - w / 2, t[1], w, b[1] - t[1] - 14, 22); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  for (let k = 1; k <= 3; k++) { const y = L(t[1], b[1] - 14, k / 4); line([[b[0] - w / 2 + 8, y], [b[0] + w / 2 - 8, y]], '#c9cbe0', 4); }
  ctx.restore();
}
function ball(x, y, r, col = C.red) {
  ctx.beginPath(); ctx.arc(x + 3, y + 3, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, -1.1, 1.1); ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.stroke();
}
// tube along a world path: f = fraction drawn
function tube(fn, f, col, dashed) {
  if (f <= 0) return;
  const n = 60, pts = [];
  for (let i = 0; i <= n * f; i++) pts.push(fn(i / n));
  pts.push(fn(f));
  const sp = pts.map(w => proj(...w));
  for (let i = 1; i < sp.length; i++) {
    const a = sp[i - 1], b = sp[i], wdt = BR(pts[i][2]) * 1.5;
    if (a[1] > VIEW[1] + VIEW[3] + 40 && b[1] > VIEW[1] + VIEW[3] + 40) continue;
    if (dashed && Math.floor(i / 3) % 2 === 1) continue;
    line([a, b], INK, wdt + 8);
  }
  for (let i = 1; i < sp.length; i++) {
    const a = sp[i - 1], b = sp[i], wdt = BR(pts[i][2]) * 1.5;
    if (dashed && Math.floor(i / 3) % 2 === 1) continue;
    line([a, b], col, wdt);
  }
}
function markerAt(w, col, f) {
  if (f <= 0) return;
  const p = proj(...w);
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2); ctx.translate(p[0], p[1]); ctx.scale(1, 0.42);
  ctx.beginPath(); ctx.arc(0, 0, 34 * back(f), 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function clipView(fn) { const [vx, vy, vw, vh, vr] = VIEW; ctx.save(); rr(vx, vy, vw, vh, vr); ctx.clip(); fn(); ctx.restore(); }
function viewBorder() { const [vx, vy, vw, vh, vr] = VIEW; ctx.save(); rr(vx, vy, vw, vh, vr); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
function verdict(x, y, title, sub, col, f) {
  popAt(x, y, f, () => {
    card(-250, -78, 500, 156, 30, C.box, 6, 10);
    rr(-250, -78, 500, 64, [30, 30, 0, 0]); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    txt(title, 0, -45, `700 30px ${MONO}`, INK);
    txt(sub, 0, 34, SANSB(60), '#ffffff');
  });
}

// ---------- scene 1: the hook + "kaise?" ----------
function sceneHook(t) {
  const tI = CK('Ball pad') + 0.95;                   // ball hits the pad
  const u = P(t, 0.1, tI);
  const kH = CK('par Hawk'), kS = CK('stumps pe');
  const tHit = kS + 0.3;                              // predicted ball reaches the stumps
  fieldView();
  clipView(() => {
    const pf = P(t, 0.1 + (tI - 0.1) * 0.62, 0.1 + (tI - 0.1) * 0.62 + 0.25);
    markerAt([0.22, 0, PITCHZ], C.yel, pf);
    stumps(t >= tHit ? Math.min(1, P(t, tHit, tHit + 0.6) + 0.51) : 0);
    tube(ballWorld, u, C.red);
    pad(t > tI && t < tI + 0.35 ? Math.sin(t * 90) * 7 * (1 - P(t, tI, tI + 0.35)) : 0, 0);
    // predicted path
    const pp = P(t, kH + 0.7, tHit);
    tube(predWorld, pp, C.cyan, true);
    if (pp > 0) { const q = proj(...predWorld(pp)); ball(q[0], q[1], BR(predWorld(pp)[2]), C.cyan); }
    // the real ball, stopped at the pad
    const bw = ballWorld(u), q = proj(...bw);
    ball(q[0], q[1], BR(bw[2]));
    if (t > tI) { const r = P(t, tI, tI + 0.5); if (r < 1) { ctx.beginPath(); ctx.arc(q[0], q[1], 20 + 70 * eo(r), 0, 7); ctx.lineWidth = 9 * (1 - r); ctx.strokeStyle = '#ffffff'; ctx.stroke(); } }
  });
  viewBorder();
  chip(300, 1050, 'PAD PE RUKI!', C.yel, P(t, tI + 0.05, tI + 0.35) * (1 - P(t, kH + 0.6, kH + 0.9)), { size: 30, h: 66 });
  // Hawk-Eye: the eye that sees the rest
  const ef = P(t, kH + 0.15, kH + 0.5);
  if (ef > 0) {
    const bq = proj(...ballWorld(1));
    popAt(540, 465, ef * (1 - P(t, tHit - 0.1, tHit + 0.05)), () => {
      card(-300, -95, 600, 190, 40, C.box, 6, 10);
      const lk = [Math.max(-40, Math.min(40, (bq[0] - 540) / 8)), -26];
      eye(-170, 0, 0.62, lk, INK);
      txt('HAWK-EYE', 70, -22, SANSB(58), '#ffffff');
      txt('bolta hai...', 70, 40, `600 30px ${MONO}`, C.cyan);
    });
  }
  verdict(540, 465, 'WICKETS', 'HITTING', C.red, P(t, tHit + 0.05, tHit + 0.35));
  // "Kaise?"
  const qa = P(t, LS(1) - 0.05, LS(1) + 0.25);
  if (qa > 0) {
    ctx.fillStyle = hexA(BG, 0.93 * qa); ctx.fillRect(0, 300, W, 1135);
    popAt(540, 800, qa, () => {
      disc(0, 0, 200, C.yel, 14);
      ctx.save(); ctx.rotate(Math.sin((t - LS(1)) * 6) * 0.08); txt('?', 0, 18, SANSB(300), INK); ctx.restore();
    });
    chip(540, 1150, 'KAISE?', C.yel, P(t, CK('Kaise') + 0.25, CK('Kaise') + 0.55), { size: 64, h: 120, pad: 80 });
  }
}

// ---------- scene 2: 6 cameras, 340 photos a second ----------
const ST = [540, 900], CAMS = [-150, -90, -30, 30, 90, 150].map(d => d * Math.PI / 180);
const camPos = a => [ST[0] + Math.cos(a) * 418, ST[1] + Math.sin(a) * 438];
function stadium(t) {
  ctx.save();
  ctx.beginPath(); ctx.ellipse(ST[0] + 12, ST[1] + 12, 470, 490, 0, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(ST[0], ST[1], 470, 490, 0, 0, 7); ctx.fillStyle = C.box; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // seats
  for (let k = 0; k < 72; k++) { const a = k / 72 * Math.PI * 2; ctx.beginPath(); ctx.arc(ST[0] + Math.cos(a) * 440, ST[1] + Math.sin(a) * 460, 6, 0, 7); ctx.fillStyle = POP[k % POP.length]; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1; }
  ctx.beginPath(); ctx.ellipse(ST[0], ST[1], 395, 415, 0, 0, 7); ctx.fillStyle = GRASS; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); ctx.clip();
  for (let k = -6; k < 6; k += 2) { ctx.fillStyle = GRASS2; ctx.fillRect(ST[0] - 400, ST[1] + k * 70, 800, 70); }
  ctx.restore();
  ctx.beginPath(); ctx.ellipse(ST[0], ST[1], 200, 210, 0, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([14, 12]); ctx.stroke(); ctx.setLineDash([]);
  rr(ST[0] - 34, ST[1] - 140, 68, 280, 6); ctx.fillStyle = SAND; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  for (const y of [-118, 118]) line([[ST[0] - 30, ST[1] + y], [ST[0] + 30, ST[1] + y]], '#ffffff', 4);
  // ball running down the pitch
  const u = ((t - LS(2)) * 0.9) % 1;
  ball(ST[0] + L(-6, 4, u), ST[1] + L(-120, 125, u), 12);
  ctx.restore();
}
function camIcon(x, y, a, col, flash) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI);
  hardShadow(-38, -28, 64, 56, 12, 5);
  rr(-38, -28, 64, 56, 12); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  rr(22, -18, 26, 36, 6); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-6, 0, 15, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(-6, 0, 7, 0, 7); ctx.fillStyle = flash > 0 ? '#ffffff' : C.cyan; ctx.fill();
  if (flash > 0) { ctx.globalAlpha *= flash; ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(120, -46); ctx.lineTo(120, 46); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill(); }
  ctx.restore();
}
function photo(x, y, s, k, f) {
  popAt(x, y, f, () => {
    ctx.scale(s, s);
    card(-80, -60, 160, 120, 10, '#ffffff', 4, 5);
    rr(-66, -48, 132, 84, 6); ctx.fillStyle = GRASS; ctx.fill();
    rr(-12, -46, 24, 80, 3); ctx.fillStyle = SAND; ctx.fill();
    ctx.beginPath(); ctx.arc(L(-4, 4, k / 5), L(-34, 22, k / 5), 7, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  });
}
function sceneCams(t) {
  const k6 = CK('6 camera'), k340 = CK('har second');
  stadium(t);
  CAMS.forEach((a, i) => {
    const [x, y] = camPos(a), f = P(t, k6 + i * 0.12, k6 + i * 0.12 + 0.3);
    if (f <= 0) return;
    ctx.save(); ctx.translate(x, y); const s = back(f); ctx.scale(s, s); ctx.translate(-x, -y);
    const fl = t > k340 ? Math.max(0, 1 - (((t - k340) * 5 + i * 0.37) % 1) * 3) : 0;
    camIcon(x, y, a, POP[i], fl);
    ctx.restore();
    badge(x + Math.cos(a) * 62, y + Math.sin(a) * 62 - 6, i + 1, C.yel, P(t, k6 + i * 0.12 + 0.1, k6 + i * 0.12 + 0.35));
  });
  chip(540, 370, '6 HIGH-SPEED CAMERA', C.yel, P(t, k6 + 0.05, k6 + 0.35), { size: 32, h: 70 });
  // photos flying from the cameras into the counter
  if (t > k340) {
    for (let j = 0; j < 30; j++) {
      const t0 = k340 + j * 0.06, u = P(t, t0, t0 + 0.55); if (u <= 0 || u >= 1) continue;
      const [x, y] = camPos(CAMS[j % 6]);
      photo(L(x, ST[0], eio(u)), L(y, ST[1], eio(u)), L(0.5, 0.2, u), j % 6, Math.min(1, u * 4) * (1 - P(u, 0.85, 1)));
    }
  }
  const cf = P(t, k340 - 0.05, k340 + 0.3);
  popAt(ST[0], ST[1], cf, () => {
    card(-260, -120, 520, 240, 36, C.box, 6, 12);
    const n = Math.round(340 * eo(P(t, k340, k340 + 1.4)));
    ctx.save(); ctx.lineJoin = 'round'; ctx.font = SANSB(140); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.strokeText(String(n), 0, -22); ctx.fillStyle = C.yel; ctx.fillText(String(n), 0, -22);
    ctx.restore();
    txt('PHOTO · HAR SECOND', 0, 76, `700 30px ${MONO}`, '#ffffff');
  });
}

// ---------- scene 3: join the photos -> 3D path -> predict after the pad ----------
function sceneTrack(t) {
  const t3 = LS(3), kJ = CK('Sab jodo'), k3 = CK('ball ka 3D'), kR = CK('ready'), t4 = LS(4), kA = CK('Raasta AAGE');
  const tHit = kA + 0.95;
  fieldView();
  const N = 22, dotT = i => k3 + 0.1 + i * (kR - k3 - 0.25) / N;
  clipView(() => {
    stumps(t >= tHit ? Math.min(1, P(t, tHit, tHit + 0.6) + 0.51) : 0);
    // solid path once ready
    const rf = P(t, kR, kR + 0.35);
    if (rf > 0) tube(ballWorld, 1, C.red);
    pad(0, t > t4 && t < kA + 0.2 ? 0.5 + 0.5 * Math.sin((t - t4) * 9) : 0);
    // dots: one per photo frame
    if (rf < 1) for (let i = 0; i <= N; i++) {
      const f = P(t, dotT(i), dotT(i) + 0.15); if (f <= 0) continue;
      const w = ballWorld(0.5 + 0.5 * i / N), q = proj(...w);
      ctx.save(); ctx.globalAlpha *= 1 - rf; ball(q[0], q[1], BR(w[2]) * 0.9 * back(f), C.red); ctx.restore();
    }
    if (rf > 0) { const q = proj(...ballWorld(1)); ball(q[0], q[1], BR(PADZ)); }
    // predicted path after the pad
    const pp = P(t, kA + 0.15, tHit);
    tube(predWorld, pp, C.cyan, true);
    if (pp > 0) { const w = predWorld(pp), q = proj(...w); ball(q[0], q[1], BR(w[2]), C.cyan); }
  });
  viewBorder();
  // axis gizmo while building 3D
  const gz = win(t, k3, t4 + 0.2, 0.3, 0.3);
  if (gz > 0) popAt(160, 1300, gz, () => {
    disc(0, 0, 70, C.box, 6);
    line([[-20, 25], [40, 25]], C.red, 8); line([[-20, 25], [-20, -38]], C.grn, 8); line([[-20, 25], [12, -6]], C.cyan, 8);
    txt('3D', 22, -30, SANSB(30), '#ffffff');
  });
  // photos flying in and turning into dots
  for (let j = 0; j < 6; j++) {
    const t0 = kJ - 0.15 + j * 0.11, u = P(t, t0, t0 + 0.8); if (u <= 0 || u >= 1) continue;
    const [sx, sy] = [[-90, 520], [1170, 560], [-90, 900], [1170, 940], [-90, 1260], [1170, 1300]][j];
    const tgt = proj(...ballWorld(0.55 + 0.45 * (j + 1) / 7));
    photo(L(sx, tgt[0], eio(u)), L(sy, tgt[1], eio(u)), L(1.15, 0.3, eio(u)), j, Math.min(1, u * 4) * (1 - P(u, 0.85, 1)));
  }
  chip(540, 410, 'SAB PHOTOS JODO', C.yel, win(t, kJ, k3 + 0.2, 0.3, 0.3), { size: 32, h: 70 });
  // ready
  popAt(540, 1255, P(t, kR, kR + 0.3) * (1 - P(t, t4 + 0.1, t4 + 0.35)), () => {
    ctx.font = SANSB(42); const w = ctx.measureText('3D RAASTA READY').width + 150;
    card(-w / 2, -55, w, 110, 55, C.grn, 5, 8);
    tickMark(-w / 2 + 62, 0, 32, '#ffffff');
    txt('3D RAASTA READY', 38, 3, SANSB(42), INK);
  });
  // after the pad?
  bubble(820, 560, 'pad ke baad?', C.yel, P(t, t4 + 0.05, t4 + 0.35) * (1 - P(t, kA + 0.3, kA + 0.5)), 38);
  chip(820, 600, 'PREDICTION', C.cyan, P(t, kA + 0.3, kA + 0.6), { size: 30, h: 66 });
  chip(540, 1300, 'PHYSICS: SPEED + BOUNCE + SWING', '#ffffff', P(t, kA + 0.25, kA + 0.55) * (1 - P(t, tHit - 0.05, tHit + 0.15)), { size: 26, h: 60 });
  verdict(540, 450, 'WICKETS', 'HITTING', C.red, P(t, tHit + 0.05, tHit + 0.35));
}

// ---------- scene 4: how accurate? 3.6 mm ----------
function sceneError(t) {
  const t5 = LS(5), kS = CK('Sirf 3.6');
  const BC = [540, 760], R = 230, MM = 2 * R / 72;     // ball ~72 mm wide
  chip(540, 400, 'AVERAGE GALTI = ?', C.yel, P(t, t5 + 0.05, t5 + 0.35) * (1 - P(t, kS - 0.1, kS + 0.1)), { size: 34, h: 74 });
  chip(540, 400, 'SIRF 3.6 mm!', C.grn, P(t, kS + 0.1, kS + 0.4), { size: 40, h: 84 });
  const bf = P(t, t5, t5 + 0.35);
  popAt(BC[0], BC[1], bf, () => {
    ctx.beginPath(); ctx.arc(14, 14, R, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
    ctx.setLineDash([16, 12]);
    ctx.beginPath(); ctx.arc(-R * 1.55, 0, R * 1.35, -0.75, 0.75); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.beginPath(); ctx.arc(-R * 1.42, 0, R * 1.35, -0.72, 0.72); ctx.stroke();
    ctx.setLineDash([]);
  });
  // where Hawk-Eye thinks the ball is: a ghost outline 3.6 mm away
  const g = P(t, kS + 0.15, kS + 0.6);
  if (g > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, g * 2);
    ctx.beginPath(); ctx.arc(BC[0] + 3.6 * MM * eo(g), BC[1], R, 0, 7); ctx.setLineDash([18, 12]); ctx.lineWidth = 8; ctx.strokeStyle = C.cyan; ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    const x0 = BC[0] + R, x1 = x0 + 3.6 * MM;
    popAt(x0 + 70, BC[1] - 120, P(t, kS + 0.45, kS + 0.75), () => { card(-62, -34, 124, 68, 34, C.yel, 4, 5); txt('3.6 mm', 0, 2, `700 26px ${MONO}`, INK); });
    line([[x0, BC[1] - 60], [x0, BC[1] + 60]], C.yel, 6); line([[x1, BC[1] - 60], [x1, BC[1] + 60]], C.yel, 6);
  }
  // ruler
  const rf = P(t, t5 + 0.3, t5 + 0.7);
  if (rf > 0) {
    ctx.save(); ctx.globalAlpha *= rf; ctx.translate(0, L(40, 0, eo(rf)));
    const rx = BC[0] - R, ry = 1060;
    card(rx - 30, ry, 2 * R + 60, 120, 16, CREAM, 5, 7);
    for (let m = 0; m <= 72; m++) {
      const x = rx + m * MM, h = m % 10 === 0 ? 46 : (m % 5 === 0 ? 32 : 20);
      line([[x, ry + 4], [x, ry + 4 + h]], INK, m % 10 === 0 ? 4 : 2);
      if (m % 10 === 0) txt(String(m), x, ry + 82, `700 22px ${MONO}`, INK);
    }
    const hf = P(t, kS + 0.2, kS + 0.5);
    if (hf > 0) { rr(rx + 2, ry + 3, 3.6 * MM * hf, 52, 3); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
    txt('mm', rx + 2 * R + 6, ry + 82, `700 22px ${MONO}`, INK, 'left');
    ctx.restore();
    chip(540, 1250, 'CRICKET BALL ≈ 72 mm', '#ffffff', P(t, t5 + 0.6, t5 + 0.9) * (1 - P(t, kS + 0.5, kS + 0.7)), { size: 28, h: 62 });
  }
  // counter
  popAt(540, 1300, P(t, kS + 0.5, kS + 0.8), () => {
    card(-270, -68, 540, 136, 34, C.box, 6, 10);
    const v = (3.6 * eo(P(t, kS + 0.5, kS + 1.3))).toFixed(1);
    txt(v + ' mm', -70, 4, SANSB(80), C.yel);
    txt('GALTI', 150, 10, `700 32px ${MONO}`, '#ffffff', 'left');
  });
}

// ---------- scene 5: CTA chat ----------
function sceneCTA(t) {
  const t0 = LS(6) - 0.4, kD = CK('wale dost');
  const pa = P(t, t0, t0 + 0.4);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pa * 2);
  phoneBody(540, 875, L(0.85, 0.95, back(pa)), () => {
    rr(-182, -372, 364, 125, 0); ctx.fillStyle = '#1b2246'; ctx.fill();
    disc(-120, -302, 30, C.pink, 3); txt('D', -120, -300, SANSB(30), INK);
    txt('Dost', -72, -316, `700 32px ${SANS}`, '#ffffff', 'left'); txt('online', -72, -280, `500 20px ${MONO}`, C.grn, 'left');
    const bub = (y, text, right, f, col, tc) => {
      if (f <= 0) return; ctx.save(); ctx.globalAlpha *= Math.min(1, f * 3); ctx.font = `600 28px ${SANS}`;
      const lines = text.split('\n'); const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 44; const h = 26 + lines.length * 40;
      const x = right ? 165 - w : -165; ctx.translate(0, L(20, 0, eo(f)));
      rr(x, y, w, h, 22); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      lines.forEach((l, i) => txt(l, x + 22, y + 33 + i * 40, `600 28px ${SANS}`, tc, 'left'));
      ctx.restore();
    };
    const lab = (y, s, f) => { if (f > 0) { ctx.save(); ctx.globalAlpha *= f; txt(s, 0, y, `700 20px ${MONO}`, C.dim); ctx.restore(); } };
    lab(-215, 'SUNDAY · GALI MATCH', P(t, t0 + 0.15, t0 + 0.35));
    bub(-190, 'pakka OUT tha!\nDRS lo DRS!', false, P(t, t0 + 0.2, t0 + 0.5), '#3a4373', '#ffffff');
    bub(-60, 'Hawk-Eye: ball\nleg stump ke bahar', true, P(t, LS(6) + 0.45, LS(6) + 0.75), C.yel, INK);
    const typing = t > kD - 0.15 && t < kD + 0.55;
    if (typing) { rr(-165, 85, 120, 60, 22); ctx.fillStyle = '#3a4373'; ctx.fill(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-133 + i * 28, 115 + Math.sin(t * 10 + i) * 5, 8, 0, 7); ctx.fillStyle = C.mute; ctx.fill(); } }
    bub(85, 'ek aur review?', false, P(t, kD + 0.55, kD + 0.85), '#3a4373', '#ffffff');
  });
  ctx.restore();
  chip(540, 380, 'IS DOST KO BHEJO', C.yel, P(t, t0 + 0.2, t0 + 0.5), { size: 30, h: 66 });
  const bf = P(t, kD + 0.95, kD + 1.2);
  if (bf > 0) {
    const sh = Math.sin(t * 70) * 7 * (1 - P(t, kD + 0.95, kD + 1.4));
    chip(540 + sh, 1345, 'REVIEW GAWA DIYA!', C.red, bf, { size: 36, h: 80 });
  }
}

function sceneList() {
  return [[0, LS(2), sceneHook], [LS(2), LS(3), sceneCams], [LS(3), LS(5), sceneTrack], [LS(5), LS(6) - 0.4, sceneError], [LS(6) - 0.4, END + 0.4, sceneCTA]];
}
function reelBursts(t) {
  burst(t, CK('stumps pe') + 0.35, 545, 760, [C.red, C.org, C.yel], 22, 1.1);
  burst(t, CK('Kaise') + 0.25, 540, 800, POP, 26, 1.3);
  burst(t, CK('ready'), 540, 1255, [C.grn, C.cyan, '#ffffff'], 22, 1.2);
  burst(t, CK('Raasta AAGE') + 1.0, 545, 760, [C.red, C.org, C.yel], 24, 1.2);
  burst(t, CK('Sirf 3.6') + 0.5, 540, 1300, [C.yel, C.grn, '#ffffff'], 24, 1.3);
  burst(t, CK('wale dost') + 0.95, 540, 1345, [C.red, C.org, C.yel], 22);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
