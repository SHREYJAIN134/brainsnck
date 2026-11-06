window.BG = '#2f6b70';
// "FASTag se bina ruke toll kaise kat jaata hai?" — 1080x1920, synced to window.TL (helpers from maps.js)
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
// FASTag reel scenes
// =====================================================================
window.TOPIC = 'FASTag';
function STEPS() { return [[0, 'BINA RUKE TOLL'], [LS(2), 'TAG KA RAAZ'], [LS(5), 'PAISE KAT']]; }
const SANSB = s => `800 ${s}px ${SANS}`;
const LIGHT = '#c9cde6';

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
// chip that pops in at a and fades out at b
function chipW(x, y, label, col, t, a, b, opts = {}) {
  const fo = 1 - P(t, b - 0.2, b); if (fo <= 0) return;
  ctx.save(); ctx.globalAlpha *= fo; chip(x + shake(t, a, 0.4, 6), y, label, col, P(t, a, a + 0.3), opts); ctx.restore();
}
function bolt(x, y, s, col = C.yel) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const pts = [[6, -30], [-14, 4], [0, 4], [-6, 30], [16, -6], [2, -6], [10, -30]];
  const path = (ox, oy) => { ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px + ox, py + oy) : ctx.moveTo(px + ox, py + oy)); ctx.closePath(); };
  path(3, 3); ctx.fillStyle = INK; ctx.fill();
  path(0, 0); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
// radio arcs: centre (x,y), direction ang, travelling outward
function radioArcs(x, y, ang, t, a, b, col, rMax, spread = 0.55) {
  if (t < a || t > b + 0.6) return;
  for (let k = 0; k < 4; k++) {
    const age = (t - a) * 1.6 - k * 0.32; if (age < 0) continue;
    const u = age % 1; const born = t - u / 1.6; if (born > b) continue;
    const r = 30 + u * rMax, al = Math.min(1, u * 6) * (1 - P(u, 0.65, 1));
    ctx.save(); ctx.globalAlpha *= al; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, ang - spread, ang + spread); ctx.lineWidth = 17; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r, ang - spread, ang + spread); ctx.lineWidth = 10; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
  }
}

// ---------- drawings ----------
function car(x, y, s, col = C.org, spin = 0, tag = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const lw = 4.5 / Math.max(1, s * 0.6);
  const body = (ox, oy) => {
    ctx.beginPath(); ctx.moveTo(-150 + ox, 28 + oy); ctx.lineTo(-150 + ox, -18 + oy); ctx.quadraticCurveTo(-150 + ox, -42 + oy, -126 + ox, -42 + oy);
    ctx.lineTo(-96 + ox, -42 + oy); ctx.lineTo(-70 + ox, -104 + oy); ctx.lineTo(42 + ox, -104 + oy); ctx.lineTo(94 + ox, -42 + oy);
    ctx.lineTo(132 + ox, -38 + oy); ctx.quadraticCurveTo(152 + ox, -34 + oy, 152 + ox, -12 + oy); ctx.lineTo(152 + ox, 28 + oy);
    ctx.quadraticCurveTo(152 + ox, 40 + oy, 140 + ox, 40 + oy); ctx.lineTo(-138 + ox, 40 + oy); ctx.quadraticCurveTo(-150 + ox, 40 + oy, -150 + ox, 28 + oy); ctx.closePath();
  };
  body(6, 6); ctx.fillStyle = INK; ctx.fill();
  body(0, 0); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke();
  const win = pts => { ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fillStyle = '#d6eef5'; ctx.fill(); ctx.lineWidth = lw * 0.8; ctx.strokeStyle = INK; ctx.stroke(); };
  win([[-84, -48], [-63, -96], [-14, -96], [-14, -48]]);
  win([[-4, -48], [-4, -96], [38, -96], [82, -48]]);
  line([[-9, -40], [-9, 28]], INK, lw * 0.7);
  rr(138, -30, 14, 16, 4); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.stroke();
  rr(-150, -28, 10, 14, 3); ctx.fillStyle = C.red; ctx.fill(); ctx.stroke();
  if (tag) { rr(10, -88, 22, 14, 3); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = lw * 0.6; ctx.strokeStyle = INK; ctx.stroke(); }
  for (const wx of [-88, 92]) {
    ctx.beginPath(); ctx.arc(wx, 40, 30, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(wx, 40, 14, 0, 7); ctx.fillStyle = LIGHT; ctx.fill();
    for (let k = 0; k < 3; k++) { const a = spin + k * 2.094; line([[wx, 40], [wx + Math.cos(a) * 13, 40 + Math.sin(a) * 13]], INK, 3); }
  }
  ctx.restore();
}
function road(y0, y1, dashOff = 0) {
  ctx.fillStyle = C.box; ctx.fillRect(0, y0, W, y1 - y0);
  ctx.fillStyle = INK; ctx.fillRect(0, y0 - 3, W, 6); ctx.fillRect(0, y1 - 3, W, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const ym = (y0 + y1) / 2;
  for (let x = -((dashOff % 120) + 120) % 120; x < W; x += 120) ctx.fillRect(x, ym - 4, 60, 8);
}
function booth(x, yg, s) {
  if (s <= 0) return;
  ctx.save(); ctx.translate(x, yg); ctx.scale(s, s);
  // boom barrier (red / white stripes)
  ctx.save(); ctx.translate(96, -70);
  hardShadow(0, -11, 300, 22, 8, 4);
  ctx.save(); rr(0, -11, 300, 22, 8); ctx.clip();
  for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : C.red; ctx.fillRect(i * 40, -11, 40, 22); }
  ctx.restore(); rr(0, -11, 300, 22, 8); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
  card(80, -100, 34, 100, 6, LIGHT, 4, 4);
  // hut
  card(-80, -175, 160, 175, 10, C.pink, 5, 7);
  card(-102, -210, 204, 46, 12, C.yel, 5, 6);
  txt('TOLL', 0, -185, SANSB(30), INK);
  rr(-52, -145, 104, 62, 8); ctx.fillStyle = '#d6eef5'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}
function gantryT(x, yTop, yg, half, t, lit = 0) {
  card(x - 16, yTop, 32, yg - yTop, 6, LIGHT, 4, 6);                 // pole (behind the road)
  card(x - half, yTop - 22, 2 * half, 44, 10, LIGHT, 5, 6);          // beam
  card(x + 25, yTop + 22, 120, 70, 12, lit ? C.grn : C.yel, 5, 6);   // reader
  txt('READER', x + 85, yTop + 57, `700 20px ${MONO}`, INK);
  card(x - 130, yTop + 22, 80, 44, 10, LIGHT, 4, 5);                 // camera
  disc(x - 90, yTop + 44, 13, C.cyan, 0);
}
function speedLines(x, y, s, t, f) {
  if (f <= 0) return;
  ctx.save(); ctx.globalAlpha *= f;
  for (let i = 0; i < 4; i++) {
    const len = (90 + 60 * hash(i, 4)) * s, yy = y + (-70 + i * 32) * s, x0 = x - 175 * s - 20 * Math.sin(t * 20 + i);
    line([[x0 - len, yy], [x0, yy]], '#ffffff', 7);
  }
  ctx.restore();
}

// ---------- scene 1: highway, toll booth gayab, full speed, paise kat ----------
const RY0 = 1150, RY1 = 1290, GX = 540, CS = 1.4;
function carX1(t) {
  const a = CK('Full speed') - 0.15, m = CK('kat gaye') - 0.2;
  const v = (GX + 40 + 230) / (m - a);
  return -230 + v * (t - a);
}
function sceneHighway(t) {
  const kT = CK('toll booth'), kF = CK('Full speed'), kK = CK('kat gaye');
  // highway sign -> payment notification
  const sf = P(t, 0.05, 0.4) * (1 - P(t, kK - 0.25, kK - 0.05));
  if (sf > 0) popAt(540, 470, Math.min(1, sf * 1.01), () => {
    card(-300, -85, 600, 170, 26, C.grn, 6, 10);
    rr(-282, -67, 564, 134, 18); ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.stroke();
    txt('NH-48', 0, -30, `700 32px ${MONO}`, INK);
    txt('JAIPUR  →', 0, 22, SANSB(60), '#ffffff');
  });
  const nf = P(t, kK - 0.05, kK + 0.25);
  if (nf > 0) popAt(540, 470, nf, () => {
    card(-370, -85, 740, 170, 34, '#ffffff', 6, 10);
    disc(-280, 0, 50, C.grn, 4); txt('₹', -280, 4, SANSB(56), INK);
    txt('FASTag · Toll paid', -205, -24, SANSB(40), INK, 'left');
    txt('gaadi ruki bhi nahi ✓', -205, 30, `600 30px ${SANS}`, '#3c4a6b', 'left');
  });
  // road
  road(RY0, RY1, 0);
  // old toll booth -> gayab
  const bs = (t < kT + 0.45 ? back(P(t, 0.15, 0.5)) : 1 - eio(P(t, kT + 0.45, kT + 0.8)));
  booth(GX - 170 + shake(t, kT + 0.1, 0.4, 10), RY0 + 4, bs * 1.35);
  if (t > kT + 0.1 && t < kT + 0.8) {      // red ban sign over the booth
    const f = back(P(t, kT + 0.1, kT + 0.35)) * (1 - P(t, kT + 0.6, kT + 0.8));
    ctx.save(); ctx.translate(GX - 60, RY0 - 160); ctx.scale(f * 1.2, f * 1.2);
    for (const [w, c] of [[30, INK], [20, C.red]]) {
      ctx.beginPath(); ctx.arc(0, 0, 120, 0, 7); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke();
      line([[-85, -85], [85, 85]], c, w);
    }
    ctx.restore();
  }
  // new overhead gantry drops in
  const gf = P(t, kT + 0.75, kT + 1.15);
  if (gf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, gf * 3); ctx.translate(0, L(-260, 0, back(gf)));
    gantryT(GX, 660, RY0 + 6, 300, t, t > kK - 0.1 && t < kK + 0.9);
    ctx.restore();
  }
  // car at full speed
  const cx = carX1(t);
  if (t > kF - 0.2 && cx < W + 260) {
    radioArcs(GX + 85, 740, Math.PI / 2, t, kK - 0.8, kK - 0.1, C.cyan, 250, 0.5);
    speedLines(cx, RY0 + 8, CS, t, P(t, kF, kF + 0.2));
    car(cx, RY0 + 8, CS, C.org, t * 26);
  }
  chipW(540, 1370, 'NO TOLL BOOTH!', C.red, t, kT + 0.35, kF - 0.05, { size: 32, h: 72 });
  chipW(540, 1370, 'FULL SPEED  →', C.yel, t, kF + 0.05, kK - 0.05, { size: 32, h: 72 });
  chipW(540, 1370, 'BINA RUKE  ✓', C.grn, t, kK + 0.1, 99, { size: 32, h: 72 });
}

// ---------- scene 2: FASTag ke andar ... BATTERY hi nahi ----------
const TG = [540, 700, 680, 400];
function meander(dir) {   // antenna zig-zag from the chip outwards
  const pts = [[dir * 40, 0], [dir * 62, 0]];
  for (let i = 0; i < 8; i++) { const x = dir * (62 + i * 30), y = i % 2 ? 66 : -66; pts.push([x, y], [x + dir * 30, y]); }
  pts.push([dir * 302, 0]);
  return pts;
}
function bigTag(t, xr) {
  const [cx, cy, w, h] = TG;
  ctx.save(); ctx.translate(cx, cy);
  card(-w / 2, -h / 2, w, h, 34, '#ffffff', 6, 12);
  ctx.save(); rr(-w / 2, -h / 2, w, h, 34); ctx.clip();
  ctx.fillStyle = C.yel; ctx.fillRect(-w / 2, -h / 2, w, 100);
  ctx.fillStyle = INK; ctx.fillRect(-w / 2, -h / 2 + 98, w, 5);
  txt('FASTag', -w / 2 + 44, -h / 2 + 52, SANSB(60), INK, 'left');
  txt('RFID', w / 2 - 44, -h / 2 + 54, `700 30px ${MONO}`, INK, 'right');
  for (let i = 0; i < 30; i++) { ctx.fillStyle = INK; ctx.fillRect(-w / 2 + 44 + i * 13, -40, hash(i, 3) > 0.5 ? 8 : 4, 110); }
  txt('ID 34161FA8 •••• 7A9F', -w / 2 + 44, 112, `600 26px ${MONO}`, INK, 'left');
  rr(w / 2 - 190, -42, 146, 146, 14); ctx.fillStyle = LIGHT; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (hash(i, j + 7) > 0.45) { ctx.fillStyle = INK; ctx.fillRect(w / 2 - 176 + i * 24, -28 + j * 24, 20, 20); }
  if (xr > 0) {   // x-ray: see inside
    ctx.beginPath(); ctx.rect(-w / 2, -h / 2 + 103, w * xr, h - 103); ctx.clip();
    ctx.fillStyle = C.box; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.translate(0, 52);
    for (const d of [-1, 1]) {
      const pts = meander(d);
      line(pts, INK, 16); line(pts, C.cyan, 9);
    }
    rr(-44, -44, 88, 88, 10); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    for (let k = 0; k < 4; k++) { ctx.fillStyle = INK; ctx.fillRect(-30 + k * 18, -56, 8, 12); ctx.fillRect(-30 + k * 18, 44, 8, 12); }
    rr(-22, -22, 44, 44, 6); ctx.fillStyle = INK; ctx.fill();
  }
  ctx.restore();
  if (xr > 0 && xr < 1) {   // scan line
    const x = -w / 2 + w * xr;
    ctx.fillStyle = C.yel; ctx.fillRect(x - 6, -h / 2 + 80, 12, h - 56); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeRect(x - 6, -h / 2 + 80, 12, h - 56);
  }
  ctx.restore();
}
function battery(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  card(-100, -55, 190, 110, 18, LIGHT, 5, 7);
  card(90, -24, 22, 48, 6, LIGHT, 4, 4);
  for (let k = 0; k < 3; k++) { rr(-80 + k * 56, -35, 44, 70, 8); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
}
function sceneTag(t) {
  const kR = CK('Raaz?'), kB = CK('BATTERY');
  const f = P(t, kR - 0.1, kR + 0.3);
  ctx.save(); ctx.globalAlpha *= Math.min(1, f * 3);
  ctx.translate(540, 700); const s = L(0.6, 1, back(f)); ctx.scale(s, s); ctx.translate(-540, -700);
  ctx.translate(shake(t, kB, 0.45, 9), 0);
  bigTag(t, eio(P(t, kR + 0.7, kB - 0.25)));
  ctx.restore();
  // labels for the inside
  const lf = P(t, kB - 0.3, kB);
  if (lf > 0) {
    chip(330, 975, 'ANTENNA', C.cyan, lf, { size: 30, h: 62 });
    chip(700, 975, 'CHIP', C.yel, P(t, kB - 0.2, kB + 0.1), { size: 30, h: 62 });
  }
  // battery: none!
  const bf = P(t, kB - 0.05, kB + 0.25);
  if (bf > 0) {
    popAt(540, 1170, bf, () => {
      battery(0, 0, 1);
      const xf = P(t, kB + 0.2, kB + 0.4);
      if (xf > 0) {
        ctx.save(); ctx.scale(back(xf), back(xf));
        for (const [w, c] of [[30, INK], [20, C.red]]) {
          ctx.beginPath(); ctx.arc(0, 0, 105, 0, 7); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke();
          line([[-74, -74], [74, 74]], c, w);
        }
        ctx.restore();
      }
    });
  }
  chipW(540, 1370, 'NO BATTERY!', C.red, t, kB + 0.35, 99, { size: 34, h: 76 });
}

// ---------- scene 3: reader -> radio waves -> tag jaagta -> ID bolta ----------
const RD = [540, 470], TAGP = [510, 1100];
function tagFace(t, e, awake) {
  const [x, y] = TAGP, w = 100, h = 64;
  ctx.save(); ctx.translate(x, y + shake(t, CK('tag jaagta'), 0.4, 5));
  const sc = 1 + 0.12 * win(t, CK('tag jaagta'), CK('tag jaagta') + 0.5, 0.1, 0.4); ctx.scale(sc, sc);
  card(-w / 2, -h / 2, w, h, 10, LIGHT, 4, 5);
  if (e > 0) { ctx.save(); rr(-w / 2, -h / 2, w, h, 10); ctx.clip(); ctx.fillStyle = C.yel; ctx.fillRect(-w / 2, h / 2 - h * e, w, h * e); ctx.restore(); rr(-w / 2, -h / 2, w, h, 10); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); }
  if (awake) {
    for (const ex of [-20, 20]) { ctx.beginPath(); ctx.arc(ex, -4, 11, 0, 7); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); ctx.beginPath(); ctx.arc(ex + 2, -6, 5, 0, 7); ctx.fillStyle = INK; ctx.fill(); }
    ctx.beginPath(); ctx.arc(0, 10, 9, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  } else {
    for (const ex of [-20, 20]) line([[ex - 9, -4], [ex + 9, -4]], INK, 4);
  }
  ctx.restore();
}
function sceneReader(t) {
  const kU = CK('Upar ka'), kW = CK('radio waves'), kE = CK('Usi energy'), kJ = CK('tag jaagta'), kI = CK('ID bolta');
  const [rx, ry] = RD, [tx, ty] = TAGP;
  // gantry beam + pole
  const gf = P(t, kU - 0.1, kU + 0.3);
  ctx.save(); ctx.globalAlpha *= Math.min(1, gf * 3); ctx.translate(0, L(-200, 0, eo(gf)));
  card(70, 380, 40, 1010, 8, LIGHT, 5, 6);
  card(-20, 340, 1120, 56, 0, LIGHT, 5, 8);
  const lit = t > kI + 0.55;
  card(rx - 95, 396, 190, 110, 20, lit ? C.grn : C.yel, 6, 8);
  txt('READER', rx, 452, `700 30px ${MONO}`, INK);
  ctx.restore();
  if (lit) popAt(rx + 120, 400, P(t, kI + 0.55, kI + 0.8), () => tickMark(0, 0, 34, '#ffffff'));
  // road + big car with the tag on its windscreen
  const cf = P(t, kU - 0.05, kU + 0.35);
  ctx.save(); ctx.translate(L(-500, 0, eo(cf)), 0);
  ctx.fillStyle = C.box; ctx.fillRect(-600, 1390, W + 1200, 40); ctx.fillStyle = INK; ctx.fillRect(-600, 1387, W + 1200, 6);
  car(470, 1250, 2.0, C.org, 0, false);
  const e = P(t, kE, kJ);
  tagFace(t, e, t > kJ);
  ctx.restore();
  // radio waves down (reader -> tag)
  radioArcs(rx, 512, Math.PI / 2, t, kW - 0.1, kI - 0.15, C.cyan, 560, 0.42);
  // energy bolts riding the waves
  if (t > kE - 0.1 && t < kJ + 0.1) {
    for (let k = 0; k < 3; k++) {
      const u = ((t - kE) * 1.4 + k / 3) % 1;
      ctx.save(); ctx.globalAlpha *= Math.min(1, u * 5) * (1 - P(t, kJ - 0.1, kJ + 0.1));
      bolt(L(rx, tx, u) + (k - 1) * 70 * (1 - u), L(560, ty - 70, u), 1.3); ctx.restore();
    }
  }
  // energy meter
  const mf = P(t, kE - 0.1, kE + 0.2) * (1 - P(t, kI + 0.2, kI + 0.5));
  if (mf > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, mf * 2);
    txt('ENERGY', 900, 620, `700 26px ${MONO}`, '#ffffff');
    card(860, 650, 80, 280, 20, C.box, 5, 6);
    const lv = P(t, kE, kJ);
    if (lv > 0) { rr(870, 920 - 260 * lv, 60, 260 * lv, 12); ctx.fillStyle = C.yel; ctx.fill(); }
    bolt(900, 790, 1.1, lv >= 1 ? C.grn : '#ffffff');
    ctx.restore();
  }
  ring(tx, ty, t, kJ, '#ffffff', 50, 170, 0.6);
  chipW(800, 1000, '← FASTag', C.cyan, t, kU + 0.45, kJ, { size: 28, h: 64 });
  chipW(800, 1000, 'TAG JAAGA!', C.yel, t, kJ + 0.05, kI - 0.05, { size: 28, h: 64 });
  // tag replies with its ID (tag -> reader)
  radioArcs(tx, ty - 40, -Math.PI / 2, t, kI - 0.1, kI + 0.5, C.grn, 520, 0.42);
  const idf = P(t, kI, kI + 0.55);
  if (idf > 0 && t < kI + 1.2) chip(L(tx, rx, eio(idf)), L(ty - 110, 600, eio(idf)), 'ID 34161FA8…', C.grn, P(t, kI - 0.05, kI + 0.2), { size: 28, h: 64 });
}

// ---------- scene 4: ID -> bank -> account mila -> paise kat ----------
function bankIcon(x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
  const roof = (ox, oy) => { ctx.beginPath(); ctx.moveTo(-120 + ox, -40 + oy); ctx.lineTo(0 + ox, -110 + oy); ctx.lineTo(120 + ox, -40 + oy); ctx.closePath(); };
  roof(6, 6); ctx.fillStyle = INK; ctx.fill(); roof(0, 0); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  txt('₹', 0, -62, SANSB(40), INK);
  for (let k = 0; k < 4; k++) card(-96 + k * 56, -30, 24, 100, 4, LIGHT, 4, 3);
  card(-125, 72, 250, 26, 6, col, 4, 5);
  ctx.restore();
}
function sceneBank(t) {
  const kA = CK('ID se account'), kP = CK('paise kat');
  // ID travels into the bank
  const idf = P(t, kA - 0.1, kA + 0.5);
  const iu = P(t, kA + 0.15, kA + 0.5);
  if (iu < 1) { ctx.save(); ctx.translate(540, L(400, 600, eio(iu))); const k = 1 - 0.8 * P(iu, 0.6, 1); ctx.scale(k, k); ctx.globalAlpha *= 1 - P(iu, 0.75, 1); chip(0, 0, 'ID 34161FA8…', C.grn, P(t, kA - 0.15, kA + 0.15), { size: 30, h: 66 }); ctx.restore(); }
  const bf = P(t, kA + 0.1, kA + 0.4);
  popAt(540, 660, bf, () => bankIcon(0, 0, 1.15, t > kA + 0.55 ? C.grn : C.cyan));
  ring(540, 640, t, kA + 0.55, '#ffffff', 60, 220, 0.5);
  if (bf > 0) { ctx.save(); ctx.globalAlpha *= bf; txt('BANK', 540, 805, `700 28px ${MONO}`, '#ffffff'); ctx.restore(); }
  // arrow
  const af = P(t, kA + 0.5, kA + 0.75);
  if (af > 0) { line(polyPart([[540, 840], [540, 915]], af), INK, 16); line(polyPart([[540, 840], [540, 915]], af), '#ffffff', 8); }
  // account card
  const cf = P(t, kA + 0.6, kA + 0.9);
  popAt(540, 1090, cf, () => {
    card(-340, -160, 680, 320, 32, '#ffffff', 6, 12);
    txt('FASTag account', -296, -110, SANSB(40), INK, 'left');
    txt('TAG ID 34161FA8…', -296, -46, `600 28px ${MONO}`, '#3c4a6b', 'left');
    const mf = P(t, kA + 1.0, kA + 1.25);
    if (mf > 0) popAt(250, -60, mf, () => tickMark(0, 0, 32, C.grn));
    txt('BALANCE', -296, 20, `700 24px ${MONO}`, '#3c4a6b', 'left');
    const cut = 0.32 * eio(P(t, kP, kP + 0.35));
    rr(-296, 44, 592, 50, 14); ctx.fillStyle = LIGHT; ctx.fill();
    rr(-296, 44, 592 * (1 - cut), 50, 14); ctx.fillStyle = C.grn; ctx.fill();
    rr(-296, 44, 592, 50, 14); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  });
  // coins fly out
  for (let k = 0; k < 5; k++) {
    const u = P(t, kP + k * 0.06, kP + 0.55 + k * 0.06); if (u <= 0 || u >= 1) continue;
    const x = L(560 + k * 40, 880 - k * 30, eo(u)), y = L(1160, 860 - 40 * k, eo(u)) - 120 * Math.sin(u * Math.PI);
    ctx.save(); ctx.globalAlpha *= 1 - P(u, 0.75, 1); disc(x, y, 34, C.yel, 4); txt('₹', x, y + 3, SANSB(36), INK); ctx.restore();
  }
  const sf = P(t, kP + 0.15, kP + 0.4);
  popAt(800, 1290, sf, () => { ctx.rotate(-0.08); card(-170, -44, 340, 88, 22, C.grn, 5, 8); txt('PAISE KAT ✓', 0, 3, SANSB(40), INK); });
}

function sceneList() {
  const n = TL.lines.length - 1;
  return [[0, LS(2), sceneHighway], [LS(2), LS(3), sceneTag], [LS(3), LS(5), sceneReader],
          [LS(5), LS(n) - 0.4, sceneBank], [LS(n) - 0.4, END + 0.4, sceneFollow]];
}
function reelBursts(t) {
  burst(t, CK('toll booth') + 0.7, 420, 1060, [C.red, C.org, C.yel], 24, 1.1);
  burst(t, CK('kat gaye') + 0.1, 540, 470, [C.grn, C.yel, '#ffffff'], 26, 1.3);
  burst(t, CK('BATTERY') + 0.3, 540, 1170, [C.red, C.org, C.yel], 26, 1.2);
  burst(t, CK('tag jaagta') + 0.05, TAGP[0], TAGP[1], [C.yel, '#ffffff', C.cyan], 26, 1.2);
  burst(t, CK('paise kat') + 0.15, 800, 1290, [C.grn, C.yel, '#ffffff'], 26, 1.3);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

(async () => {
  if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r));
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?₹•·≈↑✓…')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
