import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LANGCHAIN_TRACING_V2 = os.getenv("LANGCHAIN_TRACING_V2", "false")

if not OPENAI_API_KEY:
    print("Warning: OPENAI_API_KEY not found in environment variables. Please set it in a .env file.")
    OPENAI_API_KEY = None