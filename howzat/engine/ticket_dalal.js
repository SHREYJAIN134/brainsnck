window.BG = '#3a4f7a';
// "Tumhe WAITING, dalal ke paas CONFIRM kaise?" (Ticket Dalal) — 1080x1920, synced to window.TL (helpers from maps.js + chain_pull.js)
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

// =====================================================================
// Ticket Dalal reel scenes
// =====================================================================
window.TOPIC = 'Ticket Dalal';
function STEPS() { return [[0, 'WAITING vs CONFIRM'], [LS(2), 'ANDAR KA CLERK'], [LS(3), 'NAKLI ID'], [LS(4), 'SEC 143']]; }

// ---------- ticket-dalal helpers (original, flat) ----------
// paper ticket centred at (x, y) with side notches; o: {status, scol, rows}
function ticketCard(x, y, w, h, o) {
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  const x0 = -w / 2, y0 = -h / 2;
  card(x0, y0, w, h, 26, '#f7f4ea', 6, 10);
  band(x0, y0, w, 78, 26, C.org);
  txt('E-TICKET', x0 + 40, y0 + 41, `800 38px ${SANS}`, INK, 'left');
  // little train icon
  ctx.save(); ctx.translate(x0 + w - 110, y0 + 40);
  rr(-46, -22, 92, 40, 10); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  for (const k of [-24, 0, 24]) { rr(k - 8, -14, 16, 14, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
  for (const k of [-26, 26]) { ctx.beginPath(); ctx.arc(k, 22, 8, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  ctx.restore();
  // notches
  for (const sx of [x0, x0 + w]) { ctx.beginPath(); ctx.arc(sx, y0 + h * 0.62, 26, 0, 7); ctx.fillStyle = BG; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.fillStyle = BG; ctx.fillRect(x0 - 30, y0 + h * 0.62 - 23, 27, 46); ctx.fillRect(x0 + w + 3, y0 + h * 0.62 - 23, 27, 46);
  line([[x0 + 40, y0 + h * 0.62], [x0 + w - 40, y0 + h * 0.62]], hexA(INK, 0.35), 4, [14, 10]);
  txt('PNR  24•• ••• 381', x0 + 40, y0 + 120, `700 28px ${MONO}`, hexA(INK, 0.7), 'left');
  txt('STATUS', x0 + 40, y0 + h * 0.62 + 52, `700 28px ${MONO}`, hexA(INK, 0.7), 'left');
  txt(o.status, x0 + w - 40, y0 + h * 0.62 + 52, `800 52px ${SANS}`, o.scol, 'right');
  ctx.restore();
}
// rubber stamp that slams down (f 0..1), rotated
function stampMark(x, y, label, col, f, rot = -0.18, size = 64) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const s = L(2.2, 1, eo(f)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 2.5);
  ctx.font = `800 ${size}px ${SANS}`; const w = ctx.measureText(label).width + 60, h = size + 40;
  rr(-w / 2, -h / 2, w, h, 18); ctx.fillStyle = hexA('#ffffff', 0.85); ctx.fill(); ctx.lineWidth = 10; ctx.strokeStyle = col; ctx.stroke();
  txt(label, 0, 4, `800 ${size}px ${SANS}`, col);
  ctx.restore();
}
function shoulders(x, y, s, col) {   // flat shirt under a face at (x, y)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-96, 150); ctx.quadraticCurveTo(-92, 58, 0, 52); ctx.quadraticCurveTo(92, 58, 96, 150); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function kuliMan(x, y, s, mood = 0, wink = false) {   // porter: red shirt, red head cloth, brass badge
  shoulders(x, y, s, C.red);
  faceX(x, y, s, C.org, { mood });
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-64, -30); ctx.quadraticCurveTo(-56, -90, 0, -92); ctx.quadraticCurveTo(56, -90, 64, -30); ctx.quadraticCurveTo(0, -52, -64, -30); ctx.closePath();
  ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  if (wink) { ctx.fillStyle = C.org; ctx.fillRect(8, -24, 26, 20); line([[10, -12], [32, -12]], INK, 6); }
  disc(-52, 104, 18, C.yel, 3);
  ctx.restore();
}
function clerkMan(x, y, s, mood = 0) {   // booking clerk: blue shirt, ID card on a lanyard
  shoulders(x, y, s, '#6f86c9');
  faceX(x, y, s, C.purple, { mood });
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-34, 56); ctx.lineTo(0, 108); ctx.lineTo(34, 56); ctx.lineWidth = 5; ctx.strokeStyle = C.red; ctx.stroke();
  rr(-20, 104, 40, 46, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function masterJi(x, y, s, mood = 0) {   // teacher: grey hair, glasses, kurta
  shoulders(x, y, s, '#f1efe6');
  faceX(x, y, s, C.yel, { hair: 'grey', glasses: true, mood });
}
function villager(x, y, s, mood = 0) {
  shoulders(x, y, s, C.grn);
  faceX(x, y, s, C.cyan, { hair: 'grey', mood });
}
function tumFace(x, y, s, mood = 0) {
  shoulders(x, y, s, '#ffffff');
  faceX(x, y, s, C.grn, { mood });
}
function qMarks(t, x, y, a, spread = 300) {   // floating question marks around (x, y)
  if (a <= 0) return;
  for (let k = 0; k < 5; k++) {
    const ang = k / 5 * Math.PI * 2 + 0.4, r = spread * (0.75 + 0.25 * hash(k, 2));
    const px = x + Math.cos(ang) * r, py = y + Math.sin(ang) * r * 0.55 + Math.sin(t * 3 + k) * 10;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(px, py); ctx.rotate(-0.25 + 0.5 * hash(k, 5));
    ctx.font = `800 ${60 + 20 * hash(k, 7)}px ${SANS}`; ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeText('?', 0, 0); ctx.fillStyle = k % 2 ? C.yel : '#ffffff'; ctx.fillText('?', 0, 0);
    ctx.restore();
  }
}
function chatBubble(x, y, w, label, f) {   // green chat message, right-aligned tail
  if (f <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 3); ctx.translate(x + L(-60, 0, eo(f)), y);
  hardShadow(0, -32, w, 64, 20, 5);
  rr(0, -32, w, 64, 20); ctx.fillStyle = '#c9f0c4'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt(label, 24, 2, `600 28px ${SANS}`, INK, 'left');
  line([[w - 58, 14], [w - 46, 22], [w - 30, 6]], '#3c8fd6', 4); line([[w - 44, 14], [w - 32, 22], [w - 16, 6]], '#3c8fd6', 4);
  ctx.restore();
}
function miniTicket(x, y, s, rot, col = '#f7f4ea') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  hardShadow(-70, -40, 140, 80, 12, 5);
  rr(-70, -40, 140, 80, 12); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = C.org; ctx.fillRect(-66, -36, 132, 18);
  line([[-50, 4], [50, 4]], hexA(INK, 0.4), 5); line([[-50, 22], [20, 22]], hexA(INK, 0.4), 5);
  ctx.restore();
}

// ---------- scene 1: Ticket WAITING... kuli bola: confirm chahiye? 500 extra! ----------
function sceneHook(t) {
  const kK = CK('kuli bola'), kC = CK('confirm chahiye'), k5 = CK('500 extra');
  const f = P(t, 0, 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2); ctx.translate(0, L(40, 0, eo(f)) + shake(t, 0.55, 0.4, 7));
  ticketCard(540, 560, 780, 330, { status: 'WL 47', scol: C.red });
  ctx.restore();
  stampMark(560, 520, 'WAITING', C.red, P(t, 0.45, 0.7), -0.16, 70);
  // tum, worried
  const tf = P(t, 0.25, 0.6);
  if (tf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, tf * 3);
    tumFace(250, 960, 1.0 * back(tf), t > 0.7 ? 1 : 0);
    ctx.restore();
    if (t > 0.8) sweat(310, 900, t);
    chip(250, 1150, 'TUM', C.grn, tf, { size: 28, h: 54 });
  }
  // the porter slides in and whispers
  const kf = eo(P(t, kK - 0.35, kK + 0.1));
  if (kf > 0) {
    const x = L(1260, 820, kf);
    kuliMan(x, 960 + Math.abs(Math.sin(t * 10)) * 8 * (1 - P(t, kK, kK + 0.2)), 1.0, 0, t > k5);
    chip(x, 1150, 'KULI', C.yel, P(t, kK, kK + 0.3), { size: 28, h: 54 });
  }
  const pf = win(t, kK - 0.05, kC + 0.05, 0.15, 0.15);
  if (pf > 0) {
    ctx.save(); ctx.globalAlpha *= pf; txt('psst...', 690, 860 - 20 * P(t, kK, kC), `800 40px ${SANS}`, '#ffffff'); ctx.restore();
  }
  bubble(660, 1290, 'CONFIRM CHAHIYE?', C.grn, P(t, kC - 0.05, kC + 0.25) * (1 - P(t, k5 - 0.12, k5)), 44);
  bubble(660, 1290, '₹500 EXTRA!', C.yel, P(t, k5 - 0.05, k5 + 0.25), 52);
  chip(790 + shake(t, k5 + 0.1), 770, '+₹500', C.red, P(t, k5, k5 + 0.3), { size: 44, h: 84 });
}

// ---------- scene 2: Ye ticket aaya kahan se? ----------
function sceneWhere(t) {
  const t0 = LS(1), kW = CK('kahan se');
  const f = P(t, t0, t0 + 0.35);
  qMarks(t, 540, 640, P(t, kW - 0.2, kW + 0.2), 500);
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2);
  ctx.translate(540, 640); ctx.scale(L(0.8, 1, back(f)), L(0.8, 1, back(f))); ctx.translate(-540, -640);
  ticketCard(540, 640, 780, 330, { status: 'CNF · B2 34', scol: '#2f8f4e', rot: -0.04 + Math.sin(t * 3) * 0.015 });
  ctx.restore();
  stampMark(600, 600, 'CONFIRM', '#2f8f4e', P(t, t0 + 0.25, t0 + 0.5), -0.2, 66);
  const pf = P(t, t0 + 0.05, t0 + 0.35);
  if (pf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
    kuliMan(840, 1060, 0.9 * back(pf), 0, true);
    tumFace(240, 1060, 0.9 * back(pf), 1);
    ctx.restore();
  }
  chip(540 + shake(t, kW + 0.1), 1300, 'KAHAN SE?', C.yel, P(t, kW - 0.05, kW + 0.25), { size: 64, h: 116, pad: 80 });
}

// ---------- scene 3: Booking clerk khud kaat raha tha! ----------
function sceneClerk(t) {
  const t0 = LS(2), kKh = CK('khud kaat'), kR = CK('raha tha');
  const f = P(t, t0, t0 + 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2); ctx.translate(0, L(50, 0, eo(f)));
  // reservation counter
  card(120, 370, 840, 640, 36, C.box, 6, 12);
  band(120, 370, 840, 96, 36, C.yel);
  txt('RESERVATION', 540, 420, `800 50px ${SANS}`, INK);
  rr(210, 510, 660, 380, 26); ctx.fillStyle = '#cfe8f3'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); rr(210, 510, 660, 380, 26); ctx.clip();
  clerkMan(540, 690, 1.15, 0);
  ctx.restore();
  for (const gx of [300, 780]) line([[gx, 520], [gx, 880]], hexA('#ffffff', 0.7), 6);
  rr(360, 900, 360, 40, 20); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
  // chat messages arrive (names over WhatsApp)
  const msgs = ['Naam + umar bheja', '2 ticket, AC', 'Kal ki confirm?'];
  msgs.forEach((m, i) => chatBubble(70, 1110 + i * 96, 400, m, P(t, t0 + 0.25 + i * 0.28, t0 + 0.5 + i * 0.28)));
  // tickets shoot out of the counter slot into a stack
  const nT = Math.floor(clamp((t - (kKh - 0.1)) / 0.12, 0, 15));
  for (let i = 0; i < nT; i++) {
    const ti = kKh - 0.1 + i * 0.12, u = eo(P(t, ti, ti + 0.3));
    const sx = 540, sy = 920, ex = 800 + (hash(i, 3) - 0.5) * 60, ey = 1260 - i * 6;
    miniTicket(L(sx, ex, u), L(sy, ey, u) - Math.sin(u * Math.PI) * 120, 1, L(0, (hash(i, 8) - 0.5) * 0.5, u));
  }
  chip(540 + shake(t, kKh + 0.1), 1030, 'CLERK KHUD!', C.red, P(t, kKh - 0.05, kKh + 0.25), { size: 44, h: 86 });
  chip(800, 1365, '15 TICKET', C.yel, P(t, kR + 0.1, kR + 0.4), { size: 32, h: 64 });
}

// ---------- scene 4: Master ji ne Aadhaar ke bahane phone liya... IRCTC ID bana li! ----------
function idScreen(t, kI, kB) {
  ctx.fillStyle = '#f2f4fb'; ctx.fillRect(-182, -372, 364, 744);
  ctx.fillStyle = C.org; ctx.fillRect(-182, -372, 364, 110);
  txt('NEW ACCOUNT', 0, -296, `800 34px ${SANS}`, INK);
  const fields = [['Naam', 'Gaon wale ka'], ['Mobile', '98••••••10'], ['OTP', '']];
  fields.forEach(([k, v], i) => {
    const y = -210 + i * 120, ff = P(t, kI + 0.05 + i * 0.22, kI + 0.3 + i * 0.22);
    txt(k, -150, y, `700 24px ${MONO}`, hexA(INK, 0.6), 'left');
    rr(-150, y + 18, 300, 58, 12); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    if (i < 2) txt(v.slice(0, Math.floor(v.length * ff)), -132, y + 48, `600 26px ${SANS}`, INK, 'left');
    else { const d = '4829'.slice(0, Math.floor(4 * ff)); txt(d.split('').join('  '), -132, y + 48, `700 30px ${MONO}`, INK, 'left'); }
  });
  const bf = P(t, kB - 0.1, kB + 0.2);
  rr(-150, 190, 300, 74, 37); ctx.fillStyle = bf > 0.5 ? C.grn : C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt(bf > 0.5 ? 'ID BAN GAYI' : 'CREATE ID', 0, 229, `800 30px ${SANS}`, INK);
}
function sceneFakeID(t) {
  const t0 = LS(3), kA = CK('Aadhaar ke'), kP = CK('phone liya'), kI = CK('IRCTC ID'), kB = CK('bana li');
  const f = P(t, t0, t0 + 0.35);
  const z = eio(P(t, kI - 0.35, kI + 0.1));            // 0: two people talking, 1: phone close-up
  // people
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2);
  const mx = L(280, 170, z), vx = L(800, 910, z), py = L(760, 620, z), ps = L(1.25, 0.8, z);
  masterJi(mx, py, ps * back(f), t > kB ? 0 : 0);
  villager(vx, py, ps * back(f), 0);
  ctx.restore();
  chip(mx, py + 200 * ps, 'MASTER JI', C.yel, P(t, t0 + 0.1, t0 + 0.4), { size: 26, h: 50 });
  bubble(L(330, 300, z), 1110, 'AADHAAR UPDATE?', '#ffffff', P(t, kA - 0.05, kA + 0.25) * (1 - P(t, kI - 0.3, kI - 0.05)), 42);
  // phone travels from the villager to master ji, then fills the screen
  const hand = eio(P(t, kP - 0.1, kP + 0.45));
  if (t > kA + 0.2) {
    const px = L(L(760, 360, hand), 540, z), pyy = L(L(980, 980, hand), 930, z), s = L(0.26, 0.72, z);
    phoneBody(px, pyy, s, () => idScreen(t, kI, kB));
  }
  qMarks(t, vx, py - 40, P(t, kB, kB + 0.3) * 0.9, 90);
  if (t > kB + 0.1) tickMark(540, 1225, 50 * back(P(t, kB + 0.1, kB + 0.35)), C.grn);
  chip(540 + shake(t, kB + 0.45), 410, 'BINA BATAYE!', C.red, P(t, kB + 0.35, kB + 0.65), { size: 40, h: 82 });
  chip(840, 1330, '10 E-TICKET', C.yel, P(t, kB + 0.6, kB + 0.9), { size: 30, h: 60 });
}

// ---------- scene 5: RPF ne pakda. Saza? Teen saal tak! ----------
function sceneCaught(t) {
  const t0 = LS(4), kS = CK('Saza'), kT = CK('Teen saal');
  const f = P(t, t0, t0 + 0.35);
  const caught = t > t0 + 0.4;
  const row = [[230, (x, y, s) => clerkMan(x, y, s, caught ? 1 : 0)], [540, (x, y, s) => kuliMan(x, y, s, caught ? 1 : 0)], [850, (x, y, s) => masterJi(x, y, s, caught ? 1 : 0)]];
  row.forEach(([x, fn], i) => {
    const ff = P(t, t0 + i * 0.08, t0 + 0.3 + i * 0.08);
    if (ff <= 0) return;
    ctx.save(); ctx.globalAlpha *= Math.min(1, ff * 3); fn(x, 640, 0.85 * back(ff)); ctx.restore();
  });
  chip(540, 420, 'RPF NE PAKDA!', C.grn, P(t, t0 + 0.2, t0 + 0.5), { size: 40, h: 82 });
  // bars slam down over the three
  const bf = P(t, kT - 0.12, kT + 0.18);
  if (bf > 0) {
    const y = L(-300, 660, eo(bf)) + (bf >= 1 ? -Math.sin(P(t, kT + 0.18, kT + 0.5) * Math.PI) * 16 : 0);
    jailBars(540 + shake(t, kT + 0.18, 0.4, 8), y, 900, 330, 1);
  }
  chip(540, 880, '25 TICKET · ₹1.16 LAKH', C.yel, P(t, t0 + 0.5, t0 + 0.8), { size: 32, h: 66 });
  // the law card
  const lf = P(t, kS - 0.1, kS + 0.2);
  if (lf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, lf * 3); ctx.translate(0, L(60, 0, eo(lf)));
    card(140, 980, 800, 340, 36, '#eef0f8', 6, 10);
    txt('RAILWAYS ACT · SECTION 143', 540, 1035, `700 28px ${MONO}`, INK);
    line([[190, 1070], [890, 1070]], hexA(INK, 0.3), 3);
    const r1 = P(t, kT - 0.05, kT + 0.25);
    if (r1 > 0) {
      ctx.save(); ctx.globalAlpha *= Math.min(1, r1 * 3); ctx.translate(L(40, 0, eo(r1)), 0);
      lockIcon(215, 1145, 2.0, C.red);
      txt('3 SAAL TAK JAIL', 275, 1145, `800 56px ${SANS}`, INK, 'left');
      ctx.restore();
    }
    const r2 = P(t, kT + 0.25, kT + 0.55);
    if (r2 > 0) {
      ctx.save(); ctx.globalAlpha *= Math.min(1, r2 * 3); ctx.translate(L(40, 0, eo(r2)), 0);
      txt('ya ₹10,000 tak fine (ya dono)', 540, 1245, `600 36px ${SANS}`, INK);
      ctx.restore();
    }
    ctx.restore();
  }
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneWhere], [LS(2), LS(3), sceneClerk],
          [LS(3), LS(4), sceneFakeID], [LS(4), LS(n) - 0.4, sceneCaught],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, 0.5, 560, 520, [C.red, C.org, C.yel], 24, 1.2);
  burst(t, CK('500 extra') + 0.1, 790, 770, [C.red, C.yel, '#ffffff'], 26, 1.2);
  burst(t, CK('kahan se'), 540, 1300, [C.yel, '#ffffff', C.cyan], 28, 1.3);
  burst(t, CK('khud kaat') + 0.1, 540, 1030, [C.red, C.org, C.yel], 26, 1.2);
  burst(t, CK('bana li') + 0.15, 540, 1225, [C.grn, C.yel, '#ffffff'], 26, 1.2);
  burst(t, CK('Teen saal') + 0.15, 540, 660, [C.red, C.org, C.yel], 32, 1.5);
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
