import httpx
from typing import Dict, Any, Optional
from ..config import OLLAMA_MODEL, OLLAMA_BASE_URL

class OllamaClient:
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate(self, prompt: str, system: Optional[str] = None, format_json: bool = False) -> str:
        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "num_ctx": 2048,
            }
        }
        if system:
            payload["system"] = system
        if format_json:
            payload["format"] = "json"

        # 120s timeout to allow local cold-start model load
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{self.base_url}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")

    async def check_health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

# Global instance
ollama_client = OllamaClient()
