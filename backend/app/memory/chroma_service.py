import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings

CHROMA_PERSIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "chroma_db"))

class ChromaService:
    """
    Manages vector storage and semantic similarity search for agent long-term memories.
    Uses local persistent ChromaDB collection 'agent_memories'.
    """
    def __init__(self, persist_dir: str = CHROMA_PERSIST_DIR):
        self.persist_dir = persist_dir
        os.makedirs(self.persist_dir, exist_ok=True)
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="agent_memories",
            metadata={"hnsw:space": "cosine"}
        )

    def add_memory_vector(
        self,
        memory_id: int,
        agent_id: str,
        text: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        if not embedding or not text.strip():
            return False

        meta = {
            "memory_id": int(memory_id),
            "agent_id": str(agent_id),
            "importance": float(metadata.get("importance", 0.5) if metadata else 0.5),
            "event_type": str(metadata.get("event_type", "event") if metadata else "event"),
            "related_agent": str(metadata.get("related_agent", "") if metadata else ""),
            "day": int(metadata.get("day", 1) if metadata else 1),
            "location": str(metadata.get("location", "") if metadata else ""),
            "is_promise": bool(metadata.get("is_promise", False) if metadata else False),
        }

        try:
            doc_id = f"mem_{agent_id}_{memory_id}"
            self.collection.upsert(
                ids=[doc_id],
                embeddings=[embedding],
                documents=[text],
                metadatas=[meta],
            )
            return True
        except Exception as e:
            print(f"[ChromaService] Failed to upsert vector for memory {memory_id}: {e}")
            return False

    def query_memories(
        self,
        agent_id: str,
        query_embedding: List[float],
        n_results: int = 3,
        min_importance: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves the most semantically relevant memories for a specific agent.
        """
        if not query_embedding:
            return []

        try:
            where_filter = {"agent_id": agent_id}
            if min_importance > 0.0:
                where_filter = {
                    "$and": [
                        {"agent_id": agent_id},
                        {"importance": {"$gte": min_importance}}
                    ]
                }

            # Query Chroma
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, max(1, self.collection.count())),
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )

            hits = []
            if results and results.get("documents") and len(results["documents"]) > 0:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else []
                dists = results["distances"][0] if results.get("distances") else []

                for idx, doc in enumerate(docs):
                    meta = metas[idx] if idx < len(metas) else {}
                    # Cosine distance to similarity (1 - dist)
                    dist = dists[idx] if idx < len(dists) else 1.0
                    similarity = max(0.0, min(1.0, 1.0 - dist))
                    hits.append({
                        "memory_id": meta.get("memory_id"),
                        "text": doc,
                        "importance": meta.get("importance", 0.5),
                        "event_type": meta.get("event_type", "event"),
                        "related_agent": meta.get("related_agent", ""),
                        "day": meta.get("day", 1),
                        "location": meta.get("location", ""),
                        "is_promise": meta.get("is_promise", False),
                        "similarity": round(similarity, 3),
                        "distance": round(dist, 3),
                    })

            return hits
        except Exception as e:
            print(f"[ChromaService] Query failed for agent {agent_id}: {e}")
            return []

    def count(self) -> int:
        try:
            return self.collection.count()
        except Exception:
            return 0

# Singleton instance
chroma_service = ChromaService()
