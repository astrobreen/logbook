"""Build the standalone (offline) app from src/app.html.

Usage:  python scripts/build.py
Output: docs/  (index.html plus the PWA files; ready for GitHub Pages)
"""
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "app.html"
SA = ROOT / "standalone"
OUT = ROOT / "docs"


def once(s, a, b):
    n = s.count(a)
    if n != 1:
        raise SystemExit(f"Expected exactly one match for {a[:60]!r}, found {n}")
    return s.replace(a, b)


def build():
    src = SRC.read_text(encoding="utf-8")
    shim = (SA / "shim.js").read_text(encoding="utf-8")
    loc = (SA / "local.js").read_text(encoding="utf-8")

    # 1. Local data layer replaces the hosted database.
    s = once(src, "<script>\n", "<script>\n" + shim + "\n</script>\n<script>\n")
    # 2. Offline-only features (feedback writer, coach, sync, folder backup).
    start = "(async()=>{render();let user=null;"
    s = once(s, start, loc + "\n" + start)
    # 3. Data/sharing card in Setup.
    b = "<fieldset class=\"fs card\" ${adm()?'':'disabled'}><h3>Backup</h3>"
    s = once(s, b, "${dataCard()}" + b)
    # 4. Installable web app (manifest, icons, service worker).
    head = ('<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#0071e3">'
            '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
            '<meta name="apple-mobile-web-app-title" content="SIC Logbook"><link rel="apple-touch-icon" href="icon-180.png">')
    s = once(s, "<title>SIC Logbook</title>", "<title>SIC Logbook</title>" + head)
    s = once(s, "</script></body></html>",
             "if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))"
             "navigator.serviceWorker.register('sw.js').catch(()=>{});\n</script></body></html>")

    OUT.mkdir(exist_ok=True)
    (OUT / "index.html").write_text(s, encoding="utf-8")
    for f in ["sw.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"]:
        shutil.copy(SA / f, OUT / f)
    (OUT / ".nojekyll").write_text("")
    print(f"Built {OUT / 'index.html'} ({len(s.encode('utf-8')):,} bytes)")


if __name__ == "__main__":
    build()
