from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..database.repository import Repository
from ..social.relationship_manager import RelationshipManager
from ..llm.prompts import format_time_string
from ..memory.memory_manager import memory_manager
from ..memory.promise_tracker import promise_tracker

class ActionExecutor:
    @staticmethod
    def execute(db: Session, agent_id: str, decision: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates simulation rules, updates database state, logs events, applies social/inventory deltas,
        and returns the execution result.
        """
        agent = Repository.get_agent(db, agent_id)
        if not agent:
            return {"status": "error", "message": "Agent not found"}

        action = decision.get("action", "idle")
        location = decision.get("location", agent["location"])
        reason = decision.get("reason", "")
        dialogue = decision.get("dialogue")
        raw_target = decision.get("target")

        # Resolve target ID to valid agent if provided
        target_id: Optional[str] = None
        if raw_target:
            t_clean = str(raw_target).lower().strip()
            for possible_id in ["alex", "mia", "noah", "emma", "leo"]:
                if possible_id in t_clean and possible_id != agent_id:
                    target_id = possible_id
                    break

        world = Repository.get_world_state(db)
        time_str = format_time_string(world.get("time_minutes", 510))

        energy_delta = 0
        happiness_delta = 0
        inventory_delta: Dict[str, int] = {}
        action_detail = ""
        memory_text: Optional[str] = None
        importance = 0.3
        target_agent = Repository.get_agent(db, target_id) if target_id else None
        target_name = target_agent["name"] if target_agent else (raw_target or "villagers")

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
                inventory_delta = {"food": 1} # bread/food
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
                inventory_delta = {"food": 1} # herbs/remedies
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
            action_detail = f"Speaking with {target_name}"
            description = f"Spoke with {target_name} at {location}."
            if dialogue:
                memory_text = f"Said to {target_name}: '{dialogue}'"
                importance = 0.6

            if target_id:
                RelationshipManager.apply_social_interaction(
                    db=db,
                    source_id=agent_id,
                    target_id=target_id,
                    interaction_type="talk",
                    topic=reason or "daily village life"
                )

        elif action == "trade":
            energy_delta = -2
            happiness_delta = 3
            partner_id = target_id or ("noah" if agent_id != "noah" else "alex")
            partner = Repository.get_agent(db, partner_id)
            partner_name = partner["name"] if partner else "Merchant Noah"

            action_detail = f"Trading resources with {partner_name}"
            description = f"Exchanged trading goods with {partner_name} at {location}."
            memory_text = f"Successfully traded supplies with {partner_name}."
            importance = 0.7

            # Resource exchange logic
            inv_a = agent.get("inventory", {})
            if partner:
                if agent_id == "alex" and inv_a.get("food", 0) >= 1:
                    inventory_delta = {"food": -1, "coins": 2}
                    Repository.update_agent_state(db, partner_id, inventory_updates={"food": 1, "coins": -2})
                elif agent_id == "mia" and inv_a.get("food", 0) >= 1:
                    inventory_delta = {"food": -1, "coins": 2}
                    Repository.update_agent_state(db, partner_id, inventory_updates={"food": 1, "coins": -2})
                elif agent_id == "leo" and inv_a.get("wood", 0) >= 1:
                    inventory_delta = {"wood": -1, "coins": 3}
                    Repository.update_agent_state(db, partner_id, inventory_updates={"wood": 1, "coins": -3})
                else:
                    inventory_delta = {"coins": 1}

                RelationshipManager.apply_social_interaction(
                    db=db,
                    source_id=agent_id,
                    target_id=partner_id,
                    interaction_type="trade",
                    topic="supplies and coin exchange"
                )

        elif action == "help":
            energy_delta = -3
            happiness_delta = 5
            helped_id = target_id or ("alex" if agent_id != "alex" else "mia")
            helped_agent = Repository.get_agent(db, helped_id)
            helped_name = helped_agent["name"] if helped_agent else "a fellow villager"

            action_detail = f"Assisting {helped_name} with daily tasks"
            description = f"Helped {helped_name} with their chores at {location}."
            memory_text = f"Lent a helping hand to {helped_name}."
            importance = 0.7

            if helped_agent:
                # Boost helped agent's energy & happiness
                Repository.update_agent_state(db, helped_id, energy_delta=8, happiness_delta=6)
                RelationshipManager.apply_social_interaction(
                    db=db,
                    source_id=agent_id,
                    target_id=helped_id,
                    interaction_type="help",
                    topic="community chore support"
                )

        else: # idle
            action_detail = "Observing village surroundings"
            description = f"Stood at {location} enjoying the morning air."

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

        # Log event in global history
        Repository.add_event(
            db=db,
            agent_id=agent_id,
            agent_name=agent["name"],
            event_type=action,
            description=description,
            location=location,
            timestamp=time_str
        )

        # Check if this action fulfills any pending commitments/promises
        fulfilled_promises = promise_tracker.check_and_fulfill(
            db=db,
            agent_id=agent_id,
            action=action,
            action_detail=action_detail,
            location=location,
            target_agent=target_id,
        )

        for p in fulfilled_promises:
            fulfill_note = f"Kept promise to {p['target_agent_id'].capitalize()}: '{p['content']}'"
            memory_manager.add_memory(
                db=db,
                agent_id=agent_id,
                text=fulfill_note,
                event_type="promise",
                related_agent=p["target_agent_id"],
                location=location,
                day=world.get("day", 1),
                is_promise=True,
            )
            # Boost relationship trust for keeping promise
            RelationshipManager.apply_social_interaction(
                db=db,
                source_id=agent_id,
                target_id=p["target_agent_id"],
                interaction_type="help",
                topic=f"kept promise: {p['content'][:30]}",
                custom_trust_delta=6,
                custom_friendship_delta=4,
            )
            Repository.add_event(
                db=db,
                agent_id=agent_id,
                agent_name=agent["name"],
                event_type="promise_fulfilled",
                description=f"Fulfilled commitment to {p['target_agent_id'].capitalize()}: \"{p['content']}\"",
                location=location,
                timestamp=time_str,
            )

        # Store experience in MemoryManager (with ChromaDB vector indexing)
        if memory_text:
            memory_manager.add_memory(
                db=db,
                agent_id=agent_id,
                text=memory_text,
                event_type=action,
                related_agent=target_id or raw_target,
                location=location,
                day=world.get("day", 1),
            )

        updated_agent = Repository.get_agent(db, agent_id)

        return {
            "status": "success",
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "action": action,
            "location": location,
            "target": target_id or raw_target,
            "reason": reason,
            "dialogue": dialogue,
            "action_detail": action_detail,
            "description": description,
            "energy": updated_agent["energy"] if updated_agent else agent["energy"],
            "happiness": updated_agent["happiness"] if updated_agent else agent["happiness"],
            "inventory": updated_agent["inventory"] if updated_agent else agent["inventory"],
            "relationships": updated_agent.get("relationships", {}),
            "fulfilled_promises": fulfilled_promises,
            "time": time_str
        }
