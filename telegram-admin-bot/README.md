# Breakout Telegram Admin AI

A secure, production-ready Telegram Bot powered by FastAPI and an external LLM, designed specifically to act as an Administrative AI Assistant for the Breakout Music dashboard.

## Architecture
- **Telegram Bot Layer**: Handles user interaction, whitelist enforcement, and action confirmation (via Inline Keyboards).
- **Python FastAPI Layer**: Orchestrates requests, rate limits, and scheduling.
- **AI/LLM Layer**: Reasons about admin intents based on permitted read tools (No direct DB access, No shell access).
- **Tools/Action Layer**: Communicates with the Breakout Backend API to read data or perform state-changing operations (requires explicit admin confirmation).

## Security Principles
- **Whitelist Only**: Only `TELEGRAM_ADMIN_IDS` can interact with the bot.
- **No Direct DB Access**: AI fetches data via explicitly defined tools pointing to Breakout APIs.
- **Action Confirmations**: Destructive/state-changing tools (e.g., suspend artist) MUST be confirmed via Telegram buttons.
- **Audit Logging**: Every action is logged with Admin ID, target, timestamp, and result.

## Setup Instructions
1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and fill in the credentials.
3. Run the FastAPI service: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

## Modules
- `app/main.py`: Entry point for FastAPI and background tasks.
- `app/config.py`: Environment variable validation using pydantic.
- `app/bot/`: Telegram bot handlers, webhooks, and inline keyboard confirmations.
- `app/ai/`: LLM client (OpenAI/etc.), system prompts, and tool calling logic.
- `app/tools/`: Read & Action tools interacting with Breakout Backend API.
- `app/security/`: Whitelist validation and rate limiting.
- `app/scheduler/`: Background jobs (e.g., daily inactive artist checks).
- `app/logs/`: Audit logging mechanism.
