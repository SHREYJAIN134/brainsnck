window.BG = '#5a4e8c';
// "Lower berth maanga, upper kyun mila?" — 1080x1920, synced to window.TL (helpers from maps.js + waiting_list.js)
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
// Lower berth reel scenes
// =====================================================================
window.TOPIC = 'Lower Berth';
function STEPS() { return [[0, 'BERTH KA DRAMA'], [LS(2), 'ASLI RAAZ'], [LS(4), 'TUMHARI CHOICE']]; }
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

// ---------- scene 1: tumne lower berth maanga ... mila UPPER ----------
const BAY = [270, 640, 540, 640];   // x, y, w, h of the berth bay
const BUNK_Y = { UPPER: 700, MIDDLE: 885, LOWER: 1070 };
function sceneHook(t) {
  const kU = CK('mila UPPER'), tFly = kU + 0.05;
  // booking card
  const bf = P(t, 0, 0.3);
  ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 2); ctx.translate(0, L(-40, 0, eo(bf)));
  card(150, 330, 780, 220, 34, '#ffffff', 6, 10);
  faceX(250, 440, 0.62, TUMC());
  txt('BERTH PREFERENCE', 340, 400, `700 26px ${MONO}`, '#7d83a8', 'left');
  ctx.restore();
  chip(470, 470, 'LOWER', C.yel, P(t, 0.35, 0.65), { size: 34, h: 66 });
  popAt(610, 470, P(t, 0.6, 0.85), () => tickMark(0, 0, 26, C.grn));
  chip(800, 470, 'BOOK', C.cyan, P(t, 0.9, 1.15) * (1 - P(t, kU - 0.1, kU + 0.05)), { size: 28, h: 58 });
  // berth bay
  const [bx, by, bw, bh] = BAY;
  const pf = P(t, 0.15, 0.5);
  if (pf <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 2);
  card(bx, by, bw, bh, 36, C.box, 6, 12);
  for (const k of ['UPPER', 'MIDDLE', 'LOWER']) {
    const want = k === 'LOWER' && t < kU, got = k === 'UPPER' && t > kU + 0.35;
    bunk(bx + 50, BUNK_Y[k], bw - 100, 100, k, got ? C.red : want ? C.yel : '#e8e9f5');
  }
  // ladder
  line([[bx + bw - 30, by + 40], [bx + bw - 30, by + bh - 40]], '#aab0d6', 6);
  for (let k = 0; k < 9; k++) line([[bx + bw - 44, by + 70 + k * 60], [bx + bw - 16, by + 70 + k * 60]], '#aab0d6', 4);
  ctx.restore();
  // tum: wants lower, gets thrown up
  const u = eio(P(t, tFly, tFly + 0.45));
  const fy = L(BUNK_Y.LOWER + 50, BUNK_Y.UPPER + 50, u) - 60 * Math.sin(Math.PI * u);
  popAt(690, fy, P(t, 0.5, 0.8), () => faceX(0, 0, 0.55, TUMC(), { mood: t > kU + 0.4 ? 1 : 0 }));
  if (t > kU + 0.5) sweat(730, BUNK_Y.UPPER + 5, t);
  const sf = P(t, kU + 0.35, kU + 0.57);
  if (sf > 0) {
    ctx.save(); ctx.translate(540 + shake(t, kU + 0.35, 0.5, 12), 1345); ctx.rotate(-0.08); const s = L(2.2, 1, eo(sf)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, sf * 2);
    card(-170, -60, 340, 120, 24, C.red, 6, 9); txt('UPPER!', 0, 4, SANSB(76), INK); ctx.restore();
  }
}

// ---------- scene 2: bagal wali aunty ko ... bina maange LOWER ----------
function personCard(x, who, col, faceOpt, choice, choiceCol, got, gotCol, flipT, t) {
  card(x, 400, 440, 760, 38, C.box, 6, 12);
  band(x, 400, 440, 86, 38, col);
  txt(who, x + 220, 445, SANSB(42), INK);
  faceX(x + 220, 610, 0.95, col, faceOpt);
  txt('CHOICE', x + 220, 745, `700 24px ${MONO}`, C.mute);
  card(x + 70, 775, 300, 100, 26, choiceCol, 5, 6); txt(choice, x + 220, 828, `700 46px ${MONO}`, INK);
  txt('MILA', x + 220, 935, `700 24px ${MONO}`, C.mute);
  const u = flipT == null ? 1 : P(t, flipT, flipT + 0.25), done = u >= 0.5;
  ctx.save(); ctx.translate(x + 220, 1025); ctx.scale(Math.max(0.05, Math.abs(Math.cos(Math.PI * u))), 1);
  card(-150, -55, 300, 110, 26, done ? gotCol : '#c9cde6', 5, 7);
  txt(done ? got : '?', 0, 3, `700 ${done ? 50 : 56}px ${MONO}`, INK);
  ctx.restore();
}
function sceneAunty(t) {
  const t1 = LS(1), kL = CK('bina maange');
  popAt(290, 780, P(t, t1 - 0.2, t1 + 0.1), () => {
    ctx.translate(-290, -780);
    personCard(70, 'TUM', TUMC(), { mood: 1 }, 'LOWER', C.yel, 'UPPER', C.red, null, t);
  });
  popAt(790, 780, P(t, t1 + 0.15, t1 + 0.45), () => {
    ctx.translate(-790, -780);
    personCard(570, 'AUNTY', AUNTYC(), { hair: 'bun', glasses: true }, '---', '#c9cde6', 'LOWER', C.grn, kL + 0.15, t);
    popAt(940, 960, P(t, kL + 0.4, kL + 0.65), () => tickMark(0, 0, 32, C.grn));
  });
  chip(790, 1225, 'KOI CHOICE NAHI DI', '#ffffff', P(t, t1 + 0.7, t1 + 1.0) * (1 - P(t, kL + 0.6, kL + 0.75)), { size: 26, h: 56 });
  chip(540 + shake(t, kL + 0.75), 1235, 'BINA MAANGE?!', C.yel, P(t, kL + 0.75, kL + 1.05), { size: 34, h: 76 });
}

// ---------- scene 3: raaz: har coach me kuch lower reserved hain ----------
const RES = [0, 1, 3, 4, 6, 7];   // bays whose lower berth is reserved (6 of 8)
function sceneRaaz(t) {
  const t2 = LS(2), kR = CK('kuch lower');
  chip(540, 362, 'RAAZ', C.yel, P(t, t2, t2 + 0.3), { size: 40, h: 76 });
  const cf = P(t, t2 - 0.1, t2 + 0.3);
  if (cf <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, cf * 2); ctx.translate(L(-120, 0, eo(cf)), 0);
  // sleeper coach, side cut-away: 8 bays
  line([[40, 1000], [1040, 1000]], INK, 8);
  for (const wx of [170, 260, 820, 910]) { disc(wx, 975, 26, '#5b6290', 0); ctx.beginPath(); ctx.arc(wx, 975, 9, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  card(60, 470, 960, 480, 36, C.cyan, 6, 12);
  txt('SLEEPER COACH · S1', 540, 515, `700 28px ${MONO}`, INK);
  for (let b = 0; b < 8; b++) {
    const x = 92 + b * 113;
    rr(x, 550, 100, 370, 14); ctx.fillStyle = '#e8f6fb'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    const lit = RES.indexOf(b), f = lit >= 0 ? P(t, kR + 0.1 + lit * 0.09, kR + 0.3 + lit * 0.09) : 0;
    const ys = [575, 690, 805];
    ys.forEach((y, k) => {
      const low = k === 2;
      rr(x + 10, y, 80, 80, 10); ctx.fillStyle = low && f > 0.5 ? C.grn : '#c9cde6'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    });
    if (f > 0) popAt(x + 50, 845, f, () => lockIcon(0, 0, 1.1));
  }
  ctx.restore();
  chip(540 + shake(t, kR + 0.75), 1110, 'HAR COACH: 6-7 LOWER RESERVED', C.grn, P(t, kR + 0.7, kR + 1.0), { size: 30, h: 72 });
  chip(330, 1225, '3AC: 4-5', '#ffffff', P(t, kR + 0.95, kR + 1.2), { size: 26, h: 56 });
  chip(750, 1225, '2AC: 3-4', '#ffffff', P(t, kR + 1.05, kR + 1.3), { size: 26, h: 56 });
}

// ---------- scene 4: seniors, 45 plus auraton ke liye ... automatic ----------
function sceneWho(t) {
  const t3 = LS(3), k45 = CK('Seniors') + 1.1, kA = CK('automatic');
  const who = [[290, 'SENIORS', { hair: 'grey', glasses: true }, C.cyan, t3 + 0.05], [790, 'MAHILA 45+', { hair: 'bun' }, AUNTYC(), k45]];
  who.forEach(([x, lab, opt, col, t0]) => popAt(x, 590, P(t, t0, t0 + 0.3), () => {
    card(-210, -190, 420, 380, 36, C.box, 6, 10);
    faceX(0, -40, 1.0, col, opt);
    chip(0, 120, lab, col, 1, { size: 30, h: 66 });
  }));
  // auto assign: arrows into lower berths
  const af = P(t, kA - 0.1, kA + 0.3);
  who.forEach(([x], k) => {
    const f = P(t, kA + k * 0.12, kA + 0.35 + k * 0.12); if (f <= 0) return;
    ctx.save(); ctx.setLineDash([14, 12]); line([[x, 800], [x, L(800, 960, eo(f))]], '#ffffff', 6); ctx.restore();
    popAt(x, 1030, f, () => { bunk(-150, -50, 300, 100, 'LOWER', C.grn); });
    popAt(x + 165, 985, P(t, kA + 0.3 + k * 0.12, kA + 0.55 + k * 0.12), () => tickMark(0, 0, 28, C.grn));
  });
  if (af > 0) chip(540 + shake(t, kA + 0.1), 1205, 'AUTOMATIC · BINA CHOICE KE BHI', C.yel, af, { size: 28, h: 68 });
  chip(540, 1300, 'pregnant mahilayen bhi', '#ffffff', P(t, kA + 0.5, kA + 0.75), { size: 22, h: 48 });
}

// ---------- scene 5: tumhari choice? bas 'agar khaali ho' ----------
function sceneChoice(t) {
  const t4 = LS(4), kB = CK("Bas 'agar");
  const pf = P(t, t4 - 0.1, t4 + 0.25);
  if (pf <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 2); ctx.translate(0, L(50, 0, eo(pf)));
  card(140, 380, 800, 700, 36, '#ffffff', 6, 12);
  band(140, 380, 800, 96, 36, C.yel);
  txt('BERTH PREFERENCE', 540, 428, SANSB(40), INK);
  faceX(860, 560, 0.55, TUMC(), { mood: t > kB + 0.4 ? 1 : 0 });
  ['LOWER', 'MIDDLE', 'UPPER', 'SIDE LOWER'].forEach((s, i) => {
    const y = 560 + i * 100, sel = i === 0;
    ctx.beginPath(); ctx.arc(230, y, 22, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    if (sel) { ctx.beginPath(); ctx.arc(230, y, 11, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
    txt(s, 280, y + 2, sel ? SANSB(44) : `600 40px ${SANS}`, sel ? INK : '#7d83a8', 'left');
  });
  const ff = P(t, kB + 0.05, kB + 0.3);
  txt('*subject to availability', 540, 1010, `500 26px ${MONO}`, ff > 0 ? C.red : '#9aa0c0');
  ctx.restore();
  // fine print blows up into a stamp
  if (ff > 0) {
    ctx.save(); ctx.translate(540 + shake(t, kB + 0.3, 0.5, 10), 1010); ctx.rotate(-0.07); const s = L(0.4, 1, back(ff)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, ff * 2);
    card(-330, -62, 660, 124, 24, C.red, 6, 9); txt('AGAR KHAALI HO', 0, 4, SANSB(64), INK); ctx.restore();
  }
  chip(540, 1215, 'GUARANTEE NAHI', '#ffffff', P(t, kB + 0.55, kB + 0.85), { size: 32, h: 72 });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneAunty], [LS(2), LS(3), sceneRaaz],
          [LS(3), LS(4), sceneWho], [LS(4), LS(n) - 0.4, sceneChoice], [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('mila UPPER') + 0.4, 540, 1345, [C.red, C.org, C.yel], 24, 1.1);
  burst(t, CK('bina maange') + 0.3, 790, 1025, [C.grn, C.yel, '#ffffff'], 26, 1.2);
  burst(t, CK('kuch lower') + 0.75, 540, 1110, [C.grn, C.cyan, '#ffffff'], 24, 1.2);
  burst(t, CK('automatic') + 0.15, 540, 1030, [C.grn, C.yel, '#ffffff'], 28, 1.4);
  burst(t, CK("Bas 'agar") + 0.3, 540, 1010, [C.red, C.org, C.yel], 24, 1.2);
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
