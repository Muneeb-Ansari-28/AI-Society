import os

# Backend configuration
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tiny_society.db")

SIMULATION_TICK_SECONDS = float(os.getenv("SIMULATION_TICK_SECONDS", "3.0"))
MAX_CONVERSATION_TURNS = int(os.getenv("MAX_CONVERSATION_TURNS", "4"))
