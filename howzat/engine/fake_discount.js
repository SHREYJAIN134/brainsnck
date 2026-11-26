window.BG = '#2f6b70';
// "Sale me 50% OFF... par kal bhi yahi daam?" — 1080x1920, synced to window.TL (helpers from maps.js via the ola tip reel)
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
// Fake sale discount reel scenes
// =====================================================================
window.TOPIC = 'Sale Discount';
function STEPS() { return [[0, '50% OFF?'], [LS(1), 'ASLI TRICK'], [LS(3), 'NAYA RULE']]; }
const GREY = '#8a8fa8';
const PRICE_HI = '₹3,999', PRICE_LO = '₹1,999';

// ---------- small flat drawings (original, no logos) ----------
function headphones(x, y, s, col = C.pink) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(6, 6, 92, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 30; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 92, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 30; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 92, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 18; ctx.strokeStyle = col; ctx.stroke();
  for (const sx of [-1, 1]) {
    const cx = sx * 92;
    rr(cx - 34 + 6, -36 + 6, 68, 112, 30); ctx.fillStyle = INK; ctx.fill();
    rr(cx - 34, -36, 68, 112, 30); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    rr(cx - 18 - sx * 8, -16, 36, 72, 16); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.restore();
}
function upArrow(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const pts = [[0, -80], [62, -10], [24, -10], [24, 70], [-24, 70], [-24, -10], [-62, -10]];
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a + 7, b + 7)); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function strikePrice(x, y, label, size, f, col = C.red) {   // grey price with a red strike that draws in over f
  txt(label, x, y, `800 ${size}px ${SANS}`, GREY);
  if (f > 0) { ctx.font = `800 ${size}px ${SANS}`; const w = ctx.measureText(label).width / 2 + 6; line([[x - w, y + 2], [L(x - w, x + w, eo(f)), y + 2]], col, Math.max(5, size * 0.13)); }
}
function pricePill(x, y, label, col, f, size = 30, rot = -0.06, tc = INK) {
  popAt(x, y, f, () => {
    ctx.rotate(rot); ctx.font = SANSB(size); const w = ctx.measureText(label).width + 44, h = size * 1.7;
    hardShadow(-w / 2, -h / 2, w, h, h / 2, 6);
    rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    txt(label, 0, 3, SANSB(size), tc);
  });
}
function calCard(x, y, w, h, top, mid, low, f, topCol = C.pink) {
  popAt(x, y, f, () => {
    card(-w / 2, -h / 2, w, h, 30, '#ffffff', 6, 10);
    rr(-w / 2, -h / 2, w, h * 0.27, [30, 30, 0, 0]); ctx.fillStyle = topCol; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (const rx of [-w * 0.27, w * 0.27]) { rr(rx - 9, -h / 2 - 22, 18, 44, 9); ctx.fillStyle = INK; ctx.fill(); }
    txt(top, 0, -h / 2 + h * 0.135 + 2, SANSB(Math.round(h * 0.1)), INK);
    if (mid) txt(mid, 0, h * 0.06, SANSB(Math.round(h * 0.27)), INK);
    if (low) txt(low, 0, h * 0.33, `700 ${Math.round(h * 0.075)}px ${MONO}`, '#5a5f80');
  });
}

// ---------- scene 1: sale me 50% OFF... par kal bhi daam yahi tha ----------
const PX1 = 390, PY1 = 890, PS1 = 0.8;
function shopScreen(t, k50) {
  ctx.fillStyle = PAPER; ctx.fillRect(-200, -400, 400, 800);
  ctx.fillStyle = INK; ctx.fillRect(-200, -400, 400, 96);
  txt('MEGA SALE', 0, -330, SANSB(36), C.yel);
  rr(-160, -275, 320, 290, 26); ctx.fillStyle = C.cyan; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  headphones(0, -110, 0.95 + 0.02 * Math.sin(t * 4), C.pink);
  txt('Wireless Headphones', -160, 60, `800 26px ${SANS}`, INK, 'left');
  txt(PRICE_LO, -160, 128, SANSB(58), INK, 'left');
  strikePrice(112, 132, PRICE_HI, 34, P(t, k50 - 0.1, k50 + 0.2));
  pricePill(-62, 218, '50% OFF', C.grn, P(t, k50, k50 + 0.3), 34, -0.06);
  rr(-160, 286, 320, 70, 35); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt('KHARIDO', 0, 323, SANSB(30), INK);
}
function sceneSale(t) {
  const k50 = CK('50% OFF'), kKal = CK('par kal'), kY = CK('daam yahi');
  const pf = P(t, 0, 0.35);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(PX1 + shake(t, k50, 0.4, 5), PY1, L(0.7, PS1, back(pf)), () => shopScreen(t, k50));
  ctx.restore();
  chipW(540, 385, 'SALE LIVE!', C.yel, t, 0.1, kKal, { size: 38, h: 80 });
  chipW(540, 385, 'KAL KA DAAM?', '#ffffff', t, kKal, 99, { size: 38, h: 80 });
  // yesterday's price tag
  calCard(840, 990, 300, 330, 'KAL', PRICE_LO, 'bina sale', P(t, kKal, kKal + 0.35), C.purple);
  // equals sign between today and yesterday
  popAt(640, 990, P(t, kY, kY + 0.3), () => { disc(0, 0, 46, C.yel, 6); txt('=', 0, -2, SANSB(64), INK); });
  stamp(840 + shake(t, kY + 0.3, 0.4, 6), 680, 'SAME!', C.red, P(t, kY + 0.05, kY + 0.35), 0.08, 60);
  chipW(540, 1330, '50% OFF... ya NAKLI OFF?', C.red, t, kY + 0.4, 99, { size: 32, h: 72 });
}

// ---------- scenes 2-3: trick = raise the price before the sale, then "discount" ----------
const CH = { x0: 175, x1: 915, y0: 570, y1: 1100 };
const CHD = [-10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0];
const chX = d => L(CH.x0 + 30, CH.x1 - 40, (d + 10) / 10);
const chY = p => CH.y1 - ((p - 1000) / 3500) * (CH.y1 - CH.y0);
function chartFrame(f) {
  popAt(540, 860, f, () => {
    card(-450, -410, 900, 820, 40, C.box, 6, 12);
  });
  if (f < 0.5) return;
  ctx.save(); ctx.globalAlpha *= P(f, 0.5, 1);
  line([[CH.x0, CH.y0 - 20], [CH.x0, CH.y1], [CH.x1, CH.y1]], '#ffffff', 5);
  for (const p of [2000, 4000]) { line([[CH.x0, chY(p)], [CH.x1, chY(p)]], 'rgba(255,255,255,0.14)', 3); txt(p === 2000 ? '₹2k' : '₹4k', CH.x0 - 12, chY(p), `700 22px ${MONO}`, C.mute, 'right'); }
  txt('10 DIN PEHLE', chX(-10) + 10, CH.y1 + 40, `700 22px ${MONO}`, C.mute, 'left');
  txt('SALE', chX(0), CH.y1 + 40, `700 24px ${MONO}`, C.yel);
  txt('DAAM', CH.x0 + 16, CH.y0 - 20, `700 22px ${MONO}`, C.mute, 'left');
  ctx.restore();
}
function sceneTrick(t) {
  const a = LS(1), kP = CK('Sale se pehle'), kB = CK('daam BADHAO'), a2 = LS(2), kD = CK('bada discount');
  stamp(540, 395, 'TRICK?', C.yel, P(t, a, a + 0.3), -0.06, 54, INK);
  chartFrame(P(t, a, a + 0.35));
  // normal price line: day -10 .. -3
  const flat = [[chX(-10), chY(1999)], [chX(-3), chY(1999)]];
  const ff = eo(P(t, a + 0.25, kP + 0.4));
  if (ff > 0) line(polyPart(flat, ff), C.grn, 12);
  pricePill(chX(-7), chY(1999) - 70, PRICE_LO + ' · NORMAL', C.grn, P(t, a + 0.5, a + 0.8), 24, -0.03);
  // just before the sale: price jumps up
  const up = eo(P(t, kB - 0.1, kB + 0.3));
  if (up > 0) {
    const yUp = L(chY(1999), chY(3999), up);
    line([[chX(-3), chY(1999)], [chX(-2), yUp], [L(chX(-2), chX(-1), up), yUp]], C.red, 12);
  }
  if (up > 0.2) { ctx.save(); ctx.globalAlpha *= P(up, 0.2, 0.6); upArrow(chX(-2.5) - 70 + shake(t, kB + 0.3, 0.4, 5), chY(3000), 0.7, C.red); ctx.restore(); }
  pricePill(chX(-1.6), chY(3999) - 72, PRICE_HI, C.red, P(t, kB + 0.15, kB + 0.45), 30, 0.04, '#ffffff');
  // sale day: back down to the same old price, labelled as a big discount
  const dn = eo(P(t, a2 - 0.05, a2 + 0.4));
  if (dn > 0) line([[chX(-1), chY(3999)], [L(chX(-1), chX(0), dn), L(chY(3999), chY(1999), dn)]], C.yel, 12);
  if (dn >= 1) { disc(chX(0), chY(1999), 20, C.yel, 4); }
  // dashed level: same as before
  const lv = P(t, kD + 0.35, kD + 0.8);
  if (lv > 0) line([[chX(-10), chY(1999) + 30], [L(chX(-10), chX(0), eo(lv)), chY(1999) + 30]], '#ffffff', 5, [18, 14]);
  stamp(600, 1040 + shake(t, kD + 0.3, 0.4, 6), '50% OFF!', C.grn, P(t, kD, kD + 0.3), -0.06, 50, INK);
  chipW(540, 1345, 'DISCOUNT BADA... DAAM WAHI!', C.red, t, kD + 0.55, 99, { size: 30, h: 70 });
}

// ---------- scene 4: ek January se naya rule ----------
function sceneRule(t) {
  const a = LS(3), kJ = CK('Ek January'), kR = CK('naya rule');
  chipW(540, 390, 'E-COMMERCE RULES 2026', C.cyan, t, a + 0.05, 99, { size: 32, h: 74 });
  const flip = P(t, kJ + 0.25, kJ + 0.6);
  const cf = P(t, a, a + 0.35);
  // calendar: today -> flips to 1 January 2027
  if (flip < 0.5) {
    ctx.save(); ctx.translate(540, 820); ctx.scale(1, 1 - flip * 2); ctx.translate(-540, -820);
    calCard(540, 820, 520, 560, 'NOVEMBER 2026', '26', 'aaj', cf, C.purple); ctx.restore();
  } else {
    ctx.save(); ctx.translate(540, 820); ctx.scale(1, (flip - 0.5) * 2); ctx.translate(-540, -820);
    calCard(540, 820, 520, 560, 'JANUARY', '1', '2027 se lagu', 1, C.pink); ctx.restore();
  }
  stamp(540, 1220 + shake(t, kR + 0.3, 0.4, 5), 'NAYA RULE', C.grn, P(t, kR, kR + 0.3), -0.06, 66, INK);
}

// ---------- scene 5: pichhle tees din ka sabse kam daam dikhana padega ----------
const BARS = [];
for (let i = 0; i < 30; i++) BARS.push(i >= 27 ? 3999 : [1999, 2199, 2099, 1999, 2299][i % 5]);
const BX = i => 150 + i * 26.5, BY1 = 930, BH = p => (p / 4300) * 380;
function sceneThirty(t) {
  const a = LS(4), kK = CK('sabse kam'), kD = CK('dikhana padega');
  chipW(540, 385, '30 DIN KA HISAAB', C.yel, t, a + 0.05, 99, { size: 34, h: 76 });
  popAt(540, 705, P(t, a, a + 0.3), () => card(-450, -255, 900, 510, 40, C.box, 6, 12));
  const grow = P(t, a + 0.2, kK - 0.05);
  const nShown = Math.floor(grow * 30 + 0.001);
  for (let i = 0; i < 30; i++) {
    const g = eo(P(t, a + 0.2 + i * (kK - a - 0.3) / 30, a + 0.45 + i * (kK - a - 0.3) / 30)); if (g <= 0) continue;
    const h = BH(BARS[i]) * g, x = BX(i);
    const low = t > kK && BARS[i] === 1999, fake = BARS[i] === 3999;
    rr(x, BY1 - h, 20, h, [6, 6, 0, 0]); ctx.fillStyle = low ? C.grn : fake ? C.red : 'rgba(255,255,255,0.55)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  if (nShown > 0) txt(`DIN ${Math.min(30, nShown)}/30`, 905, 505, `700 24px ${MONO}`, C.mute, 'right');
  // lowest level line + label
  const lf = P(t, kK + 0.1, kK + 0.5);
  if (lf > 0) {
    const yL = BY1 - BH(1999);
    line([[BX(0) - 8, yL], [L(BX(0) - 8, BX(29) + 28, eo(lf)), yL]], C.grn, 6, [16, 12]);
  }
  pricePill(370, 505, 'SABSE KAM: ' + PRICE_LO, C.grn, P(t, kK + 0.2, kK + 0.5), 28, -0.03);
  // listing card that now has to show the prior price
  popAt(540, 1180, P(t, kD - 0.1, kD + 0.25), () => {
    card(-430, -175, 860, 350, 34, '#ffffff', 6, 10);
    headphones(-320, -20, 0.62, C.pink);
    txt('PRIOR PRICE', -170, -105, `700 26px ${MONO}`, '#5a5f80', 'left');
    txt(PRICE_LO, -170, -45, SANSB(56), C.box, 'left');
    txt('AAJ KA DAAM', 140, -105, `700 26px ${MONO}`, '#5a5f80', 'left');
    txt(PRICE_LO, 140, -45, SANSB(56), C.box, 'left');
    strikePrice(70, 60, PRICE_HI, 40, P(t, kD + 0.1, kD + 0.3));
    txt('nakli "pehle ka daam"', 70, 115, `700 22px ${MONO}`, '#5a5f80');
  });
  banSign(610, 1240, 70, P(t, kD + 0.3, kD + 0.55));
  stamp(850, 1335, 'PAKDA!', C.red, P(t, kD + 0.45, kD + 0.75), 0.1, 48);
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneSale], [LS(1), LS(3), sceneTrick], [LS(3), LS(4), sceneRule],
          [LS(4), LS(n) - 0.4, sceneThirty],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('50% OFF') + 0.15, PX1 - 50, PY1 + 175, [C.grn, C.yel, '#ffffff'], 22, 1.1);
  burst(t, CK('daam yahi') + 0.2, 840, 680, [C.red, C.org, C.yel], 24, 1.2);
  burst(t, CK('daam BADHAO') + 0.3, chX(-1.6), chY(3999) - 72, [C.red, C.org, '#ffffff'], 24, 1.2);
  burst(t, CK('bada discount') + 0.2, 600, 1040, [C.grn, C.yel, '#ffffff'], 26, 1.3);
  burst(t, CK('naya rule') + 0.2, 540, 1220, [C.grn, C.cyan, C.yel], 28, 1.4);
  burst(t, CK('sabse kam') + 0.4, 370, 505, [C.grn, C.yel, '#ffffff'], 24, 1.2);
  burst(t, CK('dikhana padega') + 0.55, 850, 1335, [C.red, C.yel, '#ffffff'], 24, 1.2);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈↑✓…●–%=')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
