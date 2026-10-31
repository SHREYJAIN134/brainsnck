const LOGO = new Image(); LOGO.src = window.LOGO_SRC; window.logoOK = false; LOGO.decode().then(() => { window.logoOK = true; });
// "Pop premium" theme — overrides the look of maps.js (palette, background, cards, chips, captions, transitions)
Object.assign(C, {
  bg1: '#12062e', bg2: '#0a1440',
  box: 'rgba(28,14,70,0.92)', boxLine: '#8a6bff',
  text: '#ffffff', mute: '#b9b0e6', dim: '#7d74b3',
  yel: '#ffe14d', grn: '#5dff8f', red: '#ff3b6b', org: '#ff9a3d', cyan: '#2ee6ff', blue: '#4d7cff',
  pink: '#ff3d9a', purple: '#9b5cff',
  screen: '#170b3d', road: 'rgba(130,100,255,0.26)', roadEdge: 'rgba(170,140,255,0.45)',
  block: 'rgba(255,255,255,0.045)', blockLine: 'rgba(170,140,255,0.22)'
});
const POP = [C.pink, C.yel, C.cyan, C.grn, C.org, C.purple];
function hexA(hex, a) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function glassFill(col, lw = 4) {
  ctx.save();
  ctx.fillStyle = 'rgba(24,10,62,0.93)'; ctx.fill();
  ctx.fillStyle = hexA(col, 0.14); ctx.fill();
  ctx.shadowColor = col; ctx.shadowBlur = 28; ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke();
  ctx.restore();
}

// ---------- background: gradient + drifting colour blobs + dot grid + grain ----------
const grain = document.createElement('canvas'); grain.width = grain.height = 256;
{ const g = grain.getContext('2d'); const id = g.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0); }
function background(t) {
  const g = ctx.createLinearGradient(0, 0, W * 0.6, H);
  g.addColorStop(0, '#16073a'); g.addColorStop(0.5, '#200a52'); g.addColorStop(1, '#0b1546');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const blobs = [[160, 420, 560, '255,61,154', 0], [960, 820, 600, '46,230,255', 1.7], [240, 1560, 640, '155,92,255', 3.1], [980, 1720, 520, '255,154,61', 4.4]];
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [x, y, r, col, ph] of blobs) {
    const bx = x + Math.sin(t * 0.35 + ph) * 90, by = y + Math.cos(t * 0.28 + ph) * 80;
    const rg = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    rg.addColorStop(0, `rgba(${col},0.30)`); rg.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  const s = 40, off = (t * 10) % s;
  for (let y = -s + off; y < H; y += s) for (let x = 20; x < W; x += s) ctx.fillRect(x, y, 2.4, 2.4);
}
function vignette() {
  const g = ctx.createRadialGradient(540, 960, 380, 540, 960, 1200);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(5,0,20,0.5)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function grainLayer(t) {
  ctx.save(); ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay';
  const ox = Math.floor(hash(t * 30, 1) * 256), oy = Math.floor(hash(t * 30, 2) * 256);
  ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}

// ---------- header ----------
function header(t) {
  ctx.font = `700 24px ${MONO}`; const bw = ctx.measureText('HOWZAT TECH').width + 40;
  const g = ctx.createLinearGradient(70, 0, 70 + bw, 0); g.addColorStop(0, C.pink); g.addColorStop(1, C.org);
  rr(70, 160, bw, 52, 26); ctx.fillStyle = g; ctx.fill();
  txt('HOWZAT TECH', 70 + bw / 2, 187, `700 24px ${MONO}`, '#1a0634');
  txt(window.TOPIC || 'Google Maps', 70 + bw + 22, 188, `800 34px ${SANS}`, '#ffffff', 'left');
  txt('@howzat.tech', W - 70, 188, `500 26px ${MONO}`, 'rgba(255,255,255,0.65)', 'right');
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
  rr(-w / 2, -h / 2, w, h, h / 2);
  ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 30; ctx.fillStyle = col; ctx.fill(); ctx.restore();
  const hl = ctx.createLinearGradient(0, -h / 2, 0, h / 2); hl.addColorStop(0, 'rgba(255,255,255,0.35)'); hl.addColorStop(0.5, 'rgba(255,255,255,0)');
  rr(-w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = hl; ctx.fill();
  txt(label, 0, 2, `700 ${size}px ${MONO}`, '#1a0634');
  ctx.restore();
}

// ---------- map as a glass card ----------
const MAPCARD = [36, 330, 1008, 1090, 44];
function cityMap() {
  const [mx, my, mw, mh, mr] = MAPCARD;
  ctx.save();
  rr(mx, my, mw, mh, mr); ctx.fillStyle = 'rgba(14,6,40,0.62)'; ctx.fill();
  ctx.clip();
  const xs = [0, ...VX, W], ys = [my, UP_Y, MAIN_Y, LOW_Y, my + mh];
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
    const x0 = xs[i] + 26, x1 = xs[i + 1] - 26;
    const y0 = ys[j] + (ys[j] === MAIN_Y ? 46 : 26), y1 = ys[j + 1] - (ys[j + 1] === MAIN_Y ? 46 : 26);
    rr(x0, y0, x1 - x0, y1 - y0, 18);
    const park = (i === 3 && j === 0) || (i === 0 && j === 3);
    ctx.fillStyle = park ? 'rgba(93,255,143,0.13)' : C.block; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = park ? 'rgba(93,255,143,0.35)' : C.blockLine; ctx.stroke();
  }
  ctx.fillStyle = C.road;
  for (const y of [UP_Y, LOW_Y]) ctx.fillRect(0, y - 20, W, 40);
  for (const x of VX) ctx.fillRect(x - 20, my, 40, mh);
  ctx.fillRect(0, MAIN_Y - 40, W, 80);
  ctx.setLineDash([26, 22]); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, MAIN_Y); ctx.lineTo(W, MAIN_Y); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  const g = ctx.createLinearGradient(mx, my, mx + mw, my + mh); g.addColorStop(0, C.pink); g.addColorStop(0.5, C.purple); g.addColorStop(1, C.cyan);
  ctx.save(); rr(mx, my, mw, mh, mr); ctx.shadowColor = C.purple; ctx.shadowBlur = 30; ctx.lineWidth = 4; ctx.strokeStyle = g; ctx.stroke(); ctx.restore();
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
  const g = ctx.createLinearGradient(-300, 0, 300, 0);
  g.addColorStop(0, 'rgba(255,61,154,0)'); g.addColorStop(0.25, 'rgba(255,61,154,0.9)'); g.addColorStop(0.5, 'rgba(255,225,77,0.95)');
  g.addColorStop(0.75, 'rgba(46,230,255,0.9)'); g.addColorStop(1, 'rgba(46,230,255,0)');
  ctx.fillStyle = g; ctx.fillRect(-300, -1500, 600, 3000);
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
        rr(-(x1 - x0) / 2, -50, x1 - x0, 104, 26);
        ctx.shadowColor = kc; ctx.shadowBlur = 34; ctx.fillStyle = kc; ctx.fill(); ctx.restore();
      }
    }
    info.forEach((o, k) => {
      const wt = c.s + k * 0.06; const f = P(t, wt, wt + 0.18); if (f <= 0) return;
      const s = L(0.5, 1, back(f));
      ctx.save(); ctx.translate(o.x + o.width / 2, 0); if (o.kw) ctx.rotate(-0.035); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, f * 3);
      if (o.kw) { ctx.fillStyle = '#1a0634'; ctx.fillText(o.w, -o.width / 2, 4); }
      else {
        ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(20,6,52,0.92)'; ctx.strokeText(o.w, -o.width / 2, 2);
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
    ctx.shadowColor = C.purple; ctx.shadowBlur = 50; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fillStyle = '#12062e'; ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.clip(); ctx.drawImage(LOGO, -r, -r, 2 * r, 2 * r); ctx.restore();
  }
  txt('Roz ek', 540, 830, `800 84px ${SANS}`, '#ffffff');
  ctx.save(); ctx.translate(540, 945); ctx.rotate(-0.035);
  ctx.font = `800 78px ${SANS}`; const w = ctx.measureText('"ye kaise hota hai?"').width + 50;
  rr(-w / 2, -62, w, 124, 30); ctx.shadowColor = C.yel; ctx.shadowBlur = 40; ctx.fillStyle = C.yel; ctx.fill(); ctx.shadowBlur = 0;
  txt('"ye kaise hota hai?"', 0, 6, `800 78px ${SANS}`, '#1a0634'); ctx.restore();
  const pf = back(P(t, END + 0.4, END + 0.7));
  ctx.translate(540, 1110); ctx.scale(pf, pf);
  const g = ctx.createLinearGradient(-240, 0, 240, 0); g.addColorStop(0, C.pink); g.addColorStop(1, C.org);
  rr(-240, -44, 480, 88, 44); ctx.shadowColor = C.pink; ctx.shadowBlur = 30; ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  txt('Follow @howzat.tech', 0, 3, `700 34px ${MONO}`, '#1a0634');
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
