from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_ADMIN_IDS: str
    AI_API_KEY: str
    AI_MODEL: str = "gpt-4-turbo"
    AI_BASE_URL: str = None
    BREAKOUT_API_URL: str
    BREAKOUT_API_KEY: str

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def admin_ids_list(self) -> List[int]:
        try:
            return [int(x.strip()) for x in self.TELEGRAM_ADMIN_IDS.split(",") if x.strip()]
        except ValueError:
            return []

settings = Settings()
