"""Phone screenshots of the demo app for the monitor slides.

    python3 showcase/tools/capture_app.py http://localhost:3000
Needs: pip install playwright pillow. Writes showcase/assets/app/*.png.

Each one is a full iPhone Pro Max screen, 1320 x 2868 (440 x 956 at 3x),
the size Apple's iPhone bezels expect: the app below an iOS-style status bar
(a lunchtime clock, full signal, Wi-Fi 2 of 3, battery around 60%), so the Dynamic Island sits in the status
bar instead of on top of the app's header.

It also imports today's sample MyCamu screenshots (frontend/public/demo-mess)
through the Mess tab, which fills today's mess menu on the demo. Reset the
demo afterwards (./demo.sh public --no-tunnel) so judges see the import
button.
"""
import io
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "showcase" / "assets" / "app"
SCALE = 3
W, H, BAR = 440, 956, 62          # points: screen size and status-bar height
OUT.mkdir(parents=True, exist_ok=True)
IST = timezone(timedelta(hours=5, minutes=30))

_font = TTFont(REPO / "frontend" / "app" / "fonts" / "inter-latin-600-normal.woff2")
_font.flavor = None
_buf = io.BytesIO()
_font.save(_buf)


def status_bar(color, clock, battery):
    """An iOS-style status bar in the colour of the app's top edge: the time,
    full mobile signal, Wi-Fi at 2 of 3 bars and the battery percentage."""
    w, h = W * SCALE, BAR * SCALE
    bar = Image.new("RGBA", (w, h), color)
    d = ImageDraw.Draw(bar)
    dark_bg = sum(color[:3]) / 3 < 140
    ink = (255, 255, 255, 255) if dark_bg else (0, 0, 0, 255)
    # Dimmed parts, pre-mixed with the background (no alpha on an RGB bar).
    faint = tuple(round(c * .35 + b * .65) for c, b in zip(ink[:3], color[:3])) + (255,)
    _buf.seek(0)
    d.text((int(w * 0.17), int(h * 0.56)), clock, font=ImageFont.truetype(_buf, 17 * SCALE), fill=ink, anchor="mm")
    y = int(h * 0.56)
    x = int(w * 0.72)
    for i in range(4):  # mobile signal: all four bars
        bh = (4 + i * 2.6) * SCALE
        d.rounded_rectangle((x + i * 5.5 * SCALE, y + 6 * SCALE - bh, x + i * 5.5 * SCALE + 3.6 * SCALE, y + 6 * SCALE), 1 * SCALE, fill=ink)
    x += 28 * SCALE
    for k, r in enumerate((11, 7, 3)):  # Wi-Fi: outer arc faint, so 2 of 3
        box = (x + (11 - r) * SCALE, y - r * SCALE + 4 * SCALE, x + (11 + r) * SCALE, y + r * SCALE + 4 * SCALE)
        d.arc(box, 225, 315, fill=faint if k == 0 else ink, width=int(2.4 * SCALE))
    x += 30 * SCALE
    bw, bh2 = 27 * SCALE, 13 * SCALE
    d.rounded_rectangle((x, y - bh2 / 2, x + bw, y + bh2 / 2), 4 * SCALE, fill=faint)
    fill_w = max(4 * SCALE, bw * battery / 100)
    d.rounded_rectangle((x, y - bh2 / 2, x + fill_w, y + bh2 / 2), 4 * SCALE, fill=ink)
    d.rounded_rectangle((x + bw + 1.5 * SCALE, y - 2.5 * SCALE, x + bw + 3 * SCALE, y + 2.5 * SCALE), 1 * SCALE, fill=faint)
    _buf.seek(0)
    # The percentage inside the battery, cut out of the fill (as on iOS).
    d.text((x + bw / 2, y + .5 * SCALE), str(battery), font=ImageFont.truetype(_buf, int(10.5 * SCALE)), fill=color + (255,) if len(color) == 3 else color, anchor="mm")
    return bar.convert("RGB")


# Screens are taken a minute or two apart around lunch, battery draining.
TIMELINE = iter([("12:38", 64), ("12:39", 64), ("12:41", 63), ("12:42", 62), ("12:44", 62), ("12:46", 61), ("12:47", 60), ("12:49", 60)])


def shot(page, name):
    page.wait_for_timeout(1200)
    # Hide the Next.js dev-mode badge, if this is a dev server.
    page.add_style_tag(content="nextjs-portal { display: none !important; }")
    app = Image.open(io.BytesIO(page.screenshot())).convert("RGB")
    full = Image.new("RGB", (W * SCALE, H * SCALE))
    clock, battery = next(TIMELINE)
    full.paste(status_bar(app.getpixel((app.width // 2, 2)), clock, battery), (0, 0))
    full.paste(app, (0, BAR * SCALE))
    full.save(OUT / f"{name}.png", optimize=True)
    print(name)


with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome")
    ctx = browser.new_context(viewport={"width": W, "height": H - BAR}, device_scale_factor=SCALE, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    today = datetime.now(IST).date()
    page.clock.install(time=datetime(today.year, today.month, today.day, 12, 38, tzinfo=IST))

    page.goto(BASE + "/", wait_until="networkidle")
    page.wait_for_timeout(2500)
    shot(page, "home")

    page.get_by_placeholder("Search dishes, drinks or stalls").first.fill("panner tika")
    shot(page, "search")

    page.get_by_text("Paneer Tikka Sandwich", exact=True).first.click()
    shot(page, "dish")
    page.keyboard.press("Escape")

    page.goto(BASE + "/", wait_until="networkidle")
    page.wait_for_timeout(1500)
    page.get_by_text("Can't decide?").first.click()
    page.wait_for_timeout(1500)
    deal = page.get_by_role("button", name="Deal me 10 dishes")
    if deal.count() and deal.first.is_enabled():
        deal.first.click()
        page.wait_for_timeout(1500)
    shot(page, "deal")

    # Import today's sample screenshots, as a visitor would.
    page.goto(BASE + "/mess", wait_until="networkidle")
    page.wait_for_timeout(1500)
    button = page.get_by_role("button", name="Fill from MyCamu screenshots")
    if button.count():
        day = page.evaluate("new Date().toLocaleDateString('en-US', {weekday: 'long', timeZone: 'Asia/Kolkata'}).toLowerCase()")
        files = [str(REPO / "frontend" / "public" / "demo-mess" / f"{day}-{n}.png") for n in (1, 2)]
        page.locator("input[type=file]").set_input_files(files)
        page.get_by_role("button", name="Add 4 meals").wait_for(timeout=120000)
        shot(page, "mess-review")
        page.get_by_role("button", name="Add 4 meals").click()
        page.wait_for_timeout(2500)
        print("imported", day)
    else:
        print("import button not shown: today's menu is already filled")
    page.goto(BASE + "/mess", wait_until="networkidle")
    shot(page, "mess")

    page.goto(BASE + "/demo-mess", wait_until="networkidle")
    shot(page, "demo-mess")
    browser.close()

# The MyCamu-style sample, at the same screen size, for the "screenshot in" phone.
sample = Image.open(REPO / "frontend" / "public" / "demo-mess" / "wednesday-1.png").convert("RGB")
sample.resize((W * SCALE, H * SCALE)).save(OUT / "mycamu-sample.png", optimize=True)
print("mycamu-sample")
