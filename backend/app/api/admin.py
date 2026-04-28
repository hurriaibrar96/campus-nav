from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.core.security import require_admin
from app.db.database import get_db

router = APIRouter()

def _fmt(user: dict) -> dict:
    return {
        "id":       str(user["_id"]),
        "username": user["username"],
        "email":    user["email"],
        "role":     user["role"],
    }

@router.get("/dashboard", dependencies=[Depends(require_admin)])
async def dashboard():
    db = get_db()
    total_users    = await db.users.count_documents({})
    total_students = await db.users.count_documents({"role": "student"})
    total_admins   = await db.users.count_documents({"role": "admin"})
    return {
        "total_users":    total_users,
        "total_students": total_students,
        "total_admins":   total_admins,
    }

@router.get("/users", dependencies=[Depends(require_admin)])
async def list_users():
    db = get_db()
    users = await db.users.find({}, {"hashed_password": 0}).to_list(100)
    return [_fmt(u) for u in users]

@router.patch("/users/{user_id}/role", dependencies=[Depends(require_admin)])
async def update_role(user_id: str, role: str):
    if role not in ("student", "admin"):
        raise HTTPException(400, "Role must be 'student' or 'admin'")
    db = get_db()
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": role}})
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
    return {"message": "Role updated"}

@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: str):
    db = get_db()
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "User not found")
    return {"message": "User deleted"}
