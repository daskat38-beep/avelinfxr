import logging
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters
from app.config import settings
from app.bot.handlers import start_command, help_command, status_command, test_confirm_command, handle_callback_query, handle_text_message

logger = logging.getLogger(__name__)

_application = None

def get_bot_application() -> Application:
    global _application
    if _application is None:
        if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
            logger.warning("TELEGRAM_BOT_TOKEN is not set properly. Bot initialization skipped.")
            return None
            
        _application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
        
        # Register handlers
        _application.add_handler(CommandHandler("start", start_command))
        _application.add_handler(CommandHandler("help", help_command))
        _application.add_handler(CommandHandler("status", status_command))
        _application.add_handler(CommandHandler("test_confirm", test_confirm_command))
        _application.add_handler(CallbackQueryHandler(handle_callback_query))
        _application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_message))
        
    return _application

async def initialize_bot():
    app = get_bot_application()
    if app:
        await app.initialize()
        await app.start()
        await app.updater.start_polling()
        logger.info("Telegram Bot started in polling mode.")

async def shutdown_bot():
    app = get_bot_application()
    if app:
        await app.updater.stop()
        await app.stop()
        await app.shutdown()
        logger.info("Telegram Bot stopped.")
