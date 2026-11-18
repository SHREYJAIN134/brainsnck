window.BG = '#3a6488';
// "Flight 12 guna mehngi kaise?" — 1080x1920, synced to window.TL (helpers from maps.js via the cab surge reel)
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
// Flight fare buckets reel scenes
// =====================================================================
window.TOPIC = 'Flight Fare';
function STEPS() { return [[0, 'SHAADI SEASON'], [LS(2), 'ASLI RAAZ'], [LS(5), 'KAAM KI BAAT']]; }
const SKY = '#9fd3ea';
const MARI = '#f6a465';   // marigold

// ---------- reused from the cab surge reel ----------
function person(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(4, 34, 30, 20, 0, Math.PI, 0); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 30, 30, 22, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  disc(0, -6, 17, SKIN, 3);
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

// ---------- small flat drawings (original, no logos) ----------
// side-view plane
function plane(x, y, s, rot = 0, col = '#ffffff') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round';
  const body = () => { ctx.beginPath(); ctx.moveTo(-150, -8); ctx.quadraticCurveTo(-150, -30, -120, -30); ctx.lineTo(110, -30);
    ctx.quadraticCurveTo(160, -28, 170, 0); ctx.quadraticCurveTo(160, 26, 110, 28); ctx.lineTo(-120, 28); ctx.quadraticCurveTo(-150, 28, -150, 8); ctx.closePath(); };
  // tail + wings behind
  ctx.beginPath(); ctx.moveTo(-120, -28); ctx.lineTo(-150, -90); ctx.lineTo(-110, -90); ctx.lineTo(-70, -28); ctx.closePath();
  ctx.fillStyle = C.pink; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(-70, 90); ctx.lineTo(-30, 90); ctx.lineTo(50, 10); ctx.closePath();
  ctx.fillStyle = '#c9cde6'; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(7, 7); body(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
  body(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(-80 + i * 26, -6, 7, 0, 7); ctx.fillStyle = '#2a3366'; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(128, -18); ctx.quadraticCurveTo(152, -14, 158, -2); ctx.lineTo(128, -2); ctx.closePath(); ctx.fillStyle = '#2a3366'; ctx.fill();
  ctx.restore();
}
// plane seat (front view)
function seat(x, y, s, col, label) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-70, -110, 140, 150, 26, col, 5, 6);            // back rest
  card(-58, -96, 116, 30, 12, '#ffffff', 4, 0);         // head rest cover
  card(-84, 30, 168, 54, 18, col, 5, 6);               // cushion
  card(-98, -30, 26, 90, 10, '#2a3366', 4, 4);         // arm rests
  card(72, -30, 26, 90, 10, '#2a3366', 4, 4);
  if (label) txt(label, 0, -30, SANSB(40), INK);
  ctx.restore();
}
// bucket with price label; fill = how many seats left (0..1)
function bucket(x, y, w, h, col, label, left, glow = 0) {
  ctx.save(); ctx.translate(x, y);
  ctx.lineJoin = 'round';
  const tw = w, bw = w * 0.78;
  const shape = (dx, dy) => { ctx.beginPath(); ctx.moveTo(-tw / 2 + dx, -h / 2 + dy); ctx.lineTo(tw / 2 + dx, -h / 2 + dy); ctx.lineTo(bw / 2 + dx, h / 2 + dy); ctx.lineTo(-bw / 2 + dx, h / 2 + dy); ctx.closePath(); };
  shape(8, 8); ctx.fillStyle = INK; ctx.fill();
  shape(0, 0); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  // handle
  ctx.beginPath(); ctx.ellipse(0, -h / 2, tw / 2 - 6, 34, 0, Math.PI, 0); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  // seats inside: little squares
  const n = 6, done = Math.round(n * (1 - left));
  for (let i = 0; i < n; i++) {
    const sx = -bw / 2 + 22 + (i % 3) * ((bw - 44) / 2), sy = -h / 2 + 52 + Math.floor(i / 3) * 52;
    rr(sx - 18, sy - 16, 36, 32, 8); ctx.fillStyle = i < done ? 'rgba(13,10,38,0.25)' : '#ffffff'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  // label tag
  ctx.font = `700 30px ${MONO}`; const lw = ctx.measureText(label).width + 30;
  hardShadow(-lw / 2, h / 2 + 20, lw, 50, 25, 5);
  rr(-lw / 2, h / 2 + 20, lw, 50, 25); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt(label, 0, h / 2 + 46, `700 30px ${MONO}`, INK);
  if (glow > 0) { ctx.globalAlpha *= glow; shape(0, 0); ctx.lineWidth = 10; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
  ctx.restore();
}
function marigold(t, y, a) {   // a string of flowers across the top (shaadi vibe)
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.beginPath(); for (let i = 0; i <= 20; i++) { const x = 40 + i * 50, yy = y + Math.sin(i / 20 * Math.PI) * 60; i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }
  ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  for (let i = 0; i <= 20; i++) {
    const x = 40 + i * 50, yy = y + Math.sin(i / 20 * Math.PI) * 60 + Math.sin(t * 3 + i) * 3;
    disc(x, yy, 17, i % 3 === 1 ? C.yel : MARI, 3);
    ctx.beginPath(); ctx.arc(x, yy, 6, 0, 7); ctx.fillStyle = '#d9773a'; ctx.fill();
  }
  ctx.restore();
}
function gauge(x, y, r, v, label) {   // booking speed meter, v 0..1
  ctx.save(); ctx.translate(x, y);
  hardShadow(-r - 20, -r - 20, 2 * r + 40, r + 90, 30, 8);
  rr(-r - 20, -r - 20, 2 * r + 40, r + 90, 30); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  const cols = [C.grn, C.yel, C.org, C.red];
  cols.forEach((c, i) => { ctx.beginPath(); ctx.arc(0, 20, r - 20, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); ctx.lineWidth = 34; ctx.strokeStyle = c; ctx.stroke(); });
  ctx.beginPath(); ctx.arc(0, 20, r - 20, Math.PI, 2 * Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  const a = Math.PI + v * Math.PI;
  line([[0, 20], [Math.cos(a) * (r - 40), 20 + Math.sin(a) * (r - 40)]], INK, 10);
  disc(0, 20, 16, INK, 0);
  txt(label, 0, 62, `700 26px ${MONO}`, INK);
  ctx.restore();
}

// ---------- scene 1: Patna-Delhi flight... 6,000 → 72,000 ----------
function fareScreen(t, k6, kS, k72) {
  ctx.fillStyle = '#2c356b'; ctx.fillRect(-200, -400, 400, 800);
  ctx.fillStyle = INK; ctx.fillRect(-200, -400, 400, 92);
  txt('Flight dhoondo', -165, -322, `800 28px ${SANS}`, '#ffffff', 'left');
  // route
  txt('PAT', -120, -230, SANSB(54), '#ffffff'); txt('DEL', 120, -230, SANSB(54), '#ffffff');
  txt('Patna', -120, -188, `600 22px ${SANS}`, C.mute); txt('Delhi', 120, -188, `600 22px ${SANS}`, C.mute);
  line([[-60, -230], [60, -230]], C.cyan, 5, [10, 10]);
  plane(0, -232, 0.22, 0);
  // date pill
  const wed = t >= kS;
  rr(-150, -140, 300, 56, 28); ctx.fillStyle = wed ? MARI : '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt(wed ? 'Shaadi season' : 'Aam din', 0, -111, `700 26px ${MONO}`, INK);
  // fare card
  card(-178, -50, 356, 250, 26, '#ffffff', 5, 5);
  txt('Economy · 1 adult', -150, -10, `700 22px ${MONO}`, '#3c4a6b', 'left');
  const u = eo(P(t, k72 - 0.15, k72 + 0.6));
  const amt = Math.round(L(6000, 72000, u) / 100) * 100;
  const sh = shake(t, k72 + 0.6, 0.5, 8);
  const vis = P(t, k6 - 0.1, k6 + 0.2);
  ctx.save(); ctx.globalAlpha *= vis;
  txt('₹' + amt.toLocaleString('en-IN'), sh, 70, SANSB(70), u > 0.02 ? '#c2413e' : '#2f7a45');
  ctx.restore();
  if (u > 0.02) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, u * 3);
    rr(-150, 125, 300, 52, 26); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    txt('12 GUNA!', 0, 152, `700 26px ${MONO}`, '#ffffff');
    ctx.restore();
  } else if (vis > 0) {
    txt('Normal kiraya', 0, 152, `700 24px ${MONO}`, '#2f7a45');
  }
  // book button
  rr(-150, 250, 300, 80, 40); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt('BOOK', 0, 292, SANSB(36), INK);
}
function sceneFare(t) {
  const k6 = CK('aam din'), kS = CK('Shaadi'), k72 = CK('₹72,000');
  // plane flies across the sky first
  const pf = P(t, 0.0, 1.6);
  if (pf < 1) { ctx.save(); ctx.globalAlpha *= 1 - P(t, 1.2, 1.6); plane(L(-200, 1280, pf), 520 - 60 * pf, 0.9, -0.08); ctx.restore(); }
  marigold(t, 300, P(t, kS - 0.1, kS + 0.3));
  const f = P(t, 0.5, 0.9);
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 3);
  phone(540 + shake(t, k72 + 0.6, 0.5, 6), 930, L(0.72, 0.8, back(f)), () => fareScreen(t, k6, kS, k72));
  ctx.restore();
  chipW(540, 1360, '₹6,000 → ₹72,000', C.red, t, k72 + 0.6, 99, { size: 40, h: 84 });
}

// ---------- scene 2: seat wahi... phir itna kyun? ----------
function sceneSeat(t) {
  const a = LS(1), kQ = CK('phir itna');
  const f1 = P(t, a, a + 0.35), f2 = P(t, a + 0.2, a + 0.55);
  popAt(330, 860, f1, () => seat(0, 0, 1.25, C.cyan, ''));
  popAt(750, 860, f2, () => seat(0, 0, 1.25, C.cyan, ''));
  // price tags
  popAt(330, 1090, P(t, a + 0.35, a + 0.6), () => chip(0, 0, '₹6,000', C.grn, 1, { size: 40, h: 82 }));
  popAt(750, 1090, P(t, a + 0.5, a + 0.75), () => chip(0, 0, '₹72,000', C.red, 1, { size: 40, h: 82 }));
  // "=" between seats
  popAt(540, 830, P(t, a + 0.5, a + 0.8), () => { txt('=', 0, 0, SANSB(120), '#ffffff'); });
  stamp(540, 520, 'SAME SEAT', C.yel, P(t, a + 0.55, a + 0.85), -0.08, 64, INK);
  // big question mark
  const q = P(t, kQ, kQ + 0.35);
  popAt(540, 1260, q, () => { disc(0, 0, 70, C.pink, 7); txt('?', 0, 6, SANSB(96), INK); });
  ring(540, 1260, t, kQ + 0.1, '#ffffff', 60, 160);
}

// ---------- scene 3: seats BUCKETS me bikti hain ----------
const BK = [[200, C.grn, '₹'], [415, C.yel, '₹₹'], [630, C.org, '₹₹₹'], [845, C.red, '₹₹₹₹']];
const BKY = 860, BKW = 190, BKH = 210;
function bucketsAt(t, a0, leftFn, glowFn) {
  BK.forEach(([x, col, lab], i) => {
    const f = P(t, a0 + i * 0.16, a0 + i * 0.16 + 0.35);
    popAt(x, BKY, f, () => bucket(0, 0, BKW, BKH, col, lab, leftFn(i), glowFn ? glowFn(i) : 0));
  });
}
function sceneBuckets(t) {
  const a = LS(2), kB = CK('Seats BUCKETS');
  // a plane cabin row splits into buckets
  plane(540, 470, L(1.15, 1.25, P(t, a, a + 1)), 0);
  bucketsAt(t, kB + 0.2, () => 1);
  // arrow under buckets: cheap -> expensive
  const af = P(t, kB + 0.8, kB + 1.3);
  if (af > 0) {
    const pts = [[150, 1215], [L(150, 930, eo(af)), 1215]];
    line(pts, INK, 16); line(pts, '#ffffff', 8);
    if (af > 0.9) { ctx.beginPath(); ctx.moveTo(950, 1215); ctx.lineTo(915, 1192); ctx.lineTo(915, 1238); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
    txt('SASTA', 150, 1270, `700 26px ${MONO}`, '#ffffff', 'left');
    txt('MEHENGA', 930, 1270, `700 26px ${MONO}`, '#ffffff', 'right');
  }
  chipW(540, 1350, 'FARE BUCKETS · RBD', C.cyan, t, kB + 0.5, 99, { size: 34, h: 76 });
}

// ---------- scene 4: sasta bucket bika... agla mehenga khula ----------
function sceneSellOut(t) {
  const a = LS(3), kS = CK('Sasta bucket'), kA = CK('agla mehenga');
  const sold0 = P(t, kS + 0.1, kA - 0.1);                // first bucket empties
  const left = i => i === 0 ? 1 - sold0 : 1;
  const glow = i => i === 1 ? win(t, kA, 99, 0.2, 0.2) * (0.6 + 0.4 * Math.sin(t * 8)) : 0;
  bucketsAt(t, a - 0.6, left, glow);
  // seats flying out of bucket 1 to buyers
  for (let k = 0; k < 6; k++) {
    const st = kS + 0.1 + k * (kA - kS - 0.2) / 6, u = P(t, st, st + 0.45);
    if (u <= 0 || u >= 1) continue;
    const x = L(200, 120 + k * 30, u), y = L(BKY - 40, 470 - 120 * Math.sin(u * Math.PI), u);
    rr(x - 18, y - 16, 36, 32, 8); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  // people who grabbed them
  popAt(200, 470, P(t, kS, kS + 0.3), () => { for (let k = 0; k < 3; k++) person(-80 + k * 80, 0, 1, POP[k]); });
  stamp(200, BKY - 10, 'SOLD', C.red, P(t, kA - 0.15, kA + 0.1), -0.18, 46);
  // now the next bucket is open
  popAt(415, BKY - 180, P(t, kA + 0.05, kA + 0.35), () => chip(0, 0, 'AB YE KHULA', C.yel, 1, { size: 28, h: 64 }));
  chipW(540, 1350, 'SASTA KHATAM → DAAM UPAR', C.org, t, kA + 0.3, 99, { size: 32, h: 76 });
}

// ---------- scene 5: bheed badhi, software ne daam badhaya ----------
function sceneSoftware(t) {
  const a = LS(4), kB = CK('Bheed'), kS = CK('software'), kD = CK('daam badhaya');
  // crowd grows
  const nP = Math.round(L(2, 14, P(t, kB, kS + 0.3)));
  for (let k = 0; k < nP; k++) {
    const x = 120 + (k % 7) * 140, y = 470 + Math.floor(k / 7) * 110;
    popAt(x, y, P(t, kB + k * 0.04, kB + k * 0.04 + 0.25), () => person(0, 0, 1.1, POP[k % POP.length]));
  }
  // laptop / software box with gauge
  const gf = P(t, kS - 0.1, kS + 0.25);
  const v = 0.15 + 0.8 * eo(P(t, kS + 0.1, kD + 0.3)) + 0.03 * Math.sin(t * 20) * P(t, kD, kD + 0.2);
  popAt(360, 960, gf, () => { gauge(0, 0, 150, v, 'BOOKING SPEED'); });
  popAt(360, 735, gf, () => { gear(-110, 0, 34, t * 2, C.purple); gear(-60, -20, 22, -t * 3, C.yel); txt('SOFTWARE', 40, 0, `700 26px ${MONO}`, '#ffffff'); });
  // price arrow up
  const pf = P(t, kD, kD + 0.35);
  popAt(800, 960 - 40 * eo(P(t, kD, kD + 0.6)), pf, () => { upArrow(0, 0, 1.3, C.red); });
  popAt(800, 1110, pf, () => chip(0, 0, 'DAAM ↑', C.red, 1, { size: 40, h: 82 }));
  chipW(540, 1350, 'AAM TAUR PE: AUTO PRICING', C.cyan, t, kS + 0.2, 99, { size: 30, h: 72 });
}

// ---------- scene 6: jaldi book karo ----------
function sceneEarly(t) {
  const a = LS(5), kJ = CK('Jaldi');
  // calendar
  const cf = P(t, a - 0.1, a + 0.3);
  popAt(540, 780, cf, () => {
    card(-300, -230, 600, 460, 30, '#ffffff', 6, 10);
    rr(-300, -230, 600, 90, [30, 30, 0, 0]); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    txt('BOOKING KAB?', 0, -184, SANSB(40), '#ffffff');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      const x = -250 + c * 100, y = -100 + r * 100;
      rr(x, y, 80, 80, 14); ctx.fillStyle = r === 0 && c < 2 ? C.grn : (r === 2 && c > 3 ? C.red : '#eef0fa'); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    }
  });
  if (t > kJ + 0.35) tickMark(540 - 210 + 40, 780 - 100 + 40, 44, '#ffffff');
  ring(330, 720, t, kJ + 0.35, '#ffffff', 40, 150);
  popAt(330, 1100, P(t, kJ + 0.1, kJ + 0.4), () => chip(0, 0, 'JALDI = SASTA', C.grn, 1, { size: 34, h: 76 }));
  popAt(760, 1100, P(t, kJ + 0.35, kJ + 0.65), () => chip(0, 0, 'LATE = MEHENGA', C.red, 1, { size: 30, h: 70 }));
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneFare], [LS(1), LS(2), sceneSeat], [LS(2), LS(3), sceneBuckets],
          [LS(3), LS(4), sceneSellOut], [LS(4), LS(5), sceneSoftware], [LS(5), LS(n) - 0.4, sceneEarly],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('₹72,000') + 0.6, 540, 1000, [C.red, C.org, C.yel], 28, 1.4);
  burst(t, CK('Seats BUCKETS') + 0.4, 540, BKY, [C.cyan, C.yel, '#ffffff'], 24, 1.3);
  burst(t, CK('agla mehenga') + 0.1, 415, BKY, [C.red, C.org, C.yel], 22, 1.1);
  burst(t, CK('daam badhaya') + 0.3, 800, 960, [C.red, C.pink, C.yel], 22, 1.2);
  burst(t, CK('Jaldi') + 0.35, 370, 720, [C.grn, C.yel, '#ffffff'], 22, 1.1);
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
