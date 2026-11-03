window.BG = '#33407a';
// "'I'm not a robot' tick se kaise pata chalta hai tum robot nahi?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// CAPTCHA reel scenes
// =====================================================================
window.TOPIC = 'CAPTCHA';
function STEPS() { return [[0, 'THE TICK'], [LS(2), 'ASLI TEST'], [LS(6) - 0.4, 'SHARE KARO']]; }
const SANSB = s => `800 ${s}px ${SANS}`;

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
function crossMark(x, y, r, col) {
  disc(x, y, r, col, Math.max(3, r * 0.12));
  const k = r * 0.38; line([[x - k, y - k], [x + k, y + k]], INK, Math.max(4, r * 0.2)); line([[x + k, y - k], [x - k, y + k]], INK, Math.max(4, r * 0.2));
}
function badge(x, y, n, col, f) {
  popAt(x, y, f, () => { disc(0, 0, 24, col, 4); txt(String(n), 0, 2, SANSB(28), INK); });
}
function shake(t, t0, d = 0.45, a = 8) { return t > t0 && t < t0 + d ? Math.sin(t * 80) * a * (1 - P(t, t0, t0 + d)) : 0; }

// mouse pointer (tip at x, y)
function cursorIcon(x, y, s = 1.4, press = 0) {
  const pts = [[0, 0], [0, 50], [12, 39], [21, 58], [30, 54], [21, 35], [37, 35]];
  ctx.save(); ctx.translate(x, y); const k = s * (1 - 0.18 * press); ctx.scale(k, k); ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] + 4, p[1] + 4) : ctx.moveTo(p[0] + 4, p[1] + 4)); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function ripple(x, y, t, t0, col = '#ffffff') {
  const r = P(t, t0, t0 + 0.5); if (r <= 0 || r >= 1) return;
  ctx.beginPath(); ctx.arc(x, y, 20 + 80 * eo(r), 0, 7); ctx.lineWidth = 9 * (1 - r); ctx.strokeStyle = col; ctx.stroke();
}
// the "I'm not a robot" checkbox (original drawing, generic shield, no logo)
function widget(x, y, s, st = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-320, -90, 640, 180, 24, '#ffffff', 5, 9);
  const bx = -250;
  rr(bx - 42, -42, 84, 84, 14); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = st.hover ? C.cyan : INK; ctx.stroke();
  if (st.spin > 0 && !(st.tick > 0)) {
    ctx.save(); ctx.translate(bx, 0); ctx.rotate(st.spin * 10);
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, 4.4); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.strokeStyle = C.cyan; ctx.stroke(); ctx.restore();
  }
  if (st.tick > 0) {
    const pts = polyPart([[bx - 30, 2], [bx - 8, 26], [bx + 34, -30]], eo(st.tick));
    line(pts, INK, 20); line(pts, C.grn, 11);
  }
  txt("I'm not a robot", -180, 2, `600 42px ${SANS}`, INK, 'left');
  ctx.save(); ctx.translate(258, -12);
  ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(30, -25); ctx.quadraticCurveTo(30, 16, 0, 36); ctx.quadraticCurveTo(-30, 16, -30, -25); ctx.closePath();
  ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  line([[-11, 0], [-3, 9], [13, -9]], INK, 6);
  ctx.restore();
  txt('CHECK', 258, 48, `700 17px ${MONO}`, '#7d83a8');
  ctx.restore();
}
function miniBox(x, y, tick, cross) {
  hardShadow(x - 40, y - 40, 80, 80, 14, 5);
  rr(x - 40, y - 40, 80, 80, 14); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  if (tick > 0) { const pts = polyPart([[x - 26, y + 2], [x - 6, y + 22], [x + 28, y - 24]], eo(tick)); line(pts, INK, 18); line(pts, C.grn, 10); }
  if (cross > 0) popAt(x, y, cross, () => crossMark(0, 0, 34, C.red));
}
function trail(fn, f, col, w = 9) {
  if (f <= 0) return null;
  const pts = []; const n = 140;
  for (let i = 0; i <= n * f; i++) pts.push(fn(i / n));
  pts.push(fn(f));
  line(pts, INK, w + 8); line(pts, col, w);
  return pts[pts.length - 1];
}
function robotHead(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[0, -60], [0, -86]], INK, 6); disc(0, -92, 11, C.red, 2);
  card(-62, -62, 124, 108, 24, C.purple, 5, 6);
  disc(-28, -14, 16, '#ffffff', 0); disc(28, -14, 16, '#ffffff', 0);
  ctx.beginPath(); ctx.arc(-28, -14, 6, 0, 7); ctx.arc(28, -14, 6, 0, 7); ctx.fillStyle = INK; ctx.fill();
  rr(-30, 18, 60, 14, 5); ctx.fillStyle = INK; ctx.fill();
  for (const k of [-15, 0, 15]) { ctx.fillStyle = C.purple; ctx.fillRect(k - 2, 18, 4, 14); }
  ctx.restore();
}

// ---------- scene 1: the hook (tick) + "kaise?" ----------
const BOX1 = [540 - 250, 960];
function webPage() {
  card(60, 350, 960, 1050, 36, C.box, 6, 12);
  ctx.save(); rr(60, 350, 960, 1050, 36); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(60, 350, 960, 92); ctx.restore();
  line([[63, 442], [1017, 442]], INK, 5);
  [C.pink, C.yel, C.grn].forEach((c, i) => disc(112 + i * 40, 396, 12, c, 2));
  rr(250, 373, 730, 46, 23); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
  rr(272, 394, 20, 15, 3); ctx.fillStyle = C.grn; ctx.fill();
  ctx.beginPath(); ctx.arc(282, 394, 7, Math.PI, 0); ctx.lineWidth = 3; ctx.strokeStyle = C.grn; ctx.stroke();
  txt('login page', 308, 397, `500 24px ${MONO}`, C.mute, 'left');
  txt('Login', 130, 530, SANSB(60), '#ffffff', 'left');
  [[600, 'username'], [720, 'password  ******']].forEach(([y, s]) => {
    rr(130, y, 820, 90, 18); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke();
    txt(s, 165, y + 47, `500 30px ${MONO}`, C.dim, 'left');
  });
}
function sceneHook(t) {
  const tC = 1.45, kA = CK('asli test'), tN = kA + 0.9;
  webPage();
  widget(540, 960, 1, { spin: P(t, tC + 0.05, tC + 0.45), tick: P(t, tC + 0.45, tC + 0.75), hover: t > tC - 0.35 && t < tC + 0.05 });
  card(330, 1150, 420, 100, 50, C.yel, 5, 8); txt('LOGIN', 540, 1203, SANSB(42), INK);
  // the cursor glides in and clicks
  const u = eio(P(t, 0.2, tC));
  const cx = L(900, BOX1[0] + 4, u) + Math.sin(u * Math.PI) * 70, cy = L(1330, BOX1[1] + 4, u) - Math.sin(u * Math.PI * 2) * 45;
  ripple(BOX1[0], BOX1[1], t, tC, C.cyan);
  const away = eo(P(t, tC + 0.8, tC + 1.3));
  cursorIcon(cx + 150 * away, cy + 170 * away, 1.4, win(t, tC - 0.05, tC + 0.15, 0.05, 0.1));
  // "asli test = tick?" ... NAHI!
  chip(540, 1325, 'ASLI TEST = TICK?', C.yel, P(t, kA, kA + 0.3) * (1 - P(t, tN - 0.1, tN + 0.1)), { size: 32, h: 70 });
  chip(540 + shake(t, tN + 0.1), 1325, 'TICK TEST HAI HI NAHI', C.red, P(t, tN + 0.05, tN + 0.35), { size: 30, h: 70 });
  const sf = P(t, tN, tN + 0.22);
  if (sf > 0) {
    ctx.save(); ctx.translate(730 + shake(t, tN, 0.4, 10), 960); ctx.rotate(-0.13); const s = L(2.2, 1, eo(sf)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, sf * 2);
    card(-180, -78, 360, 156, 26, C.red, 6, 10);
    ctx.lineJoin = 'round'; ctx.font = SANSB(96); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = INK; ctx.fillText('NAHI!', 0, 8);
    ctx.restore();
  }
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

// ---------- scene 2: the mouse path before the click ----------
const WG2 = [560, 485, 0.85], BOX2 = [560 - 250 * 0.85, 485];
function path2(u) {
  const P0 = [170, 1240], P1 = [930, 1090], P2 = [820, 610], P3 = [BOX2[0] + 4, BOX2[1] + 4];
  const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
  const j = Math.sin(u * Math.PI);
  return [a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0] + j * (10 * Math.sin(u * 47) + 6 * Math.sin(u * 91)),
          a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1] + j * (9 * Math.cos(u * 53) + 5 * Math.sin(u * 77))];
}
function sceneTrail(t) {
  const t2 = LS(2), kM = CK('mouse ki'), tE = kM + 0.75;
  card(60, 340, 960, 1045, 36, C.box, 6, 12);
  ctx.save(); rr(60, 340, 960, 1045, 36); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let x = 90; x < 1020; x += 60) for (let y = 370; y < 1385; y += 60) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
  ctx.restore();
  const U = eio(P(t, t2 + 0.1, tE));
  widget(WG2[0], WG2[1], WG2[2], { hover: U > 0.93 && t < tE + 0.1, spin: P(t, tE + 0.05, tE + 0.35), tick: P(t, tE + 0.35, tE + 0.65) });
  disc(170, 1240, 14, C.yel, 3);
  const head = trail(path2, U, C.cyan, 10);
  // numbered checkpoints along the way
  [0.25, 0.5, 0.75].forEach((q, i) => {
    if (U < q) return; const p = path2(q);
    badge(p[0] + 52, p[1] - 8, i + 1, C.yel, P(t, t2 + 0.1 + (tE - t2 - 0.1) * q, t2 + 0.1 + (tE - t2 - 0.1) * q + 0.25));
  });
  ripple(BOX2[0], BOX2[1], t, tE, C.cyan);
  if (head) cursorIcon(head[0], head[1], 1.3, win(t, tE - 0.05, tE + 0.15, 0.05, 0.1));
  // the eye that watches the path
  const ef = P(t, kM, kM + 0.3);
  if (ef > 0 && head) popAt(860, 1185, ef, () => {
    card(-130, -95, 260, 190, 40, C.yel, 5, 8);
    eye(0, 0, 0.82, [clamp((head[0] - 860) / 9, -40, 40), clamp((head[1] - 1185) / 9, -30, 30)], INK);
  });
  chip(400, 1325, 'CLICK SE PEHLE', C.yel, P(t, t2 + 0.1, t2 + 0.4) * (1 - P(t, kM - 0.1, kM + 0.05)), { size: 34, h: 74 });
  chip(400, 1325, 'MOUSE KI CHAAL', C.cyan, P(t, kM + 0.05, kM + 0.35), { size: 34, h: 74 });
}

// ---------- scene 3: insaan (wavy) vs bot (straight) ----------
const HB = [890, 480], BB = [890, 1030];
function humanPath(u) {
  const P0 = [175, 730], P1 = [380, 390], P2 = [620, 860], P3 = [HB[0] + 4, HB[1] + 4];
  const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, d = u ** 3;
  const j = Math.sin(u * Math.PI);
  return [a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0] + j * 12 * Math.sin(u * 61),
          a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1] + j * 14 * Math.cos(u * 43)];
}
const botPath = u => [L(250, BB[0] + 4, u), L(1250, BB[1] + 4, u)];
function sceneCompare(t) {
  const t3 = LS(3), kB = CK('bot ka');
  const hE = t3 + 1.35, bS = kB + 0.1, bE = kB + 0.42;
  card(60, 335, 960, 500, 36, C.box, 6, 10);
  card(60, 880, 960, 500, 36, C.box, 6, 10);
  // insaan
  chip(205, 400, 'INSAAN', C.grn, P(t, t3 - 0.05, t3 + 0.25), { size: 30, h: 64 });
  miniBox(HB[0], HB[1], P(t, hE + 0.05, hE + 0.35), 0);
  disc(175, 730, 13, C.yel, 3);
  const hu = eio(P(t, t3 + 0.15, hE));
  const hh = trail(humanPath, hu, C.grn, 10);
  if (hh) cursorIcon(hh[0], hh[1], 1.25, win(t, hE - 0.05, hE + 0.15, 0.05, 0.1));
  ripple(HB[0], HB[1], t, hE, C.grn);
  chip(560, 785, 'TEDHA-MEDHA = OK', C.grn, P(t, hE + 0.2, hE + 0.5), { size: 28, h: 60 });
  // bot
  const rf = P(t, kB - 0.45, kB - 0.1);
  chip(175, 945, 'BOT', C.red, rf, { size: 30, h: 64 });
  popAt(200, 1240, rf, () => robotHead(0, 0, 0.9));
  miniBox(BB[0], BB[1], 0, P(t, bE + 0.15, bE + 0.45));
  if (rf > 0) {   // ruler guide
    ctx.save(); ctx.globalAlpha *= rf * 0.5; ctx.setLineDash([10, 14]);
    line([botPath(0), botPath(1)], '#ffffff', 3); ctx.restore();
  }
  const bu = P(t, bS, bE);
  const bh = trail(botPath, bu, C.red, 10);
  if (bh && t < bE + 0.15) cursorIcon(bh[0], bh[1], 1.25, 0);
  chip(560 + shake(t, bE + 0.2), 1330, 'EKDUM SEEDHA = SHAQ!', C.red, P(t, bE + 0.2, bE + 0.5), { size: 28, h: 62 });
}

// ---------- scene 4: mouse + IP + cookies -> score, then "shaq hua?" ----------
function sector(r0, r1, a0, a1, col) {
  ctx.beginPath(); ctx.arc(0, 0, r1, a0, a1); ctx.arc(0, 0, r0, a1, a0, true); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
}
const GA = [540, 1150];
function gauge(v, glow) {
  ctx.save(); ctx.translate(GA[0], GA[1]);
  ctx.beginPath(); ctx.arc(10, 10, 270, Math.PI, 0); ctx.arc(10, 10, 165, 0, Math.PI, true); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  sector(165, 270, Math.PI, Math.PI * 4 / 3, C.red);
  sector(165, 270, Math.PI * 4 / 3, Math.PI * 5 / 3, C.org);
  sector(165, 270, Math.PI * 5 / 3, Math.PI * 2, C.grn);
  txt('BOT', -218, 38, `700 26px ${MONO}`, '#ffffff'); txt('INSAAN', 218, 38, `700 26px ${MONO}`, '#ffffff');
  const a = Math.PI + clamp(v) * Math.PI, e = [Math.cos(a) * 235, Math.sin(a) * 235];
  line([[0, 0], e], INK, 20); line([[0, 0], e], '#ffffff', 10);
  disc(0, 0, 32, C.yel, 4);
  ctx.restore();
}
function sigCard(x, y, f, label, col, icon) {
  popAt(x, y, f, () => {
    card(-135, -112, 270, 224, 30, C.box, 5, 8);
    disc(0, -22, 58, col, 5); icon();
    txt(label, 0, 78, `700 30px ${MONO}`, '#ffffff');
  });
}
function sceneSignals(t) {
  const t4 = LS(4), kS = CK('Shaq hua');
  const tm = t4 + 0.05, ti = t4 + 0.6, tc = t4 + 1.15;
  const cards = [[210, tm, 'MOUSE', C.cyan, () => { line([[-34, 6], [-18, -18], [-2, 0], [14, -26]], INK, 6); cursorIcon(14, -24, 0.75); }],
    [540, ti, 'IP', C.yel, () => { ctx.save(); ctx.translate(0, -22); ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.moveTo(14, 0); ctx.ellipse(0, 0, 14, 34, 0, 0, 7); ctx.moveTo(-34, 0); ctx.lineTo(34, 0); ctx.moveTo(-28, -17); ctx.lineTo(28, -17); ctx.moveTo(-28, 17); ctx.lineTo(28, 17); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }],
    [870, tc, 'COOKIES', C.org, () => { [[-20, -38], [14, -44], [-6, -14], [22, -10], [-24, 0]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(a, b, 7, 0, 7); ctx.fillStyle = INK; ctx.fill(); }); }]];
  // data flowing into the meter
  cards.forEach(([x, t0]) => {
    const f = P(t, t0 + 0.15, t0 + 0.4); if (f <= 0) return;
    const a = [x, 600], b = [GA[0] + (x - 540) * 0.2, GA[1] - 300];
    ctx.save(); ctx.globalAlpha *= f; ctx.setLineDash([12, 12]); line([a, b], 'rgba(255,255,255,0.55)', 5); ctx.restore();
    for (let k = 0; k < 3; k++) {
      const u = ((t - t0) * 1.4 + k / 3) % 1; if (t < t0 + 0.2) continue;
      disc(L(a[0], b[0], u), L(a[1], b[1], u), 10, cards.find(c => c[0] === x)[3], 2);
    }
  });
  cards.forEach(([x, t0, lab, col, icon]) => sigCard(x, 485, P(t, t0, t0 + 0.3), lab, col, icon));
  // meter
  const gf = P(t, t4, t4 + 0.35);
  if (gf > 0) {
    const up = 0.5 + 0.35 * eo(P(t, tc + 0.15, tc + 0.6));
    const down = eo(P(t, kS + 0.1, kS + 0.5));
    const v = L(up, 0.5, down) + 0.03 * Math.sin(t * 9) * (1 - down) + (down > 0 && down < 1 ? 0.05 * Math.sin(t * 40) : 0);
    ctx.save(); ctx.globalAlpha *= gf; ctx.translate(0, L(40, 0, eo(gf))); gauge(v); ctx.restore();
  }
  chip(540, 1300, 'SCORE', '#ffffff', P(t, t4 + 0.2, t4 + 0.5) * (1 - P(t, kS - 0.1, kS + 0.05)), { size: 30, h: 64 });
  chip(540 + shake(t, kS + 0.2), 1300, 'SHAQ HUA?', C.org, P(t, kS + 0.05, kS + 0.35), { size: 34, h: 72 });
}

// ---------- scene 5: the picture puzzle ----------
const TX = 174, TY = 560, TS = 236, TG = 12;
function tileArt(kind) {
  const s = TS;
  ctx.fillStyle = '#a9c6ee'; ctx.fillRect(0, 0, s, s);
  if (kind === 'light') {
    ctx.fillStyle = '#8a8fa8'; ctx.fillRect(0, s * 0.82, s, s * 0.18);
    rr(s / 2 - 7, s * 0.45, 14, s * 0.4, 4); ctx.fillStyle = '#5b6290'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    rr(s / 2 - 34, 22, 68, 140, 16); ctx.fillStyle = C.box; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
    [C.red, C.yel, C.grn].forEach((c, i) => { ctx.beginPath(); ctx.arc(s / 2, 50 + i * 42, 15, 0, 7); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); });
  } else if (kind === 'tree') {
    ctx.fillStyle = '#86b77a'; ctx.fillRect(0, s * 0.8, s, s * 0.2);
    rr(s / 2 - 12, s * 0.5, 24, s * 0.34, 4); ctx.fillStyle = '#9a6b4f'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(s / 2, s * 0.4, 66, 0, 7); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  } else if (kind === 'car') {
    ctx.fillStyle = '#8a8fa8'; ctx.fillRect(0, s * 0.68, s, s * 0.32);
    rr(46, 96, 110, 56, 18); ctx.fillStyle = C.pink; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    rr(24, 130, 188, 56, 16); ctx.fill(); ctx.stroke();
    rr(64, 106, 34, 32, 6); ctx.fillStyle = '#d9ecff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    rr(106, 106, 34, 32, 6); ctx.fill(); ctx.stroke();
    for (const x of [64, 172]) { ctx.beginPath(); ctx.arc(x, 188, 20, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  } else if (kind === 'building') {
    rr(52, 40, 132, 196, 8); ctx.fillStyle = C.purple; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rr(70 + c * 38, 62 + r * 42, 24, 26, 4); ctx.fillStyle = '#fff1c2'; ctx.fill(); }
  } else if (kind === 'zebra') {
    ctx.fillStyle = '#6f7591'; ctx.fillRect(0, 0, s, s);
    for (let k = 0; k < 5; k++) { ctx.fillStyle = '#ffffff'; ctx.fillRect(18 + k * 44, 30, 26, s - 60); }
  }
}
const KINDS = ['light', 'tree', 'car', 'building', 'light', 'zebra', 'car', 'light', 'tree'];
const PICK = [0, 4, 7];
function sceneChallenge(t) {
  const t0 = CK('Tab traffic'), kW = CK('wali photos'), tV = kW + 0.85;
  const cf = P(t, t0 - 0.1, t0 + 0.25);
  popAt(540, 880, cf, () => {
    ctx.translate(-540, -880);
    card(150, 395, 780, 990, 34, '#ffffff', 6, 12);
    ctx.save(); rr(150, 395, 780, 140, [34, 34, 0, 0]); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    txt('Select all images with', 190, 440, `600 30px ${SANS}`, INK, 'left');
    txt('TRAFFIC LIGHTS', 190, 492, SANSB(54), INK, 'left');
    KINDS.forEach((k, i) => {
      const x = TX + (i % 3) * (TS + TG), y = TY + Math.floor(i / 3) * (TS + TG);
      const f = P(t, t0 + 0.05 + i * 0.04, t0 + 0.3 + i * 0.04); if (f <= 0) return;
      const pi = PICK.indexOf(i), sel = pi >= 0 ? P(t, kW + pi * 0.22, kW + pi * 0.22 + 0.18) : 0;
      ctx.save(); ctx.translate(x + TS / 2, y + TS / 2); const s = back(f) * L(1, 0.86, sel); ctx.scale(s, s); ctx.translate(-TS / 2, -TS / 2);
      ctx.save(); rr(0, 0, TS, TS, 10); ctx.clip(); tileArt(k); ctx.restore();
      rr(0, 0, TS, TS, 10); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
      if (sel > 0) { ctx.save(); rr(x + 4, y + 4, TS - 8, TS - 8, 12); ctx.lineWidth = 8; ctx.strokeStyle = C.cyan; ctx.globalAlpha *= sel; ctx.stroke(); ctx.restore(); popAt(x + 32, y + 32, sel, () => tickMark(0, 0, 26, C.cyan)); }
    });
    // pointer clicking the right tiles
    if (t > kW - 0.3 && t < tV + 0.3) {
      const pts = [[900, 1320], ...PICK.map(i => [TX + (i % 3) * (TS + TG) + TS / 2, TY + Math.floor(i / 3) * (TS + TG) + TS / 2]), [810, 1330]];
      const times = [kW - 0.3, kW, kW + 0.22, kW + 0.44, tV];
      let k = 0; while (k < times.length - 2 && t > times[k + 1]) k++;
      const u = eio(P(t, times[k], times[k + 1]));
      cursorIcon(L(pts[k][0], pts[k + 1][0], u), L(pts[k][1], pts[k + 1][1], u), 1.2, 0);
    }
    const vf = P(t, tV, tV + 0.2);
    rr(690 + 4, 1300 + 4, 220, 62, 31); ctx.fillStyle = INK; ctx.fill();
    rr(690, 1300, 220, 62, 31); ctx.fillStyle = vf > 0.5 ? C.grn : C.cyan; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    txt(vf > 0.5 ? 'PASS!' : 'VERIFY', 800, 1333, `700 28px ${MONO}`, INK);
    txt(`${PICK.filter((i, k) => t >= kW + k * 0.22).length} / 3 select`, 190, 1333, `700 26px ${MONO}`, '#7d83a8', 'left');
  });
}

// ---------- scene 6: CTA chat ----------
function sceneCTA(t) {
  const t0 = LS(6) - 0.4, kD = CK('atke dost');
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
    lab(-215, 'LOGIN · 7th TRY', P(t, t0 + 0.15, t0 + 0.35));
    bub(-190, 'bhai CAPTCHA phir\nfail ho gaya', false, P(t, t0 + 0.2, t0 + 0.5), '#3a4373', '#ffffff');
    bub(-60, 'tu robot toh\nnahi hai?', true, P(t, LS(6) + 0.45, LS(6) + 0.75), C.yel, INK);
    const typing = t > kD - 0.15 && t < kD + 0.55;
    if (typing) { rr(-165, 85, 120, 60, 22); ctx.fillStyle = '#3a4373'; ctx.fill(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-133 + i * 28, 115 + Math.sin(t * 10 + i) * 5, 8, 0, 7); ctx.fillStyle = C.mute; ctx.fill(); } }
    bub(85, 'beep... boop?', false, P(t, kD + 0.55, kD + 0.85), '#3a4373', '#ffffff');
  });
  ctx.restore();
  chip(540, 380, 'IS DOST KO BHEJO', C.yel, P(t, t0 + 0.2, t0 + 0.5), { size: 30, h: 66 });
  const bf = P(t, kD + 0.95, kD + 1.2);
  if (bf > 0) chip(540 + shake(t, kD + 0.95), 1345, 'DOST = ROBOT?!', C.red, bf, { size: 36, h: 80 });
}

function sceneList() {
  return [[0, LS(2), sceneHook], [LS(2), LS(3), sceneTrail], [LS(3), LS(4), sceneCompare],
          [LS(4), CK('Tab traffic'), sceneSignals], [CK('Tab traffic'), LS(6) - 0.4, sceneChallenge], [LS(6) - 0.4, END + 0.4, sceneCTA]];
}
function reelBursts(t) {
  burst(t, 1.45 + 0.75, BOX1[0], BOX1[1], [C.grn, C.cyan, '#ffffff'], 20, 0.9);
  burst(t, CK('asli test') + 0.95, 730, 960, [C.red, C.org, C.yel], 26, 1.2);
  burst(t, CK('Kaise') + 0.25, 540, 800, POP, 26, 1.3);
  burst(t, CK('bot ka') + 0.6, BB[0], BB[1], [C.red, C.org, C.yel], 22, 1.0);
  burst(t, CK('wali photos') + 0.95, 800, 1330, [C.grn, C.cyan, '#ffffff'], 22, 1.0);
  burst(t, CK('atke dost') + 0.95, 540, 1345, [C.red, C.org, C.yel], 22);
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
