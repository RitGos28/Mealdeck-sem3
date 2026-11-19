"""Records the demo flow as a phone-screen video for the monitor loop:
typo search, a dish's details, Deal me a dish, and the mess import from the
sample MyCamu screenshots.

    python3 showcase/tools/record_demo.py http://localhost:3000
Needs: pip install playwright pillow fonttools brotli; python -m playwright
install ffmpeg (the recorder). Writes showcase/assets/app/demo.webm and
demo.json (where the useful part starts and how long it runs).

Run it on a freshly reset demo (./demo.sh public --no-tunnel): the import
needs today's mess menu to be empty. It fills the menu, so reset again
before judges arrive.
"""
import json
import shutil
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "showcase" / "assets" / "app"
TMP = REPO / "showcase" / ".video-tmp"
W, H, BAR = 440, 956, 62
IST = timezone(timedelta(hours=5, minutes=30))

shutil.rmtree(TMP, ignore_errors=True)
with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome")
    ctx = browser.new_context(
        viewport={"width": W, "height": H - BAR}, device_scale_factor=2, is_mobile=True, has_touch=True,
        # Same size as the viewport: a bigger size pads the page instead of scaling it.
        record_video_dir=str(TMP), record_video_size={"width": W, "height": H - BAR},
    )
    t0 = time.monotonic()
    page = ctx.new_page()
    today = datetime.now(IST).date()
    page.clock.install(time=datetime(today.year, today.month, today.day, 12, 40, tzinfo=IST))
    pause = page.wait_for_timeout

    page.goto(BASE + "/", wait_until="networkidle")
    pause(1500)
    start = time.monotonic() - t0          # first useful frame: the home page
    pause(1500)

    # 1. Search with a typo.
    box = page.get_by_placeholder("Search dishes, drinks or stalls").first
    box.click()
    box.press_sequentially("panner tika", delay=140)
    pause(2500)
    page.mouse.wheel(0, 500)
    pause(1500)

    # 2. A dish's details: votes, similar for less.
    page.get_by_text("Paneer Tikka Sandwich", exact=True).first.click()
    pause(3500)
    page.keyboard.press("Escape")
    pause(600)

    # 3. Deal me a dish: keep drinks, skip food.
    page.goto(BASE + "/", wait_until="networkidle")
    pause(1200)
    page.get_by_text("Can't decide?").first.click()
    pause(1500)
    page.get_by_role("button", name="Deal me 10 dishes").first.click()
    pause(1500)
    for i in range(5):
        page.get_by_role("button", name="Keep" if i % 2 == 0 else "Skip").first.click()
        pause(1100)
    pause(800)

    # 4. Mess menu from the sample screenshots.
    page.goto(BASE + "/mess", wait_until="networkidle")
    pause(1800)
    day = today.strftime("%A").lower()
    files = [str(REPO / "frontend" / "public" / "demo-mess" / f"{day}-{n}.png") for n in (1, 2)]
    page.locator("input[type=file]").set_input_files(files)
    add = page.get_by_role("button", name="Add 4 meals")
    add.wait_for(timeout=120000)
    pause(2500)
    add.click()
    pause(3500)
    end = time.monotonic() - t0

    video = page.video
    ctx.close()
    src = Path(video.path())
    browser.close()

OUT.mkdir(parents=True, exist_ok=True)
shutil.move(str(src), OUT / "demo.webm")
shutil.rmtree(TMP, ignore_errors=True)
(OUT / "demo.json").write_text(json.dumps({"start": round(start, 1), "end": round(end, 1)}))
# Point the slideshow's video slide at the new clip's useful part.
import re
for name in ("index.html", "tv.html"):
    slides = REPO / "showcase" / "slides" / name
    html = re.sub(r'data-start="[0-9.]+" data-end="[0-9.]+"', f'data-start="{start:.1f}" data-end="{end:.1f}"', slides.read_text())
    slides.write_text(html)
print("demo.webm", round(start, 1), round(end, 1))
