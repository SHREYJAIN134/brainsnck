window.BG = '#574a7d';
// "Ride se pehle tip? 10 lakh ka fine!" — 1080x1920, synced to window.TL (helpers from maps.js via the cab surge reel)
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

// ---------- shared flat helpers (same as the digital arrest reel) ----------
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
function note(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  hardShadow(-60, -32, 120, 64, 8, 4);
  rr(-60, -32, 120, 64, 8); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  txt('₹', 0, 2, SANSB(26), INK);
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


// =====================================================================
// Ola pre-ride tip ("add-on") reel scenes
// =====================================================================
window.TOPIC = 'Cab Tip';
function STEPS() { return [[0, 'TIP KA DABAAV'], [LS(1), 'ASLI RULE'], [LS(3), 'TWIST + FINE']]; }
const CAB = '#ffd166';
const RAIN = 'rgba(159,214,240,0.55)';

// ---------- small flat drawings (original, no logos) ----------
// top-view cab
function cab(x, y, s, rot, col = CAB) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-30 + 5, -50 + 5, 60, 100, 16); ctx.fillStyle = INK; ctx.fill();
  rr(-30, -50, 60, 100, 16); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  rr(-21, -30, 42, 20, 6); ctx.fillStyle = '#2a3366'; ctx.fill();
  rr(-21, 18, 42, 16, 6); ctx.fillStyle = '#2a3366'; ctx.fill();
  rr(-12, -6, 24, 14, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
// side-view cab for the phone
function cabSide(x, y, s, col = CAB) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-90, 10); ctx.lineTo(-80, -18); ctx.lineTo(-45, -22); ctx.lineTo(-25, -50); ctx.lineTo(35, -50); ctx.lineTo(60, -22); ctx.lineTo(88, -16); ctx.lineTo(92, 10); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18, -42); ctx.lineTo(2, -42); ctx.lineTo(2, -24); ctx.lineTo(-34, -24); ctx.closePath(); ctx.fillStyle = '#2a3366'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, -42); ctx.lineTo(31, -42); ctx.lineTo(48, -24); ctx.lineTo(10, -24); ctx.closePath(); ctx.fill();
  rr(-12, -64, 30, 14, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  for (const wx of [-52, 54]) { disc(wx, 12, 17, '#2a2a3a', 0); ctx.beginPath(); ctx.arc(wx, 12, 7, 0, 7); ctx.fillStyle = LIGHT; ctx.fill(); }
  ctx.restore();
}
function person(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(4, 34, 30, 20, 0, Math.PI, 0); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 30, 30, 22, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  disc(0, -6, 17, SKIN, 3);
  ctx.restore();
}
function cloud(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const blobs = [[-90, 10, 55], [-30, -25, 70], [45, -10, 62], [100, 15, 48], [0, 25, 60]];
  for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx + 9, by + 9, r, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by, r + 4, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fillStyle = '#dfe4f5'; ctx.fill(); }
  ctx.restore();
}
function rain(t, a, y0 = 300, y1 = 1440) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = RAIN; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const x = 30 + 1020 * hash(i, 3), sp = 1100 + 500 * hash(i, 5), ph = hash(i, 8) * (y1 - y0);
    const y = y0 + ((ph + t * sp) % (y1 - y0));
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 38); ctx.stroke();
  }
  ctx.restore();
}
function gear(x, y, r, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i < n * 2; i++) {
    const a0 = i * Math.PI / n, a1 = (i + 1) * Math.PI / n, R = i % 2 ? r * 0.78 : r;
    ctx.arc(0, 0, R, a0, a1);
  }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 7); ctx.fillStyle = C.box; ctx.fill(); ctx.stroke();
  ctx.restore();
}
function upArrow(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const pts = [[0, -80], [62, -10], [24, -10], [24, 70], [-24, 70], [-24, -10], [-62, -10]];
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a + 7, b + 7)); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

// ---------- scene 1: cab dhoondh rahe the... app bola: tip do, jaldi milegi ----------
const TIPS = ['₹20', '₹50', '₹140'];
function tipButtons(t, a, y, hi) {
  TIPS.forEach((lab, i) => {
    const x = -112 + i * 112;
    popAt(x, y, P(t, a + i * 0.12, a + i * 0.12 + 0.3), () => {
      const h = hi && i === 2;
      rr(-50 + 4, -32 + 4, 100, 64, 32); ctx.fillStyle = INK; ctx.fill();
      rr(-50, -32, 100, 64, 32); ctx.fillStyle = h ? C.org : C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      txt(lab, 0, 2, SANSB(28), INK);
    });
  });
}
function searchScreen(t, kApp, kTip) {
  ctx.fillStyle = '#3a3166'; ctx.fillRect(-200, -400, 400, 800);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 16;
  for (const x of [-120, 30, 140]) { ctx.beginPath(); ctx.moveTo(x, -330); ctx.lineTo(x, 400); ctx.stroke(); }
  for (const y of [-220, -70, 90, 230]) { ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(200, y); ctx.stroke(); }
  // radar pulses around you
  const yx = 30, yy = -70;
  for (let k = 0; k < 3; k++) {
    const u = ((t * 0.9 + k / 3) % 1);
    ctx.beginPath(); ctx.arc(yx, yy, 30 + 170 * u, 0, 7); ctx.lineWidth = 6 * (1 - u); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.stroke();
  }
  disc(yx, yy, 16, C.grn, 3);
  // cabs far away, not coming
  cab(-150, -280, 0.45, 0.6); cab(160, 140, 0.45, -0.9); cab(-140, 200, 0.45, 2.2);
  // top bar
  ctx.fillStyle = INK; ctx.fillRect(-200, -400, 400, 92);
  const dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
  txt('Driver dhoondh rahe' + dots, -165, -322, `800 26px ${SANS}`, '#ffffff', 'left');
  // tip prompt sheet slides up
  const sf = eo(P(t, kApp - 0.05, kApp + 0.35));
  if (sf > 0) {
    ctx.save(); ctx.translate(0, L(420, 0, sf));
    card(-180, 30, 360, 330, 28, '#ffffff', 5, 5);
    txt('TIP DO,', 0, 92, SANSB(40), INK);
    txt('ride jaldi milegi!', 0, 142, `800 30px ${SANS}`, '#c2413e');
    tipButtons(t, kTip, 232, t > kTip + 0.6);
    txt('ride se PEHLE', 0, 318, `700 22px ${MONO}`, '#5a5f80');
    ctx.restore();
  }
}
function sceneSearch(t) {
  const kApp = CK('app bola'), kTip = CK('tip do'), kJ = CK('jaldi milegi');
  const pf = P(t, 0, 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(540 + shake(t, kTip, 0.45, 6), 880, L(0.74, 0.82, back(pf)), () => searchScreen(t, kApp, kTip));
  ctx.restore();
  // you, waiting
  popAt(165, 1150, P(t, 0.25, 0.55), () => { disc(0, 0, 70, C.yel, 6); person(0, 10, 1.35, C.cyan); });
  chipW(165, 1255, 'TUM', '#ffffff', t, 0.35, 99, { size: 28, h: 58 });
  // clock ticking = hurry
  popAt(915, 640, P(t, 0.45, 0.75), () => {
    disc(0, 0, 62, '#ffffff', 6);
    line([[0, 0], [0, -40]], INK, 8);
    const a = t * 6; line([[0, 0], [Math.sin(a) * 34, -Math.cos(a) * 34]], C.red, 7);
    disc(0, 0, 8, INK, 0);
  });
  chipW(540, 360, 'CAB SEARCH...', C.cyan, t, 0.15, kApp, { size: 34, h: 74 });
  chipW(540, 360, 'TIP? RIDE SE PEHLE?!', C.red, t, kJ + 0.25, 99, { size: 32, h: 74 });
}

// ---------- scene 2: tip toh ride ke BAAD hoti hai ----------
const RY = 820, RX = [170, 540, 910];
function sceneRule(t) {
  const a = LS(1), kB = CK('BAAD');
  chipW(540, 380, 'RULE · AGGREGATOR GUIDELINES 2025', C.yel, t, a + 0.05, 99, { size: 24, h: 62 });
  // road
  const rf = eo(P(t, a, a + 0.35));
  if (rf > 0) {
    line([[RX[0], RY], [L(RX[0], RX[2], rf), RY]], INK, 34);
    line([[RX[0], RY], [L(RX[0], RX[2], rf), RY]], 'rgba(255,255,255,0.85)', 22);
    line([[RX[0], RY], [L(RX[0], RX[2], rf), RY]], INK, 4, [24, 20]);
  }
  ['BOOK', 'RIDE', 'TIP'].forEach((lab, i) => {
    popAt(RX[i], RY, P(t, a + 0.1 + i * 0.12, a + 0.4 + i * 0.12), () => {
      disc(0, 0, 40, i === 2 ? C.grn : C.purple, 5);
      txt(String(i + 1), 0, 2, SANSB(36), INK);
    });
    chipW(RX[i], RY + 100, lab, '#ffffff', t, a + 0.2 + i * 0.12, 99, { size: 28, h: 58 });
  });
  // cab drives book -> ride -> tip
  const cv2 = eio(P(t, a + 0.3, kB + 0.2));
  popAt(L(RX[0], RX[2] - 70, cv2), RY - 110, P(t, a + 0.2, a + 0.45), () => cabSide(0, 0, 0.85));
  // tip BEFORE the ride: crossed out
  const bx = RX[0] + 10, by = RY - 250;
  popAt(bx, by, P(t, a + 0.35, a + 0.6), () => note(0, 0, 1.1, -0.15));
  banSign(bx, by, 72, P(t, a + 0.6, a + 0.85));
  // tip AFTER the ride: ticked
  popAt(RX[2] - 10, RY - 250, P(t, kB, kB + 0.3), () => note(0, 0, 1.25, 0.12));
  if (t > kB + 0.3) tickMark(RX[2] + 60, RY - 300, 36, C.grn);
  chipW(540, 1120, 'TIP = RIDE KE BAAD', C.grn, t, kB + 0.15, 99, { size: 36, h: 80 });
  chipW(540, 1230, 'APNI MARZI SE · POORI DRIVER KO', '#ffffff', t, kB + 0.45, 99, { size: 24, h: 58 });
}

// ---------- scene 3: Ola ne naam badla... tip se add-on ----------
function sceneRename(t) {
  const a = LS(2), kA = CK('tip se add-on');
  chipW(540, 380, 'OLA KA JUGAAD', C.org, t, a + 0.05, 99, { size: 36, h: 78 });
  const cf = P(t, a, a + 0.35);
  popAt(540, 820, cf, () => {
    card(-330, -260, 660, 560, 40, '#ffffff', 6, 12);
    rr(-330, -260, 660, 90, [40, 40, 0, 0]); ctx.fillStyle = C.purple; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    txt('RIDE SE PEHLE', 0, -214, `700 32px ${MONO}`, INK);
    // the label: TIP -> ADD-ON
    const sw = P(t, kA + 0.05, kA + 0.25);
    ctx.save(); ctx.globalAlpha *= 1 - 0.65 * sw; txt('TIP', 0, -60, SANSB(130), INK); ctx.restore();
    const sf = P(t, kA - 0.35, kA + 0.05);
    if (sf > 0) line([[-130, -60], [L(-130, 130, eo(sf)), -60]], C.red, 16);
    tipButtons(t, a + 0.25, 140, false);
    txt('wahi paise · wahi button', 0, 236, `700 24px ${MONO}`, '#5a5f80');
  });
  stamp(540, 760, 'ADD-ON', C.yel, P(t, kA + 0.05, kA + 0.35), -0.1, 96, INK);
  chipW(540, 1230, 'NAAM NAYA, TRICK WAHI', C.red, t, kA + 0.55, 99, { size: 34, h: 76 });
}

// ---------- scene 4: twist? add-on wali rides KAM accept hui ----------
function sceneTwist(t) {
  const a = LS(3), kW = CK('Add-on wali'), kK = CK('KAM accept');
  stamp(540, 400, 'TWIST?', C.pink, P(t, a, a + 0.3), -0.08, 64, INK);
  const cf = P(t, a + 0.2, a + 0.5);
  popAt(540, 900, cf, () => {
    card(-420, -400, 840, 800, 40, C.box, 6, 12);
    txt('DRIVER NE ACCEPT KI', 0, -330, `700 34px ${MONO}`, '#ffffff');
    txt('OLA KA APNA DATA · 1-15 JUNE 2026', 0, -280, `500 22px ${MONO}`, C.mute);
    line([[-340, 250], [340, 250]], '#ffffff', 6);
    const g1 = eo(P(t, kW - 0.3, kW + 0.2)), g2 = eo(P(t, kW, kW + 0.4));
    const drop = eo(P(t, kK, kK + 0.45));
    const hG = 430 * g1, hR = (430 - 170 * drop) * g2;
    const sh = shake(t, kK + 0.4, 0.5, 7);
    // bars
    if (hG > 2) { rr(-250 + 7, 250 - hG + 7, 190, hG, [18, 18, 0, 0]); ctx.fillStyle = INK; ctx.fill(); rr(-250, 250 - hG, 190, hG, [18, 18, 0, 0]); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
    if (hR > 2) { rr(60 + sh + 7, 250 - hR + 7, 190, hR, [18, 18, 0, 0]); ctx.fillStyle = INK; ctx.fill(); rr(60 + sh, 250 - hR, 190, hR, [18, 18, 0, 0]); ctx.fillStyle = drop > 0.05 ? C.red : C.yel; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
    txt('BINA ADD-ON', -155, 300, `700 26px ${MONO}`, '#ffffff');
    txt('ADD-ON WALI', 155, 300, `700 26px ${MONO}`, '#ffffff');
    if (drop > 0.3) {
      ctx.save(); ctx.globalAlpha *= P(drop, 0.3, 0.7); ctx.translate(155 + sh, 250 - hR - 90); ctx.rotate(Math.PI); upArrow(0, 0, 0.6, C.red); ctx.restore();
    }
  });
  chipW(540, 1370, 'PAISE DIYE... PHIR BHI KAM!', C.red, t, kK + 0.45, 99, { size: 30, h: 70 });
}

// ---------- scene 5: sarkar ne thoka 10 lakh ka fine ----------
function gavel(px, py, ang) {   // pivot = end of the handle, head at distance 330 along ang
  ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
  rr(0 + 6, -16 + 6, 300, 32, 14); ctx.fillStyle = INK; ctx.fill();
  rr(0, -16, 300, 32, 14); ctx.fillStyle = '#b07a4f'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  rr(275 + 7, -120 + 7, 110, 240, 26); ctx.fillStyle = INK; ctx.fill();
  rr(275, -120, 110, 240, 26); ctx.fillStyle = '#8a5a3a'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  for (const by of [-78, 78]) { rr(271, by - 12, 118, 24, 8); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); }
  ctx.restore();
}
function sceneFine(t) {
  const a = LS(4), kL = CK('10 lakh');
  chipW(540, 380, 'CCPA: YE DARK PATTERN HAI', C.yel, t, a + 0.05, 99, { size: 30, h: 72 });
  // block
  popAt(470, 1120, P(t, a, a + 0.3), () => {
    rr(-230 + 8, -50 + 8, 460, 100, 22); ctx.fillStyle = INK; ctx.fill();
    rr(-230, -50, 460, 100, 22); ctx.fillStyle = '#8a5a3a'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  });
  // gavel lifts, then slams down on the fine
  const hit = kL - 0.05, HIT = 3.11, UP = 3.95;
  const lift = eo(P(t, a + 0.1, a + 0.6)), down = Math.pow(P(t, hit - 0.22, hit), 2);
  const bounce = t > hit ? -0.08 * Math.sin(P(t, hit, hit + 0.3) * Math.PI) : 0;
  const ang = L(HIT + 0.25, UP, lift) - (UP - HIT) * down + bounce;
  ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, a, a + 0.25) * 3); gavel(800, 945, ang); ctx.restore();
  if (t > hit) for (let k = 0; k < 6; k++) {
    const u = P(t, hit, hit + 0.4); if (u >= 1) break;
    const an = Math.PI + k * Math.PI / 5; line([[470 + Math.cos(an) * (90 + 120 * u), 1070 + Math.sin(an) * (40 + 80 * u)], [470 + Math.cos(an) * (130 + 150 * u), 1070 + Math.sin(an) * (60 + 100 * u)]], '#ffffff', 8 * (1 - u));
  }
  stamp(540, 640 + shake(t, hit + 0.3, 0.4, 6), '₹10 LAKH FINE', C.red, P(t, hit, hit + 0.3), -0.08, 78);
  chipW(540, 1290, 'OLA: PRE-RIDE TIP BAND KARO', C.grn, t, kL + 0.2, 99, { size: 28, h: 68 });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneSearch], [LS(1), LS(2), sceneRule], [LS(2), LS(3), sceneRename],
          [LS(3), LS(4), sceneTwist], [LS(4), LS(n) - 0.4, sceneFine],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('tip do') + 0.2, 540, 1000, [C.yel, C.org, '#ffffff'], 22, 1.2);
  burst(t, CK('BAAD') + 0.3, RX[2] - 10, RY - 250, [C.grn, C.yel, '#ffffff'], 24, 1.2);
  burst(t, CK('tip se add-on') + 0.3, 540, 760, [C.yel, C.pink, '#ffffff'], 26, 1.4);
  burst(t, CK('KAM accept') + 0.45, 695, 800, [C.red, C.org, C.yel], 24, 1.2);
  burst(t, CK('10 lakh'), 540, 640, [C.red, C.yel, '#ffffff'], 30, 1.5);
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
