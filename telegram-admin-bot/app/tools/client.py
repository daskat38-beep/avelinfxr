import httpx
from app.config import settings
import logging

logger = logging.getLogger(__name__)

async def fetch_from_api(endpoint: str, method: str = "GET", params: dict = None, data: dict = None) -> dict:
    url = f"{settings.BREAKOUT_API_URL.rstrip('/')}/{endpoint.lstrip('/')}"
    headers = {"Authorization": f"Bearer {settings.BREAKOUT_API_KEY}", "Content-Type": "application/json"}
    
    try:
        async with httpx.AsyncClient() as client:
            if method == "GET":
                response = await client.get(url, headers=headers, params=params)
            elif method == "POST":
                response = await client.post(url, headers=headers, json=data)
            else:
                return {"error": f"Unsupported method: {method}"}
                
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"HTTP Error calling Breakout API {endpoint}: {e}")
        return {"error": "Breakout API sedang tidak dapat diakses atau merespon error."}
    except Exception as e:
        logger.error(f"Error calling Breakout API {endpoint}: {e}")
        return {"error": "Terjadi kesalahan sistem internal."}
