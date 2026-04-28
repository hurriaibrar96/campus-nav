# Campus AR Navigation System

AI-powered AR/VR indoor navigation for a university campus (single floor).
No app installation required — fully web-based.

## Stack
- **Frontend**: React + Vite + PWA
- **Backend**: FastAPI + MongoDB
- **AR**: Canvas-based camera overlay with directional arrows
- **VR**: Canvas 2D bird's-eye floor map
- **Auth**: JWT (role-based: student / admin)

## Features
- QR code scanning → instant navigation
- AI chatbot with natural language understanding
- AR camera overlay with step-by-step arrows
- VR floor map with route highlighting
- Role-based access (student / admin)
- Admin dashboard: user management, stats
- Offline support via PWA service worker
- Auto logout on expired token

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Generate QR Codes
```bash
cd scripts
pip install qrcode[pil]
python generate_qr.py
```

## Roles
| Role    | Access |
|---------|--------|
| student | /portal — navigate, chatbot, AR, floor map |
| admin   | /admin — dashboard, user management |

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /user/register | Register new user |
| POST | /user/login | Login, returns JWT |
| GET  | /user/me | Current user info |
| GET  | /navigation/locations | All campus nodes |
| GET  | /navigation/route?start=&end= | Dijkstra route |
| POST | /chatbot | AI chatbot message |
| GET  | /admin/dashboard | Stats (admin only) |
| GET  | /admin/users | List users (admin only) |
| PATCH| /admin/users/{id}/role | Change role (admin only) |
| DELETE| /admin/users/{id} | Delete user (admin only) |

## Campus Map Nodes
`entrance` → `hallway_main` → `hallway_left` / `hallway_right` / `basketball_court`
- Left: room_101, room_102, room_103
- Right: room_104, room_105, room_106
