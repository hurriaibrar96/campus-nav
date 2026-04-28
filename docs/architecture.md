# Architecture

## Overview
- React frontend handles UI, AR/VR views, and chatbot interface
- FastAPI backend handles routing, auth (JWT), and AI responses
- MongoDB stores users, queries, and location data
- AR.js + A-Frame power the AR/VR navigation overlays

## Data Flow
1. User scans QR → Portal.jsx loads with `?location=node_id`
2. Frontend calls `/navigation/route?start=X&end=Y`
3. Backend runs Dijkstra on `campus_map.json`
4. Path returned → AR overlay renders arrows via `navigationOverlay.js`
