from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import logging
from app.config import settings
from app.bot.telegram import initialize_bot, shutdown_bot

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Breakout Admin AI Bot...")
    logger.info(f"Loaded {len(settings.admin_ids_list)} authorized admin(s).")
    await initialize_bot()
    yield
    logger.info("Shutting down Bot...")
    await shutdown_bot()

app = FastAPI(title="Breakout Admin AI API", lifespan=lifespan)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Breakout Admin AI is running. Access strictly via Telegram."}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
