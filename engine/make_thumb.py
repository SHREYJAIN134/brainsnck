"""BrainSnck thumbnail maker: script JSON -> 1080x1920 JPEG cover image in the reel's style.

usage: python3 make_thumb.py script.json out.jpg

Uses the script's optional "thumb" block: {"title": "3 space facts that sound *fake*", "icon": ..., "minis": [...],
"badge": "DID YOU KNOW?"}. Anything missing falls back to the script title and the hook scene's icons.
"""
import json, os, shutil, sys

import make_reel as mr


def build_thumb(spec, build_dir):
    theme = spec.get('theme', 'bokeh')
    palette, accent = mr.THEMES[theme]
    hook = next((s for s in spec['scenes'] if s.get('layout') == 'hook'), spec['scenes'][0])
    t = dict(spec.get('thumb') or {})
    t.setdefault('title', spec['title'])
    t['icon'] = mr.resolve_icon(t.get('icon') or hook['icon'])
    t['minis'] = [mr.resolve_icon(m) for m in (t.get('minis') if 'minis' in t else hook.get('minis', []))]
    seed = sum(ord(c) for c in spec.get('title', 'x')) * 7919 + 13
    data = {'mode': 'thumb', 'seed': seed % 2147483646 + 1, 'theme': theme, 'palette': palette, 'accent': accent,
            'em': '#FFE14D', 'series': spec.get('series', 'BrainSnck'), 'thumb': t}
    for f in ('engine.html', 'engine.js', 'gsap.min.js'):
        shutil.copy(os.path.join(mr.HERE, f), build_dir)
    os.replace(os.path.join(build_dir, 'engine.html'), os.path.join(build_dir, 'index.html'))
    shutil.copytree(os.path.join(mr.HERE, 'fonts'), os.path.join(build_dir, 'fonts'), dirs_exist_ok=True)
    os.makedirs(os.path.join(build_dir, 'icons'), exist_ok=True)
    for fn in os.listdir(mr.CACHE):
        shutil.copy(os.path.join(mr.CACHE, fn), os.path.join(build_dir, 'icons', fn))
    with open(os.path.join(build_dir, 'data.js'), 'w') as f:
        f.write('window.REEL = ' + json.dumps(data) + ';')


if __name__ == '__main__':
    spec_path, out_path = sys.argv[1], sys.argv[2]
    spec = json.load(open(spec_path))
    build_dir = os.path.abspath(os.path.splitext(out_path)[0] + '_build')
    os.makedirs(build_dir, exist_ok=True)
    build_thumb(spec, build_dir)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser, page = mr.open_page(p, build_dir)
        page.screenshot(path=out_path, type='jpeg', quality=92)
        browser.close()
    print('done', out_path)
