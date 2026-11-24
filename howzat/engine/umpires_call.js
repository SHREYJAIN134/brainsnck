window.BG = '#3f6b4f';
// "Stumps pe lagi, phir bhi NOT OUT kaise?" (DRS umpire's call) — 1080x1920, synced to window.TL
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

// ---------- shared flat helpers (same as the IPL max-fee reel) ----------
const SANSB = s => `800 ${s}px ${SANS}`;
const SKIN = '#e6b48a';
const WOOD = '#e8c88f', WOOD2 = '#d2aa6c', CREAM = '#f6efd9', TURF = '#4f7d5c', TURF2 = '#5b8c68', STRIP = '#d9c597';
const GRIP = '#2e3a6e';

function card(x, y, w, h, r, fill, lw = 5, d = 8) {
  hardShadow(x, y, w, h, r, d);
  rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
}
function popAt(x, y, f, fn) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); const s = back(f); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 3); fn(); ctx.restore();
}
function disc(x, y, r, col, d = 5) {
  if (d > 0) { ctx.beginPath(); ctx.arc(x + d, y + d, r, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
}
function tickMark(x, y, r, col) {
  disc(x, y, r, col, Math.max(3, r * 0.12));
  line([[x - r * 0.45, y + r * 0.02], [x - r * 0.12, y + r * 0.34], [x + r * 0.46, y - r * 0.3]], INK, Math.max(4, r * 0.2));
}
function crossMark(x, y, r) {
  line([[x - r, y - r], [x + r, y + r]], INK, r * 0.55); line([[x + r, y - r], [x - r, y + r]], INK, r * 0.55);
  line([[x - r, y - r], [x + r, y + r]], C.red, r * 0.32); line([[x + r, y - r], [x - r, y + r]], C.red, r * 0.32);
}
function shake(t, t0, d = 0.45, a = 8) { return t > t0 && t < t0 + d ? Math.sin(t * 80) * a * (1 - P(t, t0, t0 + d)) : 0; }
function ring(x, y, t, t0, col = '#ffffff', r0 = 20, r1 = 100, d = 0.6) {
  const r = P(t, t0, t0 + d); if (r <= 0 || r >= 1) return;
  ctx.beginPath(); ctx.arc(x, y, r0 + (r1 - r0) * eo(r), 0, 7); ctx.lineWidth = 9 * (1 - r); ctx.strokeStyle = col; ctx.stroke();
}
function chipW(x, y, label, col, t, a, b, opts = {}) {
  const fo = 1 - P(t, b - 0.2, b); if (fo <= 0) return;
  ctx.save(); ctx.globalAlpha *= fo; chip(x + shake(t, a, 0.4, 6), y, label, col, P(t, a, a + 0.3), opts); ctx.restore();
}
// rubber stamp that slams down
function stamp(x, y, label, col, f, rot = -0.12, size = 72, tc = '#ffffff') {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const s = L(1.9, 1, eo(f)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 2.5);
  ctx.font = SANSB(size); const w = ctx.measureText(label).width + 70, h = size * 1.5;
  hardShadow(-w / 2, -h / 2, w, h, 18, 9);
  rr(-w / 2, -h / 2, w, h, 18); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  rr(-w / 2 + 13, -h / 2 + 13, w - 26, h - 26, 10); ctx.lineWidth = 4; ctx.strokeStyle = tc === '#ffffff' ? '#ffffff' : INK; ctx.stroke();
  ctx.font = SANSB(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (tc === '#ffffff') { ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.strokeText(label, 0, 6); }
  ctx.fillStyle = tc; ctx.fillText(label, 0, 6);
  ctx.restore();
}
function bubble(x, y, w, h, label, f, size = 44) {
  popAt(x, y, f, () => {
    hardShadow(-w / 2, -h / 2, w, h, 28, 7);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 28);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w / 2 + 40, h / 2 - 4); ctx.lineTo(-w / 2 + 20, h / 2 + 36); ctx.lineTo(-w / 2 + 84, h / 2 - 4); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.fillRect(-w / 2 + 38, h / 2 - 9, 50, 8);
    txt(label, 0, 4, SANSB(size), INK);
  });
}
function arrowR(x0, y, x1, col, f) {   // arrow growing left -> right
  if (f <= 0) return; const xe = L(x0, x1, eo(f));
  line([[x0, y], [xe, y]], INK, 20); line([[x0, y], [xe, y]], col, 11);
  if (f > 0.3) { ctx.beginPath(); ctx.moveTo(xe + 22, y); ctx.lineTo(xe - 14, y - 26); ctx.lineTo(xe - 14, y + 26); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
}

// =====================================================================
// DRS umpire's call reel: "Stumps pe lagi, phir bhi NOT OUT kaise?"
// original flat drawings only: pad, ball, stumps, screens, a generic umpire hat (no real people, no logos)
// =====================================================================
window.TOPIC = "Umpire's Call";
function STEPS() { return [[0, 'DRS KA DRAMA'], [LS(2), 'ANDAAZE KA RAAZ'], [LS(3), '50% RULE']]; }

// bat seen front-on; (x, y) = top of the blade, handle above
function bat(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  rr(-15, -175, 30, 190, 13); ctx.fillStyle = GRIP; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (let k = 0; k < 6; k++) line([[-15, -152 + k * 26], [15, -140 + k * 26]], 'rgba(255,255,255,0.35)', 3);
  hardShadow(-50, 0, 100, 380, 22, 7);
  rr(-50, 0, 100, 380, 22); ctx.fillStyle = WOOD; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  rr(-32, 28, 16, 320, 8); ctx.fillStyle = WOOD2; ctx.fill();
  ctx.restore();
}
// batting pad seen front-on; (x, y) = top centre
function pad(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  hardShadow(-80, 0, 160, 420, 50, 8);
  rr(-80, 0, 160, 420, 50); ctx.fillStyle = CREAM; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  for (const dx of [-40, 0, 40]) { rr(dx - 13, 125, 26, 265, 13); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(13,10,38,0.30)'; ctx.stroke(); }
  rr(-66, 22, 132, 78, 36); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (const sy of [160, 305]) { rr(-92, sy, 184, 24, 8); ctx.fillStyle = GRIP; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
}
function ball(x, y, r, rot = 0.5) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(r * 0.14, r * 0.14, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = Math.max(3, r * 0.12); ctx.strokeStyle = INK; ctx.stroke();
  ctx.rotate(rot);
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * r * 0.18, -r * 0.86); ctx.quadraticCurveTo(d * r * 0.42, 0, d * r * 0.18, r * 0.86); ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = '#ffffff'; ctx.setLineDash([r * 0.16, r * 0.12]); ctx.stroke(); }
  ctx.setLineDash([]); ctx.restore();
}
// three stumps; (x, y) = ground centre. The middle stump can carry the mic.
function stumps(x, y, s, mic, micPulse = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  for (const dx of [-72, 0, 72]) { hardShadow(dx - 17, -520, 34, 520, 15, 6); rr(dx - 17, -520, 34, 520, 15); ctx.fillStyle = CREAM; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  for (const bx of [-36, 36]) { rr(bx - 46, -548, 92, 24, 12); ctx.fillStyle = WOOD; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  if (mic) {
    const ms = 1 + 0.12 * micPulse;
    ctx.save(); ctx.translate(0, -275); ctx.scale(ms, ms);
    hardShadow(-34, -66, 68, 132, 34, 6);
    rr(-34, -66, 68, 132, 34); ctx.fillStyle = GRIP; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (let k = 0; k < 5; k++) line([[-17, -40 + k * 20], [17, -40 + k * 20]], C.cyan, 5);
    ctx.restore();
  }
  ctx.restore();
}

// ---------- line 0: ball-tracking screen, ball just clips the off stump ----------
const TVP = [60, 330, 960, 1060, 40];
const ST0 = [540, 1250, 0.9];                       // stumps on the replay screen (x, ground y, scale)
const HIT0 = [639, 905, 34];                        // where the predicted ball meets the stumps
function trackPt(u) {                               // far end (small) -> bounce -> stumps
  const b = 0.62;
  if (u < b) { const k = u / b; return [L(330, 560, k), L(430, 1080, eio(k) * 0.9 + k * 0.1), L(11, 26, k)]; }
  const k = (u - b) / (1 - b); return [L(560, HIT0[0], k), L(1080, HIT0[1], eo(k)), L(26, HIT0[2], k)];
}
function screenTurf() {
  const [x, y, w, h] = TVP;
  ctx.fillStyle = TURF; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = TURF2; for (let k = 0; k < 6; k++) ctx.fillRect(x, y + 110 + k * 170, w, 85);
  ctx.beginPath(); ctx.moveTo(470, y); ctx.lineTo(610, y); ctx.lineTo(800, y + h); ctx.lineTo(280, y + h); ctx.closePath(); ctx.fillStyle = STRIP; ctx.fill();
  line([[300, 1255], [780, 1255]], '#ffffff', 8);
}
function sceneTrack(t) {
  const [x, y, w, h, r] = TVP;
  const kC = CK('CHHOO'), u = P(t, 0.1, kC + 0.05);
  hardShadow(x, y, w, h, r, 12);
  ctx.save(); rr(x, y, w, h, r); ctx.clip();
  screenTurf();
  stumps(ST0[0], ST0[1], ST0[2], false);
  // the tracking tube behind the ball
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const v = (i / n) * u; const [px, py, pr] = trackPt(v);
    ctx.beginPath(); ctx.arc(px, py, pr * 0.92, 0, 7); ctx.fillStyle = hexA(C.red, 0.30); ctx.fill();
  }
  if (u > 0) { const [bx, by, br] = trackPt(u); ball(bx, by, br, t * 6); }
  // top bar
  ctx.fillStyle = 'rgba(13,10,38,0.78)'; ctx.fillRect(x, y, w, 86);
  txt('BALL-TRACKING', x + 40, y + 45, `700 32px ${MONO}`, '#ffffff', 'left');
  const blink = Math.floor(t * 2.5) % 2 === 0 ? 1 : 0.55;
  ctx.save(); ctx.globalAlpha *= blink; rr(x + w - 170, y + 18, 130, 52, 26); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt('DRS', x + w - 105, y + 46, `700 28px ${MONO}`, INK); ctx.restore();
  ctx.restore();
  rr(x, y, w, h, r); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // the touch: ring + magnified chip
  ring(HIT0[0], HIT0[1], t, kC, '#ffffff', 30, 130, 0.6);
  ring(HIT0[0], HIT0[1], t, kC + 0.25, C.yel, 30, 130, 0.6);
  chipW(830, 760, 'CHHOO RAHI!', C.grn, t, kC + 0.05, LS(1) + 0.4, { size: 38, h: 76 });
  if (t > kC) { ctx.save(); ctx.globalAlpha *= P(t, kC, kC + 0.2); line([[HIT0[0] + 30, HIT0[1] - 30], [760, 800]], INK, 9); line([[HIT0[0] + 30, HIT0[1] - 30], [760, 800]], '#ffffff', 4); ctx.restore(); }
}

// ---------- line 1: third umpire screen says UMPIRE'S CALL -> NOT OUT ----------
function sceneVerdict(t) {
  const t0 = LS(1), kN = CK('NOT OUT'), kQ = LE(1) - 0.7;
  const bf = P(t, t0 - 0.1, t0 + 0.3);
  popAt(540, 780, bf, () => {
    card(-430, -330, 860, 660, 40, C.box, 6, 12);
    txt('THIRD UMPIRE · LBW', 0, -270, `700 32px ${MONO}`, C.mute);
    const rows = [['PITCHING', 'IN LINE', C.grn], ['IMPACT', 'IN LINE', C.grn], ['WICKETS', "UMPIRE'S CALL", C.org]];
    rows.forEach(([a, b, col], i) => {
      const f = P(t, t0 + 0.1 + i * 0.22, t0 + 0.35 + i * 0.22); if (f <= 0) return;
      const yy = -170 + i * 150;
      ctx.save(); ctx.globalAlpha *= f; ctx.translate(L(-40, 0, eo(f)), 0);
      rr(-380, yy - 52, 760, 104, 26); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
      txt(a, -350, yy + 2, `700 34px ${MONO}`, '#ffffff', 'left');
      ctx.font = `700 30px ${MONO}`; const bw = ctx.measureText(b).width + 44;
      rr(350 - bw, yy - 32, bw, 64, 32); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      txt(b, 350 - bw / 2, yy + 2, `700 30px ${MONO}`, INK);
      ctx.restore();
    });
    if (t < kN) { const d = Math.floor(t * 3) % 4; txt('CHECKING' + '.'.repeat(d), 0, 240, SANSB(52), '#ffffff'); }
  });
  stamp(540, 1290, 'NOT OUT', C.red, P(t, kN, kN + 0.22), -0.08, 96);
  bubble(830, 400, 240, 110, 'KYUN?', P(t, kQ, kQ + 0.3), 50);
}

// ---------- line 2: side view, after the pad the path is only a prediction ----------
const PADX = 700, IMP = [PADX - 34, 905], STX = 935, GROUND = 1150;
function sidePath(u) {   // real path: bowler's hand -> bounce -> pad
  const b = 0.6;
  if (u < b) { const k = u / b; return [L(130, 470, k), L(600, GROUND - 20, k * k)]; }
  const k = (u - b) / (1 - b); return [L(470, IMP[0], k), L(GROUND - 20, IMP[1], eo(k))];
}
function sidePad(x, y0, sx) {   // pad seen side-on, standing on the ground
  ctx.save(); ctx.translate(x + sx, 0); ctx.lineJoin = 'round';
  hardShadow(-32, y0, 64, GROUND - y0, 30, 7);
  rr(-32, y0, 64, GROUND - y0, 30); ctx.fillStyle = CREAM; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  for (const sy of [y0 + 70, y0 + 190]) { rr(-40, sy, 80, 22, 8); ctx.fillStyle = GRIP; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  rr(-26, GROUND - 46, 92, 46, 18); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();   // shoe
  ctx.restore();
}
function sideStump(x) {
  hardShadow(x - 17, 735, 34, GROUND - 735, 14, 6);
  rr(x - 17, 735, 34, GROUND - 735, 14); ctx.fillStyle = CREAM; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  rr(x - 40, 712, 80, 22, 10); ctx.fillStyle = WOOD; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
}
function sceneGuess(t) {
  const t0 = LS(2), kP = CK('Pad ke baad'), kR = CK('ka raasta'), kA = CK('sirf ANDAAZA');
  const sf = P(t, t0 - 0.15, t0 + 0.3);
  ctx.save(); ctx.globalAlpha *= sf;
  rr(60, GROUND, 960, 40, 20); ctx.fillStyle = STRIP; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
  const hitT = kP + 0.35, u = P(t, t0, hitT);
  // real path (camera saw it): solid
  const pts = []; for (let i = 0; i <= 40; i++) pts.push(sidePath(i / 40 * u));
  if (u > 0) { line(pts, INK, 16); line(pts, C.cyan, 9); }
  // predicted path after the pad: dashed + widening cone
  const pf = P(t, kR, kR + 0.6);
  const end = [STX, 880];
  const cf = P(t, kA - 0.05, kA + 0.35);
  if (cf > 0) {
    const spread = 130 * eo(cf);
    ctx.save(); ctx.globalAlpha *= 0.9;
    ctx.beginPath(); ctx.moveTo(IMP[0], IMP[1]); ctx.lineTo(end[0] + 40, end[1] - spread); ctx.lineTo(end[0] + 40, end[1] + spread); ctx.closePath();
    ctx.fillStyle = hexA(C.org, 0.45); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  sideStump(STX);
  sidePad(PADX, 780, shake(t, hitT, 0.4, 9));
  if (pf > 0) {
    const pe = [L(IMP[0], end[0], eo(pf)), L(IMP[1], end[1], eo(pf))];
    line([IMP, pe], INK, 14); ctx.setLineDash([22, 16]); line([IMP, pe], C.org, 8); ctx.setLineDash([]);
  }
  if (u > 0) { const [bx, by] = sidePath(u); ball(t < hitT ? bx : IMP[0] - 6, t < hitT ? by : IMP[1], 24, t * 7); }
  chipW(300, 470, 'CAMERA NE DEKHA', C.cyan, t, t0 + 0.2, LS(3) + 0.4, { size: 30, h: 66 });
  chipW(PADX - 40, 690, 'PAD!', C.yel, t, hitT, LS(3) + 0.4, { size: 34, h: 70 });
  chipW(800, 560, 'AAGE? ANDAAZA', C.org, t, kR + 0.1, LS(3) + 0.4, { size: 30, h: 66 });
  if (cf > 0) for (let k = 0; k < 3; k++) {
    const q = P(t, kA + 0.15 + k * 0.12, kA + 0.4 + k * 0.12);
    popAt(STX - 70 + k * 60, 880 + (k - 1) * 95, q, () => txt('?', 0, 0, SANSB(64), '#ffffff'));
  }
  stamp(540, 1310, 'ANDAAZA!', C.red, P(t, kA + 0.25, kA + 0.47), -0.06, 80);
}

// ---------- lines 3-4: the wicket zone and the 50% rule ----------
const ST1 = [540, 1240, 1.0];
const ZONE = [540 - 89, 1240 - 548, 178, 548];      // x, y, w, h: stumps width, ground to top of the bails
const BR = 46, ZY = 900;
function inFrac(bx) { return clamp((ZONE[0] + ZONE[2] - (bx - BR)) / (2 * BR)); }   // share of the ball inside (right edge)
function zoneView(t, bx, fIn, hlCol) {
  stumps(ST1[0], ST1[1], ST1[2], false);
  const [zx, zy, zw, zh] = ZONE;
  ctx.save(); ctx.globalAlpha *= fIn;
  rr(zx - 4, zy - 4, zw + 8, zh + 8, 10); ctx.fillStyle = hexA(C.yel, 0.16); ctx.fill();
  ctx.setLineDash([20, 14]); ctx.lineWidth = 7; ctx.strokeStyle = C.yel; ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  ball(bx, ZY, BR, 0.4);
  // tint the part of the ball inside the zone
  ctx.save(); ctx.beginPath(); ctx.rect(zx, zy, zw, zh); ctx.clip();
  ctx.beginPath(); ctx.arc(bx, ZY, BR - 3, 0, 7); ctx.fillStyle = hexA(hlCol, 0.75); ctx.fill();
  ctx.restore();
  // split line through the ball centre
  line([[bx, ZY - BR - 18], [bx, ZY + BR + 18]], INK, 9); line([[bx, ZY - BR - 18], [bx, ZY + BR + 18]], '#ffffff', 4);
  line([[zx + zw, zy - 10], [zx + zw, zy + zh]], INK, 4);
}
function pctChip(x, y, pct, col, f) {
  chip(x, y, Math.round(pct * 100) + '% ANDAR', col, f, { size: 40, h: 82 });
}
function sceneHalf(t) {
  const t0 = LS(3), kA = CK('Isliye aadhi'), kZ = CK('se zyada'), kS = CK('stumps pe chahiye');
  const fIn = P(t, t0 - 0.1, t0 + 0.3);
  const bx = L(ZONE[0] + ZONE[2], ZONE[0] + ZONE[2] - 0.2 * 2 * BR, eio(P(t, kZ - 0.1, kZ + 0.5)));
  ctx.save(); ctx.globalAlpha *= fIn; zoneView(t, bx, fIn, C.grn); ctx.restore();
  chipW(540, 560, 'WICKET ZONE', C.yel, t, t0 + 0.05, LS(4) + 0.4, { size: 34, h: 70 });
  const pct = inFrac(bx);
  const ok = t >= kS + 0.25;
  pctChip(830, ZY, pct, ok ? C.grn : '#ffffff', P(t, kA + 0.1, kA + 0.4));
  popAt(830, ZY + 110, P(t, kS + 0.25, kS + 0.5), () => tickMark(0, 0, 40, C.grn));
  chipW(250, 1060, '50% SE ZYADA', C.grn, t, kZ + 0.1, LS(4) + 0.4, { size: 30, h: 66 });
  stamp(540, 1340, 'OUT!', C.grn, P(t, kS + 0.4, kS + 0.62), -0.07, 80, INK);
}
function umpireHat(x, y, s) {   // generic umpire: face + wide white hat (original flat drawing)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(6, 36, 78, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 30, 78, 0, 7); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(-26, 36, 8, 0, 7); ctx.arc(26, 36, 8, 0, 7); ctx.fillStyle = INK; ctx.fill();
  line([[-22, 74], [22, 74]], INK, 7);
  ctx.beginPath(); ctx.ellipse(0, -28, 150, 34, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-82, -30); ctx.bezierCurveTo(-82, -120, 82, -120, 82, -30); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
  rr(-82, -52, 164, 22, 6); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}
function sceneUmpire(t) {
  const t0 = LS(4), kK = CK('Usse kam'), kU = CK('Umpire ka faisla'), kC = CK('hi chalega');
  const start = ZONE[0] + ZONE[2] - 0.2 * 2 * BR, out = ZONE[0] + ZONE[2] + 0.3 * 2 * BR;
  const bx = L(start, out, eio(P(t, kK, kK + 0.55)));
  zoneView(t, bx, 1, C.red);
  const pct = inFrac(bx);
  pctChip(830, ZY, pct, t > kK + 0.35 ? C.red : '#ffffff', 1);
  chipW(830, ZY + 110, 'KAM!', C.red, t, kK + 0.45, LS(5), { size: 38, h: 76 });
  // umpire's call card on top
  popAt(540, 470, P(t, kU - 0.1, kU + 0.25), () => {
    card(-400, -120, 800, 240, 40, C.org, 6, 10);
    umpireHat(-270, 10, 0.72);
    txt("UMPIRE'S", 70, -36, SANSB(66), INK);
    txt('CALL', 70, 50, SANSB(66), INK);
  });
  popAt(540, 1335, P(t, kC - 0.05, kC + 0.25), () => {
    card(-410, -62, 820, 124, 62, '#ffffff', 6, 9);
    txt('MAIDAN KA FAISLA = FINAL', 0, 4, SANSB(44), INK);
  });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneTrack], [LS(1), LS(2), sceneVerdict], [LS(2), LS(3), sceneGuess],
          [LS(3), LS(4), sceneHalf], [LS(4), LS(n) - 0.4, sceneUmpire],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('CHHOO') + 0.1, HIT0[0], HIT0[1], [C.grn, C.yel, '#ffffff'], 24, 1.2);
  burst(t, CK('NOT OUT') + 0.1, 540, 1290, [C.red, C.org, C.yel], 26, 1.3);
  burst(t, CK('sirf ANDAAZA') + 0.4, 540, 1310, [C.org, C.yel, '#ffffff'], 24, 1.2);
  burst(t, CK('stumps pe chahiye') + 0.45, 540, 1340, [C.grn, C.yel, '#ffffff'], 26, 1.3);
  burst(t, CK('hi chalega') + 0.1, 540, 1335, [C.org, C.yel, '#ffffff'], 24, 1.2);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈↑✓…●–−★%\'')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
