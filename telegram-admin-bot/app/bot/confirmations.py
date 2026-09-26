import uuid
import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# In-memory store for pending confirmations
# format: { "uuid": {"admin_id": 123, "action": "suspend", "data": {...}, "expires_at": 1690000000} }
pending_confirmations: Dict[str, Dict[str, Any]] = {}

CONFIRMATION_TIMEOUT = 300  # 5 minutes

def create_confirmation(admin_id: int, action: str, data: dict = None) -> str:
    """Creates a unique, hard-to-guess confirmation ID."""
    conf_id = str(uuid.uuid4())
    pending_confirmations[conf_id] = {
        "admin_id": admin_id,
        "action": action,
        "data": data or {},
        "expires_at": time.time() + CONFIRMATION_TIMEOUT
    }
    logger.info(f"Created confirmation {conf_id} for admin {admin_id} action {action}")
    return conf_id

def get_confirmation(conf_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves and validates a confirmation request."""
    if conf_id not in pending_confirmations:
        return None
    
    conf = pending_confirmations[conf_id]
    if time.time() > conf["expires_at"]:
        logger.warning(f"Confirmation {conf_id} expired.")
        del pending_confirmations[conf_id]
        return None
        
    return conf

def resolve_confirmation(conf_id: str) -> bool:
    """Removes a confirmation after it has been used."""
    if conf_id in pending_confirmations:
        del pending_confirmations[conf_id]
        return True
    return False
