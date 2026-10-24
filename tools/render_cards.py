#!/usr/bin/env python3
"""Render every card of the game in one style of the card studio (art/) into web/img/, as the game's art.

usage: python3 tools/render_cards.py [STYLE] [--scale 1.5] [--quality 82]      (STYLE defaults to paper)

Each card side is saved as web/img/cards/<card>_p.webp (passive) or <card>_i.webp (ignited), and each
expansion symbol as web/img/icons/<expansion>.webp.
Needs Pillow and Playwright with Chromium:  pip install pillow playwright && playwright install chromium
"""
import argparse
import asyncio
import io
import pathlib
import shutil

from PIL import Image
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent

MOUNT_CARD = """async ([style, id, side]) => {
  const out = document.getElementById('out');
  out.replaceChildren();
  out.className = 'single';
  await AIBArt.mount(out, style, id, side);
}"""
MOUNT_ICON = """async ([style, key]) => {
  const out = document.getElementById('out');
  out.replaceChildren();
  out.className = 'single';
  const box = await AIBArt.mountIcon(out, style, key);
  box.style.width = box.style.height = '96px';
}"""


def save(png, path, lossless, quality):
    im = Image.open(io.BytesIO(png))
    im.save(path, 'WEBP', lossless=lossless, quality=100 if lossless else quality, method=6)


async def render(style, scale, quality):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(device_scale_factor=scale, viewport={'width': 800, 'height': 900})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto((ROOT / 'art' / 'studio.html').as_uri() + '?view=none')
        await page.wait_for_selector('html[data-ready]', state='attached', timeout=120000)
        info = await page.evaluate("""() => ({
            cards: AIB.INST_LIST.map(i => i.id),
            exps: Object.keys(AIB.EXPANSIONS),
            styles: Object.fromEntries(Object.values(AIBArt.styles).map(s => [s.id, !!s.lossless])),
        })""")
        await page.evaluate("() => { document.body.style.background = 'transparent'; }")
        if style not in info['styles']:
            raise SystemExit(f"unknown style '{style}' (styles: {', '.join(info['styles'])})")
        lossless = info['styles'][style]
        out = ROOT / 'web' / 'img'
        for sub in ('cards', 'icons'):
            shutil.rmtree(out / sub, ignore_errors=True)
            (out / sub).mkdir(parents=True)
        for cid in info['cards']:
            for side in 'pi':
                await page.evaluate(MOUNT_CARD, [style, cid, side])
                png = await page.locator('#out .card').screenshot()
                save(png, out / 'cards' / f'{cid}_{side}.webp', lossless, quality)
        for key in info['exps']:
            await page.evaluate(MOUNT_ICON, [style, key])
            png = await page.locator('#out .iconbox').screenshot(omit_background=True)
            save(png, out / 'icons' / f'{key}.webp', lossless, quality)
        size = sum(f.stat().st_size for d in ('cards', 'icons') for f in (out / d).glob('*.webp'))
        print(f'{style}: {2 * len(info["cards"])} card sides, {len(info["exps"])} icons, {size / 1e6:.1f} MB in {out.relative_to(ROOT)}')
        await browser.close()
        if errors:
            raise SystemExit('page errors:\n' + '\n'.join(errors))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('style', nargs='?', default='paper', help='style id, as in art/styles/ (default: paper)')
    ap.add_argument('--scale', type=float, default=1.5, help='image pixels per card pixel (cards are 400 x 601)')
    ap.add_argument('--quality', type=int, default=82, help='WebP quality for lossy styles')
    a = ap.parse_args()
    asyncio.run(render(a.style, a.scale, a.quality))


if __name__ == '__main__':
    main()
