import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from ..database.models import AgentModel, AgentStateModel, RelationshipModel, WorldStateModel, PromiseModel, EventModel
from ..agents.personalities import AGENT_PROFILES
from ..database.repository import Repository, DEFAULT_RELATIONSHIPS

logger = logging.getLogger("tiny_society.persistence")

SAVES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "saves"))

class PersistenceManager:
    """
    Handles saving, loading, and resetting full simulation snapshots.
    Preserves agents, world time, inventories, social relationships, and promises.
    """

    @staticmethod
    def _ensure_dir():
        os.makedirs(SAVES_DIR, exist_ok=True)

    @staticmethod
    def get_save_path(save_name: str = "quicksave") -> str:
        PersistenceManager._ensure_dir()
        safe_name = "".join(c for c in save_name if c.isalnum() or c in ("-", "_")).lower()
        if not safe_name:
            safe_name = "quicksave"
        return os.path.join(SAVES_DIR, f"{safe_name}.json")

    @staticmethod
    def save_state(db: Session, save_name: str = "quicksave") -> Dict[str, Any]:
        """
        Dumps complete simulation state to a JSON snapshot file.
        """
        path = PersistenceManager.get_save_path(save_name)

        world = Repository.get_world_state(db)
        agents = Repository.get_all_agents(db)

        # Get all relationships
        rels = db.query(RelationshipModel).all()
        relationships_data = [
            {
                "source_id": r.source_id,
                "target_id": r.target_id,
                "trust": r.trust,
                "friendship": r.friendship,
                "last_interaction": r.last_interaction,
            }
            for r in rels
        ]

        # Get all promises
        promises = db.query(PromiseModel).all()
        promises_data = [
            {
                "id": p.id,
                "agent_id": p.agent_id,
                "target_agent_id": p.target_agent_id,
                "content": p.content,
                "day_made": p.day_made,
                "deadline_day": p.deadline_day,
                "status": p.status,
            }
            for p in promises
        ]

        snapshot = {
            "version": "1.0",
            "save_name": save_name,
            "saved_at": datetime.now(timezone.utc).isoformat(),
            "world_state": world,
            "agents": agents,
            "relationships": relationships_data,
            "promises": promises_data,
        }

        with open(path, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2)

        # Log save event in simulation
        from ..llm.prompts import format_time_string
        time_str = format_time_string(world.get("time_minutes", 510))
        Repository.add_event(
            db=db,
            agent_id="system",
            agent_name="System",
            event_type="save",
            description=f"Saved simulation state to '{save_name}' (Day {world['day']}, {time_str}).",
            location="village",
            timestamp=time_str,
        )

        logger.info(f"Simulation saved to {path}")
        return {
            "status": "success",
            "save_name": save_name,
            "saved_at": snapshot["saved_at"],
            "world": world,
            "agent_count": len(agents),
            "agents_count": len(agents),
        }

    @staticmethod
    def load_state(db: Session, save_name: str = "quicksave") -> Dict[str, Any]:
        """
        Restores full simulation state from a JSON snapshot file into SQLite.
        """
        path = PersistenceManager.get_save_path(save_name)
        if not os.path.exists(path):
            return {"status": "error", "message": f"Save file '{save_name}' not found."}

        with open(path, "r", encoding="utf-8") as f:
            snapshot = json.load(f)

        # 1. Restore World State
        w_data = snapshot.get("world_state", {})
        world = db.query(WorldStateModel).filter(WorldStateModel.id == 1).first()
        if not world:
            world = WorldStateModel(id=1)
            db.add(world)
        world.day = w_data.get("day", 1)
        world.time_minutes = w_data.get("time_minutes", 510)
        world.speed = w_data.get("speed", 1.0)
        world.weather = w_data.get("weather", "Sunny")
        world.is_running = w_data.get("is_running", True)

        # 2. Restore Agent States
        agents_data = snapshot.get("agents", [])
        for a in agents_data:
            aid = a.get("id")
            state = db.query(AgentStateModel).filter(AgentStateModel.agent_id == aid).first()
            if not state:
                state = AgentStateModel(agent_id=aid)
                db.add(state)
            state.energy = a.get("energy", 100)
            state.happiness = a.get("happiness", 75)
            state.location = a.get("location", "town_square")
            state.current_action = a.get("currentAction", "idle")
            state.action_detail = a.get("actionDetail", "Resting")
            state.inventory_json = json.dumps(a.get("inventory", {}))

        # 3. Restore Relationships
        rels_data = snapshot.get("relationships", [])
        db.query(RelationshipModel).delete()
        for r in rels_data:
            db.add(RelationshipModel(
                source_id=r["source_id"],
                target_id=r["target_id"],
                trust=r["trust"],
                friendship=r["friendship"],
                last_interaction=r.get("last_interaction", ""),
            ))

        # 4. Restore Promises
        promises_data = snapshot.get("promises", [])
        db.query(PromiseModel).delete()
        for p in promises_data:
            db.add(PromiseModel(
                agent_id=p["agent_id"],
                target_agent_id=p["target_agent_id"],
                content=p["content"],
                day_made=p.get("day_made", 1),
                deadline_day=p.get("deadline_day", 2),
                status=p.get("status", "active"),
            ))

        db.commit()

        # Log load event
        from ..llm.prompts import format_time_string
        time_str = format_time_string(world.time_minutes)
        Repository.add_event(
            db=db,
            agent_id="system",
            agent_name="System",
            event_type="load",
            description=f"Loaded simulation state from '{save_name}' (Day {world.day}, {time_str}).",
            location="village",
            timestamp=time_str,
        )

        logger.info(f"Simulation restored from {path}")
        return {
            "status": "success",
            "save_name": save_name,
            "restored_at": datetime.now(timezone.utc).isoformat(),
            "world": Repository.get_world_state(db),
            "agents": Repository.get_all_agents(db),
        }

    @staticmethod
    def reset_world(db: Session) -> Dict[str, Any]:
        """
        Hard resets the entire simulation back to Day 1 Morning defaults.
        """
        # 1. Reset world state
        world = db.query(WorldStateModel).filter(WorldStateModel.id == 1).first()
        if not world:
            world = WorldStateModel(id=1)
            db.add(world)
        world.day = 1
        world.time_minutes = 510 # 08:30 AM
        world.speed = 1.0
        world.weather = "Sunny"
        world.is_running = True

        # 2. Reset agent states to initial profiles
        for aid, profile in AGENT_PROFILES.items():
            state = db.query(AgentStateModel).filter(AgentStateModel.agent_id == aid).first()
            if not state:
                state = AgentStateModel(agent_id=aid)
                db.add(state)
            state.energy = 100
            state.happiness = 75
            state.location = profile["home_location"]
            state.current_action = "idle"
            state.action_detail = f"Waking up refreshed at {profile['home_location']}"
            state.inventory_json = json.dumps(profile["initial_inventory"])

        # 3. Reset relationships
        db.query(RelationshipModel).delete()
        for s_id, t_id, trust, friendship, note in DEFAULT_RELATIONSHIPS:
            db.add(RelationshipModel(source_id=s_id, target_id=t_id, trust=trust, friendship=friendship, last_interaction=note))
            db.add(RelationshipModel(source_id=t_id, target_id=s_id, trust=trust, friendship=friendship, last_interaction=note))

        # 4. Clear active promises
        db.query(PromiseModel).delete()

        db.commit()

        # Log reset event
        Repository.add_event(
            db=db,
            agent_id="system",
            agent_name="System",
            event_type="reset",
            description="Simulation world reset to Day 1 Morning (08:30 AM).",
            location="town_square",
            timestamp="08:30 AM",
        )

        return {
            "status": "success",
            "message": "Simulation world reset to Day 1 Morning defaults.",
            "world": Repository.get_world_state(db),
            "agents": Repository.get_all_agents(db),
        }

    @staticmethod
    def get_save_info(save_name: str = "quicksave") -> Optional[Dict[str, Any]]:
        path = PersistenceManager.get_save_path(save_name)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {
                "exists": True,
                "save_name": data.get("save_name", save_name),
                "saved_at": data.get("saved_at"),
                "world_state": data.get("world_state"),
                "world_day": data.get("world_state", {}).get("day", 1),
                "agents_count": len(data.get("agents", [])),
            }
        except Exception:
            return None

persistence_manager = PersistenceManager()
