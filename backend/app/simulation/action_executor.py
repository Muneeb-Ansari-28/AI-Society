from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..database.repository import Repository
from ..llm.prompts import format_time_string

class ActionExecutor:
    @staticmethod
    def execute(db: Session, agent_id: str, decision: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates simulation rules, updates database state, logs events, and returns execution result.
        """
        agent = Repository.get_agent(db, agent_id)
        if not agent:
            return {"status": "error", "message": "Agent not found"}

        action = decision.get("action", "idle")
        location = decision.get("location", agent["location"])
        reason = decision.get("reason", "")
        dialogue = decision.get("dialogue")
        target = decision.get("target")

        world = Repository.get_world_state(db)
        time_str = format_time_string(world.get("time_minutes", 510))

        energy_delta = 0
        happiness_delta = 0
        inventory_delta: Dict[str, int] = {}
        action_detail = ""
        memory_text: Optional[str] = None
        importance = 0.3

        if action == "move":
            action_detail = f"Walking to {location}"
            energy_delta = -2
            description = f"Traveled from {agent['location']} to {location}."

        elif action == "work":
            energy_delta = -5
            happiness_delta = 2
            if agent_id == "alex":
                action_detail = "Harvesting wheat & tending farm"
                inventory_delta = {"food": 1}
                description = "Harvested fresh wheat in the field."
                memory_text = "Harvested a bountiful batch of golden wheat today."
                importance = 0.6
            elif agent_id == "mia":
                action_detail = "Baking fresh sourdough bread"
                inventory_delta = {"bread": 1}
                description = "Baked warm crusty sourdough loaves."
                memory_text = "Baked fresh sourdough bread in the morning oven."
                importance = 0.6
            elif agent_id == "noah":
                action_detail = "Tallying ledger & organizing goods"
                inventory_delta = {"coins": 2}
                description = "Conducted shop inventory and balanced the trading ledger."
                memory_text = "Tallied the day's earnings and organized the stock."
                importance = 0.5
            elif agent_id == "emma":
                action_detail = "Gathering medicinal water herbs"
                inventory_delta = {"herbs": 1}
                description = "Harvested soothing water lilies and medicinal mint by the lake."
                memory_text = "Collected fresh medicinal plants for apothecary salves."
                importance = 0.5
            else: # leo
                action_detail = "Planing oak timber at bench"
                inventory_delta = {"wood": 1}
                description = "Shaped sturdy oak timber beams for village repairs."
                memory_text = "Crafted reinforced timber joints for upcoming repairs."
                importance = 0.5

        elif action == "rest":
            energy_delta = 18
            happiness_delta = 5
            action_detail = "Resting peacefully"
            description = f"Rested at {location} to recover strength."
            if agent["energy"] < 30:
                memory_text = "Took a well-deserved rest after tiring chores."
                importance = 0.4

        elif action == "talk":
            energy_delta = -1
            happiness_delta = 4
            action_detail = f"Speaking with {target or 'villagers'}"
            description = f"Spoke with {target or 'fellow villagers'} at {location}."
            if dialogue:
                memory_text = f"Said to {target or 'the villagers'}: '{dialogue}'"
                importance = 0.7

        elif action == "trade":
            energy_delta = -2
            happiness_delta = 3
            action_detail = f"Negotiating trade with {target or 'Noah'}"
            description = f"Engaged in resource trade at {location}."
            memory_text = f"Discussed trading terms and supplies at {location}."
            importance = 0.7

        else: # idle
            action_detail = "Observing village surroundings"
            description = f"Stood at {location} observing the morning breeze."

        # Apply state updates to database
        Repository.update_agent_state(
            db=db,
            agent_id=agent_id,
            location=location,
            action=action,
            action_detail=action_detail,
            energy_delta=energy_delta,
            happiness_delta=happiness_delta,
            inventory_updates=inventory_delta if inventory_delta else None
        )

        # Log event
        Repository.add_event(
            db=db,
            agent_id=agent_id,
            agent_name=agent["name"],
            event_type=action,
            description=description,
            location=location,
            timestamp=time_str
        )

        # Store memory if meaningful
        if memory_text:
            Repository.add_memory(
                db=db,
                agent_id=agent_id,
                text=memory_text,
                importance=importance,
                event_type=action,
                related_agent=target
            )

        updated_agent = Repository.get_agent(db, agent_id)

        return {
            "status": "success",
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "action": action,
            "location": location,
            "target": target,
            "reason": reason,
            "dialogue": dialogue,
            "action_detail": action_detail,
            "description": description,
            "energy": updated_agent["energy"] if updated_agent else agent["energy"],
            "happiness": updated_agent["happiness"] if updated_agent else agent["happiness"],
            "inventory": updated_agent["inventory"] if updated_agent else agent["inventory"],
            "time": time_str
        }
