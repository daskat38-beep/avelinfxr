from app.tools.client import fetch_from_api

async def get_royalties() -> dict:
    return await fetch_from_api("/api/admin/bot/stats?action=royalties")

async def get_payments() -> dict:
    return await fetch_from_api("/api/admin/bot/stats?action=payments")

async def get_performance() -> dict:
    return await fetch_from_api("/api/admin/bot/stats?action=performance")
