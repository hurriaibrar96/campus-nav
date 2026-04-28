from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import certifi

client: AsyncIOMotorClient = None

def get_db():
    return client[settings.DB_NAME]

async def connect_db():
    global client
    client = AsyncIOMotorClient(
        settings.MONGO_URI,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=30000,
    )
