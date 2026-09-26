from app.tools.client import fetch_from_api

async def get_artists(page: int = 1, limit: int = 10, status: str = None) -> dict:
    params = {"page": page, "limit": limit}
    if status:
        params["status"] = status
    return await fetch_from_api("/api/admin/artists", params=params)

async def get_inactive_artists(days: int = 10) -> dict:
    return await fetch_from_api(f"/api/admin/artists/inactive?days={days}")

async def send_artist_reminder(artist_id: str) -> dict:
    """ACTION: Mengirim reminder. Harus dikonfirmasi admin!"""
    return await fetch_from_api(f"/api/admin/artists/{artist_id}/remind", method="POST")

async def suspend_artist(artist_id: str, reason: str) -> dict:
    """ACTION: Suspend artist. Harus dikonfirmasi admin!"""
    return await fetch_from_api(f"/api/admin/artists/{artist_id}/suspend", method="POST", data={"reason": reason})
