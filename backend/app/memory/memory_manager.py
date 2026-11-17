import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from .embedding_service import embedding_service
from .chroma_service import chroma_service
from .importance_scorer import score_event_importance
from .promise_tracker import promise_tracker
from ..database.repository import Repository

class MemoryManager:
    """
    Unified Three-Tier Memory Architecture:
    1. Short-Term Memory: Rolling buffer of recent observations & events in SQLite.
    2. Long-Term Memory: Semantic vector embeddings in ChromaDB (importance >= 0.30).
    3. Relationship & Promise Memory: Trust/friendship records and commitments with deadlines.
    """

    @staticmethod
    def add_memory(
        db: Session,
        agent_id: str,
        text: str,
        event_type: str = "event",
        related_agent: Optional[str] = None,
        location: str = "",
        day: int = 1,
        is_promise: bool = False,
    ) -> Dict[str, Any]:
        """
        Processes and stores a new memory:
        1. Computes importance score (0.0 to 1.0).
        2. Persists to SQLite memories table.
        3. If importance >= 0.30, computes embedding and upserts into ChromaDB.
        """
        importance = score_event_importance(
            text=text,
            event_type=event_type,
            related_agent=related_agent,
            is_promise=is_promise,
        )

        # 1. SQLite Short-Term / Persistent Record
        db_mem = Repository.add_memory(
            db=db,
            agent_id=agent_id,
            text=text,
            importance=importance,
            event_type=event_type,
            related_agent=related_agent,
            location=location,
            day=day,
            is_promise=is_promise,
        )

        # 2. ChromaDB Long-Term Vector Indexing
        indexed_in_chroma = False
        if importance >= 0.30:
            embedding = embedding_service.get_embedding_sync(text)
            if embedding:
                indexed_in_chroma = chroma_service.add_memory_vector(
                    memory_id=db_mem.id,
                    agent_id=agent_id,
                    text=text,
                    embedding=embedding,
                    metadata={
                        "importance": importance,
                        "event_type": event_type,
                        "related_agent": related_agent or "",
                        "location": location or "",
                        "day": day,
                        "is_promise": is_promise,
                    },
                )

        return {
            "id": db_mem.id,
            "agent_id": agent_id,
            "text": text,
            "importance": importance,
            "event_type": event_type,
            "related_agent": related_agent,
            "location": location,
            "day": day,
            "is_promise": is_promise,
            "indexed_in_chroma": indexed_in_chroma,
        }

    @staticmethod
    def search_relevant_memories(
        db: Session,
        agent_id: str,
        query: str,
        n_results: int = 3,
        min_importance: float = 0.25,
    ) -> List[Dict[str, Any]]:
        """
        Performs semantic similarity search across an agent's long-term memory.
        Applies Stanford Generative Agents ranking:
        score = alpha * recency + beta * importance + gamma * relevance
        """
        if not query.strip():
            recent = Repository.get_agent_memory_details(db, agent_id, limit=n_results)
            return recent

        query_emb = embedding_service.get_embedding_sync(query)
        if query_emb:
            chroma_hits = chroma_service.query_memories(
                agent_id=agent_id,
                query_embedding=query_emb,
                n_results=n_results * 2,
                min_importance=min_importance,
            )
            if chroma_hits:
                # Rank results using Recency + Importance + Relevance
                # alpha = 0.2, beta = 0.3, gamma = 0.5
                ranked = []
                for h in chroma_hits:
                    rel_score = h.get("similarity", 0.5)
                    imp_score = h.get("importance", 0.5)
                    # Recency weight (default to moderate decay)
                    recency = 0.8
                    combined_score = (0.2 * recency) + (0.3 * imp_score) + (0.5 * rel_score)
                    ranked.append({
                        **h,
                        "combined_score": round(combined_score, 3),
                    })
                ranked.sort(key=lambda x: x["combined_score"], reverse=True)
                return ranked[:n_results]

        # Graceful fallback: return top recent memories from SQLite
        recent = Repository.get_agent_memory_details(db, agent_id, limit=n_results)
        return recent

    @staticmethod
    def build_agent_context(
        db: Session,
        agent_id: str,
        situation: str,
        nearby_agents: Optional[List[str]] = None,
        current_day: int = 1,
    ) -> Dict[str, Any]:
        """
        Builds a comprehensive memory & social context for agent decision making.
        Returns:
        - semantic_memories: top 3 relevant past experiences
        - recent_memories: latest 3 short-term observations
        - active_promises: pending obligations
        - formatted_text: consolidated block ready for LLM prompt injection
        """
        nearby = nearby_agents or []

        # 1. Semantic query combining situation and nearby villagers
        query_text = f"{situation} {' '.join(nearby)}"
        semantic_memories = MemoryManager.search_relevant_memories(
            db=db,
            agent_id=agent_id,
            query=query_text,
            n_results=3,
        )

        # 2. Short-term recent memories
        recent_details = Repository.get_agent_memory_details(db, agent_id, limit=3)

        # 3. Active promises
        active_promises = Repository.get_active_promises(db, agent_id=agent_id)

        # Format lines for LLM injection
        memory_lines = []
        if semantic_memories:
            for sm in semantic_memories:
                txt = sm.get("text", "")
                if txt and txt not in memory_lines:
                    memory_lines.append(f"- {txt}")

        if not memory_lines and recent_details:
            for rm in recent_details:
                memory_lines.append(f"- {rm['text']}")

        promises_text = promise_tracker.format_promises_for_prompt(active_promises, agent_id)

        return {
            "semantic_memories": semantic_memories,
            "recent_memories": recent_details,
            "active_promises": active_promises,
            "memories_text": "\n".join(memory_lines) if memory_lines else "Woke up ready for a new morning.",
            "promises_text": promises_text,
        }

memory_manager = MemoryManager()
