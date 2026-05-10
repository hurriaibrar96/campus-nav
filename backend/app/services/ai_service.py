import json, os
from app.services.navigation_service import get_path, get_all_locations

_fallback_path = os.path.join(os.path.dirname(__file__), "intent_fallback.json")
with open(_fallback_path) as f:
    DATA = json.load(f)

INTENTS   = DATA["intents"]
LOCATIONS = DATA["locations"]
RESP      = DATA["responses"]

# In-memory session store: { session_id: { "step": "ask_dest"|"done", "from": node_id } }
_sessions: dict = {}

def _match_location(text: str) -> str | None:
    text = text.lower()
    for node_id, aliases in LOCATIONS.items():
        if any(alias in text for alias in aliases):
            return node_id
    return None

def _match_intent(text: str) -> str | None:
    text = text.lower()
    for intent, phrases in INTENTS.items():
        if any(p in text for p in phrases):
            return intent
    return None

def _format_path(path: list) -> str:
    all_locs = {l["id"]: l["label"] for l in get_all_locations()}
    steps = " → ".join(all_locs.get(n, n) for n in path)
    return f"Here's your route:\n{steps}"

async def get_response(message: str, session_id: str, current_location: str = "") -> str:
    text    = message.lower().strip()
    session = _sessions.get(session_id, {})

    # Step 2: waiting for destination
    if session.get("step") == "ask_dest":
        dest = _match_location(text)
        if not dest:
            return RESP["not_found"]
        start = session.get("from") or current_location
        _sessions.pop(session_id, None)
        if start == dest:
            return RESP["same_location"]
        path = get_path(start, dest)
        return _format_path(path) if path else RESP["no_path"]

    # Always check for a destination first — handles "hi i want to go to stairs 2" in one shot
    dest = _match_location(text)
    if dest:
        if dest == current_location:
            return RESP["same_location"]
        if current_location:
            path = get_path(current_location, dest)
            return _format_path(path) if path else RESP["no_path"]
        # destination known but no current location scanned yet
        _sessions[session_id] = {"step": "ask_dest", "from": ""}
        return RESP["ask_dest"]

    intent = _match_intent(text)

    if intent == "greeting":
        return RESP["greeting"]

    if intent == "help":
        return RESP["help"]

    if intent == "where":
        _sessions[session_id] = {"step": "ask_dest", "from": current_location}
        return RESP["ask_dest"]

    return RESP["fallback"]
