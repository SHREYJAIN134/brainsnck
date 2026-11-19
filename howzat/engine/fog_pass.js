window.BG = '#4b5675';
// "Kohre me driver ko signal kaise pata chalta hai?" (Fog Pass) — 1080x1920, synced to window.TL (helpers from maps.js + train_priority.js)
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
// Fog Pass reel scenes
// =====================================================================
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

window.TOPIC = 'Fog Pass';
function STEPS() { return [[0, 'KOHRA'], [LS(1), 'FOG PASS'], [LS(4), 'ISLIYE LATE']]; }

// ---------- fog-pass helpers (original, flat) ----------
// flat drifting fog: translucent white ellipses, no blur, no gradients
function fogLayer(t, x0, y0, w, h, n, a, speed, seed = 1, clip = true) {
  ctx.save(); if (clip) { ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); }
  for (let k = 0; k < n; k++) {
    const rw = 160 + 220 * hash(k, seed), rh = 50 + 70 * hash(k, seed + 3);
    const span = w + 2 * rw;
    const x = x0 - rw + ((hash(k, seed + 7) * span - t * speed * (0.6 + 0.6 * hash(k, seed + 9))) % span + span) % span;
    const y = y0 + h * hash(k, seed + 11);
    ctx.beginPath(); ctx.ellipse(x, y, rw, rh, 0, 0, 7); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill();
  }
  ctx.restore();
}
function miniSignal(x, y, s, state) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[0, 0], [0, -60]], INK, 7);
  rr(-17, -122, 34, 66, 12); ctx.fillStyle = C.box; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  for (const [ly, col] of [[-105, C.red], [-73, C.grn]]) {
    ctx.beginPath(); ctx.arc(0, ly, 10, 0, 7); ctx.fillStyle = state === col ? col : '#6b7099'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
}
function miniGate(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[-50, 0], [-50, -70]], INK, 8);
  rr(-56, -78, 120, 18, 9); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.save(); rr(-56, -78, 120, 18, 9); ctx.clip(); ctx.fillStyle = C.red; for (let k = 0; k < 6; k++) ctx.fillRect(-50 + k * 22, -80, 11, 22); ctx.restore();
  rr(-56, -78, 120, 18, 9); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function satellite(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.45 + Math.sin(t * 1.5) * 0.05);
  for (const px of [-150, 50]) {
    hardShadow(px, -26, 100, 52, 8, 5);
    rr(px, -26, 100, 52, 8); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    for (const gx of [25, 50, 75]) line([[px + gx, -26], [px + gx, 26]], INK, 2);
    line([[px, 0], [px + 100, 0]], INK, 2);
  }
  line([[-50, 0], [50, 0]], INK, 6);
  card(-34, -34, 68, 68, 12, C.yel, 4, 5);
  ctx.beginPath(); ctx.arc(0, 50, 22, Math.PI, 0); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
// the GPS box on the loco pilot's desk; screen() draws in device coords (screen = -200..200, -130..90)
function fogDevice(x, y, s, screen) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-230, -160, 460, 320, 36, '#e9ecf6', 6, 10);
  rr(-200, -130, 400, 220, 20); ctx.fillStyle = '#1d2447'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); rr(-200, -130, 400, 220, 20); ctx.clip(); if (screen) screen(); ctx.restore();
  for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(-170 + k * 18, 125, 5, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  ctx.beginPath(); ctx.arc(170, 125, 10, 0, 7); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function soundWaves(x, y, s, t, a) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  for (let k = 0; k < 3; k++) {
    const u = ((t * 1.8) + k / 3) % 1;
    ctx.beginPath(); ctx.arc(0, 0, 30 + 70 * u, -0.7, 0.7); ctx.lineWidth = 9; ctx.strokeStyle = hexA('#ffffff', 1 - u); ctx.stroke();
  }
  ctx.restore();
}
function bubble(x, y, label, col, f, size = 46) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); const s = back(f); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 3);
  ctx.font = `800 ${size}px ${SANS}`; const w = ctx.measureText(label).width + 70, h = size + 50;
  const shape = (dx, dy) => { ctx.beginPath(); ctx.roundRect(-w / 2 + dx, -h / 2 + dy, w, h, 28); ctx.moveTo(-30 + dx, -h / 2 + dy); ctx.lineTo(0 + dx, -h / 2 - 34 + dy); ctx.lineTo(30 + dx, -h / 2 + dy); };
  shape(8, 8); ctx.fillStyle = INK; ctx.fill();
  shape(0, 0); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = col; ctx.fillRect(-28, -h / 2 - 2, 56, 8);
  txt(label, 0, 4, `800 ${size}px ${SANS}`, INK);
  ctx.restore();
}
// rail seen from the side with sleepers that slide left (train looks like it is running)
function railRun(y, off) {
  ctx.fillStyle = hexA(INK, 0.28); ctx.fillRect(-40, y + 4, W + 80, 24);
  ctx.fillStyle = hexA(INK, 0.45); for (let x = -46 - (off % 46); x < W + 46; x += 46) ctx.fillRect(x, y + 2, 24, 12);
  line([[-40, y], [W + 40, y]], INK, 8);
}
function polesRun(y, t, speed, a) {
  ctx.save(); ctx.globalAlpha *= a;
  for (let k = 0; k < 4; k++) {
    const x = ((k * 360 - t * speed) % 1440 + 1440) % 1440 - 180;
    line([[x, y], [x, y - 230]], hexA(INK, 0.55), 8); line([[x - 40, y - 210], [x + 40, y - 210]], hexA(INK, 0.55), 6);
  }
  ctx.restore();
}
function gauge(x, y, r, v) {
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, ang = u => L(a0, a1, clamp(u / 160));
  ctx.beginPath(); ctx.arc(x + 10, y + 10, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = C.box; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.arc(x, y, r - 46, ang(0), ang(75)); ctx.lineWidth = 30; ctx.strokeStyle = C.grn; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r - 46, ang(75), ang(160)); ctx.lineWidth = 30; ctx.strokeStyle = '#5b6290'; ctx.stroke();
  for (let u = 0; u <= 160; u += 20) {
    const a = ang(u), c = Math.cos(a), s = Math.sin(a);
    if (u === 80) continue;
    line([[x + c * (r - 72), y + s * (r - 72)], [x + c * (r - 92), y + s * (r - 92)]], '#ffffff', 5);
    txt(String(u), x + c * (r - 128), y + s * (r - 128), `700 26px ${MONO}`, C.mute);
  }
  // red cap mark at 75
  const am = ang(75); line([[x + Math.cos(am) * (r - 20), y + Math.sin(am) * (r - 20)], [x + Math.cos(am) * (r - 76), y + Math.sin(am) * (r - 76)]], C.red, 12);
  const an = ang(v);
  line([[x - Math.cos(an) * 30, y - Math.sin(an) * 30], [x + Math.cos(an) * (r - 70), y + Math.sin(an) * (r - 70)]], INK, 20);
  line([[x - Math.cos(an) * 30, y - Math.sin(an) * 30], [x + Math.cos(an) * (r - 70), y + Math.sin(an) * (r - 70)]], C.yel, 10);
  disc(x, y, 26, C.yel, 0);
  txt(`${Math.round(v)}`, x, y + r * 0.42, `800 76px ${SANS}`, '#ffffff');
  txt('km/h', x, y + r * 0.42 + 56, `700 26px ${MONO}`, C.mute);
}

// ---------- scene 1: kohre me driver ko kuch nahi dikhta... par train daud rahi ----------
const WS = [110, 380, 860, 520];   // windshield card
const R1 = 1290;                   // rail y in the hook
function sceneHook(t) {
  const kN = CK('kuch nahi'), kP = CK('par train');
  const f = P(t, 0, 0.35);
  // windshield = driver's view, all fog
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2); ctx.translate(0, L(-40, 0, eo(f)));
  const [x, y, w, h] = WS;
  hardShadow(x, y, w, h, 44, 12);
  rr(x, y, w, h, 44); ctx.fillStyle = '#c9cfdf'; ctx.fill();
  ctx.save(); rr(x, y, w, h, 44); ctx.clip();
  // faint track running into the fog
  ctx.save(); ctx.globalAlpha *= 0.35;
  line([[400, y + h], [528, y + 150]], INK, 10); line([[680, y + h], [552, y + 150]], INK, 10);
  for (let k = 0; k < 7; k++) {
    const u = ((k / 7) + t * 0.9) % 1, yy = L(y + 160, y + h, u * u), hw = L(20, 190, u * u);
    line([[540 - hw, yy], [540 + hw, yy]], INK, L(3, 10, u));
  }
  ctx.restore();
  fogLayer(t, x, y, w, h, 16, 0.55, 140, 2);
  fogLayer(t, x, y, w, h, 10, 0.5, 260, 5);
  ctx.restore();
  line([[540, y + 6], [540, y + h - 6]], INK, 14);   // window pillar
  rr(x, y, w, h, 44); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
  chip(540, WS[1], 'DRIVER KI NAZAR', '#ffffff', P(t, 0.15, 0.45), { size: 24, h: 50 });
  // the driver, worried
  const df = P(t, 0.2, 0.55);
  if (df > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, df * 3);
    faceX(200, 880, 0.85 * back(df), C.org, { mood: t > kN + 0.2 ? 1 : 0 });
    ctx.restore();
    if (t > kN + 0.4) sweat(258, 820, t);
  }
  chip(540 + shake(t, kN + 0.25), 650, 'KUCH NAHI DIKHTA!', C.yel, P(t, kN + 0.15, kN + 0.45), { size: 40, h: 82 });
  // below: the train keeps running through the fog
  const bf = P(t, 0.1, 0.45); if (bf <= 0) return;
  ctx.save(); ctx.globalAlpha *= bf;
  const run = t < kP ? 0.25 : 1;   // slow crawl, then it runs
  const off = t * 220 * run + Math.max(0, t - kP) * 520;
  polesRun(R1, off, 1, 1);
  railRun(R1, off);
  trainSide(L(560, 820, eo(P(t, 0.1, 1.0))) + shake(t, kP, 2, 2), R1, 0.62, { cars: 3, kind: 'slow', full: true });
  speedLines(L(560, 820, eo(P(t, 0.1, 1.0))) - 3 * 314 * 0.62, R1 - 10, 240, P(t, kP, kP + 0.3));
  fogLayer(t, 0, 1110, W, 150, 10, 0.35, 300, 8, false);
  ctx.restore();
  chip(540, 1015, 'PHIR BHI DAUD RAHI!', C.grn, P(t, kP + 0.1, kP + 0.4), { size: 36, h: 76 });
}

// ---------- scene 2: engine me GPS dabba... Fog Pass ----------
const DEV2 = [540, 845];
function sceneDevice(t) {
  const t0 = LS(1), kF = CK('Fog Pass');
  // loco pilot's desk
  const df = P(t, t0, t0 + 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, df * 2); ctx.translate(0, L(60, 0, eo(df)));
  card(70, 1010, 940, 330, 40, C.box, 6, 12);
  for (const [gx, col] of [[190, C.cyan], [890, C.org]]) {
    ctx.beginPath(); ctx.arc(gx, 1130, 52, 0, 7); ctx.fillStyle = '#2f3868'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    const a = -2.2 + Math.sin(t * 2 + gx) * 0.25; line([[gx, 1130], [gx + Math.cos(a) * 40, 1130 + Math.sin(a) * 40]], col, 7);
  }
  txt('LOCO PILOT KA DESK', 540, 1300, `700 24px ${MONO}`, C.mute);
  ctx.restore();
  // satellite + GPS beam
  const sf = P(t, t0 + 0.35, t0 + 0.7);
  if (sf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, sf * 2);
    ctx.setLineDash([18, 16]); ctx.lineDashOffset = -t * 90;
    line([[835, 470], [DEV2[0] + 60, DEV2[1] - 150]], '#ffffff', 6, [18, 16]);
    ctx.restore();
    satellite(850, 440, 0.8 * back(sf), t);
    chip(870, 560, 'GPS', C.cyan, P(t, t0 + 0.6, t0 + 0.9), { size: 30, h: 60 });
  }
  // the box itself
  const bf = P(t, t0 + 0.1, t0 + 0.5);
  if (bf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 3);
    const s = 0.92 * back(bf);
    fogDevice(DEV2[0], DEV2[1], s, () => {
      // little route line with the train dot moving
      line([[-160, 20], [160, 20]], '#5b6290', 10);
      const u = ((t - t0) * 0.35) % 1;
      miniSignal(120, 20, 0.6, '');
      ctx.beginPath(); ctx.arc(L(-160, 90, u), 20, 14, 0, 7); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      txt('GPS ✓', -170, -88, `700 30px ${MONO}`, C.grn, 'left');
      txt('ON', 170, -88, `700 26px ${MONO}`, C.mute, 'right');
      txt('NEXT: SIGNAL', 0, 66, `700 26px ${MONO}`, '#ffffff');
    });
    ctx.restore();
  }
  chip(540 + shake(t, kF + 0.05), 1165, 'FOG PASS', C.grn, P(t, kF - 0.05, kF + 0.25), { size: 54, h: 100 });
}

// ---------- scene 3: har signal usme pehle se save ----------
const DEV3 = [540, 850];
const ROWS = [['signal', 'SIGNAL', '2.4 km'], ['gate', 'PHATAK', '3.1 km'], ['signal', 'SIGNAL', '4.0 km']];
function sceneSave(t) {
  const t0 = LS(2), kS = CK('pehle se');
  // route strip on top: landmarks drop into the box
  const rf = P(t, t0, t0 + 0.3);
  ctx.save(); ctx.globalAlpha *= rf;
  railSide(470, 110, 970);
  ctx.restore();
  ROWS.forEach(([kind, , ], i) => {
    const ti = t0 + 0.15 + i * 0.3, fx = 260 + i * 280;
    popAt(fx, 470, P(t, ti, ti + 0.3), () => { if (kind === 'signal') miniSignal(0, 0, 1, C.grn); else miniGate(0, 0, 1); });
    const df = P(t, ti + 0.25, ti + 0.6);
    if (df > 0 && df < 1) { ctx.save(); ctx.globalAlpha *= 1 - df; disc(L(fx, DEV3[0], eio(df)), L(500, DEV3[1] - 120, eio(df)), 14, C.yel, 3); ctx.restore(); }
  });
  // the box, bigger: list of the next 3 landmarks
  const bf = P(t, t0 - 0.05, t0 + 0.3);
  ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 3);
  fogDevice(DEV3[0], DEV3[1], L(1.15, 1.42, eo(bf)), () => {
    txt('AAGE KYA HAI', -180, -106, `700 20px ${MONO}`, C.mute, 'left');
    ROWS.forEach(([kind, lab, dist], i) => {
      const ti = t0 + 0.4 + i * 0.3, f = P(t, ti, ti + 0.25); if (f <= 0) return;
      const yy = -60 + i * 52;
      ctx.save(); ctx.globalAlpha *= f; ctx.translate(L(40, 0, eo(f)), 0);
      if (kind === 'signal') miniSignal(-160, yy + 20, 0.36, C.grn); else miniGate(-150, yy + 18, 0.36);
      txt(lab, -120, yy, `700 26px ${MONO}`, '#ffffff', 'left');
      txt(dist, 90, yy, `700 24px ${MONO}`, C.yel, 'right');
      if (t > kS + 0.1 * i) tickMark(150, yy, 16 * back(P(t, kS + 0.1 * i, kS + 0.1 * i + 0.25)), C.grn);
      ctx.restore();
    });
  });
  ctx.restore();
  chip(540, 1250, 'PEHLE SE SAVE', C.grn, P(t, kS + 0.05, kS + 0.35), { size: 44, h: 88 });
}

// ---------- scene 4: 500 meter pehle bolta: signal aa raha ----------
const R4 = 1240, SIG4 = 950;
function sceneAlert(t) {
  const t0 = LS(3), kA = CK('signal aa');
  const d = Math.round(L(900, 500, eo(P(t, t0, kA - 0.2))) / 10) * 10;
  const alert = t > kA - 0.15;
  // track + signal in fog + train creeping in
  const tf = P(t, t0, t0 + 0.3);
  ctx.save(); ctx.globalAlpha *= tf;
  railSide(R4);
  signalPost(SIG4, R4, 120, '');
  const nx = L(170, 520, eo(P(t, t0, kA)));
  trainSide(nx, R4, 0.62, { cars: 3, kind: 'slow', full: true });
  fogLayer(t, 0, 1000, W, 200, 11, 0.42, 120, 13, false);
  // distance bracket
  const by = 1300;
  line([[nx + 40, by], [SIG4, by]], '#ffffff', 5);
  line([[nx + 40, by - 18], [nx + 40, by + 18]], '#ffffff', 5); line([[SIG4, by - 18], [SIG4, by + 18]], '#ffffff', 5);
  chip((nx + 40 + SIG4) / 2, by, `${d} m`, alert ? C.yel : '#ffffff', 1, { size: 32, h: 62 });
  ctx.restore();
  // the box talks
  const bf = P(t, t0 + 0.05, t0 + 0.4);
  ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 3);
  fogDevice(540, 540, 0.85 * back(bf), () => {
    miniSignal(-130, 50, 0.9, '');
    txt('SIGNAL', 40, -60, `700 30px ${MONO}`, C.mute);
    txt(`${d} m`, 40, 10, `800 76px ${SANS}`, alert ? C.yel : '#ffffff');
  });
  ctx.restore();
  soundWaves(760, 520, 1, t, P(t, kA - 0.2, kA));
  bubble(540 + shake(t, kA + 0.1), 790, 'SIGNAL AA RAHA!', C.yel, P(t, kA - 0.1, kA + 0.2));
}

// ---------- scene 5: laal-hara aankh se hi dikhe ----------
function sceneEye(t) {
  const t0 = LS(4), kL = CK('Laal-hara');
  const f = P(t, t0, t0 + 0.35);
  ctx.save(); ctx.globalAlpha *= f;
  // big signal in the fog, lamps switching red / green
  const st = Math.floor((t - t0) * 2.4) % 2 ? C.red : C.grn;
  ctx.save(); ctx.translate(330, 1250); ctx.scale(1.9, 1.9);
  railSide(0, -200, 200);
  signalPost(0, 0, 210, st === C.red ? 'red' : 'green');
  ctx.restore();
  for (const [fx, fy, rw, rh, sp] of [[230, 740, 170, 44, 18], [430, 900, 190, 50, -14], [260, 1080, 210, 52, 10]]) {
    ctx.beginPath(); ctx.ellipse(fx + Math.sin(t * 0.9 + fy) * sp, fy, rw, rh, 0, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
  }
  ctx.restore();
  // the eye looks at it
  const ef = P(t, t0 + 0.2, t0 + 0.55);
  if (ef > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, ef * 3);
    line([[660, 575], [380, 700]], '#ffffff', 5, [16, 14]);
    eye(780, 560, 0.85 * back(ef), [-24, 6], INK);
    ctx.restore();
  }
  chip(780, 700, 'SIRF AANKH SE', C.yel, P(t, kL + 0.35, kL + 0.65), { size: 34, h: 70 });
  // the box can't tell the colour
  const bf = P(t, kL + 0.6, kL + 0.95);
  if (bf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 3);
    fogDevice(790, 1030, 0.6 * back(bf), () => {
      txt('RANG?', -10, -20, `800 70px ${SANS}`, '#ffffff');
      txt('pata nahi', -10, 50, `700 30px ${MONO}`, C.mute);
    });
    crossMark(950, 900, 34 * back(P(t, kL + 0.85, kL + 1.1)), C.red);
    ctx.restore();
  }
}

// ---------- scene 6: isliye 75 max, train LATE ----------
const G6 = [540, 760, 270];
function sceneSpeed(t) {
  const t0 = CK('isliye 75'), kT = CK('train LATE');
  const f = P(t, t0 - 0.1, t0 + 0.3);
  const v = L(110, 75, eio(P(t, t0 + 0.15, t0 + 1.0)));
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2);
  ctx.translate(G6[0], G6[1]); const s = L(0.85, 1, back(f)); ctx.scale(s, s); ctx.translate(-G6[0], -G6[1]);
  gauge(G6[0], G6[1], G6[2], v);
  ctx.restore();
  chip(540 + shake(t, t0 + 1.0), 420, 'MAX 75 km/h', C.red, P(t, t0 + 0.75, t0 + 1.05), { size: 40, h: 82 });
  // departure board: your train is late
  const bf = P(t, kT - 0.1, kT + 0.2);
  if (bf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 3);
    ctx.translate(540 + shake(t, kT + 0.1, 0.4, 10), 1180); const bs = back(bf); ctx.scale(bs, bs);
    card(-380, -105, 760, 210, 30, '#1d2447', 6, 10);
    txt('TUMHARI TRAIN', -330, -40, `700 34px ${MONO}`, C.yel, 'left');
    txt('LATE', -330, 38, `800 76px ${SANS}`, C.red, 'left');
    clockIcon(250, 0, 62, t * 4, C.yel);
    ctx.restore();
  }
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneDevice], [LS(2), LS(3), sceneSave],
          [LS(3), LS(4), sceneAlert], [LS(4), CK('isliye 75'), sceneEye], [CK('isliye 75'), LS(n) - 0.4, sceneSpeed],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('kuch nahi') + 0.3, 540, 650, [C.yel, '#ffffff', C.cyan], 22, 1.1);
  burst(t, CK('Fog Pass'), 540, 1165, [C.grn, C.yel, '#ffffff'], 28, 1.3);
  burst(t, CK('signal aa'), 540, 790, [C.yel, C.org, '#ffffff'], 28, 1.3);
  burst(t, CK('isliye 75') + 0.8, 540, 420, [C.red, C.org, C.yel], 24, 1.1);
  burst(t, CK('train LATE') + 0.1, 540, 1180, [C.red, C.org, C.yel], 30, 1.4);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈✓')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
