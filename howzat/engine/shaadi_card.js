window.BG = '#5a4e8c';
// "Shaadi ka card khola, account khaali kaise?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// Shaadi card (APK) scam reel scenes
// =====================================================================
window.TOPIC = 'Shaadi Card Scam';
function STEPS() { return [[0, 'SHAADI CARD'], [LS(2), 'ASLI RAAZ'], [LS(5), 'BACHNE KA TARIKA']]; }
const HAIR = '#2b2140';
const CHATBG = '#ece6da';
const TOPBAR = '#2f6b5e';

function heart(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-26, -6, -18, -30, 0, -16); ctx.bezierCurveTo(18, -30, 26, -6, 0, 12); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3 / s; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function pointer(x, y, ps = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(ps, ps);
  ctx.beginPath(); ctx.arc(6, 6, 34, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fillStyle = C.pink; ctx.fill();
  ctx.restore();
}
// pointer that glides in and taps at time tap
function tapper(t, tap, x0, y0, x1, y1) {
  const pa = P(t, tap - 0.5, tap - 0.05), po = 1 - P(t, tap + 0.3, tap + 0.5);
  if (t < tap - 0.55 || po <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, tap - 0.55, tap - 0.4)) * po;
  pointer(L(x0, x1, eio(pa)), L(y0, y1, eio(pa)), t > tap - 0.05 && t < tap + 0.15 ? 0.82 : 1);
  ctx.restore();
}
// small wedding-card file icon
function cardIcon(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-34, -44, 68, 88, 10, '#fbe3c0', 4, 4);
  rr(-26, -36, 52, 72, 6); ctx.lineWidth = 3; ctx.strokeStyle = C.org; ctx.stroke();
  heart(-9, -6, 0.55, C.pink); heart(9, -6, 0.55, C.pink);
  rr(-18, 16, 36, 6, 3); ctx.fillStyle = C.org; ctx.fill();
  ctx.restore();
}
// the WhatsApp-style file message (generic chat app, no logos)
function fileMsg(x, y, s, label = 'Shaadi_Card.apk') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-170, -58, 340, 116, 22, '#ffffff', 4, 5);
  cardIcon(-118, 0, 0.95);
  txt(label, -70, -14, `700 23px ${MONO}`, INK, 'left');
  txt('2.4 MB · tap to open', -70, 20, `500 17px ${MONO}`, '#6b6f8c', 'left');
  ctx.restore();
}
function chatScreen(t, name = 'Dost') {
  ctx.fillStyle = CHATBG; ctx.fillRect(-200, -400, 400, 800);
  for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(-180 + 360 * hash(i, 1), -250 + 620 * hash(i, 2), 5, 0, 7); ctx.fillStyle = 'rgba(13,10,38,0.06)'; ctx.fill(); }
  ctx.fillStyle = TOPBAR; ctx.fillRect(-200, -400, 400, 132);
  ctx.fillStyle = INK; ctx.fillRect(-200, -270, 400, 4);
  disc(-138, -318, 30, C.cyan, 0);
  ctx.beginPath(); ctx.arc(-138, -326, 11, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-138, -300, 18, 10, 0, Math.PI, 0); ctx.fill();
  txt(name, -94, -330, `800 32px ${SANS}`, '#ffffff', 'left');
  txt('online', -94, -297, `500 19px ${MONO}`, '#cfe9e2', 'left');
}
// generic aunty (original flat drawing, no real person)
function aunty(x, y, s, t, shock = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  // saree shoulders
  ctx.beginPath(); ctx.moveTo(-150, 210); ctx.quadraticCurveTo(-150, 90, -60, 78); ctx.lineTo(60, 78); ctx.quadraticCurveTo(150, 90, 150, 210); ctx.closePath();
  ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-60, 80); ctx.quadraticCurveTo(10, 150, 150, 120); ctx.lineTo(150, 150); ctx.quadraticCurveTo(10, 185, -75, 92); ctx.closePath(); ctx.fillStyle = C.pink; ctx.fill(); ctx.stroke();
  rr(-24, 36, 48, 50, 10); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  // bun + hair back
  ctx.beginPath(); ctx.arc(0, -118, 40, 0, 7); ctx.fillStyle = HAIR; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -22, 84, 92, 0, 0, 7); ctx.fillStyle = HAIR; ctx.fill(); ctx.stroke();
  // face
  ctx.beginPath(); ctx.ellipse(0, -10, 68, 78, 0, 0, 7); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-70, -40); ctx.quadraticCurveTo(-60, -95, 0, -92); ctx.quadraticCurveTo(60, -95, 70, -40); ctx.quadraticCurveTo(30, -78, 0, -80); ctx.quadraticCurveTo(-30, -78, -70, -40); ctx.closePath();
  ctx.fillStyle = HAIR; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  // bindi
  ctx.beginPath(); ctx.arc(0, -52, 7, 0, 7); ctx.fillStyle = C.red; ctx.fill();
  // glasses + eyes
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.arc(d * 28, -18, 22, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(d * 28, -18, 6 + 3 * shock, 0, 7); ctx.fillStyle = INK; ctx.fill();
    if (shock > 0.5) line([[d * 44, -52], [d * 14, -46]], INK, 5);
  }
  line([[-6, -18], [6, -18]], INK, 5);
  // mouth: smile -> shocked O
  if (shock < 0.5) { ctx.beginPath(); ctx.arc(0, 18, 18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  else { ctx.beginPath(); ctx.ellipse(0, 28, 14, 18 + 4 * Math.sin(t * 20), 0, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  ctx.restore();
}
// generic hooded scammer (original flat drawing)
function hacker(x, y, s, t, grin = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-140, 200); ctx.quadraticCurveTo(-140, 70, -70, 60); ctx.lineTo(70, 60); ctx.quadraticCurveTo(140, 70, 140, 200); ctx.closePath();
  ctx.fillStyle = HAIR; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-95, 70); ctx.quadraticCurveTo(-110, -120, 0, -125); ctx.quadraticCurveTo(110, -120, 95, 70); ctx.closePath();
  ctx.fillStyle = '#3b3160'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -5, 62, 72, 0, 0, 7); ctx.fillStyle = INK; ctx.fill();
  for (const d of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(d * 12, -20); ctx.lineTo(d * 46, -32); ctx.lineTo(d * 44, -12); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 18, 26, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  if (grin > 0) { ctx.beginPath(); ctx.moveTo(-22, 28); ctx.quadraticCurveTo(0, 50, 22, 28); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.restore();
}
function weddingCard(t, s) {
  ctx.save(); ctx.scale(s, s);
  card(-170, -230, 340, 460, 22, '#fbe3c0', 6, 12);
  rr(-148, -208, 296, 416, 14); ctx.lineWidth = 5; ctx.strokeStyle = C.org; ctx.stroke();
  heart(-30, -120, 1.5, C.pink); heart(30, -120, 1.5, C.pink);
  txt('SHAADI', 0, -10, SANSB(64), '#7a3b2e');
  txt('NIMANTRAN', 0, 50, `700 30px ${MONO}`, '#7a3b2e');
  for (let i = 0; i < 3; i++) { rr(-100, 100 + i * 28, 200 - i * 40 + 40 * (i === 2), 10, 5); ctx.fillStyle = '#e2b98a'; ctx.fill(); }
  ctx.restore();
}
function appTile(t, s) {
  ctx.save(); ctx.scale(s, s);
  card(-170, -170, 340, 340, 70, C.grn, 6, 12);
  // sneaky masked face on the app icon
  ctx.beginPath(); ctx.ellipse(0, -10, 112, 100, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  rr(-112, -48, 224, 56, 28); ctx.fillStyle = INK; ctx.fill();
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * 44, -20, 22, 12, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.beginPath(); ctx.arc(d * 44 + 6 * Math.sin(t * 3), -20, 7, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-40, 40); ctx.quadraticCurveTo(0, 66, 40, 40); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  txt('.APK', 0, 130, SANSB(46), INK);
  ctx.restore();
}

// ---------- scene 1: dost ke number se SHAADI card aaya ----------
function sceneInvite(t) {
  const kS = CK('SHAADI card');
  const vib = t > kS && t < kS + 0.5 ? Math.sin(t * 70) * 6 : 0;
  phone(540 + vib, 850, 0.95, () => {
    chatScreen(t, 'Dost');
    popAt(-10, -150, P(t, 0.25, 0.55), () => {
      card(-160, -34, 300, 68, 20, '#ffffff', 4, 4);
      txt('Kaise ho? :)', -140, 0, `700 26px ${SANS}`, INK, 'left');
    });
    popAt(0, -10, P(t, kS + 0.05, kS + 0.35), () => fileMsg(0, 0, 1));
    popAt(-5, 120, P(t, kS + 0.45, kS + 0.75), () => {
      card(-170, -34, 330, 68, 20, '#ffffff', 4, 4);
      txt('Shaadi me zaroor aana!', -150, 0, `700 25px ${SANS}`, INK, 'left');
    });
  });
  ring(540, 840, t, kS + 0.05, '#ffffff', 60, 260, 0.6);
  chipW(540, 380, 'DOST KA NUMBER', C.cyan, t, 0.1, 99, { size: 32, h: 70 });
  chipW(540, 1330, 'SHAADI CARD?', C.yel, t, kS + 0.6, 99, { size: 34, h: 76 });
}

// ---------- scene 2: aunty ne khola... 2.6 LAKH gaye ----------
function sceneOpen(t) {
  const kA = CK('Aunty ne'), kL = CK('2.6 LAKH');
  const tap = kA + 0.75;
  const shock = P(t, kL + 0.1, kL + 0.25);
  popAt(290 + shake(t, kL + 0.1, 0.5, 10), 610, P(t, kA - 0.1, kA + 0.25), () => aunty(0, 0, 1.05, t, shock));
  // file message she taps
  const ff = P(t, kA + 0.05, kA + 0.35);
  if (ff > 0) {
    const press = 1 - 0.08 * win(t, tap - 0.08, tap + 0.14, 0.06, 0.1);
    popAt(745, 520, ff, () => { ctx.scale(press, press); fileMsg(0, 0, 0.95); });
    ring(745, 520, t, tap, '#ffffff', 40, 180, 0.5);
    // install bar
    const ib = P(t, tap + 0.1, tap + 0.25);
    if (ib > 0) popAt(745, 660, ib, () => {
      card(-160, -34, 320, 68, 34, '#ffffff', 4, 5);
      const u = P(t, tap + 0.2, kL);
      rr(-140, -10, 280 * u, 20, 10); ctx.fillStyle = u >= 1 ? C.grn : C.yel; ctx.fill();
      rr(-140, -10, 280, 20, 10); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    });
    txt(t < kL ? 'Opening…' : 'Installed', 745, 718, `700 22px ${MONO}`, 'rgba(255,255,255,0.9)');
  }
  tapper(t, tap, 900, 760, 790, 535);
  // bank balance drains
  const bf = P(t, kL - 0.15, kL + 0.15);
  const u = eio(P(t, kL + 0.15, kL + 1.2));
  const amt = Math.round(262000 * (1 - u));
  popAt(540 + shake(t, kL + 1.2, 0.5, 10), 1050, bf, () => {
    card(-410, -120, 820, 240, 30, '#ffffff', 6, 12);
    txt('AUNTY KA BANK BALANCE', 0, -68, `700 28px ${MONO}`, '#3c4a6b');
    txt('₹' + amt.toLocaleString('en-IN'), 0, 28, SANSB(104), u > 0.02 ? '#c2413e' : INK);
  });
  for (let k = 0; k < 9; k++) {
    const st = kL + 0.2 + k * 0.11, v = P(t, st, st + 0.6); if (v <= 0 || v >= 1) continue;
    const side = k % 2 ? 1 : -1;
    const x = L(540, 540 + side * (430 + 60 * hash(k, 4)), eo(v)), y = L(1050, 1330 + 60 * hash(k, 7), eo(v)) - 120 * Math.sin(v * Math.PI);
    ctx.save(); ctx.globalAlpha *= 1 - P(v, 0.8, 1); note(x, y, 0.9, v * 4 * side + k); ctx.restore();
  }
  chipW(540, 1300, '-₹2.6 LAKH', C.red, t, kL + 1.25, 99, { size: 38, h: 82 });
}

// ---------- scene 3: wo card nahi, APP tha ----------
function sceneApp(t) {
  const kN = CK('Wo card'), kP = CK('APP tha');
  const pf = P(t, kN - 0.1, kN + 0.25);
  const flip = P(t, kP - 0.05, kP + 0.3);
  const sx = Math.abs(Math.cos(flip * Math.PI));
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  ctx.translate(540 + (flip < 0.5 ? shake(t, kN + 0.35, 0.5, 10) : 0), 820);
  ctx.scale(Math.max(0.02, sx) * L(0.85, 1, back(pf)), L(0.85, 1, back(pf)));
  if (flip < 0.5) weddingCard(t, 1.15); else appTile(t, 1.15);
  ctx.restore();
  stamp(540, 820, 'NAHI!', C.red, P(t, kN + 0.35, kN + 0.55) * (1 - P(t, kP - 0.15, kP)), -0.14, 84);
  stamp(700, 610, 'APP!', C.yel, P(t, kP + 0.3, kP + 0.5), 0.12, 80, INK);
  // filename strip: .apk highlighted
  const ff = P(t, kP + 0.15, kP + 0.45);
  popAt(540, 1255, ff, () => {
    card(-330, -48, 660, 96, 48, '#ffffff', 5, 8);
    ctx.font = `700 38px ${MONO}`; const w1 = ctx.measureText('Shaadi_Card').width, w2 = ctx.measureText('.apk').width;
    const x0 = -(w1 + w2 + 16) / 2;
    txt('Shaadi_Card', x0, 2, `700 38px ${MONO}`, INK, 'left');
    rr(x0 + w1 + 4, -26, w2 + 16, 52, 12); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    txt('.apk', x0 + w1 + 12, 2, `700 38px ${MONO}`, '#ffffff', 'left');
  });
  chipW(540, 380, 'PHOTO NAHI, APP', C.cyan, t, kN + 0.1, 99, { size: 30, h: 68 });
}

// ---------- scene 4: permission di... OTP padh liye ----------
function permScreen(t, tap) {
  chatScreen(t, 'Dost');
  ctx.fillStyle = 'rgba(13,10,38,0.5)'; ctx.fillRect(-200, -400, 400, 800);
  card(-172, -175, 344, 350, 26, '#ffffff', 5, 6);
  cardIcon(0, -115, 0.8);
  txt('"Shaadi Card" ko', 0, -40, `800 28px ${SANS}`, INK);
  txt('SMS padhne do?', 0, 0, `800 28px ${SANS}`, INK);
  const done = t >= tap, press = 1 - 0.1 * win(t, tap - 0.08, tap + 0.14, 0.06, 0.1);
  rr(-150, 60, 130, 64, 32); ctx.fillStyle = '#e4e6f2'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt('DENY', -85, 93, `700 24px ${MONO}`, '#6b6f8c');
  ctx.save(); ctx.translate(85, 92); ctx.scale(press, press);
  rr(-65, -32, 130, 64, 32); ctx.fillStyle = done ? C.grn : C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt('ALLOW', 0, 1, `800 24px ${MONO}`, INK);
  ctx.restore();
}
function smsScreen(t, kO) {
  ctx.fillStyle = '#f4f2ee'; ctx.fillRect(-200, -400, 400, 800);
  ctx.fillStyle = C.cyan; ctx.fillRect(-200, -400, 400, 132); ctx.fillStyle = INK; ctx.fillRect(-200, -270, 400, 4);
  txt('Messages', -165, -318, SANSB(36), INK, 'left');
  const rows = [['BANK', 'OTP 482913: kisi ko na batayein'], ['BANK', 'OTP 739104: txn ₹99,000'], ['Mummy', 'Khana kha liya?']];
  rows.forEach(([a, b], i) => {
    const y = -200 + i * 120, f = P(t, kO - 0.2 + i * 0.12, kO + 0.05 + i * 0.12);
    ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2);
    const hot = i < 2;
    card(-175, y - 48, 350, 96, 18, hot ? '#fff1c2' : '#ffffff', 4, 4);
    txt(a, -155, y - 18, `800 24px ${SANS}`, INK, 'left');
    txt(b.length > 22 ? b.slice(0, 21) + '…' : b, -155, y + 18, `600 19px ${MONO}`, '#3c4a6b', 'left');
    ctx.restore();
  });
}
function scenePerm(t) {
  const kP = CK('Permission'), kO = CK('OTP padh');
  const tap = kP + 0.45;
  const pf = P(t, kP - 0.1, kP + 0.25);
  const sw = t >= kO - 0.25;
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(sw ? L(540, 380, eio(P(t, kO - 0.25, kO + 0.1))) : 540, 830, L(0.7, 0.8, back(pf)), () => sw ? smsScreen(t, kO) : permScreen(t, tap));
  ctx.restore();
  tapper(t, tap, 880, 1250, 610, 905);
  chipW(540, 380, 'SMS PADHNE KI PERMISSION', C.yel, t, kP + 0.05, 99, { size: 28, h: 66 });
  // scammer grabs the OTPs
  const hf = P(t, kO - 0.05, kO + 0.25);
  if (hf > 0) popAt(850, 760, hf, () => hacker(0, 0, 0.95, t, P(t, kO + 0.75, kO + 0.95)));
  for (let k = 0; k < 2; k++) {
    const st = kO + 0.25 + k * 0.3, v = P(t, st, st + 0.55); if (v <= 0) continue;
    const x = L(400, 850, eio(v)), y = L(650 + k * 96, 690, eio(v)) - 90 * Math.sin(v * Math.PI);
    ctx.save(); ctx.globalAlpha *= 1 - P(v, 0.9, 1);
    chip(x, y, k ? '739104' : '482913', C.pink, 1, { size: 28, h: 58 });
    ctx.restore();
  }
  chipW(850, 1010, 'SCAMMER', C.red, t, kO + 0.15, 99, { size: 28, h: 62 });
  chipW(540, 1300, 'OTP CHORI!', C.red, t, kO + 0.85, 99, { size: 38, h: 82 });
}

// ---------- scene 5: ab aunty ke number se sabko card ----------
const CONTACTS = [[-150, 380], [-100, 400], [-40, 390], [40, 390], [100, 400], [150, 380], [205, 360], [-205, 360]];
function sceneSpread(t) {
  const kA = CK('Ab aunty'), kN = CK('number se'), kS = CK('sabko card');
  const pf = P(t, kA - 0.1, kA + 0.25);
  const CX = 540, CY = 820;
  // contacts around
  const names = ['Mama', 'Bua', 'Pinky', 'Office', 'Padosi', 'Chachi', 'Dost', 'Didi'];
  names.forEach((nm, i) => {
    const a = -Math.PI / 2 + (i + 0.5) * Math.PI * 2 / names.length, R = 370;
    const x = CX + Math.cos(a) * R * 1.0, y = CY + Math.sin(a) * R * 0.95;
    const st = kN + i * 0.13, v = P(t, st, st + 0.45);
    if (v > 0) {
      // file travelling out along the line
      ctx.save(); ctx.globalAlpha *= Math.min(1, v * 3);
      line([[CX + Math.cos(a) * 130, CY + Math.sin(a) * 150], [CX + Math.cos(a) * (130 + (R - 210) * eo(v)), CY + Math.sin(a) * (150 + (R - 230) * eo(v))]], 'rgba(255,255,255,0.75)', 5, [14, 12]);
      ctx.restore();
      if (v < 1) cardIcon(L(CX, x, eio(v)), L(CY, y, eio(v)), 0.7);
    }
    const cf = P(t, kA + 0.15 + i * 0.05, kA + 0.45 + i * 0.05);
    popAt(x + shake(t, st + 0.45, 0.4, 6), y, cf, () => {
      disc(0, 0, 66, POP[i % POP.length], 6);
      ctx.beginPath(); ctx.arc(0, -14, 20, 0, 7); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 26, 32, 18, 0, Math.PI, 0); ctx.fill();
      txt(nm, 0, 94, `800 28px ${SANS}`, '#ffffff');
      if (v >= 1) { cardIcon(46, -46, 0.55); }
    });
  });
  // aunty's phone in the centre
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(CX, CY, L(0.3, 0.36, back(pf)), () => {
    ctx.fillStyle = TOPBAR; ctx.fillRect(-200, -400, 400, 800);
    ctx.save(); ctx.beginPath(); ctx.arc(0, -40, 150, 0, 7); ctx.clip(); ctx.fillStyle = '#fbe3c0'; ctx.fillRect(-150, -190, 300, 300); aunty(0, 60, 0.9, t, 0); ctx.restore();
    ctx.beginPath(); ctx.arc(0, -40, 150, 0, 7); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
    txt('AUNTY', 0, 200, SANSB(64), '#ffffff');
  });
  ctx.restore();
  stamp(CX, CY + 175, 'HACKED', C.red, P(t, kA + 0.3, kA + 0.55), -0.1, 44);
  chipW(540, 1365, 'SABKO WAHI CARD!', C.yel, t, kS + 0.1, 99, { size: 34, h: 76 });
}

// ---------- scene 6: asli card PDF ya photo, APK kabhi nahi ----------
function fileTile(x, y, kind, f, ok, t) {
  popAt(x, y, f, () => {
    card(-125, -150, 250, 300, 28, '#ffffff', 6, 10);
    if (kind === 'JPG') {
      rr(-80, -105, 160, 120, 14); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.save(); rr(-80, -105, 160, 120, 14); ctx.clip();
      ctx.beginPath(); ctx.moveTo(-80, 15); ctx.lineTo(-25, -45); ctx.lineTo(15, 0); ctx.lineTo(40, -25); ctx.lineTo(80, 15); ctx.closePath(); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(45, -70, 16, 0, 7); ctx.fillStyle = C.yel; ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (kind === 'PDF') {
      card(-70, -110, 140, 135, 10, '#f3f0e8', 4, 0);
      for (let i = 0; i < 4; i++) { rr(-50, -88 + i * 26, i === 3 ? 60 : 100, 10, 5); ctx.fillStyle = '#c6bfae'; ctx.fill(); }
    } else {
      ctx.save(); ctx.translate(0, -45); appTile(t, 0.36); ctx.restore();
    }
    txt(kind, 0, 85, SANSB(56), ok ? INK : '#c2413e');
  });
}
function sceneReal(t) {
  const kA = CK('Asli card'), kP = CK('PDF ya'), kK = CK('APK?');
  chipW(540, 400, 'ASLI SHAADI CARD', C.grn, t, kA + 0.05, 99, { size: 34, h: 76 });
  fileTile(225, 820, 'JPG', P(t, kP + 0.45, kP + 0.75), true, t);
  fileTile(540, 820, 'PDF', P(t, kP + 0.0, kP + 0.3), true, t);
  if (t > kP + 0.35) tickMark(330, 690, 34, C.grn);
  if (t > kP + 0.8) tickMark(645, 690, 34, C.grn);
  const af = P(t, kK + 0.0, kK + 0.3);
  ctx.save(); ctx.translate(shake(t, kK + 0.5, 0.5, 10), 0); fileTile(855, 820, 'APK', af, false, t); ctx.restore();
  banSign(855, 820, 150, P(t, kK + 0.45, kK + 0.7));
  stamp(540, 1110, 'KABHI NAHI!', C.red, P(t, kK + 0.8, kK + 1.05), -0.08, 70);
  chipW(540, 1300, 'FRAUD? CALL 1930', C.yel, t, kK + 1.0, 99, { size: 30, h: 70 });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneInvite], [LS(1), LS(2), sceneOpen], [LS(2), LS(3), sceneApp],
          [LS(3), LS(4), scenePerm], [LS(4), LS(5), sceneSpread], [LS(5), LS(n) - 0.4, sceneReal],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('SHAADI card') + 0.25, 540, 840, [C.yel, C.pink, '#ffffff'], 22);
  burst(t, CK('2.6 LAKH') + 1.3, 540, 1060, [C.red, C.org, C.yel], 28, 1.4);
  burst(t, CK('APP tha') + 0.35, 700, 610, [C.yel, C.grn, '#ffffff'], 24, 1.2);
  burst(t, CK('OTP padh') + 0.8, 850, 700, [C.red, C.pink, C.yel], 22);
  burst(t, CK('sabko card') + 0.15, 540, 820, POP, 30, 1.5);
  burst(t, CK('APK?') + 0.5, 855, 820, [C.red, C.org, C.yel], 24);
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
