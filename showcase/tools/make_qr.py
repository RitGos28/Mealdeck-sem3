"""QR codes for the showcase print-outs, as SVG (sharp at any print size).

    python3 showcase/tools/make_qr.py
Needs: pip install qrcode
"""
from pathlib import Path
import qrcode, qrcode.image.svg

OUT = Path(__file__).resolve().parent.parent / "assets" / "qr"
CODES = {
    "demo": "https://demo.mealdeck.in/?src=qr",
    "site": "https://mealdeck.in/?src=qr",
    "mess": "https://demo.mealdeck.in/demo-mess?src=qr",
}
OUT.mkdir(parents=True, exist_ok=True)
for name, url in CODES.items():
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0, box_size=10)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
    svg = img.to_string(encoding="unicode")
    # One colour, deck green, no white box (the page behind it is light).
    svg = svg.replace('fill="#000000"', 'fill="#163D29"').replace("fill:#000000", "fill:#163D29")
    (OUT / f"{name}.svg").write_text(svg)
    print(name, url)
