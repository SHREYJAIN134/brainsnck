window.BG = '#2f6b70';
// "Ticket confirm nahi hua, phir bhi paise kyun kate?" — 1080x1920, synced to window.TL (helpers from maps.js + current_booking.js)
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
window.TOPIC = 'WL Refund';
function STEPS() { return [[0, 'PAISE KATE'], [LS(2), 'ASLI RAAZ'], [LS(5), 'BADA KHEL']]; }
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


// ---------- phone + chip helpers (from the cab surge reel) ----------
function chipW(x, y, label, col, t, a, b, opts = {}) {
  const fo = 1 - P(t, b - 0.2, b); if (fo <= 0) return;
  ctx.save(); ctx.globalAlpha *= fo; chip(x + shake(t, a, 0.4, 6), y, label, col, P(t, a, a + 0.3), opts); ctx.restore();
}
const PW = 420, PHH = 800;
function phone(cx, cy, s, screen) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  hardShadow(-PW / 2, -PHH / 2, PW, PHH, 62, 12);
  rr(-PW / 2, -PHH / 2, PW, PHH, 62); ctx.fillStyle = '#1b2148'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  rr(-PW / 2 + 20, -PHH / 2 + 20, PW - 40, PHH - 40, 46); ctx.fillStyle = C.box; ctx.fill();
  ctx.save(); rr(-PW / 2 + 20, -PHH / 2 + 20, PW - 40, PHH - 40, 46); ctx.clip(); screen(); ctx.restore();
  rr(-PW / 2 + 20, -PHH / 2 + 20, PW - 40, PHH - 40, 46); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  rr(-48, -PHH / 2 + 32, 96, 24, 12); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

// ---------- extra flat drawings (original, no logos) ----------
function rupeeNote(x, y, s, label, col = C.grn) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-230, -110, 460, 220, 22, col, 6, 10);
  rr(-200, -82, 400, 164, 14); ctx.lineWidth = 4; ctx.strokeStyle = hexA(INK, 0.45); ctx.stroke();
  disc(0, 0, 58, '#ffffff', 0);
  txt('₹', 0, 4, SANSB(70), INK);
  if (label) { txt(label, -150, -50, `700 26px ${MONO}`, INK); txt(label, 150, 52, `700 26px ${MONO}`, INK); }
  ctx.restore();
}
// scissors pointing right, centred on the pivot; open = 0..1
function scissors(x, y, s, open, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const a = 0.08 + 0.32 * open;
  for (const sg of [1, -1]) {
    ctx.save(); ctx.rotate(sg * a);
    // blade
    ctx.beginPath(); ctx.moveTo(-10, -12 * sg); ctx.lineTo(150, 0); ctx.lineTo(-10, 12 * sg); ctx.closePath();
    ctx.fillStyle = '#e8ecf6'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    // handle ring
    ctx.beginPath(); ctx.ellipse(-70, 26 * sg, 44, 30, 0, 0, 7); ctx.lineWidth = 18; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-70, 26 * sg, 44, 30, 0, 0, 7); ctx.lineWidth = 10; ctx.strokeStyle = C.red; ctx.stroke();
    line([[-28, 14 * sg], [-6, 6 * sg]], INK, 14);
    ctx.restore();
  }
  disc(0, 0, 11, C.yel, 0);
  ctx.restore();
}
// villain clerk at a counter window
function clerkBooth(x, y, s, t, grin) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-260, -250, 520, 470, 34, C.box, 6, 12);
  band(-260, -250, 520, 88, 34, C.yel);
  txt('CLERKAGE', 0, -204, SANSB(50), INK);
  // window
  rr(-190, -130, 380, 230, 22); ctx.fillStyle = '#e9edf8'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); rr(-190, -130, 380, 230, 22); ctx.clip();
  // the clerk: body + face with a sly grin
  ctx.beginPath(); ctx.ellipse(0, 120, 110, 80, 0, Math.PI, 0); ctx.fillStyle = '#4b5694'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  disc(0, -6, 58, SKIN_C, 0);
  ctx.beginPath(); ctx.arc(-20, -18, 7, 0, 7); ctx.arc(20, -18, 7, 0, 7); ctx.fillStyle = INK; ctx.fill();
  line([[-34, -36], [-10, -30]], INK, 6); line([[34, -36], [10, -30]], INK, 6);   // sly brows
  ctx.beginPath(); ctx.arc(0, 4, 26 + 4 * grin, 0.12 * Math.PI, 0.88 * Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
  // window bars + cash tray
  for (const bx of [-95, 0, 95]) line([[bx, -128], [bx, -60]], hexA(INK, 0.5), 5);
  rr(-150, 110, 300, 60, 14); ctx.fillStyle = '#8a90b8'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  txt('₹60 / PASSENGER', 0, 141, `700 28px ${MONO}`, '#ffffff');
  ctx.restore();
}
const SKIN_C = '#e6b48a';
function lockBig(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(0, -30, 44, Math.PI, 0); ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -30, 44, Math.PI, 0); ctx.lineWidth = 12; ctx.strokeStyle = '#c9cde6'; ctx.stroke();
  card(-70, -32, 140, 110, 20, col, 6, 7);
  disc(0, 12, 14, INK, 0); ctx.fillStyle = INK; ctx.fillRect(-5, 14, 10, 30);
  ctx.restore();
}
function vault(x, y, s, t, open) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-230, -200, 460, 400, 40, '#8a90b8', 6, 12);
  rr(-200, -170, 400, 340, 28); ctx.fillStyle = '#5b6290'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  // dial
  disc(0, 0, 92, '#c9cde6', 6);
  ctx.save(); ctx.rotate(t * 1.4 * open);
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); line([[0, 0], [0, -74]], INK, 12); }
  ctx.restore();
  disc(0, 0, 26, C.yel, 0);
  txt('RAILWAY', 0, 136, SANSB(40), '#ffffff');
  ctx.restore();
}
function coin(x, y, r, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  disc(0, 0, r, C.yel, 4); txt('₹', 0, 2, SANSB(r * 1.1), INK);
  ctx.restore();
}
function miniWL(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  card(-70, -40, 140, 80, 12, '#ffffff', 4, 5);
  ctx.fillStyle = C.org; ctx.fillRect(-66, -36, 132, 18);
  txt('WL', 0, 12, SANSB(30), INK);
  ctx.restore();
}

// ---------- scene 1: tumhara WL ticket... confirm nahi hua ----------
function sceneHook(t) {
  const kT = CK('Tumhara WL'), kN = CK('confirm nahi');
  const bf = P(t, 0, 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 2); ctx.translate(shake(t, kN + 0.35, 0.45, 10), L(-50, 0, eo(bf)));
  ticketCard(540, 780, 860, 640, C.cyan, 'DELHI  →  PATNA', 470);
  faceX(250, 640, 0.95, C.grn, { mood: t > kN + 0.25 ? 1 : 0 });
  if (t > kN + 0.5) sweat(320, 575, t);
  txt('TUMHARA TICKET', 370, 600, `700 28px ${MONO}`, '#7d83a8', 'left');
  txt('SLEEPER', 370, 668, SANSB(60), INK, 'left');
  txt('STATUS', 200, 810, `700 28px ${MONO}`, '#7d83a8', 'left');
  txt('PNR 24•••••81', 540, 1030, `700 30px ${MONO}`, '#7d83a8');
  ctx.restore();
  statusPill(560, 810, 'WL 40', C.org, P(t, kT + 0.55, kT + 0.85), 54);
  // "confirm?" → red cross
  popAt(800, 810, P(t, kN + 0.3, kN + 0.55), () => crossMark(0, 0, 50, C.red));
  chipW(540, 1260, 'CONFIRM NAHI HUA', C.red, t, kN + 0.4, 99, { size: 36, h: 80 });
  chipW(540, 380, 'CHART KA INTEZAAR...', C.yel, t, kT + 0.2, kN + 0.2, { size: 30, h: 68 });
}

// ---------- scene 2: phir bhi ₹60 KAT gaye ----------
function sceneCut(t) {
  const kP = CK('Phir bhi'), kK = CK('KAT gaye');
  const nf = P(t, kP - 0.1, kP + 0.25);
  const cutU = eio(P(t, kK - 0.35, kK + 0.15));             // scissors travel down the cut line
  const fall = P(t, kK + 0.15, kK + 1.0);                   // cut piece falls away
  const CX = 760;                                            // cut line x
  // the note: left part stays, right part (₹60) falls after the cut
  popAt(540, 820, nf, () => {
    ctx.save(); ctx.beginPath(); ctx.rect(-400, -200, CX - 540 + 400, 400); ctx.clip();
    rupeeNote(0, 0, 1.45, 'REFUND'); ctx.restore();
    ctx.save();
    const fx = 30 * eo(fall), fy = 520 * fall * fall, fr = 0.5 * fall;
    ctx.translate(CX - 540 + fx, fy); ctx.rotate(fr); ctx.translate(-(CX - 540), 0);
    ctx.globalAlpha *= 1 - P(fall, 0.7, 1);
    ctx.beginPath(); ctx.rect(CX - 540, -200, 400, 400); ctx.clip();
    rupeeNote(0, 0, 1.45, 'REFUND'); ctx.restore();
    // dashed cut line
    if (t > kP + 0.2 && fall <= 0) line([[CX - 540, -170], [CX - 540, 170]], INK, 5, [14, 12]);
  });
  // scissors move down along the cut
  if (t > kK - 0.45 && t < kK + 0.6) {
    const sy = L(820 - 250, 820 + 230, cutU);
    ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, kK - 0.45, kK - 0.3)) * (1 - P(t, kK + 0.35, kK + 0.6));
    scissors(CX, sy, 1.0, 0.5 + 0.5 * Math.sin(t * 22), Math.PI / 2);
    ctx.restore();
  }
  chipW(540, 420, 'TICKET TOH MILA NAHI...', C.yel, t, kP + 0.05, kK - 0.1, { size: 30, h: 68 });
  stamp(560, 1210, '-₹60 KATE!', C.red, P(t, kK + 0.15, kK + 0.37), t, kK + 0.37, 80, -0.08);
}

// ---------- scene 3: chart bante hi ticket khud cancel ----------
function sceneChart(t) {
  const kCh = CK('Chart bante'), kC = CK('ticket khud');
  const cf = P(t, kCh - 0.15, kCh + 0.25);
  if (cf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, cf * 2); ctx.translate(L(300, 0, eo(cf)), 0);
    card(150, 420, 780, 760, 34, '#ffffff', 6, 10);
    band(150, 420, 780, 80, 34, C.yel);
    txt('RESERVATION CHART', 540, 462, `700 34px ${MONO}`, INK);
    clockIcon(840, 462, 26, t);
    const rows = [['S1-12', 'CNF', C.grn], ['S3-34', 'CNF', C.grn], ['S5-07', 'CNF', C.grn], ['S7-61', 'CNF', C.grn], ['WL 40', '✗', C.red]];
    rows.forEach(([a, b, col], i) => {
      const rf = P(t, kCh + 0.1 + i * 0.1, kCh + 0.3 + i * 0.1); if (rf <= 0) return;
      const ry = 545 + i * 110;
      ctx.save(); ctx.globalAlpha *= rf;
      rr(200, ry, 680, 84, 18); ctx.fillStyle = i === 4 ? hexA(C.red, 0.28) : '#eef0fa'; ctx.fill();
      if (i === 4) { ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
      txt(a, 250, ry + 43, `700 36px ${MONO}`, INK, 'left');
      rr(700, ry + 14, 140, 56, 28); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      txt(b, 770, ry + 43, `800 32px ${SANS}`, INK);
      ctx.restore();
    });
    ctx.restore();
  }
  stamp(540, 1000, 'AUTO CANCEL', C.red, P(t, kC + 0.35, kC + 0.57), t, kC + 0.57, 76, -0.1);
  chipW(540, 1300, 'NAAM CHART SE BAAHAR', C.org, t, kC + 0.6, 99, { size: 32, h: 72 });
}

// ---------- scene 4: ye clerkage hai... har passenger pe ₹60 ----------
const PAX = [[230, 1080, C.grn, 'TUM'], [540, 1080, C.cyan, 'DOST'], [850, 1080, C.org, 'BHAI']];
function sceneClerk(t) {
  const kY = CK('Ye clerkage'), kH = CK('har passenger');
  const bf = P(t, kY - 0.15, kY + 0.25);
  popAt(540, 640, bf, () => clerkBooth(0, 0, 1, t, P(t, kH + 0.6, kH + 1.2)));
  // three passengers, each pays ₹60 into the booth
  PAX.forEach(([x, y, col, lab], i) => {
    const pf = P(t, kH - 0.2 + i * 0.12, kH + 0.1 + i * 0.12);
    popAt(x, y, pf, () => {
      faceX(0, 0, 0.82, col, { mood: t > kH + 0.45 + i * 0.22 ? 1 : 0 });
      txt(lab, 0, 86, `700 28px ${MONO}`, '#ffffff');
    });
    // a -₹60 chip flies from the passenger into the cash tray
    const st = kH + 0.35 + i * 0.22, v = P(t, st, st + 0.5);
    if (v > 0 && v < 1) {
      const fx = L(x, 540, eio(v)), fy = L(y - 110, 780, eio(v)) - 120 * Math.sin(v * Math.PI);
      ctx.save(); ctx.globalAlpha *= 1 - P(v, 0.85, 1); chip(fx, fy, '-₹60', C.red, 1, { size: 32, h: 64 }); ctx.restore();
    }
    if (t > st) {
      ctx.save(); ctx.globalAlpha *= P(t, st, st + 0.2);
      chip(x, y - 112, '-₹60', C.red, 1, { size: 28, h: 56 }); ctx.restore();
    }
  });
  chipW(540, 1300, '3 PASSENGER = -₹180', C.yel, t, kH + 1.05, 99, { size: 34, h: 76 });
  chipW(540, 1390, 'AC me upar se GST', '#ffffff', t, kH + 1.25, 99, { size: 24, h: 52 });
}

// ---------- scene 5: IRCTC fee bhi wapas nahi ----------
function feeScreen(t, kF, kW) {
  ctx.fillStyle = '#2c356b'; ctx.fillRect(-210, -400, 420, 800);
  ctx.fillStyle = INK; ctx.fillRect(-210, -400, 420, 92);
  txt('Refund details', -170, -322, `800 30px ${SANS}`, '#ffffff', 'left');
  const rows = [['Kiraya', 'refund', C.grn], ['Clerkage', '-₹60', C.red], ['IRCTC fee', 'refund ✗', C.red]];
  rows.forEach(([a, b, col], i) => {
    const rf = P(t, kF - 0.3 + i * 0.15, kF - 0.05 + i * 0.15); if (rf <= 0) return;
    const ry = -250 + i * 150, hi = i === 2 && t > kF;
    ctx.save(); ctx.globalAlpha *= rf;
    card(-180, ry, 360, 118, 22, hi ? C.yel : '#ffffff', 5, 5);
    txt(a, -150, ry + 42, `800 32px ${SANS}`, INK, 'left');
    txt(b, -150, ry + 86, `700 26px ${MONO}`, col === C.grn ? '#2f7d4f' : '#c2413e', 'left');
    ctx.restore();
  });
}
function sceneFee(t) {
  const kF = CK('IRCTC fee'), kW = CK('wapas nahi');
  const pf = P(t, kF - 0.25, kF + 0.15);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(350, 860, L(0.84, 0.92, back(pf)), () => feeScreen(t, kF, kW));
  ctx.restore();
  // lock on the fee: non-refundable
  popAt(830, 760, P(t, kF + 0.35, kF + 0.65), () => lockBig(0, 0, 1.25, C.org));
  // refund arrow back to you, banned
  const af = P(t, kW - 0.15, kW + 0.15);
  if (af > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, af * 3);
    ctx.beginPath(); ctx.arc(830, 1060, 90, Math.PI * 1.1, Math.PI * 1.9 + 0.0001); ctx.lineWidth = 16; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(895, 965); ctx.lineTo(935, 1010); ctx.lineTo(880, 1020); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
  }
  banSign(830, 1040, 110, P(t, kW + 0.1, kW + 0.35));
  stamp(540, 1340, 'WAPAS NAHI', C.red, P(t, kW + 0.2, kW + 0.42), t, kW + 0.42, 70, -0.06);
  chipW(540, 400, 'NON-REFUNDABLE', C.org, t, kF + 0.45, 99, { size: 32, h: 72 });
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

// ---------- scene 6: 3 saal me railway ne aise ₹1,229 crore kamaye ----------
function sceneCrore(t) {
  const k3 = CK('3 saal'), kA = CK('aise ₹1,229'), kK = CK('kamaye');
  // years flip on the left
  const yrs = ['2021', '2022', '2023'];
  yrs.forEach((y, i) => {
    const st = k3 + 0.15 + i * 0.3;
    chipW(220 + i * 320, 400, y, C.cyan, t, st, 99, { size: 34, h: 74 });
  });
  // vault + WL tickets and coins falling in
  const vf = P(t, k3 + 0.5, k3 + 0.9);
  popAt(540, 800, vf, () => vault(0, 0, 1, t, 1));
  for (let i = 0; i < 12; i++) {
    const st = k3 + 0.9 + i * 0.16, v = P(t, st, st + 0.7);
    if (v <= 0 || v >= 1) continue;
    const x0 = 260 + 560 * hash(i, 4), y = L(470, 780, v * v), x = L(x0, 540, eio(v));
    ctx.save(); ctx.globalAlpha *= 1 - P(v, 0.8, 1);
    if (i % 2) miniWL(x, y, 0.9, (hash(i, 2) - 0.5) * 1.2 + v * 2); else coin(x, y, 34, v * 4);
    ctx.restore();
  }
  // counter
  const u = eo(P(t, kA - 0.1, kA + 1.1));
  const val = Math.round(1229 * u);
  popAt(540, 1180, P(t, kA - 0.25, kA + 0.05), () => {
    card(-380, -95, 760, 190, 36, C.box, 6, 12);
    txt('₹' + val.toLocaleString('en-IN') + ' CRORE', shake(t, kA + 1.1, 0.5, 8), 4, SANSB(84), u > 0.98 ? C.yel : '#ffffff');
  });
  chipW(540, 1360, 'RTI · 2021 se JAN 2024 · 12.8 CR TICKETS', '#ffffff', t, kA + 0.4, 99, { size: 24, h: 54 });
  stamp(800, 590, 'KAMAI!', C.grn, P(t, kK - 0.2, kK + 0.02), t, kK + 0.02, 64, 0.1);
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneCut], [LS(2), LS(3), sceneChart],
          [LS(3), LS(4), sceneClerk], [LS(4), LS(5), sceneFee], [LS(5), LS(n) - 0.4, sceneCrore],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('KAT gaye') + 0.37, 560, 1210, [C.red, C.org, C.yel], 28, 1.3);
  burst(t, CK('ticket khud') + 0.57, 540, 1000, [C.red, C.org, '#ffffff'], 28, 1.3);
  burst(t, CK('har passenger') + 1.05, 540, 1300, [C.yel, C.red, '#ffffff'], 24, 1.2);
  burst(t, CK('kamaye') + 0.02, 800, 590, [C.grn, C.yel, '#ffffff'], 30, 1.5);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈✗✓')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
