# API Documentation

## Chatbot
- `POST /chatbot` — `{ "message": "string" }` → `{ "reply": "string" }`

## Navigation
- `GET /navigation/route?start=entrance&end=library` → `{ "path": ["entrance", "library"] }`

## User
- `GET /user/me` → `{ "user": "..." }`

## Admin
- `GET /admin/dashboard` → `{ "status": "ok" }`
