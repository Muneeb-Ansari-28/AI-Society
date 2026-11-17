import re
from typing import Optional

EVENT_TYPE_BASE_SCORES = {
    "promise": 0.90,
    "trade": 0.85,
    "social": 0.75,
    "conversation": 0.70,
    "help": 0.75,
    "conflict": 0.80,
    "craft": 0.50,
    "work": 0.40,
    "move": 0.25,
    "rest": 0.15,
    "idle": 0.10,
    "observation": 0.30,
}

HIGH_IMPACT_KEYWORDS = [
    "promise", "swore", "deal", "agreed", "trade", "traded", "debt", "owe",
    "borrow", "return", "friend", "ally", "distrust", "upset", "angry",
    "excited", "harvest", "emergency", "help", "save", "secret", "love",
    "rival", "stolen", "lost", "found", "meeting", "tomorrow"
]

def score_event_importance(
    text: str,
    event_type: str = "event",
    related_agent: Optional[str] = None,
    is_promise: bool = False,
) -> float:
    """
    Computes an importance score between 0.0 and 1.0 for a given event or memory.
    Events with score >= 0.3 are automatically indexed into long-term vector storage (ChromaDB).
    """
    if is_promise:
        return 0.95

    # 1. Base score by event type
    base = EVENT_TYPE_BASE_SCORES.get(event_type.lower(), 0.35)

    # 2. Boost if social interaction involves another villager
    if related_agent and related_agent.strip():
        base += 0.10

    # 3. Boost for impactful words
    lowered = text.lower()
    matches = sum(1 for kw in HIGH_IMPACT_KEYWORDS if re.search(rf"\b{kw}\b", lowered))
    bonus = min(0.20, matches * 0.05)

    final_score = base + bonus
    return round(max(0.10, min(1.0, final_score)), 2)
