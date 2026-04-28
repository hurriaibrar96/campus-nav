import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str = "campus_ar"
    SECRET_KEY: str

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "../../.env")

settings = Settings()
