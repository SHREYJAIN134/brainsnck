// "Muscle kaise banta hai?" — Howzat Tech soft-flat style, 1080x1920, synced to window.TL
const W = 1080, H = 1920;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
window.cv = cv;
const MONO = '"JetBrains Mono", monospace';
const SANS = 'Poppins, sans-serif';
const BG = '#5a4e8c';     // dusty purple
const INK = '#0d0a26';
const C = {
  box: '#2e2757', text: '#ffffff', mute: '#e4def7', dim: '#bdb3e3',
  yel: '#ffd166', grn: '#7bd389', red: '#ef6f6c', org: '#f6a465', cyan: '#7cc8e8', blue: '#9fb3ff', pink: '#f48fb1', purple: '#b8a4f0',
  muscle: '#e8707a', muscleD: '#c44f5c', fibre: '#f39aa1'
};
const POP = [C.pink, C.yel, C.cyan, C.grn, C.org, C.purple];

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const P = (t, a, b) => clamp((t - a) / (b - a));
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const L = (a, b, x) => a + (b - a) * x;
const hash = (i, j) => { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); };
const TL = window.TL;
const LS = i => TL.lines[i].s, LE = i => TL.lines[i].e;
const CK = p => { const c = TL.chunks.find(c => c.text.startsWith(p)); if (!c) throw new Error('chunk ' + p); return c.s; };
const CKE = p => TL.chunks.find(c => c.text.startsWith(p)).e;
const END = TL.chunks[TL.chunks.length - 1].e + 0.5;   // end card start
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function txt(s, x, y, font, color, align = 'center') { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function hardShadow(x, y, w, h, r, d = 8) { rr(x + d, y + d, w, h, r); ctx.fillStyle = INK; ctx.fill(); }
// flat card with ink outline + hard shadow
function card(x, y, w, h, r = 36, fill = C.box, d = 12) {
  hardShadow(x, y, w, h, r, d); rr(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
}
function chip(x, y, label, col, f, opts = {}) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); const s = back(f); ctx.scale(s, s); ctx.rotate(opts.rot || 0); ctx.globalAlpha *= Math.min(1, f * 3);
  const size = opts.size || 30; ctx.font = `700 ${size}px ${MONO}`;
  const w = ctx.measureText(label).width + (opts.pad || 52), h = opts.h || size * 2.1;
  hardShadow(-w / 2, -h / 2, w, h, h / 2, 6);
  rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt(label, 0, 2, `700 ${size}px ${MONO}`, INK);
  ctx.restore();
}
function bigPill(s, x, y, col, f, size = 78, rot = -0.035) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const k = back(f); ctx.scale(k, k);
  ctx.font = `800 ${size}px ${SANS}`; const w = ctx.measureText(s).width + size * 0.7, h = size * 1.55;
  hardShadow(-w / 2, -h / 2, w, h, size * 0.38, 10);
  rr(-w / 2, -h / 2, w, h, size * 0.38); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  txt(s, 0, size * 0.07, `800 ${size}px ${SANS}`, INK); ctx.restore();
}
function outlineText(s, x, y, size, col = '#fff', align = 'center', lw = 14) {
  ctx.font = `800 ${size}px ${SANS}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function source(s, a = 1) { ctx.save(); ctx.globalAlpha *= a; txt(s, W / 2, 1395, `600 24px ${SANS}`, 'rgba(255,255,255,0.72)'); ctx.restore(); }

// ---------- icons (flat, ink outline) ----------
function dumbbell(x, y, s, col = C.cyan, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.lineWidth = Math.max(4, s * 0.045); ctx.strokeStyle = INK;
  const part = (px, py, w, h, r, c) => { rr(px + s * 0.03, py + s * 0.03, w, h, r); ctx.fillStyle = INK; ctx.fill(); rr(px, py, w, h, r); ctx.fillStyle = c; ctx.fill(); ctx.stroke(); };
  part(-s * 0.5, -s * 0.06, s, s * 0.12, s * 0.05, '#e9e6f5');
  for (const d of [-1, 1]) { part(d * s * 0.36 - s * 0.09, -s * 0.3, s * 0.18, s * 0.6, s * 0.06, col); part(d * s * 0.56 - s * 0.06, -s * 0.2, s * 0.12, s * 0.4, s * 0.05, col); }
  ctx.restore();
}
function moon(x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(6, 6, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(r * 0.45, -r * 0.3, r * 0.85, 0, 7); ctx.fillStyle = C.box; ctx.fill();
  ctx.restore();
}
function stamp(s, x, y, col, f, size = 64) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.18); const k = L(2.2, 1, eo(f)); ctx.scale(k, k); ctx.globalAlpha *= clamp(f * 3);
  ctx.font = `800 ${size}px ${SANS}`; const w = ctx.measureText(s).width + size * 0.6, h = size * 1.4;
  rr(-w / 2, -h / 2, w, h, 14); ctx.lineWidth = 8; ctx.strokeStyle = col; ctx.stroke();
  txt(s, 0, size * 0.06, `800 ${size}px ${SANS}`, col); ctx.restore();
}
function tick(x, y, r, f) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); const k = back(f); ctx.scale(k, k);
  ctx.beginPath(); ctx.arc(5, 5, r, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = C.grn; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineWidth = r * 0.22; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-r * 0.45, 0); ctx.lineTo(-r * 0.1, r * 0.35); ctx.lineTo(r * 0.5, -r * 0.35); ctx.stroke();
  ctx.restore();
}
// a muscle fibre as a capsule with stripes; thick = width multiplier, wob = wiggle
function fibre(x, y, len, th, t, wob = 0, col = C.fibre) {
  ctx.save(); ctx.translate(x, y);
  const h = th, w = len;
  rr(-w / 2 + 6, -h / 2 + 6, w, h, h / 2); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath();
  const n = 24;
  for (let i = 0; i <= n; i++) { const px = -w / 2 + w * i / n, py = -h / 2 + Math.sin(i * 1.3 + t * 30) * wob; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.arc(w / 2 - h / 2, 0, h / 2, -Math.PI / 2, Math.PI / 2);
  for (let i = n; i >= 0; i--) { const px = -w / 2 + w * i / n, py = h / 2 + Math.sin(i * 1.3 + t * 30 + 1) * wob; ctx.lineTo(px, py); }
  ctx.arc(-w / 2 + h / 2, 0, h / 2, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(13,10,38,0.25)'; ctx.lineWidth = 3;
  for (let k = -w / 2 + 30; k < w / 2; k += 34) { ctx.beginPath(); ctx.moveTo(k, -h); ctx.lineTo(k, h); ctx.stroke(); }
  ctx.restore(); ctx.restore();
}
function arrow(x1, y1, x2, y2, col, w = 14) {
  const a = Math.atan2(y2 - y1, x2 - x1), hl = w * 2.6;
  ctx.save(); ctx.lineCap = 'round';
  for (const [c, lw, d] of [[INK, w + 8, 4], [col, w, 0]]) {
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x1 + d, y1 + d); ctx.lineTo(x2 - Math.cos(a) * hl * 0.6 + d, y2 - Math.sin(a) * hl * 0.6 + d); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2 + d, y2 + d); ctx.lineTo(x2 - Math.cos(a - 0.5) * hl + d, y2 - Math.sin(a - 0.5) * hl + d); ctx.lineTo(x2 - Math.cos(a + 0.5) * hl + d, y2 - Math.sin(a + 0.5) * hl + d); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// ---------- header (Howzat) ----------
function header(t) {
  ctx.font = `700 24px ${MONO}`; const bw = ctx.measureText('HOWZAT TECH').width + 40;
  hardShadow(70, 160, bw, 52, 26, 5);
  rr(70, 160, bw, 52, 26); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  txt('HOWZAT TECH', 70 + bw / 2, 187, `700 24px ${MONO}`, INK);
  txt('Muscle growth', 70 + bw + 22, 188, `800 34px ${SANS}`, '#ffffff', 'left');
  txt('@howzat.tech', W - 70, 188, `500 26px ${MONO}`, 'rgba(255,255,255,0.8)', 'right');
  const steps = [[0, 'GYM KE BAAD'], [LS(1), 'TENSION'], [LS(2), 'mTOR SWITCH'], [LS(3), '48 GHANTE'], [LS(4), 'FIBRE MOTA'], [LS(5), 'PROTEIN'], [LS(6), 'HAR HAFTE +1'], [LS(7), 'SHARE KARO']];
  let cur = steps[0], k = 0; steps.forEach((s, i) => { if (t >= s[0]) { cur = s; k = i; } });
  const n = Math.max(0, Math.floor((t - cur[0]) * 40));
  ctx.beginPath(); ctx.arc(80, 252, 7, 0, 7); ctx.fillStyle = POP[k % POP.length]; ctx.fill();
  txt(`0${k + 1} · ` + cur[1].slice(0, n), 100, 253, `600 26px ${MONO}`, 'rgba(255,255,255,0.85)', 'left');
}

// ---------- scenes ----------
function sHook(t) {
  const t0 = 0, tb = CK('gym ke BAAD');
  // left card: GYM ME
  const a1 = P(t, t0, t0 + 0.4);
  ctx.save(); ctx.translate(300, 760); const k1 = back(a1); ctx.scale(k1, k1); ctx.rotate(-0.04);
  card(-200, -260, 400, 520, 40, C.box);
  dumbbell(0, -60, 230, C.cyan, Math.sin(t * 8) * 0.12);
  outlineText('GYM ME', 0, 150, 56, '#fff');
  ctx.restore();
  stamp('NAHI', 300, 740, C.red, P(t, CK('Muscle gym') + 0.55, CK('Muscle gym') + 0.85), 70);
  // right card: GYM KE BAAD
  const a2 = P(t, tb - 0.1, tb + 0.35);
  if (a2 > 0) {
    ctx.save(); ctx.translate(790, 760); const k2 = back(a2); ctx.scale(k2, k2); ctx.rotate(0.04);
    card(-200, -260, 400, 520, 40, C.box);
    moon(-70, -150, 52);
    // growing biceps (flat flexed arm)
    const g = 1 + 0.25 * eio(P(t, tb + 0.3, tb + 1.1)) + Math.sin(t * 6) * 0.02;
    ctx.save(); ctx.translate(20, 20);
    ctx.lineJoin = 'round';
    const armPath = () => { ctx.beginPath(); ctx.moveTo(-120, 70); ctx.lineTo(10, 70); ctx.quadraticCurveTo(70, 70, 80, 10); ctx.lineTo(95, -95); ctx.lineTo(55, -105); ctx.lineTo(40, -20); ctx.lineTo(-120, 0); ctx.closePath(); };
    ctx.save(); ctx.translate(6, 6); armPath(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
    armPath(); ctx.fillStyle = '#f2c6a0'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.translate(-40, 2); ctx.scale(g, g);
    ctx.beginPath(); ctx.ellipse(4, 4, 62, 40, -0.15, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 40, -0.15, 0, 7); ctx.fillStyle = C.muscle; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(75, -112, 30, 0, 7); ctx.fillStyle = '#f2c6a0'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
    outlineText('GYM KE BAAD', 0, 150, 48, C.yel);
    ctx.restore();
    tick(930, 560, 46, P(t, tb + 0.6, tb + 0.9));
  }
  // zZz floating
  if (a2 > 0) for (let i = 0; i < 3; i++) { const u = ((t - tb) * 0.7 + i / 3) % 1; ctx.save(); ctx.globalAlpha = a2 * (1 - u); txt('z', 690 + i * 18, 560 - u * 120, `800 ${40 + i * 10}px ${SANS}`, '#fff'); ctx.restore(); }
}

function sTension(t) {
  const L1 = LS(1), tt = CK('fibres pe tension');
  const a = P(t, L1, L1 + 0.45);
  ctx.save(); const k = back(a); ctx.translate(540, 800); ctx.scale(k, k); ctx.translate(-540, -800);
  card(90, 430, 900, 760, 44, C.box);
  outlineText('MUSCLE FIBRES', 540, 500, 44, C.yel);
  const pull = eo(P(t, tt + 0.2, tt + 0.6)), wob = pull * 5;
  const stretch = 1 + pull * 0.08 + Math.sin(t * 20) * 0.006 * pull;
  for (let i = 0; i < 5; i++) {
    const y = 640 + i * 100, len = 640 * stretch;
    fibre(540 + Math.sin(i * 2) * 10, y, len, 72, t + i * 0.1, wob);
  }
  if (pull > 0) {
    ctx.save(); ctx.globalAlpha = pull;
    arrow(240, 840, 110, 840, C.red, 16); arrow(840, 840, 970, 840, C.red, 16);
    ctx.restore();
  }
  ctx.restore();
  chip(540, 1260, 'TENSION ↔', C.red, P(t, tt + 0.25, tt + 0.55), { size: 36 });
  dumbbell(540, 1130, 0, C.cyan);
}

function sSensor(t) {
  const L2 = LS(2), ta = CK('isse alarm'), tm = CK('aur mTOR'), ton = CK('on ho jaata');
  const a = P(t, L2, L2 + 0.4);
  ctx.save(); ctx.globalAlpha = a;
  // one fibre, big, with sensors on its edge
  fibre(540, 560, 860, 150, t, 2);
  for (let i = 0; i < 5; i++) {
    const x = 220 + i * 160, f = back(P(t, L2 + 0.15 + i * 0.08, L2 + 0.45 + i * 0.08));
    const lit = t > ta && Math.floor((t - ta) * 6 + i) % 2 === 0;
    ctx.save(); ctx.translate(x, 485); ctx.scale(f, f);
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -46); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, -54, 18, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -58, 18, 0, 7); ctx.fillStyle = lit ? C.red : C.yel; ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  chip(540, 700, 'SENSORS', C.yel, P(t, L2 + 0.2, L2 + 0.5), { size: 26 });
  // alarm bell
  const ab = P(t, ta - 0.05, ta + 0.3);
  if (ab > 0) {
    ctx.save(); ctx.translate(300, 960); const s = back(ab); ctx.scale(s, s); ctx.rotate(Math.sin(t * 28) * 0.18 * (t < tm + 0.3 ? 1 : 0.2));
    const bell = () => { ctx.beginPath(); ctx.moveTo(-70, 50); ctx.quadraticCurveTo(-70, -80, 0, -85); ctx.quadraticCurveTo(70, -80, 70, 50); ctx.lineTo(90, 70); ctx.lineTo(-90, 70); ctx.closePath(); };
    ctx.save(); ctx.translate(7, 7); bell(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
    bell(); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 85, 18, 0, 7); ctx.fillStyle = C.org; ctx.fill(); ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 3; i++) {
      const u = ((t - ta) * 1.6 + i / 3) % 1;
      ctx.save(); ctx.globalAlpha = ab * (1 - u); ctx.strokeStyle = C.red; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(300, 960, 120 + u * 90, -0.6, 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(300, 960, 120 + u * 90, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke(); ctx.restore();
    }
  }
  // mTOR switch
  const sw = P(t, tm - 0.05, tm + 0.3);
  if (sw > 0) {
    const on = eio(P(t, ton, ton + 0.3));
    ctx.save(); ctx.translate(760, 980); const s = back(sw); ctx.scale(s, s);
    card(-170, -80, 340, 160, 80, L(0, 1, on) > 0.5 ? C.grn : '#7d7699', 10);
    const kx = L(-90, 90, on);
    ctx.beginPath(); ctx.arc(kx + 6, 6, 62, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(kx, 0, 62, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    txt(on > 0.5 ? 'ON' : 'OFF', kx, 3, `800 34px ${SANS}`, INK);
    ctx.restore();
    outlineText('mTOR', 760, 830, 64, '#fff');
    chip(760, 1135, 'MUSCLE BANAO!', C.grn, P(t, ton + 0.25, ton + 0.55), { size: 26 });
  }
}

function sChart(t) {
  const L3 = LS(3), ts = CK('protein banne'), td = CK('double se'), t2 = CK('aur do din');
  const a = P(t, L3, L3 + 0.4);
  ctx.save(); const k = back(a); ctx.translate(540, 820); ctx.scale(k, k); ctx.translate(-540, -820);
  card(70, 400, 940, 880, 44, C.box);
  outlineText('PROTEIN BANNE KI SPEED', 540, 470, 40, C.yel);
  const bars = [['REST', 100, '#8e86b5', L3 + 0.3], ['3 GHANTE', 212, C.grn, CK('Teen ghante') + 0.2], ['24 GHANTE', 165, C.cyan, t2], ['48 GHANTE', 134, C.cyan, t2 + 0.25]];
  const x0 = 150, bw = 170, gap = 50, y0 = 1130, sc = 2.6;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([14, 12]);
  ctx.beginPath(); ctx.moveTo(120, y0 - 100 * sc); ctx.lineTo(960, y0 - 100 * sc); ctx.stroke(); ctx.setLineDash([]);
  bars.forEach(([lab, v, col, tb], i) => {
    const g = eo(P(t, tb, tb + 0.6)), h = v * sc * g, x = x0 + i * (bw + gap);
    if (g > 0) {
      hardShadow(x, y0 - h, bw, h, 18, 8);
      rr(x, y0 - h, bw, h, 18); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      const pct = i === 0 ? 'base' : '+' + Math.round((v - 100) * g) + '%';
      outlineText(pct, x + bw / 2, y0 - h - 44, 44, '#fff', 'center', 10);
    }
    txt(lab, x + bw / 2, y0 + 44, `700 24px ${MONO}`, '#fff');
  });
  ctx.restore();
  chip(330, 1330, '2× SE ZYADA', C.grn, P(t, td, td + 0.3), { size: 28 });
  chip(760, 1330, '48 GHANTE TAK ↑', C.cyan, P(t, t2 + 0.4, t2 + 0.7), { size: 28 });
  source('Phillips et al. 1997 · Am J Physiol', a);
}

function sThicken(t) {
  const L4 = LS(4), tp = CK('protein jod'), tm = CK('fibres mote');
  const a = P(t, L4, L4 + 0.4);
  const grow = eio(P(t, tp + 0.3, LE(4)));
  const R = L(180, 255, grow);
  ctx.save(); ctx.globalAlpha = a;
  // before ghost
  ctx.setLineDash([16, 14]); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(540, 820, 180, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  // fibre cross-section
  ctx.beginPath(); ctx.arc(552, 832, R, 0, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(540, 820, R, 0, 7); ctx.fillStyle = C.fibre; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  // myofibrils inside (packed dots) — more appear as it grows
  const nIn = Math.floor(L(14, 26, grow));
  for (let i = 0; i < nIn; i++) {
    const ang = i * 2.39996, rad = (R - 40) * Math.sqrt((i + 0.5) / 26);
    ctx.beginPath(); ctx.arc(540 + Math.cos(ang) * rad, 820 + Math.sin(ang) * rad, 22, 0, 7); ctx.fillStyle = C.muscleD; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.restore();
  // protein blocks flying in
  for (let i = 0; i < 12; i++) {
    const st = tp + i * 0.09, u = eio(P(t, st, st + 0.7));
    if (u <= 0 || u >= 1) continue;
    const ang = i * 0.52 + 0.3, sx = 540 + Math.cos(ang) * 620, sy = 820 + Math.sin(ang) * 620;
    const x = L(sx, 540 + Math.cos(ang) * R * 0.8, u), y = L(sy, 820 + Math.sin(ang) * R * 0.8, u);
    ctx.save(); ctx.translate(x, y); ctx.rotate(u * 3 + i);
    rr(-22 + 5, -22 + 5, 44, 44, 10); ctx.fillStyle = INK; ctx.fill();
    rr(-22, -22, 44, 44, 10); ctx.fillStyle = POP[i % POP.length]; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  chip(270, 520, 'PROTEIN', C.grn, P(t, tp, tp + 0.3), { size: 28 });
  chip(540, 1180, 'FIBRE MOTA ↑', C.yel, P(t, tm + 0.2, tm + 0.5), { size: 34 });
  txt('pehle', 540 - 180 - 20, 600, `600 26px ${MONO}`, 'rgba(255,255,255,0.7)', 'right');
}

function sProtein(t) {
  const L5 = LS(5), tb = CK('body weight'), tg = CK('1.6 gram');
  const a = P(t, L5, L5 + 0.4);
  ctx.save(); const k = back(a); ctx.translate(540, 800); ctx.scale(k, k); ctx.translate(-540, -800);
  card(90, 430, 900, 760, 44, C.box);
  outlineText('ROZ KA PROTEIN', 540, 500, 44, C.yel);
  // scale icon
  ctx.save(); ctx.translate(250, 760);
  rr(-110 + 7, -80 + 7, 220, 170, 30); ctx.fillStyle = INK; ctx.fill();
  rr(-110, -80, 220, 170, 30); ctx.fillStyle = '#e9e6f5'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  rr(-62, -48, 124, 56, 10); ctx.fillStyle = C.box; ctx.fill(); ctx.stroke();
  const kg = Math.round(70 * eo(P(t, L5 + 0.2, L5 + 0.8)));
  txt(kg + ' kg', 0, -20, `700 32px ${MONO}`, C.grn);
  ctx.restore();
  txt('body weight', 250, 900, `600 28px ${SANS}`, C.dim);
  // × 1.6 g
  const m = back(P(t, tg - 0.05, tg + 0.3));
  ctx.save(); ctx.translate(540, 760); ctx.scale(m, m); txt('×', 0, -10, `800 90px ${SANS}`, '#fff'); ctx.restore();
  bigPill('1.6 g', 800, 750, C.grn, P(t, tg, tg + 0.35), 72, 0.03);
  ctx.save(); ctx.globalAlpha = P(t, tg + 0.2, tg + 0.5); txt('har kilo pe', 800, 900, `600 28px ${SANS}`, C.dim); ctx.restore();
  // result
  const r = P(t, tg + 0.7, tg + 1.1);
  if (r > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(160, 970); ctx.lineTo(920, 970); ctx.stroke();
    bigPill('= ~112 g / din', 540, 1080, C.yel, r, 64, -0.03);
  }
  ctx.restore();
  source('Morton et al. 2018 · Br J Sports Med (meta-analysis)', a);
}

function sOverload(t) {
  const L6 = LS(6), th = CK('Har hafte'), tr = CK('ek rep'), tw = CK('ya thoda weight'), td = CK('dono chalega');
  const a = P(t, L6, L6 + 0.4);
  // staircase of weeks
  const n = 6, sx = 110, sw = 140, base = 1250, step = 58;
  for (let i = 0; i < n; i++) {
    const f = back(P(t, th + i * 0.1, th + 0.35 + i * 0.1)); if (f <= 0) continue;
    const h = 120 + i * step, x = sx + i * sw;
    ctx.save(); ctx.translate(x + sw / 2, base); ctx.scale(1, f); ctx.translate(-(x + sw / 2), -base);
    hardShadow(x, base - h, sw - 14, h, 18, 8);
    rr(x, base - h, sw - 14, h, 18); ctx.fillStyle = POP[i % POP.length]; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
    txt('W' + (i + 1), x + (sw - 14) / 2, base - 40, `700 30px ${MONO}`, INK);
  }
  // dumbbell climbing
  const climb = eio(P(t, th + 0.3, LE(6) + 0.3)) * (n - 1);
  const ci = Math.floor(climb), cf = climb - ci;
  const bx = sx + (climb) * sw + (sw - 14) / 2, by = base - (120 + climb * step) - 70 - Math.sin(cf * Math.PI) * 50;
  dumbbell(bx, by, 150 * a, C.cyan, Math.sin(t * 6) * 0.1);
  ctx.save(); ctx.globalAlpha = a; outlineText('HAR HAFTE THODA ZYADA', 540, 420, 50, C.yel); ctx.restore();
  bigPill('+1 REP', 300, 600, C.grn, P(t, tr, tr + 0.3), 62, -0.05);
  bigPill('+2.5 KG', 760, 600, C.cyan, P(t, tw + 0.1, tw + 0.4), 62, 0.04);
  tick(430, 545, 34, P(t, td, td + 0.3)); tick(905, 545, 34, P(t, td + 0.12, td + 0.42));
  source('Plotkin et al. 2022 · PeerJ: reps ya weight, dono se growth', a);
}

function sFriend(t) {
  const L7 = LS(7), ts = CK('jo saal bhar'), tw = CK('same weight');
  const a = P(t, L7, L7 + 0.4);
  // calendar flipping months
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const mi = Math.min(11, Math.floor(Math.max(0, t - ts) * 9));
  ctx.save(); ctx.translate(310, 700); const k = back(a); ctx.scale(k, k); ctx.rotate(-0.05);
  card(-170, -170, 340, 340, 34, '#fff');
  rr(-170, -170, 340, 100, [34, 34, 0, 0]); ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke();
  txt(months[mi], 0, -118, `800 50px ${SANS}`, '#fff');
  txt('2026', 0, 40, `800 80px ${SANS}`, INK);
  ctx.restore();
  // same dumbbell, same "10 KG"
  ctx.save(); ctx.globalAlpha = a; dumbbell(780, 680, 260, '#9a93b8', Math.sin(t * 2) * 0.05); ctx.restore();
  bigPill('10 KG', 780, 840, '#e9e6f5', P(t, L7 + 0.2, L7 + 0.5), 52, 0.03);
  // flat growth line
  const g = P(t, ts, ts + 1.2);
  if (g > 0) {
    ctx.save(); ctx.globalAlpha = a;
    card(110, 980, 860, 300, 36, C.box);
    txt('GROWTH', 160, 1030, `700 28px ${MONO}`, C.dim, 'left');
    ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(170, 1190); ctx.lineTo(L(170, 900, g), 1190); ctx.stroke();
    ctx.strokeStyle = C.red; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(170, 1185); ctx.lineTo(L(170, 900, g), 1185); ctx.stroke();
    ctx.restore();
  }
  stamp('SAME!', 760, 1090, C.red, P(t, tw, tw + 0.3), 60);
  // share plane
  ctx.save(); ctx.globalAlpha = a; ctx.translate(900, 420); ctx.rotate(-0.35 + Math.sin(t * 3) * 0.05);
  const pl = () => { ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(60, -45); ctx.lineTo(20, 55); ctx.lineTo(5, 12); ctx.closePath(); };
  ctx.save(); ctx.translate(6, 6); pl(); ctx.fillStyle = INK; ctx.fill(); ctx.restore();
  pl(); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
}

// ---------- sparkle bursts ----------
function burst(t, t0, x, y, cols, n = 22, spread = 1) {
  const dt = t - t0; if (dt < 0 || dt > 0.9) return;
  const u = dt / 0.9;
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2 + hash(k, t0) * 0.6, sp = (160 + 260 * hash(k, 9)) * spread;
    const d = sp * eo(u), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
    const sz = (k % 3 === 0 ? 14 : 8) * (1 - u) + 1;
    ctx.save(); ctx.globalAlpha = 1 - u; ctx.translate(px, py); ctx.rotate(u * 4 + k);
    ctx.fillStyle = cols[k % cols.length];
    if (k % 3 === 0) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? sz * 0.35 : sz; ctx.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); } ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, 0, sz * 0.5, 0, 7); ctx.fill(); }
    ctx.restore();
  }
}
function bursts(t) {
  burst(t, CK('gym ke BAAD') + 0.6, 790, 760, [C.yel, C.grn, '#fff'], 26, 1.3);
  burst(t, CK('fibres pe tension') + 0.3, 540, 840, [C.red, C.org, C.yel], 24, 1.2);
  burst(t, CK('on ho jaata') + 0.05, 760, 980, [C.grn, C.cyan, '#fff'], 28, 1.3);
  burst(t, CK('double se') + 0.05, 400, 700, [C.grn, C.yel, '#fff'], 22);
  burst(t, CK('fibres mote') + 0.2, 540, 820, POP, 30, 1.5);
  burst(t, CK('1.6 gram') + 0.8, 540, 1080, [C.yel, C.grn, '#fff'], 24, 1.2);
  burst(t, CK('dono chalega') + 0.05, 540, 600, POP, 30, 1.4);
  burst(t, CK('same weight') + 0.05, 760, 1090, [C.red, C.org, C.yel], 20);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}
// colour band wipe between scenes
function wipe(t, a) {
  const u = P(t, a - 0.32, a + 0.22); if (u <= 0 || u >= 1) return;
  const x = L(-900, W + 900, eio(u));
  ctx.save(); ctx.translate(x, 960); ctx.rotate(-0.38);
  [[C.pink, -270], [C.yel, -90], [C.cyan, 90]].forEach(([col, x0]) => { ctx.fillStyle = col; ctx.fillRect(x0, -1500, 180, 3000); });
  ctx.restore();
}

// ---------- captions (Howzat): word-by-word pop, keyword in a colour pill ----------
function captions(t) {
  const ch = TL.chunks;
  for (let i = 0; i < ch.length; i++) {
    const c = ch[i]; const e = Math.min(c.e, END);
    if (t < c.s || t >= e) continue;
    const size = 78; ctx.font = `800 ${size}px ${SANS}`;
    const words = c.text.split(' ');
    const ki = c.kw ? c.text.indexOf(c.kw) : -1;
    let pos = 0; const info = words.map(w => { const st = pos; pos += w.length + 1; return { w, kw: ki >= 0 && st >= ki && st < ki + c.kw.length, width: ctx.measureText(w).width }; });
    const sp = ctx.measureText(' ').width + 4, pad = 18;
    let tot = 0; info.forEach((o, k) => { o.x = tot + (o.kw && (k === 0 || !info[k - 1].kw) ? pad : 0); tot = o.x + o.width + (o.kw && (k === info.length - 1 || !info[k + 1].kw) ? pad : 0) + sp; });
    tot -= sp;
    const fit = Math.min(1, 950 / tot);
    const kc = { y: C.yel, g: C.grn, r: C.red }[c.col] || C.yel;
    ctx.save(); ctx.translate(540, 1530); ctx.scale(fit, fit); ctx.translate(-tot / 2, 0);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    const kws = info.filter(o => o.kw);
    if (kws.length) {
      const k0 = info.indexOf(kws[0]); const pt = c.s + k0 * 0.06; const f = P(t, pt, pt + 0.2);
      if (f > 0) {
        const x0 = kws[0].x - pad, x1 = kws[kws.length - 1].x + kws[kws.length - 1].width + pad;
        ctx.save(); ctx.translate((x0 + x1) / 2, 4); ctx.rotate(-0.035); const s = back(f); ctx.scale(s, s);
        hardShadow(-(x1 - x0) / 2, -50, x1 - x0, 104, 26, 8);
        rr(-(x1 - x0) / 2, -50, x1 - x0, 104, 26); ctx.fillStyle = kc; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
      }
    }
    info.forEach((o, k) => {
      const wt = c.s + k * 0.06; const f = P(t, wt, wt + 0.18); if (f <= 0) return;
      const s = L(0.5, 1, back(f));
      ctx.save(); ctx.translate(o.x + o.width / 2, 0); if (o.kw) ctx.rotate(-0.035); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, f * 3);
      if (o.kw) { ctx.fillStyle = INK; ctx.fillText(o.w, -o.width / 2, 4); }
      else { ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.strokeText(o.w, -o.width / 2, 2); ctx.fillStyle = '#ffffff'; ctx.fillText(o.w, -o.width / 2, 2); }
      ctx.restore();
    });
    ctx.restore();
  }
}

// ---------- Howzat end card ----------
const LOGO = new Image(); LOGO.src = window.LOGO_SRC; window.logoOK = false; LOGO.decode().then(() => { window.logoOK = true; });
function endCard(t) {
  const o = P(t, END, END + 0.3); if (o <= 0) return;
  ctx.save(); ctx.globalAlpha = o; ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); ctx.restore();
  const c = P(t, END + 0.1, END + 0.45); if (c <= 0) return;
  ctx.save(); ctx.globalAlpha = c; ctx.translate(0, L(40, 0, eo(c)));
  if (LOGO.complete && LOGO.naturalWidth) {
    const ls = back(P(t, END + 0.1, END + 0.5)), r = 175;
    ctx.save(); ctx.translate(540, 560); ctx.scale(ls, ls); ctx.rotate(Math.sin(t * 2) * 0.02);
    ctx.beginPath(); ctx.arc(10, 10, r + 8, 0, 7); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, 7); ctx.fillStyle = C.yel; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = C.box; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); ctx.drawImage(LOGO, -r, -r, 2 * r, 2 * r); ctx.restore();
  }
  txt('Roz ek', 540, 830, `800 84px ${SANS}`, '#ffffff');
  ctx.save(); ctx.translate(540, 945); ctx.rotate(-0.035);
  ctx.font = `800 78px ${SANS}`; const w = ctx.measureText('"ye kaise hota hai?"').width + 50;
  hardShadow(-w / 2, -62, w, 124, 30, 10);
  rr(-w / 2, -62, w, 124, 30); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
  txt('"ye kaise hota hai?"', 0, 6, `800 78px ${SANS}`, INK); ctx.restore();
  const pf = back(P(t, END + 0.4, END + 0.7));
  ctx.translate(540, 1110); ctx.scale(pf, pf);
  hardShadow(-240, -44, 480, 88, 44, 8);
  rr(-240, -44, 480, 88, 44); ctx.fillStyle = C.pink; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt('Follow @howzat.tech', 0, 3, `700 34px ${MONO}`, INK);
  ctx.restore();
}

// ---------- frame ----------
const win = (t, a, b, fi = .25, fo = .25) => Math.min(P(t, a, a + fi), 1 - P(t, b - fo, b));
function sceneList() {
  return [[0, LS(1), sHook], [LS(1), LS(2), sTension], [LS(2), LS(3), sSensor], [LS(3), LS(4), sChart],
    [LS(4), LS(5), sThicken], [LS(5), LS(6), sProtein], [LS(6), LS(7), sOverload], [LS(7), END + 0.4, sFriend]];
}
function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.setLineDash([]);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  header(t);
  const scenes = sceneList();
  scenes.forEach(([a, b, fn], i) => {
    const fi = i === 0 ? 0.001 : 0.3, fo = i === scenes.length - 1 ? 0.001 : 0.3;
    const al = win(t, a - (i ? 0.15 : 0), b + 0.15, fi, fo);
    if (al <= 0) return;
    ctx.save(); ctx.globalAlpha = al;
    const z = L(1.06, 1, eo(P(t, a - 0.15, a + 0.5)));
    ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
    fn(t);
    ctx.restore();
  });
  bursts(t);
  for (const a of scenes.slice(1).map(s => s[0])) wipe(t, a);
  captions(t);
  endCard(t);
}
window.draw = draw;
document.fonts.ready.then(() => Promise.all([document.fonts.load(`800 40px Poppins`), document.fonts.load(`600 40px Poppins`),
  document.fonts.load(`700 20px "JetBrains Mono"`), document.fonts.load(`500 20px "JetBrains Mono"`)])).then(() => { draw(0); window.ready = true; });
