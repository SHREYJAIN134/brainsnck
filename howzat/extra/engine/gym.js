// Full squat vs half squat — dark "science" look (navy grid, chrome mannequins, red muscles, lime vs purple).
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const W = 1080, H = 1920;
const SANS = 'Inter, sans-serif', MONO = '"JetBrains Mono", monospace';
const C = {
  lime: '#ff8a2a', limeD: '#c2560c', purp: '#4cc3ff', purpD: '#1d78b0', red: '#ff3d5e', redD: '#a3142f',
  txt: '#fbf8f3', dim: 'rgba(240,232,220,0.66)', faint: 'rgba(240,232,220,0.36)', card: 'rgba(38,42,49,0.92)',
  line: 'rgba(255,245,230,0.14)', yel: '#ffd23f'
};
const TL = window.TL;
const ch = TL.chunks;

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const tw = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
const eo = k => 1 - Math.pow(1 - clamp(k), 3);
const eio = k => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const back = k => { k = clamp(k); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const rad = d => d * Math.PI / 180;
const LS = i => TL.lines[i].s, LE = i => TL.lines[i].e;
function CK(p, line) {
  const c = ch.find(c => (line === undefined || c.line === line) && c.text.startsWith(p));
  if (!c) throw new Error('chunk not found: ' + p);
  return c.s;
}
function CKE(p, line) { return ch.find(c => (line === undefined || c.line === line) && c.text.startsWith(p)).e; }

function txt(s, x, y, font, color, align = 'center', spacing = 0) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.letterSpacing = spacing + 'px'; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
}
function mono(s, x, y, size, color, align = 'center', weight = 500) {
  txt(s.toUpperCase(), x, y, `${weight >= 700 ? 800 : 700} ${size * 1.05}px ${SANS}`, color, align, size * 0.09);
}
function tw_(s, size, weight = 500) { ctx.font = `${weight >= 700 ? 800 : 700} ${size * 1.05}px ${SANS}`; ctx.letterSpacing = size * 0.09 + 'px'; const w = ctx.measureText(s.toUpperCase()).width; ctx.letterSpacing = '0px'; return w; }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function chip(s, x, y, color, a = 1, size = 24, fill = 'rgba(14,20,34,0.92)') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const w = tw_(s, size, 700) + size * 1.4, h = size * 2.0;
  const sc = lerp(0.85, 1, back(a));
  ctx.translate(x, y); ctx.scale(sc, sc);
  rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = color; ctx.fill();
  mono(s, 0, 2, size, '#16181c', 'center', 700);
  ctx.restore();
}
function cite(x, y, size = 26, a = 1) { }
function footer(a = 1, s = 'Source: Kubo et al. 2019 · Eur J Appl Physiol') { ctx.save(); ctx.globalAlpha *= a; txt(s, W / 2, 1405, `500 22px ${SANS}`, C.dim); ctx.restore(); }
function note(s, y = 1360, a = 1) { ctx.save(); ctx.globalAlpha *= a; txt(s, W / 2, y, `italic 500 21px ${SANS}`, C.faint); ctx.restore(); }
function header(s, y = 300, a = 1, color = C.txt) {
  ctx.save(); ctx.globalAlpha *= a; ctx.font = `800 40px ${SANS}`; const w = ctx.measureText(s).width;
  txt(s, W / 2, y, `800 40px ${SANS}`, color); ctx.fillStyle = C.lime; rr(W / 2 - w / 2, y + 30, Math.min(120, w) * eo(a), 7, 4); ctx.fill(); ctx.restore();
}
function bigTitle(s, y, a = 1, size = 70, color = C.txt) { ctx.save(); ctx.globalAlpha *= a; txt(s, W / 2, y, `800 ${size}px ${SANS}`, color, 'center', -1); ctx.restore(); }
function arrowLine(x1, y1, x2, y2, color, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x2, y2, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function leader(lx, ly, px, py, l1, l2, color, a, align = 'right') {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const k = eo(a);
  ctx.strokeStyle = 'rgba(255,245,230,0.6)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(lx + (align === 'right' ? 12 : -12), ly); ctx.lineTo(lerp(lx, px, k), lerp(ly, py, k)); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px, py, 5 * k, 0, Math.PI * 2); ctx.fill();
  mono(l1, lx, ly - 14, 24, color, align, 700);
  if (l2) mono(l2, lx, ly + 18, 19, C.dim, align);
  ctx.restore();
}

// ---------- background ----------
function background() {
  const g = ctx.createRadialGradient(W / 2, 760, 60, W / 2, 860, 1300);
  g.addColorStop(0, '#2a2d33'); g.addColorStop(0.5, '#1a1c20'); g.addColorStop(1, '#0d0e10');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,240,220,0.05)';
  for (let y = 30; y < H; y += 48) for (let x = 30 + ((y / 48) % 2) * 24; x < W; x += 48) { ctx.fillRect(x, y, 3, 3); }
}
// ---------- mannequin (side view, facing +x) ----------
const SEG = { shin: 1.0, thigh: 1.02, torso: 1.1, ua: 0.52, fa: 0.5 };
function pose(cx, gy, S, knee, dir = 1) {
  const P = (x, y) => ({ x: cx + dir * x, y });
  const s = rad(0.3 * knee), kn = rad(knee);
  const A = { x: 0, y: gy - 0.1 * S };
  const K = { x: A.x + S * SEG.shin * Math.sin(s), y: A.y - S * SEG.shin * Math.cos(s) };
  const ft = s - kn;
  const Hp = { x: K.x + S * SEG.thigh * Math.sin(ft), y: K.y - S * SEG.thigh * Math.cos(ft) };
  const sr = clamp((0.1 * S - Hp.x) / (S * SEG.torso), -0.05, 0.85);
  const fr = Math.asin(sr) + rad(4);
  const Sh = { x: Hp.x + S * SEG.torso * Math.sin(fr), y: Hp.y - S * SEG.torso * Math.cos(fr) };
  const fh = fr * 0.45;
  const Hd = { x: Sh.x + 0.36 * S * Math.sin(fh) + 0.05 * S, y: Sh.y - 0.36 * S * Math.cos(fh) };
  const u = { x: Math.sin(fr), y: -Math.cos(fr) }, nb = { x: -Math.cos(fr), y: -Math.sin(fr) }; // torso up, torso back
  const Bar = { x: Sh.x + nb.x * 0.13 * S - u.x * 0.03 * S, y: Sh.y + nb.y * 0.13 * S - u.y * 0.03 * S };
  // arm IK: shoulder -> hand (on the bar), elbow below/back
  const Hand = { x: Bar.x + 0.04 * S, y: Bar.y + 0.02 * S };
  const a = SEG.ua * S, b = SEG.fa * S;
  const dx = Hand.x - Sh.x, dy = Hand.y - Sh.y, d = Math.min(Math.hypot(dx, dy), a + b - 1);
  const base = Math.atan2(dy, dx), cosA = (a * a + d * d - b * b) / (2 * a * d);
  const ac = Math.acos(clamp(cosA, -1, 1));
  const E1 = { x: Sh.x + a * Math.cos(base + ac), y: Sh.y + a * Math.sin(base + ac) }, E2 = { x: Sh.x + a * Math.cos(base - ac), y: Sh.y + a * Math.sin(base - ac) };
  const El = E1.y > E2.y ? E1 : E2;
  const Heel = { x: A.x - 0.16 * S, y: gy - 0.05 * S }, Toe = { x: A.x + 0.42 * S, y: gy - 0.05 * S };
  const hipFlex = (fr - ft) * 180 / Math.PI;
  const out = { A, K, H: Hp, Sh, Hd, Bar, Hand, El, Heel, Toe };
  for (const k in out) out[k] = P(out[k].x, out[k].y);
  out.S = S; out.dir = dir; out.knee = knee; out.hipFlex = hipFlex; out.gy = gy;
  out.u = { x: dir * u.x, y: u.y }; out.nb = { x: dir * nb.x, y: nb.y };
  return out;
}
function limb(p, q, w, light = '#f6efe5', mid = '#d9cdbd', dark = '#9c8f7e') {
  const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L * w / 2, ny = dx / L * w / 2;
  const g = ctx.createLinearGradient(p.x + nx, p.y + ny, p.x - nx, p.y - ny);
  g.addColorStop(0, light); g.addColorStop(0.45, mid); g.addColorStop(1, dark);
  ctx.strokeStyle = g; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
}
function sphere(p, r, light = '#fffaf2', dark = '#a3957f') {
  const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
  g.addColorStop(0, light); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
}
const add = (p, v, k) => ({ x: p.x + v.x * k, y: p.y + v.y * k });
const mid = (p, q, k = 0.5) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) });
function unit(p, q) { const dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy) || 1; return { x: dx / L, y: dy / L }; }

// fusiform muscle between P1 and P2, bulging toward side vector n by w1 (and the other way by w2)
function muscle(P1, P2, n, w1, w2, a, color = C.red) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  const M = mid(P1, P2);
  const c1 = add(M, n, w1 * 2), c2 = add(M, n, -w2 * 2);
  ctx.beginPath(); ctx.moveTo(P1.x, P1.y); ctx.quadraticCurveTo(c1.x, c1.y, P2.x, P2.y); ctx.quadraticCurveTo(c2.x, c2.y, P1.x, P1.y);
  const g = ctx.createLinearGradient(c1.x, c1.y, c2.x, c2.y);
  g.addColorStop(0, color === C.red ? '#ff8098' : color); g.addColorStop(0.5, color); g.addColorStop(1, color === C.red ? C.redD : color);
  ctx.fillStyle = g; ctx.fill();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,225,230,0.3)'; ctx.lineWidth = 1.6;
  for (let i = -3; i <= 3; i++) {
    const k = i / 4;
    const cc = add(M, n, (k > 0 ? w1 : w2) * 2 * k);
    ctx.beginPath(); ctx.moveTo(P1.x, P1.y); ctx.quadraticCurveTo(cc.x, cc.y, P2.x, P2.y); ctx.stroke();
  }
  ctx.restore();
}
function muscles(p, m) {
  const S = p.S, d = unit(p.H, p.K); // thigh direction hip->knee
  const f = { x: d.y * p.dir, y: -d.x * p.dir }; // thigh front
  const fb = { x: -f.x, y: -f.y };
  const out = {};
  // glute: sacrum -> upper femur, bulging backward
  const g1 = add(add(p.H, p.nb, 0.2 * S), p.u, 0.2 * S), g2 = add(add(p.H, d, 0.34 * S), fb, 0.07 * S);
  const gn0 = unit(g1, g2); let gn = { x: -gn0.y * p.dir, y: gn0.x * p.dir };
  if ((gn.x * p.nb.x + gn.y * p.nb.y) < 0) gn = { x: -gn.x, y: -gn.y };
  // adductor magnus: ischium -> lower inner thigh, behind the thigh axis
  const a1 = add(add(p.H, p.nb, 0.08 * S), d, 0.04 * S), a2 = add(add(p.H, d, 0.82 * S), fb, 0.06 * S);
  // quads: front of thigh
  const q1 = add(add(p.H, d, 0.1 * S), f, 0.06 * S), q2 = add(add(p.H, d, 0.95 * S), f, 0.05 * S);
  // hamstrings: back of thigh
  const h1 = add(add(p.H, p.nb, 0.04 * S), d, 0.08 * S), h2 = add(add(p.H, d, 0.98 * S), fb, 0.09 * S);
  muscle(h1, h2, fb, 0.12 * S, 0.0, m.ham || 0);
  muscle(a1, a2, fb, 0.15 * S, 0.03 * S, m.add || 0, m.addC || C.red);
  muscle(q1, q2, f, 0.16 * S, 0.03 * S, m.quad || 0, m.quadC || C.red);
  muscle(g1, g2, gn, 0.22 * S, 0.04 * S, m.glute || 0, m.gluteC || C.red);
  out.glute = mid(mid(g1, g2), add(mid(g1, g2), gn, 0.1 * S));
  out.add = mid(a1, a2, 0.55); out.quad = add(mid(q1, q2, 0.5), f, 0.06 * S); out.ham = mid(h1, h2, 0.5);
  return out;
}
// draws a figure; o: {a, bar, m:{glute,add,quad,ham}, shoe, ghost}
function figure(p, o = {}) {
  const S = p.S;
  ctx.save(); ctx.globalAlpha *= (o.a === undefined ? 1 : o.a);
  const body = o.dimBody ? 0.55 : 1;
  // floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(mid(p.Heel, p.Toe).x, p.gy - 0.02 * S, 0.62 * S, 0.06 * S, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.globalAlpha *= body;
  // far leg (offset, darker)
  const off = { x: -0.06 * S * p.dir, y: -0.02 * S };
  const o2 = q => ({ x: q.x + off.x, y: q.y + off.y });
  limb(o2(p.H), o2(p.K), 0.28 * S, '#a99d8d', '#8c8172', '#5f5649');
  limb(o2(p.K), o2(p.A), 0.2 * S, '#a99d8d', '#8c8172', '#5f5649');
  limb(o2(p.Heel), o2(p.Toe), 0.12 * S, '#9a9a9a', '#7c7c7c', '#525252');
  // torso
  limb(p.H, p.Sh, 0.46 * S, '#454b55', '#323740', '#1d2026');
  sphere(p.H, 0.22 * S, '#4a505a', '#1d2026');
  // near leg
  limb(p.H, p.K, 0.3 * S);
  limb(p.H, mid(p.H, p.K, 0.4), 0.34 * S, '#454b55', '#323740', '#1d2026'); // shorts
  limb(p.K, p.A, 0.21 * S);
  sphere(p.K, 0.125 * S);
  limb(p.Heel, p.Toe, 0.15 * S, '#ffffff', '#e6e2dc', '#a9a39a'); // shoe
  sphere(p.A, 0.075 * S);
  ctx.restore();
  const mp = muscles(p, o.m || {});
  ctx.save(); ctx.globalAlpha *= body;
  // arm + head
  limb(p.Sh, p.El, 0.16 * S); limb(p.El, p.Hand, 0.14 * S);
  sphere(p.Sh, 0.13 * S); sphere(p.El, 0.085 * S);
  limb(p.Sh, p.Hd, 0.15 * S, '#e8ddce', '#c9bba8', '#8f826f');
  sphere(p.Hd, 0.23 * S);
  ctx.restore();
  if (o.bar !== false) { // barbell end (plate) on the upper back
    const r = 0.3 * S;
    sphere(p.Bar, r, '#3a3d43', '#0e0f11');
    ctx.strokeStyle = C.lime; ctx.lineWidth = Math.max(3, 0.03 * S); ctx.beginPath(); ctx.arc(p.Bar.x, p.Bar.y, r * 0.86, 0, Math.PI * 2); ctx.stroke();
    sphere(p.Bar, 0.07 * S, '#f2f2f2', '#7a7a7a');
  }
  ctx.restore();
  return mp;
}
function ground(x1, x2, y, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  g.addColorStop(0, 'rgba(255,240,220,0)'); g.addColorStop(0.5, 'rgba(255,240,220,0.4)'); g.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
}
function angleArc(c, from, to, r, color, label, a = 1, labelR = 1.45) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  let a1 = Math.atan2(from.y - c.y, from.x - c.x), a2 = Math.atan2(to.y - c.y, to.x - c.x);
  let dlt = a2 - a1; while (dlt > Math.PI) dlt -= 2 * Math.PI; while (dlt < -Math.PI) dlt += 2 * Math.PI;
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(c.x, c.y, r, a1, a1 + dlt, dlt < 0); ctx.stroke();
  const am = a1 + dlt / 2;
  if (label) txt(label, c.x + Math.cos(am) * r * labelR, c.y + Math.sin(am) * r * labelR, `800 34px ${SANS}`, color);
  ctx.restore();
}
// squat rep cycle 0..1..0
const rep = (t, period = 2.6, ph = 0) => { const k = ((t + ph) % period) / period; return (1 - Math.cos(k * Math.PI * 2)) / 2; };
const smoothRep = (t, period, ph) => eio(rep(t, period, ph));

// ---------- bar chart ----------
function barChart(t, t0, o) {
  const k = eo(tw(t, t0, t0 + 0.5));
  header(o.title, 330, k); txt(o.sub, W / 2, 400, `500 26px ${SANS}`, C.dim);
  const rows = [[o.a, 600, C.lime, C.limeD, o.ta || t0 + 0.3], [o.b, 860, C.purp, C.purpD, o.tb || t0 + 0.9]];
  const x0 = 110, wMax = 860;
  for (const [[v, lab], y, c1, c2, tb] of rows) {
    const g = eo(tw(t, tb, tb + 0.8));
    ctx.save(); ctx.globalAlpha *= k;
    txt(lab[0].toUpperCase() + lab.slice(1), x0, y - 55, `800 38px ${SANS}`, c1, 'left');
    rr(x0, y, wMax, 120, 22); ctx.fillStyle = 'rgba(255,245,230,0.06)'; ctx.fill();
    if (g > 0) {
      const w = Math.max(44, wMax * v / o.max * g);
      const gr = ctx.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, c2); gr.addColorStop(1, c1);
      rr(x0, y, w, 120, 22); ctx.fillStyle = gr; ctx.fill();
      const val = '+' + (v * g).toFixed(1) + '%';
      const inside = w > 330;
      txt(val, inside ? x0 + w - 24 : x0 + w + 20, y + 62, `800 68px ${SANS}`, inside ? '#16181c' : C.txt, inside ? 'right' : 'left');
    }
    ctx.restore();
  }
  if (o.chip) chip(o.chip, W / 2, 1110, o.chipC || C.yel, eo(tw(t, o.chipT, o.chipT + 0.35)), 30);
}
// ---------- captions ----------
function captions(t) {
  const c = ch.find(c => t >= c.s && t < c.e);
  if (!c) return;
  const k = eo(tw(t, c.s, c.s + 0.14));
  ctx.save();
  const F = `800 58px ${SANS}`; ctx.font = F;
  const words = c.text.split(' ');
  let lines = [c.text];
  if (ctx.measureText(c.text).width > 900) { const h = Math.ceil(words.length / 2); lines = [words.slice(0, h).join(' '), words.slice(h).join(' ')]; }
  const lh = 70, y0 = 1530 - (lines.length - 1) * lh / 2;
  ctx.globalAlpha = k; ctx.translate(W / 2, y0); const sc = lerp(0.9, 1, back(k)); ctx.scale(sc, sc);
  ctx.lineJoin = 'round'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => {
    ctx.font = F; ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(10,10,12,0.95)'; ctx.strokeText(l, 0, i * lh);
    ctx.fillStyle = '#ffffff'; ctx.fillText(l, 0, i * lh);
  });
  const wl = ctx.measureText(lines[lines.length - 1]).width;
  ctx.fillStyle = C.lime; rr(-wl / 2 * eo(tw(t, c.s, c.e)), (lines.length - 1) * lh + 40, wl * eo(tw(t, c.s, c.e)), 7, 4); ctx.fill();
  ctx.restore();
}
// ---------- scenes ----------
// people grid (17 subjects)
function person(x, y, s, color, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y - s * 0.62, s * 0.2, 0, Math.PI * 2); ctx.fill();
  rr(x - s * 0.22, y - s * 0.38, s * 0.44, s * 0.5, s * 0.12); ctx.fill();
  rr(x - s * 0.19, y + s * 0.05, s * 0.15, s * 0.5, s * 0.06); ctx.fill(); rr(x + s * 0.04, y + s * 0.05, s * 0.15, s * 0.5, s * 0.06); ctx.fill();
  ctx.restore();
}

function sHook(t) {
  const L = LS(0);
  bigTitle('FULL vs HALF SQUAT', 330, eo(tw(t, L, L + 0.4)), 72);
  const S = 165, gy = 1220;
  const kf = smoothRep(t, 2.8, 0.4), kh = smoothRep(t, 2.8, 0.4);
  const pf = pose(290, gy, S, 140 * kf), ph = pose(790, gy, S, 90 * kh);
  ground(60, 1020, gy);
  // depth guides
  const pfl = pose(290, gy, S, 140), phl = pose(790, gy, S, 90);
  ctx.save(); ctx.setLineDash([8, 8]); ctx.lineWidth = 2;
  ctx.strokeStyle = C.lime; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(110, pfl.H.y); ctx.lineTo(470, pfl.H.y); ctx.stroke();
  ctx.strokeStyle = C.purp; ctx.beginPath(); ctx.moveTo(610, phl.H.y); ctx.lineTo(970, phl.H.y); ctx.stroke(); ctx.restore();
  figure(pf, { m: { glute: 0.85 * eo(tw(t, CK('Glutes bade'), CK('Glutes bade') + 0.5)) } });
  figure(ph, { m: { glute: 0.85 * eo(tw(t, CK('Glutes bade'), CK('Glutes bade') + 0.5)) } });
  mono('full squat', 290, 480, 26, C.lime, 'center', 700); mono('knee ~140°', 290, 516, 20, C.dim);
  mono('half squat', 790, 480, 26, C.purp, 'center', 700); mono('knee ~90°', 790, 516, 20, C.dim);
  // "?" pulse on "kaunsa"
  const vs = back(tw(t, 0.2, 0.7));
  ctx.save(); ctx.translate(W / 2, 760); ctx.scale(vs, vs); ctx.rotate(-0.08);
  ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.fill();
  txt('VS', 0, 3, `800 54px ${SANS}`, '#16181c'); ctx.restore();
  const q = eo(tw(t, CK('kaunsa'), CK('kaunsa') + 0.3));
  if (q > 0) { ctx.save(); ctx.globalAlpha = q; txt('?', W / 2, 640, `800 ${90 * back(q)}px ${SANS}`, C.yel); ctx.restore(); }
  chip('ASLI KAAM', W / 2, 1330, C.lime, eo(tw(t, CK('ASLI'), CK('ASLI') + 0.3)), 24);
}

function gauge(x, top, bottom, levels, mark, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = C.line; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
  for (const [y, lab, col, sub] of levels) {
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y); ctx.stroke();
    mono(lab, x + 30, y - (sub ? 10 : 0), 20, col, 'left', 700);
    if (sub) mono(sub, x + 30, y + 16, 16, C.dim, 'left');
  }
  if (mark) { ctx.fillStyle = mark[1]; ctx.beginPath(); ctx.moveTo(x - 30, mark[0] - 12); ctx.lineTo(x - 12, mark[0]); ctx.lineTo(x - 30, mark[0] + 12); ctx.fill(); }
  ctx.restore();
}

function sMost(t) {
  const L = LS(1), S = 200, gy = 1250, cx = 420;
  header('ZYADA TAR LOG YAHAN RUKTE HAIN', 320, eo(tw(t, L, L + 0.4)));
  const k = smoothRep(t - L, 2.6, 0);
  const p = pose(cx, gy, S, 85 * k);
  ground(80, 760, gy);
  figure(p, {});
  // depth gauge on the right, levels from pose hip heights
  const yStand = pose(cx, gy, S, 0).H.y, yHalf = pose(cx, gy, S, 90).H.y, yPar = pose(cx, gy, S, 112).H.y, yFull = pose(cx, gy, S, 140).H.y;
  gauge(850, yStand - 40, yFull + 60, [
    [yStand, 'standing', C.dim], [yHalf, 'half · 90°', C.purp], [yPar, 'parallel', C.txt], [yFull, 'full · 140°', C.lime]
  ], [p.H.y, C.txt], eo(tw(t, L + 0.3, L + 0.9)));
  ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(p.H.x, p.H.y); ctx.lineTo(820, p.H.y); ctx.stroke(); ctx.restore();
  // "research" tease
  const r = eo(tw(t, CK('research'), CK('research') + 0.4));
  if (r > 0) { chip('RESEARCH', W / 2, 1335, C.yel, r, 26); }
}

function sMuscles(t) {
  const L2 = LS(2), S = 230, gy = 1290, cx = 650;
  // stand up from the bottom while "squat se uthte waqt", then hold slightly bent
  const up = eio(tw(t, L2, CKE('hip ko seedha')));
  const knee = lerp(130, 40, up);
  const p = pose(cx, gy, S, knee);
  header('HIP EXTENSORS', 300, eo(tw(t, L2, L2 + 0.4)));
  ground(140, 960, gy);
  const tg = CK('tumhare glutes'), ta = CK('aur tumhare adductors');
  const mg = eo(tw(t, tg, tg + 0.45)), ma = eo(tw(t, ta, ta + 0.45));
  const mp = figure(p, { m: { glute: mg, add: ma }, dimBody: mg > 0 });
  // hip extension arrow around the hip
  const he = eo(tw(t, CK('hip ko seedha'), CK('hip ko seedha') + 0.4)) * (1 - mg);
  if (he > 0) {
    ctx.save(); ctx.globalAlpha = he; ctx.strokeStyle = C.lime; ctx.lineWidth = 5;
    const r = 0.42 * S; ctx.beginPath(); ctx.arc(p.H.x, p.H.y, r, rad(200), rad(300)); ctx.stroke();
    const e = { x: p.H.x + r * Math.cos(rad(300)), y: p.H.y + r * Math.sin(rad(300)) };
    ctx.fillStyle = C.lime; ctx.beginPath(); ctx.moveTo(e.x + 16, e.y + 6); ctx.lineTo(e.x - 8, e.y - 14); ctx.lineTo(e.x - 10, e.y + 14); ctx.fill();
    mono('hip extension', p.H.x - 0.5 * S, p.H.y - 0.62 * S, 22, C.lime, 'center', 700);
    ctx.restore();
  }
  leader(370, 560, mp.glute.x, mp.glute.y, 'gluteus maximus', 'glutes', C.red, mg, 'right');
  leader(370, 1070, mp.add.x, mp.add.y, 'adductors', 'inner thigh', C.red, ma, 'right');
  const it = eo(tw(t, CK('yaani inner'), CK('yaani inner') + 0.4));
  chip('INNER THIGH', 250, 1170, C.red, it, 20);
}

function sStretch(t) {
  const L = LS(3), S = 230, gy = 1260, cx = 560;
  const k = eio(tw(t, L + 0.2, CKE('hip utna') + 0.2));
  const knee = lerp(20, 140, k);
  const p = pose(cx, gy, S, knee);
  header('DEEPER  =  MORE STRETCH', 300, eo(tw(t, L, L + 0.4)));
  ground(140, 960, gy);
  const mp = figure(p, { m: { glute: 1, add: 1 }, dimBody: true });
  // hip flexion arc between torso and thigh
  const hf = Math.round(p.hipFlex);
  angleArc(p.H, add(p.H, p.u, 100), add(p.H, unit(p.H, p.K), 100), 0.42 * S, C.lime, hf + '°', 1, 1.55);
  mono('hip flexion', p.H.x + 0.95 * S, p.H.y - 0.55 * S, 20, C.dim, 'left');
  // relative muscle length bar
  const st = eo(tw(t, CK('aur ye muscles'), CK('aur ye muscles') + 0.4));
  ctx.save(); ctx.globalAlpha = 0.45 + 0.55 * st;
  const dx = 880, dy = 1150, R = 105, v = lerp(0.12, 1, k);
  ctx.lineCap = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = 'rgba(255,245,230,0.1)';
  ctx.beginPath(); ctx.arc(dx, dy, R, Math.PI * 0.8, Math.PI * 2.2); ctx.stroke();
  ctx.strokeStyle = C.red; ctx.beginPath(); ctx.arc(dx, dy, R, Math.PI * 0.8, Math.PI * (0.8 + 1.4 * v)); ctx.stroke();
  txt(Math.round(v * 100) + '%', dx, dy - 6, `800 46px ${SANS}`, C.txt);
  mono('stretch', dx, dy + 40, 18, C.dim, 'center', 700);
  ctx.restore();
  chip('STRETCH UNDER LOAD', 300, 470, C.red, eo(tw(t, CK('utna zyada stretch'), CK('utna zyada stretch') + 0.35)), 22);
}

function sQuads(t) {
  const L = LS(4), S = 230, gy = 1260, cx = 560;
  const knee = 60 + 50 * smoothRep(t - L, 3.0, 0);
  const p = pose(cx, gy, S, knee);
  const tq = L, th = CK('Toh theory');
  const mq = eo(tw(t, tq, tq + 0.5));
  const toCard = eo(tw(t, th, th + 0.5));
  ctx.save(); ctx.globalAlpha = 1 - toCard * 0.85;
  header('KNEE EXTENSORS', 300, mq);
  ground(140, 960, gy);
  const mp = figure(p, { m: { quad: mq, quadC: C.purp }, dimBody: true });
  angleArc(p.K, p.H, p.A, 0.36 * S, C.purp, '', mq);
  leader(880, 600, mp.quad.x, mp.quad.y, 'quadriceps', 'front thigh', C.purp, mq, 'left');
  ctx.restore();
  if (toCard > 0) {
    ctx.save(); ctx.globalAlpha = toCard; ctx.translate(0, (1 - toCard) * 30);
    rr(110, 600, 860, 520, 18); ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.purp; rr(110, 600, 8, 520, 4); ctx.fill();
    mono('theory', 170, 660, 22, C.dim, 'left', 700);
    const r1 = eo(tw(t, CK('depth ka sabse'), CK('depth ka sabse') + 0.4)), r2 = eo(tw(t, CK('hip muscles ko'), CK('hip muscles ko') + 0.4));
    ctx.globalAlpha = toCard * (0.35 + 0.65 * r1);
    txt('Hip muscles', 170, 770, `800 56px ${SANS}`, C.lime, 'left'); mono('glutes · adductors', 170, 830, 20, C.dim, 'left');
    txt('→ depth matters', 960, 800, `700 40px ${SANS}`, C.txt, 'right');
    ctx.globalAlpha = toCard * (0.35 + 0.65 * r2);
    txt('Quads', 170, 960, `800 56px ${SANS}`, C.purp, 'left'); mono('knee extensors', 170, 1020, 20, C.dim, 'left');
    txt('→ less difference', 960, 990, `700 40px ${SANS}`, C.txt, 'right');
    ctx.restore();
  }
}

function sQuestion(t) {
  const L = LS(5), S = 160, gy = 1180;
  const a = eo(tw(t, L, L + 0.4));
  header('SACH ME FARAK PADTA HAI?', 330, a);
  ctx.save(); ctx.globalAlpha = a;
  const p1 = pose(250, gy, S, 140 * smoothRep(t, 2.6, 0.3)), p2 = pose(830, gy, S, 90 * smoothRep(t, 2.6, 0.3), -1);
  ground(60, 1020, gy);
  figure(p1, { m: { glute: 0.9 } }); figure(p2, { m: { glute: 0.9 } });
  mono('full', 250, 1250, 24, C.lime, 'center', 700); mono('half', 830, 1250, 24, C.purp, 'center', 700);
  const q = back(tw(t, L + 0.2, L + 0.7));
  txt('?', W / 2, 760, `800 ${190 * q}px ${SANS}`, C.txt);
  ctx.restore();
}

function sStudy(t) {
  const L = LS(6);
  const a = eo(tw(t, L, L + 0.5));
  // paper sheet
  ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, 560); ctx.rotate(lerp(-0.12, -0.04, a)); ctx.scale(lerp(0.8, 1, back(a)), lerp(0.8, 1, back(a)));
  const pw = 520, ph = 330;
  ctx.fillStyle = '#f7f1e8'; ctx.beginPath(); ctx.moveTo(-pw / 2, -ph / 2); ctx.lineTo(pw / 2 - 60, -ph / 2); ctx.lineTo(pw / 2, -ph / 2 + 60); ctx.lineTo(pw / 2, ph / 2); ctx.lineTo(-pw / 2, ph / 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9cfc0'; ctx.beginPath(); ctx.moveTo(pw / 2 - 60, -ph / 2); ctx.lineTo(pw / 2 - 60, -ph / 2 + 60); ctx.lineTo(pw / 2, -ph / 2 + 60); ctx.closePath(); ctx.fill();
  txt('Kubo et al.', -pw / 2 + 40, -ph / 2 + 70, `800 54px ${SANS}`, '#16181c', 'left');
  txt('Eur J Appl Physiol · 2019', -pw / 2 + 40, -ph / 2 + 125, `600 24px ${SANS}`, '#6b6257', 'left');
  ctx.fillStyle = '#d9cfc0'; for (let i = 0; i < 4; i++) rr(-pw / 2 + 40, -ph / 2 + 170 + i * 30, (i === 3 ? 260 : 440), 12, 6), ctx.fill();
  ctx.fillStyle = C.lime; rr(-pw / 2 + 40, -ph / 2 + 290, 200, 12, 6); ctx.fill();
  ctx.restore();
  // 17 people
  const tn = CK('17 untrained');
  const n = Math.floor(17 * eo(tw(t, tn, tn + 0.8)));
  const split = eo(tw(t, CK('Ek group ne'), CK('Ek group ne') + 0.6));
  for (let i = 0; i < 17; i++) {
    const col = i < 8 ? 0 : 1, j = i < 8 ? i : i - 8;
    const gx0 = 150 + (i % 9) * 98, gy0 = 900 + Math.floor(i / 9) * 160;
    const gx1 = (col === 0 ? 150 : 570) + (j % 4) * 92, gy1 = 900 + Math.floor(j / 4) * 145;
    const x = lerp(gx0, gx1, split), y = lerp(gy0, gy1, split);
    const c = split > 0.05 ? (col === 0 ? C.lime : C.purp) : 'rgba(246,239,229,0.9)';
    person(x + 20, y, 105, c, i < n ? 1 : 0.12);
  }
  ctx.save(); ctx.globalAlpha = eo(tw(t, tn, tn + 0.6)) * (1 - split);
  txt('17 untrained ladke', W / 2, 1280, `800 44px ${SANS}`, C.txt); txt('umar ~21 saal', W / 2, 1330, `500 26px ${SANS}`, C.dim);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = split;
  txt('Full squat · 8', 300, 1280, `800 36px ${SANS}`, C.lime); txt('Half squat · 9', 755, 1280, `800 36px ${SANS}`, C.purp);
  ctx.restore();
  footer(a);
}
function sDepths(t) {
  const L = CK('poora neeche'), S = 165, gy = 1180;
  const a = eo(tw(t, L, L + 0.4));
  header('KNEE ANGLE', 330, a);
  ctx.save(); ctx.globalAlpha = a;
  const kf = 140 * eo(tw(t, L, CK('140°') + 0.3));
  const kh = 90 * eo(tw(t, CK('Doosra group'), CK('90°') + 0.3));
  const p1 = pose(290, gy, S, kf), p2 = pose(790, gy, S, kh);
  ground(80, 1000, gy);
  figure(p1, {}); figure(p2, {});
  angleArc(p1.K, p1.H, p1.A, 0.38 * S, C.lime, '', kf > 5 ? 1 : 0); angleArc(p2.K, p2.H, p2.A, 0.38 * S, C.purp, '', kh > 5 ? 1 : 0);
  if (kf > 5) txt(Math.round(kf) + '°', p1.K.x + 0.55 * S, p1.K.y - 0.45 * S, `800 52px ${SANS}`, C.lime);
  if (kh > 5) txt(Math.round(kh) + '°', p2.K.x + 0.55 * S, p2.K.y - 0.45 * S, `800 52px ${SANS}`, C.purp);
  mono('full squat', 290, 1250, 24, C.lime, 'center', 700); mono('half squat', 790, 1250, 24, C.purp, 'center', 700);
  ctx.restore();
  chip('YAANI HALF SQUAT', 790, 1320, C.purp, eo(tw(t, CK('Yaani half'), CK('Yaani half') + 0.3)), 20);
  footer(a);
}

function sProtocol(t) {
  const L = LS(8), tm = CK('Phir MRI');
  const a = eo(tw(t, L, L + 0.4)), out = eo(tw(t, tm - 0.1, tm + 0.35));
  ctx.save(); ctx.globalAlpha = a * (1 - out); ctx.translate(0, -out * 40);
  const wk = Math.min(10, Math.floor(10 * eo(tw(t, CK('das hafte'), CK('das hafte') + 0.9))));
  txt(String(Math.max(wk, 0) || 10), W / 2 - 60, 470, `800 190px ${SANS}`, C.txt, 'right');
  mono('weeks', W / 2 - 30, 500, 34, C.lime, 'left', 700);
  // 10 weeks x 2 sessions
  const fill = 20 * eo(tw(t, L + 0.3, CKE('das hafte')));
  for (let i = 0; i < 20; i++) {
    const x = 175 + (i % 10) * 76, y = 650 + Math.floor(i / 10) * 96;
    rr(x, y, 60, 76, 8); ctx.fillStyle = i < fill ? C.lime : 'rgba(255,255,255,0.06)'; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();
  }
  mono('2 sessions / week', W / 2, 880, 20, C.dim);
  chip('2× / HAFTA', 270, 990, C.lime, eo(tw(t, L, L + 0.4)), 20);
  chip('3 HEAVY SETS', W / 2, 990, C.txt, eo(tw(t, L + 0.4, L + 0.8)), 20);
  chip('SQUAT ONLY', 810, 990, C.purp, eo(tw(t, L + 0.8, L + 1.2)), 20);
  ctx.restore();
  // MRI
  if (out > 0) {
    ctx.save(); ctx.globalAlpha = out;
    header('MRI SCAN', 330, out);
    const cx = W / 2, cy = 780, R = 290, sc = eo(tw(t, tm, tm + 0.6));
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0b0c0e'; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // thigh slice: skin/fat ring, three muscle groups, femur
    ctx.fillStyle = '#5c5650'; ctx.beginPath(); ctx.ellipse(cx, cy, 235, 205, 0, 0, Math.PI * 2); ctx.fill();
    const lb = eo(tw(t, CK('thigh ke har'), CK('thigh ke har') + 0.5));
    const regs = [['QUADS', 0, -95, 175, 95, C.purp], ['ADDUCTORS', -120, 70, 95, 90, C.red], ['HAMSTRINGS', 90, 110, 110, 70, C.yel]];
    for (const [nm, dx, dy, rx, ry, col] of regs) {
      ctx.fillStyle = '#a49b90'; ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.globalAlpha = 0.85 * lb; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#f4efe8'; ctx.beginPath(); ctx.arc(cx + 10, cy + 10, 36, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5c5650'; ctx.beginPath(); ctx.arc(cx + 10, cy + 10, 14, 0, Math.PI * 2); ctx.fill();
    // scan line sweeping down
    const sy = cy - R + 2 * R * ((t - tm) * 0.6 % 1);
    const gl = ctx.createLinearGradient(0, sy - 60, 0, sy); gl.addColorStop(0, 'rgba(255,138,42,0)'); gl.addColorStop(1, 'rgba(255,138,42,0.45)');
    ctx.fillStyle = gl; ctx.fillRect(cx - R, sy - 60, 2 * R, 60); ctx.fillStyle = C.lime; ctx.fillRect(cx - R, sy - 3, 2 * R, 4);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,245,230,0.25)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = out * lb;
    txt('Har muscle ka volume naapa', W / 2, 1150, `800 42px ${SANS}`, C.txt);
    txt('training se pehle vs baad', W / 2, 1205, `500 28px ${SANS}`, C.dim);
    [['quads', C.purp], ['adductors', C.red], ['hamstrings', C.yel]].forEach(([nm, col], i) => { chip(nm.toUpperCase(), 250 + i * 290, 1275, col, lb, 20); });
    ctx.restore();
    note('illustration, not a scan from the study', 1345, out);
  }
  footer(a);
}

function sGlutes(t) {
  barChart(t, LS(9), { title: 'GLUTEUS MAXIMUS · VOLUME CHANGE', sub: 'after 10 weeks', a: [6.7, 'full squat'], b: [2.2, 'half squat'], max: 8,
    ta: CK('+6.7'), tb: CK('sirf 2.2'), chip: '3× MORE GROWTH', chipT: CK('Yaani TEEN') });
  footer();
}
function sAdd(t) {
  barChart(t, LS(10), { title: 'ADDUCTORS · VOLUME CHANGE', sub: 'after 10 weeks', a: [6.2, 'full squat'], b: [2.7, 'half squat'], max: 8,
    ta: CK('6.2'), tb: CK('versus 2.7'), chip: '2.3× MORE', chipT: CK('Double se') });
  footer();
}
function sQuadsChart(t) {
  barChart(t, LS(11), { title: 'QUADRICEPS · VOLUME CHANGE', sub: 'after 10 weeks', a: [4.9, 'full squat'], b: [4.6, 'half squat'], max: 8,
    ta: CK('4.9'), tb: CK('versus 4.6'), chip: '≈ SAME', chipT: CK('Lagbhag SAME'), chipC: C.txt });
  footer();
}

function sMechanism(t) {
  const L = LS(12), a = eo(tw(t, L, L + 0.4));
  header('FULL vs HALF · GROWTH RATIO', 330, a);
  const tk = L, th = CK('Jo hip pe');
  const hk = eo(tw(t, tk + 0.2, tk + 0.6)), hh = eo(tw(t, th, th + 0.4));
  const rows = [['glutes', 'hip', 6.7 / 2.2, C.lime, hh], ['adductors', 'hip', 6.2 / 2.7, C.lime, hh], ['quads', 'knee', 4.9 / 4.6, C.purp, hk]];
  rows.forEach(([name, joint, r, col, hl], i) => {
    const y = 520 + i * 230, g = eo(tw(t, L + 0.2 + i * 0.25, L + 0.9 + i * 0.25));
    ctx.save(); ctx.globalAlpha = a * (0.35 + 0.65 * Math.max(hl, i === 2 ? hk : hh));
    rr(110, y - 80, 860, 180, 14); ctx.fillStyle = C.card; ctx.fill();
    ctx.strokeStyle = hl > 0.5 ? col : C.line; ctx.lineWidth = 2.5; ctx.stroke();
    txt(name[0].toUpperCase() + name.slice(1), 160, y - 30, `800 46px ${SANS}`, C.txt, 'left');
    mono('works at the ' + joint, 160, y + 20, 19, col, 'left', 700);
    txt(r.toFixed(1) + '×', 920, y - 10, `800 64px ${SANS}`, col, 'right');
    rr(160, y + 55, 760, 12, 6); ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fill();
    rr(160, y + 55, 760 * clamp((r - 1) / 2.2) * g + 6, 12, 6); ctx.fillStyle = col; ctx.fill();
    ctx.restore();
  });
  chip('YAHI HAI MECHANISM', W / 2, 1250, C.lime, eo(tw(t, CK('unhe pada'), CK('unhe pada') + 0.3)), 24);
  footer(a);
}

function sCaveats(t) {
  const L = LS(13), a = eo(tw(t, L, L + 0.4));
  header('DHYAN RAHE', 330, a, C.yel);
  const rows = [['!', 'Sirf ek chhoti study', CK('Ye ek chhoti')], ['17', 'Sab beginners the', CK('beginners')], ['10', 'Sirf 10 hafte', CK('sirf das')],
    ['0', 'Hamstrings: na ke barabar change', CK('Aur hamstrings')]];
  rows.forEach(([n, lab, t0], i) => {
    const k = eo(tw(t, t0, t0 + 0.4)), y = 520 + i * 200;
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 30);
    const col = i === 3 ? C.red : C.yel;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(190, y, 62 * back(k), 0, Math.PI * 2); ctx.fill();
    txt(n, 190, y + 3, `800 ${n.length > 1 ? 52 : 64}px ${SANS}`, '#16181c');
    txt(lab, 290, y, `700 44px ${SANS}`, C.txt, 'left');
    ctx.restore();
  });
  footer(a);
}
function sVerdict(t) {
  const L = LS(14), S = 150, gy = 1120;
  const a = eo(tw(t, L, L + 0.4));
  header('VERDICT', 330, a);
  ctx.save(); ctx.globalAlpha = a;
  const p1 = pose(290, gy, S, 140 * smoothRep(t, 2.8, 0.2)), p2 = pose(790, gy, S, 90 * smoothRep(t, 2.8, 0.2));
  ground(80, 1000, gy);
  figure(p1, { m: { glute: 0.9, add: 0.9 } }); figure(p2, {});
  mono('full squat', 290, 1185, 24, C.lime, 'center', 700); mono('half squat', 790, 1185, 24, C.purp, 'center', 700);
  ctx.restore();
  chip('MAIN SQUAT', 290, 470, C.lime, eo(tw(t, CK('jitna neeche ja'), CK('jitna neeche ja') + 0.35)), 24);
  chip('GOOD FORM', 290, 545, C.txt, eo(tw(t, CK('toh achhe form'), CK('toh achhe form') + 0.35)), 18);
  chip('EXTRA, NOT MAIN', 790, 470, C.purp, eo(tw(t, CK('bas usse apna'), CK('bas usse apna') + 0.35)), 22);
  const ok = eo(tw(t, CK('bekaar nahi'), CK('bekaar nahi') + 0.35));
  if (ok > 0) { ctx.save(); ctx.globalAlpha = ok; mono('not useless', 790, 545, 18, C.dim); ctx.restore(); }
}

function sOutro(t) {
  const L = LS(15), S = 200, gy = 1250, cx = 430;
  const a = eo(tw(t, L, L + 0.4));
  bigTitle('Tum kitna', 360, a, 72); bigTitle('neeche jaate ho?', 450, a, 72, C.lime);
  ctx.save(); ctx.globalAlpha = a;
  const k = smoothRep(t - L, 2.4, 0);
  const p = pose(cx, gy, S, 140 * k);
  ground(80, 760, gy);
  figure(p, {});
  const yStand = pose(cx, gy, S, 0).H.y, yHalf = pose(cx, gy, S, 90).H.y, yPar = pose(cx, gy, S, 112).H.y, yFull = pose(cx, gy, S, 140).H.y;
  gauge(850, yStand - 40, yFull + 60, [[yStand, 'standing', C.dim], [yHalf, 'half', C.purp], [yPar, 'parallel', C.txt], [yFull, 'full', C.lime]], [p.H.y, C.lime]);
  ctx.restore();
  chip('COMMENT KARO 👇', W / 2, 1335, C.txt, eo(tw(t, CK('jaate ho'), CK('jaate ho') + 0.3)), 22);
}

function sEnd(t, t0) {
  const a = eo(tw(t, t0, t0 + 0.4));
  ctx.save(); ctx.globalAlpha = a;
  txt('FULL > HALF', W / 2, 760, `800 110px ${SANS}`, C.lime);
  mono('for glutes + adductors', W / 2, 860, 26, C.txt, 'center', 700);
  txt('Ek study. Ek seedha faisla.', W / 2, 1000, `700 34px ${SANS}`, C.dim);
  txt('Source: Kubo K, Ikebukuro T, Yata H (2019)', W / 2, 1120, `500 22px ${SANS}`, C.faint);
  txt('Eur J Appl Physiol 119(9): 1933–1942', W / 2, 1152, `500 22px ${SANS}`, C.faint);
  ctx.restore();
}


// ---------- Howzat end card (same as @howzat.tech reels) ----------
const LOGO = new Image(); LOGO.src = window.LOGO_SRC; window.logoOK = false; LOGO.decode().then(() => { window.logoOK = true; });
const HZ = { bg: '#33407a', ink: '#0d0a26', yel: '#ffd166', box: '#232b55', pink: '#f48fb1' };
function hzShadow(x, y, w, h, r, d = 8) { rr(x + d, y + d, w, h, r); ctx.fillStyle = HZ.ink; ctx.fill(); }
function howzatEnd(t, t0) {
  const o = tw(t, t0, t0 + 0.3); if (o <= 0) return;
  ctx.save(); ctx.globalAlpha = o; background(); ctx.restore();
  const c = tw(t, t0 + 0.1, t0 + 0.45); if (c <= 0) return;
  ctx.save(); ctx.globalAlpha = c; ctx.translate(0, lerp(40, 0, eo(c)));
  if (LOGO.complete && LOGO.naturalWidth) {
    const ls = back(tw(t, t0 + 0.1, t0 + 0.5)), r = 175;
    ctx.save(); ctx.translate(540, 560); ctx.scale(ls, ls); ctx.rotate(Math.sin(t * 2) * 0.02);
    ctx.beginPath(); ctx.arc(10, 10, r + 8, 0, 7); ctx.fillStyle = HZ.ink; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, 7); ctx.fillStyle = HZ.yel; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = HZ.box; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); ctx.drawImage(LOGO, -r, -r, 2 * r, 2 * r); ctx.restore();
  }
  txt('Roz ek', 540, 830, `800 84px Poppins, ${SANS}`, '#ffffff');
  ctx.save(); ctx.translate(540, 945); ctx.rotate(-0.035);
  ctx.font = `800 78px Poppins, ${SANS}`; const w = ctx.measureText('"ye kaise hota hai?"').width + 50;
  hzShadow(-w / 2, -62, w, 124, 30, 10);
  rr(-w / 2, -62, w, 124, 30); ctx.fillStyle = HZ.yel; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = HZ.ink; ctx.stroke();
  txt('"ye kaise hota hai?"', 0, 6, `800 78px Poppins, ${SANS}`, HZ.ink); ctx.restore();
  const pf = back(tw(t, t0 + 0.4, t0 + 0.7));
  ctx.translate(540, 1110); ctx.scale(pf, pf);
  hzShadow(-240, -44, 480, 88, 44, 8);
  rr(-240, -44, 480, 88, 44); ctx.fillStyle = HZ.pink; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = HZ.ink; ctx.stroke();
  txt('Follow @howzat.tech', 0, 3, `700 34px ${MONO}`, HZ.ink);
  ctx.restore();
}

const END = TL.chunks[TL.chunks.length - 1].e;
const HZ_T = END + 1.9;
function sceneList() {
  return [
    [0, LS(1), sHook],
    [LS(1), LS(2), sMost],
    [LS(2), LS(3), sMuscles],
    [LS(3), LS(4), sStretch],
    [LS(4), LS(5), sQuads],
    [LS(5), LS(6), sQuestion],
    [LS(6), CK('poora neeche'), sStudy],
    [CK('poora neeche'), LS(8), sDepths],
    [LS(8), LS(9), sProtocol],
    [LS(9), LS(10), sGlutes],
    [LS(10), LS(11), sAdd],
    [LS(11), LS(12), sQuadsChart],
    [LS(12), LS(13), sMechanism],
    [LS(13), LS(14), sCaveats],
    [LS(14), LS(15), sVerdict],
    [LS(15), END + 0.3, sOutro],
    [END + 0.3, HZ_T + 0.4, t => sEnd(t, END + 0.3)],
  ];
}
let SC = null;
function draw(t) {
  if (!SC) SC = sceneList();
  background();
  const FADE = 0.28;
  for (const [s, e, fn] of SC) {
    if (t < s - FADE || t >= e + FADE) continue;
    let a = 1;
    if (t < s) a = 0; else a = Math.min(eo(tw(t, s, s + FADE)), s === 0 ? 1 : 1);
    if (t > e) a = 1 - tw(t, e, e + FADE);
    if (s === 0) a = t > e ? a : 1;
    if (a <= 0) continue;
    ctx.save(); ctx.globalAlpha = a; fn(t); ctx.restore();
  }
  captions(t);
  howzatEnd(t, HZ_T);
}
window.draw = draw; window.cv = cv;
document.fonts.ready.then(() => Promise.all([
  document.fonts.load(`800 40px Inter`), document.fonts.load(`700 40px Inter`), document.fonts.load(`500 40px Inter`),
  document.fonts.load(`700 20px "JetBrains Mono"`), document.fonts.load(`500 20px "JetBrains Mono"`), document.fonts.load(`800 40px Poppins`)])).then(() => { draw(0); window.ready = true; });
