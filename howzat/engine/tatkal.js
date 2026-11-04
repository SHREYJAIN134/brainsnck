window.BG = '#2f6b70';
// "Tatkal 1 minute me full kyun ho jaata hai?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// Tatkal reel scenes
// =====================================================================
window.TOPIC = 'Tatkal';
function STEPS() { return [[0, '10:00 AM'], [LS(1), 'BOTS KA RAAZ'], [LS(5), 'AB KYA BADLA']]; }
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
function ripple(x, y, t, t0, col = '#ffffff') {
  const r = P(t, t0, t0 + 0.5); if (r <= 0 || r >= 1) return;
  ctx.beginPath(); ctx.arc(x, y, 20 + 80 * eo(r), 0, 7); ctx.lineWidth = 9 * (1 - r); ctx.strokeStyle = col; ctx.stroke();
}
function robotHead(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[0, -60], [0, -86]], INK, 6); disc(0, -92, 11, C.red, 2);
  card(-62, -62, 124, 108, 24, C.purple, 5, 6);
  disc(-28, -14, 16, '#ffffff', 0); disc(28, -14, 16, '#ffffff', 0);
  ctx.beginPath(); ctx.arc(-28, -14, 6, 0, 7); ctx.arc(28, -14, 6, 0, 7); ctx.fillStyle = INK; ctx.fill();
  rr(-30, 18, 60, 14, 5); ctx.fillStyle = INK; ctx.fill();
  for (const k of [-15, 0, 15]) { ctx.fillStyle = C.purple; ctx.fillRect(k - 2, 18, 4, 14); }
  ctx.restore();
}
function humanHead(x, y, s, col = C.grn) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  disc(0, 0, 60, col, 6);
  ctx.beginPath(); ctx.arc(-20, -12, 7, 0, 7); ctx.arc(20, -12, 7, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 8, 26, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
  ctx.restore();
}
// small round token: 0 = unknown "?", 1 = bot, 2 = insaan
function token(kind, r = 36) {
  if (kind === 0) { disc(0, 0, r, '#c9cde6', 4); txt('?', 0, 3, SANSB(40), INK); return; }
  if (kind === 1) {
    line([[0, -r], [0, -r - 12]], INK, 4); ctx.beginPath(); ctx.arc(0, -r - 14, 6, 0, 7); ctx.fillStyle = C.red; ctx.fill();
    ctx.save(); hardShadow(-r, -r * 0.85, 2 * r, r * 1.7, 14, 4); rr(-r, -r * 0.85, 2 * r, r * 1.7, 14); ctx.fillStyle = C.purple; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    rr(-r * 0.6, -r * 0.35, r * 0.4, r * 0.4, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
    rr(r * 0.2, -r * 0.35, r * 0.4, r * 0.4, 4); ctx.fill();
    rr(-r * 0.45, r * 0.3, r * 0.9, r * 0.18, 3); ctx.fillStyle = INK; ctx.fill();
    return;
  }
  disc(0, 0, r, C.grn, 4);
  ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.18, r * 0.11, 0, 7); ctx.arc(r * 0.32, -r * 0.18, r * 0.11, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.42, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
}
// side view of a train coach centred at (x, y); n = how many of the 8 berths are taken
function coach(x, y, s, n, label = 'TATKAL · 3A', who = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line([[-440, 132], [440, 132]], INK, 8);
  for (const wx of [-300, -215, 215, 300]) { disc(wx, 104, 28, '#5b6290', 0); ctx.beginPath(); ctx.arc(wx, 104, 10, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  card(-385, -112, 770, 206, 34, C.cyan, 6, 10);
  ctx.fillStyle = C.yel; ctx.fillRect(-381, 42, 762, 18);
  line([[-381, 42], [381, 42]], INK, 3); line([[-381, 60], [381, 60]], INK, 3);
  for (let i = 0; i < 8; i++) {
    const wx = -334 + i * 84, f = clamp(n - i);
    rr(wx, -84, 60, 72, 10); ctx.fillStyle = f > 0.5 ? C.red : '#e8f6fb'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    if (f > 0) {
      ctx.save(); rr(wx, -84, 60, 72, 10); ctx.clip(); ctx.translate(wx + 30, -36 + 30 * (1 - eo(f)));
      if (who === 1) { rr(-18, -18, 36, 30, 6); ctx.fillStyle = C.purple; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-11, -9, 7, 7); ctx.fillRect(4, -9, 7, 7); }
      else { ctx.beginPath(); ctx.arc(0, -6, 13, 0, 7); ctx.fillStyle = INK; ctx.fill(); rr(-20, 8, 40, 30, 12); ctx.fill(); }
      ctx.restore();
    }
  }
  txt(label, 0, 14, `700 30px ${MONO}`, INK);
  ctx.restore();
}

// ---------- scene 1: 10:00 baje Tatkal khula ... 1 minute me WAITING ----------
function hookTimes() { const tOpen = 0.72, kM = CK('ek minute'); return { tOpen, kM, ff0: kM + 0.05, ff1: kM + 0.8, tW: kM + 0.85 }; }
function clockStr(t) {
  const { tOpen, ff0, ff1 } = hookTimes();
  if (t < tOpen) return `09:59:${t < 0.36 ? 58 : 59}`;
  const secs = Math.min(60, Math.floor(60 * eio(P(t, ff0, ff1))));
  return secs >= 60 ? '10:01:00' : `10:00:${String(secs).padStart(2, '0')}`;
}
function sceneHook(t) {
  const { tOpen, ff0, ff1, tW } = hookTimes();
  const flash = win(t, tOpen, tOpen + 0.5, 0.05, 0.3);
  card(250, 350, 580, 210, 40, flash > 0 ? (flash > 0.5 ? C.grn : C.box) : C.box, 6, 10);
  txt('TATKAL WINDOW', 540, 398, `700 26px ${MONO}`, flash > 0.5 ? INK : C.mute);
  const col = flash > 0.5 ? INK : t < tOpen ? '#ffffff' : t < ff1 ? C.grn : C.red;
  ctx.save(); ctx.translate(540 + shake(t, ff1, 0.4, 6), 482); txt(clockStr(t), 0, 0, `700 96px ${MONO}`, col); ctx.restore();
  chip(540, 612, 'BOOKING OPEN!', C.grn, P(t, tOpen, tOpen + 0.3) * (1 - P(t, ff0 - 0.05, ff0 + 0.1)), { size: 30, h: 64 });
  chip(540, 612, 'TICK... TICK... TICK', C.yel, P(t, ff0, ff0 + 0.25) * (1 - P(t, tW - 0.1, tW + 0.05)), { size: 30, h: 64 });
  chip(540 + shake(t, tW), 612, 'SIRF 1 MINUTE!', C.red, P(t, tW, tW + 0.3), { size: 30, h: 64 });
  const nb = 8 * eo(P(t, ff0, ff1));
  coach(540, 840, 1.08, nb);
  // availability card
  card(200, 1070, 680, 230, 36, C.box, 6, 10);
  const avl = t < ff0 ? 120 : Math.round(120 * (1 - eo(P(t, ff0, ff1))));
  txt('SEATS AVAILABLE', 540, 1118, `700 26px ${MONO}`, C.mute);
  const ac = t < tOpen ? '#ffffff' : avl > 60 ? C.grn : avl > 0 ? C.org : C.red;
  txt(`AVL ${avl}`, 540, 1210, `700 100px ${MONO}`, ac);
  const sf = P(t, tW, tW + 0.22);
  if (sf > 0) {
    ctx.save(); ctx.translate(540 + shake(t, tW, 0.45, 12), 1185); ctx.rotate(-0.1); const s = L(2.2, 1, eo(sf)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, sf * 2);
    card(-250, -86, 500, 172, 28, C.red, 6, 10);
    txt('WAITING', 0, -8, SANSB(92), INK);
    txt('WL 87', 0, 58, `700 30px ${MONO}`, INK);
    ctx.restore();
  }
}

// ---------- scene 2: aadhe se zyada koshishein ... bots ki thi ----------
const GX0 = 153, GY0 = 600, GDX = 86, GDY = 112, GC = 10, GR = 5, NB = 29;   // 29 / 50 = 58%
function sceneBots(t) {
  const t1 = LS(1), kA = CK('Aadhe'), kB = CK('bots');
  card(80, 440, 920, 680, 40, C.box, 6, 12);
  txt('BOOKING KOSHISHEIN', 540, 496, `700 30px ${MONO}`, C.mute);
  // the half-way line
  const hf = P(t, kA + 0.1, kA + 0.5);
  if (hf > 0) {
    const hx = GX0 + 4.5 * GDX;
    ctx.save(); ctx.globalAlpha *= hf; ctx.setLineDash([16, 14]); line([[hx, 545], [hx, L(545, 1110, eo(hf))]], '#ffffff', 5); ctx.restore();
  }
  for (let c = 0; c < GC; c++) for (let r = 0; r < GR; r++) {
    const i = c * GR + r, x = GX0 + c * GDX, y = GY0 + r * GDY;
    const f = P(t, t1 + 0.1 + i * 0.028, t1 + 0.3 + i * 0.028); if (f <= 0) continue;
    const fs = kB + 0.02 + c * 0.045 + r * 0.012, u = P(t, fs, fs + 0.18);
    const kind = u < 0.5 ? 0 : (i < NB ? 1 : 2);
    ctx.save(); ctx.translate(x, y + (kind === 1 ? Math.sin(t * 7 + i) * 2 : 0)); const s = back(f);
    ctx.scale(s * Math.max(0.06, Math.abs(Math.cos(Math.PI * u))), s); ctx.globalAlpha *= Math.min(1, f * 3);
    token(kind, 34); ctx.restore();
  }
  chip(540, 1120, 'AADHA', '#ffffff', P(t, kA + 0.3, kA + 0.6), { size: 26, h: 54 });
  chip(310 + shake(t, kB + 0.55), 1225, '58% BOTS', C.red, P(t, kB + 0.55, kB + 0.85), { size: 38, h: 84 });
  chip(780, 1225, '42% INSAAN', C.grn, P(t, kB + 0.7, kB + 1.0), { size: 30, h: 70 });
  const sa = P(t, kB + 0.85, kB + 1.1);
  if (sa > 0) { ctx.save(); ctx.globalAlpha *= sa; txt('Railway ministry · Lok Sabha · July 2026', 540, 1318, `500 24px ${MONO}`, 'rgba(255,255,255,0.85)'); ctx.restore(); }
}

// ---------- scene 3: form pehle se bhara, captcha khud solve ----------
const FIELDS = [['NAME', 'RAHUL S'], ['AGE', '28'], ['BERTH', 'LOWER'], ['PAYMENT', 'READY']];
function captchaArt(x, y, w, h, s) {
  ctx.save(); rr(x, y, w, h, 16); ctx.fillStyle = '#d7dcf0'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.clip();
  for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(x + 30 + k * 45, y + 20 + (k % 3) * 30, 4, 0, 7); ctx.fillStyle = '#9aa2c8'; ctx.fill(); }
  [...s].forEach((ch, i) => {
    ctx.save(); ctx.translate(x + 50 + i * 58, y + h / 2 + (i % 2 ? 8 : -6)); ctx.rotate((i % 2 ? 0.3 : -0.25));
    txt(ch, 0, 0, `700 54px ${MONO}`, [C.pink, INK, '#5b6290', INK, C.purple][i % 5]); ctx.restore();
  });
  ctx.beginPath(); for (let k = 0; k <= 40; k++) { const px = x + k * w / 40, py = y + h / 2 + Math.sin(k * 0.7) * 14; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function sceneForm(t) {
  const t2 = LS(2), kC = CK('captcha'), tP = kC + 0.95;
  card(130, 350, 820, 960, 36, '#ffffff', 6, 12);
  ctx.save(); rr(130, 350, 820, 110, [36, 36, 0, 0]); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
  txt('PASSENGER DETAILS', 170, 407, SANSB(38), INK, 'left');
  popAt(880, 412, P(t, t2 - 0.05, t2 + 0.25), () => robotHead(0, 10, 0.5));
  FIELDS.forEach(([lab, val], i) => {
    const y = 495 + i * 104, ft = t2 + 0.15 + i * 0.12;
    rr(170, y, 740, 84, 16); ctx.fillStyle = '#eef1fb'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    txt(lab, 196, y + 43, `700 24px ${MONO}`, '#7d83a8', 'left');
    const n = Math.floor(val.length * P(t, ft, ft + 0.1));
    txt(val.slice(0, n), 380, y + 45, SANSB(38), INK, 'left');
    popAt(866, y + 42, P(t, ft + 0.1, ft + 0.3), () => tickMark(0, 0, 22, C.grn));
  });
  txt('CAPTCHA', 172, 940, `700 24px ${MONO}`, '#7d83a8', 'left');
  captchaArt(170, 965, 330, 110, 'x7Kp2');
  rr(530, 965, 380, 110, 16); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = t > kC - 0.1 && t < kC + 0.7 ? C.cyan : INK; ctx.stroke();
  const cn = Math.floor(5 * P(t, kC + 0.2, kC + 0.45));
  txt('x7Kp2'.slice(0, cn), 560, 1022, `700 54px ${MONO}`, INK, 'left');
  popAt(866, 1020, P(t, kC + 0.5, kC + 0.75), () => tickMark(0, 0, 26, C.grn));
  // book button
  const done = t > tP + 0.05;
  ctx.save(); ctx.translate(540, 1200); const bs = 1 - 0.08 * win(t, tP - 0.05, tP + 0.12, 0.05, 0.1); ctx.scale(bs, bs);
  card(-210, -55, 420, 110, 55, done ? C.grn : C.yel, 5, 8);
  txt(done ? 'BOOKED!' : 'BOOK NOW', 0, 3, SANSB(42), INK); ctx.restore();
  ripple(540, 1200, t, tP, '#ffffff');
  chip(540, 1365, 'AUTO-FILL', C.yel, P(t, t2 + 0.4, t2 + 0.7) * (1 - P(t, kC - 0.05, kC + 0.1)), { size: 32, h: 70 });
  chip(540, 1365, 'CAPTCHA BHI AUTO', C.cyan, P(t, kC + 0.1, kC + 0.4), { size: 32, h: 70 });
}

// ---------- scene 4: kayi IDs ek saath ----------
const IDXY = [[230, 690], [540, 690], [850, 690], [230, 870], [540, 870], [850, 870]];
function sceneIDs(t) {
  const t3 = LS(3);
  const rf = P(t, t3 - 0.05, t3 + 0.25);
  // lines from the bot to every ID
  IDXY.forEach(([x, y], k) => {
    const f = P(t, t3 + 0.1 + k * 0.08, t3 + 0.3 + k * 0.08); if (f <= 0) return;
    ctx.save(); ctx.globalAlpha *= f; ctx.setLineDash([12, 12]); line([[540, 500], [x, y - 60]], 'rgba(255,255,255,0.6)', 4); ctx.restore();
  });
  // packets from every ID down to the coach
  IDXY.forEach(([x, y], k) => {
    const st = t3 + 0.45 + k * 0.05; if (t < st) return;
    for (let q = 0; q < 2; q++) {
      const u = ((t - st) * 1.6 + q / 2 + k * 0.13) % 1;
      const a = [x, y + 70], b = [L(240, 840, k / 5), 1095];
      ctx.save(); ctx.globalAlpha *= Math.min(1, (t - st) * 4) * (1 - P(t, t3 + 1.55, t3 + 1.75));
      disc(L(a[0], b[0], u), L(a[1], b[1], u), 11, C.purple, 2); ctx.restore();
    }
  });
  popAt(540, 470, rf, () => robotHead(0, 0, 1.05));
  IDXY.forEach(([x, y], k) => popAt(x, y, P(t, t3 + 0.1 + k * 0.08, t3 + 0.35 + k * 0.08), () => {
    card(-130, -68, 260, 136, 24, '#ffffff', 5, 7);
    disc(-72, 0, 34, POP[k % POP.length], 3);
    ctx.beginPath(); ctx.arc(-72, -8, 11, 0, 7); ctx.fillStyle = INK; ctx.fill(); rr(-90, 6, 36, 18, 8); ctx.fill();
    txt(`ID ${k + 1}`, 20, -16, SANSB(36), INK);
    txt(`user_0${k + 1}`, 20, 26, `500 22px ${MONO}`, '#7d83a8');
  }));
  coach(540, 1185, 0.95, 8 * eo(P(t, t3 + 0.6, t3 + 1.6)), 'TATKAL · 3A', 1);
  chip(540 + shake(t, t3 + 0.95), 1375, 'EK SAATH, KAYI TICKET', C.red, P(t, t3 + 0.95, t3 + 1.25), { size: 30, h: 68 });
}

// ---------- scene 5: tum type karte raho ... seat gayi ----------
function sceneHuman(t) {
  const t4 = LS(4), kS = CK('seat gayi');
  const sh = shake(t, kS, 0.5, 10);
  popAt(165, 640, P(t, t4 - 0.05, t4 + 0.25), () => humanHead(0, 0, 1));
  chip(165, 750, 'TUM', C.grn, P(t, t4 + 0.05, t4 + 0.35), { size: 28, h: 60 });
  popAt(915, 640, P(t, t4 + 0.15, t4 + 0.45), () => robotHead(0, 10, 0.95));
  chip(915, 750, 'BOT', C.purple, P(t, t4 + 0.25, t4 + 0.55), { size: 28, h: 60 });
  popAt(975, 560, P(t, t4 + 0.4, t4 + 0.65), () => tickMark(0, 0, 26, C.grn));
  const pa = P(t, t4 - 0.1, t4 + 0.3);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pa * 2);
  phoneBody(540 + sh, 860, L(0.72, 0.82, back(pa)), () => {
    rr(-182, -372, 364, 120, 0); ctx.fillStyle = '#1b2246'; ctx.fill();
    const secs = Math.min(59, 47 + Math.floor((t - t4) * 4));
    txt(`10:00:${secs}`, 0, -300, `700 40px ${MONO}`, t > kS ? C.red : C.yel);
    [['NAME', -205], ['AGE', -95], ['BERTH', 15]].forEach(([lab, y], i) => {
      txt(lab, -160, y - 18, `700 18px ${MONO}`, C.dim, 'left');
      rr(-160, y, 320, 66, 14); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = i === 0 ? C.cyan : 'rgba(255,255,255,0.3)'; ctx.stroke();
      if (i === 0) {
        const s = 'Rahul Sharma'.slice(0, Math.max(0, Math.floor((t - t4 - 0.1) * 3.2)));
        txt(s, -140, y + 35, `600 32px ${SANS}`, '#ffffff', 'left');
        ctx.font = `600 32px ${SANS}`; const w = ctx.measureText(s).width;
        if (Math.floor(t * 3) % 2 === 0) { ctx.fillStyle = C.cyan; ctx.fillRect(-136 + w, y + 14, 5, 40); }
      }
    });
    captchaArt(-160, 140, 320, 90, 'q3Zf');
    const of = P(t, kS, kS + 0.25);
    if (of > 0) {
      ctx.fillStyle = hexA(C.box, 0.85 * of); ctx.fillRect(-182, -252, 364, 624);
      popAt(0, 40, of, () => {
        card(-150, -110, 300, 220, 28, C.red, 5, 8);
        txt('WL 87', 0, -30, SANSB(64), INK);
        txt('NO SEATS', 0, 45, `700 28px ${MONO}`, INK);
      });
    }
  });
  ctx.restore();
  chip(540 + shake(t, kS + 0.35), 1365, 'BOT PEHLE JEET GAYA', C.red, P(t, kS + 0.35, kS + 0.65), { size: 30, h: 68 });
}

// ---------- scene 6: Aadhaar check + anti-bot shield ----------
function shieldShape(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const path = () => { ctx.beginPath(); ctx.moveTo(0, -150); ctx.lineTo(115, -110); ctx.quadraticCurveTo(115, 70, 0, 150); ctx.quadraticCurveTo(-115, 70, -115, -110); ctx.closePath(); };
  ctx.save(); ctx.translate(9, 9); path(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  line([[-45, 0], [-12, 36], [50, -38]], INK, 16);
  ctx.restore();
}
function sceneShield(t) {
  const t5 = LS(5), kN = CK('anti-bot'), kA = CK('Ab Aadhaar');
  // ID card
  popAt(310, 560, P(t, kA, kA + 0.3), () => {
    card(-200, -130, 400, 260, 26, '#ffffff', 5, 9);
    ctx.save(); rr(-200, -130, 400, 64, [26, 26, 0, 0]); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
    txt('AADHAAR', 0, -96, `700 28px ${MONO}`, INK);
    rr(-170, -46, 120, 140, 14); ctx.fillStyle = '#d7dcf0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(-110, 0, 24, 0, 7); ctx.fillStyle = '#5b6290'; ctx.fill(); rr(-146, 30, 72, 50, 20); ctx.fill();
    for (let k = 0; k < 4; k++) { rr(-30, -36 + k * 34, k === 0 ? 190 : 150 - k * 20, 14, 7); ctx.fillStyle = k === 0 ? INK : '#c9cde6'; ctx.fill(); }
    // fingerprint
    for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.arc(140, 70, k * 9, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 4; ctx.strokeStyle = C.pink; ctx.stroke(); }
  });
  // OTP card
  popAt(790, 560, P(t, kA + 0.25, kA + 0.55), () => {
    card(-185, -130, 370, 260, 26, C.box, 5, 9);
    txt('OTP', 0, -82, `700 30px ${MONO}`, C.mute);
    const d = '482916', n = Math.floor(6 * P(t, kA + 0.5, kA + 0.95));
    for (let i = 0; i < 6; i++) {
      rr(-160 + i * 54, -40, 44, 62, 10); ctx.fillStyle = i < n ? C.yel : 'rgba(255,255,255,0.12)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      if (i < n) txt(d[i], -138 + i * 54, -7, `700 34px ${MONO}`, INK);
    }
    popAt(0, 82, P(t, kA + 1.0, kA + 1.25), () => chip(0, 0, 'ASLI USER', C.grn, 1, { size: 26, h: 56 }));
  });
  // lane with server, shield, bots and a human
  const lf = P(t, t5 + 0.25, t5 + 0.55);
  if (lf > 0) {
    ctx.save(); ctx.globalAlpha *= lf;
    rr(70, 1030, 940, 100, 50); ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fill();
    card(780, 950, 220, 260, 28, C.box, 5, 9);
    for (let k = 0; k < 3; k++) { rr(805, 980 + k * 62, 170, 46, 10); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(); ctx.beginPath(); ctx.arc(950, 1003 + k * 62, 8, 0, 7); ctx.fillStyle = C.grn; ctx.fill(); }
    txt('TICKET SERVER', 890, 1250, `700 24px ${MONO}`, '#ffffff');
    ctx.restore();
  }
  const SX = 520;
  for (let k = 0; k < 3; k++) {
    const sk = kN - 0.3 + k * 0.24, y = 1000 + k * 70;
    if (t < t5 + 0.35) continue;
    const go = P(t, sk, sk + 0.3), bk = P(t, sk + 0.3, sk + 0.75);
    const x = L(170 + k * 90, SX - 90, eio(go)) - 230 * eo(bk);
    ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, t5 + 0.35, t5 + 0.6)) * (1 - P(t, sk + 0.55, sk + 0.8));
    ctx.translate(x, y); ctx.rotate(-1.2 * eo(bk)); token(1, 32); ctx.restore();
    popAt(SX - 90, y - 50, win(t, sk + 0.3, sk + 0.85, 0.15, 0.2), () => crossMark(0, 0, 24, C.red));
  }
  const hs = kN + 0.05, hu = eio(P(t, hs, hs + 0.55));
  if (t > t5 + 0.35) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, t5 + 0.35, t5 + 0.6)) * (1 - P(t, hs + 0.55, hs + 0.7));
    ctx.translate(L(90, 860, hu), 1080 + Math.sin(hu * Math.PI) * -40); token(2, 34); ctx.restore();
  }
  popAt(890, 930, P(t, hs + 0.55, hs + 0.8), () => tickMark(0, 0, 34, C.grn));
  popAt(SX, 1080, P(t, kN - 0.05, kN + 0.25), () => shieldShape(0, 0, 0.95, C.grn));
  chip(540, 1365, 'ANTI-BOT SHIELD', C.grn, P(t, kN + 0.1, kN + 0.4), { size: 32, h: 70 });
}

// ---------- scene 7: CTA chat ----------
function sceneCTA(t) {
  const t0 = LS(6) - 0.4, kD = CK('haare dost');
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
    lab(-215, 'AAJ · 10:01 AM', P(t, t0 + 0.15, t0 + 0.35));
    bub(-190, 'bhai Tatkal phir\nWAITING me gaya', false, P(t, t0 + 0.2, t0 + 0.5), '#3a4373', '#ffffff');
    bub(-60, 'bots se haara tu!\nye reel dekh', true, P(t, LS(6) + 0.45, LS(6) + 0.75), C.yel, INK);
    const typing = t > kD - 0.15 && t < kD + 0.55;
    if (typing) { rr(-165, 85, 120, 60, 22); ctx.fillStyle = '#3a4373'; ctx.fill(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-133 + i * 28, 115 + Math.sin(t * 10 + i) * 5, 8, 0, 7); ctx.fillStyle = C.mute; ctx.fill(); } }
    bub(85, 'ohh... BOTS the?!', false, P(t, kD + 0.55, kD + 0.85), '#3a4373', '#ffffff');
  });
  ctx.restore();
  chip(540, 380, 'IS DOST KO BHEJO', C.yel, P(t, t0 + 0.2, t0 + 0.5), { size: 30, h: 66 });
  const bf = P(t, kD + 0.95, kD + 1.2);
  if (bf > 0) chip(540 + shake(t, kD + 0.95), 1345, 'TATKAL = BOTS vs TUM', C.red, bf, { size: 32, h: 76 });
}

function sceneList() {
  return [[0, LS(1), sceneHook], [LS(1), LS(2), sceneBots], [LS(2), LS(3), sceneForm], [LS(3), LS(4), sceneIDs],
          [LS(4), LS(5), sceneHuman], [LS(5), LS(6) - 0.4, sceneShield], [LS(6) - 0.4, END + 0.4, sceneCTA]];
}
function reelBursts(t) {
  const { tW } = hookTimes();
  burst(t, 0.72, 540, 482, [C.grn, C.yel, '#ffffff'], 18, 0.9);
  burst(t, tW + 0.1, 540, 1185, [C.red, C.org, C.yel], 26, 1.2);
  burst(t, CK('bots') + 0.6, 310, 1225, [C.red, C.org, C.purple], 24, 1.1);
  burst(t, CK('seat gayi') + 0.15, 540, 900, [C.red, C.org, C.yel], 26, 1.2);
  burst(t, CK('anti-bot'), 520, 1080, [C.grn, C.cyan, '#ffffff'], 24, 1.1);
  burst(t, CK('haare dost') + 0.95, 540, 1345, [C.red, C.org, C.yel], 22);
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
