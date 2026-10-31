const LOGO = new Image(); LOGO.src = window.LOGO_SRC; window.logoOK = false; LOGO.decode().then(() => { window.logoOK = true; });
// "Soft flat" theme — overrides the look of maps.js: plain solid colours, soft easy-on-the-eye accents,
// thick ink outlines and hard offset shadows. No glow, no blur, no gradients.
const BG = window.BG || '#33407a';   // plain, soft background colour (one per reel)
const INK = '#0d0a26';               // outlines, hard shadows, text on bright pills
Object.assign(C, {
  bg1: BG, bg2: BG,
  box: '#232b55', boxLine: INK,
  text: '#ffffff', mute: '#d9dcf2', dim: '#aab0d6',
  yel: '#ffd166', grn: '#7bd389', red: '#ef6f6c', org: '#f6a465', cyan: '#7cc8e8', blue: '#9fb3ff',
  pink: '#f48fb1', purple: '#b8a4f0',
  screen: '#232b55', road: 'rgba(255,255,255,0.16)', roadEdge: 'rgba(255,255,255,0.35)',
  block: 'rgba(255,255,255,0.07)', blockLine: 'rgba(255,255,255,0.20)'
});
// no glow anywhere: any shadowBlur set by scene code is ignored
Object.defineProperty(ctx, 'shadowBlur', { get() { return 0; }, set(v) {}, configurable: true });
// hard flat shadow: the same round rect drawn in ink, offset down-right
function hardShadow(x, y, w, h, r, d = 8) { rr(x + d, y + d, w, h, r); ctx.fillStyle = INK; ctx.fill(); }
const POP = [C.pink, C.yel, C.cyan, C.grn, C.org, C.purple];
function hexA(hex, a) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function glassFill(col, lw = 4) {
  ctx.save();
  ctx.fillStyle = C.box; ctx.fill();
  ctx.lineWidth = lw + 2; ctx.strokeStyle = col; ctx.stroke();
  ctx.restore();
}

// ---------- background: one plain colour ----------
function background(t) { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); }
function vignette() {}
function grainLayer(t) {}

// ---------- header ----------
function header(t) {
  ctx.font = `700 24px ${MONO}`; const bw = ctx.measureText('HOWZAT TECH').width + 40;
  hardShadow(70, 160, bw, 52, 26, 5);
  rr(70, 160, bw, 52, 26); ctx.fillStyle = C.yel; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  txt('HOWZAT TECH', 70 + bw / 2, 187, `700 24px ${MONO}`, INK);
  txt(window.TOPIC || 'Google Maps', 70 + bw + 22, 188, `800 34px ${SANS}`, '#ffffff', 'left');
  txt('@howzat.tech', W - 70, 188, `500 26px ${MONO}`, 'rgba(255,255,255,0.8)', 'right');
  const steps = window.STEPS ? STEPS() : [[0, 'THE HACK'], [LS(4), 'ASLI RAAZ'], [LS(7), 'GREEN vs LAAL'], [LS(9), 'HACK SAMJHO'], [LS(13), 'SHARE KARO']];
  let cur = steps[0], k = 0; steps.forEach((s, i) => { if (t >= s[0]) { cur = s; k = i; } });
  const n = Math.max(0, Math.floor((t - cur[0]) * 40));
  ctx.beginPath(); ctx.arc(80, 252, 7, 0, 7); ctx.fillStyle = POP[k % POP.length]; ctx.fill();
  txt(`0${k + 1} · ` + cur[1].slice(0, n), 100, 253, `600 26px ${MONO}`, 'rgba(255,255,255,0.85)', 'left');
}

// ---------- chips ----------
function chip(x, y, label, col, f, opts = {}) {
  if (f <= 0) return;
  ctx.save(); ctx.translate(x, y); const s = back(f); ctx.scale(s, s); ctx.globalAlpha *= Math.min(1, f * 3);
  const size = opts.size || 28; ctx.font = `700 ${size}px ${MONO}`;
  const w = ctx.measureText(label).width + (opts.pad || 52), h = opts.h || 62;
  hardShadow(-w / 2, -h / 2, w, h, h / 2, 6);
  rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  txt(label, 0, 2, `700 ${size}px ${MONO}`, INK);
  ctx.restore();
}

// ---------- map as a glass card ----------
const MAPCARD = [36, 330, 1008, 1090, 44];
function cityMap() {
  const [mx, my, mw, mh, mr] = MAPCARD;
  ctx.save();
  hardShadow(mx, my, mw, mh, mr, 12);
  rr(mx, my, mw, mh, mr); ctx.fillStyle = C.box; ctx.fill();
  ctx.clip();
  const xs = [0, ...VX, W], ys = [my, UP_Y, MAIN_Y, LOW_Y, my + mh];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x0 = xs[i] + 26, x1 = xs[i + 1] - 26;
    const y0 = ys[j] + (ys[j] === MAIN_Y ? 46 : 26), y1 = ys[j + 1] - (ys[j + 1] === MAIN_Y ? 46 : 26);
    rr(x0, y0, x1 - x0, y1 - y0, 18);
    const park = (i === 3 && j === 0) || (i === 0 && j === 3);
    ctx.fillStyle = park ? 'rgba(33,226,124,0.30)' : C.block; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = park ? 'rgba(33,226,124,0.6)' : C.blockLine; ctx.stroke();
  }
  ctx.fillStyle = C.road;
  for (const y of [UP_Y, LOW_Y]) ctx.fillRect(0, y - 20, W, 40);
  for (const x of VX) ctx.fillRect(x - 20, my, 40, mh);
  ctx.fillRect(0, MAIN_Y - 40, W, 80);
  ctx.setLineDash([26, 22]); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, MAIN_Y); ctx.lineTo(W, MAIN_Y); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  ctx.save(); rr(mx, my, mw, mh, mr); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
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
  if (window.reelBursts) return reelBursts(t);
  burst(t, CK('traffic jam'), 690, 790, [C.red, C.org, C.yel]);
  burst(t, CK('wo tumhare') + 0.9, 420, 760, [C.grn, C.cyan, C.yel], 18);
  burst(t, CK('Sadak green'), 540, 1060, [C.grn, C.cyan, '#ffffff'], 26, 1.3);
  burst(t, CK('Sadak laal'), 540, 1060, [C.red, C.pink, C.org], 26, 1.3);
  burst(t, CK('yahan bhayankar') + 0.15, 540, 790, [C.red, C.org, C.yel], 30, 1.4);
  burst(t, CK('doosra raasta') + 0.9, 540, UP_Y - 70, [C.cyan, C.blue, '#ffffff'], 18);
  burst(t, LS(12) + 0.1, 540, 860, POP, 30, 1.5);
  burst(t, CK('"bas 5') + 1.15, 540, 1345, [C.red, C.org, C.yel], 20);
  burst(t, END + 0.4, 540, 560, POP, 34, 1.8);
}

// ---------- scene transition: colour band sweep ----------
function wipe(t, a) {
  const u = P(t, a - 0.32, a + 0.22); if (u <= 0 || u >= 1) return;
  const x = L(-900, W + 900, eio(u));
  ctx.save(); ctx.translate(x, 960); ctx.rotate(-0.38);
  [[C.pink, -270], [C.yel, -90], [C.cyan, 90]].forEach(([col, x0]) => { ctx.fillStyle = col; ctx.fillRect(x0, -1500, 180, 3000); });
  ctx.restore();
}

// ---------- captions: word-by-word pop, keyword in a colour pill ----------
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
    ctx.save(); ctx.translate(540, 1505); ctx.scale(fit, fit); ctx.translate(-tot / 2, 0);
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    // keyword pill (spans all keyword words)
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
      else {
        ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.strokeText(o.w, -o.width / 2, 2);
        ctx.fillStyle = '#ffffff'; ctx.fillText(o.w, -o.width / 2, 2);
      }
      ctx.restore();
    });
    ctx.restore();
  }
}

// ---------- end card ----------
function endCard(t) {
  const o = P(t, END, END + 0.3); if (o <= 0) return;
  ctx.save(); ctx.globalAlpha = o; background(t); ctx.restore();
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
function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.setLineDash([]); ctx.globalCompositeOperation = 'source-over';
  background(t);
  vignette();
  header(t);
  const scenes = window.sceneList ? sceneList() : [
    [0, LS(4), sceneMap1], [LS(4), LS(7), sceneData], [LS(7), LS(9), sceneRoad],
    [LS(9), LS(13), sceneMap2], [LS(13), END + 0.4, sceneCTA],
  ];
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
  grainLayer(t);
}
window.draw = draw;

// keep the traffic line inside the map card
const _traffic = traffic;
traffic = function (a, r0, r1) {
  const [mx, my, mw, mh, mr] = MAPCARD;
  ctx.save(); rr(mx + 2, my + 2, mw - 4, mh - 4, mr); ctx.clip(); _traffic(a, r0, r1); ctx.restore();
};
