"""Sample mess-menu screenshots for the demo, one pair per weekday, each
marked DEMO. Laid out like MyCamu's mess-menu list (one card per meal), so the
Mess tab's "Fill from MyCamu screenshots" can read them. No MyCamu branding.

    python3 showcase/tools/make_mess_screens.py
Needs: pip install pillow fonttools brotli
Writes frontend/public/demo-mess/<day>-1.png (breakfast, lunch) and
<day>-2.png (snacks, dinner), served at demo.mealdeck.in/demo-mess.

The menus match the demo's simulated mess history (DemoHistorySeeder's
MESS_ROTATION); Wednesday is the real menu from 2026-11-18.
"""
import io
from pathlib import Path
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "frontend" / "public" / "demo-mess"
FONTS = REPO / "frontend" / "app" / "fonts"

MENUS = {
    "Monday": (["Aloo Paratha", "Curd", "Pickle", "Tea"], ["Chole", "Rice", "Roti", "Salad"], ["Samosa", "Tea"], ["Dal Tadka", "Paneer Butter Masala", "Rice", "Roti"]),
    "Tuesday": (["Poha", "Jalebi", "Tea"], ["Rajma", "Jeera Rice", "Roti", "Raita"], ["Bread Pakora", "Tea"], ["Kadhi", "Aloo Jeera", "Rice", "Roti"]),
    "Wednesday": (["Indoori Poha", "Green Chutney", "Egg Bhurji", "Veg Daliya", "Brown & White Bread", "Milk / Tea / Coffee"],
                  ["Aloo Jeera", "Kadhi Pakora", "Moong Dal", "Jeera Rice", "Roti", "Carrot Cucumber", "Sambar"],
                  ["Aloo Papdi Chaat", "Sweet & Green Chutney", "Tea", "Lemon Water"],
                  ["Keema Matar", "Petha Masala", "Dal Makhani", "Jeera Rice", "Roti", "Fruit Custard", "Dal Shorba"]),
    "Thursday": (["Idli", "Sambar", "Coconut Chutney", "Tea"], ["Dal Fry", "Mix Veg", "Rice", "Roti"], ["Pav Bhaji", "Tea"], ["Chicken Curry", "Matar Paneer", "Rice", "Roti"]),
    "Friday": (["Chole Bhature", "Tea"], ["Dal Makhani", "Aloo Gobi", "Rice", "Roti"], ["Veg Cutlet", "Tea"], ["Veg Biryani", "Raita", "Gulab Jamun"]),
    "Saturday": (["Upma", "Banana", "Tea"], ["Sambar", "Rice", "Cabbage Poriyal", "Curd"], ["Maggi", "Tea"], ["Egg Curry", "Dal", "Rice", "Roti"]),
    "Sunday": (["Puri Bhaji", "Tea"], ["Paneer Pulao", "Raita", "Papad"], ["Pakora", "Tea"], ["Chicken Biryani", "Veg Biryani", "Raita", "Ice Cream"]),
}
TIMES = {"Breakfast": "07:30 AM - 09:30 AM", "Lunch": "12:00 PM - 03:00 PM", "Snacks": "04:30 PM - 06:00 PM", "Dinner": "07:30 PM - 09:30 PM"}

W, H = 1080, 2340


def font(name, size):
    """PIL can't read woff2: convert the app's own fonts in memory."""
    f = TTFont(FONTS / name)
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


BOLD = lambda s: font("inter-latin-700-normal.woff2", s)
SEMI = lambda s: font("inter-latin-600-normal.woff2", s)
REG = lambda s: font("inter-latin-400-normal.woff2", s)


def card(draw, y, day, meal, dishes):
    x0, x1 = 40, W - 40
    line_h = 58
    h = 120 + 64 + line_h * (len(dishes) - 1) + 110
    draw.rounded_rectangle((x0, y, x1, y + h), 28, fill="white", outline="#E1E4EA", width=2)
    draw.text((x0 + 40, y + 36), f"{meal}  {TIMES[meal]}", font=BOLD(40), fill="#1F2937")
    draw.rounded_rectangle((x1 - 150, y + 30, x1 - 30, y + 84), 10, fill="#DC2626")
    draw.text((x1 - 90, y + 57), "DEMO", font=BOLD(30), fill="white", anchor="mm")
    yy = y + 120
    draw.text((x0 + 40, yy), f"{meal}({day[:3]})-{dishes[0]}", font=REG(38), fill="#374151")
    for dish in dishes[1:]:
        yy += line_h
        draw.text((x0 + 40, yy), dish, font=REG(38), fill="#374151")
    yy += 84
    draw.text((x0 + 40, yy), day, font=BOLD(44), fill="#0B5566")
    bw = 170
    draw.rounded_rectangle((x1 - 40 - bw, yy - 10, x1 - 40, yy + 52), 12, outline="#1D4ED8", width=3)
    draw.text((x1 - 40 - bw / 2, yy + 21), "Select", font=SEMI(34), fill="#1D4ED8", anchor="mm")
    return y + h + 36


def watermark(img):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    big = BOLD(230)
    for cy in (650, 1350, 2050):
        tile = Image.new("RGBA", (1100, 300), (0, 0, 0, 0))
        ImageDraw.Draw(tile).text((550, 150), "DEMO", font=big, fill=(220, 38, 38, 34), anchor="mm")
        tile = tile.rotate(28, expand=True)
        layer.alpha_composite(tile, (W // 2 - tile.width // 2, cy - tile.height // 2))
    # A solid ribbon across the top, where there's no menu text.
    d.rectangle((0, 110, W, 190), fill=(220, 38, 38, 255))
    d.text((W // 2, 150), "DEMO SCREENSHOT · sample menu for MealDeck", font=BOLD(36), fill="white", anchor="mm")
    img.alpha_composite(layer)


def screen(day, meals):
    img = Image.new("RGBA", (W, H), "#F3F4F6")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, W, 110), fill="white")
    d.text((60, 55), "9:41", font=SEMI(36), fill="#111827", anchor="lm")
    d.rectangle((0, 190, W, 330), fill="white")
    d.text((60, 260), "Mess Menu", font=BOLD(52), fill="#111827", anchor="lm")
    watermark(img)
    d = ImageDraw.Draw(img)
    y = 370
    for meal, dishes in meals:
        y = card(d, y, day, meal, dishes)
    # Bottom navigation bar: the parser stops reading here.
    d.rectangle((0, H - 170, W, H), fill="white")
    d.line((0, H - 170, W, H - 170), fill="#E5E7EB", width=2)
    for i, label in enumerate(["Home", "Apps", "Accessibility", "Settings"]):
        d.text(((i + .5) * W / 4, H - 85), label, font=REG(30), fill="#6B7280", anchor="mm")
    return img.convert("RGB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    names = ["Breakfast", "Lunch", "Snacks", "Dinner"]
    for day, menu in MENUS.items():
        meals = list(zip(names, menu))
        screen(day, meals[:2]).save(OUT / f"{day.lower()}-1.png", optimize=True)
        screen(day, meals[2:]).save(OUT / f"{day.lower()}-2.png", optimize=True)
        print(day)


if __name__ == "__main__":
    main()
