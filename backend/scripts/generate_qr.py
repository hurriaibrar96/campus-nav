import qrcode
import os

BASE_URL = "https://superior-campus.vercel.app"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR    = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "frontend", "public", "qr"))

os.makedirs(OUT_DIR, exist_ok=True)

QR_LOCATIONS = {
    "entrance":      "Entrance (Towards Medan)",
    "stairs_2":      "Stairs 2 (First Floor)",
    "library_gate1": "Library Gate 1",
    "aerolab":       "Aerolab",
    "ahs_faculty":   "AHS Faculty",
}

for node_id, label in QR_LOCATIONS.items():
    url = f"{BASE_URL}/?location={node_id}"
    qrcode.make(url).save(os.path.join(OUT_DIR, f"{node_id}.png"))
    print(f"OK: {label} -> {url}")

print(f"\nGenerated {len(QR_LOCATIONS)} QR codes in: {OUT_DIR}")
