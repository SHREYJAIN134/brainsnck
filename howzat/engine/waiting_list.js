window.BG = '#2f6b70';
// "Kam waiting wala ticket confirm kyun nahi hua?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// Waiting list reel scenes
// =====================================================================
window.TOPIC = 'Waiting List';
function STEPS() { return [[0, 'CHHATH RUSH'], [LS(2), 'WL KA RAAZ'], [LS(5), 'TYPE DEKHO']]; }
const SANSB = s => `800 ${s}px ${SANS}`;
const TUMC = () => C.grn, DOSTC = () => C.pink;

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

// ---------- scene 1: Chhath ki train ... tumhara WL 12 atka ----------
function hookT() { const kT = CK('tumhara'); return { kT, tStamp: kT + 1.3 }; }
function sceneHook(t) {
  const { kT, tStamp } = hookT();
  chip(540, 362, 'CHHATH RUSH', C.org, P(t, 0.05, 0.35), { size: 30, h: 62 });
  const cf = P(t, 0, 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, cf * 2);
  coach(540 + L(-140, 0, eo(cf)) + Math.sin(t * 18) * 1.5, 545, 0.95, 8 * eo(P(t, 0.2, 1.1)), 'FULL · NO ROOM');
  ctx.restore();
  // ticket card
  const tf = P(t, kT - 0.25, kT + 0.1);
  if (tf <= 0) return;
  ctx.save(); ctx.globalAlpha *= Math.min(1, tf * 2); ctx.translate(0, L(60, 0, eo(tf)));
  const sx = shake(t, tStamp, 0.5, 12);
  ctx.translate(sx, 0);
  card(110, 760, 860, 450, 38, C.box, 6, 12);
  band(110, 760, 860, 92, 38, C.yel);
  txt('PNR STATUS', 540, 808, `700 34px ${MONO}`, INK);
  face(255, 965, 0.95, TUMC(), t > tStamp ? 1 : 0);
  if (t > tStamp) sweat(320, 900, t);
  chip(255, 1085, 'TUM', TUMC(), 1, { size: 28, h: 58 });
  txt('BOOKING STATUS', 660, 912, `700 24px ${MONO}`, C.mute);
  const pulse = 1 + 0.04 * Math.sin(t * 9);
  ctx.save(); ctx.translate(660, 990); ctx.scale(pulse, pulse); txt('WL 12', 0, 0, `700 120px ${MONO}`, C.org); ctx.restore();
  // WL -> RAC -> CNF track, marker can't move
  const X0 = 450, X1 = 870, Y = 1110;
  line([[X0, Y], [X1, Y]], 'rgba(255,255,255,0.25)', 12);
  [['WL', X0], ['RAC', (X0 + X1) / 2], ['CNF', X1]].forEach(([s, x]) => { disc(x, Y, 13, '#c9cde6', 0); txt(s, x, Y + 44, `700 24px ${MONO}`, C.mute); });
  const tryU = P(t, kT + 0.3, tStamp);
  const mx = X0 + 70 * Math.sin(Math.PI * Math.min(1, tryU * 2)) * (t < tStamp ? 1 : 0) + 18 * Math.sin(Math.PI * Math.max(0, tryU * 2 - 1)) * (t < tStamp ? 1 : 0);
  disc(mx, Y, 22, C.org, 4);
  ctx.restore();
  // ATKA stamp
  const sf = P(t, tStamp, tStamp + 0.22);
  if (sf > 0) {
    ctx.save(); ctx.translate(705 + sx, 1268); ctx.rotate(-0.1); const s = L(2.2, 1, eo(sf)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, sf * 2);
    card(-150, -58, 300, 116, 24, C.red, 6, 9);
    txt('ATKA!', 0, 4, SANSB(72), INK);
    ctx.restore();
  }
}

// ---------- scene 2: dost ka WL 90 ... CONFIRM ----------
function ticketCard(x, who, col, t, statusFn) {
  card(x, 430, 440, 700, 38, C.box, 6, 12);
  band(x, 430, 440, 86, 38, col);
  txt(who, x + 220, 475, SANSB(42), INK);
  statusFn();
}
function sceneFriend(t) {
  const t1 = LS(1), kC = CK('CONFIRM');
  const dim = 1 - 0.35 * P(t, kC + 0.2, kC + 0.5);
  // tum
  ctx.save(); ctx.globalAlpha *= dim;
  popAt(290, 780, P(t, t1 - 0.2, t1 + 0.1), () => {
    ctx.translate(-290, -780);
    ticketCard(70, 'TUM', TUMC(), t, () => {
      face(290, 640, 0.9, TUMC(), t > kC + 0.2 ? 1 : 0);
      if (t > kC + 0.3) sweat(350, 585, t);
      txt('STATUS', 290, 780, `700 24px ${MONO}`, C.mute);
      card(130, 820, 320, 140, 30, C.org, 5, 7);
      txt('WL 12', 290, 892, `700 66px ${MONO}`, INK);
    });
  });
  ctx.restore();
  // dost
  popAt(790, 780, P(t, t1 + 0.1, t1 + 0.4), () => {
    ctx.translate(-790, -780);
    ticketCard(570, 'DOST', DOSTC(), t, () => {
      face(790, 640, 0.9, DOSTC(), 0);
      txt('STATUS', 790, 780, `700 24px ${MONO}`, C.mute);
      const u = P(t, kC, kC + 0.25), cnf = u >= 0.5;
      ctx.save(); ctx.translate(790, 890); ctx.scale(Math.max(0.05, Math.abs(Math.cos(Math.PI * u))), 1);
      card(-160, -70, 320, 140, 30, cnf ? C.grn : C.org, 5, 7);
      txt(cnf ? 'CNF' : 'WL 90', 0, 2, `700 ${cnf ? 76 : 66}px ${MONO}`, INK);
      ctx.restore();
      popAt(935, 825, P(t, kC + 0.25, kC + 0.5), () => tickMark(0, 0, 32, C.grn));
    });
  });
  // "?" above tum, KAISE chip
  popAt(400, 560, P(t, kC + 0.35, kC + 0.6), () => { disc(0, 0, 34, C.yel, 4); txt('?', 0, 3, SANSB(48), INK); });
  chip(540 + shake(t, kC + 0.45), 1250, 'BADA NUMBER CONFIRM?!', C.yel, P(t, kC + 0.45, kC + 0.75), { size: 32, h: 74 });
}

// ---------- scene 3: raaz: waiting list ek nahi, kai hain ----------
const LANES = [['GNWL', 0, 9, () => C.grn], ['RLWL', 9, 13, () => C.org], ['PQWL', 13, 15, () => C.purple]];
const LANE_Y = [650, 875, 1100];
function laneOf(i) { return LANES.findIndex(l => i >= l[1] && i < l[2]); }
function sceneRaaz(t) {
  const t2 = LS(2), kE = CK('ek nahi') + 0.1;
  chip(540, 362, 'RAAZ', C.yel, P(t, t2, t2 + 0.3), { size: 40, h: 76 });
  const bf = P(t, t2 - 0.1, t2 + 0.25);
  ctx.save(); ctx.globalAlpha *= Math.min(1, bf * 2);
  card(60, 450, 960, 800, 40, C.box, 6, 12);
  const sp = P(t, kE, kE + 0.6);
  txt(sp > 0.5 ? 'WAITING LISTS' : 'WAITING LIST', 540, 505, `700 32px ${MONO}`, C.mute);
  ctx.restore();
  if (bf <= 0) return;
  // tracks
  const one = 1 - P(t, kE, kE + 0.3);
  if (one > 0) { ctx.save(); ctx.globalAlpha *= one * Math.min(1, bf * 2); rr(100, 830, 880, 90, 45); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill(); ctx.restore(); }
  LANE_Y.forEach((y, k) => {
    const f = P(t, kE + 0.2 + k * 0.1, kE + 0.5 + k * 0.1); if (f <= 0) return;
    ctx.save(); ctx.globalAlpha *= f; rr(100, y - 45, 880, 90, 45); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill(); ctx.restore();
  });
  // passengers: one long line -> three separate lines
  for (let i = 0; i < 15; i++) {
    const f = P(t, t2 + 0.1 + i * 0.04, t2 + 0.3 + i * 0.04); if (f <= 0) continue;
    const li = laneOf(i), j = i - LANES[li][1];
    const x0 = 150 + i * 56, y0 = 875;
    const x1 = 330 + j * 72, y1 = LANE_Y[li];
    const u = eio(P(t, kE + i * 0.02, kE + 0.55 + i * 0.02));
    const col = u > 0.5 ? LANES[li][3]() : '#c9cde6';
    ctx.save(); ctx.translate(L(x0, x1, u), L(y0, y1, u) - 40 * Math.sin(Math.PI * u)); const s = back(f); ctx.scale(s, s);
    person(0, 0, 25, col); ctx.restore();
  }
  LANES.forEach(([lab, , , col], k) => chip(200, LANE_Y[k], lab, col(), P(t, kE + 0.35 + k * 0.12, kE + 0.65 + k * 0.12), { size: 28, h: 58, pad: 36 }));
  chip(540 + shake(t, kE + 0.75), 1340, 'EK NAHI, KAI LISTS!', C.yel, P(t, kE + 0.75, kE + 1.05), { size: 32, h: 74 });
}

// ---------- scene 4: pehle station ki list sabse badi, beech ke station ki bahut chhoti ----------
const RY = 470, ST = [[130, 'SHURU'], [403, 'BEECH'], [677, 'BEECH'], [950, 'MANZIL']];
function sceneRoute(t) {
  const t3 = LS(3), t4 = LS(4), kB = CK('sabse badi'), kC = CK('bahut chhoti');
  // track + moving train
  line([[ST[0][0], RY], [ST[3][0], RY]], INK, 16);
  ctx.save(); ctx.setLineDash([22, 16]); line([[ST[0][0], RY], [ST[3][0], RY]], '#e8f6fb', 5); ctx.restore();
  ST.forEach(([x, lab], k) => {
    const hot = (k === 0 && t < t4 + 0.05) ? win(t, t3, t4 + 0.05, 0.2, 0.2) : (k === 1 || k === 2) ? P(t, t4, t4 + 0.25) : 0;
    const r = 22 + 6 * hot * (0.5 + 0.5 * Math.sin(t * 10));
    disc(x, RY, r, hot > 0.3 ? (k === 0 ? C.grn : C.org) : '#ffffff', 4);
    txt(lab, x, RY + 52, `700 22px ${MONO}`, C.mute);
  });
  const tx = L(ST[0][0], ST[3][0], P(t, t3 + 0.1, LS(5)));
  ctx.save(); ctx.translate(tx, RY - 34);
  card(-46, -26, 92, 46, 12, C.cyan, 4, 4); rr(-30, -16, 22, 18, 4); ctx.fillStyle = '#e8f6fb'; ctx.fill(); rr(4, -16, 22, 18, 4); ctx.fill();
  ctx.restore();
  // who boards where
  popAt(ST[0][0], 375, P(t, t3 + 0.05, t3 + 0.35), () => face(0, 0, 0.42, DOSTC()));
  popAt(ST[1][0], 375, P(t, t4 + 0.05, t4 + 0.35), () => face(0, 0, 0.42, TUMC(), 1));
  // GNWL quota: big
  const gf = P(t, t3 + 0.15, t3 + 0.45);
  if (gf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, gf * 2) * (1 - 0.3 * P(t, t4, t4 + 0.3));
    ctx.save(); ctx.setLineDash([12, 10]); line([[ST[0][0], RY + 80], [ST[0][0], 600]], '#ffffff', 4); ctx.restore();
    ctx.translate(0, L(50, 0, eo(gf)));
    card(80, 600, 500, 700, 36, C.box, 6, 12);
    band(80, 600, 500, 84, 36, C.grn);
    txt('GNWL', 330, 643, SANSB(42), INK);
    for (let i = 0; i < 35; i++) {
      const c = i % 5, r = Math.floor(i / 5), f = P(t, t3 + 0.4 + i * 0.022, t3 + 0.55 + i * 0.022); if (f <= 0) continue;
      popAt(150 + c * 90, 735 + r * 78, f, () => { rr(-30, -26, 60, 52, 12); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); });
    }
    ctx.restore();
  }
  chip(330, 1365, 'SABSE BADI', C.grn, P(t, kB, kB + 0.3), { size: 32, h: 72 });
  // RLWL / PQWL quota: tiny
  const rf = P(t, t4 + 0.15, t4 + 0.45);
  if (rf > 0) {
    const sx = shake(t, kC + 0.05, 0.5, 10);
    ctx.save(); ctx.globalAlpha *= Math.min(1, rf * 2);
    ctx.save(); ctx.setLineDash([12, 10]); line([[ST[2][0], RY + 80], [ST[2][0], 600]], '#ffffff', 4); ctx.restore();
    ctx.translate(sx, L(50, 0, eo(rf)));
    card(625, 600, 375, 300, 36, C.box, 6, 12);
    band(625, 600, 375, 84, 36, C.org);
    txt('RLWL · PQWL', 812, 643, SANSB(34), INK);
    for (let i = 0; i < 2; i++) popAt(767 + i * 90, 790, P(t, t4 + 0.45 + i * 0.1, t4 + 0.6 + i * 0.1), () => { rr(-30, -26, 60, 52, 12); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); });
    // queue waiting outside
    for (let i = 0; i < 4; i++) {
      const f = P(t, t4 + 0.6 + i * 0.08, t4 + 0.8 + i * 0.08); if (f <= 0) continue;
      ctx.save(); ctx.translate(690 + i * 82, 1010 + Math.sin(t * 6 + i) * 3); const s = back(f); ctx.scale(s, s); person(0, 0, 27, i === 3 ? TUMC() : '#c9cde6'); ctx.restore();
    }
    chip(936, 1095, 'WL 12', C.org, P(t, t4 + 0.95, t4 + 1.2), { size: 24, h: 50, pad: 32 });
    ctx.restore();
  }
  chip(812 + shake(t, kC + 0.05), 1365, 'BAHUT CHHOTI', C.red, P(t, kC, kC + 0.3), { size: 32, h: 72 });
}

// ---------- scene 5: number nahi ... list ka TYPE dekho ----------
function stub(y, code, num, who, col, t, kN, kTy, good) {
  card(110, y - 120, 860, 240, 32, '#ffffff', 6, 10);
  txt(who, 150, y - 88, `700 22px ${MONO}`, '#7d83a8', 'left');
  ctx.save(); ctx.setLineDash([14, 12]); line([[560, y - 100], [560, y + 100]], '#b9bfdc', 4); ctx.restore();
  // code (TYPE) highlight
  const hf = P(t, kTy + 0.45, kTy + 0.7);
  if (hf > 0) { ctx.save(); ctx.translate(335, y + 6); ctx.rotate(-0.03); const s = back(hf); ctx.scale(s, s); hardShadow(-170, -58, 340, 116, 24, 7); rr(-170, -58, 340, 116, 24); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); }
  txt(code, 335, y + 10, SANSB(86), INK);
  // number, struck out
  const nf = P(t, kN + 0.35, kN + 0.65);
  ctx.save(); ctx.globalAlpha *= 1 - 0.55 * nf; txt(num, 765, y + 10, SANSB(120), INK); ctx.restore();
  if (nf > 0) line([[680, y + 30], [L(680, 850, eo(nf)), y + 30 - 50 * eo(nf)]], C.red, 14);
  popAt(905, y - 100, P(t, kTy + 0.6 + (good ? 0.12 : 0), kTy + 0.85 + (good ? 0.12 : 0)), () => good ? tickMark(0, 0, 36, C.grn) : crossMark(0, 0, 36, C.red));
}
function sceneType(t) {
  const t5 = LS(5), kN = CK('Number'), kTy = CK('list ka TYPE');
  chip(335, 380, 'TYPE', C.cyan, P(t, t5 + 0.05, t5 + 0.35), { size: 30, h: 62 });
  chip(765, 380, 'NUMBER', '#ffffff', P(t, t5 + 0.15, t5 + 0.45), { size: 30, h: 62 });
  popAt(540, 640, P(t, t5 - 0.1, t5 + 0.2), () => { ctx.translate(-540, -640); stub(640, 'RLWL', '12', 'TUM', C.org, t, kN, kTy, false); });
  popAt(540, 980, P(t, t5, t5 + 0.3), () => { ctx.translate(-540, -980); stub(980, 'GNWL', '90', 'DOST', C.grn, t, kN, kTy, true); });
  chip(540, 1190, 'CHANCE: GNWL ZYADA', C.grn, P(t, kTy + 0.8, kTy + 1.05), { size: 30, h: 68 });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneFriend], [LS(2), LS(3), sceneRaaz],
          [LS(3), LS(5), sceneRoute], [LS(5), LS(n) - 0.4, sceneType], [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, hookT().tStamp + 0.05, 705, 1268, [C.red, C.org, C.yel], 24, 1.1);
  burst(t, CK('CONFIRM') + 0.25, 790, 890, [C.grn, C.yel, '#ffffff'], 28, 1.3);
  burst(t, CK('ek nahi') + 0.6, 540, 875, [C.grn, C.org, C.purple], 26, 1.4);
  burst(t, CK('sabse badi') + 0.05, 330, 950, [C.grn, C.cyan, '#ffffff'], 24, 1.2);
  burst(t, CK('list ka TYPE') + 0.75, 335, 980, [C.grn, C.yel, '#ffffff'], 24, 1.1);
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
