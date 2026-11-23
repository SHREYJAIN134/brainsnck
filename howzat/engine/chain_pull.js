window.BG = '#2f5f73';
// "Chain kheenchi, RPF ko coach kaise pata?" (Chain Pull) — 1080x1920, synced to window.TL (helpers from maps.js + fog_pass.js)
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

// ---------- shared helpers from fog_pass.js ----------
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

// =====================================================================
// Chain Pull reel scenes
// =====================================================================
window.TOPIC = 'Chain Pull';
function STEPS() { return [[0, 'CHAIN PULL'], [LS(2), 'HAWA NIKLI'], [LS(4), 'COACH MILA'], [LS(5), 'SEC 141']]; }

// ---------- chain-pull helpers (original, flat) ----------
function treesRow(off, a = 1) {   // flat jungle trees standing on y = 0 (group coords), slide left with off
  ctx.save(); ctx.globalAlpha *= a;
  for (let k = 0; k < 9; k++) {
    const span = 2000, x = ((k * 230 + 60 * hash(k, 1) - off * 0.55) % span + span) % span - 480;
    const h = 170 + 90 * hash(k, 4), wd = 70 + 20 * hash(k, 6);
    line([[x, -6], [x, -56]], INK, 14);
    ctx.beginPath(); ctx.moveTo(x - wd, -46); ctx.lineTo(x, -46 - h); ctx.lineTo(x + wd, -46); ctx.closePath();
    ctx.fillStyle = hash(k, 2) > 0.5 ? '#6fb98a' : '#58a37a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
}
function railLong(off) {   // rail on y = 0 (group coords), wide enough for a zoomed-out group
  ctx.fillStyle = hexA(INK, 0.28); ctx.fillRect(-700, 4, W + 1400, 24);
  ctx.fillStyle = hexA(INK, 0.45); for (let x = -700 - (off % 46); x < W + 700; x += 46) ctx.fillRect(x, 2, 24, 12);
  line([[-700, 0], [W + 700, 0]], INK, 8);
}
// alarm chain on the coach wall; pull 0..1; returns the handle's top y (screen coords, unscaled group)
function chainHandle(x, y, s, pull) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const len = 210 + 80 * pull;
  for (let k = 0; k < 10; k++) {
    const yy = 34 + (k + 0.5) * len / 10;
    ctx.beginPath(); ctx.ellipse(0, yy, k % 2 ? 6 : 12, len / 20 + 4, 0, 0, 7);
    ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#d6dae6'; ctx.stroke();
  }
  card(-100, -40, 200, 76, 20, '#e9ecf6', 5, 6);
  txt('ALARM', 0, -1, `700 28px ${MONO}`, INK);
  const hy = 34 + len;
  hardShadow(-95, hy, 190, 50, 24, 7);
  rr(-95, hy, 190, 50, 24); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
  return y + hy * s;
}
function fist(x, y, s) {   // hand gripping from below, (x, y) = middle of the grip
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-38, 20, 76, 220, 34); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  rr(-72, -44, 144, 96, 40); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (const kx of [-34, 0, 34]) line([[kx, -44], [kx, -16]], INK, 5);
  rr(-80, -6, 50, 34, 16); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();   // thumb
  ctx.restore();
}
function rpfMan(x, y, s, mood = 0) {   // RPF officer: face + flat cap + badge
  faceX(x, y, s, C.org, { mood });
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-66, -38); ctx.quadraticCurveTo(-58, -92, 0, -96); ctx.quadraticCurveTo(58, -92, 66, -38); ctx.closePath();
  ctx.fillStyle = '#2b3566'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  rr(-74, -46, 148, 18, 9); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  disc(0, -70, 10, C.yel, 0);
  ctx.restore();
  chip(x, y + 92 * s, 'RPF', C.yel, 1, { size: 26, h: 46, pad: 34 });
}
const CR = { x0: 96, w: 210, g: 16, top: 640, h: 150 };
const coachX = i => CR.x0 + i * (CR.w + CR.g) + CR.w / 2;
function coachRow(hiF) {   // 4 coaches S1..S4 side by side; S3 gets highlighted with hiF
  const { x0, w, g, top, h } = CR, bot = top + h;
  railSide(bot + 34, 40, 1040);
  for (let i = 0; i < 4; i++) {
    const x = x0 + i * (w + g);
    if (i) line([[x - g - 6, bot - 44], [x + 6, bot - 44]], INK, 9);
    for (const wx of [x + 38, x + 76, x + w - 76, x + w - 38]) {
      ctx.beginPath(); ctx.arc(wx, bot + 18, 16, 0, 7); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.arc(wx, bot + 18, 5, 0, 7); ctx.fillStyle = '#8a90b8'; ctx.fill();
    }
    const hi = i === 2 ? hiF : 0;
    if (hi > 0) { rr(x - 16, top - 16, w + 32, h + 32, 34); ctx.lineWidth = 12 * hi; ctx.strokeStyle = C.yel; ctx.stroke(); }
    card(x, top, w, h, 22, hi > 0.5 ? C.yel : C.cyan, 5, 8);
    ctx.fillStyle = hi > 0.5 ? C.org : C.yel; ctx.fillRect(x + 4, top + h - 58, w - 8, 10);
    for (let k = 0; k < 3; k++) { rr(x + 22 + k * 60, top + 22, 46, 50, 9); ctx.fillStyle = '#e8f6fb'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
    txt(`S${i + 1}`, x + w / 2, top + h - 24, `800 34px ${SANS}`, INK);
  }
}
function puffs(t, t0, x, y, dirs, n, reach, a = 1) {   // flat air puffs leaving (x, y)
  if (t < t0) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (let k = 0; k < n; k++) {
    const u = ((t - t0) * 1.3 + k / n) % 1, d = dirs[k % dirs.length] + (hash(k, 3) - 0.5) * 0.5;
    const r = L(10, 34, u), px = x + Math.cos(d) * reach * u, py = y + Math.sin(d) * reach * u;
    ctx.globalAlpha = a * (1 - u) * Math.min(1, (t - t0) * 4);
    ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
}
function pGauge(x, y, r, v, label) {   // pressure gauge, v = 0..1
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, ang = u => L(a0, a1, clamp(u));
  ctx.beginPath(); ctx.arc(x + 10, y + 10, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = C.box; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.arc(x, y, r - 46, ang(0), ang(0.3)); ctx.lineWidth = 30; ctx.strokeStyle = C.red; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r - 46, ang(0.3), ang(1)); ctx.lineWidth = 30; ctx.strokeStyle = C.grn; ctx.stroke();
  for (let k = 0; k <= 10; k++) {
    const a = ang(k / 10), c = Math.cos(a), s = Math.sin(a);
    line([[x + c * (r - 72), y + s * (r - 72)], [x + c * (r - 92), y + s * (r - 92)]], '#ffffff', k % 5 ? 3 : 6);
  }
  const an = ang(v);
  line([[x - Math.cos(an) * 30, y - Math.sin(an) * 30], [x + Math.cos(an) * (r - 70), y + Math.sin(an) * (r - 70)]], INK, 20);
  line([[x - Math.cos(an) * 30, y - Math.sin(an) * 30], [x + Math.cos(an) * (r - 70), y + Math.sin(an) * (r - 70)]], C.yel, 10);
  disc(x, y, 26, C.yel, 0);
  txt(label, x, y + r * 0.5, `700 26px ${MONO}`, C.mute);
  txt(v > 0.5 ? 'FULL' : 'GIRA!', x, y + r * 0.3, `800 44px ${SANS}`, v > 0.5 ? C.grn : C.red);
}
function jailBars(x, y, w, h, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const n = 6;
  for (let k = 0; k < n; k++) {
    const bx = -w / 2 + 20 + k * (w - 40) / (n - 1);
    rr(bx - 11 + 6, -h / 2 + 6, 22, h, 11); ctx.fillStyle = INK; ctx.fill();
    rr(bx - 11, -h / 2, 22, h, 11); ctx.fillStyle = '#c9ced9'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }
  for (const by of [-h / 2 + 10, h / 2 - 34]) { hardShadow(-w / 2, by, w, 24, 12, 6); rr(-w / 2, by, w, 24, 12); ctx.fillStyle = '#9aa1b8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
}

// ---------- scene 1: train beech me ruki... kisi ne CHAIN kheenchi! ----------
function sceneHook(t) {
  const kC = CK('kisi ne'), kK = CK('kheenchi');
  // train in the jungle: runs, brakes, stops; then zooms out below the chain card
  const u = P(t, 0, 1.2), off = 700 * 1.2 * (u - u * u / 2);
  const m = eio(P(t, kC - 0.3, kC + 0.15));
  const ry = L(1110, 1335, m), sc = L(1, 0.62, m);
  ctx.save(); ctx.translate(540, ry + shake(t, kK + 0.05, 0.5, 6)); ctx.scale(sc, sc); ctx.translate(-540, 0);
  treesRow(off, 1);
  railLong(off);
  trainSide(930, 0, 0.92, { cars: 3, kind: 'slow', full: true });
  // brake sparks under the wheels while it stops
  const sp = win(t, 0.55, 1.25, 0.1, 0.2);
  if (sp > 0) for (let k = 0; k < 6; k++) {
    const wx = 930 - 92 - k * 290 * 0.92 / 2, a = -2.4 + 0.5 * hash(k, Math.floor(t * 20));
    line([[wx, -8], [wx + Math.cos(a) * 46 * sp, -8 + Math.sin(a) * 46 * sp]], C.yel, 6);
  }
  speedLines(930 - 3 * 314 * 0.92, -40, 260, 1 - P(t, 0.4, 1.0));
  ctx.restore();
  bubble(540, L(860, 760, m), 'RUK GAYI?!', C.yel, P(t, 1.0, 1.3) * (1 - P(t, kC - 0.25, kC)), 54);
  // the alarm chain on the coach wall
  const cf = P(t, kC - 0.15, kC + 0.25);
  if (cf <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, cf * 2);
  ctx.translate(540, 700); ctx.scale(L(0.9, 1, back(cf)), L(0.9, 1, back(cf))); ctx.translate(-540 + shake(t, kK + 0.05, 0.5, 10), -700);
  card(150, 350, 780, 720, 40, C.box, 6, 12);
  for (let k = 0; k < 2; k++) { rr(200 + k * 520, 420, 160, 200, 20); ctx.fillStyle = '#3a4578'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  const pull = eio(P(t, kK - 0.08, kK + 0.22));
  const hy = chainHandle(540, 410, 1, pull);
  const ff = P(t, kC + 0.15, kC + 0.5);
  if (ff > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(150, 350, 780, 720); ctx.clip();
    fist(540, hy + 25 + L(260, 0, eo(ff)), 1);
    ctx.restore();
  }
  ctx.restore();
  chip(540, 350, 'ALARM CHAIN', '#ffffff', P(t, kC, kC + 0.3), { size: 30, h: 62 });
  chip(540 + shake(t, kK + 0.1), 1070, 'KHEENCH DI!', C.red, P(t, kK + 0.05, kK + 0.35), { size: 44, h: 88 });
}

// ---------- scene 2: RPF seedha usi coach pe. Kaise? ----------
function sceneRPF(t) {
  const t0 = LS(1), kU = CK('usi coach pe'), kK = CK('Kaise');
  const f = P(t, t0, t0 + 0.3);
  ctx.save(); ctx.globalAlpha *= f; ctx.translate(L(80, 0, eo(f)), 0);
  coachRow(P(t, kU + 0.05, kU + 0.3));
  ctx.restore();
  // platform strip + the officer walking to S3
  ctx.save(); ctx.globalAlpha *= f;
  rr(40, 1180, 1000, 34, 17); ctx.fillStyle = hexA('#ffffff', 0.18); ctx.fill();
  ctx.restore();
  const w = eio(P(t, t0 + 0.15, kU + 0.1)), x = L(150, coachX(2), w);
  const bob = w < 1 ? Math.abs(Math.sin(t * 12)) * 14 : 0;
  ctx.save(); ctx.globalAlpha *= P(t, t0 + 0.05, t0 + 0.3);
  rpfMan(x, 1060 - bob, 0.9, 0);
  ctx.restore();
  const af = P(t, kU + 0.05, kU + 0.35);
  if (af > 0) {
    ctx.save(); ctx.globalAlpha *= af;
    line([[coachX(2), 960], [coachX(2), L(960, 870, eo(af))]], '#ffffff', 8, [16, 12]);
    ctx.beginPath(); ctx.moveTo(coachX(2) - 22, 892); ctx.lineTo(coachX(2), 860); ctx.lineTo(coachX(2) + 22, 892); ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }
  chip(540, 1290, 'USI COACH PE!', C.grn, P(t, kU + 0.1, kU + 0.4), { size: 40, h: 82 });
  chip(540 + shake(t, kK + 0.1), 440, 'KAISE?', C.yel, P(t, kK - 0.05, kK + 0.25), { size: 72, h: 130, pad: 80 });
}

// ---------- scene 3: chain valve kholti hai, brake ki hawa nikalti hai ----------
const VX3 = 540, VY3 = 900;
function sceneValve(t) {
  const t0 = LS(2), kV = CK('Chain valve') + 0.45, kH = CK('brake ki'), kN = CK('nikalti');
  const f = P(t, t0, t0 + 0.3);
  ctx.save(); ctx.globalAlpha *= f;
  // coach side with the chain inside
  card(110, 380, 860, 330, 36, C.cyan, 6, 10);
  for (let k = 0; k < 6; k++) { rr(150 + k * 132, 410, 92, 90, 14); ctx.fillStyle = '#e8f6fb'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.fillStyle = C.yel; ctx.fillRect(114, 640, 852, 16);
  for (const wx of [200, 280, 800, 880]) { ctx.beginPath(); ctx.arc(wx, 740, 26, 0, 7); ctx.fillStyle = INK; ctx.fill(); ctx.beginPath(); ctx.arc(wx, 740, 8, 0, 7); ctx.fillStyle = '#8a90b8'; ctx.fill(); }
  // wire: chain -> valve
  const wf = P(t, t0 + 0.15, kV);
  line(polyPart([[260, 540], [260, 600], [VX3, 600], [VX3, VY3 - 50]], Math.max(0.001, wf)), INK, 12);
  line(polyPart([[260, 540], [260, 600], [VX3, 600], [VX3, VY3 - 50]], Math.max(0.001, wf)), C.red, 5, [14, 10]);
  ctx.save(); ctx.translate(260, 455); ctx.scale(0.42, 0.42);
  disc(0, 0, 70, C.red, 6); txt('!', 0, 6, `800 90px ${SANS}`, INK);
  ctx.restore();
  // brake pipe
  hardShadow(30, VY3 - 22, 1020, 44, 22, 6);
  rr(30, VY3 - 22, 1020, 44, 22); ctx.fillStyle = '#d6dae6'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  // air inside the pipe: chevrons; before the valve opens they sit still, after it they rush to the valve
  const open = eio(P(t, kV, kV + 0.25));
  for (let k = 0; k < 12; k++) {
    let x = 70 + k * 86;
    if (open > 0) { const side = x < VX3 ? 1 : -1; x = x + side * ((t - kV) * 380 % 86); }
    if (Math.abs(x - VX3) < 60) continue;
    const dir = x < VX3 ? 1 : -1, s = open > 0 ? dir : 1;
    ctx.beginPath(); ctx.moveTo(x - 9 * s, VY3 - 12); ctx.lineTo(x + 9 * s, VY3); ctx.lineTo(x - 9 * s, VY3 + 12);
    ctx.lineWidth = 6; ctx.strokeStyle = open > 0 ? C.org : '#5b6290'; ctx.stroke();
  }
  ctx.restore();
  chip(210, VY3 + 80, 'BRAKE PIPE', '#ffffff', P(t, t0 + 0.2, t0 + 0.5), { size: 26, h: 52 });
  // air puffs out of the valve
  puffs(t, kH - 0.1, VX3, VY3 + 30, [Math.PI / 2, Math.PI / 2 - 0.7, Math.PI / 2 + 0.7, -0.2, Math.PI + 0.2], 16, 360, P(t, kH - 0.1, kH + 0.2));
  // the valve: lever turns from flat (closed) to upright (open)
  ctx.save(); ctx.globalAlpha *= f;
  ctx.translate(VX3, VY3);
  disc(0, 0, 58, C.yel, 6);
  ctx.rotate(-Math.PI / 2 * open);
  rr(-14, -112, 28, 100, 14); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.rotate(Math.PI / 2 * open);
  disc(0, 0, 18, INK, 0);
  ctx.restore();
  chip(820, VY3 - 110, 'VALVE KHULA', C.yel, P(t, kV + 0.05, kV + 0.35), { size: 30, h: 62 });
  bubble(800, 1150, 'PSSSHH!', '#ffffff', P(t, kH + 0.1, kH + 0.4), 50);
  chip(540, 1310, 'HAWA BAHAR!', C.org, P(t, kN, kN + 0.3), { size: 44, h: 88 });
}

// ---------- scene 4: pressure gira, train ruki ----------
function sceneGauge(t) {
  const t0 = LS(3), kP = CK('Pressure'), kR = CK('train ruki');
  const f = P(t, t0, t0 + 0.3);
  const v = L(0.92, 0.06, eio(P(t, kP + 0.1, kP + 0.75))) + Math.sin(t * 40) * 0.01 * (1 - P(t, kP + 0.75, kP + 1));
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2);
  ctx.translate(560, 700); const s = L(0.85, 1, back(f)); ctx.scale(s, s); ctx.translate(-560, -700);
  pGauge(560, 700, 250, v, 'BRAKE PIPE');
  ctx.restore();
  // loco pilot watching the gauge
  const df = P(t, t0 + 0.1, t0 + 0.4);
  if (df > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, df * 3);
    faceX(160, 470, 0.72 * back(df), C.org, { mood: t > kP + 0.4 ? 1 : 0 });
    ctx.restore();
    if (t > kP + 0.5) sweat(205, 425, t);
  }
  chip(560 + shake(t, kP + 0.6), 1035, 'PRESSURE GIRA!', C.red, P(t, kP + 0.45, kP + 0.75), { size: 40, h: 82 });
  // the train brakes to a halt
  const tf = P(t, t0 + 0.1, t0 + 0.4);
  ctx.save(); ctx.globalAlpha *= tf;
  railSide(1335);
  const nx = L(520, 860, eo(P(t, t0, kR + 0.25)));
  trainSide(nx, 1335, 0.55, { cars: 3, kind: 'slow', full: true });
  ctx.restore();
  chip(540, 1150, 'TRAIN RUKI', C.grn, P(t, kR + 0.1, kR + 0.4), { size: 40, h: 82 });
  if (t > kR + 0.2) tickMark(780, 1150, 40 * back(P(t, kR + 0.2, kR + 0.45)), C.grn);
}

// ---------- scene 5: hawa ki awaaz... usi coach se! ----------
function sceneHiss(t) {
  const t0 = LS(4), kU = CK('usi coach se');
  const f = P(t, t0, t0 + 0.3), cx = coachX(2);
  ctx.save(); ctx.globalAlpha *= f;
  coachRow(P(t, kU, kU + 0.25));
  ctx.restore();
  // hiss out of S3: puffs, waves and "sss"
  puffs(t, t0, cx, 820, [Math.PI / 2 - 0.9, Math.PI / 2 + 0.9, 0.2, Math.PI - 0.2], 12, 170, f);
  soundWaves(cx + 130, 700, 0.9, t, f);
  soundWaves(cx - 130, 700, -0.9, t, f);
  for (let k = 0; k < 3; k++) {
    const u = ((t - t0) * 0.9 + k / 3) % 1;
    ctx.save(); ctx.globalAlpha *= f * (1 - u) * (1 - P(t, kU - 0.1, kU + 0.15)); ctx.translate(cx - 70 + 70 * k, 600 - 150 * u); ctx.rotate(-0.1 + 0.1 * k);
    ctx.font = `800 46px ${SANS}`; ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeText('sss', 0, 0); ctx.fillStyle = '#ffffff'; ctx.fillText('sss', 0, 0);
    ctx.restore();
  }
  // officer listening, then spotting the coach
  const of = P(t, t0 + 0.1, t0 + 0.4);
  if (of > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, of * 3);
    rpfMan(200, 1110, 0.85 * back(of), 0);
    disc(262, 1100, 22, C.org, 4);   // hand cupped at the ear
    ctx.restore();
    soundWaves(330, 1080, -0.6, t, of * (1 - P(t, kU, kU + 0.3)));
  }
  const lf = P(t, kU + 0.05, kU + 0.35);
  if (lf > 0) {
    ctx.save(); ctx.globalAlpha *= lf;
    line(polyPart([[290, 1040], [cx, 900]], eo(lf)), '#ffffff', 7, [16, 12]);
    ctx.restore();
    pin(cx, L(540, 610, eo(lf)) - 10 * Math.abs(Math.sin(t * 6)), 1.25 * back(lf), C.red);
  }
  chip(620 + shake(t, kU + 0.15), 1280, 'YAHI COACH!', C.yel, P(t, kU + 0.1, kU + 0.4), { size: 44, h: 88 });
}

// ---------- scene 6: bina wajah? ek saal tak JAIL! ----------
function sceneJail(t) {
  const t0 = LS(5), kE = CK('Ek saal'), kJ = CK('JAIL');
  const f = P(t, t0, t0 + 0.3);
  const caught = t > kJ;
  // the prankster
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2);
  faceX(540, 720, 1.45 * back(f), C.pink, { mood: caught ? 1 : 0 });
  if (!caught) { ctx.save(); ctx.translate(540, 720); ctx.scale(1.45, 1.45); line([[18, -30], [40, -36]], INK, 6); line([[-40, -36], [-18, -30]], INK, 6); ctx.restore(); }
  ctx.restore();
  if (caught) sweat(640, 640, t);
  chip(540, 470, 'BINA WAJAH?', '#ffffff', P(t, t0 + 0.05, t0 + 0.35), { size: 40, h: 82 });
  // bars slam down
  const bf = P(t, kJ - 0.12, kJ + 0.18);
  if (bf > 0) {
    const y = L(-400, 720, eo(bf)) + (bf >= 1 ? -Math.sin(P(t, kJ + 0.18, kJ + 0.5) * Math.PI) * 18 : 0);
    jailBars(540 + shake(t, kJ + 0.18, 0.4, 8), y, 400, 360, 1);
  }
  // the law card
  const lf = P(t, t0 + 0.2, t0 + 0.5);
  if (lf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, lf * 3); ctx.translate(0, L(60, 0, eo(lf)));
    card(140, 1000, 800, 330, 36, '#eef0f8', 6, 10);
    txt('RAILWAYS ACT · SECTION 141', 540, 1055, `700 28px ${MONO}`, INK);
    line([[190, 1090], [890, 1090]], hexA(INK, 0.3), 3);
    const r1 = P(t, kE - 0.05, kE + 0.25);
    if (r1 > 0) {
      ctx.save(); ctx.globalAlpha *= Math.min(1, r1 * 3); ctx.translate(L(40, 0, eo(r1)), 0);
      lockIcon(220, 1160, 2.0, C.red);
      txt('1 SAAL TAK JAIL', 280, 1160, `800 54px ${SANS}`, INK, 'left');
      ctx.restore();
    }
    const r2 = P(t, kJ + 0.25, kJ + 0.55);
    if (r2 > 0) {
      ctx.save(); ctx.globalAlpha *= Math.min(1, r2 * 3); ctx.translate(L(40, 0, eo(r2)), 0);
      txt('ya ₹1,000 tak fine (ya dono)', 540, 1260, `600 36px ${SANS}`, INK);
      ctx.restore();
    }
    ctx.restore();
  }
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneRPF], [LS(2), LS(3), sceneValve],
          [LS(3), LS(4), sceneGauge], [LS(4), LS(5), sceneHiss], [LS(5), LS(n) - 0.4, sceneJail],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('kheenchi') + 0.1, 540, 1070, [C.red, C.org, C.yel], 26, 1.2);
  burst(t, CK('Kaise'), 540, 440, [C.yel, '#ffffff', C.cyan], 28, 1.3);
  burst(t, CK('nikalti'), 540, 1310, [C.org, '#ffffff', C.yel], 22, 1.1);
  burst(t, CK('train ruki') + 0.2, 780, 1150, [C.grn, C.yel, '#ffffff'], 24, 1.1);
  burst(t, CK('usi coach se') + 0.2, coachX(2), 600, [C.yel, C.red, '#ffffff'], 28, 1.3);
  burst(t, CK('JAIL') + 0.15, 540, 720, [C.red, C.org, C.yel], 32, 1.5);
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
