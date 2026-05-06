import qrcode
import os

BASE_URL = "https://superior-campus.vercel.app"
OUT_DIR  = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "qr")

os.makedirs(OUT_DIR, exist_ok=True)

# Only generate QR codes for these specific locations
QR_LOCATIONS = {
    "entrance":    "Entrance (Towards Medan)",
    "stairs_2":    "Stairs 2",
    "library_gate1": "Library Gate 1",
    "aerolab":     "Aerolab",
    "ahs_faculty": "AHS Faculty",
}

for node_id, label in QR_LOCATIONS.items():
    url = f"{BASE_URL}/?location={node_id}"
    qrcode.make(url).save(os.path.join(OUT_DIR, f"{node_id}.png"))
    print(f"✅ {label} → {url}")

print(f"\nGenerated {len(QR_LOCATIONS)} QR codes in: {OUT_DIR}")
