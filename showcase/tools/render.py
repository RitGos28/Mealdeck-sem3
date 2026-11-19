"""Render the showcase HTML into print-ready PDFs and PNGs, using Chrome.

    python3 showcase/tools/render.py            # everything
    python3 showcase/tools/render.py posters    # one group

Needs: pip install playwright (uses the installed Google Chrome, no download).
Output goes to showcase/out/.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"

# (group, source html, output name, kind, size)
JOBS = [
    ("posters", "posters/hero.html", "poster-1-hero", "pdf", None),
    ("posters", "posters/ml.html", "poster-2-ml", "pdf", None),
    ("posters", "posters/wait.html", "poster-3-31min", "pdf", None),
    ("posters", "posters/testers.html", "poster-4-android-testers", "pdf", None),
    ("kit", "print-kit/tester-signup.html", "tester-signup-sheet", "pdf", None),
    ("kit", "print-kit/deck-cards.html", "kit-1-deck-cards", "pdf", None),
    ("kit", "print-kit/stickers.html", "kit-2-stickers", "pdf", None),
    ("kit", "print-kit/table-tent.html", "kit-3-table-tent", "pdf", None),
    ("kit", "print-kit/bunting.html", "kit-4-bunting", "pdf", None),
    ("slides", "slides/index.html", "slides-27in", "slides", (2560, 1440)),
    ("slides", "slides/tv.html", "slides-tv", "slides", (1920, 1080)),
    ("slides", "slides/tech.html", "slides-tech", "slides", (2560, 1440)),
    ("splash", "slides/splash.html", "splash-mac-2560x1664", "png", (2560, 1664)),
    ("splash", "slides/splash.html", "splash-2560x1440", "png", (2560, 1440)),
    ("splash", "slides/splash.html", "splash-1920x1080", "png", (1920, 1080)),
]


def main(groups):
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        for group, src, name, kind, size in JOBS:
            if groups and group not in groups:
                continue
            path = ROOT / src
            if not path.exists():
                print("skip (missing)", src)
                continue
            page = browser.new_page(viewport={"width": size[0], "height": size[1]} if size else None)
            page.goto(path.as_uri() + ("?print=1" if kind == "slides" else ""))
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(400)
            if kind == "pdf":
                page.pdf(path=str(OUT / f"{name}.pdf"), prefer_css_page_size=True, print_background=True)
                # A preview PNG of the first page, for a quick look.
                page.set_viewport_size({"width": 1240, "height": 1754})
                page.screenshot(path=str(OUT / f"{name}.png"), full_page=False)
                print("pdf ", name)
            elif kind == "png":
                page.screenshot(path=str(OUT / f"{name}.png"))
                print("png ", name)
            else:
                # One PNG per slide, for Keynote / Google Slides / a USB stick.
                count = page.evaluate("window.slideCount()")
                for i in range(count):
                    page.evaluate(f"window.showSlide({i})")
                    page.wait_for_timeout(300)
                    page.screenshot(path=str(OUT / f"{name}-{i + 1:02d}.png"))
                print("png ", name, count, "slides")
            page.close()
        browser.close()


if __name__ == "__main__":
    main(set(sys.argv[1:]))
