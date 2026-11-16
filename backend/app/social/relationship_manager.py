from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..database.repository import Repository

class RelationshipManager:
    @staticmethod
    def get_relationship_prompt_text(db: Session, agent_id: str, nearby_agent_ids: List[str]) -> str:
        """Returns human-readable relationship context for nearby agents to inject into LLM prompts"""
        relationships = Repository.get_agent_relationships(db, agent_id)
        if not nearby_agent_ids:
            return "No other villagers nearby."

        lines = []
        for tid in nearby_agent_ids:
            rel = relationships.get(tid)
            if rel:
                lines.append(f"{rel['name']} ({rel['occupation']}): Friendship {rel['friendship']}/100, Trust {rel['trust']}/100 [Last: {rel['last_interaction'] or 'No recent contact'}]")
            else:
                lines.append(f"{tid.capitalize()}: Neutral stranger (Friendship 50/100, Trust 50/100)")

        return "\n".join(lines)

    @staticmethod
    def apply_social_interaction(
        db: Session,
        source_id: str,
        target_id: str,
        interaction_type: str,
        topic: str = "",
        custom_trust_delta: int = 0,
        custom_friendship_delta: int = 0
    ) -> Dict[str, Any]:
        """Calculates and applies relationship changes based on social events"""
        if interaction_type == "talk":
            trust_delta = custom_trust_delta if custom_trust_delta != 0 else 2
            friendship_delta = custom_friendship_delta if custom_friendship_delta != 0 else 3
            interaction_note = f"Had a pleasant conversation about {topic or 'daily village life'}"
        elif interaction_type == "trade":
            trust_delta = custom_trust_delta if custom_trust_delta != 0 else 4
            friendship_delta = custom_friendship_delta if custom_friendship_delta != 0 else 3
            interaction_note = f"Conducted a fair trade at the village"
        elif interaction_type == "help":
            trust_delta = custom_trust_delta if custom_trust_delta != 0 else 5
            friendship_delta = custom_friendship_delta if custom_friendship_delta != 0 else 6
            interaction_note = f"Provided generous assistance and community support"
        else:
            trust_delta = 1
            friendship_delta = 1
            interaction_note = f"Met briefly in passing"

        Repository.update_relationship(
            db=db,
            source_id=source_id,
            target_id=target_id,
            trust_delta=trust_delta,
            friendship_delta=friendship_delta,
            interaction=interaction_note
        )

        return Repository.get_relationship(db, source_id, target_id) or {
            "trust": 50,
            "friendship": 50,
            "last_interaction": interaction_note
        }
