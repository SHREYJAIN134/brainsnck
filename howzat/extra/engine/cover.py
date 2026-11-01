import asyncio, base64, os, sys
from playwright.async_api import async_playwright
V1 = r"""() => {
  background();
  // title
  ctx.save(); ctx.lineJoin = 'round';
  const T = (s, x, y, size, col) => { ctx.font = `800 ${size}px ${SANS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 16; ctx.strokeStyle = '#0b0c0e'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); };
  T('FULL SQUAT', 540, 390, 124, C.lime);
  T('HALF SQUAT', 540, 640, 124, C.purp);
  ctx.restore();
  ctx.save(); ctx.translate(540, 515); ctx.rotate(-0.08);
  ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(0, 0, 62, 0, Math.PI * 2); ctx.fill();
  txt('VS', 0, 4, `800 56px ${SANS}`, '#16181c'); ctx.restore();
  // figures
  const S = 185, gy = 1290;
  ground(40, 1040, gy);
  const p1 = pose(290, gy, S, 140), p2 = pose(800, gy, S, 90);
  figure(p1, { m: { glute: 1, add: 1 } }); figure(p2, { m: { glute: 0.55 } });
  angleArc(p1.K, p1.H, p1.A, 0.38 * S, C.lime, ''); angleArc(p2.K, p2.H, p2.A, 0.38 * S, C.purp, '');
  txt('140°', p1.K.x + 0.6 * S, p1.K.y - 0.5 * S, `800 58px ${SANS}`, C.lime);
  txt('90°', p2.K.x + 0.55 * S, p2.K.y - 0.5 * S, `800 58px ${SANS}`, C.purp);
  // payoff pill
  ctx.save(); ctx.translate(540, 1440); ctx.rotate(-0.03);
  ctx.font = `800 64px ${SANS}`; const w = ctx.measureText('Glutes 3× zyada badhe!').width + 70;
  rr(-w / 2, -60, w, 120, 60); ctx.fillStyle = C.yel; ctx.fill();
  txt('Glutes 3× zyada badhe!', 0, 4, `800 64px ${SANS}`, '#16181c'); ctx.restore();
  txt('MRI study · Kubo et al. 2019', 540, 1550, `600 30px ${SANS}`, C.dim);
  return cv.toDataURL('image/jpeg', 0.93);
}"""
V3 = r"""() => {
  background();
  outlineText('Muscle gym me', 540, 390, 108, '#ffffff');
  bigPill('NAHI banta!', 540, 545, C.red, 1, 100, -0.035);
  ctx.save(); ctx.translate(0, 300);
  sHook(CK('gym ke BAAD') + 1.6);
  ctx.restore();
  bigPill('Gym ke BAAD ✓', 540, 1430, C.org, 1, 72, 0.03);
  txt('mTOR · 48 ghante · 1.6 g protein', 540, 1560, `700 32px ${SANS}`, 'rgba(240,232,220,0.75)');
  return cv.toDataURL('image/jpeg', 0.93);
}"""
async def shot(pg, page, js, out):
    await pg.goto('file://' + os.path.abspath(page))
    await pg.wait_for_function('window.ready === true && window.logoOK === true', timeout=30000)
    d = await pg.evaluate(js)
    open(out, 'wb').write(base64.b64decode(d.split(',')[1]))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
        await shot(pg, 'index.html', V1, 'out/thumbnail_video1_full_vs_half_squat.jpg')
        await shot(pg, 'index3d.html', V3, 'out/thumbnail_video3_muscle_growth.jpg')
        await b.close()
asyncio.run(main())
