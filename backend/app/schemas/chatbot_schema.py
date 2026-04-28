from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    session_id: str
    current_location: str = ""
