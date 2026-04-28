from fastapi import APIRouter, HTTPException
from app.services.navigation_service import get_path, get_all_locations

router = APIRouter()

@router.get("/locations")
async def locations():
    return get_all_locations()

@router.get("/route")
async def route(start: str, end: str):
    path = get_path(start, end)
    if not path:
        raise HTTPException(404, "No path found between the given locations")
    return {"path": path}
