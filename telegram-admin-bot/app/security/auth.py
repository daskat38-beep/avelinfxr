import logging
from functools import wraps
from telegram import Update
from telegram.ext import ContextTypes
from app.config import settings

logger = logging.getLogger(__name__)

def is_admin(user_id: int) -> bool:
    return user_id in settings.admin_ids_list

def admin_only(func):
    """Decorator to enforce Telegram ID whitelist authorization."""
    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
        user = update.effective_user
        if not user:
            return

        if not is_admin(user.id):
            logger.warning(f"Unauthorized access attempt by user_id={user.id}, username={user.username}")
            if update.message:
                await update.message.reply_text("Unauthorized.")
            elif update.callback_query:
                await update.callback_query.answer("Unauthorized.", show_alert=True)
            return

        logger.info(f"Authorized request by admin user_id={user.id}")
        return await func(update, context, *args, **kwargs)
    return wrapper
