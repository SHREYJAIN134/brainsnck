window.BG = '#2f6b70';
// "UPI pal bhar me paise kaise bhejta hai?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// UPI reel scenes
// =====================================================================
window.TOPIC = 'UPI';
function STEPS() { return [[0, 'THE RECORD'], [LS(2), 'PAISE KA SAFAR'], [LS(6) - 0.5, 'SHARE KARO']]; }
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
function envelope(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  hardShadow(-36, -25, 72, 50, 8, 5);
  rr(-36, -25, 72, 50, 8); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  line([[-31, -20], [0, 5], [31, -20]], INK, 4);
  ctx.restore();
}
function bubble(x, y, text, col, f, size = 40) {
  popAt(x, y, f, () => {
    ctx.font = SANSB(size); const w = ctx.measureText(text).width + 56, h = size * 2.1;
    card(-w / 2, -h / 2, w, h, 26, col, 5, 7);
    txt(text, 0, 3, SANSB(size), INK);
  });
}
function badge(x, y, n, col, f) {
  popAt(x, y, f, () => { disc(0, 0, 30, col); txt(String(n), 0, 2, SANSB(34), INK); });
}
function edge(a, b, f, col) {
  if (f <= 0) return;
  const p = polyPart([a, b], f);
  line(p, INK, 16); line(p, col, 8, [20, 14]);
}
function packet(t, t0, dur, a, b, col) {
  const u = P(t, t0, t0 + dur); if (u <= 0 || u >= 1) return;
  const e = eio(u);
  envelope(L(a[0], b[0], e), L(a[1], b[1], e) - Math.sin(Math.PI * e) * 30, 1, col);
}
function bankIcon(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-34, -10); ctx.lineTo(0, -34); ctx.lineTo(34, -10); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  for (const cx of [-22, 0, 22]) { rr(cx - 5, -6, 10, 30, 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke(); }
  rr(-38, 24, 76, 10, 3); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ---------- scene 1: the record + "kaise?" ----------
function sceneHook(t) {
  chip(540, 400, 'OCTOBER 2026', C.yel, P(t, 0.15, 0.45), { size: 32, h: 70 });
  // counter card
  const cf = P(t, 0.1, 0.45);
  popAt(540, 690, cf, () => {
    card(-380, -150, 760, 300, 40, C.box, 6, 12);
    const n = Math.round(9500 * eo(P(t, 0.3, CK('saadhe') + 1.0)));
    ctx.save(); ctx.lineJoin = 'round'; ctx.font = SANSB(170); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const s = n.toLocaleString('en-IN');
    ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.strokeText(s, 0, -22); ctx.fillStyle = C.yel; ctx.fillText(s, 0, -22);
    ctx.restore();
    txt('PAYMENTS  ·  HAR SECOND', 0, 98, `700 32px ${MONO}`, '#ffffff');
  });
  chip(540, 895, '2,547 CRORE IN 31 DIN', C.cyan, P(t, CK('UPI payments'), CK('UPI payments') + 0.3), { size: 30, h: 66 });
  // payments popping everywhere
  const cols = [C.grn, C.yel, C.cyan, C.pink];
  for (let i = 0; i < 42; i++) {
    const r = Math.floor(i / 7), c = i % 7;
    const x = 110 + c * 143 + (r % 2 ? 36 : -20), y = 1010 + r * 72 + (hash(i, 2) - 0.5) * 20;
    if (y > 1390) continue;
    const act = 0.35 + hash(i, 7) * 2.6; if (t < act) continue;
    const loc = ((t - act) * 1.5 + hash(i, 3)) % 1;
    const f = P(loc, 0, 0.22) * (1 - P(loc, 0.7, 1));
    if (f <= 0) continue;
    ctx.save(); ctx.translate(x, y); const s = back(Math.min(1, f * 1.2)); ctx.scale(s, s); ctx.globalAlpha *= f;
    const col = cols[i % 4];
    if (i % 3 === 0) tickMark(0, 0, 26, col);
    else { disc(0, 0, 26, col, 4); txt('₹', 0, 2, SANSB(30), INK); }
    ctx.restore();
  }
  // "Itni jaldi kaise?"
  const qa = P(t, LS(1) - 0.05, LS(1) + 0.25);
  if (qa > 0) {
    ctx.fillStyle = hexA(BG, 0.92 * qa); ctx.fillRect(0, 300, W, 1130);
    popAt(540, 800, qa, () => {
      // stopwatch
      rr(-30, -215, 60, 50, 10); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      disc(0, 0, 180, C.box, 12);
      ctx.beginPath(); ctx.arc(0, 0, 180, 0, 7); ctx.lineWidth = 10; ctx.strokeStyle = C.yel; ctx.stroke();
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2;
        line([[Math.cos(a) * 140, Math.sin(a) * 140], [Math.cos(a) * 160, Math.sin(a) * 160]], '#ffffff', k % 3 ? 4 : 8);
      }
      const a = -Math.PI / 2 + (t - LS(1)) * 14;
      line([[0, 0], [Math.cos(a) * 125, Math.sin(a) * 125]], C.pink, 12);
      disc(0, 0, 18, C.yel, 3);
    });
    chip(540, 1130, 'KAISE?', C.yel, P(t, CK('Itni jaldi') + 0.45, CK('Itni jaldi') + 0.75), { size: 64, h: 120, pad: 80 });
  }
}

// ---------- scene 2: the journey of the money ----------
const N = { me: [250, 570], npci: [540, 890], bankMe: [250, 1240], bankDost: [830, 1240], dost: [830, 570] };
function bankCard(cx, cy, title, bal0, bal1, flip, col, f, extra) {
  popAt(cx, cy, f, () => {
    card(-165, -100, 330, 200, 30, C.box, 5, 9);
    bankIcon(-118, -52, 0.8, col);
    txt(title, -72, -58, `700 25px ${MONO}`, C.mute, 'left');
    const b = flip > 0 ? bal1 : bal0;
    ctx.save(); if (flip > 0 && flip < 1) { ctx.translate(-130, 58); ctx.scale(1, Math.abs(Math.cos(flip * Math.PI))); ctx.translate(130, -58); }
    txt(b, -130, 58, SANSB(54), flip >= 0.5 ? col : '#ffffff', 'left'); ctx.restore();
    if (extra) extra();
  });
}
function sceneFlow(t) {
  const t2 = LS(2), kN = CK('message NPCI'), t3 = LS(3), kP = CK('paise hain'), t4 = LS(4), kK = CK('kaat liye'), t5 = LS(5), kC = CK('credit karo');
  // edges (under the nodes)
  edge(N.me, N.npci, P(t, kN - 0.1, kN + 0.5), C.yel);
  edge(N.npci, N.bankMe, P(t, t3, t3 + 0.5), C.cyan);
  edge(N.npci, N.bankDost, P(t, t5, t5 + 0.5), C.grn);
  edge(N.bankDost, N.dost, P(t, kC + 0.2, kC + 0.5), C.grn);
  // your phone
  const pf = P(t, t2 - 0.05, t2 + 0.35);
  if (pf > 0) {
    const press = CK('Pay dabaya') + 0.3, paid = kC + 0.6;
    ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 2);
    phoneBody(N.me[0], N.me[1], 0.58 * back(pf), () => {
      txt('Pay to', 0, -270, `600 40px ${SANS}`, C.mute);
      txt('Dost', 0, -205, SANSB(64), '#ffffff');
      txt('₹500', 0, -50, SANSB(120), C.yel);
      const pr = P(t, press, press + 0.12) * (1 - P(t, press + 0.12, press + 0.3));
      const done = t >= paid;
      ctx.save(); ctx.translate(0, 175); ctx.scale(1 - 0.08 * pr, 1 - 0.08 * pr);
      rr(-145, -60, 290, 120, 60); ctx.fillStyle = done ? C.grn : (t >= press ? C.cyan : C.yel); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      const lab = done ? 'PAID' : (t >= press ? 'SENDING' : 'PAY');
      txt(lab, done ? -24 : 0, 3, SANSB(done ? 54 : (t >= press ? 44 : 60)), INK);
      if (done) tickMark(84, 0, 28, '#ffffff');
      ctx.restore();
      // tap ring
      const tr = P(t, press, press + 0.5);
      if (tr > 0 && tr < 1) { ctx.beginPath(); ctx.arc(0, 175, 40 + 140 * eo(tr), 0, 7); ctx.lineWidth = 10 * (1 - tr); ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
    });
    ctx.restore();
    chip(N.me[0], N.me[1] - 258, 'TUM', C.yel, P(t, t2 + 0.15, t2 + 0.4), { size: 26, h: 54 });
  }
  // dost's phone
  const df = P(t, t2 + 0.3, t2 + 0.65);
  if (df > 0) {
    const got = kC + 0.45;
    ctx.save(); ctx.globalAlpha *= Math.min(1, df * 2);
    phoneBody(N.dost[0], N.dost[1], 0.58 * back(df), () => {
      txt('10:42', 0, -230, SANSB(90), '#ffffff');
      txt('Ravivaar, 1 Nov', 0, -150, `600 32px ${SANS}`, C.mute);
      const g = P(t, got, got + 0.3);
      if (g > 0) {
        ctx.save(); ctx.translate(0, L(80, 40, eo(g))); ctx.globalAlpha *= g;
        rr(-160, -95, 320, 190, 30); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
        txt('₹500', 0, -30, SANSB(80), INK);
        txt('aa gaye!', 0, 50, SANSB(44), INK);
        ctx.restore();
      } else {
        txt('waiting...', 0, 60, `500 34px ${MONO}`, C.dim);
      }
    });
    ctx.restore();
    chip(N.dost[0], N.dost[1] - 258, 'DOST', C.pink, P(t, t2 + 0.45, t2 + 0.7), { size: 26, h: 54 });
  }
  // NPCI hub
  const nf = P(t, kN - 0.15, kN + 0.25);
  popAt(N.npci[0], N.npci[1], nf, () => {
    const hits = [kN + 0.75, t3 + 0.05, kK + 1.0, t5 + 0.05];
    let ring = 0; for (const h of hits) { const u = P(t, h, h + 0.5); if (u > 0 && u < 1) ring = Math.max(ring, 1 - u); }
    if (ring > 0) { ctx.beginPath(); ctx.arc(0, 0, 112 + 60 * (1 - ring), 0, 7); ctx.lineWidth = 12 * ring; ctx.strokeStyle = C.yel; ctx.stroke(); }
    disc(0, 0, 112, C.box, 10);
    ctx.beginPath(); ctx.arc(0, 0, 112, 0, 7); ctx.lineWidth = 8; ctx.strokeStyle = C.yel; ctx.stroke();
    txt('NPCI', 0, -12, SANSB(58), '#ffffff');
    txt('UPI SWITCH', 0, 42, `700 22px ${MONO}`, C.mute);
  });
  // banks
  const kf = P(t, kK, kK + 0.35);
  bankCard(N.bankMe[0], N.bankMe[1], 'TUMHARA BANK', '₹2,000', '₹1,500', kf, C.org, P(t, t3 + 0.35, t3 + 0.7), () => {
    const pinT = CK('Bank ne PIN') + 0.55, pf2 = P(t, CK('Bank ne PIN'), CK('Bank ne PIN') + 0.25);
    if (pf2 > 0) {
      ctx.save(); ctx.globalAlpha *= pf2;
      txt('PIN', -130, 2, `700 28px ${MONO}`, '#ffffff', 'left');
      txt('••••', -62, 4, `700 32px ${MONO}`, C.yel, 'left');
      ctx.restore();
      const tf = P(t, pinT, pinT + 0.2);
      if (tf > 0) { ctx.save(); ctx.translate(55, 2); ctx.scale(back(tf), back(tf)); tickMark(0, 0, 22, C.grn); ctx.restore(); }
    }
  });
  bankCard(N.bankDost[0], N.bankDost[1], 'DOST KA BANK', '₹120', '₹620', P(t, kC + 0.05, kC + 0.4), C.grn, P(t, t5 - 0.05, t5 + 0.3));
  badge(395, 730, 1, C.yel, P(t, kN + 0.3, kN + 0.55));
  badge(395, 1063, 2, C.cyan, P(t, t3 + 0.35, t3 + 0.6));
  badge(88, 1142, 3, C.pink, P(t, t4 + 0.1, t4 + 0.35));
  badge(685, 1063, 4, C.grn, P(t, t5 + 0.35, t5 + 0.6));
  // money chips
  const mk = P(t, kK + 0.05, kK + 0.35);
  if (mk > 0) chip(N.bankMe[0], 1092 - 20 * eo(P(t, kK, kK + 1)), '-₹500', C.red, mk, { size: 34, h: 66 });
  const mc = P(t, kC + 0.05, kC + 0.35);
  if (mc > 0) chip(N.bankDost[0], 1092 - 20 * eo(P(t, kC, kC + 1)), '+₹500', C.grn, mc, { size: 34, h: 66 });
  // packets
  packet(t, kN, 0.75, N.me, N.npci, C.yel);
  packet(t, t3 - 0.05, 0.7, N.npci, N.bankMe, C.cyan);
  packet(t, kK + 0.35, 0.65, N.bankMe, N.npci, C.grn);
  packet(t, t5 - 0.05, 0.7, N.npci, N.bankDost, C.grn);
  // speech bubbles
  bubble(225, 960, 'paise hain?', C.cyan, P(t, kP - 0.05, kP + 0.25) * (1 - P(t, t4 + 0.4, t4 + 0.6)), 38);
  bubble(860, 960, 'credit karo!', C.grn, P(t, kC - 0.05, kC + 0.25), 38);
}

// ---------- scene 3: CTA chat ----------
function sceneCTA(t) {
  const t0 = LS(6) - 0.5, kD = CK('dost ko bhejo');
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
    lab(-215, '14 AUG', P(t, t0 + 0.15, t0 + 0.35));
    bub(-190, 'bhai 500 bhej,\nkal lauta dunga', false, P(t, t0 + 0.2, t0 + 0.5), '#3a4373', '#ffffff');
    lab(-45, 'AAJ · 1 NOV', P(t, LS(6) + 0.2, LS(6) + 0.4));
    bub(-20, 'bhai... 79 din\nho gaye', true, P(t, LS(6) + 0.3, LS(6) + 0.6), C.yel, INK);
    const typing = t > kD - 0.1 && t < kD + 0.7;
    if (typing) { rr(-165, 110, 120, 60, 22); ctx.fillStyle = '#3a4373'; ctx.fill(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-133 + i * 28, 140 + Math.sin(t * 10 + i) * 5, 8, 0, 7); ctx.fillStyle = C.mute; ctx.fill(); } }
    bub(110, 'UPI nahi\nchal raha', false, P(t, kD + 0.7, kD + 1.0), '#3a4373', '#ffffff');
  });
  ctx.restore();
  chip(540, 380, 'IS DOST KO BHEJO', C.yel, P(t, t0 + 0.2, t0 + 0.5), { size: 30, h: 66 });
  const bf = P(t, kD + 1.35, kD + 1.6);
  if (bf > 0) {
    const sh = Math.sin(t * 70) * 7 * (1 - P(t, kD + 1.35, kD + 1.8));
    chip(540 + sh, 1345, 'BAHANA PAKDA GAYA!', C.red, bf, { size: 36, h: 80 });
  }
}

function sceneList() {
  return [[0, LS(2), sceneHook], [LS(2), LS(6) - 0.5, sceneFlow], [LS(6) - 0.5, END + 0.4, sceneCTA]];
}
function reelBursts(t) {
  burst(t, CK('Itni jaldi') + 0.45, 540, 800, POP, 26, 1.3);
  burst(t, CK('kaat liye') + 0.1, 250, 1100, [C.red, C.org, C.yel], 18);
  burst(t, CK('credit karo') + 0.1, 830, 1100, [C.grn, C.cyan, '#ffffff'], 22, 1.2);
  burst(t, CK('credit karo') + 0.5, 830, 560, [C.grn, C.yel, '#ffffff'], 22, 1.2);
  burst(t, CK('dost ko bhejo') + 1.35, 540, 1345, [C.red, C.org, C.yel], 22);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
