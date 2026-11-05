window.BG = '#5a4e8c';
// "Shazam 5 second me gaana kaise pehchanta hai?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// Shazam reel scenes
// =====================================================================
window.TOPIC = 'Shazam';
function STEPS() { return [[0, 'SHOR ME GAANA'], [LS(1), 'PHOTO SE TAARE'], [LS(3), 'CODE MATCH']]; }
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
function ring(x, y, t, t0, col = '#ffffff', r0 = 20, r1 = 100, d = 0.6) {
  const r = P(t, t0, t0 + d); if (r <= 0 || r >= 1) return;
  ctx.beginPath(); ctx.arc(x, y, r0 + (r1 - r0) * eo(r), 0, 7); ctx.lineWidth = 9 * (1 - r); ctx.strokeStyle = col; ctx.stroke();
}
function star(x, y, r, col, rot = 0, d = 4) {
  const path = (ox, oy) => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + rot + i * Math.PI / 5, rad = i % 2 ? r * 0.46 : r; ctx.lineTo(ox + Math.cos(a) * rad, oy + Math.sin(a) * rad); }
    ctx.closePath();
  };
  if (d > 0) { path(x + d, y + d); ctx.fillStyle = INK; ctx.fill(); }
  path(x, y); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = Math.max(2.5, r * 0.14); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
}
function noteIcon(x, y, s, col) {   // a plain music note
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(-14, 22, 17, 13, -0.4, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = INK; ctx.fillRect(0, -34, 6, 58);
  ctx.beginPath(); ctx.moveTo(3, -34); ctx.quadraticCurveTo(30, -26, 26, -2); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function waveBars(x, y, s, t, col = INK) {   // little sound-wave icon (5 bars)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col;
  const hs = [26, 48, 70, 48, 26];
  hs.forEach((h, i) => { const k = h * (0.75 + 0.25 * Math.sin(t * 9 + i * 1.3)); rr(-58 + i * 26 - 7, -k / 2, 14, k, 7); ctx.fill(); });
  ctx.restore();
}
function speaker(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-62, -100, 124, 200, 22, '#3b3466', 5, 7);
  const p = 1 + 0.06 * Math.sin(t * 22);
  disc(0, -45, 26 * p, '#c9cde6', 0); ctx.beginPath(); ctx.arc(0, -45, 10, 0, 7); ctx.fillStyle = INK; ctx.fill();
  disc(0, 32, 40 * p, '#c9cde6', 0); ctx.beginPath(); ctx.arc(0, 32, 15, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}
function bubble(x, y, s, label, col, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.font = SANSB(34); const w = ctx.measureText(label).width + 44;
  hardShadow(-w / 2, -34, w, 68, 22, 6);
  rr(-w / 2, -34, w, 68, 22); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-14, 32); ctx.lineTo(-30, 56); ctx.lineTo(8, 32); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
  txt(label, 0, 3, SANSB(34), INK);
  ctx.restore();
}
function albumArt(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-70, -70, 140, 140, 18, C.pink, 4, 6);
  ctx.beginPath(); ctx.arc(0, 0, 44, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fillStyle = C.yel; ctx.fill();
  ctx.restore();
}

// ---------- scene 1: shor me 5 second ... gaana pakda ----------
const NOISE = [['BAK BAK', 170, 760, 'pink', -0.12], ['HAHAHA', 900, 820, 'org', 0.1], ['DHOL!', 190, 1130, 'cyan', 0.08],
               ['PEE PEE', 880, 1180, 'purple', -0.1], ['OYE!', 130, 940, 'grn', 0.06], ['SHOR!', 945, 1000, 'red', -0.06]];
function sceneHook(t) {
  const kS = CK('Shazam ne'), tR = kS + 0.15;
  const found = t > tR;
  // party noise
  speaker(150, 470, 0.95, t); speaker(930, 470, 0.95, t);
  for (let k = 0; k < 6; k++) {   // notes floating out of the speakers
    const u = ((t * 0.7 + k / 6) % 1), side = k % 2;
    ctx.save(); ctx.globalAlpha *= (1 - u) * (found ? 1 - P(t, tR, tR + 0.4) : 1);
    noteIcon(side ? 930 - 60 * u - 30 : 150 + 60 * u + 30, 380 - 120 * u, 0.7, POP[k % POP.length]); ctx.restore();
  }
  NOISE.forEach(([lab, x, y, col, rot], k) => {
    const f = P(t, 0.15 + k * 0.17, 0.4 + k * 0.17) * (1 - P(t, tR + 0.1, tR + 0.45));
    if (f <= 0) return;
    popAt(x + Math.sin(t * 13 + k) * 4, y + Math.cos(t * 11 + k) * 4, f, () => bubble(0, 0, 0.78, lab, C[col], rot));
  });
  // phone
  phoneBody(540, 900, 0.86, () => {
    if (!found) {
      txt('Sun raha hai...', 0, -270, `600 32px ${SANS}`, '#ffffff');
      for (let k = 0; k < 3; k++) {
        const u = ((t * 0.9 + k / 3) % 1);
        ctx.beginPath(); ctx.arc(0, -20, 120 + 120 * u, 0, 7); ctx.lineWidth = 7 * (1 - u); ctx.strokeStyle = hexA(C.cyan, 1 - u); ctx.stroke();
      }
      const p = 1 + 0.04 * Math.sin(t * 10);
      ctx.save(); ctx.translate(0, -20); ctx.scale(p, p);
      ctx.beginPath(); ctx.arc(7, 7, 118, 0, 7); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 118, 0, 7); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
      waveBars(0, 0, 1.2, t); ctx.restore();
      const secs = Math.min(5, Math.floor(5 * P(t, 0.25, 2.1)) + (t > 2.1 ? 1 : 0));
      rr(-110, 190, 220, 74, 37); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
      txt(`0:0${secs}`, 0, 228, `700 44px ${MONO}`, secs >= 5 ? C.yel : '#ffffff');
    } else {
      const f = P(t, tR, tR + 0.3);
      ctx.save(); ctx.globalAlpha *= Math.min(1, f * 2);
      popAt(0, -150, f, () => albumArt(0, 0, 1.25));
      txt('GAANA MIL GAYA!', 0, 20, SANSB(36), C.yel);
      for (let k = 0; k < 2; k++) { rr(-130, 75 + k * 46, k ? 180 : 260, 22, 11); ctx.fillStyle = k ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.6)'; ctx.fill(); }
      popAt(0, 250, P(t, tR + 0.2, tR + 0.45), () => tickMark(0, 0, 48, C.grn));
      ctx.restore();
    }
  });
  chip(540, 1365, 'SIRF 5 SECOND', C.yel, P(t, 0.9, 1.2) * (1 - P(t, tR - 0.1, tR + 0.05)), { size: 32, h: 70 });
  chip(540 + shake(t, tR + 0.3), 1365, 'SHOR ME BHI PAKDA!', C.grn, P(t, tR + 0.3, tR + 0.6), { size: 32, h: 70 });
}

// ---------- spectrogram ("gaane ki photo") ----------
const SG = { x: 168, y: 430, cols: 24, rows: 20, cw: 31, ch: 31 };   // grid area 744 x 620
const PEAKS = [[1, 14], [3, 6], [4, 11], [6, 3], [8, 13], [9, 8], [11, 4], [13, 15], [14, 9], [16, 5], [18, 12], [19, 2], [21, 8], [22, 15]];
const SPEC = (() => {
  const v = [];
  for (let c = 0; c < SG.cols; c++) for (let r = 0; r < SG.rows; r++) {
    let x = 0.08 + 0.32 * hash(c * 3 + 1, r * 7 + 2) + 0.18 * (r / SG.rows);   // more energy at low notes (bottom)
    for (const [pc, pr] of PEAKS) { const d = Math.hypot(c - pc, (r - pr) * 1.2); x += 0.62 * Math.max(0, 1 - d / 2.4); }
    v.push([c, r, Math.min(0.8, x)]);
  }
  for (const [pc, pr] of PEAKS) v[pc * SG.rows + pr][2] = 1;
  return v;
})();
function cellXY(c, r) { return [SG.x + c * SG.cw + SG.cw / 2, SG.y + (SG.rows - 1 - r) * SG.ch + SG.ch / 2]; }
function specCol(v) { return v >= 0.99 ? C.yel : v > 0.62 ? C.org : v > 0.46 ? C.pink : v > 0.3 ? '#7d6db8' : '#3d3470'; }
function spectrogram(dim, reveal) {
  for (const [c, r, v] of SPEC) {
    if (c / SG.cols > reveal) continue;
    const [x, y] = cellXY(c, r);
    ctx.fillStyle = v >= 0.99 ? specCol(v) : (dim > 0 ? (dim >= 1 ? '#2b244f' : specCol(v)) : specCol(v));
    ctx.save(); if (v < 0.99 && dim > 0) ctx.globalAlpha *= 1 - dim * 0.85;
    ctx.fillRect(x - SG.cw / 2 + 1, y - SG.ch / 2 + 1, SG.cw - 2, SG.ch - 2); ctx.restore();
  }
}
function ear(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const path = () => { ctx.beginPath(); ctx.moveTo(-40, -30); ctx.bezierCurveTo(-40, -110, 70, -110, 70, -20); ctx.bezierCurveTo(70, 30, 20, 40, 20, 80); ctx.bezierCurveTo(20, 120, -40, 120, -40, 80); };
  ctx.save(); ctx.translate(7, 7); path(); ctx.lineWidth = 34; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  path(); ctx.lineWidth = 34; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
  path(); ctx.lineWidth = 24; ctx.strokeStyle = col; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -24); ctx.bezierCurveTo(-6, -60, 38, -60, 38, -22); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function waveform(x0, x1, y, amp, t, f = 1) {
  ctx.beginPath();
  const n = 140;
  for (let i = 0; i <= n * f; i++) {
    const u = i / n, x = L(x0, x1, u);
    const a = amp * (0.35 + 0.65 * Math.abs(Math.sin(u * 9 + 1.3) * Math.sin(u * 23 + t * 3)));
    const yy = y + a * Math.sin(u * 160 + t * 14);
    i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
  }
  ctx.lineWidth = 6; ctx.strokeStyle = C.cyan; ctx.lineJoin = 'round'; ctx.stroke();
}
function scenePhoto(t) {
  const t1 = LS(1), kN = CK('Wo gaana'), kP = CK('PHOTO'), kT = CK('Sabse tez'), kJ = CK('ban jaate');
  // part A: the ear does not "listen"
  const aOut = 1 - P(t, kP - 0.05, kP + 0.15);
  if (aOut > 0) {
    ctx.save(); ctx.globalAlpha *= aOut;
    card(90, 560, 900, 330, 36, C.box, 6, 10);
    waveform(140, 940, 725, 110, t, eo(P(t, t1 - 0.1, t1 + 0.5)));
    popAt(540, 1050, P(t, t1 + 0.05, t1 + 0.35), () => ear(0, 0, 1.15, C.org));
    popAt(640, 990, P(t, kN + 0.75, kN + 1.0), () => crossMark(0, 0, 46, C.red));
    chip(540, 1260, 'SUNTA NAHI!', C.red, P(t, kN + 0.85, kN + 1.1), { size: 32, h: 70 });
    ctx.restore();
  }
  // part B: camera flash -> the photo (spectrogram)
  const pf = P(t, kP, kP + 0.35);
  if (pf > 0) {
    ctx.save(); ctx.translate(540, 820); ctx.rotate(L(-0.12, -0.02, eo(pf)) * (1 - P(t, kT, kT + 0.4))); const s = back(pf); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, pf * 3);
    ctx.translate(-540, -820);
    card(120, 390, 840, 850, 30, '#fbf7ee', 6, 12);          // photo frame
    rr(SG.x - 4, SG.y - 4, SG.cols * SG.cw + 8, SG.rows * SG.ch + 8, 6); ctx.fillStyle = '#2b244f'; ctx.fill();
    const dim = P(t, kJ - 0.05, kJ + 0.35);
    spectrogram(dim, eo(P(t, kP + 0.05, kP + 0.55)));
    // axes labels on the frame
    txt('TIME →', SG.x + SG.cols * SG.cw - 4, SG.y + SG.rows * SG.ch + 34, `700 24px ${MONO}`, '#7d83a8', 'right');
    ctx.save(); ctx.translate(SG.x - 26, SG.y + SG.rows * SG.ch / 2); ctx.rotate(-Math.PI / 2); txt('SUR ↑', 0, 0, `700 24px ${MONO}`, '#7d83a8'); ctx.restore();
    txt(dim > 0.5 ? 'taaron ka map' : 'gaane ki photo', 540, 1180, `800 44px ${SANS}`, INK);
    // highlight the loudest points
    const hl = P(t, kT + 0.1, kT + 0.4);
    PEAKS.forEach(([c, r], i) => {
      const [x, y] = cellXY(c, r);
      const sf = P(t, kJ + i * 0.04, kJ + 0.3 + i * 0.04);
      if (sf > 0) { star(x, y, L(10, 26, back(sf)), C.yel, t * 0.6 + i, 3); return; }
      if (hl > 0) {
        const pulse = 1 + 0.25 * Math.sin(t * 14 + i);
        ctx.save(); ctx.globalAlpha *= hl; ctx.beginPath(); ctx.arc(x, y, 22 * pulse, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.stroke(); ctx.restore();
      }
    });
    // flash
    const fl = 1 - P(t, kP, kP + 0.3);
    if (fl > 0 && t >= kP) { ctx.fillStyle = `rgba(255,255,255,${0.9 * fl})`; rr(120, 390, 840, 850, 30); ctx.fill(); }
    ctx.restore();
  }
  // camera icon popping on PHOTO
  popAt(860, 400, win(t, kP - 0.1, kT, 0.2, 0.25), () => {
    card(-70, -48, 140, 96, 18, C.yel, 4, 6); rr(-30, -64, 60, 20, 6); ctx.fillStyle = INK; ctx.fill();
    disc(0, 0, 30, '#ffffff', 0); ctx.beginPath(); ctx.arc(0, 0, 14, 0, 7); ctx.fillStyle = INK; ctx.fill();
  });
  chip(540, 1335, 'SABSE TEZ SUR', C.yel, P(t, kT + 0.15, kT + 0.45) * (1 - P(t, kJ - 0.05, kJ + 0.1)), { size: 32, h: 70 });
  chip(540, 1335, 'YE HAI TAARE!', C.yel, P(t, kJ + 0.3, kJ + 0.6), { size: 32, h: 70 });
}

// ---------- scene 3: taaron ke jode se code ... laakhon gaanon se milaan ----------
const SC = { x: 110, y: 350, w: 860, h: 430 };
function starPos(i) { const [c, r] = PEAKS[i]; return [SC.x + 40 + c / (SG.cols - 1) * (SC.w - 80), SC.y + 40 + (1 - r / (SG.rows - 1)) * (SC.h - 80)]; }
const PAIRS = [[0, 2], [1, 3], [4, 5], [5, 6], [7, 8], [9, 10], [11, 12], [12, 13]];
const CODES = ['7A3F', 'C21B', '9E04', '4D8A', 'B6F2', 'E15C', '08D7', 'F3A9'];
function codeSlot(k) { return [175 + (k % 4) * 243, 905 + Math.floor(k / 4) * 84]; }
function sceneCode(t) {
  const t3 = LS(3), kC = CK('se banta'), t4 = LS(4), kM = CK('milaan');
  card(SC.x, SC.y, SC.w, SC.h, 32, C.box, 6, 10);
  // star pairs
  PAIRS.forEach(([a, b], k) => {
    const f = P(t, t3 + 0.05 + k * 0.1, t3 + 0.3 + k * 0.1); if (f <= 0) return;
    const A = starPos(a), B = starPos(b);
    line(polyPart([A, B], eo(f)), '#ffffff', 6);
  });
  PEAKS.forEach((_, i) => { const [x, y] = starPos(i); star(x, y, 22 + 2 * Math.sin(t * 6 + i), C.yel, t * 0.6 + i, 3); });
  // formula line
  const ff = P(t, kC - 0.1, kC + 0.2) * (1 - P(t, t4 - 0.1, t4 + 0.1));
  chip(540, 1130, 'SUR 1 + SUR 2 + GAP = CODE', C.yel, ff, { size: 28, h: 66 });
  // codes fly out of the pairs into slots
  PAIRS.forEach(([a, b], k) => {
    const s0 = kC + k * 0.07, u = eio(P(t, s0, s0 + 0.45)); if (t < s0) return;
    const A = starPos(a), B = starPos(b), m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], d = codeSlot(k);
    const x = L(m[0], d[0], u), y = L(m[1], d[1], u);
    const ok = t > kM + k * 0.05;
    chip(x, y, CODES[k], ok ? C.grn : C.cyan, P(t, s0, s0 + 0.2), { size: 30, h: 62, pad: 40 });
  });
  // database of songs
  const df = P(t, t4 - 0.15, t4 + 0.2);
  if (df > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, df * 2);
    const dy = L(60, 0, eo(df));
    card(110, 1090 + dy, 860, 300, 30, '#fbf7ee', 6, 10);
    ctx.save(); rr(110, 1090 + dy, 860, 300, 30); ctx.clip();
    const o = t < kM ? Math.max(0, t - t4) * 520 : (kM - t4) * 520 + (t - kM) * 60;
    for (let i = -1; i < 6; i++) {
      const n = Math.floor(o / 64) + i, y = 1150 + dy + i * 64 - (o % 64);
      ctx.fillStyle = POP[((n % 6) + 6) % 6]; rr(150, y - 22, 44, 44, 8); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      rr(215, y - 9, 200 + 120 * hash(n, 3), 18, 9); ctx.fillStyle = '#c9cde6'; ctx.fill();
      txt(`#${String(100000 + ((n * 7919) % 900000)).slice(0, 6)}`, 930, y, `700 24px ${MONO}`, '#7d83a8', 'right');
    }
    ctx.restore();
    // scan bar
    if (t > t4 + 0.1) {
      const sy = 1110 + dy + 260 * (0.5 + 0.5 * Math.sin((t - t4) * 9));
      ctx.fillStyle = hexA(C.cyan, 0.35); ctx.fillRect(114, sy - 18, 852, 36);
    }
    ctx.restore();
  }
  chip(540, 1090, 'LAAKHON GAANE', C.yel, P(t, t4 + 0.05, t4 + 0.35), { size: 30, h: 64 });
}

// ---------- scene 4: sirf 2% code bache ... phir bhi match ----------
const GX = 216, GY = 450, GS = 72, SURV = [37, 74];
function sceneMatch(t) {
  const t5 = LS(5), kB = CK('phir bhi'), k0 = t5 + 0.35, k1 = kB - 0.25;
  const mf = P(t, kB, kB + 0.3);
  ctx.save(); ctx.globalAlpha *= 1 - 0.6 * mf;
  card(150, 360, 780, 790, 36, C.box, 6, 10);
  txt('100 CODES', 540, 1110, `700 30px ${MONO}`, C.mute);
  for (let i = 0; i < 100; i++) {
    const c = i % 10, r = Math.floor(i / 10), x = GX + c * GS, y = GY + r * GS;
    const f = P(t, t5 - 0.15 + i * 0.004, t5 + 0.1 + i * 0.004); if (f <= 0) continue;
    const surv = SURV.includes(i);
    const kt = L(k0, k1, hash(i, 5));
    const dead = !surv && t > kt;
    ctx.save(); ctx.translate(x, y); const s = back(f) * (surv && t > k1 ? 1 + 0.12 * Math.sin(t * 12) : 1); ctx.scale(s, s);
    rr(-28, -28, 56, 56, 12);
    ctx.fillStyle = dead ? 'rgba(255,255,255,0.10)' : surv && t > k1 ? C.yel : C.cyan; ctx.fill();
    if (!dead) { ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
    else { ctx.globalAlpha *= 0.5; line([[-10, -10], [10, 10]], 'rgba(255,255,255,0.6)', 3); line([[10, -10], [-10, 10]], 'rgba(255,255,255,0.6)', 3); }
    ctx.restore();
  }
  // noise wave sweeping across
  const nw = P(t, k0 - 0.1, k1 + 0.1);
  if (nw > 0 && nw < 1) {
    const x = L(120, 960, nw);
    ctx.beginPath(); for (let k = 0; k <= 30; k++) { const y = 380 + k * 25; ctx.lineTo(x + (k % 2 ? 26 : -26), y); }
    ctx.lineWidth = 10; ctx.strokeStyle = C.red; ctx.lineJoin = 'miter'; ctx.stroke();
    chip(Math.min(860, Math.max(220, x)), 335, 'SHOR', C.red, 1, { size: 26, h: 54 });
  }
  ctx.restore();
  // counter
  const left = t < k0 ? 100 : Math.max(2, Math.round(100 - 98 * P(t, k0, k1)));
  chip(540 + shake(t, k1), 1235, `${left} CODES BACHE`, left > 2 ? C.cyan : C.red, P(t, t5 + 0.2, t5 + 0.45) * (1 - P(t, kB + 0.2, kB + 0.4)), { size: 32, h: 70 });
  // MATCH card
  popAt(540, 760, mf, () => {
    card(-330, -200, 660, 400, 40, C.grn, 6, 12);
    albumArt(-185, -40, 1.1);
    txt('MATCH!', 90, -60, SANSB(96), INK);
    txt('gaana mil gaya', 90, 25, `700 30px ${MONO}`, INK);
    popAt(0, 140, P(t, kB + 0.25, kB + 0.5), () => tickMark(0, 0, 44, '#ffffff'));
  });
  chip(540 + shake(t, kB + 0.45), 1235, 'SIRF 2% BHI KAAFI!', C.yel, P(t, kB + 0.45, kB + 0.75), { size: 32, h: 70 });
}

// ---------- scene 5: CTA chat ----------
function sceneCTA(t) {
  const t0 = LS(6) - 0.4, kD = CK('DJ dost');
  const pa = P(t, t0, t0 + 0.4);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pa * 2);
  phoneBody(540, 875, L(0.85, 0.95, back(pa)), () => {
    rr(-182, -372, 364, 125, 0); ctx.fillStyle = '#2d2752'; ctx.fill();
    disc(-120, -302, 30, C.cyan, 3); txt('D', -120, -300, SANSB(30), INK);
    txt('DJ Dost', -72, -316, `700 32px ${SANS}`, '#ffffff', 'left'); txt('online', -72, -280, `500 20px ${MONO}`, C.grn, 'left');
    const bub = (y, text, right, f, col, tc) => {
      if (f <= 0) return; ctx.save(); ctx.globalAlpha *= Math.min(1, f * 3); ctx.font = `600 28px ${SANS}`;
      const lines = text.split('\n'); const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 44; const h = 26 + lines.length * 40;
      const x = right ? 165 - w : -165; ctx.translate(0, L(20, 0, eo(f)));
      rr(x, y, w, h, 22); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      lines.forEach((l, i) => txt(l, x + 22, y + 33 + i * 40, `600 28px ${SANS}`, tc, 'left'));
      ctx.restore();
    };
    const lab = (y, s, f) => { if (f > 0) { ctx.save(); ctx.globalAlpha *= f; txt(s, 0, y, `700 20px ${MONO}`, C.dim); ctx.restore(); } };
    lab(-215, 'AAJ · PARTY ME', P(t, t0 + 0.15, t0 + 0.35));
    bub(-190, 'ye kaunsa gaana\nbaj raha hai??', false, P(t, t0 + 0.2, t0 + 0.5), '#4a4280', '#ffffff');
    bub(-60, 'Shazam karo!\nye reel dekh', true, P(t, LS(6) + 0.4, LS(6) + 0.7), C.yel, INK);
    const typing = t > kD - 0.1 && t < kD + 0.5;
    if (typing) { rr(-165, 85, 120, 60, 22); ctx.fillStyle = '#4a4280'; ctx.fill(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-133 + i * 28, 115 + Math.sin(t * 10 + i) * 5, 8, 0, 7); ctx.fillStyle = C.mute; ctx.fill(); } }
    bub(85, 'gaane ki PHOTO?!\nwah', false, P(t, kD + 0.5, kD + 0.8), '#4a4280', '#ffffff');
  });
  ctx.restore();
  chip(540, 380, 'DJ DOST KO BHEJO', C.yel, P(t, t0 + 0.2, t0 + 0.5), { size: 30, h: 66 });
  const bf = P(t, kD + 0.9, kD + 1.15);
  if (bf > 0) chip(540 + shake(t, kD + 0.9), 1345, 'PHOTO → TAARE → CODE', C.cyan, bf, { size: 30, h: 72 });
}

function sceneList() {
  return [[0, LS(1), sceneHook], [LS(1), LS(3), scenePhoto], [LS(3), LS(5), sceneCode],
          [LS(5), LS(6) - 0.4, sceneMatch], [LS(6) - 0.4, END + 0.4, sceneCTA]];
}
function reelBursts(t) {
  const tR = CK('Shazam ne') + 0.15;
  burst(t, tR + 0.05, 540, 760, [C.grn, C.yel, '#ffffff'], 24, 1.1);
  burst(t, CK('PHOTO') + 0.05, 540, 800, [C.yel, '#ffffff', C.cyan], 26, 1.3);
  burst(t, CK('ban jaate') + 0.2, 540, 740, [C.yel, C.org, '#ffffff'], 24, 1.2);
  burst(t, CK('phir bhi') + 0.1, 540, 760, [C.grn, C.yel, C.cyan], 30, 1.4);
  burst(t, CK('DJ dost') + 0.9, 540, 1345, [C.cyan, C.yel, C.pink], 22);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈↑')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
