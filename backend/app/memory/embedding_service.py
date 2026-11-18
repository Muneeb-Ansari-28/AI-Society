import httpx
import hashlib
from typing import List, Optional, Dict
from ..config import OLLAMA_BASE_URL, EMBEDDING_MODEL

class EmbeddingService:
    """
    Connects to local Ollama instance running nomic-embed-text
    to generate 768-dimensional semantic embeddings for agent memories.
    Includes in-memory cache to optimize performance and prevent repeated calls.
    """
    def __init__(self, base_url: str = OLLAMA_BASE_URL, model: str = EMBEDDING_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self._cache: Dict[str, List[float]] = {}
        self._max_cache_size = 2000

    def _cache_key(self, text: str) -> str:
        return hashlib.md5(text.strip().lower().encode("utf-8")).hexdigest()

    async def get_embedding_async(self, text: str) -> Optional[List[float]]:
        cleaned = text.strip()
        if not cleaned:
            return None

        key = self._cache_key(cleaned)
        if key in self._cache:
            return self._cache[key]

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": self.model, "prompt": cleaned},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    embedding = data.get("embedding", [])
                    if embedding:
                        if len(self._cache) >= self._max_cache_size:
                            # Prune half
                            keys_to_remove = list(self._cache.keys())[:1000]
                            for k in keys_to_remove:
                                self._cache.pop(k, None)
                        self._cache[key] = embedding
                        return embedding
        except Exception as e:
            # Fallback gracefully
            print(f"[EmbeddingService] Failed async embedding generation for '{cleaned[:30]}...': {e}")
        return None

    def get_embedding_sync(self, text: str) -> Optional[List[float]]:
        cleaned = text.strip()
        if not cleaned:
            return None

        key = self._cache_key(cleaned)
        if key in self._cache:
            return self._cache[key]

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(
                    f"{self.base_url}/api/embeddings",
                    json={"model": self.model, "prompt": cleaned},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    embedding = data.get("embedding", [])
                    if embedding:
                        if len(self._cache) >= self._max_cache_size:
                            keys_to_remove = list(self._cache.keys())[:1000]
                            for k in keys_to_remove:
                                self._cache.pop(k, None)
                        self._cache[key] = embedding
                        return embedding
        except Exception as e:
            print(f"[EmbeddingService] Failed sync embedding generation for '{cleaned[:30]}...': {e}")
        return None

    def get_embedding(self, text: str) -> Optional[List[float]]:
        """Convenience synchronous alias for get_embedding_sync"""
        return self.get_embedding_sync(text)

# Singleton instance
embedding_service = EmbeddingService()
