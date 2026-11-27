window.BG = '#5a4e8c';
// "Bumrah bola HIGH hai... phir bhi REVIEW kyun?" (DRS review decision) — 1080x1920, synced to window.TL
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

// ---------- shared flat helpers (same as the IPL max-fee reel) ----------
const SANSB = s => `800 ${s}px ${SANS}`;
const SKIN = '#e6b48a';
const WOOD = '#e8c88f', WOOD2 = '#d2aa6c', CREAM = '#f6efd9', TURF = '#4f7d5c', TURF2 = '#5b8c68', STRIP = '#d9c597';
const GRIP = '#2e3a6e';

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
function crossMark(x, y, r) {
  line([[x - r, y - r], [x + r, y + r]], INK, r * 0.55); line([[x + r, y - r], [x - r, y + r]], INK, r * 0.55);
  line([[x - r, y - r], [x + r, y + r]], C.red, r * 0.32); line([[x + r, y - r], [x - r, y + r]], C.red, r * 0.32);
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
function bubble(x, y, w, h, label, f, size = 44) {
  popAt(x, y, f, () => {
    hardShadow(-w / 2, -h / 2, w, h, 28, 7);
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 28);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w / 2 + 40, h / 2 - 4); ctx.lineTo(-w / 2 + 20, h / 2 + 36); ctx.lineTo(-w / 2 + 84, h / 2 - 4); ctx.closePath();
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.fillRect(-w / 2 + 38, h / 2 - 9, 50, 8);
    txt(label, 0, 4, SANSB(size), INK);
  });
}
function arrowR(x0, y, x1, col, f) {   // arrow growing left -> right
  if (f <= 0) return; const xe = L(x0, x1, eo(f));
  line([[x0, y], [xe, y]], INK, 20); line([[x0, y], [xe, y]], col, 11);
  if (f > 0.3) { ctx.beginPath(); ctx.moveTo(xe + 22, y); ctx.lineTo(xe - 14, y - 26); ctx.lineTo(xe - 14, y + 26); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
}


// bat seen front-on; (x, y) = top of the blade, handle above
function bat(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  rr(-15, -175, 30, 190, 13); ctx.fillStyle = GRIP; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (let k = 0; k < 6; k++) line([[-15, -152 + k * 26], [15, -140 + k * 26]], 'rgba(255,255,255,0.35)', 3);
  hardShadow(-50, 0, 100, 380, 22, 7);
  rr(-50, 0, 100, 380, 22); ctx.fillStyle = WOOD; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  rr(-32, 28, 16, 320, 8); ctx.fillStyle = WOOD2; ctx.fill();
  ctx.restore();
}
// batting pad seen front-on; (x, y) = top centre
function pad(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  hardShadow(-80, 0, 160, 420, 50, 8);
  rr(-80, 0, 160, 420, 50); ctx.fillStyle = CREAM; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  for (const dx of [-40, 0, 40]) { rr(dx - 13, 125, 26, 265, 13); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(13,10,38,0.30)'; ctx.stroke(); }
  rr(-66, 22, 132, 78, 36); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (const sy of [160, 305]) { rr(-92, sy, 184, 24, 8); ctx.fillStyle = GRIP; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
}
function ball(x, y, r, rot = 0.5) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(r * 0.14, r * 0.14, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = Math.max(3, r * 0.12); ctx.strokeStyle = INK; ctx.stroke();
  ctx.rotate(rot);
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * r * 0.18, -r * 0.86); ctx.quadraticCurveTo(d * r * 0.42, 0, d * r * 0.18, r * 0.86); ctx.lineWidth = Math.max(2, r * 0.08); ctx.strokeStyle = '#ffffff'; ctx.setLineDash([r * 0.16, r * 0.12]); ctx.stroke(); }
  ctx.setLineDash([]); ctx.restore();
}
// three stumps; (x, y) = ground centre. The middle stump can carry the mic.
function stumps(x, y, s, mic, micPulse = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  for (const dx of [-72, 0, 72]) { hardShadow(dx - 17, -520, 34, 520, 15, 6); rr(dx - 17, -520, 34, 520, 15); ctx.fillStyle = CREAM; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  for (const bx of [-36, 36]) { rr(bx - 46, -548, 92, 24, 12); ctx.fillStyle = WOOD; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  if (mic) {
    const ms = 1 + 0.12 * micPulse;
    ctx.save(); ctx.translate(0, -275); ctx.scale(ms, ms);
    hardShadow(-34, -66, 68, 132, 34, 6);
    rr(-34, -66, 68, 132, 34); ctx.fillStyle = GRIP; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    for (let k = 0; k < 5; k++) line([[-17, -40 + k * 20], [17, -40 + k * 20]], C.cyan, 5);
    ctx.restore();
  }
  ctx.restore();
}
function umpireHat(x, y, s) {   // generic umpire: face + wide white hat (original flat drawing)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.arc(6, 36, 78, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 30, 78, 0, 7); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(-26, 36, 8, 0, 7); ctx.arc(26, 36, 8, 0, 7); ctx.fillStyle = INK; ctx.fill();
  line([[-22, 74], [22, 74]], INK, 7);
  ctx.beginPath(); ctx.ellipse(0, -28, 150, 34, 0, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-82, -30); ctx.bezierCurveTo(-82, -120, 82, -120, 82, -30); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
  rr(-82, -52, 164, 22, 6); ctx.fillStyle = INK; ctx.fill();
  ctx.restore();
}

// =====================================================================
// DRS review reel: "Bumrah bola HIGH hai... phir bhi REVIEW kyun?"
// original flat drawings only: generic players by role (no real faces, no logos), pad, ball, stumps, stopwatch
// =====================================================================
window.TOPIC = 'DRS Review';
function STEPS() { return [[0, 'DRS DRAMA'], [LS(2), '15 SECOND RULE'], [LS(3), 'CAPTAIN KA FAISLA']]; }
const JERSEY = '#7d9be0', CAP = GRIP;

// generic cricketer (role only); (x, y) = centre of the shoulders
function player(x, y, s, o = {}) {
  const T = o.T || 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  // arms down (fade out when the T sign comes up)
  ctx.save(); ctx.globalAlpha *= 1 - clamp(T * 2);
  for (const d of [-1, 1]) {
    hardShadow(d * 106 - 22, 20, 44, 200, 22, 6);
    rr(d * 106 - 22, 20, 44, 200, 22); ctx.fillStyle = JERSEY; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    if (o.gloves) { rr(d * 106 - 40, 196, 80, 96, 30); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(d * 106, 228, 25, 0, 7); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  ctx.restore();
  // torso
  hardShadow(-100, 0, 200, 270, 70, 8);
  rr(-100, 0, 200, 270, 70); ctx.fillStyle = JERSEY; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  line([[-34, 2], [0, 44], [34, 2]], INK, 6);
  if (o.label) {
    ctx.font = `700 26px ${MONO}`; const lw = ctx.measureText(o.label).width + 30;
    rr(-lw / 2, 150, lw, 48, 24); ctx.fillStyle = INK; ctx.fill();
    txt(o.label, 0, 175, `700 26px ${MONO}`, '#ffffff');
  }
  if (o.badge) { disc(56, 80, 30, C.yel, 4); txt('C', 56, 83, SANSB(36), INK); }
  // head + cap
  ctx.beginPath(); ctx.arc(6, -74, 76, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, -80, 76, 0, 7); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -98, 80, Math.PI, 0); ctx.closePath(); ctx.fillStyle = o.helmet ? '#e9edf7' : CAP; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(o.brim || 62, -98, 64, 14, 0, 0, 7); ctx.fillStyle = o.helmet ? '#e9edf7' : CAP; ctx.fill(); ctx.stroke();
  if (o.helmet) for (const gy of [-64, -40]) line([[-60, gy], [60, gy]], INK, 5);
  ctx.beginPath(); ctx.arc(-26, -76, 8, 0, 7); ctx.arc(26, -76, 8, 0, 7); ctx.fillStyle = INK; ctx.fill();
  if (o.mouth === 'o') { ctx.beginPath(); ctx.ellipse(0, -30, 14, 18, 0, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
  else if (o.mouth === 'shout') { ctx.beginPath(); ctx.arc(0, -40, 26, 0, Math.PI); ctx.closePath(); ctx.fillStyle = INK; ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, -46, 22, 0.2, Math.PI - 0.2); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
  // the review "T" sign, held up beside the head
  if (T > 0) {
    ctx.save(); ctx.translate(200, -150); const ts = back(clamp(T)); ctx.scale(ts, ts); ctx.rotate(0.06);
    hardShadow(-100, -24, 200, 48, 24, 6);
    rr(-100, -24, 200, 48, 24); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    hardShadow(-24, 24, 48, 160, 24, 6);
    rr(-24, 24, 48, 160, 24); ctx.fillStyle = SKIN; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    rr(-150, -30, 60, 60, 24); ctx.fillStyle = JERSEY; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    rr(-30, 174, 60, 60, 24); ctx.fillStyle = JERSEY; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
function popPlayer(x, y, s, f, o) { if (f <= 0) return; ctx.save(); ctx.globalAlpha *= Math.min(1, f * 3); ctx.translate(x, y); const k = back(f); ctx.scale(k, k); player(0, 0, s, o); ctx.restore(); }

// ---------- line 0: bowler says HIGH, captain still asks for the review ----------
function sceneCall(t) {
  const kH = CK('HIGH'), kG = CK('par Gill'), kR = CK('review le');
  popPlayer(290, 900, 0.95, P(t, 0.0, 0.35), { label: 'BOWLER', mouth: t > kR + 0.2 ? 'o' : (t > kH - 0.1 && t < kG ? 'shout' : 'smile') });
  popPlayer(790, 900, 0.95, P(t, 0.15, 0.5), { label: 'CAPTAIN', badge: true, T: P(t, kG + 0.25, kG + 0.6) });
  bubble(330, 560, 360, 124, 'HIGH HAI!', P(t, kH - 0.05, kH + 0.25), 56);
  // little pad + ball icon under the bubble: ball on the top of the pad
  popAt(590, 470, P(t, kH + 0.1, kH + 0.4), () => {
    ctx.save(); ctx.scale(0.42, 0.42); pad(0, 0, 1); ctx.restore();
    ball(22, 18, 26, 0.4);
    line([[70, 150], [70, 10]], INK, 10); line([[70, 150], [70, 10]], C.red, 5);
    ctx.beginPath(); ctx.moveTo(70, -14); ctx.lineTo(52, 14); ctx.lineTo(88, 14); ctx.closePath(); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  });
  stamp(540, 1330, 'REVIEW!', C.yel, P(t, kR + 0.05, kR + 0.27), -0.08, 92, INK);
}

// ---------- line 1: replay shows the ball going over the bails, review lost, batter goes on to fifty ----------
const SCR = [90, 330, 900, 640, 40];
const ST2 = [540, 920, 0.72];
const TOP2 = ST2[1] - 548 * ST2[2];                    // top of the bails on the screen
const END2 = [600, TOP2 - 78, 32];                    // the predicted ball, clear above the bails
function trackHigh(u) {
  const b = 0.6;
  if (u < b) { const k = u / b; return [L(360, 520, k), L(430, 860, eio(k) * 0.9 + k * 0.1), L(10, 22, k)]; }
  const k = (u - b) / (1 - b); return [L(520, END2[0], k), L(860, END2[1], eo(k)), L(22, END2[2], k)];
}
function sceneLost(t) {
  const t0 = LS(1), kG = CK('Review gaya'), kB = CK('Blundell'), kF = CK('fifty');
  const [x, y, w, h, r] = SCR;
  popAt(540, y + h / 2, P(t, t0 - 0.15, t0 + 0.25), () => {
    ctx.translate(-540, -(y + h / 2));
    hardShadow(x, y, w, h, r, 12);
    ctx.save(); rr(x, y, w, h, r); ctx.clip();
    ctx.fillStyle = TURF; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = TURF2; for (let k = 0; k < 4; k++) ctx.fillRect(x, y + 120 + k * 150, w, 75);
    ctx.beginPath(); ctx.moveTo(480, y); ctx.lineTo(600, y); ctx.lineTo(760, y + h); ctx.lineTo(320, y + h); ctx.closePath(); ctx.fillStyle = STRIP; ctx.fill();
    const u = P(t, t0 + 0.05, kG + 0.1);
    for (let i = 0; i <= 36; i++) { const [px, py, pr] = trackHigh(i / 36 * u); ctx.beginPath(); ctx.arc(px, py, pr * 0.92, 0, 7); ctx.fillStyle = hexA(C.red, 0.3); ctx.fill(); }
    stumps(ST2[0], ST2[1], ST2[2], false);
    if (u > 0) { const [bx, by, br] = trackHigh(u); ball(bx, by, br, t * 6); }
    ctx.fillStyle = 'rgba(13,10,38,0.78)'; ctx.fillRect(x, y, w, 80);
    txt('BALL-TRACKING', x + 36, y + 42, `700 30px ${MONO}`, '#ffffff', 'left');
    ctx.restore();
    rr(x, y, w, h, r); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    // gap marker between the ball and the bails
    const gf = P(t, kG - 0.2, kG + 0.1);
    if (gf > 0) {
      ctx.save(); ctx.globalAlpha *= gf;
      line([[END2[0] + 60, END2[1] + END2[2] + 4], [END2[0] + 60, TOP2 - 4]], INK, 8); line([[END2[0] + 60, END2[1] + END2[2] + 4], [END2[0] + 60, TOP2 - 4]], C.yel, 4);
      ctx.restore();
    }
    chipW(820, END2[1] + 20, 'HIGH! MISSING', C.red, t, kG - 0.15, LS(2), { size: 30, h: 64 });
  });
  stamp(540, 880, 'REVIEW GAYA', C.red, P(t, kG + 0.15, kG + 0.37), -0.07, 76);
  // the batter carries on: score card counting to 50
  popAt(540, 1210, P(t, kB - 0.1, kB + 0.25), () => {
    card(-390, -120, 780, 240, 40, C.box, 6, 10);
    ctx.save(); ctx.translate(-250, 10); ctx.rotate(0.5); bat(0, -80, 0.34); ctx.restore();
    txt('BATTER', 40, -62, `700 30px ${MONO}`, C.mute);
    const n = Math.round(50 * eo(P(t, kB + 0.05, kF + 0.1)));
    txt(String(n), 40, 34, SANSB(120), t >= kF ? C.grn : '#ffffff');
  });
  chipW(820, 1090, 'FIFTY!', C.grn, t, kF + 0.05, LS(2), { size: 40, h: 80 });
}

// ---------- line 2: after NOT OUT, a 15-second clock starts ----------
function stopwatch(x, y, r, frac, digits, col, hand) {
  rr(x - 34, y - r - 70, 68, 52, 12); hardShadow(x - 34, y - r - 70, 68, 52, 12, 6);
  rr(x - 34, y - r - 70, 68, 52, 12); ctx.fillStyle = C.org; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  rr(x - 14, y - r - 30, 28, 30, 6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
  disc(x, y, r + 22, '#ffffff', 12);
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = C.box; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  if (frac > 0) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, 7); ctx.fillStyle = C.box; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; line([[x + Math.cos(a) * (r * 0.66), y + Math.sin(a) * (r * 0.66)], [x + Math.cos(a) * (r * 0.74), y + Math.sin(a) * (r * 0.74)]], 'rgba(255,255,255,0.45)', 5); }
  if (hand != null) { const a = -Math.PI / 2 + hand; line([[x, y], [x + Math.cos(a) * r * 0.56, y + Math.sin(a) * r * 0.56]], C.yel, 8); }
  ctx.font = SANSB(150); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.strokeText(digits, x, y + 10); ctx.fillStyle = '#ffffff'; ctx.fillText(digits, x, y + 10);
}
function sceneTimer(t) {
  const t0 = LS(2), kG = CK('ghadi'), kS = CK('sirf 15');
  popAt(300, 520, P(t, t0 - 0.1, t0 + 0.25), () => umpireHat(0, 0, 0.85));
  chipW(690, 520, 'NOT OUT', C.red, t, t0 + 0.1, LS(3) + 0.4, { size: 48, h: 92 });
  const v = t < kS + 0.15 ? 15 : Math.max(0, 15 - (t - kS - 0.15) * 4.5);
  const col = v > 10 ? C.grn : v > 5 ? C.yel : C.red;
  popAt(540, 1040, P(t, kG - 0.1, kG + 0.25), () => stopwatch(0, 0, 240, v / 15, String(Math.ceil(v)), col, t > kG ? (t - kG) * Math.PI * 2 * 0.8 : 0));
  chipW(540, 1370, 'SIRF 15 SECOND!', C.red, t, kS + 0.15, LS(3) + 0.4, { size: 40, h: 82 });
}

// ---------- line 3: bowler and keeper only advise, the captain decides ----------
function sceneCaptain(t) {
  const t0 = LS(3), kS = CK('salaah'), kF = CK('faisla sirf'), kC = CK('captain ka');
  const dim = 1 - 0.45 * P(t, kF, kF + 0.3);
  ctx.save(); ctx.globalAlpha *= dim;
  popPlayer(220, 1000, 0.7, P(t, t0 - 0.1, t0 + 0.25), { label: 'BOWLER', mouth: t > kS ? 'shout' : 'smile' });
  popPlayer(860, 1000, 0.7, P(t, t0 + 0.25, t0 + 0.6), { label: 'KEEPER', gloves: true, helmet: true, brim: 0, mouth: t > kS + 0.25 ? 'shout' : 'smile' });
  ctx.restore();
  bubble(240, 660, 280, 116, 'LE LO!', P(t, kS, kS + 0.3), 52);
  bubble(830, 660, 300, 116, 'MAT LO!', P(t, kS + 0.3, kS + 0.6), 52);
  const cs = L(0.8, 0.98, eo(P(t, kF, kF + 0.35)));
  popPlayer(540, 930, cs, P(t, t0 + 0.1, t0 + 0.45), { label: 'CAPTAIN', badge: true, T: P(t, kC + 0.1, kC + 0.45) });
  stamp(540, 1340, 'FAISLA: CAPTAIN', C.yel, P(t, kC + 0.05, kC + 0.27), -0.06, 64, INK);
}

// ---------- line 4: a wrong review costs one of the team's reviews ----------
function sceneMinus(t) {
  const t0 = LS(4), kG = CK('Galat'), kK = CK('Ek review kam');
  popAt(540, 800, P(t, t0 - 0.15, t0 + 0.25), () => {
    card(-420, -230, 840, 460, 44, C.box, 6, 12);
    txt('TEAM KE REVIEWS', 0, -160, `700 36px ${MONO}`, '#ffffff');
    const lost = P(t, kK + 0.05, kK + 0.35);
    [-260, 0, 260].forEach((dx, i) => {
      const last = i === 2;
      const dy = last ? 30 * eo(lost) : 0;
      ctx.save(); if (last) ctx.globalAlpha *= 1 - 0.55 * lost;
      disc(dx, 40 + dy, 88, last && lost > 0.5 ? '#6d6a8a' : C.grn, 8);
      if (!(last && lost > 0.5)) line([[dx - 36, 44 + dy], [dx - 8, 72 + dy], [dx + 40, 12 + dy]], INK, 14);
      ctx.restore();
    });
    const cf = P(t, kG + 0.1, kG + 0.35);
    if (cf > 0) { ctx.save(); ctx.translate(260 + shake(t, kG + 0.1, 0.4, 8), 40); const s = back(cf); ctx.scale(s, s); crossMark(0, 0, 70); ctx.restore(); }
  });
  chipW(540, 470, 'GALAT REVIEW', C.red, t, kG + 0.05, LS(5), { size: 40, h: 82 });
  stamp(540, 1260, '-1 REVIEW', C.red, P(t, kK + 0.25, kK + 0.47), -0.07, 84);
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(1), sceneCall], [LS(1), LS(2), sceneLost], [LS(2), LS(3), sceneTimer],
          [LS(3), LS(4), sceneCaptain], [LS(4), LS(n) - 0.4, sceneMinus],
          [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('review le') + 0.15, 540, 1330, [C.yel, C.org, '#ffffff'], 26, 1.3);
  burst(t, CK('Review gaya') + 0.25, 540, 880, [C.red, C.org, C.yel], 24, 1.2);
  burst(t, CK('fifty') + 0.1, 820, 1090, [C.grn, C.yel, '#ffffff'], 24, 1.2);
  burst(t, CK('sirf 15') + 0.2, 540, 1370, [C.red, C.yel, '#ffffff'], 22, 1.1);
  burst(t, CK('captain ka') + 0.15, 540, 1340, [C.yel, C.grn, '#ffffff'], 26, 1.3);
  burst(t, CK('Ek review kam') + 0.35, 540, 1260, [C.red, C.org, C.yel], 24, 1.2);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈↑✓…●–−★%\'')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
