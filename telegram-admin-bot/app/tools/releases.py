from app.tools.client import fetch_from_api

async def get_pending_releases() -> dict:
    return await fetch_from_api("/api/admin/releases/pending")
