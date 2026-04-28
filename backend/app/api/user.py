from fastapi import APIRouter, HTTPException
from app.schemas.user_schema import UserCreate
from app.db.database import get_db

router = APIRouter()

@router.post("/register")
async def register(body: UserCreate):
    db = get_db()
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(400, "Email already registered")
    await db.users.insert_one({
        "username":   body.username,
        "email":      body.email,
        "role":       "student",
        "is_student": body.is_student,
        "faculty":    body.faculty if body.is_student else None,
    })
    return {"message": "Registered successfully"}
