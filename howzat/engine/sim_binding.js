window.BG = '#33407a';
// "Scammer videsh me... par WhatsApp Indian number se kaise?" (SIM binding) — 1080x1920, synced to window.TL (helpers from maps.js via the caller-name reel)
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


function handset(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-22, -10); ctx.quadraticCurveTo(0, 16, 22, -10);
  ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  for (const sx of [-1, 1]) { rr(sx * 22 - 8, -18, 16, 14, 5); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.restore();
}
function person(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(4, 34, 30, 20, 0, Math.PI, 0); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 30, 30, 22, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  disc(0, -6, 17, SKIN, 3);
  ctx.restore();
}
function avatar(x, y, r, col) {
  disc(x, y, r, col, 0);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  ctx.beginPath(); ctx.arc(x, y - r * 0.18, r * 0.36, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.78, r * 0.62, r * 0.5, 0, 0, 7); ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
}
// pill with a name in it
function namePill(x, y, label, col, f, size = 40, tc = INK) {
  popAt(x, y, f, () => {
    ctx.font = SANSB(size); const w = ctx.measureText(label).width + 56, h = size * 1.7;
    hardShadow(-w / 2, -h / 2, w, h, h / 2, 6);
    rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    txt(label, 0, 3, SANSB(size), tc);
  });
}
// incoming call screen, drawn in phone coordinates (screen = -190..190 x -380..380)
function callScreen(t, o) {
  ctx.fillStyle = C.box; ctx.fillRect(-200, -400, 400, 800);
  const dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
  txt('Incoming call' + dots, -120, -300, `500 24px ${MONO}`, C.mute, 'left');
  // ring pulses around the avatar
  for (let k = 0; k < 2; k++) {
    const u = (t * 1.2 + k / 2) % 1;
    ctx.beginPath(); ctx.arc(0, -160, 82 + 60 * u, 0, 7); ctx.lineWidth = 6 * (1 - u); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
  }
  avatar(0, -160, 78, o.avCol || C.purple);
  txt(o.num, 0, -30, `700 30px ${MONO}`, '#ffffff');
  const nf = P(t, o.nameT, o.nameT + 0.3);
  if (nf < 1) {
    ctx.save(); ctx.globalAlpha *= 1 - nf;
    txt('Unknown', 0, 50, `800 40px ${SANS}`, C.dim);
    if (o.hiT !== undefined) {
      const hf = win(t, o.hiT, o.nameT + 0.2, 0.15, 0.15);
      if (hf > 0) { rr(-150, 12, 300, 76, 38); ctx.lineWidth = 5; ctx.setLineDash([14, 10]); ctx.strokeStyle = hexA(C.yel, hf); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.restore();
  }
  namePill(0 + (o.shakeT ? shake(t, o.shakeT, 0.5, 8) : 0), 50, o.name, o.col, nf, o.size || 34);
  // decline / accept
  const pb = 1 + 0.08 * Math.sin(t * 10);
  ctx.save(); ctx.translate(-100, 270); if (o.pulseDecline && t > o.pulseDecline) ctx.scale(pb, pb); disc(0, 0, 50, C.red, 5); handset(0, 2, 1, Math.PI * 0.75 + Math.PI * 0.25); ctx.restore();
  ctx.save(); ctx.translate(100, 270); disc(0, 0, 50, C.grn, 5); handset(0, 2, 1, 0); ctx.restore();
}
function ringWaves(x, y, hw, t, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const u = (t * 2 + k / 3) % 1, al = 1 - u;
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.arc(x + sx * (hw + 20 + 70 * u), y, 70 + 40 * u, sx > 0 ? -0.6 : Math.PI - 0.6, sx > 0 ? 0.6 : Math.PI + 0.6);
      ctx.lineWidth = 9; ctx.strokeStyle = hexA('#ffffff', 0.85 * al); ctx.stroke();
    }
  }
  ctx.restore();
}
function tower(x, y, s, t, on) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const legs = [[[-70, 110], [0, -110]], [[70, 110], [0, -110]]];
  for (const [p, q] of legs) { line([[p[0] + 6, p[1] + 6], [q[0] + 6, q[1] + 6]], INK, 18); }
  for (const [p, q] of legs) { line([p, q], INK, 18); line([p, q], LIGHT, 9); }
  for (const yy of [-30, 40]) { const k = (yy + 110) / 220; line([[-70 * k, yy], [70 * k, yy]], INK, 12); line([[-70 * k, yy], [70 * k, yy]], LIGHT, 5); }
  disc(0, -118, 22, C.yel, 4);
  if (on) for (let k = 0; k < 3; k++) {
    const u = (t * 1.6 + k / 3) % 1;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(0, -118, 40 + 70 * u, sx > 0 ? -0.7 : Math.PI - 0.7, sx > 0 ? 0.7 : Math.PI + 0.7); ctx.lineWidth = 8 * (1 - u); ctx.strokeStyle = C.yel; ctx.stroke(); }
  }
  ctx.restore();
}
function simCard(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.lineJoin = 'round';
  const pts = [[-50, -70], [22, -70], [50, -42], [50, 70], [-50, 70]];
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a + 6, b + 6)); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); pts.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  rr(-28, -14, 56, 58, 10); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  line([[-28, 15], [28, 15]], INK, 3); line([[0, -14], [0, 44]], INK, 3);
  ctx.restore();
}

// =====================================================================
// SIM binding reel scenes
// =====================================================================
window.TOPIC = 'WhatsApp + SIM';
function STEPS() { return [[0, 'VIDESH SE CALL'], [LS(1), 'OTP KA JUGAAD'], [LS(3), 'NAYA RULE: SIM BINDING']]; }
const NUM = '+91 98XXX X4210';
const GREY = '#8a8fb0';

// ---------- small flat drawings (original, no logos) ----------
function globe(x, y, r, t) {
  disc(x, y, r, C.cyan, 9);
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
  const sh = (t * 0.06) % 2;   // slow spin: blobs drift right and wrap
  ctx.fillStyle = C.grn; ctx.strokeStyle = INK; ctx.lineWidth = 4;
  for (const [bx, by, bw, bh] of [[-0.55, -0.42, 0.40, 0.24], [0.15, -0.18, 0.30, 0.42], [-0.25, 0.42, 0.34, 0.20], [0.62, 0.45, 0.22, 0.18], [-0.95, 0.12, 0.26, 0.32]]) {
    for (const k of [-2, 0]) {
      let cx = bx + sh + k; if (cx < -1.4) continue;
      ctx.beginPath(); ctx.ellipse(x + cx * r, y + by * r, bw * r, bh * r, 0.3, 0, 7); ctx.fill(); ctx.stroke();
    }
  }
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(13,10,38,0.35)';
  for (const e of [0.35, 0.7]) { ctx.beginPath(); ctx.ellipse(x, y, r * e, r, 0, 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
}
// hooded scammer (original drawing, no real person)
function scammer(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.ellipse(8, 86, 84, 60, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 80, 84, 60, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#4a4f78'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(7, -2, 56, 64, 0, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -8, 56, 64, 0, 0, 7); ctx.fillStyle = '#4a4f78'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 2, 37, 44, 0, 0, 7); ctx.fillStyle = '#1d2040'; ctx.fill();
  const bl = (t % 2.6) < 0.12 ? 0.15 : 1;
  for (const ex of [-14, 14]) { ctx.beginPath(); ctx.ellipse(ex, -6, 7, 7 * bl, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); }
  ctx.beginPath(); ctx.arc(0, 12, 15, 0.25, Math.PI - 0.25); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  // phone in hand
  rr(48, 36, 40, 66, 9); ctx.fillStyle = INK; ctx.fill(); rr(53, 42, 30, 50, 5); ctx.fillStyle = C.grn; ctx.fill();
  ctx.restore();
}
// generic chat-app tile (speech bubble with dots, not any real logo)
function chatTile(x, y, s, grey) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-110, -110, 220, 220, 52, grey ? GREY : C.grn, 6, 10);
  ctx.beginPath(); ctx.ellipse(0, -8, 70, 56, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-40, 34); ctx.lineTo(-58, 70); ctx.lineTo(-10, 46); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
  ctx.fillRect(-36, 30, 24, 14);
  for (const dx of [-26, 0, 26]) { ctx.beginPath(); ctx.arc(dx, -8, 9, 0, 7); ctx.fillStyle = grey ? GREY : C.grn; ctx.fill(); }
  ctx.restore();
}
function lockIcon(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(0, -22, 30, Math.PI, 0); ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -22, 30, Math.PI, 0); ctx.lineWidth = 8; ctx.strokeStyle = LIGHT; ctx.stroke();
  card(-46, -24, 92, 76, 14, col, 5, 6);
  ctx.beginPath(); ctx.arc(0, 8, 10, 0, 7); ctx.fillStyle = INK; ctx.fill(); ctx.fillRect(-4, 8, 8, 22);
  ctx.restore();
}
function bin(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const body = [[-62, -50], [62, -50], [48, 80], [-48, 80]];
  ctx.beginPath(); body.forEach(([a, b]) => ctx.lineTo(a + 7, b + 7)); ctx.closePath(); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); body.forEach(([a, b]) => ctx.lineTo(a, b)); ctx.closePath(); ctx.fillStyle = LIGHT; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  for (const dx of [-24, 0, 24]) line([[dx, -28], [dx * 0.85, 60]], INK, 5);
  card(-76, -74, 152, 26, 10, C.mute, 5, 5);
  ctx.restore();
}
function calendarPage(s, t) {
  ctx.save(); ctx.scale(s, s);
  card(-200, -210, 400, 420, 34, PAPER, 6, 12);
  rr(-200, -210, 400, 120, [34, 34, 0, 0]); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  for (const rx of [-110, 110]) { rr(rx - 12, -238, 24, 60, 12); ctx.fillStyle = LIGHT; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); }
  txt('JAN 2027', 0, -146, SANSB(52), '#ffffff');
  txt('1', 0, 70, SANSB(220), INK);
  ctx.restore();
}
// chain between two points, drawn up to fraction f
function chain(x0, y0, x1, y1, f) {
  const n = 7, L0 = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0);
  const shown = Math.floor(n * f + 0.001);
  for (let i = 0; i < shown; i++) {
    const u = (i + 0.5) / n, cx = L(x0, x1, u), cy = L(y0, y1, u);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    const w = L0 / n + 22, h = i % 2 ? 26 : 46;
    rr(-w / 2 + 5, -h / 2 + 5, w, h, h / 2); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke();
    rr(-w / 2, -h / 2, w, h, h / 2); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke();
    rr(-w / 2, -h / 2, w, h, h / 2); ctx.lineWidth = 6; ctx.strokeStyle = C.yel; ctx.stroke();
    ctx.restore();
  }
}
// ---------- phone screens (phone coords: -190..190 x -380..380) ----------
function appHeader(title, col) {
  ctx.fillStyle = col; ctx.fillRect(-200, -400, 400, 150);
  ctx.fillStyle = INK; ctx.fillRect(-200, -252, 400, 5);
  avatar(-130, -310, 34, C.org);
  txt(title, -82, -310, `700 26px ${MONO}`, INK, 'left');
}
function msg(x, y, w, label, f, out = true, col) {
  popAt(x, y, f, () => {
    const h = 64;
    hardShadow(-w / 2, -h / 2, w, h, 20, 5);
    rr(-w / 2, -h / 2, w, h, 20); ctx.fillStyle = col || (out ? '#d6f5d9' : '#ffffff'); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    txt(label, 0, 2, `700 26px ${SANS}`, INK);
  });
}
function chatScreen(t, msgs, title) {
  ctx.fillStyle = C.box; ctx.fillRect(-200, -400, 400, 800);
  appHeader(title || NUM, C.grn);
  msgs.forEach(([y, w, label, t0, out]) => msg(out ? 182 - w / 2 : -182 + w / 2, y, w, label, P(t, t0, t0 + 0.3), out));
}
function otpBoxes(y, digits, n) {
  for (let i = 0; i < 6; i++) {
    const x = -150 + i * 60;
    rr(x - 24, y - 34, 48, 68, 12); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    if (i < n) txt(digits[i], x, y + 2, `700 36px ${MONO}`, INK);
  }
}

// ---------- scene 1: Scammer videsh me... par WhatsApp call Indian number se! ----------
function sceneAbroad(t) {
  const kW = CK('par WhatsApp'), kI = CK('Indian number');
  popAt(270, 600, P(t, 0.05, 0.4), () => globe(0, 0, 150, t));
  popAt(270, 690, P(t, 0.2, 0.55), () => scammer(0, 0, 1.3, t));
  chipW(270, 405, 'VIDESH', C.org, t, 0.3, 99, { size: 36, h: 76 });
  // the call travels abroad -> India
  const path = [[400, 610], [540, 530], [660, 590], [710, 680]];
  const lf = eo(P(t, kW - 0.1, kW + 0.5));
  if (lf > 0) line(polyPart(path, lf), '#ffffff', 7, [16, 14]);
  const u = eio(P(t, kW, kW + 0.6));
  if (u > 0 && u < 1) { const pts = polyPart(path, Math.max(0.001, u)), p = pts[pts.length - 1]; disc(p[0], p[1], 34, C.grn, 5); handset(p[0], p[1] + 2, 0.7, 0); }
  // India phone rings
  const pf = P(t, 0.35, 0.7), ring = kW + 0.6;
  chipW(760, 405, 'INDIA', C.grn, t, 0.5, 99, { size: 36, h: 76 });
  const vib = t > ring && t < kI + 0.6 ? Math.sin(t * 70) * 4 : 0;
  ringWaves(720, 1000, PW / 2 * 0.62, t, P(t, ring, ring + 0.2) * (1 - P(t, kI + 0.5, kI + 0.8)));
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(720 + vib, 1000, L(0.56, 0.64, back(pf)), () => {
    if (t < ring) {
      ctx.fillStyle = C.box; ctx.fillRect(-200, -400, 400, 800);
      txt('10:42', 0, -170, SANSB(96), '#ffffff'); txt('Saturday, 28 Nov', 0, -80, `600 28px ${SANS}`, C.mute);
    } else callScreen(t, { num: NUM, name: 'WHATSAPP CALL', nameT: ring + 0.15, col: C.grn, size: 28, avCol: C.org });
    const hf = P(t, kI - 0.05, kI + 0.2);
    if (hf > 0) { rr(-178, -66, 356, 72, 22); ctx.lineWidth = 7; ctx.strokeStyle = hexA(C.yel, hf); ctx.stroke(); }
  });
  ctx.restore();
  chipW(330, 1010, '+91 = INDIA', C.yel, t, kI, 99, { size: 34, h: 76 });
  chipW(330, 1110, 'KAISE?!', '#ffffff', t, kI + 0.35, 99, { size: 32, h: 70 });
}

// ---------- scene 2: Kaise? Indian SIM pe ek baar OTP... ----------
const OTP = '482916';
function sceneOTP(t) {
  const a = LS(1), kS = CK('Kaise? Indian SIM'), kO = CK('ek baar OTP');
  const sim = a + 0.75, fly0 = kO + 0.25, fly1 = kO + 0.85, ver = kO + 0.95;
  chipW(540, 400, 'KAISE?', C.yel, t, a + 0.05, kO, { size: 38, h: 80 });
  chipW(540, 400, 'EK BAAR OTP...', C.yel, t, kO + 0.05, 99, { size: 36, h: 78 });
  // India side
  const pf = P(t, a + 0.1, a + 0.45);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(270, 940, L(0.56, 0.63, back(pf)), () => {
    ctx.fillStyle = C.box; ctx.fillRect(-200, -400, 400, 800);
    appHeader('Messages', C.cyan);
    msg(-30, -120, 300, 'OTP: ' + OTP, P(t, kO - 0.1, kO + 0.2), false, '#ffffff');
    if (t > fly0) { ctx.save(); ctx.globalAlpha *= P(t, fly0, fly0 + 0.2); msg(-30, -120, 300, 'OTP: ' + OTP, 1, false, C.yel); ctx.restore(); }
  });
  ctx.restore();
  popAt(135, 655, P(t, sim, sim + 0.3), () => simCard(0, 0, 0.8, -0.2));
  chipW(270, 1250, 'INDIAN SIM', C.yel, t, sim, 99, { size: 28, h: 64 });
  // abroad side
  const qf = P(t, a + 0.25, a + 0.6);
  ctx.save(); ctx.globalAlpha *= Math.min(1, qf * 3);
  phone(810, 940, L(0.56, 0.63, back(qf)), () => {
    ctx.fillStyle = C.box; ctx.fillRect(-200, -400, 400, 800);
    appHeader('Verify', C.grn);
    txt(NUM, 0, -170, `700 28px ${MONO}`, '#ffffff');
    const n = Math.round(6 * eo(P(t, fly1 - 0.05, ver)));
    otpBoxes(-60, OTP, n);
    if (t > ver) { tickMark(0, 130, 70, C.grn); txt('VERIFIED', 0, 250, SANSB(40), C.grn); }
  });
  ctx.restore();
  popAt(810, 560, P(t, a + 0.35, a + 0.7), () => scammer(0, 0, 0.7, t));
  chipW(810, 1250, 'VIDESH', C.org, t, a + 0.45, 99, { size: 28, h: 64 });
  // the OTP flies abroad
  const path = [[350, 800], [540, 640], [730, 800]];
  const lf = eo(P(t, fly0 - 0.1, fly0 + 0.3));
  if (lf > 0) line(polyPart(path, lf), '#ffffff', 6, [14, 12]);
  const u = eio(P(t, fly0, fly1));
  if (u > 0 && u < 1) { const pts = polyPart(path, Math.max(0.001, u)), p = pts[pts.length - 1]; namePill(p[0], p[1], OTP, C.yel, 1, 34); }
}

// ---------- scene 3: WhatsApp chalu, SIM phenko... app chalta rehta! ----------
function sceneThrow(t) {
  const a = LS(2), kP = CK('SIM phenko'), kR = CK('app chalta');
  chipW(540, 400, 'WHATSAPP CHALU', C.grn, t, a + 0.05, 99, { size: 36, h: 78 });
  const pf = P(t, a - 0.1, a + 0.25);
  const msgs = [[-170, 250, 'Namaste sir', a + 0.25, true], [-80, 300, 'Main police se..', kP + 0.3, true],
                [10, 280, 'Video call aao!', kR + 0.05, true], [100, 250, 'Jaldi karo!!', kR + 0.45, true]];
  // SIM sits in the tray, then gets thrown into the bin
  const out = P(t, kP - 0.15, kP + 0.05), fly = P(t, kP + 0.05, kP + 0.75);
  if (fly < 1) {
    let sx = L(640, 720, eo(out)), sy = 720, rot = 0;
    if (fly > 0) { sx = L(720, 870, fly); sy = 720 - 260 * Math.sin(Math.PI * fly * 0.75) + 380 * fly * fly; rot = fly * 7; }
    const s = fly > 0 ? L(0.72, 0.45, fly) : 0.72;
    ctx.save(); ctx.globalAlpha *= Math.min(1, P(t, a, a + 0.3) * 3); simCard(sx, sy, s, rot); ctx.restore();
  }
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(500, 900, L(0.66, 0.72, back(pf)), () => chatScreen(t, msgs));
  ctx.restore();
  popAt(880, 1080, P(t, kP - 0.1, kP + 0.2), () => bin(0, 0, 0.95));
  ring(880, 1030, t, kP + 0.75, '#ffffff', 30, 120);
  chipW(220, 720, 'SIM PHENKA', C.red, t, kP, 99, { size: 28, h: 64 });
  stamp(540, 1290 + shake(t, kR + 0.3, 0.4, 6), 'PHIR BHI CHALU!', C.grn, P(t, kR, kR + 0.3), -0.07, 62, INK);
}

// ---------- scene 4: Ek January se naya rule: SIM binding. ----------
function sceneRule(t) {
  const a = LS(3), kN = CK('naya rule'), kB = CK('SIM binding');
  const m = eio(P(t, kN - 0.15, kN + 0.3));
  popAt(L(540, 250, m), L(820, 520, m), P(t, a, a + 0.35), () => calendarPage(L(1.15, 0.55, m), t));
  chipW(540, 400, '1 JANUARY 2027 SE', C.yel, t, a + 0.15, kN, { size: 34, h: 76 });
  chipW(690, 470, 'NAYA RULE', C.yel, t, kN, 99, { size: 36, h: 78 });
  chipW(690, 565, 'DoT KA ORDER', '#ffffff', t, kN + 0.2, 99, { size: 26, h: 58 });
  popAt(290, 930, P(t, kN + 0.05, kN + 0.35), () => simCard(0, 0, 1.25, -0.08));
  popAt(790, 930, P(t, kN + 0.15, kN + 0.45), () => chatTile(0, 0, 0.85));
  chain(370, 930, 690, 930, eo(P(t, kB - 0.15, kB + 0.35)));
  popAt(540, 930, P(t, kB + 0.3, kB + 0.55), () => lockIcon(0, 0, 1.2, C.yel));
  chipW(290, 1110, 'SIM', '#ffffff', t, kN + 0.3, 99, { size: 28, h: 60 });
  chipW(790, 1110, 'APP', '#ffffff', t, kN + 0.4, 99, { size: 28, h: 60 });
  stamp(540, 1290, 'SIM BINDING', C.yel, P(t, kB, kB + 0.3), -0.06, 74, INK);
}

// ---------- scene 5: Phone me wo SIM nahi? Toh WhatsApp BAND! ----------
function sceneBand(t) {
  const a = LS(4), kS = CK('wo SIM nahi'), kB = CK('Toh WhatsApp');
  const pf = P(t, a - 0.1, a + 0.25);
  const off = P(t, kB, kB + 0.25);
  // tray slides out: empty
  const tr = eo(P(t, kS - 0.25, kS + 0.15));
  if (tr > 0) {
    const tx = L(600, 775, tr), ty = 720;
    hardShadow(tx - 90, ty - 48, 180, 96, 16, 6);
    rr(tx - 90, ty - 48, 180, 96, 16); ctx.fillStyle = LIGHT; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    rr(tx - 40, ty - 32, 64, 64, 8); ctx.setLineDash([8, 7]); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.setLineDash([]);
    txt('?', tx + 54, ty + 2, SANSB(44), C.red);
  }
  ctx.save(); ctx.globalAlpha *= Math.min(1, pf * 3);
  phone(500 + shake(t, kB, 0.5, 9), 900, L(0.66, 0.72, back(pf)), () => {
    ctx.fillStyle = C.box; ctx.fillRect(-200, -400, 400, 800);
    appHeader('WhatsApp', off > 0.5 ? GREY : C.grn);
    [['Mummy', -170], ['Dost', -70], ['Office', 30], ['Bhaiya', 130]].forEach(([nm, y], i) => {
      avatar(-130, y, 34, POP[i]); txt(nm, -80, y - 12, SANSB(28), '#ffffff', 'left');
      rr(-80, y + 14, 200, 12, 6); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
    });
    if (off > 0) {
      ctx.fillStyle = `rgba(13,10,38,${0.72 * off})`; ctx.fillRect(-200, -400, 400, 800);
      popAt(0, -10, off, () => lockIcon(0, 0, 1.6, C.red));
      if (off > 0.6) txt('SIM DAALO', 0, 140, SANSB(40), '#ffffff');
    }
  });
  ctx.restore();
  chipW(830, 590, 'SIM NAHI?', C.red, t, kS, 99, { size: 30, h: 66 });
  chipW(540, 400, 'SCAMMER KA JUGAAD FAIL', C.grn, t, kB + 0.45, 99, { size: 30, h: 70 });
  stamp(540, 1300 + shake(t, kB + 0.35, 0.4, 6), 'WHATSAPP BAND!', C.red, P(t, kB + 0.05, kB + 0.35), -0.07, 64);
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneAbroad], [LS(1), LS(2), sceneOTP], [LS(2), LS(3), sceneThrow],
          [LS(3), LS(4), sceneRule], [LS(4), LS(n) - 0.4, sceneBand],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('Indian number') + 0.1, 720, 980, [C.yel, C.grn, '#ffffff'], 22, 1.1);
  burst(t, CK('ek baar OTP') + 0.95, 800, 1000, [C.grn, C.yel, '#ffffff'], 24, 1.2);
  burst(t, CK('SIM binding') + 0.35, 540, 930, [C.yel, C.cyan, '#ffffff'], 28, 1.4);
  burst(t, CK('Toh WhatsApp') + 0.3, 540, 1300, [C.red, C.yel, '#ffffff'], 30, 1.5);
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
