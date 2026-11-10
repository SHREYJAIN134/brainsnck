window.BG = '#3b5b78';
// "Tumhari train khadi, Vande Bharat aage kyun nikli?" — 1080x1920, synced to window.TL (helpers from maps.js + lower_berth.js)
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
// Train priority reel scenes
// =====================================================================
window.TOPIC = 'Train Priority';
function STEPS() { return [[0, 'TRAIN KHADI'], [LS(1), 'ASLI RAAZ'], [LS(4), 'SACHCHI KAHANI']]; }
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

// ---------- scene 1: tumhari train 40 minute se khadi... Vande Bharat nikal gayi ----------
const S1_MAIN = 880, S1_LOOP = 1290;
function sceneHook(t) {
  const k40 = CK('40 minute'), kV = CK('Vande Bharat nikal');
  // delay card
  const bf = P(t, 0, 0.3);
  ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 2); ctx.translate(0, L(-40, 0, eo(bf)));
  card(110, 330, 860, 190, 34, '#ffffff', 6, 10);
  faceX(215, 425, 0.6, C.grn, { mood: t > k40 + 0.3 ? 1 : 0 });
  if (t > k40 + 0.6) sweat(262, 380, t);
  txt('TUMHARI TRAIN', 310, 385, `700 28px ${MONO}`, '#7d83a8', 'left');
  const m = Math.round(40 * eo(P(t, k40, k40 + 1.3)));
  txt(`${m} MIN SE KHADI`, 310, 450, SANSB(58), t > k40 ? C.red : INK, 'left');
  clockIcon(905, 425, 38, t * (t > k40 ? 3 : 0.4), C.yel);
  ctx.restore();
  // tracks
  const tf = P(t, 0.1, 0.4); if (tf <= 0) return;
  ctx.save(); ctx.globalAlpha *= tf;
  railSide(S1_MAIN); railSide(S1_LOOP);
  chip(150, S1_MAIN + 62, 'MAIN LINE', '#ffffff', 1, { size: 22, h: 46 });
  chip(150, S1_LOOP + 62, 'SIDE LINE', '#ffffff', 1, { size: 22, h: 46 });
  ctx.restore();
  // your train waits on the side line at a red signal
  const yf = P(t, 0.15, 0.6);
  ctx.save(); ctx.globalAlpha *= Math.min(1, yf * 2);
  trainSide(L(720, 880, eo(yf)), S1_LOOP, 0.9, { cars: 3, kind: 'slow', full: true });
  ctx.restore();
  chip(L(320, 480, eo(yf)), S1_LOOP - 205, 'TUM', C.grn, P(t, 0.4, 0.7), { size: 30, h: 60 });
  signalPost(990, S1_LOOP, 120, 'red');
  // Vande Bharat zooms past on the main line
  const vx = L(-150, 2700, P(t, kV - 0.05, kV + 1.25));
  if (t > kV - 0.1) {
    trainSide(vx, S1_MAIN, 0.9, { cars: 5, kind: 'vb' });
    speedLines(vx - 5 * 314 * 0.9, S1_MAIN - 20, 260, 1 - P(t, kV + 1.1, kV + 1.3));
  }
  chip(540 + shake(t, kV + 1.15), S1_MAIN - 110, 'VANDE BHARAT NIKAL GAYI!', C.yel, P(t, kV + 1.1, kV + 1.35), { size: 40, h: 80 });
}

// ---------- scene 2: control room me har train ki RANKING ----------
const SCR = [110, 340, 860, 520];
const MAP_MAIN = 560, MAP_LOOP = 700;
function sceneControl(t) {
  const t1 = LS(1), kR = CK('har train');
  const sf = P(t, t1 - 0.2, t1 + 0.2);
  if (sf <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, sf * 2); ctx.translate(0, L(50, 0, eo(sf)));
  const [sx, sy, sw, sh] = SCR;
  card(sx, sy, sw, sh, 34, C.box, 6, 12);
  band(sx, sy, sw, 70, 34, C.cyan);
  txt('CONTROL ROOM · LIVE', sx + sw / 2, sy + 37, `700 28px ${MONO}`, INK);
  // schematic: main line + side loop at a station
  line([[sx + 40, MAP_MAIN], [sx + sw - 40, MAP_MAIN]], '#ffffff', 8);
  line([[sx + 230, MAP_MAIN], [sx + 300, MAP_LOOP], [sx + 560, MAP_LOOP], [sx + 630, MAP_MAIN]], '#aab0d6', 6);
  rr(sx + 300, MAP_LOOP + 26, 260, 34, 8); ctx.fillStyle = hexA('#ffffff', 0.18); ctx.fill();
  txt('STATION', sx + 430, MAP_LOOP + 44, `700 20px ${MONO}`, '#d9dcf2');
  // train blips moving on the screen
  const blips = [[C.yel, (t * 140) % 760 + 70, MAP_MAIN, '1'], [C.grn, 360 + 40 * Math.sin(t * 0.8), MAP_LOOP, '3'], [C.org, ((t * 90 + 400) % 760) + 70, MAP_MAIN, '2']];
  blips.forEach(([col, bx, by, rk], i) => {
    rr(sx + bx - 34, by - 16, 68, 32, 16); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    popAt(sx + bx, by - 52, P(t, kR + 0.3 + i * 0.15, kR + 0.55 + i * 0.15), () => { disc(0, 0, 26, '#ffffff', 3); txt('#' + rk, 0, 2, `800 24px ${SANS}`, INK); });
  });
  ctx.restore();
  // controller at the desk
  const cf = P(t, t1 + 0.15, t1 + 0.5);
  if (cf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, cf * 2); ctx.translate(0, L(60, 0, eo(cf)));
    faceX(540, 1040, 1.05, C.org, { glasses: true });
    headset(540, 1040, 1.05);
    card(200, 1140, 680, 90, 24, '#c9cde6', 6, 9);
    rr(330, 1100, 140, 46, 8); ctx.fillStyle = INK; ctx.fill(); rr(610, 1100, 140, 46, 8); ctx.fill();
    ctx.restore();
  }
  chip(540, 1300, 'SECTION CONTROLLER', C.yel, P(t, t1 + 0.4, t1 + 0.7), { size: 30, h: 70 });
  chip(820 + shake(t, kR + 0.4), 920, 'RANKING', C.pink, P(t, kR + 0.2, kR + 0.45), { size: 34, h: 74 });
}

// ---------- scene 3: Vande Bharat sabse upar ----------
const RANKS = [['RAJDHANI', C.cyan], ['EXPRESS · TUM', C.grn], ['VANDE BHARAT', VBW], ['PASSENGER', '#c9cde6'], ['MAAL GAADI', '#c9cde6']];
const RANK_TO = [1, 2, 0, 3, 4];   // final slot of each row (Vande Bharat jumps to #1)
function sceneRank(t) {
  const t2 = LS(2), kU = CK('sabse upar');
  chip(540, 365, 'TRAIN RANKING', C.yel, P(t, t2 - 0.1, t2 + 0.2), { size: 36, h: 76 });
  const u = eio(P(t, kU - 0.15, kU + 0.35));
  for (let s = 0; s < 5; s++) popAt(180, 500 + s * 165, P(t, t2 + s * 0.06, t2 + 0.25 + s * 0.06), () => disc(0, 0, 44, s === 0 ? C.yel : '#ffffff', 5) || txt('#' + (s + 1), 0, 2, SANSB(36), INK));
  const order = RANKS.map((r, i) => i).sort((a, b) => (a === 2) - (b === 2));   // draw the jumper last
  order.forEach(i => {
    const [lab, col] = RANKS[i];
    const y0 = 500 + i * 165, y1 = 500 + RANK_TO[i] * 165, y = L(y0, y1, u);
    const xo = i === 2 ? 40 * Math.sin(Math.PI * u) : 0;
    const f = P(t, t2 + 0.1 + i * 0.07, t2 + 0.35 + i * 0.07); if (f <= 0) return;
    ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2); ctx.translate(xo + L(80, 0, eo(f)), 0);
    card(260, y - 60, 680, 120, 28, col, 6, 9);
    if (i === 2) { ctx.fillStyle = C.blue; ctx.fillRect(264, y + 26, 672, 14); }
    txt(lab, 300, y + 2, SANSB(46), INK, 'left');
    if (i === 1) face(880, y, 0.42, C.grn, t > kU + 0.3 ? 1 : 0);
    ctx.restore();
  });
  popAt(880, 500, P(t, kU + 0.3, kU + 0.55), () => tickMark(0, 0, 36, C.grn));
  chip(540 + shake(t, kU + 0.5), 1360, 'SABSE UPAR = SABSE PEHLE', C.yel, P(t, kU + 0.45, kU + 0.75), { size: 32, h: 74 });
}

// ---------- scene 4: upar wali pehle... tumhari side me wait ----------
const M4 = 690, L4 = 990, SW1 = [[150, M4], [330, L4]], SW2 = [[750, L4], [930, M4]];
function capsule(x, y, ang, w, col, lab, sub) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  hardShadow(-w / 2, -42, w, 84, 42, 7);
  rr(-w / 2, -42, w, 84, 42); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  if (sub) { ctx.fillStyle = sub; ctx.fillRect(-w / 2 + 30, 14, w - 60, 10); }
  txt(lab, 0, -2, `800 34px ${SANS}`, INK);
  ctx.restore();
}
function onPath(pts, f) {
  const seg = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
  let rem = tot * clamp(f);
  for (let i = 1; i < pts.length; i++) {
    if (rem <= seg[i - 1] || i === pts.length - 1) {
      const k = clamp(rem / seg[i - 1]); const [a, b] = [pts[i - 1], pts[i]];
      return [L(a[0], b[0], k), L(a[1], b[1], k), Math.atan2(b[1] - a[1], b[0] - a[0])];
    }
    rem -= seg[i - 1];
  }
}
function sceneWait(t) {
  const t3 = LS(3), kW = CK('tumhari side');
  const pf = P(t, t3 - 0.2, t3 + 0.2); if (pf <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 2);
  // station platform + tracks (top view)
  card(330, L4 + 70, 420, 70, 18, '#c9cde6', 5, 7); txt('STATION', 540, L4 + 106, `700 26px ${MONO}`, INK);
  for (const p of [[[-40, M4], [W + 40, M4]], [SW1[0], SW1[1], SW2[0], SW2[1]]]) { line(p, INK, 26); line(p, '#d9dcf2', 10); }
  chip(540, M4 - 92, 'MAIN LINE', '#ffffff', 1, { size: 24, h: 50 });
  chip(540, L4 - 88, 'SIDE / LOOP LINE', '#ffffff', 1, { size: 24, h: 50 });
  ctx.restore();
  // signals
  popAt(880, L4 - 10, P(t, t3, t3 + 0.25), () => { disc(0, 0, 30, C.red, 4); });
  popAt(1000, M4 - 70, P(t, t3 + 0.05, t3 + 0.3), () => { disc(0, 0, 30, C.grn, 4); });
  // your train goes into the loop and stops
  const yp = onPath([[-200, M4], SW1[0], SW1[1], [700, L4]], eo(P(t, t3 - 0.3, t3 + 0.9)));
  capsule(yp[0], yp[1], yp[2], 300, C.cyan, 'TUM', C.yel);
  // Vande Bharat passes on the main line
  const vf = P(t, t3 + 0.15, t3 + 1.35), vx = L(-200, 1400, vf);
  if (vf > 0 && vf < 1) { speedLines(vx - 170, M4 + 40, 220, 1); capsule(vx, M4, 0, 340, VBW, 'VANDE #1', C.blue); }
  chip(300, M4 + 92, 'PEHLE JAAO', C.grn, P(t, t3 + 0.5, t3 + 0.75) * (1 - P(t, kW + 0.3, kW + 0.5)), { size: 28, h: 60 });
  // wait stamp + clock
  const sf = P(t, kW + 0.1, kW + 0.32);
  if (sf > 0) {
    ctx.save(); ctx.translate(560 + shake(t, kW + 0.32, 0.5, 10), 1260); ctx.rotate(-0.07); const s = L(2.2, 1, eo(sf)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, sf * 2);
    card(-190, -62, 380, 124, 24, C.red, 6, 9); txt('WAIT...', 20, 4, SANSB(70), INK); ctx.restore();
    popAt(330, 1260, P(t, kW + 0.4, kW + 0.65), () => clockIcon(0, 0, 44, t * 3, C.yel));
  }
}

// ---------- scene 5: Vande Bharat ko 2 minute roka... controller SUSPEND ----------
const T5_VB = 780, T5_B = 1020;
function sceneStory(t) {
  const t4 = LS(4), k2 = CK('2 minute'), kS = CK('controller SUSPEND');
  chip(540, 360, 'KERALA · 2023 · TRIAL RUN', C.yel, P(t, t4 - 0.1, t4 + 0.2), { size: 30, h: 70 });
  const tf = P(t, t4 - 0.2, t4 + 0.2); if (tf <= 0) return;
  ctx.save(); ctx.globalAlpha *= tf; railSide(T5_VB); railSide(T5_B); ctx.restore();
  // Vande Bharat rolls in and stops at a red signal
  signalPost(960, T5_VB, 60, t < kS - 0.3 ? 'red' : 'green');
  const vx = L(-200, 820, eo(P(t, t4, t4 + 0.6)));
  trainSide(vx, T5_VB, 0.75, { cars: 3, kind: 'vb' });
  // the crowded train goes first on the other line
  const bx = L(-150, 2300, P(t, t4 + 0.35, k2 + 0.4));
  if (bx < 2300) trainSide(bx, T5_B, 0.7, { cars: 5, kind: 'slow', full: true });
  chip(540, T5_B + 70, 'BHEED WALI TRAIN PEHLE', '#ffffff', P(t, t4 + 0.5, t4 + 0.75) * (1 - P(t, kS - 0.2, kS)), { size: 26, h: 56 });
  // 2 minute late timer
  const lf = P(t, k2, k2 + 0.25);
  if (lf > 0) popAt(540, 520, lf, () => {
    card(-240, -58, 480, 116, 28, '#ffffff', 6, 9);
    clockIcon(-170, 0, 36, t * 4, C.yel);
    txt(`+${Math.min(2, Math.floor(eo(P(t, k2, k2 + 0.9)) * 2.99))} MIN LATE`, 40, 3, SANSB(46), C.red);
  });
  // controller card gets suspended
  const cf = P(t, kS - 0.1, kS + 0.2);
  if (cf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, cf * 2); ctx.translate(0, L(60, 0, eo(cf)));
    card(170, 1030, 740, 365, 36, C.box, 6, 12);
    faceX(330, 1170, 0.95, C.org, { mood: 1, glasses: true }); headset(330, 1170, 0.95);
    txt('CONTROLLER', 470, 1130, SANSB(50), '#ffffff', 'left');
    txt('Piravom station', 470, 1190, `500 28px ${MONO}`, C.mute, 'left');
    txt('(baad me union virodh pe wapas)', 540, 1360, `500 22px ${MONO}`, C.dim);
    ctx.restore();
    const sf = P(t, kS + 0.25, kS + 0.45);
    if (sf > 0) {
      ctx.save(); ctx.translate(650 + shake(t, kS + 0.45, 0.5, 12), 1262); ctx.rotate(-0.1); const s = L(2.4, 1, eo(sf)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, sf * 2);
      card(-230, -58, 460, 116, 22, C.red, 6, 9); txt('SUSPEND!', 0, 4, SANSB(68), INK); ctx.restore();
    }
  }
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneControl], [LS(2), LS(3), sceneRank],
          [LS(3), LS(4), sceneWait], [LS(4), LS(n) - 0.4, sceneStory], [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('Vande Bharat nikal') + 1.15, 540, S1_MAIN - 110, [C.yel, C.cyan, '#ffffff'], 24, 1.1);
  burst(t, CK('sabse upar') + 0.3, 600, 500, [C.yel, C.grn, '#ffffff'], 28, 1.3);
  burst(t, CK('tumhari side') + 0.32, 560, 1260, [C.red, C.org, C.yel], 24, 1.1);
  burst(t, CK('controller SUSPEND') + 0.45, 650, 1262, [C.red, C.org, C.yel], 30, 1.4);
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
