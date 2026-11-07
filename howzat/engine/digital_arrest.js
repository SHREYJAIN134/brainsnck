window.BG = '#33407a';
// "Digital arrest scam kaise chalta hai?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// Digital arrest reel scenes
// =====================================================================
window.TOPIC = 'Digital Arrest';
function STEPS() { return [[0, 'VIDEO CALL'], [LS(2), 'SCAM KA TARIKA'], [LS(5), 'ASLI SACH']]; }
const SANSB = s => `800 ${s}px ${SANS}`;
const LIGHT = '#c9cde6';
const PAPER = '#f4efe4';
const SKIN = '#e6b48a';
const NAVY = '#26306a';
const WALL = '#4a5aa0';

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
function shake(t, t0, d = 0.45, a = 8) { return t > t0 && t < t0 + d ? Math.sin(t * 80) * a * (1 - P(t, t0, t0 + d)) : 0; }
function ring(x, y, t, t0, col = '#ffffff', r0 = 20, r1 = 100, d = 0.6) {
  const r = P(t, t0, t0 + d); if (r <= 0 || r >= 1) return;
  ctx.beginPath(); ctx.arc(x, y, r0 + (r1 - r0) * eo(r), 0, 7); ctx.lineWidth = 9 * (1 - r); ctx.strokeStyle = col; ctx.stroke();
}
function chipW(x, y, label, col, t, a, b, opts = {}) {
  const fo = 1 - P(t, b - 0.2, b); if (fo <= 0) return;
  ctx.save(); ctx.globalAlpha *= fo; chip(x + shake(t, a, 0.4, 6), y, label, col, P(t, a, a + 0.3), opts); ctx.restore();
}
function star(x, y, r, col) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
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
function banSign(x, y, r, f) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); const s = back(f); ctx.scale(s, s);
  for (const [w, c] of [[r * 0.26, INK], [r * 0.17, C.red]]) {
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke();
    line([[-r * 0.7, -r * 0.7], [r * 0.7, r * 0.7]], c, w);
  }
  ctx.restore();
}

// ---------- phone ----------
const PW = 420, PH = 800;
function phone(cx, cy, s, screen) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  hardShadow(-PW / 2, -PH / 2, PW, PH, 62, 12);
  rr(-PW / 2, -PH / 2, PW, PH, 62); ctx.fillStyle = '#1b2148'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  rr(-PW / 2 + 20, -PH / 2 + 20, PW - 40, PH - 40, 46); ctx.fillStyle = C.box; ctx.fill();
  ctx.save(); rr(-PW / 2 + 20, -PH / 2 + 20, PW - 40, PH - 40, 46); ctx.clip(); screen(); ctx.restore();
  rr(-PW / 2 + 20, -PH / 2 + 20, PW - 40, PH - 40, 46); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  rr(-48, -PH / 2 + 32, 96, 24, 12); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}
// generic uniformed officer (original flat drawing, no real person)
function officer(x, y, s, t, talk = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-160, 230); ctx.quadraticCurveTo(-160, 78, -62, 62); ctx.lineTo(62, 62); ctx.quadraticCurveTo(160, 78, 160, 230); ctx.closePath();
  ctx.fillStyle = NAVY; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-42, 62); ctx.lineTo(0, 118); ctx.lineTo(42, 62); ctx.closePath(); ctx.fillStyle = LIGHT; ctx.fill(); ctx.stroke();
  for (const d of [-1, 1]) { rr(d > 0 ? 72 : -136, 76, 64, 20, 6); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); }
  star(-88, 150, 20, C.yel);
  rr(-28, 22, 56, 48, 10); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -30, 72, 82, 0, 0, 7); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.arc(d * 27, -30, 8, 0, 7); ctx.fillStyle = INK; ctx.fill();
    line([[d * 46, -58], [d * 12, -46]], INK, 8);
  }
  ctx.beginPath(); ctx.ellipse(0, 6, 32, 10, 0, 0, 7); ctx.fillStyle = INK; ctx.fill();
  const mo = talk * (0.5 + 0.5 * Math.sin(t * 26));
  rr(-15, 22, 30, 6 + 12 * mo, 5); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-84, -80); ctx.quadraticCurveTo(-94, -156, 0, -164); ctx.quadraticCurveTo(94, -156, 84, -80); ctx.closePath();
  ctx.fillStyle = NAVY; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-96, -82); ctx.quadraticCurveTo(0, -58, 96, -82); ctx.lineTo(96, -70); ctx.quadraticCurveTo(0, -40, -96, -70); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  rr(-82, -104, 164, 18, 5); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  star(0, -130, 21, C.yel);
  ctx.restore();
}
// video call screen (phone coords: x +-190, y +-380)
function callScreen(t, opts = {}) {
  ctx.fillStyle = opts.wall || WALL; ctx.fillRect(-200, -400, 400, 800);
  if (opts.thana) {
    card(-150, -225, 300, 96, 14, '#ffffff', 5, 6);
    txt('POLICE', 0, -195, SANSB(40), INK); txt('STATION', 0, -153, `700 26px ${MONO}`, INK);
  }
  officer(0, opts.thana ? 130 : 70, opts.thana ? 0.88 : 1.0, t, opts.talk || 0);
  if (opts.thana) { card(-200, 300, 400, 120, 0, '#8a6a4a', 5, 0); }
  // top bar
  ctx.fillStyle = 'rgba(13,10,38,0.55)'; ctx.fillRect(-200, -400, 400, 150);
  disc(-148, -298, 26, LIGHT, 0); star(-148, -301, 13, C.yel);
  txt('CBI Officer', -110, -310, `800 30px ${SANS}`, '#ffffff', 'left');
  txt('video call · 00:' + String(12 + Math.floor(Math.max(0, t) % 40)).padStart(2, '0'), -110, -276, `500 20px ${MONO}`, C.mute, 'left');
  if (Math.floor(t * 2.5) % 2 === 0) { ctx.beginPath(); ctx.arc(156, -298, 10, 0, 7); ctx.fillStyle = C.red; ctx.fill(); }
  // end call button
  disc(0, 318, 40, C.red, 0);
  line([[-18, 322], [18, 322]], '#ffffff', 9);
}
function incomingScreen(t, press) {
  ctx.fillStyle = '#2a3366'; ctx.fillRect(-200, -400, 400, 800);
  txt('Video call aa rahi hai…', 0, -270, `600 26px ${SANS}`, C.mute);
  const pulse = 1 + 0.05 * Math.sin(t * 14);
  ring(0, -90, t, Math.floor(t / 0.8) * 0.8, '#ffffff', 95, 170, 0.8);
  ctx.save(); ctx.translate(0, -90); ctx.scale(pulse, pulse);
  disc(0, 0, 92, LIGHT, 6);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 90, 0, 7); ctx.clip(); officer(0, 60, 0.62, t, 0); ctx.restore();
  ctx.restore();
  txt('CBI Officer', 0, 50, SANSB(40), '#ffffff');
  txt('"URGENT · aapke naam pe case"', 0, 96, `600 21px ${MONO}`, C.yel);
  // decline / accept
  disc(-100, 280, 44, C.red, 4); line([[-120, 282], [-80, 282]], '#ffffff', 10);
  const ap = 1 - 0.12 * press;
  ctx.save(); ctx.translate(100, 280 + Math.sin(t * 16) * 4 * (1 - press)); ctx.scale(ap, ap);
  disc(0, 0, 44, C.grn, 4);
  rr(-22, -14, 30, 28, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(24, -12); ctx.lineTo(24, 12); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ---------- scene 1: video call from a "CBI officer" -> aap ARREST ho! ----------
function sceneCall(t) {
  const kC = CK('CBI officer'), kA = CK('aap ARREST');
  const pf = P(t, 0, 0.3);
  const vib = t < kC - 0.2 ? Math.sin(t * 60) * 5 : 0;
  ctx.save(); ctx.translate(shake(t, kA, 0.5, 12), 0);
  phone(540 + vib, 830, L(0.85, 1, back(pf)), () => {
    if (t < kC - 0.05) incomingScreen(t, win(t, kC - 0.35, kC, 0.1, 0.15));
    else {
      callScreen(t, { talk: t > kC && t < kA + 1.2 ? 1 : 0 });
      const fl = 1 - P(t, kC - 0.05, kC + 0.2);
      if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.8 * fl})`; ctx.fillRect(-200, -400, 400, 800); }
    }
  });
  ctx.restore();
  // pointer taps accept
  const pa = P(t, kC - 0.7, kC - 0.25), po = 1 - P(t, kC + 0.1, kC + 0.3);
  if (t > kC - 0.75 && po > 0) {
    const x = L(860, 640, eio(pa)), y = L(1360, 1110, eio(pa)), ps = t > kC - 0.25 && t < kC - 0.05 ? 0.82 : 1;
    ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, kC - 0.75, kC - 0.55)) * po; ctx.translate(x, y); ctx.scale(ps, ps);
    ctx.beginPath(); ctx.arc(6, 6, 34, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fillStyle = C.pink; ctx.fill();
    ctx.restore();
  }
  stamp(540, 930, 'ARREST!', C.red, P(t, kA + 0.05, kA + 0.3), -0.12, 92);
  chipW(540, 1330, 'DIGITAL ARREST?!', C.yel, t, kA + 0.45, 99, { size: 34, h: 76 });
}

// ---------- scene 2: ye SCAM hai, 4,057 crore loote ----------
function note(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  hardShadow(-60, -32, 120, 64, 8, 4);
  rr(-60, -32, 120, 64, 8); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  txt('₹', 0, 2, SANSB(26), INK);
  ctx.restore();
}
function sack(x, y, s, fill) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const body = (ox, oy) => { ctx.beginPath(); ctx.moveTo(-50 + ox, -70 + oy); ctx.quadraticCurveTo(-150 + ox, 10 + oy, -110 + ox, 80 + oy); ctx.quadraticCurveTo(0 + ox, 120 + oy, 110 + ox, 80 + oy); ctx.quadraticCurveTo(150 + ox, 10 + oy, 50 + ox, -70 + oy); ctx.closePath(); };
  body(7, 7); ctx.fillStyle = INK; ctx.fill();
  body(0, 0); ctx.fillStyle = '#b58a5a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  rr(-62, -92, 124, 30, 12); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  txt('₹', 0, 25, SANSB(80 + 30 * fill), INK);
  ctx.restore();
}
function sceneLoot(t) {
  const kS = CK('Is scam'), k4 = CK('4 hazaar');
  // small call phone with SCAM stamp
  const pf = P(t, kS - 0.1, kS + 0.25);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(540, 560, L(0.3, 0.4, back(pf)), () => callScreen(t, { talk: 0 }));
  ctx.restore();
  stamp(540, 600, 'SCAM!', C.yel, P(t, kS + 0.15, kS + 0.4), -0.1, 80, INK);
  // counter card
  const cf = P(t, k4 - 0.25, k4 + 0.05);
  const u = eio(P(t, k4, k4 + 1.3));
  const n = Math.round(4057 * u);
  popAt(540, 925, cf, () => {
    card(-420, -115, 840, 230, 30, '#ffffff', 6, 12);
    txt('LOGON NE GAWAYE', 0, -66, `700 28px ${MONO}`, '#3c4a6b');
    const s = n.toLocaleString('en-IN');
    txt(`₹${s} CR${u >= 1 ? '+' : ''}`, 0, 30, SANSB(104), u >= 1 ? '#c2413e' : INK);
  });
  chipW(540, 1090, '2022 – MAY 2026 · SARKARI DATA', C.cyan, t, k4 + 0.35, 99, { size: 24, h: 56 });
  // notes fly into the sack
  const sf = P(t, k4 - 0.1, k4 + 0.2);
  if (sf > 0) popAt(540, 1290, sf, () => sack(0, 0, 0.9 + 0.1 * u, u));
  for (let k = 0; k < 10; k++) {
    const st = k4 + 0.05 + k * 0.13, v = P(t, st, st + 0.55); if (v <= 0 || v >= 1) continue;
    const side = k % 2 ? 1 : -1;
    const x0 = 540 + side * 620, y0 = 1170 + 60 * hash(k, 2);
    const x = L(x0, 540, eio(v)), y = L(y0, 1215, eio(v)) - 130 * Math.sin(v * Math.PI);
    ctx.save(); ctx.globalAlpha *= 1 - P(v, 0.85, 1); note(x, y, 0.9 - 0.4 * v, side * (1 - v) * 0.8 + k); ctx.restore();
  }
}

// ---------- scene 3: step 1 darr -> parcel me drugs ----------
function parcel(t, open) {
  ctx.save(); ctx.lineJoin = 'round';
  // flaps
  for (const d of [-1, 1]) {
    ctx.save(); ctx.translate(d * 190, -130); ctx.rotate(-d * (0.15 + 1.9 * open) * 0.6);
    hardShadow(d > 0 ? -190 : 0, -26, 190, 30, 6, 5);
    rr(d > 0 ? -190 : 0, -26, 190, 30, 6); ctx.fillStyle = '#d99a5b'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  if (open > 0.05) { rr(-180, -138, 360, 24, 6); ctx.fillStyle = INK; ctx.fill(); }
  card(-190, -130, 380, 270, 14, '#e2a868', 6, 12);
  ctx.fillStyle = '#c98f52'; ctx.fillRect(-30, -127, 60, 264);
  ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(-30, -127, 60, 264);
  // address label
  card(-170, -60, 150, 120, 10, '#ffffff', 4, 4);
  txt('TO:', -155, -34, `700 22px ${MONO}`, '#3c4a6b', 'left');
  txt('TUM', -155, 4, SANSB(36), INK, 'left');
  for (let i = 0; i < 9; i++) { ctx.fillStyle = INK; ctx.fillRect(-155 + i * 13, 28, hash(i, 5) > 0.5 ? 7 : 3, 22); }
  // fragile arrows
  for (const ax of [100, 140]) { line([[ax, 60], [ax, 10]], INK, 6); line([[ax - 12, 22], [ax, 8], [ax + 12, 22]], INK, 6); }
  ctx.restore();
}
function scaredFace(x, y, r, t) {
  ctx.save(); ctx.translate(x + Math.sin(t * 50) * 2, y);
  disc(0, 0, r, C.yel, 6);
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * r * 0.33, -r * 0.12, r * 0.14, r * 0.2, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(d * r * 0.33, -r * 0.1, r * 0.07, 0, 7); ctx.fillStyle = INK; ctx.fill(); line([[d * r * 0.5, -r * 0.48], [d * r * 0.18, -r * 0.4]], INK, 5); }
  ctx.beginPath(); ctx.ellipse(0, r * 0.4, r * 0.16, r * 0.22, 0, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 0.72, -r * 0.55); ctx.quadraticCurveTo(r * 0.88, -r * 0.25, r * 0.72, -r * 0.18); ctx.quadraticCurveTo(r * 0.56, -r * 0.25, r * 0.72, -r * 0.55); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}
function bubble(x, y, w, h, label, f, tail = 'left', size = 34) {
  popAt(x, y, f, () => {
    hardShadow(-w / 2, -h / 2, w, h, 26, 7);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath();
    if (tail === 'left') { ctx.moveTo(-w / 2 + 6, -10); ctx.lineTo(-w / 2 - 34, 0); ctx.lineTo(-w / 2 + 6, 18); }
    else { ctx.moveTo(-18, -h / 2 + 4); ctx.lineTo(0, -h / 2 - 34); ctx.lineTo(18, -h / 2 + 4); }
    ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.fillRect(tail === 'left' ? -w / 2 + 2 : -16, tail === 'left' ? -8 : -h / 2 + 2, tail === 'left' ? 8 : 32, tail === 'left' ? 24 : 6);
    txt(label, 0, 3, `800 ${size}px ${SANS}`, INK);
  });
}
function sceneParcel(t) {
  const kD = CK('Pehle darr'), kP = CK('tumhare parcel');
  chipW(540, 380, '1 · DARR', C.red, t, kD, 99, { size: 32, h: 70 });
  // officer avatar + speech bubble
  const af = P(t, kD + 0.05, kD + 0.35);
  if (af > 0) popAt(185, 545, af, () => {
    disc(0, 0, 82, WALL, 6);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 80, 0, 7); ctx.clip(); officer(0, 55, 0.55, t, t < kP + 1.2 ? 1 : 0); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, 80, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  });
  bubble(625, 545, 620, 120, 'Tumhara parcel pakda!', P(t, kD + 0.25, kD + 0.55), 'left', 40);
  // the parcel
  const bf = P(t, kD + 0.3, kD + 0.65);
  const open = eio(P(t, kP + 0.05, kP + 0.4));
  if (bf > 0) popAt(540 + shake(t, kP, 0.55, 12), 930, bf, () => parcel(t, open));
  stamp(540, 905, 'DRUGS?!', C.red, P(t, kP + 0.35, kP + 0.6), -0.1, 84);
  // scared viewer
  const ff = P(t, kP + 0.6, kP + 0.9);
  if (ff > 0) popAt(830, 1255, ff, () => scaredFace(0, 0, 82, t));
  chipW(420, 1255, 'PANIC!', C.org, t, kP + 0.75, 99, { size: 34, h: 76 });
}

// ---------- scene 4: step 2 nakli thana, nakli warrant ----------
function warrant(t) {
  card(-270, -170, 540, 340, 18, PAPER, 6, 10);
  txt('ARREST WARRANT', 0, -120, SANSB(46), INK);
  line([[-220, -88], [220, -88]], INK, 4);
  for (let i = 0; i < 5; i++) { rr(-220, -58 + i * 34, i === 4 ? 220 : 300 + 80 * hash(i, 3), 12, 6); ctx.fillStyle = '#c6bfae'; ctx.fill(); }
  ctx.beginPath(); ctx.arc(170, 80, 52, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(170, 80, 36, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  star(170, 80, 18, '#ffffff');
  ctx.beginPath(); ctx.moveTo(-220, 130); ctx.bezierCurveTo(-180, 90, -160, 150, -120, 115); ctx.bezierCurveTo(-90, 95, -70, 140, -40, 120);
  ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
}
function sceneThana(t) {
  const kT = CK('Phir nakli'), kW = CK('nakli warrant');
  chipW(540, 380, '2 · NAKLI SET', C.yel, t, kT, 99, { size: 32, h: 70 });
  const pf = P(t, kT - 0.1, kT + 0.3);
  const up = eio(P(t, kW - 0.1, kW + 0.35));
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(540, L(800, 760, up), L(0.7, 0.82, back(pf)) - 0.06 * up, () => callScreen(t, { thana: true, talk: 1 }));
  ctx.restore();
  // NAKLI stamp on the station sign
  stamp(715, L(800, 760, up) - 70, 'NAKLI', C.red, P(t, kT + 0.6, kT + 0.85), 0.14, 52);
  // fake warrant slides in
  const wf = P(t, kW - 0.05, kW + 0.35);
  if (wf > 0) {
    ctx.save(); ctx.translate(L(1500, 590, eo(wf)), 1140); ctx.rotate(L(0.4, 0.06, eo(wf)));
    warrant(t); ctx.restore();
  }
  stamp(560, 1150, 'FAKE', C.red, P(t, kW + 0.5, kW + 0.75), -0.16, 80);
}

// ---------- scene 5: step 3 chup raho... aur paise bhejo ----------
function familyIcon(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (const [dx, r, col] of [[-48, 30, C.cyan], [48, 30, C.pink], [0, 38, C.yel]]) {
    ctx.beginPath(); ctx.arc(dx, -30 + (r === 38 ? -6 : 0), r * 0.62, 0, 7); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(dx, 40, r, r * 0.95, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function camIcon(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-70, -45, 110, 90, 16, LIGHT, 5, 6);
  ctx.beginPath(); ctx.moveTo(40, -10); ctx.lineTo(80, -35); ctx.lineTo(80, 35); ctx.lineTo(40, 10); ctx.closePath(); ctx.fillStyle = LIGHT; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  if (Math.floor(t * 2.5) % 2 === 0) disc(-40, -18, 11, C.red, 0);
  ctx.restore();
}
function bankScreen(t, kM) {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-200, -400, 400, 800);
  ctx.fillStyle = C.cyan; ctx.fillRect(-200, -400, 400, 120);
  ctx.fillStyle = INK; ctx.fillRect(-200, -282, 400, 5);
  txt('Bank Transfer', 0, -322, SANSB(36), INK);
  txt('TO', -160, -220, `700 22px ${MONO}`, '#3c4a6b', 'left');
  txt('"Safe Account" ?', -160, -180, SANSB(34), INK, 'left');
  txt('AMOUNT', -160, -100, `700 22px ${MONO}`, '#3c4a6b', 'left');
  txt('SAARI SAVINGS', -160, -58, SANSB(36), '#c2413e', 'left');
  rr(-160, -12, 320, 8, 4); ctx.fillStyle = '#d7dbee'; ctx.fill();
  const tap = kM + 0.45, done = t >= tap;
  const press = 1 - 0.08 * win(t, tap - 0.08, tap + 0.14, 0.06, 0.1);
  ctx.save(); ctx.translate(0, 120); ctx.scale(press, press);
  card(-140, -50, 280, 100, 50, done ? C.grn : C.yel, 6, 7);
  txt(done ? 'SENT ✓' : 'SEND', 0, 4, SANSB(44), INK);
  ctx.restore();
}
function sceneChup(t) {
  const kC = CK('Chup raho'), kM = CK('aur paise');
  chipW(540, 380, '3 · CHUP + PAISE', C.org, t, kC, 99, { size: 32, h: 70 });
  const pf = P(t, kC - 0.1, kC + 0.3);
  const sw = P(t, kM - 0.1, kM + 0.15);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(540, 790, L(0.65, 0.78, back(pf)), () => {
    if (t < kM) {
      callScreen(t, { talk: 1 });
      ctx.fillStyle = C.red; rr(-160, -232, 320, 54, 27); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      txt('● CAMERA ON RAKHO', 0, -204, `700 24px ${MONO}`, '#ffffff');
    } else {
      bankScreen(t, kM);
      const fl = 1 - P(t, kM, kM + 0.25);
      if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.8 * fl})`; ctx.fillRect(-200, -400, 400, 800); }
    }
  });
  ctx.restore();
  // sides: family crossed out, camera always on
  const ff = P(t, kC + 0.2, kC + 0.5) * (1 - P(t, kM + 0.1, kM + 0.4));
  if (ff > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, ff * 2);
    popAt(175, 790, Math.min(1, ff * 1.01), () => { familyIcon(0, 0, 1.25); banSign(0, 0, 110, P(t, kC + 0.45, kC + 0.7)); });
    popAt(905, 790, Math.min(1, ff * 1.01), () => camIcon(0, 0, 1.25, t));
    ctx.restore();
  }
  bubble(540, 1240, 620, 110, 'Kisi ko mat batana!', P(t, kC + 0.15, kC + 0.45) * (1 - P(t, kM - 0.1, kM + 0.1)), 'up', 40);
  // notes fly out of the phone
  const tap = kM + 0.45;
  for (let k = 0; k < 8; k++) {
    const st = tap + 0.05 + k * 0.08, v = P(t, st, st + 0.7); if (v <= 0 || v >= 1) continue;
    const side = k % 2 ? 1 : -1;
    const x = L(540, 540 + side * (420 + 60 * hash(k, 4)), eo(v)), y = L(900, 420 + 180 * hash(k, 8), eo(v));
    ctx.save(); ctx.globalAlpha *= 1 - P(v, 0.8, 1); note(x, y, 1, v * 4 * side + k); ctx.restore();
  }
  chipW(540, 1290, 'PAISE GAYE!', C.red, t, tap + 0.3, 99, { size: 36, h: 80 });
}

// ---------- scene 6: sach -> police video call pe arrest nahi karti ----------
function sceneSach(t) {
  const kS = CK('Sach'), kN = CK('arrest nahi');
  const pf = P(t, kS - 0.1, kS + 0.25);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(540, 650, L(0.4, 0.52, back(pf)), () => callScreen(t, { talk: 0 }));
  ctx.restore();
  banSign(540, 650, 230, P(t, kS + 0.55, kS + 0.85));
  // green truth card
  const cf = P(t, kN - 0.1, kN + 0.2);
  popAt(540, 1075, cf, () => {
    card(-430, -105, 860, 210, 30, C.grn, 6, 12);
    txt('CBI · ED · POLICE', -40, -46, `700 30px ${MONO}`, INK);
    txt('video call pe arrest NAHI', -40, 22, SANSB(50), INK);
    tickMark(360, -10, 50, '#ffffff');
  });
  chipW(320, 1300, 'CALL KAATO', C.red, t, kN + 0.4, 99, { size: 30, h: 70 });
  chipW(745, 1300, 'HELPLINE 1930', C.yel, t, kN + 0.55, 99, { size: 30, h: 70 });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneCall], [LS(1), LS(2), sceneLoot], [LS(2), LS(3), sceneParcel],
          [LS(3), LS(4), sceneThana], [LS(4), LS(5), sceneChup], [LS(5), LS(n) - 0.4, sceneSach],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('aap ARREST') + 0.15, 540, 930, [C.red, C.org, C.yel], 26, 1.3);
  burst(t, CK('Is scam') + 0.3, 540, 600, [C.yel, C.org, '#ffffff'], 20);
  burst(t, CK('4 hazaar') + 1.35, 540, 955, [C.grn, C.yel, '#ffffff'], 28, 1.4);
  burst(t, CK('tumhare parcel') + 0.45, 540, 905, [C.red, C.org, C.yel], 26, 1.2);
  burst(t, CK('nakli warrant') + 0.6, 560, 1150, [C.red, C.pink, C.yel], 22);
  burst(t, CK('aur paise') + 0.5, 540, 900, [C.yel, C.grn, '#ffffff'], 22);
  burst(t, CK('arrest nahi') + 0.1, 540, 1075, [C.grn, C.cyan, '#ffffff'], 30, 1.5);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈↑✓…●–')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
