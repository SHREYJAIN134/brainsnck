window.BG = '#3a5f55';
// "Boli 25 crore, player ko sirf 18 kyun?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// IPL auction "maximum fee" rule reel scenes
// =====================================================================
window.TOPIC = 'IPL Auction';
function STEPS() { return [[0, '25 CR KI BOLI'], [LS(2), 'ASLI RAAZ'], [LS(4), 'NAYA RULE']]; }
const JERSEY = '#4f7fd1';
const VJERSEY = '#e8b04a';

// generic auction paddle (no team logos)
function paddle(x, y, s, label, col, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-14, 40, 28, 170, 10); ctx.fillStyle = '#b07a4a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  disc(0, 0, 82, col, 7);
  ctx.beginPath(); ctx.arc(0, 0, 62, 0, 7); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt(label, 0, 3, SANSB(44), INK);
  ctx.restore();
}
function gavel(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(rot);
  rr(-12, -10, 24, 230, 10); ctx.fillStyle = '#9a6a3e'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  hardShadow(-95, -60, 190, 80, 18, 6);
  rr(-95, -60, 190, 80, 18); ctx.fillStyle = '#7a4f2c'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  rr(-60, -60, 22, 80, 4); ctx.fillStyle = '#c8955e'; ctx.fill(); rr(38, -60, 22, 80, 4); ctx.fill();
  ctx.restore();
}
function crore(v) { return '₹' + v.toFixed(2) + ' CR'; }
function priceBoard(x, y, s, label, val, col = INK) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-380, -130, 760, 260, 34, '#ffffff', 6, 12);
  txt(label, 0, -70, `700 30px ${MONO}`, '#3c4a6b');
  txt(val, 0, 30, SANSB(118), col);
  ctx.restore();
}
// generic cricketer, original flat drawing (helmet + jersey, no logos)
function cricketer(x, y, s, t, jersey, opts = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  // shoulders / jersey
  ctx.beginPath(); ctx.moveTo(-150, 220); ctx.quadraticCurveTo(-150, 90, -60, 78); ctx.lineTo(60, 78); ctx.quadraticCurveTo(150, 90, 150, 220); ctx.closePath();
  ctx.fillStyle = jersey; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-40, 80); ctx.lineTo(0, 130); ctx.lineTo(40, 80); ctx.lineWidth = 6; ctx.stroke();
  txt(opts.num || '7', 70, 170, SANSB(54), '#ffffff');
  rr(-24, 36, 48, 50, 10); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  // face
  ctx.beginPath(); ctx.ellipse(0, -10, 66, 76, 0, 0, 7); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  if (opts.cap) {
    // cap + shades (the travelling star)
    ctx.beginPath(); ctx.moveTo(-72, -36); ctx.quadraticCurveTo(-70, -110, 0, -112); ctx.quadraticCurveTo(70, -110, 72, -36); ctx.closePath();
    ctx.fillStyle = jersey; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, -40); ctx.quadraticCurveTo(110, -46, 120, -26); ctx.lineTo(30, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
    rr(-56, -24, 50, 30, 10); ctx.fillStyle = INK; ctx.fill(); rr(6, -24, 50, 30, 10); ctx.fill();
    line([[-6, -12], [6, -12]], INK, 5);
    ctx.beginPath(); ctx.arc(0, 26, 20, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  } else {
    // eyes + mouth
    const sad = opts.sad || 0;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 26, -16, 7 + 2 * sad, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
    if (sad > 0.5) { line([[-46, -46], [-14, -38]], INK, 5); line([[46, -46], [14, -38]], INK, 5); ctx.beginPath(); ctx.arc(0, 40, 18, 1.15 * Math.PI, 1.85 * Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, 18, 20, 0.12 * Math.PI, 0.88 * Math.PI); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
    // helmet shell + visor + grille
    ctx.beginPath(); ctx.moveTo(-80, -20); ctx.quadraticCurveTo(-82, -118, 0, -120); ctx.quadraticCurveTo(82, -118, 80, -20); ctx.lineTo(62, -40); ctx.lineTo(-62, -40); ctx.closePath();
    ctx.fillStyle = jersey; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    rr(-84, -50, 168, 18, 9); ctx.fillStyle = INK; ctx.fill();
    for (const gx of [-40, -14, 14, 40]) line([[gx, -32], [gx * 1.1, 50]], 'rgba(13,10,38,0.75)', 4);
    line([[-58, 10], [58, 10]], 'rgba(13,10,38,0.75)', 4);
  }
  ctx.restore();
}
function moneyBag(x, y, s, label, col = C.grn) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-40, -95); ctx.lineTo(40, -95); ctx.lineTo(22, -60); ctx.lineTo(-22, -60); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(8, 34, 112, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 26, 112, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  rr(-34, -72, 68, 18, 9); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  txt(label, 0, 34, SANSB(label.length > 3 ? 58 : 76), INK);
  ctx.restore();
}
function vault(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-150, -150, 300, 300, 30, '#8a93b8', 6, 12);
  rr(-122, -122, 244, 244, 20); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  disc(0, 0, 70, '#c9cde6', 0);
  ctx.save(); ctx.rotate(t * 1.2);
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); line([[0, 0], [0, -58]], INK, 9); }
  ctx.restore();
  disc(0, 0, 18, C.yel, 0);
  ctx.restore();
}
// hall card: big MEGA / small MINI auction room with seats
function hall(x, y, s, title, seats, col, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-330, -230, 660, 460, 34, C.box, 6, 12);
  rr(-330, -230, 660, 96, [34, 34, 0, 0]); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  txt(title, 0, -180, SANSB(48), INK);
  const cols = Math.ceil(Math.sqrt(seats * 2.2)), rows = Math.ceil(seats / cols);
  let k = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (k >= seats) break;
    const px = (c - (cols - 1) / 2) * Math.min(80, 560 / cols), py = -40 + r * Math.min(84, 250 / Math.max(1, rows - 1 || 1)) + (rows === 1 ? 50 : 0);
    const bob = Math.sin(t * 5 + k) * 3;
    ctx.beginPath(); ctx.arc(px, py + bob, 20, 0, 7); ctx.fillStyle = POP[k % POP.length]; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(px, py + 38 + bob, 28, 16, 0, Math.PI, 0); ctx.fillStyle = POP[(k + 2) % POP.length]; ctx.fill(); ctx.stroke();
    k++;
  }
  ctx.restore();
}
function suitcase(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-30, -92, 60, 30, 12); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
  card(-80, -70, 160, 130, 18, C.cyan, 6, 6);
  // little plane sticker
  ctx.save(); ctx.translate(0, -5); ctx.rotate(-0.5);
  ctx.beginPath(); ctx.ellipse(0, 0, 40, 9, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-22, -26); ctx.lineTo(-10, -26); ctx.lineTo(14, 0); ctx.lineTo(-10, 26); ctx.lineTo(-22, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// ---------- scene 1: boli lagi 25 CRORE ----------
function sceneBid(t) {
  const kC = CK('25 CRORE');
  const sold = kC + 0.85;
  chipW(540, 380, 'IPL AUCTION', C.cyan, t, 0.05, 99, { size: 34, h: 76 });
  const u = eio(P(t, 0.15, kC + 0.55));
  const v = 2 + (25.2 - 2) * u;
  popAt(540 + shake(t, sold, 0.45, 10), 640, P(t, 0.0, 0.3), () => priceBoard(0, 0, 1, 'CURRENT BID', crore(v), t > sold ? '#2f7a47' : INK));
  // two paddles raising in turn (bidding war)
  for (const [px, lab, col, ph] of [[230, '1', C.yel, 0], [850, '2', C.pink, 1]]) {
    const beat = Math.floor(Math.max(0, t - 0.2) / 0.32);
    const up = t < kC + 0.6 ? (beat % 2 === ph ? 1 : 0) : (ph === 1 ? 1 : 0);
    const lift = L(0, -70, up * eo(clamp(((t - 0.2) % 0.32) / 0.12)));
    popAt(px, 1110 + (t < kC + 0.6 ? lift : (ph === 1 ? -70 : 0)), P(t, 0.15 + ph * 0.1, 0.45 + ph * 0.1), () => paddle(0, 0, 1, lab, col, ph ? 0.12 : -0.12));
  }
  // gavel slams down on SOLD
  const gf = P(t, kC + 0.2, kC + 0.45);
  if (gf > 0) {
    const sw = t < sold ? L(-0.9, -0.35, eo(P(t, kC + 0.45, sold - 0.12))) : L(0.15, -0.05, eo(P(t, sold, sold + 0.3)));
    const hit = t >= sold - 0.12 && t < sold ? L(-0.35, 0.15, P(t, sold - 0.12, sold)) : sw;
    popAt(560, 1000, gf, () => gavel(0, 0, 1, hit));
    ring(560, 1010, t, sold, '#ffffff', 40, 220, 0.5);
  }
  stamp(540, 1290, 'SOLD!', C.grn, P(t, sold, sold + 0.2), -0.1, 70, INK);
}

// ---------- scene 2: par player ko sirf 18 ----------
function scenePay(t) {
  const kP = CK('par player'), kS = CK('sirf 18');
  chipW(540, 380, 'PLAYER KI FEES', C.yel, t, kP + 0.05, 99, { size: 32, h: 72 });
  popAt(290, 860, P(t, kP - 0.1, kP + 0.25), () => cricketer(0, 0, 1.15, t, JERSEY, { sad: P(t, kS + 0.15, kS + 0.3) }));
  // contract card: 25.20 struck, 18 written
  popAt(770, 760, P(t, kP + 0.1, kP + 0.4), () => {
    card(-210, -190, 420, 380, 28, '#ffffff', 6, 12);
    txt('CONTRACT', 0, -140, `700 30px ${MONO}`, '#3c4a6b');
    txt('₹25.20 CR', 0, -50, SANSB(70), INK);
    const sf = P(t, kS - 0.05, kS + 0.2);
    if (sf > 0) line([[-170, -50], [L(-170, 170, eo(sf)), -50]], C.red, 14);
    const nf = P(t, kS + 0.1, kS + 0.35);
    if (nf > 0) { ctx.save(); ctx.globalAlpha *= nf; txt('₹18 CR', 0, 80, SANSB(L(110, 90, eo(nf))), '#2f7a47'); ctx.restore(); }
  });
  popAt(290 + 0, 1230, P(t, kS + 0.2, kS + 0.45), () => moneyBag(0, 0, 0.8, '18'));
  stamp(770, 1230, 'SIRF 18!', C.red, P(t, kS + 0.35, kS + 0.55), -0.1, 58);
}

// ---------- scene 3: videshi star mega auction skip karte the ----------
function sceneSkip(t) {
  const kV = CK('Videshi star'), kM = CK('mega auction'), kS = CK('skip karte');
  popAt(540, 700, P(t, kV - 0.1, kV + 0.25), () => hall(0, 0, 1, 'MEGA AUCTION', 18, C.grn, t));
  // the travelling star walks past
  const wf = P(t, kV - 0.1, kV + 0.25);
  const wx = L(880, 300, eio(P(t, kS - 0.1, kS + 0.9)));
  const bob = Math.abs(Math.sin(t * 9)) * -10 * (t > kS - 0.1 && t < kS + 0.9 ? 1 : 0);
  popAt(wx, 1150 + bob, wf, () => { cricketer(0, 0, 0.7, t, VJERSEY, { cap: true, num: '9' }); suitcase(130, 120, 0.7); });
  chipW(wx, 1395, 'VIDESHI STAR', C.cyan, t, kV + 0.1, 99, { size: 28, h: 62 });
  // dotted path around the hall
  const pf = P(t, kS - 0.05, kS + 0.9);
  if (pf > 0) line(polyPart([[900, 1000], [960, 700], [880, 420], [540, 380], [200, 420], [120, 700], [180, 1000]], pf), 'rgba(255,255,255,0.85)', 6, [16, 14]);
  stamp(540, 720, 'SKIP!', C.red, P(t, kS + 0.15, kS + 0.35), -0.12, 90);
}

// ---------- scene 4: mini auction me jackpot, Starc ko 24.75 crore ----------
function slot(x, y, s, t, stop) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-300, -180, 600, 360, 40, C.purple, 6, 12);
  rr(-300, -180, 600, 80, [40, 40, 0, 0]); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  const won = t >= stop;
  txt(won ? 'JACKPOT!' : 'SPIN...', 0, -138, SANSB(46), INK);
  for (let i = 0; i < 3; i++) {
    const cx = -180 + i * 180;
    rr(cx - 72, -76, 144, 200, 20); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); rr(cx - 72, -76, 144, 200, 20); ctx.clip();
    const ts = stop - 0.18 + i * 0.12;
    if (t < ts) {
      const off = (t * 1400 + i * 90) % 120;
      for (let k = -1; k < 3; k++) txt(['7', '₹', '★'][(k + i + Math.floor(t * 12)) % 3], cx, -60 + k * 120 + off, SANSB(80), '#7a7f9e');
    } else txt('₹', cx, 26 + 8 * Math.sin(P(t, ts, ts + 0.2) * Math.PI), SANSB(100), '#2f7a47');
    ctx.restore();
  }
  // lever
  const pull = win(t, stop - 0.9, stop - 0.5, 0.1, 0.2);
  line([[330, -40], [330 + 20, L(-160, 40, pull)]], INK, 14);
  disc(350, L(-170, 30, pull), 30, C.red, 4);
  ctx.restore();
}
function sceneJackpot(t) {
  const kM = CK('mini auction'), kJ = CK('me jackpot'), kS = CK('Starc ko'), kN = CK('24.75');
  const kEnd = LE(3);
  // small mini auction room first
  const mf = P(t, kM - 0.15, kM + 0.2) * (1 - P(t, kJ + 0.1, kJ + 0.35));
  if (mf > 0) popAt(540, 760, mf, () => hall(0, 0, 0.95, 'MINI AUCTION', 3, C.yel, t));
  chipW(540, 380, 'KAM PLAYERS, ZYADA BOLI', C.cyan, t, kM + 0.1, 99, { size: 28, h: 66 });
  const sf = P(t, kJ + 0.05, kJ + 0.35) * (1 - P(t, kN - 0.2, kN + 0.1));
  if (sf > 0) popAt(540 + shake(t, kJ + 0.75, 0.4, 8), 780, sf, () => slot(0, 0, 1, t, kJ + 0.7));
  // record price
  popAt(540, 700, P(t, kN - 0.1, kN + 0.25), () => {
    cricketer(0, -110, 0.8, t, VJERSEY, { cap: true, num: '9' });
  });
  const pf = P(t, kN - 0.05, kN + 0.3);
  const u = eio(P(t, kN, kN + 0.8));
  popAt(540, 1040, pf, () => priceBoard(0, 0, 0.92, '2024 · MINI AUCTION', crore(2 + 22.75 * u), u >= 1 ? '#2f7a47' : INK));
  chipW(540, 1280, 'STARC', C.yel, t, kS + 0.05, 99, { size: 36, h: 78 });
  chipW(540, 1380, 'CUMMINS: ₹20.50 CR', C.pink, t, kN + 1.0, kEnd + 0.4, { size: 26, h: 58 });
}

// ---------- scene 5: isliye rule, videshi ko MAX 18 crore ----------
function sceneRule(t) {
  const kR = CK('Isliye rule'), kV = CK('videshi ko'), kX = CK('MAX 18');
  popAt(540, 470, P(t, kR - 0.1, kR + 0.25), () => {
    card(-380, -110, 760, 220, 30, '#ffffff', 6, 12);
    rr(-380, -110, 760, 70, [30, 30, 0, 0]); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    txt('IPL RULE · MINI AUCTION', 0, -74, `700 32px ${MONO}`, INK);
    txt('Videshi player ki fees', 0, 4, SANSB(46), INK);
    txt('max = sabse badi retention', 0, 62, `700 28px ${MONO}`, '#3c4a6b');
  });
  // bar: bid climbs to 25.2, ceiling at 18
  const BASE = 1340, PX = 26;          // px per crore
  const bf = P(t, kR + 0.3, kR + 0.6);
  if (bf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 3);
    const v = 25.2 * eio(P(t, kR + 0.4, kX + 0.2));
    const top = BASE - v * PX, cap = BASE - 18 * PX;
    const over = t > kX + 0.1;
    hardShadow(400, top, 280, BASE - top, 18, 10);
    rr(400, Math.max(top, cap), 280, BASE - Math.max(top, cap), [0, 0, 18, 18]); ctx.fillStyle = C.grn; ctx.fill();
    if (top < cap) { rr(400, top, 280, cap - top, [18, 18, 0, 0]); ctx.fillStyle = over ? C.red : C.grn; ctx.fill(); }
    rr(400, top, 280, BASE - top, 18); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    if (v >= 18) txt('₹18 CR', 540, (cap + BASE) / 2, SANSB(56), INK);
    if (over && top < cap) txt('+7.2', 540, (top + cap) / 2 + 4, SANSB(44), '#ffffff');
    txt('BOLI ' + v.toFixed(1), 540, top - 40, `700 34px ${MONO}`, '#ffffff');
    ctx.restore();
    // ceiling line
    const cf = P(t, kX - 0.05, kX + 0.25);
    if (cf > 0) {
      ctx.save(); ctx.globalAlpha *= cf;
      line([[L(540, 150, eo(cf)), cap], [L(540, 930, eo(cf)), cap]], '#ffffff', 10, [26, 16]);
      ctx.restore();
      chip(220, cap - 56, 'MAX 18', C.yel, P(t, kX + 0.05, kX + 0.3), { size: 32, h: 70 });
    }
  }
  stamp(840, 820, 'CAP!', C.red, P(t, kX + 0.35, kX + 0.55), 0.12, 60);
}

// ---------- scene 6: baaki 7, BCCI ke paas, welfare me ----------
function sceneSplit(t) {
  const kB = CK('Baaki 7'), kC = CK('BCCI ke'), kW = CK('welfare me');
  // team purse at the top
  popAt(540, 470, P(t, kB - 0.15, kB + 0.2), () => {
    card(-300, -95, 600, 190, 30, '#ffffff', 6, 10);
    txt('TEAM KA PURSE', 0, -45, `700 30px ${MONO}`, '#3c4a6b');
    txt('−₹25.20 CR', 0, 30, SANSB(72), '#c2413e');
  });
  // player side (already has 18)
  popAt(270, 1020, P(t, kB, kB + 0.3), () => { moneyBag(0, 0, 0.9, '18'); });
  chipW(270, 1250, 'PLAYER', C.cyan, t, kB + 0.1, 99, { size: 30, h: 66 });
  // BCCI vault gets 7.2
  const vf = P(t, kC - 0.1, kC + 0.25);
  popAt(800, 1010 + shake(t, kC + 0.75, 0.4, 8), vf, () => vault(0, 0, 0.9, t));
  chipW(800, 1250, 'BCCI', C.yel, t, kC + 0.05, 99, { size: 34, h: 70 });
  chipW(800, 760, '₹7.2 CR', C.grn, t, kB + 0.15, 99, { size: 34, h: 72 });
  for (let k = 0; k < 7; k++) {
    const st = kC + 0.05 + k * 0.08, v = P(t, st, st + 0.55); if (v <= 0 || v >= 1) continue;
    const x = L(560, 800, eio(v)), y = L(580, 990, eio(v)) - 110 * Math.sin(v * Math.PI);
    ctx.save(); ctx.globalAlpha *= 1 - P(v, 0.85, 1); note(x, y, 0.9, v * 5 + k); ctx.restore();
  }
  // welfare badge
  popAt(760, 1372, P(t, kW + 0.05, kW + 0.3), () => {
    card(-220, -40, 440, 80, 40, C.pink, 5, 7);
    heart(-160, 6, 1.1, '#ffffff');
    txt('PLAYER WELFARE', 22, 3, `700 28px ${MONO}`, INK);
  });
  ring(800, 1010, t, kC + 0.7, '#ffffff', 60, 240, 0.55);
}
function heart(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-26, -6, -18, -30, 0, -16); ctx.bezierCurveTo(18, -30, 26, -6, 0, 12); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3 / s; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneBid], [LS(1), LS(2), scenePay], [LS(2), LS(3), sceneSkip],
          [LS(3), LS(4), sceneJackpot], [LS(4), LS(5), sceneRule], [LS(5), LS(n) - 0.4, sceneSplit],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('25 CRORE') + 0.85, 560, 1010, [C.yel, C.grn, '#ffffff'], 26, 1.3);
  burst(t, CK('sirf 18') + 0.4, 770, 1230, [C.red, C.org, C.yel], 22);
  burst(t, CK('skip karte') + 0.2, 540, 720, [C.red, C.pink, C.yel], 24, 1.2);
  burst(t, CK('me jackpot') + 0.7, 540, 780, POP, 32, 1.6);
  burst(t, CK('24.75') + 0.85, 540, 1040, [C.grn, C.yel, '#ffffff'], 24, 1.3);
  burst(t, CK('MAX 18') + 0.4, 840, 820, [C.red, C.org, C.yel], 22);
  burst(t, CK('BCCI ke') + 0.7, 800, 1010, [C.yel, C.grn, '#ffffff'], 24, 1.2);
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
