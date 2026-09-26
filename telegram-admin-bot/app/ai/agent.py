import json
import logging
from openai import AsyncOpenAI
from app.config import settings
from app.ai.prompts import SYSTEM_PROMPT
from app.tools.dashboard import get_dashboard_summary
from app.tools.stats import get_royalties, get_payments, get_performance
from app.tools.artists import get_inactive_artists, send_artist_reminder, suspend_artist
from app.tools.releases import get_pending_releases
from app.bot.confirmations import create_confirmation
from telegram import InlineKeyboardButton, InlineKeyboardMarkup

logger = logging.getLogger(__name__)

try:
    client_kwargs = {"api_key": settings.AI_API_KEY}
    if settings.AI_BASE_URL:
        client_kwargs["base_url"] = settings.AI_BASE_URL
    client = AsyncOpenAI(**client_kwargs)
except Exception as e:
    client = None
    logger.error(f"Failed to init OpenAI: {e}")

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_dashboard_summary",
            "description": "Ambil ringkasan dashboard (total artis, total rilis, royalti)."
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_inactive_artists",
            "description": "Cari artis yang tidak aktif.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {"type": "integer", "description": "Lama tidak aktif dalam hari"}
                },
                "required": ["days"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_artist_reminder",
            "description": "Kirim reminder ke artis. WAJIB konfirmasi admin.",
            "parameters": {
                "type": "object",
                "properties": {
                    "artist_id": {"type": "string"}
                },
                "required": ["artist_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "suspend_artist",
            "description": "Suspend (Nonaktifkan) artis. WAJIB konfirmasi admin.",
            "parameters": {
                "type": "object",
                "properties": {
                    "artist_id": {"type": "string"},
                    "reason": {"type": "string"}
                },
                "required": ["artist_id", "reason"]
            }
        }
    }
]

async def process_user_message(admin_id: int, user_message: str) -> dict:
    if not client or settings.AI_API_KEY == "your_openai_or_other_llm_api_key":
        return {"type": "text", "content": "AI service sedang tidak tersedia (API Key belum diisi di .env)."}

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message}
    ]

    try:
        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        
        if response_message.tool_calls:
            tool_call = response_message.tool_calls[0]
            func_name = tool_call.function.name
            func_args = json.loads(tool_call.function.arguments)
            
            # Action Tools -> Jangan dijalankan! Kirim tombol konfirmasi
            if func_name in ["send_artist_reminder", "suspend_artist"]:
                conf_id = create_confirmation(admin_id, action=func_name, data=func_args)
                
                keyboard = [[
                    InlineKeyboardButton("CONFIRM", callback_data=f"confirm:{conf_id}"),
                    InlineKeyboardButton("CANCEL", callback_data=f"cancel:{conf_id}")
                ]]
                
                action_desc = f"Mengirim reminder ke ID {func_args.get('artist_id')}" if func_name == "send_artist_reminder" else f"Suspend ID {func_args.get('artist_id')} (Alasan: {func_args.get('reason')})"
                
                return {
                    "type": "action",
                    "content": f"⚡ WARNING: SYSTEM ACTION ⚡\n\nAnda akan mengeksekusi:\n{action_desc}\n\nKonfirmasi tindakan ini?",
                    "reply_markup": InlineKeyboardMarkup(keyboard)
                }
            
            # Read Tools -> Boleh langsung jalan
            if func_name == "get_dashboard_summary":
                result = await get_dashboard_summary()
            elif func_name == "get_inactive_artists":
                result = await get_inactive_artists(func_args.get("days", 10))
            else:
                result = {"error": "Tool tidak ditemukan."}
                
            messages.append(response_message)
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "name": func_name,
                "content": json.dumps(result)
            })
            
            second_response = await client.chat.completions.create(
                model=settings.AI_MODEL,
                messages=messages
            )
            return {"type": "text", "content": second_response.choices[0].message.content}

        return {"type": "text", "content": response_message.content}

    except Exception as e:
        logger.error(f"LLM Error: {e}")
        return {"type": "text", "content": "Waduh boskuh, otak AI lagi pusing (Cek koneksi API LLM)."}

