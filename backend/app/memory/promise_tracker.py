import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..database.repository import Repository

PROMISE_PATTERNS = [
    r"(?:i will|i'll|i promise to|i plan to)\s+(?:bring|deliver|trade|give|meet|make|craft|help)\s+([^.!?]+)",
    r"(?:let's meet|meet me at)\s+([^.!?]+)",
    r"(?:bring me|give me)\s+([^.!?]+)\s+(?:and i will|and i'll)\s+([^.!?]+)",
    r"(?:agreed to|deal:)\s+([^.!?]+)",
]

class PromiseTracker:
    """
    Detects, records, and tracks fulfillment of agent promises and commitments.
    Promises carry deadlines and actively influence agent decision making.
    """

    @staticmethod
    def extract_promise_text(text: str) -> Optional[str]:
        lowered = text.lower()
        # Look for explicit commitment phrases
        for pat in PROMISE_PATTERNS:
            match = re.search(pat, lowered)
            if match:
                return text.strip()

        # Catch keywords
        if any(w in lowered for w in ["i promise", "i swear", "i'll bring", "i will bring", "i'll meet", "i will meet"]):
            return text.strip()

        return None

    @staticmethod
    def record_promise_if_detected(
        db: Session,
        speaker_id: str,
        listener_id: str,
        dialogue_text: str,
        current_day: int = 1,
    ) -> Optional[Dict[str, Any]]:
        promise_text = PromiseTracker.extract_promise_text(dialogue_text)
        if not promise_text:
            return None

        # Deadline is typically next day unless specified
        deadline_day = current_day + 1
        if "today" in dialogue_text.lower() or "tonight" in dialogue_text.lower():
            deadline_day = current_day
        elif "two days" in dialogue_text.lower() or "in a couple days" in dialogue_text.lower():
            deadline_day = current_day + 2

        created = Repository.create_promise(
            db=db,
            agent_id=speaker_id,
            target_agent_id=listener_id,
            content=promise_text,
            day_made=current_day,
            deadline_day=deadline_day,
            status="active",
        )

        return {
            "id": created.id,
            "agent_id": created.agent_id,
            "target_agent_id": created.target_agent_id,
            "content": created.content,
            "day_made": created.day_made,
            "deadline_day": created.deadline_day,
            "status": created.status,
        }

    @staticmethod
    def check_and_fulfill(
        db: Session,
        agent_id: str,
        action: str,
        action_detail: str,
        location: str,
        target_agent: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Checks if an agent's current action fulfills any active promises.
        """
        active = Repository.get_active_promises(db, agent_id=agent_id)
        fulfilled = []

        for p in active:
            # If agent made promise to someone
            if p["agent_id"] == agent_id:
                target = p["target_agent_id"]
                content_lower = p["content"].lower()

                # Rule 1: Trade or Help with target agent
                if target_agent == target and action in ["trade", "help", "talk"]:
                    Repository.update_promise_status(db, p["id"], "fulfilled")
                    p["status"] = "fulfilled"
                    fulfilled.append(p)
                    continue

                # Rule 2: Delivered/Arrived at promised location
                if location and location.lower() in content_lower and action in ["work", "trade", "talk"]:
                    Repository.update_promise_status(db, p["id"], "fulfilled")
                    p["status"] = "fulfilled"
                    fulfilled.append(p)

        return fulfilled

    @staticmethod
    def format_promises_for_prompt(active_promises: List[Dict[str, Any]], agent_id: str) -> str:
        if not active_promises:
            return "No pending promises or obligations."

        lines = []
        for p in active_promises:
            if p["agent_id"] == agent_id:
                lines.append(
                    f"- You promised {p['target_agent_id'].capitalize()}: \"{p['content']}\" (Due: Day {p['deadline_day']})"
                )
            else:
                lines.append(
                    f"- {p['agent_id'].capitalize()} promised you: \"{p['content']}\" (Due: Day {p['deadline_day']})"
                )
        return "\n".join(lines)

promise_tracker = PromiseTracker()
