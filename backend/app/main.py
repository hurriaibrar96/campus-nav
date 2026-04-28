from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chatbot, navigation, user, admin
from app.db.database import connect_db
import os

app = FastAPI(title="Campus AR Navigation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot.router, prefix="/chatbot")
app.include_router(navigation.router, prefix="/navigation")
app.include_router(user.router, prefix="/user")
app.include_router(admin.router, prefix="/admin")

@app.get("/")
async def root():
    return {"status": "ok"}

@app.on_event("startup")
async def startup():
    await connect_db()
