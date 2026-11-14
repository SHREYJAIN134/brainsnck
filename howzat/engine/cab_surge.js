window.BG = '#33407a';
// "Baarish me cab 3 guna mehngi kyun?" — 1080x1920, synced to window.TL (helpers from maps.js via the shaadi card reel)
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

// ---------- shared flat helpers (same as the digital arrest reel) ----------
const SANSB = s => `800 ${s}px ${SANS}`;
const LIGHT = '#c9cde6';
const PAPER = '#f4efe4';
const SKIN = '#e6b48a';
const NAVY = '#26306a';
const WALL = '#4a5aa0';

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
function shake(t, t0, d = 0.45, a = 8) { return t > t0 && t < t0 + d ? Math.sin(t * 80) * a * (1 - P(t, t0, t0 + d)) : 0; }
function ring(x, y, t, t0, col = '#ffffff', r0 = 20, r1 = 100, d = 0.6) {
  const r = P(t, t0, t0 + d); if (r <= 0 || r >= 1) return;
  ctx.beginPath(); ctx.arc(x, y, r0 + (r1 - r0) * eo(r), 0, 7); ctx.lineWidth = 9 * (1 - r); ctx.strokeStyle = col; ctx.stroke();
}
function chipW(x, y, label, col, t, a, b, opts = {}) {
  const fo = 1 - P(t, b - 0.2, b); if (fo <= 0) return;
  ctx.save(); ctx.globalAlpha *= fo; chip(x + shake(t, a, 0.4, 6), y, label, col, P(t, a, a + 0.3), opts); ctx.restore();
}
function star(x, y, r, col) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
}
// rubber stamp that slams down
function stamp(x, y, label, col, f, rot = -0.12, size = 72, tc = '#ffffff') {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const s = L(1.9, 1, eo(f)); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 2.5);
  ctx.font = SANSB(size); const w = ctx.measureText(label).width + 70, h = size * 1.5;
  hardShadow(-w / 2, -h / 2, w, h, 18, 9);
  rr(-w / 2, -h / 2, w, h, 18); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  rr(-w / 2 + 13, -h / 2 + 13, w - 26, h - 26, 10); ctx.lineWidth = 4; ctx.strokeStyle = tc === '#ffffff' ? '#ffffff' : INK; ctx.stroke();
  ctx.font = SANSB(size); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (tc === '#ffffff') { ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.strokeText(label, 0, 6); }
  ctx.fillStyle = tc; ctx.fillText(label, 0, 6);
  ctx.restore();
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

// ---------- phone ----------
const PW = 420, PH = 800;
function phone(cx, cy, s, screen) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  hardShadow(-PW / 2, -PH / 2, PW, PH, 62, 12);
  rr(-PW / 2, -PH / 2, PW, PH, 62); ctx.fillStyle = '#1b2148'; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  rr(-PW / 2 + 20, -PH / 2 + 20, PW - 40, PH - 40, 46); ctx.fillStyle = C.box; ctx.fill();
  ctx.save(); rr(-PW / 2 + 20, -PH / 2 + 20, PW - 40, PH - 40, 46); ctx.clip(); screen(); ctx.restore();
  rr(-PW / 2 + 20, -PH / 2 + 20, PW - 40, PH - 40, 46); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  rr(-48, -PH / 2 + 32, 96, 24, 12); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}
function note(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  hardShadow(-60, -32, 120, 64, 8, 4);
  rr(-60, -32, 120, 64, 8); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  txt('₹', 0, 2, SANSB(26), INK);
  ctx.restore();
}
function bubble(x, y, w, h, label, f, tail = 'left', size = 34) {
  popAt(x, y, f, () => {
    hardShadow(-w / 2, -h / 2, w, h, 26, 7);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath();
    if (tail === 'left') { ctx.moveTo(-w / 2 + 6, -10); ctx.lineTo(-w / 2 - 34, 0); ctx.lineTo(-w / 2 + 6, 18); }
    else { ctx.moveTo(-18, -h / 2 + 4); ctx.lineTo(0, -h / 2 - 34); ctx.lineTo(18, -h / 2 + 4); }
    ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.fillRect(tail === 'left' ? -w / 2 + 2 : -16, tail === 'left' ? -8 : -h / 2 + 2, tail === 'left' ? 8 : 32, tail === 'left' ? 24 : 6);
    txt(label, 0, 3, `800 ${size}px ${SANS}`, INK);
  });
}


// =====================================================================
// Cab surge pricing reel scenes
// =====================================================================
window.TOPIC = 'Cab Surge';
function STEPS() { return [[0, 'BAARISH SURGE'], [LS(1), 'ASLI RAAZ'], [LS(5), 'KAAM KI BAAT']]; }
const CAB = '#ffd166';
const RAIN = 'rgba(159,214,240,0.55)';

// ---------- small flat drawings (original, no logos) ----------
// top-view cab
function cab(x, y, s, rot, col = CAB) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-30 + 5, -50 + 5, 60, 100, 16); ctx.fillStyle = INK; ctx.fill();
  rr(-30, -50, 60, 100, 16); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  rr(-21, -30, 42, 20, 6); ctx.fillStyle = '#2a3366'; ctx.fill();
  rr(-21, 18, 42, 16, 6); ctx.fillStyle = '#2a3366'; ctx.fill();
  rr(-12, -6, 24, 14, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
// side-view cab for the phone
function cabSide(x, y, s, col = CAB) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-90, 10); ctx.lineTo(-80, -18); ctx.lineTo(-45, -22); ctx.lineTo(-25, -50); ctx.lineTo(35, -50); ctx.lineTo(60, -22); ctx.lineTo(88, -16); ctx.lineTo(92, 10); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-18, -42); ctx.lineTo(2, -42); ctx.lineTo(2, -24); ctx.lineTo(-34, -24); ctx.closePath(); ctx.fillStyle = '#2a3366'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, -42); ctx.lineTo(31, -42); ctx.lineTo(48, -24); ctx.lineTo(10, -24); ctx.closePath(); ctx.fill();
  rr(-12, -64, 30, 14, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  for (const wx of [-52, 54]) { disc(wx, 12, 17, '#2a2a3a', 0); ctx.beginPath(); ctx.arc(wx, 12, 7, 0, 7); ctx.fillStyle = LIGHT; ctx.fill(); }
  ctx.restore();
}
function person(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(4, 34, 30, 20, 0, Math.PI, 0); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 30, 30, 22, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  disc(0, -6, 17, SKIN, 3);
  ctx.restore();
}
function cloud(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const blobs = [[-90, 10, 55], [-30, -25, 70], [45, -10, 62], [100, 15, 48], [0, 25, 60]];
  for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx + 9, by + 9, r, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by, r + 4, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  for (const [bx, by, r] of blobs) { ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fillStyle = '#dfe4f5'; ctx.fill(); }
  ctx.restore();
}
function rain(t, a, y0 = 300, y1 = 1440) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = RAIN; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const x = 30 + 1020 * hash(i, 3), sp = 1100 + 500 * hash(i, 5), ph = hash(i, 8) * (y1 - y0);
    const y = y0 + ((ph + t * sp) % (y1 - y0));
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 10, y + 38); ctx.stroke();
  }
  ctx.restore();
}
function gear(x, y, r, rot, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i < n * 2; i++) {
    const a0 = i * Math.PI / n, a1 = (i + 1) * Math.PI / n, R = i % 2 ? r * 0.78 : r;
    ctx.arc(0, 0, R, a0, a1);
  }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, 7); ctx.fillStyle = C.box; ctx.fill(); ctx.stroke();
  ctx.restore();
}
function upArrow(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const pts = [[0, -80], [62, -10], [24, -10], [24, 70], [-24, 70], [-24, -10], [-62, -10]];
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a + 7, b + 7)); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

// ---------- scene 1: baarish aayi... 450 wali cab, 1285 ki ----------
function rideScreen(t, k4, k12) {
  ctx.fillStyle = '#2c356b'; ctx.fillRect(-200, -400, 400, 800);
  // mini map
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 16;
  for (const x of [-110, 40, 150]) { ctx.beginPath(); ctx.moveTo(x, -330); ctx.lineTo(x, 150); ctx.stroke(); }
  for (const y of [-230, -60, 90]) { ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(200, y); ctx.stroke(); }
  line([[-110, 90], [-110, -60], [40, -60], [40, -230]], C.cyan, 8, [16, 12]);
  pin(40, -250, 1, C.pink);
  disc(-110, 90, 14, C.grn, 3);
  cab(-110 + 6 * Math.sin(t * 2), 20, 0.55, 0, CAB);
  // top bar
  ctx.fillStyle = INK; ctx.fillRect(-200, -400, 400, 92);
  txt('Ride book karo', -165, -322, `800 28px ${SANS}`, '#ffffff', 'left');
  // fare sheet
  card(-178, 150, 356, 220, 26, '#ffffff', 5, 5);
  cabSide(-100, 235, 0.62);
  txt('Cab · Sedan', -40, 200, `700 22px ${MONO}`, '#3c4a6b', 'left');
  const u = eo(P(t, k12 + 0.05, k12 + 0.7));
  const amt = Math.round(L(450, 1285, u));
  const sh = shake(t, k12 + 0.7, 0.5, 8);
  txt('₹' + amt.toLocaleString('en-IN'), -40 + sh, 252, SANSB(58), u > 0.02 ? '#c2413e' : INK, 'left');
  if (u > 0.02) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, u * 3);
    rr(-160, 300, 320, 52, 26); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    txt('SURGE · demand zyada', 0, 327, `700 22px ${MONO}`, '#ffffff');
    ctx.restore();
  } else {
    txt('Normal kiraya', 0, 327, `700 22px ${MONO}`, '#4f8a5a');
  }
}
function sceneRain(t) {
  const k4 = CK('₹450'), k12 = CK('₹1,285');
  rain(t, 1);
  const cf = P(t, 0.0, 0.35);
  popAt(300, 430, cf, () => cloud(0, 0, 0.9));
  popAt(820, 470, P(t, 0.15, 0.5), () => cloud(0, 0, 0.65));
  const pf = P(t, k4 - 0.9, k4 - 0.5);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(540 + shake(t, k12 + 0.7, 0.5, 6), 900, L(0.72, 0.8, back(pf)), () => rideScreen(t, k4, k12));
  ctx.restore();
  chipW(540, 335, 'BAARISH + RUSH', C.cyan, t, 0.3, k4 - 0.1, { size: 34, h: 76 });
  chipW(540, 1340, '₹450 → ₹1,285', C.red, t, k12 + 0.75, 99, { size: 40, h: 84 });
}

// ---------- scene 2: ye ALGORITHM ka khel hai ----------
function sceneAlgo(t) {
  const kA = CK('Ye ALGORITHM'), kK = CK('ka khel');
  const pf = P(t, kA - 0.15, kA + 0.25);
  popAt(540, 860, pf, () => {
    card(-370, -330, 740, 620, 44, C.box, 6, 12);
    rr(-370, -330, 740, 96, [44, 44, 0, 0]); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    txt('ALGORITHM', 0, -280, `700 46px ${MONO}`, INK);
    gear(-250, -120, 62, t * 2.2, C.cyan);
    gear(-172, -40, 40, -t * 3.3, C.pink);
    gear(250, -120, 62, -t * 2.2, C.grn);
    // gauge
    const cx = 0, cy = 160, R = 210;
    const segs = [[Math.PI, Math.PI * 1.33, C.grn], [Math.PI * 1.33, Math.PI * 1.66, C.yel], [Math.PI * 1.66, Math.PI * 2, C.red]];
    for (const [a0, a1, col] of segs) { ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.lineWidth = 46; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R, a0 + 0.01, a1 - 0.01); ctx.lineWidth = 36; ctx.strokeStyle = col; ctx.stroke(); }
    txt('1x', -R, cy + 48, `700 30px ${MONO}`, '#ffffff');
    txt('2x', R, cy + 48, `700 30px ${MONO}`, '#ffffff');
    const u = eio(P(t, kA + 0.2, kK + 0.4));
    const a = Math.PI * (1.05 + 0.85 * u) + 0.04 * Math.sin(t * 18) * (u > 0.9 ? 1 : 0);
    line([[cx, cy], [cx + Math.cos(a) * (R - 40), cy + Math.sin(a) * (R - 40)]], INK, 16);
    line([[cx, cy], [cx + Math.cos(a) * (R - 44), cy + Math.sin(a) * (R - 44)]], '#ffffff', 8);
    disc(cx, cy, 22, C.yel, 4);
    txt('KIRAYA', 0, cy - 70, `700 30px ${MONO}`, C.mute);
  });
  // a person, crossed out: "koi insaan nahi"
  const nf = P(t, kA + 0.1, kA + 0.4);
  popAt(850, 430, nf, () => { disc(0, 0, 66, C.org, 6); person(0, 8, 1.3, C.purple); });
  banSign(850, 430, 76, P(t, kA + 0.35, kA + 0.6));
  chipW(540, 1300, 'KOI INSAAN NAHI', C.yel, t, kK + 0.05, 99, { size: 34, h: 76 });
}

// ---------- map scenes (3, 4, 5): one zone, many people, few drivers ----------
const ZX = 540, ZY = 860, ZR = 250;
const MAPR = [60, 330, 960, 1060];
function zoneBase(t, heat) {
  const [x, y, w, h] = MAPR;
  card(x, y, w, h, 40, C.box, 6, 12);
  ctx.save(); rr(x, y, w, h, 40); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 26;
  for (const gx of [210, 390, 690, 870]) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
  for (const gy of [520, 720, 1000, 1200]) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
  ctx.restore();
  // the zone
  const r = ZR + 6 * Math.sin(t * 4) * heat;
  ctx.beginPath(); ctx.arc(ZX, ZY, r, 0, 7); ctx.fillStyle = hexA(C.red, 0.10 + 0.32 * heat); ctx.fill();
  ctx.setLineDash([20, 14]); ctx.lineWidth = 6; ctx.strokeStyle = heat > 0.5 ? C.red : '#ffffff'; ctx.stroke(); ctx.setLineDash([]);
}
const PPL = Array.from({ length: 26 }, (_, i) => {
  const a = i * 2.39996, r = ZR * 0.86 * Math.sqrt((i + 0.6) / 26);
  return [ZX + Math.cos(a) * r, ZY + Math.sin(a) * r * 0.95];
});
const CABS_IN = [[-120, -150], [150, 120], [-40, 175], [130, -120], [-190, 60]].map(([a, b]) => [ZX + a, ZY + b]);
function zonePeople(t, a0, gap) {
  PPL.forEach(([px, py], i) => {
    const f = P(t, a0 + i * gap, a0 + i * gap + 0.25);
    popAt(px, py, f, () => {
      person(0, 0, 0.62, POP[i % POP.length]);
      // little phone in hand = asking for a cab
      if (i % 3 === 0) { rr(16, -4, 12, 20, 3); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke(); }
    });
  });
}
function zoneCabs(t, a0, gap) {
  CABS_IN.forEach(([cx, cy], i) => popAt(cx, cy, P(t, a0 + i * gap, a0 + i * gap + 0.25), () => cab(0, 0, 0.8, 0.4 * (i % 2 ? 1 : -1))));
}
function sceneDemand(t) {
  const kJ = CK('Jaise 3,000'), kC = CK('cab maang'), kD = CK('driver sirf');
  zoneBase(t, P(t, kC, kD + 0.6));
  zonePeople(t, kJ - 0.05, (kC + 0.4 - kJ) / PPL.length);
  zoneCabs(t, kD + 0.05, 0.1);
  chipW(300, 420, '3,000 LOG', C.yel, t, kJ + 0.15, 99, { size: 34, h: 76 });
  chipW(780, 420, '600 DRIVER', C.red, t, kD + 0.1, 99, { size: 34, h: 76 });
  chipW(540, 1300, 'DEMAND ZYADA, CAB KAM', C.org, t, kD + 0.7, 99, { size: 30, h: 70 });
}
function sceneSurge(t) {
  const kB = CK('Toh kiraya');
  zoneBase(t, 1);
  zonePeople(t, -99, 0);
  zoneCabs(t, -99, 0);
  // rupee tags floating up out of the zone
  for (let k = 0; k < 7; k++) {
    const st = kB + 0.1 + k * 0.12, v = P(t, st, st + 0.9); if (v <= 0 || v >= 1) continue;
    const x = ZX + (hash(k, 2) - 0.5) * 380, y = L(ZY + 120, ZY - 300, eo(v));
    ctx.save(); ctx.globalAlpha *= 1 - P(v, 0.75, 1); chip(x, y, '₹↑', C.grn, 1, { size: 30, h: 58 }); ctx.restore();
  }
  popAt(ZX + shake(t, kB + 0.45, 0.5, 8), ZY - 10, P(t, kB + 0.15, kB + 0.45), () => {
    card(-210, -120, 420, 240, 34, C.red, 6, 12);
    upArrow(-120, 0, 0.95, C.yel);
    txt('KIRAYA', 70, -36, SANSB(54), '#ffffff');
    txt('UPAR!', 70, 40, SANSB(62), C.yel);
  });
  chipW(540, 420, 'SURGE ZONE', C.red, t, kB + 0.05, 99, { size: 36, h: 78 });
}
const OUT = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]];
function sceneDrivers(t) {
  const kT = CK('taaki door'), kD = CK('driver aayein');
  const arrived = P(t, kD + 0.1, kD + 0.6);
  zoneBase(t, 1 - 0.75 * arrived);
  zonePeople(t, -99, 0);
  zoneCabs(t, -99, 0);
  OUT.forEach(([dx, dy], i) => {
    const sx = ZX + dx * 420 + (dy === 0 ? 0 : dx === 0 ? 120 * (dy > 0 ? 1 : -1) : 0), sy = ZY + dy * 470;
    const ang = Math.atan2(ZY - sy, ZX - sx);
    const ex = ZX - Math.cos(ang) * (ZR * 0.62), ey = ZY - Math.sin(ang) * (ZR * 0.62);
    const st = kT + i * 0.08, v = eio(P(t, st, kD + 0.3 + i * 0.03));
    if (t < st) return;
    ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, st, st + 0.2));
    line([[sx, sy], [L(sx, ex, v), L(sy, ey, v)]], 'rgba(255,255,255,0.6)', 5, [14, 12]);
    cab(L(sx, ex, v), L(sy, ey, v), 0.8, ang + Math.PI / 2, i % 2 ? C.cyan : CAB);
    ctx.restore();
  });
  chipW(540, 420, '3-4 KM DOOR SE', C.cyan, t, kT + 0.05, 99, { size: 34, h: 76 });
  chipW(540, 1300, 'DRIVER AA GAYE!', C.grn, t, kD + 0.45, 99, { size: 36, h: 78 });
}

// ---------- scene 6: rate kuch sau meter pe badalta hai... aage chalo ----------
const BS = 250, BG2 = 46, BX0 = 540 - (1.5 * BS + BG2), BY0 = 420;
const BCOL = [[C.org, C.yel, C.grn], [C.yel, C.red, C.grn], [C.org, C.yel, C.grn]];
function blockXY(i, j) { return [BX0 + j * (BS + BG2), BY0 + i * (BS + BG2)]; }
function sceneBlocks(t) {
  const kR = CK('Rate kuch'), kM = CK('meter pe'), kA = CK('aage chalo');
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const [x, y] = blockXY(i, j);
    const f = P(t, kR - 0.1 + (i + j) * 0.06, kR + 0.2 + (i + j) * 0.06);
    popAt(x + BS / 2, y + BS / 2, f, () => {
      card(-BS / 2, -BS / 2, BS, BS, 30, BCOL[i][j], 5, 8);
      ctx.fillStyle = hexA(INK, 0.12);
      for (let k = 0; k < 3; k++) rr(-BS / 2 + 30 + k * 66, -BS / 2 + 34, 44, 44, 8), ctx.fill();
    });
  }
  // labels on the two blocks that matter
  const [cx, cy] = blockXY(1, 1), [gx, gy] = blockXY(1, 2);
  popAt(cx + BS / 2, cy + BS / 2 + 88, P(t, kR + 0.4, kR + 0.7), () => chip(0, 0, 'SURGE', '#ffffff', 1, { size: 30, h: 58 }));
  popAt(gx + BS / 2, gy + BS / 2 + 88, P(t, kR + 0.5, kR + 0.8), () => chip(0, 0, 'NORMAL', '#ffffff', 1, { size: 26, h: 54 }));
  // ruler between the two blocks
  const rf = P(t, kM, kM + 0.4);
  if (rf > 0) {
    const y = cy - 34, x0 = cx + BS / 2, x1 = L(x0, gx + BS / 2, eo(rf));
    line([[x0, y], [x1, y]], '#ffffff', 7);
    line([[x0, y - 16], [x0, y + 16]], '#ffffff', 7);
    if (rf >= 1) line([[x1, y - 16], [x1, y + 16]], '#ffffff', 7);
    popAt((x0 + gx + BS / 2) / 2, y - 62, P(t, kM + 0.25, kM + 0.55), () => chip(0, 0, 'KUCH SAU METER', C.cyan, 1, { size: 26, h: 56 }));
  }
  // you walk from the surge block to the normal block
  const wf = P(t, kR + 0.2, kR + 0.5), wv = eio(P(t, kM + 0.55, kA + 0.2));
  const px = L(cx + BS / 2, gx + BS / 2, wv), py = cy + BS / 2 - 30 - Math.abs(Math.sin(wv * Math.PI * 4)) * 18;
  popAt(px, py, wf, () => { disc(0, 6, 54, '#ffffff', 5); person(0, 10, 1.05, C.purple); });
  if (t > kA + 0.22) tickMark(gx + BS / 2 + 60, gy + BS / 2 - 70, 34, C.grn);
  chipW(540, 1340, 'AAGE CHAL KE CHECK KARO', C.grn, t, kA - 0.05, 99, { size: 30, h: 70 });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneRain], [LS(1), LS(2), sceneAlgo], [LS(2), LS(3), sceneDemand],
          [LS(3), LS(4), sceneSurge], [LS(4), LS(5), sceneDrivers], [LS(5), LS(n) - 0.4, sceneBlocks],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('₹1,285') + 0.7, 540, 1000, [C.red, C.org, C.yel], 28, 1.4);
  burst(t, CK('driver sirf') + 0.3, 780, 420, [C.red, C.pink, C.yel], 20);
  burst(t, CK('Toh kiraya') + 0.4, ZX, ZY - 10, [C.yel, C.red, '#ffffff'], 26, 1.3);
  burst(t, CK('driver aayein') + 0.5, ZX, ZY, [C.grn, C.cyan, '#ffffff'], 26, 1.4);
  burst(t, CK('aage chalo') + 0.22, 540 + BS + BG2, 420 + 1.5 * BS + BG2, [C.grn, C.yel, '#ffffff'], 24, 1.2);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈↑✓…●–')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
