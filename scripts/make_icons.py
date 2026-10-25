"""Regenerate the app icons into standalone/.  Needs: pip install playwright && playwright install chromium"""
from pathlib import Path
import asyncio
from playwright.async_api import async_playwright
svg=lambda pad:f'''<html><body style="margin:0"><svg width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0071e3"/><g transform="translate(256 256) scale({pad}) translate(-12 -12)" fill="none" stroke="#fff" stroke-width="1.4"><ellipse cx="12" cy="12" rx="10.5" ry="4.2"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.9" fill="#fff" stroke="none"/></g></svg></body></html>'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for n,sz in[('icon-512',512),('icon-192',192),('icon-180',180)]:
            pg=await b.new_page(viewport={'width':sz,'height':sz})
            await pg.set_content(svg(15.5).replace('width="512" height="512"',f'width="{sz}" height="{sz}"',1))
            await pg.screenshot(path=str(Path(__file__).resolve().parent.parent/'standalone'/(n+'.png')));await pg.close()
        await b.close()
asyncio.run(main())
