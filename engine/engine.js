// BrainSnck reel engine: builds one deterministic GSAP timeline from window.REEL
// and exposes window.seek(t) so frames can be captured at exact times.
(function () {
  const R = window.REEL, W = 1080, H = 1920;
  const root = document.getElementById('root');
  root.style.setProperty('--accent', R.accent);
  root.style.setProperty('--em', R.em || '#FFE14D');
  const P = R.palette;
  const tl = gsap.timeline({ paused: true });
  const updaters = [];
  let s = R.seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const lerp = (a, b, k) => a + (b - a) * k;

  function el(tag, cls, parent, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    (parent || root).appendChild(e);
    return e;
  }
  function wordsHTML(text) {
    // *one or more words* are emphasised; a span can cover several words
    let open = false;
    return text.split(/\s+/).filter(Boolean).map(w => {
      const starts = w.startsWith('*'), ends = /.\*[^\w]*$/.test(w);
      const em = open || starts;
      if (starts) open = true;
      if (ends) open = false;
      const clean = w.replace(/\*/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<span${em ? ' class="em"' : ''}>${clean}</span>`;
    }).join(' ');
  }
  // icon with an outer float wrapper (moved by updaters) and inner box (animated by GSAP)
  function icon(file, size, parent, amp = 14, speed = 1.6) {
    const outer = el('div', 'float', parent);
    const inner = el('div', 'iconwrap', outer);
    inner.style.width = inner.style.height = size + 'px';
    const im = el('img', '', inner); im.src = 'icons/' + file;
    const ph = rnd() * 6.28;
    updaters.push(t => { outer.style.transform = `translateY(${Math.sin(t * speed + ph) * amp}px) rotate(${Math.sin(t * speed * 0.7 + ph) * 2.5}deg)`; });
    return inner;
  }

  // ---------------- background ----------------
  const bg = el('div', 'bg');
  bg.style.background = `radial-gradient(130% 75% at 50% 0%, ${P[1]} 0%, ${P[0]} 62%)`;
  const blobs = [[P[2], 820], [R.accent, 620], [P[1], 900]].map(([c, sz]) => {
    const b = el('div', 'blob', bg); b.style.width = b.style.height = sz + 'px'; b.style.background = c;
    return { b, sz, cx: 150 + rnd() * 780, cy: 300 + rnd() * 1300, ax: 180 + rnd() * 160, ay: 220 + rnd() * 200, w: 0.15 + rnd() * 0.2, ph: rnd() * 6.28 };
  });
  blobs[1].b.style.opacity = .28;
  updaters.push(t => blobs.forEach(o => {
    o.b.style.transform = `translate(${o.cx - o.sz / 2 + Math.sin(t * o.w + o.ph) * o.ax}px, ${o.cy - o.sz / 2 + Math.cos(t * o.w * 0.8 + o.ph) * o.ay}px)`;
  }));

  const amb = el('div', 'amb', bg);
  const theme = R.theme;
  if (theme === 'ocean') {
    for (let i = 0; i < 6; i++) {
      const r = el('div', 'ray', amb); const x = 60 + i * 180 + rnd() * 60, ph = rnd() * 6;
      r.style.left = x + 'px';
      updaters.push(t => { r.style.transform = `rotate(${Math.sin(t * 0.5 + ph) * 8 - 10}deg)`; r.style.opacity = 0.5 + 0.5 * Math.sin(t * 0.8 + ph); });
    }
  }
  if (theme === 'ocean' || theme === 'nature' || theme === 'bokeh') {
    for (let i = 0; i < 28; i++) {
      const b = el('div', theme === 'ocean' ? 'bubble' : 'cell', amb);
      const sz = theme === 'ocean' ? 10 + rnd() ** 2 * 44 : 60 + rnd() * 160;
      b.style.width = b.style.height = sz + 'px';
      const x0 = rnd() * W, d = 7 + rnd() * 8, ph = rnd();
      updaters.push(t => {
        const k = (t / d + ph) % 1;
        b.style.transform = `translate(${x0 + Math.sin(t * 1.2 + ph * 9) * 24}px, ${H + 80 - k * (H + 260)}px)`;
      });
    }
  }
  if (theme === 'space') {
    for (let i = 0; i < 110; i++) {
      const st = el('div', 'star', amb); const sz = 2 + rnd() ** 3 * 6;
      st.style.width = st.style.height = sz + 'px';
      const x = rnd() * W, y = rnd() * H, w = 0.6 + rnd() * 2, ph = rnd() * 6.28, drift = 6 + rnd() * 14;
      updaters.push(t => {
        st.style.transform = `translate(${x}px, ${(y + t * drift) % H}px)`;
        st.style.opacity = 0.25 + 0.75 * Math.abs(Math.sin(t * w + ph));
      });
    }
  }
  if (theme === 'tech') {
    const g = el('div', 'grid', amb);
    updaters.push(t => { g.style.backgroundPosition = `0px ${(t * 90) % 120}px`; });
  }
  if (theme === 'tech' || theme === 'history') {
    for (let i = 0; i < 26; i++) {
      const p = el('div', 'spark', amb); const sz = 4 + rnd() * 8;
      p.style.width = p.style.height = sz + 'px';
      const x0 = rnd() * W, d = 6 + rnd() * 8, ph = rnd();
      updaters.push(t => { const k = (t / d + ph) % 1; p.style.transform = `translate(${x0}px, ${H - k * H}px)`; p.style.opacity = Math.sin(k * Math.PI); });
    }
  }
  if (theme === 'bio') {
    // neural network: nodes joined by lines, with signals travelling along them
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('class', 'net');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); amb.appendChild(svg);
    const nodes = [];
    for (let i = 0; i < 22; i++) nodes.push({ x: rnd() * W, y: rnd() * H, ph: rnd() * 6.28, a: 18 + rnd() * 30 });
    const pos = (n, t) => [n.x + Math.sin(t * 0.35 + n.ph) * n.a, n.y + Math.cos(t * 0.3 + n.ph) * n.a];
    const links = [];
    nodes.forEach((n, i) => {
      const near = nodes.map((m, j) => [j, Math.hypot(m.x - n.x, m.y - n.y)]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2);
      near.forEach(([j, d]) => { if (d < 520 && !links.some(l => (l.a === j && l.b === i))) links.push({ a: i, b: j }); });
    });
    links.forEach(l => {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('stroke', 'rgba(255,255,255,0.16)'); line.setAttribute('stroke-width', '3');
      svg.appendChild(line); l.line = line;
      const dot = document.createElementNS(ns, 'circle'); dot.setAttribute('r', '7'); dot.setAttribute('fill', R.accent);
      dot.setAttribute('style', `filter:drop-shadow(0 0 8px ${R.accent})`);
      svg.appendChild(dot); l.dot = dot; l.d = 1.6 + rnd() * 2.4; l.ph = rnd();
    });
    const circles = nodes.map(n => {
      const c = document.createElementNS(ns, 'circle'); c.setAttribute('r', '9'); c.setAttribute('fill', 'rgba(255,255,255,0.55)'); svg.appendChild(c); return c;
    });
    updaters.push(t => {
      const ps = nodes.map(n => pos(n, t));
      links.forEach(l => {
        const [x1, y1] = ps[l.a], [x2, y2] = ps[l.b];
        l.line.setAttribute('x1', x1); l.line.setAttribute('y1', y1); l.line.setAttribute('x2', x2); l.line.setAttribute('y2', y2);
        const k = (t / l.d + l.ph) % 1;
        l.dot.setAttribute('cx', lerp(x1, x2, k)); l.dot.setAttribute('cy', lerp(y1, y2, k));
        l.dot.setAttribute('opacity', Math.sin(k * Math.PI));
      });
      circles.forEach((c, i) => { c.setAttribute('cx', ps[i][0]); c.setAttribute('cy', ps[i][1]); c.setAttribute('r', 7 + 3 * Math.sin(t * 2 + nodes[i].ph)); });
    });
    for (let i = 0; i < 12; i++) {
      const c = el('div', 'cell', amb); const sz = 120 + rnd() * 220; c.style.width = c.style.height = sz + 'px';
      const x0 = rnd() * W, y0 = rnd() * H, ph = rnd() * 6.28;
      updaters.push(t => { c.style.transform = `translate(${x0 - sz / 2 + Math.sin(t * .3 + ph) * 60}px, ${y0 - sz / 2 + Math.cos(t * .25 + ph) * 80}px) scale(${1 + .15 * Math.sin(t + ph)})`; });
    }
  }
  el('div', 'vignette', bg);

  // ---------------- thumbnail (cover image) mode ----------------
  // Same background as the reel, one still layout. Key content stays inside y 240-1680,
  // the 3:4 area the profile grid shows.
  if (R.mode === 'thumb') {
    const T = R.thumb;
    const box = el('div', 'thumb');
    el('div', 'rays trays', box);
    el('div', 'pill tpill', box, `<span class="dot"></span>${R.series}`);
    const hero = el('div', 'thero', box);
    icon(T.icon, 540, hero, 0, 0);
    (T.minis || []).slice(0, 2).forEach((m, k) => {
      const mw = el('div', 'mini', box); mw.style.left = (k ? 800 : 70) + 'px'; mw.style.top = (k ? 820 : 430) + 'px';
      icon(m, 190, mw, 0, 0);
    });
    el('div', 'tbadge', box, T.badge || 'DID YOU KNOW?');
    el('div', 'ttitle', box, wordsHTML(T.title));
    window.seek = t => { for (const u of updaters) u(t); };
    window.reelReady = Promise.all([
      document.fonts.ready,
      ...Array.from(document.images).map(im => im.decode().catch(() => null)),
    ]).then(() => { window.seek(T.t || 3); return true; });
    return;
  }

  // ---------------- HUD ----------------
  const hud = el('div', 'hud');
  const pill = el('div', 'pill', hud, `<span class="dot"></span>${R.series}`);
  const dot = pill.querySelector('.dot');
  updaters.push(t => { dot.style.transform = `scale(${1 + 0.25 * Math.sin(t * 5)})`; });
  tl.from(pill, { y: -90, opacity: 0, duration: .55, ease: 'back.out(2)' }, 0.1);
  const facts = R.scenes.filter(sc => sc.n);
  const segs = el('div', 'segs', hud);
  const fills = facts.map(() => el('i', '', el('div', 'seg', segs)));
  tl.from(segs, { opacity: 0, y: -20, duration: .4 }, 0.3);
  facts.forEach((sc, k) => tl.to(fills[k], { width: '100%', duration: Math.max(.3, sc.tout - sc.tin), ease: 'none' }, sc.tin));

  // ---------------- scenes ----------------
  function factHead(sc, box) {
    const b = el('div', 'badge', box, `FACT #${sc.n}`);
    gsap.set(b, { xPercent: -50 });
    tl.from(b, { y: -40, scale: .5, opacity: 0, duration: .45, ease: 'back.out(2.4)' }, sc.tin + .08);
    if (sc.headline) {
      const h = el('div', 'headline', box, wordsHTML(sc.headline));
      tl.from(h.children, { y: 60, opacity: 0, rotation: 4, stagger: .07, duration: .42, ease: 'back.out(1.7)' }, sc.tin + .22);
    }
  }
  const fmtNum = (v, sc) => {
    const d = sc.decimals || 0;
    const n = d ? v.toFixed(d) : Math.round(v).toLocaleString('en-US');
    return (sc.prefix || '') + n + (sc.suffix || '');
  };

  const build = {
    hook(sc, box) {
      const rays = el('div', 'rays', box);
      updaters.push(t => { rays.style.transform = `rotate(${t * 14}deg)`; });
      tl.from(rays, { opacity: 0, scale: .4, duration: .8, ease: 'power2.out' }, sc.tmain);
      const holder = el('div', 'hookicon float', box);
      const ic = icon(sc.icon, 460, holder, 18, 1.4);
      tl.from(ic, { scale: 0, rotation: -30, duration: .7, ease: 'back.out(2)' }, sc.tmain);
      (sc.minis || []).slice(0, 2).forEach((m, k) => {
        const mw = el('div', 'mini', box); mw.style.left = (k ? 760 : 110) + 'px'; mw.style.top = (k ? 700 : 420) + 'px';
        const mi = icon(m, 170, mw, 22, 2.1);
        tl.from(mi, { scale: 0, rotation: k ? 40 : -40, duration: .5, ease: 'back.out(2.5)' }, sc.tmain + .35 + k * .15);
      });
      const tt = el('div', 'title', box, wordsHTML(sc.text));
      tl.from(tt.children, { y: 90, opacity: 0, scale: .7, stagger: .09, duration: .45, ease: 'back.out(2)' }, sc.tmain + .25);
    },
    counter(sc, box) {
      factHead(sc, box);
      const m = el('div', 'main', box);
      const ic = icon(sc.icon, 250, m);
      const num = el('div', 'bignum', m, fmtNum(0, sc));
      const lab = el('div', 'label', m, wordsHTML(sc.label || ''));
      tl.from(ic, { scale: 0, rotation: -25, duration: .55, ease: 'back.out(2)' }, sc.tin + .3);
      const o = { v: sc.from || 0 };
      tl.from(num, { scale: .5, opacity: 0, duration: .3, ease: 'back.out(2)' }, sc.tmain);
      tl.to(o, { v: sc.value, duration: sc.tcount, ease: 'power2.out' }, sc.tmain);
      tl.to(num, { scale: 1.16, duration: .13, yoyo: true, repeat: 1, ease: 'power1.out' }, sc.tmain + sc.tcount);
      updaters.push(() => { num.textContent = fmtNum(o.v, sc); });
      tl.from(lab, { y: 40, opacity: 0, duration: .4, ease: 'power3.out' }, sc.tmain + .25);
      if (sc.note) { const n = el('div', 'note', m, sc.note); tl.from(n, { scale: 0, opacity: 0, duration: .4, ease: 'back.out(2)' }, sc.tmain + sc.tcount + .2); }
    },
    ring(sc, box) {
      factHead(sc, box);
      const m = el('div', 'main', box);
      const rb = el('div', 'ringbox', m);
      const C = 2 * Math.PI * 205;
      rb.innerHTML = `<svg viewBox="0 0 500 500"><circle cx="250" cy="250" r="205" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="46"/>
        <circle class="pg" cx="250" cy="250" r="205" fill="none" stroke="${R.accent}" stroke-width="46" stroke-linecap="round"
        stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>`;
      const pg = rb.querySelector('.pg');
      const inn = el('div', 'ringin', rb);
      const ic = icon(sc.icon, 130, inn, 8, 2);
      const num = el('div', 'ringnum', inn, '0%');
      const lab = el('div', 'label', m, wordsHTML(sc.label || ''));
      tl.from(rb, { scale: .3, opacity: 0, rotation: -60, duration: .6, ease: 'back.out(1.8)' }, sc.tin + .3);
      tl.from(ic, { scale: 0, duration: .45, ease: 'back.out(2.5)' }, sc.tin + .5);
      const o = { p: 0 };
      tl.to(o, { p: sc.value, duration: sc.tcount, ease: 'power2.out' }, sc.tmain);
      tl.to(num, { scale: 1.18, duration: .13, yoyo: true, repeat: 1 }, sc.tmain + sc.tcount);
      updaters.push(() => { pg.setAttribute('stroke-dashoffset', C * (1 - Math.max(.0001, o.p) / 100)); num.textContent = Math.round(o.p) + '%'; });
      tl.from(lab, { y: 40, opacity: 0, duration: .4, ease: 'power3.out' }, sc.tmain + .3);
      if (sc.note) { const n = el('div', 'note', m, sc.note); tl.from(n, { scale: 0, opacity: 0, duration: .4, ease: 'back.out(2)' }, sc.tnote || (sc.tmain + sc.tcount + .2)); }
    },
    compare(sc, box) {
      factHead(sc, box);
      const m = el('div', 'main', box);
      const cards = el('div', 'cards', m);
      const mk = (side, d) => {
        const c = el('div', 'card ' + side + (d.hi ? ' hi' : ''), cards);
        const ic = icon(d.icon, 190, c, 10, 1.8);
        el('div', 'ctitle', c, d.title);
        const v = el('div', 'cval', c, d.value); if (d.color) v.style.color = d.color;
        v.style.fontSize = Math.min(112, Math.floor(400 / (d.value.length * 0.5))) + 'px';
        return [c, v];
      };
      const [l, lv] = mk('l', sc.left), [r, rv] = mk('r', sc.right);
      const vs = el('div', 'vs', cards, 'VS');
      tl.from(l, { x: -620, rotation: -10, opacity: 0, duration: .55, ease: 'back.out(1.4)' }, sc.tmain);
      tl.from(r, { x: 620, rotation: 10, opacity: 0, duration: .55, ease: 'back.out(1.4)' }, sc.tmain + .15);
      tl.from(vs, { scale: 0, rotation: 200, duration: .5, ease: 'back.out(2.6)' }, sc.tmain + .45);
      tl.from(lv, { scale: 0, duration: .4, ease: 'back.out(3)' }, sc.tval1);
      tl.from(rv, { scale: 0, duration: .4, ease: 'back.out(3)' }, sc.tval2);
      const hiCard = sc.left.hi ? l : (sc.right.hi ? r : null);
      if (hiCard) tl.to(hiCard, { scale: 1.05, duration: .25, yoyo: true, repeat: 3, ease: 'sine.inOut' }, sc.tval2 + .3);
    },
    list(sc, box) {
      factHead(sc, box);
      const m = el('div', 'main', box);
      const rows = el('div', 'rows', m);
      sc.items.forEach((it, k) => {
        const row = el('div', 'row', rows);
        icon(it.icon, 120, row, 6, 2);
        el('div', 't', row, wordsHTML(it.text));
        tl.from(row, { x: k % 2 ? 700 : -700, opacity: 0, duration: .5, ease: 'back.out(1.5)' }, sc.titems[k]);
      });
    },
    big(sc, box) {
      factHead(sc, box);
      const m = el('div', 'main', box);
      const ic = icon(sc.icon, 400, m, 16, 1.5);
      tl.from(ic, { scale: 0, rotation: -25, duration: .6, ease: 'back.out(2)' }, sc.tmain);
      if (sc.label) { const lab = el('div', 'label', m, wordsHTML(sc.label)); tl.from(lab, { y: 40, opacity: 0, duration: .4 }, sc.tmain + .3); }
      if (sc.note) { const n = el('div', 'note', m, sc.note); tl.from(n, { scale: 0, opacity: 0, duration: .4, ease: 'back.out(2)' }, sc.tmain + .6); }
    },
    cta(sc, box) {
      const holder = el('div', 'hookicon float', box); holder.style.top = '360px';
      const ic = icon(sc.icon, 330, holder, 16, 1.6);
      tl.from(ic, { scale: 0, rotation: 30, duration: .6, ease: 'back.out(2.2)' }, sc.tmain);
      const hd = el('div', 'handle', box, R.handle);
      tl.from(hd, { scale: .4, opacity: 0, duration: .55, ease: 'back.out(2)' }, sc.tmain + .25);
      const sub = el('div', 'sub', box, wordsHTML(sc.text));
      tl.from(sub.querySelectorAll('span'), { y: 40, opacity: 0, stagger: .05, duration: .35 }, sc.tmain + .45);
      const btn = el('div', 'btn', box, `<span class="off">FOLLOW</span><span class="on">FOLLOWING ✓</span>`);
      const on = btn.querySelector('.on');
      tl.from(btn, { y: 80, opacity: 0, duration: .5, ease: 'back.out(2)' }, sc.tmain + .6);
      tl.to(btn, { scale: 1.06, duration: .3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, sc.tmain + 1.1);
      // pointer taps the button
      const pw = el('div', 'pointer', box);
      const pin = el('div', 'iconwrap', pw); pin.style.width = pin.style.height = '170px';
      el('img', '', pin).src = 'icons/' + sc.pointer;
      gsap.set(pw, { x: 900, y: 1700, opacity: 0 });
      tl.to(pw, { x: 470, y: 1150, opacity: 1, duration: .55, ease: 'power3.out' }, sc.tclick - .6);
      tl.to(pin, { scale: .82, duration: .09, yoyo: true, repeat: 1 }, sc.tclick - .05);
      tl.to(btn, { scale: .9, duration: .09, yoyo: true, repeat: 1 }, sc.tclick - .05);
      tl.set(on, { opacity: 1 }, sc.tclick);
      tl.to(pw, { x: 760, y: 1500, opacity: 0, duration: .5, ease: 'power2.in' }, sc.tclick + .45);
      // confetti burst from the button
      const cf = el('div', 'confetti', box);
      const cols = [R.accent, R.em || '#FFE14D', '#ffffff', P[2], '#FF5C8A'];
      const bits = [];
      for (let i = 0; i < 80; i++) {
        const b = el('i', '', cf); b.style.background = cols[i % cols.length];
        const a = -Math.PI / 2 + (rnd() - .5) * 2.4, sp = 900 + rnd() * 1300;
        bits.push({ b, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: rnd() * 360, vr: (rnd() - .5) * 1400, sc: .6 + rnd() * .8 });
      }
      updaters.push(t => {
        const dt = t - sc.tclick;
        bits.forEach(o => {
          if (dt < 0) { o.b.style.opacity = 0; return; }
          const x = 540 + o.vx * dt, y = 1150 + o.vy * dt + 0.5 * 2600 * dt * dt;
          o.b.style.opacity = dt > 1.6 ? Math.max(0, 1 - (dt - 1.6) * 2) : 1;
          o.b.style.transform = `translate(${x}px,${y}px) rotate(${o.rot + o.vr * dt}deg) scale(${o.sc}) rotateX(${dt * 700}deg)`;
        });
      });
    },
  };

  const scenes = R.scenes.map((sc, i) => {
    const box = el('div', 'scene');
    build[sc.layout](sc, box);
    tl.fromTo(box, { opacity: 0, scale: 1.07, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .35, ease: 'power2.out' }, sc.tin);
    if (i < R.scenes.length - 1) tl.to(box, { opacity: 0, scale: .92, filter: 'blur(12px)', duration: .28, ease: 'power2.in' }, sc.tout - .28);
    return box;
  });

  // ---------------- captions ----------------
  const caps = el('div', 'caps');
  const shows = R.captions.map(ch => Math.max(0, ch.start - .05));
  R.captions.forEach((ch, ci) => {
    const d = el('div', 'chunk', caps);
    d.style.opacity = 0;
    ch.words.forEach(w => {
      const sp = el('span', '', d, w.w);
      const base = w.em ? (R.em || '#FFE14D') : '#ffffff';
      sp.style.color = base;
      tl.to(sp, { color: R.accent, scale: 1.06, duration: .07, ease: 'power1.out' }, w.start);
      tl.to(sp, { color: base, scale: 1, duration: .1 }, Math.max(w.end, w.start + .08));
    });
    tl.fromTo(d, { opacity: 0, scale: .82, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: .13, ease: 'back.out(3)', immediateRender: false }, shows[ci]);
    const hide = ci + 1 < shows.length ? Math.min(ch.end, shows[ci + 1]) : ch.end;
    tl.set(d, { opacity: 0 }, hide);
  });

  // keep the timeline at least as long as the reel
  tl.set({}, {}, R.total);

  window.seek = function (t) {
    tl.time(t, false);
    for (const u of updaters) u(t);
  };
  window.reelReady = Promise.all([
    document.fonts.ready,
    ...Array.from(document.images).map(im => im.decode().catch(() => null)),
  ]).then(() => { window.seek(0); return true; });
})();
