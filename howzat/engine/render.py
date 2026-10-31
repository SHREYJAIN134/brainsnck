"""Render the canvas animation.
usage: python3 render.py preview 4.6,11.7,...   -> preview/f_<t>.jpg
       python3 render.py render <duration>       -> out/video.mp4 (silent)
"""
import asyncio, base64, os, subprocess, sys
from playwright.async_api import async_playwright

FPS = 30
HERE = os.path.dirname(os.path.abspath(__file__))


async def main():
    mode = sys.argv[1]
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1080, 'height': 1920})
        await pg.goto('file://' + os.path.join(HERE, 'index.html'))
        await pg.wait_for_function('window.ready === true && window.logoOK === true', timeout=30000)
        if mode == 'preview':
            for t in [float(x) for x in sys.argv[2].split(',')]:
                d = await pg.evaluate('(t) => { draw(t); return cv.toDataURL("image/jpeg", 0.9); }', t)
                with open(os.path.join(HERE, 'preview', f'f_{t:05.2f}.jpg'), 'wb') as f:
                    f.write(base64.b64decode(d.split(',')[1]))
        else:
            dur = float(sys.argv[2])
            n = int(round(dur * FPS))
            tmp = os.path.join(HERE, 'out', 'video_tmp.mp4')
            ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS),
                                   '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
                                   '-pix_fmt', 'yuv420p', '-r', str(FPS), '-movflags', '+faststart', tmp],
                                  stdin=subprocess.PIPE)
            B = 15
            for i0 in range(0, n, B):
                ts = [i / FPS for i in range(i0, min(n, i0 + B))]
                arr = await pg.evaluate('(ts) => ts.map(t => { draw(t); return cv.toDataURL("image/jpeg", 0.92); })', ts)
                for d in arr:
                    ff.stdin.write(base64.b64decode(d.split(',')[1]))
            ff.stdin.close()
            rc = ff.wait()
            if rc == 0:
                os.replace(tmp, os.path.join(HERE, 'out', 'video.mp4'))
            print('frames', n, 'rc', rc)
        await b.close()

asyncio.run(main())
