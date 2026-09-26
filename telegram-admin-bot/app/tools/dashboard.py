from app.tools.client import fetch_from_api

async def get_dashboard_summary() -> dict:
    return await fetch_from_api("/api/admin/dashboard/summary")
