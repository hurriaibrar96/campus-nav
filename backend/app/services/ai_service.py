import json, os
from app.services.navigation_service import get_path, get_all_locations

_fallback_path = os.path.join(os.path.dirname(__file__), "intent_fallback.json")
with open(_fallback_path) as f:
    DATA = json.load(f)

INTENTS   = DATA["intents"]
LOCATIONS = DATA["locations"]
RESP      = DATA["responses"]

_sessions: dict = {}

def _match_location(text: str) -> str | None:
    text = text.lower()
    for node_id, aliases in LOCATIONS.items():
        if any(alias in text for alias in aliases):
            return node_id
    return None

def _match_all_locations(text: str) -> list:
    text = text.lower()
    found = []
    for node_id, aliases in LOCATIONS.items():
        if any(alias in text for alias in aliases):
            found.append(node_id)
    return found

def _match_intent(text: str) -> str | None:
    text = text.lower()
    for intent, phrases in INTENTS.items():
        if any(p in text for p in phrases):
            return intent
    return None

def _text(reply: str) -> dict:
    return {"type": "text", "reply": reply}

def _format_path(path: list) -> dict:
    all_locs = {l["id"]: l for l in get_all_locations()}
    steps = []
    for i, node_id in enumerate(path):
        loc = all_locs.get(node_id, {})
        direction = ""
        if i < len(path) - 1:
            next_id   = path[i + 1]
            neighbors = loc.get("neighbors", {})
            dir_val   = neighbors.get(next_id, {})
            direction = dir_val.get("direction", "") if isinstance(dir_val, dict) else ""
        steps.append({"id": node_id, "label": loc.get("label", node_id), "direction": direction})
    return {"type": "route", "steps": steps}

async def get_response(message: str, session_id: str, current_location: str = "") -> dict:
    text    = message.lower().strip()
    session = _sessions.get(session_id, {})

    # Waiting for destination after being asked
    if session.get("step") == "ask_dest":
        dest = _match_location(text)
        if not dest:
            return _text(RESP["not_found"])
        start = session.get("from") or current_location
        _sessions.pop(session_id, None)
        if start == dest:
            return _text(RESP["same_location"])
        path = get_path(start, dest)
        return _format_path(path) if path else _text(RESP["no_path"])

    # Always try to find a destination in the message first
    matched = _match_all_locations(text)
    if matched:
        # If two locations mentioned: first = start, last = dest
        dest  = matched[-1]
        start = matched[0] if len(matched) >= 2 else (current_location or "")
        if not start:
            _sessions[session_id] = {"step": "ask_start", "to": dest}
            return _text(RESP["ask_start"])
        if start == dest:
            return _text(RESP["same_location"])
        path = get_path(start, dest)
        return _format_path(path) if path else _text(RESP["no_path"])

    intent = _match_intent(text)

    if intent == "greeting":
        return _text(RESP["greeting"])

    if intent == "help":
        return _text(RESP["help"])

    if intent == "where":
        _sessions[session_id] = {"step": "ask_dest", "from": current_location}
        return _text(RESP["ask_dest"])

    return _text(RESP["fallback"])
