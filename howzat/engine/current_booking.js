window.BG = '#2f6b70';
// "Chart ke baad bhi seat kaise milti hai?" — 1080x1920, synced to window.TL (helpers from maps.js + train_priority.js)
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
// Current booking reel scenes
// =====================================================================
window.TOPIC = 'Current Booking';
function STEPS() { return [[0, 'TICKET CANCEL'], [LS(2), 'ASLI RAAZ'], [LS(4), 'SEAT LO']]; }
const SANSB = s => `800 ${s}px ${SANS}`;
const TUMC = () => C.grn, AUNTYC = () => C.org;

function card(x, y, w, h, r, fill, lw = 5, d = 8) {
  hardShadow(x, y, w, h, r, d);
  rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
}
function band(x, y, w, h, r, fill) {
  ctx.save(); rr(x, y, w, h, [r, r, 0, 0]); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
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
function crossMark(x, y, r, col) {
  disc(x, y, r, col, Math.max(3, r * 0.12));
  const k = r * 0.38; line([[x - k, y - k], [x + k, y + k]], INK, Math.max(4, r * 0.2)); line([[x + k, y - k], [x - k, y + k]], INK, Math.max(4, r * 0.2));
}
function shake(t, t0, d = 0.45, a = 8) { return t > t0 && t < t0 + d ? Math.sin(t * 80) * a * (1 - P(t, t0, t0 + d)) : 0; }
function face(x, y, s, col, mood = 0) {   // mood: 0 smile, 1 worried
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  disc(0, 0, 60, col, 6);
  ctx.beginPath(); ctx.arc(-20, -12, 7, 0, 7); ctx.arc(20, -12, 7, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  if (mood === 1) { ctx.beginPath(); ctx.arc(0, 34, 18, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(0, 8, 26, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  ctx.restore();
}
function sweat(x, y, t) {
  const u = (t * 1.4) % 1;
  ctx.save(); ctx.globalAlpha *= 1 - u; ctx.translate(x, y + 30 * u);
  ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(12, 4, 0, 10); ctx.quadraticCurveTo(-12, 4, 0, -16); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
// side view of a train coach centred at (x, y); n = how many of the 8 windows are full
function coach(x, y, s, n, label) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[-440, 132], [440, 132]], INK, 8);
  for (const wx of [-300, -215, 215, 300]) { disc(wx, 104, 28, '#5b6290', 0); ctx.beginPath(); ctx.arc(wx, 104, 10, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  card(-385, -112, 770, 206, 34, C.cyan, 6, 10);
  ctx.fillStyle = C.yel; ctx.fillRect(-381, 42, 762, 18);
  line([[-381, 42], [381, 42]], INK, 3); line([[-381, 60], [381, 60]], INK, 3);
  for (let i = 0; i < 8; i++) {
    const wx = -334 + i * 84, f = clamp(n - i);
    rr(wx, -84, 60, 72, 10); ctx.fillStyle = f > 0.5 ? C.org : '#e8f6fb'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    if (f > 0) {
      ctx.save(); rr(wx, -84, 60, 72, 10); ctx.clip(); ctx.translate(wx + 30, -36 + 30 * (1 - eo(f)));
      ctx.beginPath(); ctx.arc(0, -6, 13, 0, 7); ctx.fillStyle = INK; ctx.fill(); rr(-20, 8, 40, 30, 12); ctx.fill();
      ctx.restore();
    }
  }
  txt(label, 0, 14, `700 30px ${MONO}`, INK);
  ctx.restore();
}
function person(x, y, r, col) {   // small round passenger token
  disc(x, y, r, col, 3);
  ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.15, r * 0.12, 0, 7); ctx.arc(x + r * 0.32, y - r * 0.15, r * 0.12, 0, 7); ctx.fillStyle = INK; ctx.fill();
}

// face with extras: hair 'grey' (senior) or 'bun' (aunty), optional glasses
function faceX(x, y, s, col, opt = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (opt.hair === 'bun') { disc(0, -66, 26, '#3b3355', 4); }
  if (opt.hair === 'grey') { ctx.beginPath(); ctx.arc(0, -8, 64, Math.PI * 1.08, Math.PI * 1.92); ctx.lineWidth = 16; ctx.strokeStyle = '#e8e8f0'; ctx.stroke(); }
  ctx.restore();
  face(x, y, s, col, opt.mood || 0);
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (opt.hair === 'bun') { ctx.beginPath(); ctx.arc(0, -40, 5, 0, 7); ctx.fillStyle = C.red; ctx.fill(); }
  if (opt.glasses) { ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(-20, -12, 15, 0, 7); ctx.moveTo(35, -12); ctx.arc(20, -12, 15, 0, 7); ctx.stroke(); line([[-5, -12], [5, -12]], INK, 5); }
  ctx.restore();
}
function bunk(x, y, w, h, lab, fill, tc = INK) {
  rr(x + 5, y + 5, w, h, 14); ctx.fillStyle = INK; ctx.fill();
  rr(x, y, w, h, 14); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  if (lab) txt(lab, x + w / 2, y + h / 2 + 2, `700 30px ${MONO}`, tc);
}
function lockIcon(x, y, s, col = INK) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(0, -8, 11, Math.PI, 0); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
  rr(-15, -8, 30, 24, 5); ctx.fillStyle = col; ctx.fill();
  ctx.restore();
}

// ---------- train drawings (original, flat) ----------
const VBW = '#f4f6fb';   // Vande Bharat body (white) with a blue band
// rail seen from the side: ballast strip + sleepers + ink rail, top of rail at y
function railSide(y, x0 = -40, x1 = W + 40) {
  ctx.fillStyle = hexA(INK, 0.28); ctx.fillRect(x0, y + 4, x1 - x0, 24);
  ctx.fillStyle = hexA(INK, 0.45); for (let x = x0 - (x0 % 46); x < x1; x += 46) ctx.fillRect(x, y + 2, 24, 12);
  line([[x0, y], [x1, y]], INK, 8);
}
// side view train: nose (front) at x, pointing right, wheels on rail y. o: {cars, kind:'vb'|'slow', full, label}
function trainSide(x, y, s, o) {
  const CW = 300, CH = 128, G = 14, n = o.cars || 3, top = -30 - CH, bot = -30;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let i = n - 1; i >= 0; i--) {
    const x1 = -i * (CW + G), x0 = x1 - CW, front = i === 0, vb = o.kind === 'vb';
    for (const wx of [x0 + 48, x0 + 92, x1 - 92, x1 - 48]) { ctx.beginPath(); ctx.arc(wx, -15, 15, 0, 7); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.arc(wx, -15, 5, 0, 7); ctx.fillStyle = '#8a90b8'; ctx.fill(); }
    const body = (dx, dy) => {
      ctx.beginPath();
      if (front && vb) {
        ctx.moveTo(x0 + 16 + dx, top + dy); ctx.lineTo(x1 - 150 + dx, top + dy);
        ctx.quadraticCurveTo(x1 + 30 + dx, top + 8 + dy, x1 + 70 + dx, bot - 14 + dy);
        ctx.lineTo(x1 + 70 + dx, bot + dy); ctx.lineTo(x0 + 16 + dx, bot + dy);
        ctx.quadraticCurveTo(x0 + dx, bot + dy, x0 + dx, bot - 16 + dy); ctx.lineTo(x0 + dx, top + 16 + dy);
        ctx.quadraticCurveTo(x0 + dx, top + dy, x0 + 16 + dx, top + dy); ctx.closePath();
      } else ctx.roundRect(x0 + dx, top + dy, CW + (front && !vb ? 0 : 0), CH, front && !vb ? [16, 30, 8, 16] : 16);
    };
    body(8, 8); ctx.fillStyle = INK; ctx.fill();
    body(0, 0); ctx.fillStyle = vb ? VBW : (front ? C.org : C.cyan); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    if (vb) {
      rr(x0 + 22, top + 24, CW - 44 + (front ? -60 : 0), 44, 12); ctx.fillStyle = '#2a3566'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = C.blue; ctx.fillRect(x0 + 4, bot - 40, CW - 8 + (front ? 40 : 0), 16);
      if (front) { ctx.beginPath(); ctx.moveTo(x1 - 40, top + 30); ctx.quadraticCurveTo(x1 + 20, top + 38, x1 + 40, top + 76); ctx.lineTo(x1 - 40, top + 76); ctx.closePath(); ctx.fillStyle = '#2a3566'; ctx.fill(); }
    } else {
      ctx.fillStyle = C.yel; ctx.fillRect(x0 + 4, bot - 34, CW - 8, 12);
      const nw = front ? 2 : 4;
      for (let k = 0; k < nw; k++) {
        const wx = x0 + 26 + k * 68, full = o.full && hash(k, i) > 0.15;
        rr(wx, top + 22, 50, 54, 9); ctx.fillStyle = full ? C.org : '#e8f6fb'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
        if (full) { ctx.save(); rr(wx, top + 22, 50, 54, 9); ctx.clip(); ctx.beginPath(); ctx.arc(wx + 25, top + 50, 10, 0, 7); ctx.fillStyle = INK; ctx.fill(); rr(wx + 9, top + 62, 32, 22, 9); ctx.fill(); ctx.restore(); }
      }
      if (front) { rr(x1 - 70, top + 22, 50, 46, 9); ctx.fillStyle = '#e8f6fb'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(x1 - 12, bot - 22, 9, 0, 7); ctx.fillStyle = C.yel; ctx.fill(); ctx.stroke(); }
    }
  }
  if (o.label) txt(o.label, -(CW + G) * Math.min(1, n - 1) - CW / 2, bot - 70 + (o.kind === 'vb' ? 18 : 0), `700 ${o.ls || 30}px ${MONO}`, INK);
  ctx.restore();
}
function speedLines(x, y, len, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (let k = 0; k < 5; k++) line([[x - 60 - 40 * hash(k, 3), y - 20 - k * 22], [x - 60 - len * (0.5 + 0.5 * hash(k, 7)), y - 20 - k * 22]], '#ffffff', 6);
  ctx.restore();
}
function signalPost(x, y, h, state) {   // y = ground, lamps at the top
  line([[x, y], [x, y - h]], INK, 10);
  card(x - 32, y - h - 120, 64, 124, 22, C.box, 5, 6);
  const lamp = (ly, on, col) => { ctx.beginPath(); ctx.arc(x, ly, 18, 0, 7); ctx.fillStyle = on ? col : '#4a4f72'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); };
  lamp(y - h - 88, state === 'red', C.red); lamp(y - h - 36, state === 'green', C.grn);
}
function clockIcon(x, y, r, t, col = '#ffffff') {
  disc(x, y, r, col, 4);
  line([[x, y], [x, y - r * 0.6]], INK, 5);
  const a = t * 5; line([[x, y], [x + Math.sin(a) * r * 0.75, y - Math.cos(a) * r * 0.75]], INK, 4);
  ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fillStyle = INK; ctx.fill();
}
function headset(x, y, s) {   // headset over a face drawn at (x, y) with scale s
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(0, -4, 70, Math.PI * 1.08, Math.PI * 1.92); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke();
  rr(-80, -26, 22, 46, 8); ctx.fillStyle = INK; ctx.fill(); rr(58, -26, 22, 46, 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(68, 14); ctx.quadraticCurveTo(60, 52, 22, 50); ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.arc(20, 50, 8, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

// ---------- ticket + berth helpers ----------
const GREY = '#c9cde6';
// a ticket card centred at (x, y): band on top, two side notches on a perforation line
function ticketCard(x, y, w, h, band_, title, perfY) {
  const x0 = x - w / 2, y0 = y - h / 2;
  card(x0, y0, w, h, 30, '#ffffff', 6, 10);
  band(x0, y0, w, 66, 30, band_);
  txt(title, x, y0 + 35, `700 30px ${MONO}`, INK);
  const py = y0 + (perfY || h * 0.68);
  line([[x0 + 40, py], [x0 + w - 40, py]], '#9aa0c4', 4, [12, 12]);
  for (const nx of [x0, x0 + w]) { ctx.beginPath(); ctx.arc(nx, py, 20, 0, 7); ctx.fillStyle = BG; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + 3, py - 22, 18, 44); ctx.fillRect(x0 + w - 21, py - 22, 18, 44);
}
// status pill inside a ticket
function statusPill(x, y, label, col, f, size = 46) {
  popAt(x, y, f, () => {
    ctx.font = SANSB(size); const w = ctx.measureText(label).width + 56, h = size * 1.6;
    hardShadow(-w / 2, -h / 2, w, h, h / 2, 6);
    rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    txt(label, 0, 3, SANSB(size), INK);
  });
}
function stamp(x, y, label, col, f, t, t0, size = 92, rot = -0.12) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x + shake(t, t0, 0.5, 12), y); ctx.rotate(rot); const s = L(2.3, 1, eo(f)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 2);
  ctx.font = SANSB(size); const w = ctx.measureText(label).width + 80, h = size * 1.45;
  card(-w / 2, -h / 2, w, h, 22, col, 7, 10); txt(label, 0, 6, SANSB(size), INK);
  ctx.restore();
}
// a berth seen from the top: filled with a passenger or empty
function berthTop(x, y, w, h, state, f = 1) {   // state: 'full' | 'empty' | 'free'
  const fill = state === 'free' ? C.grn : state === 'empty' ? '#e8eaf6' : '#ffffff';
  rr(x + 4, y + 4, w, h, 10); ctx.fillStyle = INK; ctx.fill();
  rr(x, y, w, h, 10); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  if (state === 'full' && f > 0) {
    const s = back(f); ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s);
    disc(0, 0, Math.min(w, h) * 0.3, POP[(Math.round(x * 7 + y * 3) >> 3) % POP.length], 0);
    ctx.restore();
  }
}
function pointer(x, y, press = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(press, press);
  ctx.beginPath(); ctx.arc(6, 6, 34, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fillStyle = C.pink; ctx.fill();
  ctx.restore();
}

// ---------- scene 1: tumhara ticket WAITING... chart bana, CANCEL! ----------
const kCANCEL = () => CK('chart bana') + 1.09;
function sceneHook(t) {
  const kWt = CK('WAITING'), kCh = CK('chart bana'), kC = kCANCEL();
  const bf = P(t, 0, 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 2); ctx.translate(0, L(-50, 0, eo(bf)));
  ticketCard(540, 620, 860, 470, C.cyan, 'DELHI  →  PATNA', 330);
  faceX(240, 560, 0.85, C.grn, { mood: t > kC + 0.2 ? 1 : 0 });
  if (t > kC + 0.5) sweat(305, 500, t);
  txt('TUMHARA TICKET', 360, 520, `700 28px ${MONO}`, '#7d83a8', 'left');
  txt('CLASS 3A', 360, 590, SANSB(56), INK, 'left');
  txt('STATUS', 200, 780, `700 26px ${MONO}`, '#7d83a8', 'left');
  ctx.restore();
  // WAITING status
  const wl = t < kC ? 'WL 23' : 'WL 23';
  statusPill(640, 780, wl, C.org, P(t, kWt, kWt + 0.25), 52);
  // reservation chart slides in
  const cf = P(t, kCh - 0.1, kCh + 0.3);
  if (cf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, cf * 2); ctx.translate(L(300, 0, eo(cf)), 0);
    card(190, 920, 700, 410, 30, '#ffffff', 6, 10);
    band(190, 920, 700, 66, 30, C.yel);
    txt('RESERVATION CHART', 540, 955, `700 30px ${MONO}`, INK);
    const rows = [['B1-12', 'CNF', C.grn], ['B2-34', 'CNF', C.grn], ['B4-07', 'CNF', C.grn], ['WL 23', '✗', C.red]];
    rows.forEach(([a, b, col], i) => {
      const rf = P(t, kCh + 0.15 + i * 0.12, kCh + 0.35 + i * 0.12); if (rf <= 0) return;
      const ry = 1030 + i * 72;
      ctx.save(); ctx.globalAlpha *= rf;
      rr(240, ry, 600, 54, 14); ctx.fillStyle = i === 3 ? hexA(C.red, 0.25) : '#eef0fa'; ctx.fill();
      txt(a, 280, ry + 28, `700 30px ${MONO}`, INK, 'left');
      rr(690, ry + 6, 110, 42, 21); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      txt(b, 745, ry + 28, `800 26px ${SANS}`, INK);
      ctx.restore();
    });
    ctx.restore();
  }
  // CANCEL stamp over the ticket
  stamp(560, 640, 'CANCEL', C.red, P(t, kC, kC + 0.22), t, kC + 0.22);
}

// ---------- scene 2: train chalne me 30 minute... dost ko CONFIRM seat ----------
const kCONF = () => CK('dost ko') + 0.85;
function miniTicket(x, y, who, faceCol, mood, statusLab, statusCol, sf, cross) {
  ticketCard(x, y, 440, 400, faceCol, who, 270);
  faceX(x, y - 50, 0.95, faceCol, { mood });
  statusPill(x, y + 128, statusLab, statusCol, sf, 40);
  if (cross === 'x') popAt(x + 160, y - 110, sf, () => crossMark(0, 0, 34, C.red));
  if (cross === 'v') popAt(x + 160, y - 110, sf, () => tickMark(0, 0, 34, C.grn));
}
function sceneDost(t) {
  const t1 = LS(1), k30 = CK('30 minute'), kD = CK('dost ko'), kCf = kCONF();
  // departure board
  const df = P(t, t1 - 0.2, t1 + 0.15);
  if (df > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, df * 2); ctx.translate(0, L(-40, 0, eo(df)));
    card(130, 320, 820, 220, 34, C.box, 6, 10);
    txt('TRAIN CHALNE ME', 540, 372, `700 30px ${MONO}`, C.mute);
    const sec = Math.max(0, 30 * 60 - Math.floor(Math.max(0, t - k30) * 9));
    const mm = String(Math.floor(sec / 60)).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0');
    const pulse = 1 + 0.08 * win(t, k30, k30 + 0.5, 0.12, 0.3);
    ctx.save(); ctx.translate(540, 462); ctx.scale(pulse, pulse);
    txt(`${mm}:${ss}`, 0, 0, `700 100px ${MONO}`, C.yel); ctx.restore();
    clockIcon(225, 462, 40, t * 2, C.yel);
    ctx.restore();
  }
  // a train waiting at the platform
  const tf = P(t, t1, t1 + 0.4);
  if (tf > 0) { ctx.save(); ctx.globalAlpha *= tf; railSide(735); trainSide(L(1250, 1010, eo(tf)), 735, 0.62, { cars: 3, kind: 'slow' }); ctx.restore(); }
  // tum vs dost tickets
  const lf = P(t, t1 + 0.2, t1 + 0.5);
  if (lf > 0) { ctx.save(); ctx.globalAlpha *= Math.min(1, lf * 2); ctx.translate(L(-80, 0, eo(lf)), 0);
    miniTicket(290, 1070, 'TUM', C.grn, 1, 'CANCEL', C.red, 1, 'x'); ctx.restore(); }
  const rf = P(t, kD - 0.1, kD + 0.25);
  if (rf > 0) { ctx.save(); ctx.globalAlpha *= Math.min(1, rf * 2); ctx.translate(L(80, 0, eo(rf)), 0);
    miniTicket(790, 1070, 'DOST', C.org, t > kCf ? 0 : 1, 'CONFIRM', C.grn, P(t, kCf, kCf + 0.25), 'v'); ctx.restore(); }
  popAt(540, 1070, P(t, kD, kD + 0.25), () => { disc(0, 0, 46, C.yel, 5); txt('VS', 0, 3, SANSB(36), INK); });
}

// ---------- scene 3: chart ke baad bhi seats KHAALI ----------
const COACH = [70, 470, 940, 560];
const FREE = [[1, 0], [4, 2], [6, 1], [2, 3], [7, 3]];
function sceneKhaali(t) {
  const t2 = LS(2), kK = CK('seats KHAALI') + 0.35;
  chip(540, 370, 'CHART BANNE KE BAAD', C.yel, P(t, t2 - 0.1, t2 + 0.2), { size: 34, h: 74 });
  const [cx, cy, cw, ch] = COACH;
  const f = P(t, t2 - 0.2, t2 + 0.2); if (f <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2); ctx.translate(0, L(60, 0, eo(f)));
  card(cx, cy, cw, ch, 40, C.box, 6, 12);
  band(cx, cy, cw, 70, 40, C.cyan);
  txt('COACH B2 · 3A', 540, cy + 37, `700 30px ${MONO}`, INK);
  // 8 bays x 4 berths (top view)
  const bw = 96, bh = 92, gx = 18, gy = 14, x0 = cx + (cw - (8 * bw + 7 * gx)) / 2, y0 = cy + 100;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) {
    const free = FREE.some(([a, b]) => a === i && b === j);
    const bx = x0 + i * (bw + gx), by = y0 + j * (bh + gy) + (j >= 2 ? 16 : 0);
    const pf = P(t, t2 + 0.05 + (i + j) * 0.03, t2 + 0.3 + (i + j) * 0.03);
    if (free) {
      const g = P(t, kK + FREE.findIndex(([a, b]) => a === i && b === j) * 0.07, kK + 0.2 + FREE.findIndex(([a, b]) => a === i && b === j) * 0.07);
      if (g > 0) { ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); const s = L(1, 1.12, Math.sin(Math.PI * g)); ctx.scale(s, s); ctx.translate(-(bx + bw / 2), -(by + bh / 2)); berthTop(bx, by, bw, bh, 'free'); ctx.restore();
        if (g >= 1) tickMark(bx + bw / 2, by + bh / 2, 22, '#ffffff'); }
      else berthTop(bx, by, bw, bh, 'empty');
    } else berthTop(bx, by, bw, bh, 'full', pf);
  }
  // aisle
  ctx.fillStyle = hexA('#ffffff', 0.12); ctx.fillRect(x0, y0 + 2 * (bh + gy) - 6, 8 * bw + 7 * gx, 14);
  ctx.restore();
  chip(540 + shake(t, kK + 0.3), cy + ch + 80, '5 SEATS KHAALI!', C.grn, P(t, kK + 0.15, kK + 0.4), { size: 40, h: 84 });
  chip(330, cy + ch + 200, 'KISI NE CANCEL KIYA', '#ffffff', P(t, kK + 0.45, kK + 0.7), { size: 24, h: 54 });
  chip(760, cy + ch + 200, 'BEECH SE KHAALI', '#ffffff', P(t, kK + 0.55, kK + 0.8), { size: 24, h: 54 });
}

// ---------- scene 4: railway unhe current booking me bechti hai ----------
function sceneSell(t) {
  const t3 = LS(3), kCB = CK('current booking'), kB = CK('bechti hai');
  // timeline: chart 1 ... current booking ... ~30 min pehle ... train chali
  const f = P(t, t3 - 0.2, t3 + 0.2); if (f <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2); ctx.translate(0, L(-40, 0, eo(f)));
  card(70, 320, 940, 300, 34, C.box, 6, 10);
  const ax = 170, bx = 770, ex = 910, ly = 470;
  line([[ax, ly], [ex, ly]], '#6b739e', 14);
  const gf = eo(P(t, kCB - 0.1, kCB + 0.6));
  if (gf > 0) line([[ax, ly], [L(ax, bx, gf), ly]], C.grn, 14);
  for (const [x, col, lab] of [[ax, C.yel, 'CHART 1'], [bx, C.org, '~30 MIN'], [ex, C.red, 'CHALI']]) {
    disc(x, ly, 22, col, 4);
    txt(lab, x, ly + 62, `700 24px ${MONO}`, '#ffffff');
  }
  txt('PEHLE', bx, ly + 92, `700 22px ${MONO}`, C.mute);
  popAt(470, ly - 70, P(t, kCB, kCB + 0.3), () => { ctx.font = `700 30px ${MONO}`; const w = ctx.measureText('CURRENT BOOKING').width + 44; rr(-w / 2, -28, w, 56, 28); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); txt('CURRENT BOOKING', 0, 2, `700 30px ${MONO}`, INK); });
  ctx.restore();
  // the counter: khaali berths go on sale
  const cf = P(t, t3, t3 + 0.35);
  if (cf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, cf * 2); ctx.translate(0, L(60, 0, eo(cf)));
    card(120, 700, 840, 560, 40, '#ffffff', 6, 12);
    band(120, 700, 840, 80, 40, C.pink);
    txt('KHAALI SEATS · ON SALE', 540, 742, `700 34px ${MONO}`, INK);
    ctx.restore();
    const seats = ['B2-34', 'B4-17', 'B6-21', 'B3-50'];
    seats.forEach((s, i) => {
      const x = 330 + (i % 2) * 420, y = 880 + Math.floor(i / 2) * 150;
      const sf = P(t, t3 + 0.35 + i * 0.15, t3 + 0.6 + i * 0.15);
      popAt(x, y, sf, () => {
        card(-170, -56, 340, 112, 24, C.grn, 5, 8);
        txt(s, -20, 2, SANSB(46), INK);
        const sold = t > kB + 0.1 + i * 0.12;
        if (sold) { ctx.save(); ctx.translate(120, 0); ctx.rotate(-0.15); const k = back(P(t, kB + 0.1 + i * 0.12, kB + 0.3 + i * 0.12)); ctx.scale(k, k); disc(0, 0, 34, C.yel, 4); txt('₹', 0, 3, SANSB(40), INK); ctx.restore(); }
      });
    });
    chip(540, 1200, 'SIRF CONFIRM SEAT', C.yel, P(t, kB + 0.2, kB + 0.45), { size: 32, h: 70 });
  }
}

// ---------- scene 5: app me chart vacancy dekho... seat lo! ----------
const PH = [540, 860];
function sceneApp(t) {
  const t4 = LS(4), kV = CK('chart vacancy'), kS = CK('seat lo');
  const tap = kV + 0.75;
  const pf = P(t, t4 - 0.2, t4 + 0.25); if (pf <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 2);
  ctx.translate(PH[0], PH[1] + L(80, 0, eo(pf)));
  // flat phone
  card(-230, -440, 460, 880, 60, '#1a1f3d', 6, 12);
  rr(-206, -416, 412, 832, 44); ctx.fillStyle = '#f4f5fb'; ctx.fill();
  rr(-55, -406, 110, 24, 12); ctx.fillStyle = INK; ctx.fill();
  ctx.save(); rr(-206, -416, 412, 832, 44); ctx.clip();
  ctx.fillStyle = C.yel; ctx.fillRect(-206, -380, 412, 92); line([[-206, -288], [206, -288]], INK, 4);
  txt('CHART VACANCY', 0, -334, `700 32px ${MONO}`, INK);
  const rows = [['A1', '0', GREY], ['B1', '0', GREY], ['B2', '2 KHAALI', C.grn], ['B3', '1 KHAALI', C.grn], ['B4', '0', GREY]];
  rows.forEach(([c, v, col], i) => {
    const rf = P(t, kV - 0.15 + i * 0.08, kV + 0.1 + i * 0.08); if (rf <= 0) return;
    const y = -240 + i * 104;
    ctx.save(); ctx.globalAlpha *= rf; ctx.translate(L(60, 0, eo(rf)), 0);
    const hl = i === 2 && t > tap;
    rr(-180, y, 360, 86, 18); ctx.fillStyle = hl ? hexA(C.grn, 0.35) : '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    txt(c, -140, y + 44, SANSB(40), INK, 'left');
    rr(-10, y + 20, 170, 46, 23); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    txt(v, 75, y + 44, `700 22px ${MONO}`, INK);
    ctx.restore();
  });
  ctx.restore();
  ctx.restore();
  // pointer taps B2
  const pa = P(t, tap - 0.5, tap - 0.05), po = 1 - P(t, kS + 0.2, kS + 0.4);
  if (t > tap - 0.55 && po > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, tap - 0.55, tap - 0.35)) * po;
    pointer(L(900, 650, eio(pa)), L(1300, 840, eio(pa)), t > tap - 0.05 && t < tap + 0.15 ? 0.82 : 1);
    ctx.restore();
  }
  const rf = P(t, tap, tap + 0.5);
  if (rf > 0 && rf < 1) { ctx.beginPath(); ctx.arc(640, 830, 40 + 160 * eo(rf), 0, 7); ctx.lineWidth = 8 * (1 - rf); ctx.strokeStyle = INK; ctx.stroke(); }
  // confirmed ticket pops out
  const cf = P(t, kS, kS + 0.25);
  if (cf > 0) popAt(540, 1170, cf, () => {
    card(-330, -100, 660, 200, 30, C.grn, 6, 10);
    txt('B2 · 34', -40, -20, SANSB(64), INK);
    txt('CONFIRM SEAT', -40, 48, `700 28px ${MONO}`, INK);
    tickMark(230, 0, 50, '#ffffff');
  });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneDost], [LS(2), LS(3), sceneKhaali],
          [LS(3), LS(4), sceneSell], [LS(4), LS(n) - 0.4, sceneApp], [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, kCANCEL() + 0.22, 560, 640, [C.red, C.org, C.yel], 28, 1.3);
  burst(t, kCONF() + 0.1, 790, 1190, [C.grn, C.yel, '#ffffff'], 26, 1.2);
  burst(t, CK('seats KHAALI') + 0.55, 540, 750, [C.grn, C.cyan, '#ffffff'], 30, 1.5);
  burst(t, CK('seat lo') + 0.15, 540, 1170, [C.grn, C.yel, '#ffffff'], 30, 1.4);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈✗')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
