from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from app.security.auth import admin_only
from app.bot.confirmations import create_confirmation, get_confirmation, resolve_confirmation
from app.ai.agent import process_user_message
from telegram import Message

@admin_only
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Breakout Admin AI initialized. I am ready to assist.")

@admin_only
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    help_text = (
        "Available Commands:\n"
        "/start - Initialize bot\n"
        "/help - Show this message\n"
        "/status - Check bot status\n"
        "/test_confirm - Test confirmation system"
    )
    await update.message.reply_text(help_text)

@admin_only
async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("System Status: All services operational.\nLLM: Disconnected (Module 1 mode).")

@admin_only
async def test_confirm_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Generates a dummy confirmation to test the security mechanism."""
    admin_id = update.effective_user.id
    conf_id = create_confirmation(admin_id, action="test_action", data={"demo": True})
    
    keyboard = [
        [
            InlineKeyboardButton("CONFIRM", callback_data=f"confirm:{conf_id}"),
            InlineKeyboardButton("CANCEL", callback_data=f"cancel:{conf_id}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Anda akan menjalankan test_action. Konfirmasi?",
        reply_markup=reply_markup
    )

@admin_only
async def handle_callback_query(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer() # Ack the query
    
    data = query.data
    if not data or ":" not in data:
        return
        
    action, conf_id = data.split(":", 1)
    
    conf = get_confirmation(conf_id)
    if not conf:
        await query.edit_message_text(text="Confirmation expired or invalid.")
        return
        
    # Security: Ensure only the admin who triggered it can confirm it
    if conf["admin_id"] != update.effective_user.id:
        await query.edit_message_text(text="Unauthorized: You cannot confirm someone else's action.")
        return
        
    if action == "confirm":
        # Do the action
        await query.edit_message_text(text=f"Action '{conf['action']}' executed successfully.")
        resolve_confirmation(conf_id)
    elif action == "cancel":
        await query.edit_message_text(text="Action cancelled.")
        resolve_confirmation(conf_id)

@admin_only
async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_msg = update.message.text
    if user_msg.startswith("/"):
        return # Ignore other commands
        
    admin_id = update.effective_user.id
    
    # Show typing action while AI processes
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    
    result = await process_user_message(admin_id, user_msg)
    
    if result["type"] == "text":
        await update.message.reply_text(result["content"])
    elif result["type"] == "action":
        await update.message.reply_text(
            result["content"],
            reply_markup=result["reply_markup"]
        )
