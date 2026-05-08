import qrcode
import os

BASE_URL = "https://superior-campus.vercel.app"
OUT_DIR  = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "qr")

os.makedirs(OUT_DIR, exist_ok=True)

# QR codes for physical locations around campus
QR_LOCATIONS = {
    "entrance":          "Entrance (Towards Medan)",
    "carbs_dept":        "Carbs Department",
    "boys_washroom":     "Boys Washroom",
    "emergency_exit":    "Emergency Exit",
    "sitting_area1":     "Sitting Area 1",
    "stairs_2":          "Stairs 2 (First Floor)",
    "computer_lab":      "Computer Lab",
    "library":           "Library",
    "sitting_area2":     "Sitting Area 2",
    "aerolab":           "Aerolab",
    "girls_washroom":    "Girls Washroom",
    "ahs_faculty":       "AHS Faculty",
    "aerolab2":          "Aerolab 2",
}

for node_id, label in QR_LOCATIONS.items():
    url = f"{BASE_URL}/portal?location={node_id}"
    qrcode.make(url).save(os.path.join(OUT_DIR, f"{node_id}.png"))
    print(f"✅ {label} → {url}")

print(f"\nGenerated {len(QR_LOCATIONS)} QR codes in: {OUT_DIR}")
