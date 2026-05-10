from fastapi import APIRouter
from app.schemas.chatbot_schema import ChatRequest
from app.services.ai_service import get_response

router = APIRouter()

@router.post("/")
async def chat(req: ChatRequest):
    return await get_response(req.message, req.session_id, req.current_location)
