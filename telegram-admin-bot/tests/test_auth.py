import pytest
import time
from app.config import settings
from app.security.auth import is_admin
from app.bot.confirmations import create_confirmation, get_confirmation, resolve_confirmation, pending_confirmations

def test_admin_authorization():
    # settings.TELEGRAM_ADMIN_IDS = "123456789,987654321" (from our mock in .env if testing locally)
    # Since we can't reliably mock env here easily without pytest-env, let's just test the logic
    # We will override the property momentarily for testing
    settings.TELEGRAM_ADMIN_IDS = "111,222"
    assert is_admin(111) is True
    assert is_admin(222) is True
    assert is_admin(333) is False
    assert is_admin("111") is False # type must match if expected

def test_confirmation_creation_and_resolve():
    conf_id = create_confirmation(admin_id=111, action="suspend_artist")
    assert conf_id in pending_confirmations
    
    conf = get_confirmation(conf_id)
    assert conf is not None
    assert conf["admin_id"] == 111
    assert conf["action"] == "suspend_artist"
    
    # Resolve
    resolved = resolve_confirmation(conf_id)
    assert resolved is True
    assert conf_id not in pending_confirmations

def test_confirmation_expiry():
    conf_id = create_confirmation(admin_id=111, action="test")
    # Manually expire it
    pending_confirmations[conf_id]["expires_at"] = time.time() - 10
    
    conf = get_confirmation(conf_id)
    assert conf is None
    assert conf_id not in pending_confirmations

def test_invalid_confirmation():
    conf = get_confirmation("invalid-uuid-1234")
    assert conf is None
