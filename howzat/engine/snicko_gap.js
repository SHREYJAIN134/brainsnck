window.BG = '#3e6452';
// "Camera me gap, phir bhi edge kaise?" (DRS Snicko) — 1080x1920, synced to window.TL
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
// DRS Snicko reel: "Camera me gap, phir bhi edge kaise?"
// original flat drawings only: bat, pad, ball, stumps, screens (no real people, no logos)
// =====================================================================
window.TOPIC = 'DRS Snicko';
function STEPS() { return [[0, 'CAMERA vs MIC'], [LS(2), 'SNICKO KA RAAZ'], [LS(4), 'LBW RULE']]; }

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

// ---------- line 0: front-on replay shows a GAP ----------
const TV = [60, 340, 960, 1010, 40];
const EDGE_POS = [558, 800, 30];          // ball beside the bat edge (TV coordinates)
function fieldTV(bx, by, br) {
  const [x, y, w, h] = TV;
  ctx.fillStyle = TURF; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = TURF2; for (let k = 0; k < 6; k++) ctx.fillRect(x, y + 120 + k * 160, w, 80);
  ctx.beginPath(); ctx.moveTo(420, y); ctx.lineTo(660, y); ctx.lineTo(760, y + h); ctx.lineTo(320, y + h); ctx.closePath(); ctx.fillStyle = STRIP; ctx.fill();
  line([[300, 1150], [780, 1150]], '#ffffff', 8);
  pad(680, 640, 1);
  bat(450, 600, 1);
  if (bx !== null) ball(bx, by, br);
}
function ballPath(u) {   // from the bowler's end towards the bat edge
  return [L(690, EDGE_POS[0], u), L(430, EDGE_POS[1], eio(u)) - 60 * Math.sin(Math.PI * u), L(12, EDGE_POS[2], u * u)];
}
function sceneGap(t) {
  const [x, y, w, h, r] = TV;
  const u = P(t, 0.15, CK('bat-ball') + 0.1);
  const [bx, by, br] = ballPath(u);
  hardShadow(x, y, w, h, r, 12);
  ctx.save(); rr(x, y, w, h, r); ctx.clip();
  fieldTV(bx, by, br);
  // top bar of the replay screen
  ctx.fillStyle = 'rgba(13,10,38,0.78)'; ctx.fillRect(x, y, w, 86);
  txt('FRONT-ON CAMERA', x + 40, y + 45, `700 32px ${MONO}`, '#ffffff', 'left');
  const blink = Math.floor(t * 2.5) % 2 === 0 ? 1 : 0.55;
  ctx.save(); ctx.globalAlpha *= blink; rr(x + w - 210, y + 18, 170, 52, 26); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt('● REPLAY', x + w - 125, y + 46, `700 26px ${MONO}`, INK); ctx.restore();
  ctx.restore();
  rr(x, y, w, h, r); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // freeze icon once the ball is beside the bat
  const fz = P(t, CK('bat-ball') + 0.1, CK('bat-ball') + 0.35);
  popAt(150, 1260, fz, () => { card(-60, -40, 120, 80, 20, C.yel, 4, 5); rr(-22, -22, 14, 44, 4); ctx.fillStyle = INK; ctx.fill(); rr(8, -22, 14, 44, 4); ctx.fill(); });
  // magnifier on the bat edge
  const mf = P(t, CK('bat-ball') + 0.2, CK('bat-ball') + 0.6);
  if (mf > 0) {
    const mx = 800, my = 600, mr = 175, z = 3.0, cx = 518, cy = EDGE_POS[1];
    ctx.save(); ctx.globalAlpha *= Math.min(1, mf * 3);
    line([[cx - 36, cy - 60], [mx - mr * 0.75, my + mr * 0.6]], INK, 10);
    line([[cx - 36, cy - 60], [mx - mr * 0.75, my + mr * 0.6]], '#ffffff', 5);
    ctx.beginPath(); ctx.arc(cx, cy, 70, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.translate(mx, my); const s = back(mf); ctx.scale(s, s); ctx.translate(-mx, -my);
    ctx.beginPath(); ctx.arc(mx + 10, my + 10, mr + 10, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.clip();
    ctx.translate(mx, my); ctx.scale(z, z); ctx.translate(-cx, -cy);
    fieldTV(EDGE_POS[0], EDGE_POS[1], EDGE_POS[2]);
    ctx.restore();
    // the gap: double arrow between bat edge and ball
    const gx0 = mx + (507 - cx) * z, gx1 = mx + (EDGE_POS[0] - EDGE_POS[2] - cx) * z, gy = my;
    const gf = P(t, CK('GAP') - 0.05, CK('GAP') + 0.25);
    if (gf > 0) {
      ctx.save(); ctx.globalAlpha *= gf;
      line([[gx0 + 6, gy], [gx1 - 6, gy]], INK, 14); line([[gx0 + 6, gy], [gx1 - 6, gy]], C.grn, 7);
      for (const [px, d] of [[gx0 + 4, 1], [gx1 - 4, -1]]) { ctx.beginPath(); ctx.moveTo(px, gy); ctx.lineTo(px + d * 14, gy - 13); ctx.lineTo(px + d * 14, gy + 13); ctx.closePath(); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(mx, my, mr - 7, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = C.yel; ctx.stroke();
    ctx.restore();
  }
  chipW(800, 830, 'GAP!', C.grn, t, CK('GAP'), LS(1) + 0.4, { size: 40, h: 76 });
}

// ---------- line 1: India reviews... NOT OUT, review gone ----------
function tSign(x, y, s) {   // the "T" review signal: two forearms, original flat drawing
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  hardShadow(-48, 10, 96, 280, 40, 8);
  rr(-48, 10, 96, 280, 40); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  rr(-58, 220, 116, 70, 20); ctx.fillStyle = '#4f7fd1'; ctx.fill(); ctx.stroke();
  hardShadow(-230, -52, 460, 96, 46, 8);
  rr(-230, -52, 460, 96, 46); ctx.fillStyle = SKIN; ctx.fill(); ctx.stroke();
  for (const k of [-1, 1]) { rr(k * 230 - (k > 0 ? 70 : 0), -58, 70, 108, 26); ctx.fillStyle = '#4f7fd1'; ctx.fill(); ctx.stroke(); }
  for (const fx of [-24, 0, 24]) line([[fx, 12], [fx, 40]], 'rgba(13,10,38,0.45)', 4);
  ctx.restore();
}
function sceneLost(t) {
  const t0 = LS(1), kR = CK('review gaya'), kQ = LE(1) - 0.55;
  const tf = P(t, t0 - 0.1, t0 + 0.3);
  popAt(540, 560, tf, () => tSign(0, -40, 0.95 + 0.03 * Math.sin(t * 6)));
  chipW(540, 400, 'INDIA: DRS!', C.yel, t, t0 + 0.15, LS(2) + 0.4, { size: 36, h: 72 });
  // third umpire screen
  const bf = P(t, t0 + 0.15, t0 + 0.5);
  popAt(540, 1060, bf, () => {
    card(-400, -230, 800, 460, 40, C.box, 6, 12);
    txt('THIRD UMPIRE', 0, -175, `700 32px ${MONO}`, C.mute);
    txt('INDIA REVIEWS', -150, 165, `700 30px ${MONO}`, '#ffffff');
    const lost = P(t, kR + 0.25, kR + 0.45), sx = shake(t, kR + 0.25, 0.45, 10);
    disc(150, 165, 30, C.grn, 4);
    disc(250 + sx, 165, 30, lost > 0 ? '#8c90a8' : C.grn, 4);
    if (lost > 0) { ctx.save(); ctx.globalAlpha *= lost; crossMark(250 + sx, 165, 26); ctx.restore(); }
    if (t < kR) { const d = Math.floor(t * 3) % 4; txt('CHECKING' + '.'.repeat(d), 0, -30, SANSB(64), '#ffffff'); }
  });
  stamp(540, 1030, 'NOT OUT', C.red, P(t, kR, kR + 0.22), -0.08, 92);
  bubble(850, 330, 230, 110, 'KYUN?', P(t, kQ, kQ + 0.3), 50);
}

// ---------- line 2: the stump mic hears everything ----------
const MIC = [540, 975];
function sceneMic(t) {
  const t0 = LS(2), kH = CK('har awaaz'), kP = CK('pakadta');
  const sf = P(t, t0 - 0.1, t0 + 0.35);
  // ground strip
  ctx.save(); ctx.globalAlpha *= sf;
  rr(170, 1236, 740, 40, 20); ctx.fillStyle = STRIP; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
  // sound rings around the mic
  for (let k = 0; k < 8; k++) ring(MIC[0], MIC[1], t, t0 + 0.35 + k * 0.42, '#ffffff', 60, 300, 0.9);
  popAt(540, 1250, sf, () => stumps(0, 0, 1, true, win(t, kP, kP + 0.5, 0.1, 0.3)));
  chipW(540, 620, 'STUMP MIC', C.cyan, t, t0 + 0.2, LS(3) + 0.4, { size: 40, h: 78 });
  // the sounds it hears fly in
  const S = [['TAK!', C.yel, 190, 470], ['THUD', C.org, 890, 470], ['APPEAL!', C.pink, 200, 1120], ['SHOR', C.purple, 880, 1120]];
  S.forEach(([lab, col, sx, sy], i) => {
    const a = kH - 0.35 + i * 0.12, u = P(t, a + 0.3, a + 0.95);
    if (t < a || u >= 0.92) return;
    const x = L(sx, MIC[0], eio(u)), y = L(sy, MIC[1], eio(u));
    ctx.save(); ctx.globalAlpha *= 1 - P(u, 0.55, 0.9);
    chip(x, y, lab, col, Math.max(0.35, P(t, a, a + 0.3)) * L(1, 0.35, u), { size: 34, h: 70 });
    ctx.restore();
  });
  // recording badge
  popAt(820, 760, P(t, kP, kP + 0.3), () => {
    card(-100, -38, 200, 76, 38, '#ffffff', 5, 6);
    ctx.beginPath(); ctx.arc(-56, 0, 15, 0, 7); ctx.fillStyle = Math.floor(t * 3) % 2 ? C.red : '#f3a4a2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    txt('REC', 24, 2, `700 34px ${MONO}`, INK);
  });
}

// ---------- line 3: sound graph lined up with the video frames ----------
const FX = [180, 360, 540, 720, 900], FY = 600, FW = 164, FH = 280;
const WAVE = [70, 870, 940, 330];                // x, y, w, h of the sound panel
const BALLF = [[50, -84, 11], [26, -34, 14], [0, 14, 17], [36, 44, 17], [38, 112, 16]];
function frameAt(i, hl) {
  const x = FX[i] - FW / 2, y = FY - FH / 2;
  hardShadow(x, y, FW, FH, 14, 6);
  ctx.save(); rr(x, y, FW, FH, 14); ctx.clip();
  ctx.fillStyle = TURF; ctx.fillRect(x, y, FW, FH);
  ctx.beginPath(); ctx.moveTo(FX[i] - 34, y); ctx.lineTo(FX[i] + 34, y); ctx.lineTo(FX[i] + 60, y + FH); ctx.lineTo(FX[i] - 60, y + FH); ctx.closePath(); ctx.fillStyle = STRIP; ctx.fill();
  pad(FX[i] + 40, FY - 80, 0.36);
  bat(FX[i] - 24, FY - 66, 0.36);
  const [dx, dy, r] = BALLF[i]; ball(FX[i] + dx, FY + dy, r);
  ctx.restore();
  rr(x, y, FW, FH, 14); ctx.lineWidth = hl ? 10 : 5; ctx.strokeStyle = hl ? C.yel : INK; ctx.stroke();
  if (hl) { rr(x - 6, y - 6, FW + 12, FH + 12, 18); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  txt(String(i + 1), x + 22, y + 24, `700 22px ${MONO}`, '#ffffff');
}
function amp(x, tS) {         // waveform height at screen x
  let a = 5 + 9 * hash(Math.floor(x / 6), 3);
  a += 125 * Math.exp(-Math.pow((x - FX[2]) / 9, 2)) * (0.6 + 0.4 * Math.abs(Math.sin(x * 0.9)));   // edge: sharp, short spike
  a += 46 * Math.exp(-Math.pow((x - FX[3] - 10) / 46, 2)) * (0.75 + 0.25 * Math.sin(x * 0.25));    // pad: broad, flat bump
  return a;
}
function sceneSync(t) {
  const t0 = LS(3), tS = CK('usi frame') + 0.7, t1 = LS(4);
  const ph = t < tS ? L(110, FX[2], eio(P(t, t0 + 0.1, tS))) : L(FX[2], 985, P(t, tS, t1));
  const ff = P(t, t0 - 0.1, t0 + 0.4);
  ctx.save(); ctx.globalAlpha *= ff;
  txt('VIDEO · FRAME BY FRAME', 540, 392, `700 32px ${MONO}`, '#ffffff');
  for (let i = 0; i < 5; i++) frameAt(i, t >= tS && i === 2);
  // sound panel
  const [wx, wy, ww, wh] = WAVE;
  card(wx, wy, ww, wh, 30, C.box, 6, 10);
  txt('MIC KI AWAAZ', wx + 30, wy + 40, `700 28px ${MONO}`, C.mute, 'left');
  const mid = wy + wh / 2 + 20;
  line([[wx + 20, mid], [wx + ww - 20, mid]], 'rgba(255,255,255,0.18)', 2);
  ctx.save(); rr(wx, wy, ww, wh, 30); ctx.clip();
  for (let x = wx + 24; x < Math.min(ph, wx + ww - 20); x += 6) {
    const a = amp(x, tS), hot = Math.abs(x - FX[2]) < 26;
    line([[x, mid - a], [x, mid + a]], hot ? C.yel : C.cyan, 4);
  }
  ctx.restore();
  ctx.restore();
  // playhead across frames and sound
  ctx.save(); ctx.globalAlpha *= ff;
  line([[ph, 446], [ph, wy + wh - 14]], INK, 10); line([[ph, 446], [ph, wy + wh - 14]], C.yel, 5);
  ctx.beginPath(); ctx.moveTo(ph - 16, 430); ctx.lineTo(ph + 16, 430); ctx.lineTo(ph, 454); ctx.closePath(); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
  // the match: edge frame <-> spike
  const mf = P(t, tS, tS + 0.3);
  if (mf > 0) {
    ctx.save(); ctx.globalAlpha *= mf;
    ctx.setLineDash([14, 10]); line([[FX[2] + 30, FY + FH / 2 + 8], [FX[2] + 30, wy + 60]], '#ffffff', 5); ctx.setLineDash([]);
    ctx.restore();
    chip(FX[2], wy + 60, 'BAT!', C.yel, mf, { size: 30, h: 60 });
  }
  const pf = P(t, tS + 0.3, tS + 0.55);
  if (pf > 0) chip(FX[3] + 10, wy + 92, 'PAD', C.org, pf, { size: 28, h: 56 });
  chipW(540, 1320, 'SPIKE = EDGE!', C.red, t, tS + 0.1, LS(4) + 0.4, { size: 44, h: 86 });
}

// ---------- line 4: bat first, so no LBW ----------
function sceneRule(t) {
  const kM = CK('Matlab pehle'), kB = CK('bat laga'), kL = CK('toh LBW');
  popAt(290, 560, P(t, kM - 0.1, kM + 0.25), () => {
    card(-170, -150, 340, 300, 34, C.box, 6, 10);
    disc(-120, -100, 34, C.yel, 4); txt('1', -120, -98, SANSB(40), INK);
    ctx.save(); ctx.rotate(0.5); bat(0, -110, 0.42); ctx.restore();
    ball(58, 30, 26);
    txt('BAT', 0, 112, SANSB(44), '#ffffff');
  });
  arrowR(480, 560, 590, C.yel, P(t, kB - 0.05, kB + 0.3));
  popAt(790, 560, P(t, kB + 0.15, kB + 0.45), () => {
    card(-170, -150, 340, 300, 34, C.box, 6, 10);
    disc(-120, -100, 34, C.org, 4); txt('2', -120, -98, SANSB(40), INK);
    pad(0, -118, 0.45); ball(-40, 20, 24);
    txt('PAD', 0, 112, SANSB(44), '#ffffff');
  });
  popAt(540, 960, P(t, kL - 0.15, kL + 0.2), () => {
    card(-430, -140, 860, 280, 36, '#ffffff', 6, 12);
    txt('LBW RULE · MCC LAW 36', 0, -88, `700 30px ${MONO}`, '#3c4a6b');
    txt('Ball pehle BAT ko lagi?', 0, -18, SANSB(54), INK);
    txt('→ LBW nahi!', 0, 66, SANSB(60), '#2f8a4c');
  });
  stamp(540, 1260, 'NOT OUT', C.grn, P(t, kL + 0.45, kL + 0.65), -0.08, 84, INK);
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneGap], [LS(1), LS(2), sceneLost], [LS(2), LS(3), sceneMic],
          [LS(3), LS(4), sceneSync], [LS(4), LS(n) - 0.4, sceneRule],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('GAP') + 0.1, 800, 600, [C.grn, C.yel, '#ffffff'], 24, 1.3);
  burst(t, CK('review gaya') + 0.1, 540, 1030, [C.red, C.org, C.yel], 26, 1.3);
  burst(t, CK('usi frame') + 0.75, FX[2], 1020, [C.yel, C.cyan, '#ffffff'], 26, 1.2);
  burst(t, CK('toh LBW') + 0.6, 540, 1260, [C.grn, C.yel, '#ffffff'], 26, 1.3);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈↑✓…●–−★')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
