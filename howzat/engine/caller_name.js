window.BG = '#33407a';
// "Truecaller nahi, phir bhi caller ka naam kaise?" (CNAP) — 1080x1920, synced to window.TL (helpers from maps.js via the ola tip reel)
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
// CNAP (caller name presentation) reel scenes
// =====================================================================
window.TOPIC = 'Caller ka Naam';
function STEPS() { return [[0, 'UNKNOWN CALL'], [LS(2), 'NAYA RULE: CNAP'], [LS(5), 'SCAM PAKDO']]; }
const NUM = '+91 9XXXX X4321';
const NAME = 'RAMESH KUMAR';

// ---------- small flat drawings (original, no logos) ----------
function handset(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-22, -10); ctx.quadraticCurveTo(0, 16, 22, -10);
  ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  for (const sx of [-1, 1]) { rr(sx * 22 - 8, -18, 16, 14, 5); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.restore();
}
function person(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(4, 34, 30, 20, 0, Math.PI, 0); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 30, 30, 22, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  disc(0, -6, 17, SKIN, 3);
  ctx.restore();
}
function avatar(x, y, r, col) {
  disc(x, y, r, col, 0);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  ctx.beginPath(); ctx.arc(x, y - r * 0.18, r * 0.36, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.78, r * 0.62, r * 0.5, 0, 0, 7); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
}
// pill with a name in it
function namePill(x, y, label, col, f, size = 40, tc = INK) {
  popAt(x, y, f, () => {
    ctx.font = SANSB(size); const w = ctx.measureText(label).width + 56, h = size * 1.7;
    hardShadow(-w / 2, -h / 2, w, h, h / 2, 6);
    rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    txt(label, 0, 3, SANSB(size), tc);
  });
}
// incoming call screen, drawn in phone coordinates (screen = -190..190 x -380..380)
function callScreen(t, o) {
  ctx.fillStyle = C.box; ctx.fillRect(-200, -400, 400, 800);
  const dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
  txt('Incoming call' + dots, -120, -300, `500 24px ${MONO}`, C.mute, 'left');
  // ring pulses around the avatar
  for (let k = 0; k < 2; k++) {
    const u = (t * 1.2 + k / 2) % 1;
    ctx.beginPath(); ctx.arc(0, -160, 82 + 60 * u, 0, 7); ctx.lineWidth = 6 * (1 - u); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
  }
  avatar(0, -160, 78, o.avCol || C.purple);
  txt(o.num, 0, -30, `700 30px ${MONO}`, '#ffffff');
  const nf = P(t, o.nameT, o.nameT + 0.3);
  if (nf < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - nf;
    txt('Unknown', 0, 50, `800 40px ${SANS}`, C.dim);
    if (o.hiT !== undefined) {
      const hf = win(t, o.hiT, o.nameT + 0.2, 0.15, 0.15);
      if (hf > 0) { rr(-150, 12, 300, 76, 38); ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.strokeStyle = hexA(C.yel, hf); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.restore();
  }
  namePill(0 + (o.shakeT ? shake(t, o.shakeT, 0.5, 8) : 0), 50, o.name, o.col, nf, o.size || 34);
  // decline / accept
  const pb = 1 + 0.08 * Math.sin(t * 10);
  ctx.save(); ctx.translate(-100, 270); if (o.pulseDecline && t > o.pulseDecline) ctx.scale(pb, pb); disc(0, 0, 50, C.red, 5); handset(0, 2, 1, Math.PI * 0.75 + Math.PI * 0.25); ctx.restore();
  ctx.save(); ctx.translate(100, 270); disc(0, 0, 50, C.grn, 5); handset(0, 2, 1, 0); ctx.restore();
}
function ringWaves(x, y, hw, t, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const u = (t * 2 + k / 3) % 1, al = 1 - u;
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.arc(x + sx * (hw + 20 + 70 * u), y, 70 + 40 * u, sx > 0 ? -0.6 : Math.PI - 0.6, sx > 0 ? 0.6 : Math.PI + 0.6);
      ctx.lineWidth = 9; ctx.strokeStyle = hexA('#ffffff', 0.85 * al); ctx.stroke();
    }
  }
  ctx.restore();
}
function tower(x, y, s, t, on) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const legs = [[[-70, 110], [0, -110]], [[70, 110], [0, -110]]];
  for (const [p, q] of legs) { line([[p[0] + 6, p[1] + 6], [q[0] + 6, q[1] + 6]], INK, 18); }
  for (const [p, q] of legs) { line([p, q], INK, 18); line([p, q], LIGHT, 9); }
  for (const yy of [-30, 40]) { const k = (yy + 110) / 220; line([[-70 * k, yy], [70 * k, yy]], INK, 12); line([[-70 * k, yy], [70 * k, yy]], LIGHT, 5); }
  disc(0, -118, 22, C.yel, 4);
  if (on) for (let k = 0; k < 3; k++) {
    const u = (t * 1.6 + k / 3) % 1;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(0, -118, 40 + 70 * u, sx > 0 ? -0.7 : Math.PI - 0.7, sx > 0 ? 0.7 : Math.PI + 0.7); ctx.lineWidth = 8 * (1 - u); ctx.strokeStyle = C.yel; ctx.stroke(); }
  }
  ctx.restore();
}
function simCard(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round';
  const pts = [[-50, -70], [22, -70], [50, -42], [50, 70], [-50, 70]];
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a + 6, b + 6)); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  rr(-28, -14, 56, 58, 10); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  line([[-28, 15], [28, 15]], INK, 3); line([[0, -14], [0, 44]], INK, 3);
  ctx.restore();
}

// ---------- scene 1: unknown number... screen pe naam: Ramesh! ----------
function sceneCall(t) {
  const kN = CK('screen pe naam'), kR = CK('Ramesh');
  const pf = P(t, 0, 0.35), s = L(0.78, 0.86, back(pf));
  const vib = t < kR + 0.5 ? Math.sin(t * 70) * 5 : 0;
  ringWaves(540, 900, PW / 2 * 0.86, t, 1 - P(t, kR + 0.3, kR + 0.7));
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(540 + vib, 900, s, () => callScreen(t, { num: NUM, name: NAME, nameT: kR, col: C.grn, hiT: kN }));
  ctx.restore();
  chipW(540, 380, 'UNKNOWN NUMBER', C.cyan, t, 0.1, kR + 0.15, { size: 34, h: 74 });
  chipW(540, 380, 'NAAM KAISE AAYA?!', C.grn, t, kR + 0.25, 99, { size: 34, h: 74 });
}

// ---------- scene 2: Truecaller bhi nahi. Naam kisne bheja? ----------
function appTile(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-110, -110, 220, 220, 52, C.cyan, 6, 10);
  handset(-12, -8, 2.2, 0);
  ctx.beginPath(); ctx.arc(40, 34, 30, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  line([[62, 56], [86, 80]], INK, 12);
  ctx.restore();
}
function sceneNoApp(t) {
  const a = LS(1), kQ = CK('Naam kisne');
  const m = eio(P(t, kQ - 0.1, kQ + 0.3));
  const x = L(540, 270, m), y = L(780, 640, m), s = L(1.25, 0.8, m);
  popAt(x, y, P(t, a, a + 0.3), () => appTile(0, 0, s));
  banSign(x, y, 175 * s, P(t, a + 0.35, a + 0.6));
  chipW(x, y + 210 * s, 'TRUECALLER', '#ffffff', t, a + 0.15, 99, { size: L(32, 26, m), h: L(70, 58, m) });
  chipW(540, 1260, 'APP INSTALL HI NAHI', C.red, t, a + 0.6, kQ, { size: 34, h: 76 });
  // the mystery: a name with nobody behind it
  namePill(700, 600, NAME, C.grn, P(t, kQ, kQ + 0.3), 36);
  popAt(690, 1000 + Math.sin(t * 4) * 10, P(t, kQ + 0.15, kQ + 0.45), () => {
    ctx.font = SANSB(360); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.strokeText('?', 10, 10); ctx.strokeText('?', 0, 0);
    ctx.fillStyle = C.yel; ctx.fillText('?', 0, 0);
  });
  chipW(300, 1000, 'KISNE BHEJA?', C.yel, t, kQ + 0.4, 99, { size: 30, h: 68 });
}

// ---------- scene 3: naya rule: CNAP ----------
function sceneRule(t) {
  const a = LS(2), kC = CK('CNAP');
  chipW(540, 380, 'DoT KA ORDER', C.yel, t, a + 0.05, 99, { size: 34, h: 74 });
  popAt(540, 860, P(t, a, a + 0.35), () => {
    card(-330, -320, 660, 620, 36, PAPER, 6, 12);
    rr(-330, -320, 660, 100, [36, 36, 0, 0]); ctx.fillStyle = C.purple; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    txt('NAYA RULE', 0, -268, SANSB(48), INK);
    txt('1 NOV 2026 SE', 0, -160, `700 32px ${MONO}`, '#5a5f80');
    txt('caller ka NAAM', 0, -90, SANSB(52), INK);
    txt('screen pe!', 0, -22, SANSB(52), '#c2413e');
    for (const yy of [70, 120]) { rr(-250, yy, 500, 18, 9); ctx.fillStyle = 'rgba(13,10,38,0.15)'; ctx.fill(); }
  });
  stamp(540, 1030, 'CNAP', C.yel, P(t, kC - 0.05, kC + 0.25), -0.1, 110, INK);
  chipW(540, 1290, 'CALLING NAME PRESENTATION', C.cyan, t, kC + 0.45, 99, { size: 28, h: 66 });
}

// ---------- scene 4: telecom company SIM ke record se naam uthati hai ----------
const ROWS = [['98XXX X1180', 'ANITA SHARMA'], [NUM.slice(4), NAME], ['97XXX X7788', 'VIKRAM PATEL']];
const DBY = 1035;
function sceneLookup(t) {
  const a = LS(3), kS = CK('SIM ke record'), kU = CK('naam uthati');
  // caller -> tower
  popAt(190, 560, P(t, a, a + 0.3), () => { disc(0, 0, 72, C.yel, 6); person(0, 12, 1.4, C.org); });
  chipW(190, 675, 'CALLER', '#ffffff', t, a + 0.1, 99, { size: 24, h: 54 });
  const tf = P(t, a + 0.1, a + 0.4);
  if (tf > 0) { ctx.save(); ctx.globalAlpha *= Math.min(1, tf * 3); tower(560, 540, L(0.6, 0.85, back(tf)), t, true); ctx.restore(); }
  chipW(800, 470, 'TELECOM CO.', C.yel, t, a + 0.25, 99, { size: 26, h: 58 });
  const lf = eo(P(t, a + 0.2, a + 0.6));
  if (lf > 0) line(polyPart([[275, 560], [470, 470]], lf), '#ffffff', 7, [16, 14]);
  // the records
  const df = P(t, kS - 0.1, kS + 0.25);
  popAt(540, DBY, df, () => {
    card(-420, -225, 840, 450, 36, C.box, 6, 12);
    rr(-420, -225, 840, 96, [36, 36, 0, 0]); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    txt('SIM RECORDS', 30, -175, `700 36px ${MONO}`, INK);
    simCard(-330, -175, 0.48, -0.15);
    ROWS.forEach(([n, nm], i) => {
      const ry = -70 + i * 100, rf = P(t, kS + 0.1 + i * 0.1, kS + 0.35 + i * 0.1);
      if (rf <= 0) return;
      ctx.save(); ctx.globalAlpha *= rf;
      const hit = i === 1 && t > kU;
      if (hit) { rr(-395, ry - 40, 790, 80, 20); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
      txt(n, -370, ry + 2, `700 30px ${MONO}`, hit ? INK : C.mute, 'left');
      const lifted = i === 1 && t > kU + 0.1;
      if (!lifted) txt(nm, 370, ry + 2, SANSB(32), hit ? INK : '#ffffff', 'right');
      if (i < 2) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-390, ry + 49, 780, 2); }
      ctx.restore();
    });
    // scanning bar
    const sc = P(t, kS + 0.4, kU);
    if (sc > 0 && sc < 1) { const sy = L(-70, 30, eio(sc)); rr(-400, sy - 44, 800, 88, 22); ctx.lineWidth = 6; ctx.strokeStyle = C.yel; ctx.stroke(); }
  });
  // the name lifts out of the record
  const up = eo(P(t, kU + 0.1, kU + 0.6));
  if (t > kU + 0.1) {
    const nx = L(540 + 200, 560, up), ny = L(DBY + 30, 740, up);
    namePill(nx, ny, NAME, C.grn, 1, L(32, 40, up));
  }
}

// ---------- scene 5: number ke saath bhej deti hai ----------
function packet(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-190, -70, 380, 140, 26, '#ffffff', 5, 7);
  txt(NUM, 0, -28, `700 26px ${MONO}`, '#5a5f80');
  txt('+ ' + NAME, 0, 22, SANSB(34), INK);
  ctx.restore();
}
function sceneSend(t) {
  const a = LS(4), kB = CK('bhej deti'), arr = kB + 0.15;
  chipW(540, 380, 'NUMBER + NAAM', C.yel, t, a + 0.05, 99, { size: 36, h: 78 });
  const tf = P(t, a - 0.1, a + 0.2);
  if (tf > 0) { ctx.save(); ctx.globalAlpha *= Math.min(1, tf * 3); tower(150, 640, 0.8, t, true); ctx.restore(); }
  // receiver phone
  const pf = P(t, a, a + 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(740 + shake(t, arr, 0.4, 6), 975, L(0.58, 0.64, back(pf)), () => callScreen(t, { num: NUM, name: NAME, nameT: arr, col: C.grn, size: 30, avCol: C.org }));
  ctx.restore();
  chipW(740, 1330, 'TUMHARA PHONE', '#ffffff', t, a + 0.2, 99, { size: 26, h: 58 });
  // the path and the packet
  const path = [[390, 540], [530, 530], [640, 650], [710, 820]];
  const lf = eo(P(t, a, a + 0.4));
  if (lf > 0) line(polyPart(path, lf), '#ffffff', 7, [16, 14]);
  const u = eio(P(t, a + 0.15, arr));
  if (t < arr + 0.1) {
    const pts = polyPart(path, Math.max(0.001, u)), p = pts[pts.length - 1];
    ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, a + 0.1, a + 0.3) * 3) * (1 - P(t, arr - 0.05, arr + 0.1));
    packet(p[0], p[1] - 40, L(0.75, 0.5, P(u, 0.6, 1)));
    ctx.restore();
  }
  if (t > arr + 0.25) tickMark(880, 680, 40, C.grn);
  chipW(300, 1060, '4G / 5G PE', C.cyan, t, arr + 0.3, 99, { size: 28, h: 64 });
  chipW(300, 1150, 'DEFAULT ON', C.grn, t, arr + 0.45, 99, { size: 28, h: 64 });
}

// ---------- scene 6: bank ka call, naam kisi aadmi ka? SAVDHAAN! ----------
function sceneScam(t) {
  const a = LS(5), kA = CK('naam kisi aadmi'), kS = CK('SAVDHAAN');
  const pf = P(t, a - 0.05, a + 0.3);
  const vib = Math.sin(t * 70) * 4 * (1 - P(t, kA, kA + 0.2));
  ringWaves(380, 980, PW / 2 * 0.72, t, P(t, a, a + 0.3) * (1 - P(t, kA - 0.2, kA + 0.2)));
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(380 + vib + shake(t, kS, 0.5, 9), 980, L(0.66, 0.72, back(pf)), () => callScreen(t, {
    num: '+91 7XXXX X9090', name: 'RAJU', nameT: a - 2, col: t > kA ? C.red : C.grn, size: 34,
    shakeT: kA, avCol: C.cyan, pulseDecline: kS }));
  ctx.restore();
  // what the caller says
  popAt(760, 520, P(t, a + 0.1, a + 0.4), () => {
    hardShadow(-230, -70, 460, 140, 30, 7);
    rr(-230, -70, 460, 140, 30); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-150, 66); ctx.lineTo(-215, 120); ctx.lineTo(-90, 66); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillRect(-152, 60, 64, 8);
    txt('"Main BANK', 0, -24, SANSB(40), INK);
    txt('se bol raha hoon!"', 0, 28, SANSB(36), INK);
  });
  // mismatch
  chipW(780, 820, 'NAAM: BANK NAHI', C.red, t, kA + 0.1, 99, { size: 28, h: 64 });
  chipW(780, 910, 'KISI AADMI KA!', C.red, t, kA + 0.3, 99, { size: 28, h: 64 });
  popAt(790, 1060, P(t, kS - 0.05, kS + 0.25), () => warnIcon(0, 0, 2.6, C.yel));
  stamp(560, 1290 + shake(t, kS + 0.3, 0.4, 6), 'SAVDHAAN!', C.red, P(t, kS, kS + 0.3), -0.08, 80);
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneCall], [LS(1), LS(2), sceneNoApp], [LS(2), LS(3), sceneRule],
          [LS(3), LS(4), sceneLookup], [LS(4), LS(5), sceneSend], [LS(5), LS(n) - 0.4, sceneScam],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('Ramesh') + 0.15, 540, 945, [C.grn, C.yel, '#ffffff'], 24, 1.2);
  burst(t, CK('CNAP') + 0.2, 540, 1030, [C.yel, C.cyan, '#ffffff'], 28, 1.4);
  burst(t, CK('naam uthati') + 0.6, 560, 740, [C.grn, C.yel, '#ffffff'], 24, 1.2);
  burst(t, CK('bhej deti') + 0.2, 740, 1000, [C.grn, C.cyan, '#ffffff'], 22, 1.1);
  burst(t, CK('SAVDHAAN') + 0.2, 560, 1290, [C.red, C.yel, '#ffffff'], 30, 1.5);
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
