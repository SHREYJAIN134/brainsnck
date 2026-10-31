// "Google Maps ko traffic kaise pata chalta hai?" — 1080x1920, synced to window.TL
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
const PH = [290, 1040], PHS = 0.58, SRV = [540, 470];
function sceneData(t) {
  const t0 = LS(4);
  // road with a few cars (what Maps does NOT look at)
  const ra = win(t, t0, LS(5) + 0.3, 0.3, 0.4);
  if (ra > 0) {
    ctx.save(); ctx.globalAlpha *= ra;
    ctx.fillStyle = C.road; ctx.fillRect(0, 1140, W, 150);
    ctx.setLineDash([40, 30]); ctx.lineDashOffset = -t * 120; ctx.strokeStyle = '#3b5a99'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 1215); ctx.lineTo(W, 1215); ctx.stroke(); ctx.setLineDash([]);
    for (let k = 0; k < 4; k++) { const x = ((k * 300 + t * 140) % 1300) - 110; rr(x, k % 2 ? 1235 : 1160, 90, 40, 10); ctx.fillStyle = ['#5f7bbd', '#c9d3ea', '#7f8fb3', '#4c8dff'][k]; ctx.fill(); }
    txt('SADAK', 980, 1112, `700 24px ${MONO}`, C.mute, 'right');
    ctx.restore();
  }
  // eye -> becomes the server
  const ea = Math.min(P(t, t0, t0 + 0.35), 1 - P(t, LS(6) - 0.1, LS(6) + 0.25));
  const toPhone = eio(P(t, LS(5), LS(5) + 0.4));
  const sightTo = [L(540, PH[0] + 30, toPhone), L(1130, PH[1] - 240, toPhone)];
  if (ea > 0) {
    ctx.save(); ctx.globalAlpha *= ea;
    const sl = eo(P(t, t0 + 0.3, t0 + 0.9));
    const nahi = CK('sadak ko nahi') + 0.35;
    const bad = t >= nahi && t < LS(5);
    if (sl > 0) {
      ctx.save(); ctx.globalAlpha *= bad ? 0.5 : 1;
      line(polyPart([[540, 600], sightTo], toPhone > 0 ? 1 : sl), toPhone > 0.5 ? C.grn : (bad ? C.red : C.cyan), 6, [16, 14]);
      ctx.restore();
    }
    const look = [L(0, -40, toPhone) * 1, L(22, 26, 1)];
    eye(540, 520, 1, look, toPhone > 0.5 ? C.grn : C.cyan);
    txt('GOOGLE MAPS', 540, 640, `700 26px ${MONO}`, C.mute);
    // red cross on the road sight line
    const xf = P(t, nahi, nahi + 0.2) * (1 - P(t, LS(5), LS(5) + 0.2));
    if (xf > 0) {
      ctx.save(); ctx.translate(540, 880); const s = back(xf); ctx.scale(s, s);
      ctx.beginPath(); ctx.arc(0, 0, 54, 0, 7); glassFill(C.red, 5);
      line([[-22, -22], [22, 22]], C.red, 10); line([[22, -22], [-22, 22]], C.red, 10); ctx.restore();
    }
    // green tick at the phone
    const ok = P(t, CK('wo tumhare') + 0.9, CK('wo tumhare') + 1.1);
    if (ok > 0) {
      const mx = L(540, sightTo[0], 0.5), my = L(600, sightTo[1], 0.5);
      ctx.save(); ctx.translate(mx, my); const s = back(ok); ctx.scale(s, s);
      ctx.beginPath(); ctx.arc(0, 0, 50, 0, 7); glassFill(C.grn, 5);
      line([[-22, 2], [-6, 18], [24, -16]], C.grn, 10); ctx.restore();
    }
    ctx.restore();
  }
  // phone
  const pa = P(t, LS(5), LS(5) + 0.45);
  if (pa > 0) {
    const px = L(-250, PH[0], eo(pa));
    const locOn = CK('Location on') + 0.35;
    phoneBody(px, PH[1], PHS, () => {
      txt('Location', -60, -290, `700 34px ${SANS}`, C.text, 'center');
      const on = eio(P(t, locOn, locOn + 0.25));
      rr(70, -315, 96, 52, 26); ctx.fillStyle = on > 0.5 ? C.grn : '#2a3a63'; ctx.fill();
      ctx.beginPath(); ctx.arc(L(96, 140, on), -289, 21, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      // mini map + pulsing pin
      rr(-150, -220, 300, 330, 24); ctx.fillStyle = '#10234d'; ctx.fill();
      ctx.strokeStyle = C.road; ctx.lineWidth = 16;
      line([[-150, -60], [150, -60]], C.road, 18); line([[-40, -220], [-40, 110]], C.road, 14); line([[80, -220], [80, 110]], C.road, 14);
      const pulse = (t * 1.2) % 1;
      ctx.beginPath(); ctx.arc(-40, -60, 20 + 70 * pulse, 0, 7); ctx.strokeStyle = `rgba(76,141,255,${0.8 * (1 - pulse)})`; ctx.lineWidth = 6; ctx.stroke();
      ctx.beginPath(); ctx.arc(-40, -60, 20, 0, 7); ctx.fillStyle = C.blue; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke();
      txt('YOU', -40, -12, `700 24px ${MONO}`, C.text);
      txt(on > 0.5 ? 'sharing location...' : 'location off', 0, 190, `500 26px ${MONO}`, on > 0.5 ? C.grn : C.dim);
    });
  }
  // server
  const sa = P(t, LS(6) - 0.05, LS(6) + 0.35);
  if (sa > 0) {
    ctx.save(); ctx.translate(SRV[0], SRV[1]); const s = back(sa); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, sa * 3);
    rr(-210, -80, 420, 160, 26); ctx.fillStyle = C.box; ctx.fill();
    const got = t > CK('toh tumhara') + 0.8 ? 0.6 + 0.4 * Math.sin(t * 10) : 0;
    ctx.save(); ctx.shadowColor = C.cyan; ctx.shadowBlur = 30 * got; ctx.lineWidth = 4; ctx.strokeStyle = got ? C.cyan : C.boxLine; ctx.stroke(); ctx.restore();
    pin(-140, 34, 0.9, C.red);
    txt('GOOGLE', 40, -24, `800 44px ${SANS}`, C.text);
    txt('traffic servers', 40, 26, `500 24px ${MONO}`, C.mute);
    ctx.restore();
  }
  // data packets phone -> server
  const k0 = CK('toh tumhara');
  if (t > k0 && t < LS(7)) {
    for (let i = 0; i < 40; i++) {
      const st = k0 + i * 0.32; const u = P(t, st, st + 0.9); if (u <= 0 || u >= 1) continue;
      const a = [PH[0] + 20, PH[1] - 250], c = [PH[0] + 40, SRV[1] + 220], b = [SRV[0] - 60, SRV[1] + 80];
      const e = eio(u), x = (1 - e) * (1 - e) * a[0] + 2 * (1 - e) * e * c[0] + e * e * b[0], y = (1 - e) * (1 - e) * a[1] + 2 * (1 - e) * e * c[1] + e * e * b[1];
      ctx.save(); ctx.globalAlpha *= Math.min(1, (1 - u) * 4); ctx.shadowColor = C.cyan; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = i % 3 === 0 ? C.yel : C.cyan; ctx.fill(); ctx.restore();
    }
  }
  // data card
  const ca = P(t, CK('batata rehta') - 0.1, CK('batata rehta') + 0.25);
  if (ca > 0) {
    ctx.save(); ctx.globalAlpha *= Math.min(1, ca * 2); ctx.translate(L(60, 0, eo(ca)), 0);
    const x0 = 550, y0 = 830;
    rr(x0, y0, 450, 400, 26); glassFill(C.boxLine, 3);
    txt('PHONE → GOOGLE', x0 + 30, y0 + 46, `700 26px ${MONO}`, C.mute, 'left');
    ctx.fillStyle = C.blockLine; ctx.fillRect(x0 + 30, y0 + 76, 390, 2);
    const rows = [
      [CK('ki tum kahan'), 'KAHAN', '28.61°N 77.21°E', C.cyan],
      [CK('aur kitni speed'), 'SPEED', `${Math.round(L(0, 38, eo(P(t, CK('aur kitni speed'), CK('aur kitni speed') + 0.6))))} km/h`, C.yel],
      [CK('chal rahe ho'), 'TIME', `09:41:${String(7 + Math.floor(Math.max(0, t - CK('chal rahe ho')))).padStart(2, '0')}`, C.text],
    ];
    rows.forEach(([st, k, v, col], i) => {
      const f = P(t, st, st + 0.25); if (f <= 0) return;
      ctx.save(); ctx.globalAlpha *= f; ctx.translate(L(-20, 0, eo(f)), 0);
      txt(k, x0 + 30, y0 + 130 + i * 92, `500 24px ${MONO}`, C.mute, 'left');
      txt(v, x0 + 30, y0 + 168 + i * 92, `700 32px ${MONO}`, col, 'left');
      ctx.restore();
    });
    ctx.restore();
  }
}

// ---------- green vs red road ----------
function vel(t) {           // px/s of traffic in the road scene
  const a = LS(8);
  return t < a ? 620 : L(620, 45, eio(P(t, a, a + 0.7)));
}
function offsetAt(t) {      // integral of vel from LS(7)
  const a = LS(8), t0 = LS(7);
  if (t <= a) return 620 * (t - t0);
  const base = 620 * (a - t0); const d = Math.min(t, a + 0.7) - a;
  let x = base; const steps = 20; for (let i = 0; i < steps; i++) { const tt = a + d * (i + .5) / steps; x += vel(tt) * d / steps; }
  if (t > a + 0.7) x += 45 * (t - a - 0.7);
  return x;
}
function sceneRoad(t) {
  const t0 = LS(7), off = offsetAt(t);
  const yT = 880, yB = 1240;
  ctx.fillStyle = C.road; ctx.fillRect(0, yT, W, yB - yT);
  ctx.strokeStyle = C.roadEdge; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(0, yT); ctx.lineTo(W, yT); ctx.moveTo(0, yB); ctx.lineTo(W, yB); ctx.stroke();
  ctx.setLineDash([50, 40]); ctx.lineDashOffset = -off; ctx.strokeStyle = '#3b5a99'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(0, 1060); ctx.lineTo(W, 1060); ctx.stroke(); ctx.setLineDash([]);
  // tint
  const g = P(t, CK('Sadak green'), CK('Sadak green') + 0.3) * (1 - P(t, LS(8), LS(8) + 0.4));
  const r = P(t, CK('Sadak laal'), CK('Sadak laal') + 0.3);
  for (const [a, col] of [[g, '54,224,139'], [r, '255,77,94']]) {
    if (a <= 0) continue;
    ctx.fillStyle = `rgba(${col},${0.16 * a})`; ctx.fillRect(0, yT, W, yB - yT);
    ctx.save(); ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 30 * a; ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, yT); ctx.lineTo(W, yT); ctx.moveTo(0, yB); ctx.lineTo(W, yB); ctx.stroke(); ctx.restore();
  }
  // cars: sparse (fast) and dense (slow) patterns, cross-faded
  const dense = P(t, LS(8), LS(8) + 0.5);
  const pats = [[1 - dense, 230, 6], [dense, 104, 12]];
  for (const [a, sp, n] of pats) {
    if (a <= 0) continue;
    ctx.save(); ctx.globalAlpha *= a;
    for (const [lane, ly, lo] of [[0, 970, 0], [1, 1150, 117]]) {
      for (let k = 0; k < n; k++) {
        const per = sp * n;
        let x = ((k * sp + lo + off * (lane ? 0.92 : 1)) % per + per) % per - 120;
        if (x > W + 20) continue;
        rr(x, ly - 24, 96, 48, 12); ctx.fillStyle = ['#5f7bbd', '#c9d3ea', '#7f8fb3', '#4c8dff', '#9aa9cc'][(k + lane) % 5]; ctx.fill();
        rr(x + 58, ly - 18, 22, 36, 6); ctx.fillStyle = 'rgba(10,20,48,0.8)'; ctx.fill();
        // phone glow on each car
        ctx.save(); ctx.shadowColor = C.cyan; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(x + 32, ly, 7, 0, 7); ctx.fillStyle = C.cyan; ctx.fill(); ctx.restore();
      }
    }
    ctx.restore();
  }
  // labels
  chip(540, 760, 'HAZAARON PHONES', C.cyan, P(t, t0 + 0.1, t0 + 0.4), { size: 30, h: 66 });
  const sf = P(t, CK('Sab tez'), CK('Sab tez') + 0.3);
  if (sf > 0) {
    const v = Math.round(L(62, 6, eio(P(t, LS(8), LS(8) + 0.8))));
    const col = t >= CK('Sadak laal') ? C.red : (t >= CK('Sadak green') ? C.grn : C.yel);
    chip(540, 1345, `AVG SPEED  ${v} km/h`, col, sf, { size: 30, h: 66 });
  }
  const lab = (s, label, col) => { const f = P(t, s, s + 0.25); if (f > 0) chip(540, 1060, label, col, f, { size: 52, h: 96, fill: 'rgba(10,20,48,0.92)' }); };
  if (t < LS(8)) lab(CK('Sadak green'), 'GREEN', C.grn); else lab(CK('Sadak laal'), 'LAAL', C.red);
}

// ---------- map scene, second part ----------
const RA = [80, MAIN_Y], RB = [1000, MAIN_Y];
const ROUTE_OLD = [RA, RB];
const ROUTE_NEW = [RA, [220, MAIN_Y], [220, UP_Y], [860, UP_Y], [860, MAIN_Y], RB];
function sceneMap2(t) {
  cityMap();
  const cx = cartX2(t);
  const red = eo(P(t, CK('paidal') - 0.2, CK('yahan bhayankar') + 0.3));
  traffic(1, cx - 40 - 260 * red, cx + 70 + 40 * red);
  // route
  const r1 = P(t, LS(11), LS(11) + 0.6), rn = CK('doosra raasta');
  if (r1 > 0) {
    const fadeOld = P(t, rn, rn + 0.4);
    ctx.save(); ctx.globalAlpha *= 1 - 0.75 * fadeOld;
    line(polyPart(ROUTE_OLD, eo(r1)), fadeOld > 0 ? '#6b7a99' : C.blue, 12, fadeOld > 0 ? [18, 16] : null);
    ctx.restore();
    const nf = eio(P(t, rn, rn + 0.9));
    if (nf > 0) {
      ctx.save(); ctx.shadowColor = C.blue; ctx.shadowBlur = 20;
      line(polyPart(ROUTE_NEW, nf), '#9cc2ff', 20); line(polyPart(ROUTE_NEW, nf), C.blue, 12); ctx.restore();
      // a car following the new route
      const cf = P(t, rn + 0.9, LE(11) + 0.4);
      if (cf > 0 && cf < 1) { const p = polyPart(ROUTE_NEW, eio(cf)).pop(); ctx.beginPath(); ctx.arc(p[0], p[1], 15, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.blue; ctx.stroke(); }
      chip(540, UP_Y - 70, 'NAYA RAASTA', C.blue, P(t, rn + 0.4, rn + 0.7), { size: 28 });
    }
    pin(RA[0], RA[1] - 6, 0.8, C.grn); pin(RB[0], RB[1] - 6, 0.8, C.red);
    txt('A', RA[0], RA[1] - 92, `800 30px ${SANS}`, C.text); txt('B', RB[0], RB[1] - 92, `800 30px ${SANS}`, C.text);
  }
  cart(cx, MAIN_Y, t, 21);
  const sp = P(t, CK('paidal'), CK('paidal') + 0.3);
  chip(Math.max(200, cx), MAIN_Y - 105, sp > 0 ? '99 PHONES · 4 km/h' : '99 PHONES', C.yel, P(t, LS(9) + 0.2, LS(9) + 0.5), { size: 26 });
  // JAM alert
  const ja = CK('yahan bhayankar') + 0.15, jf = P(t, ja, ja + 0.3) * (1 - P(t, LS(11) - 0.1, LS(11) + 0.2));
  if (jf > 0) {
    const sh = Math.sin(t * 80) * 8 * (1 - P(t, ja, ja + 0.5));
    ctx.save(); ctx.translate(540 + sh, 790); const s = back(jf); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, jf * 3);
    ctx.shadowColor = C.red; ctx.shadowBlur = 40;
    rr(-250, -70, 500, 140, 26); glassFill(C.red, 5); ctx.shadowBlur = 0;
    warnIcon(-180, -2, 1.2, C.red);
    txt('JAM!', 40, -20, `800 56px ${SANS}`, C.red);
    txt('(sach me sadak khaali hai)', 40, 34, `500 21px ${MONO}`, C.mute);
    ctx.restore();
  }
  // summary card
  const sf = P(t, LS(12) - 0.05, LS(12) + 0.3);
  if (sf > 0) {
    ctx.fillStyle = `rgba(4,9,24,${0.75 * sf})`; ctx.fillRect(0, 300, W, 1130);
    ctx.save(); ctx.globalAlpha *= sf; ctx.translate(540, L(890, 860, eo(sf)));
    txt('Phones ki speed', 0, -60, `800 76px ${SANS}`, C.text);
    txt('= sadak ka rang', 0, 40, `800 76px ${SANS}`, C.yel);
    const dots = [[C.grn, 'tez'], [C.org, 'dheema'], [C.red, 'ruka']];
    dots.forEach(([col, l], i) => { const x = -230 + i * 230; ctx.beginPath(); ctx.arc(x - 50, 150, 14, 0, 7); ctx.fillStyle = col; ctx.fill(); txt(l, x + 20, 151, `500 28px ${MONO}`, C.mute); });
    ctx.restore();
  }
}

// ---------- CTA: chat with the friend ----------
function sceneCTA(t) {
  const t0 = LS(13);
  const pa = P(t, t0, t0 + 0.4);
  ctx.save(); ctx.globalAlpha *= Math.min(1, pa * 2);
  phoneBody(540, 880, L(0.85, 0.95, back(pa)), () => {
    rr(-182, -372, 364, 120, 0); ctx.fillStyle = '#12224b'; ctx.fill();
    ctx.beginPath(); ctx.arc(-120, -300, 30, 0, 7); ctx.fillStyle = '#2f4f8f'; ctx.fill(); txt('D', -120, -298, `800 30px ${SANS}`, C.yel);
    txt('Dost', -70, -312, `700 32px ${SANS}`, C.text, 'left'); txt('online', -70, -276, `500 20px ${MONO}`, C.grn, 'left');
    const bub = (y, text, right, f, col, tc) => {
      if (f <= 0) return; ctx.save(); ctx.globalAlpha *= Math.min(1, f * 3); ctx.font = `600 28px ${SANS}`;
      const lines = text.split('\n'); const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 44; const h = 26 + lines.length * 40;
      const x = right ? 160 - w : -160; ctx.translate(0, L(20, 0, eo(f)));
      rr(x, y, w, h, 22); ctx.fillStyle = col; ctx.fill();
      lines.forEach((l, i) => txt(l, x + 22, y + 33 + i * 40, `600 28px ${SANS}`, tc, 'left'));
      ctx.restore();
    };
    bub(-200, 'kahan hai bhai??', true, P(t, t0 + 0.3, t0 + 0.6), C.yel, '#0a1430');
    const typing = t > CK('jo hamesha') && t < CK('"bas 5');
    if (typing) { rr(-160, -90, 120, 60, 22); ctx.fillStyle = '#22356a'; ctx.fill(); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-128 + i * 28, -60 + Math.sin(t * 10 + i) * 5, 8, 0, 7); ctx.fillStyle = C.mute; ctx.fill(); } }
    bub(-90, 'bas 5 min me\npahunch raha hoon!', false, P(t, CK('"bas 5'), CK('"bas 5') + 0.3), '#22356a', C.text);
    bub(60, 'live location bhej', true, P(t, CK('"bas 5') + 0.7, CK('"bas 5') + 1.0), C.yel, '#0a1430');
  });
  ctx.restore();
  // the punchline: Maps ETA
  const ef = P(t, CK('"bas 5') + 1.15, CK('"bas 5') + 1.45);
  if (ef > 0) {
    ctx.save(); ctx.translate(540, 1345); const s = back(ef); ctx.scale(s, s);
    rr(-250, -48, 500, 96, 48); glassFill(C.red, 4);
    pin(-190, 30, 0.75, C.red);
    txt('Maps ETA: 42 min', 30, 2, `700 36px ${MONO}`, C.red);
    ctx.restore();
  }
  // share hint
  chip(540, 380, 'IS DOST KO BHEJO', C.yel, P(t, t0 + 0.2, t0 + 0.5), { size: 28 });
}

// ---------- captions ----------
function captions(t) {
  const ch = TL.chunks;
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i]; const e = Math.min(c.e, END);
    if (t < c.s || t >= e) continue;
    const f = P(t, c.s, c.s + 0.14);
    const sc = L(0.8, 1, back(f));
    ctx.font = `800 80px ${SANS}`;
    const parts = []; const idx = c.kw ? c.text.indexOf(c.kw) : -1;
    if (idx >= 0) {
      if (idx > 0) parts.push([c.text.slice(0, idx), 0]);
      parts.push([c.kw, 1]);
      if (idx + c.kw.length < c.text.length) parts.push([c.text.slice(idx + c.kw.length), 0]);
    } else parts.push([c.text, 0]);
    const ws = parts.map(p => ctx.measureText(p[0]).width); const tot = ws.reduce((a, b) => a + b, 0);
    const fit = Math.min(1, 940 / tot);
    ctx.save(); ctx.translate(540, 1510); ctx.scale(sc * fit, sc * fit); ctx.globalAlpha = Math.min(1, f * 2.5);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    let x = -tot / 2;
    const kc = { y: C.yel, g: C.grn, r: C.red }[c.col] || C.yel;
    parts.forEach((p, k) => {
      ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(3,8,22,0.9)'; ctx.strokeText(p[0], x, 0);
      ctx.fillStyle = p[1] ? kc : '#ffffff'; ctx.fillText(p[0], x, 0); x += ws[k];
    });
    ctx.restore();
  }
}

// ---------- end card ----------
function endCard(t) {
  const o = P(t, END, END + 0.3); if (o <= 0) return;
  ctx.fillStyle = `rgba(4,9,24,${0.97 * o})`; ctx.fillRect(0, 0, W, H);
  const c = P(t, END + 0.1, END + 0.45); if (c <= 0) return;
  ctx.save(); ctx.globalAlpha = c; ctx.translate(0, L(40, 0, eo(c)));
  txt('Roz ek', 540, 820, `800 80px ${SANS}`, C.text);
  txt('"ye kaise hota hai?"', 540, 925, `800 76px ${SANS}`, C.yel);
  const pf = back(P(t, END + 0.4, END + 0.7));
  ctx.translate(540, 1090); ctx.scale(pf, pf);
  rr(-230, -42, 460, 84, 42); ctx.fillStyle = 'rgba(255,201,64,0.12)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.yel; ctx.stroke();
  txt('Follow @brainsnck', 0, 2, `700 34px ${MONO}`, C.text);
  ctx.restore();
}

// ---------- frame ----------
function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.setLineDash([]);
  background(t);
  vignette();
  header(t);
  const scenes = [
    [0, LS(4), sceneMap1],
    [LS(4), LS(7), sceneData],
    [LS(7), LS(9), sceneRoad],
    [LS(9), LS(13), sceneMap2],
    [LS(13), END + 0.4, sceneCTA],
  ];
  scenes.forEach(([a, b, fn], i) => {
    const fi = i === 0 ? 0.001 : 0.35, fo = i === scenes.length - 1 ? 0.001 : 0.35;
    const al = win(t, a - (i ? 0.2 : 0), b + 0.15, fi, fo);
    if (al <= 0) return;
    ctx.save(); ctx.globalAlpha = al;
    const z = L(1.04, 1, eo(P(t, a - 0.2, a + 0.4)));
    ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
    fn(t);
    ctx.restore();
  });
  captions(t);
  endCard(t);
}
window.draw = draw;

(async () => {
  const fonts = [`800 80px Poppins`, `600 28px Poppins`, `500 30px "JetBrains Mono"`, `700 30px "JetBrains Mono"`];
  await Promise.all(fonts.map(f => document.fonts.load(f, 'Aa°→?')));
  await document.fonts.ready;
  draw(0);
  window.ready = true;
})();
