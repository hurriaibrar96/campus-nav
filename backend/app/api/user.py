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

@router.post("/login")
async def login(body: dict):
    email = body.get("email", "").strip()
    if not email:
        raise HTTPException(400, "Email is required")
    db = get_db()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "No account found with this email")
    return {"message": "Login successful", "username": user["username"], "email": user["email"]}
