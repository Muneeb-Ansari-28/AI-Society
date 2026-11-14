import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import AgentModel, AgentStateModel, EventModel, MemoryModel, RelationshipModel, WorldStateModel
from ..agents.personalities import AGENT_PROFILES

class Repository:
    @staticmethod
    def initialize_default_data(db: Session):
        """Populate database with default agents and initial states if empty"""
        # 1. Initialize agents and states
        for aid, profile in AGENT_PROFILES.items():
            existing_agent = db.query(AgentModel).filter(AgentModel.id == aid).first()
            if not existing_agent:
                agent = AgentModel(
                    id=aid,
                    name=profile["name"],
                    occupation=profile["occupation"],
                    color=profile["color"],
                    personality=profile["personality"],
                    goals=profile["goals"],
                    conflict=profile["conflict"],
                    home_location=profile["home_location"],
                    work_location=profile["work_location"],
                )
                db.add(agent)

            existing_state = db.query(AgentStateModel).filter(AgentStateModel.agent_id == aid).first()
            if not existing_state:
                state = AgentStateModel(
                    agent_id=aid,
                    energy=100,
                    happiness=75,
                    location=profile["home_location"],
                    current_action="idle",
                    action_detail=f"Resting at {profile['home_location']}",
                    inventory_json=json.dumps(profile["initial_inventory"]),
                )
                db.add(state)

        # 2. Initialize default world state
        world = db.query(WorldStateModel).filter(WorldStateModel.id == 1).first()
        if not world:
            world = WorldStateModel(id=1, day=1, time_minutes=510, is_running=True, speed=1.0, weather="Sunny")
            db.add(world)

        db.commit()

    @staticmethod
    def get_agent(db: Session, agent_id: str) -> Optional[Dict[str, Any]]:
        agent = db.query(AgentModel).filter(AgentModel.id == agent_id).first()
        state = db.query(AgentStateModel).filter(AgentStateModel.agent_id == agent_id).first()
        if not agent or not state:
            return None

        return {
            "id": agent.id,
            "name": agent.name,
            "occupation": agent.occupation,
            "color": agent.color,
            "personality": agent.personality,
            "goals": agent.goals,
            "conflict": agent.conflict,
            "home_location": agent.home_location,
            "work_location": agent.work_location,
            "energy": state.energy,
            "happiness": state.happiness,
            "location": state.location,
            "current_action": state.current_action,
            "action_detail": state.action_detail,
            "inventory": state.get_inventory(),
        }

    @staticmethod
    def get_all_agents(db: Session) -> List[Dict[str, Any]]:
        agents = db.query(AgentModel).all()
        results = []
        for a in agents:
            data = Repository.get_agent(db, a.id)
            if data:
                results.append(data)
        return results

    @staticmethod
    def update_agent_state(
        db: Session,
        agent_id: str,
        location: Optional[str] = None,
        action: Optional[str] = None,
        action_detail: Optional[str] = None,
        energy_delta: int = 0,
        happiness_delta: int = 0,
        inventory_updates: Optional[Dict[str, int]] = None,
    ):
        state = db.query(AgentStateModel).filter(AgentStateModel.agent_id == agent_id).first()
        if not state:
            return

        if location is not None:
            state.location = location
        if action is not None:
            state.current_action = action
        if action_detail is not None:
            state.action_detail = action_detail

        state.energy = max(0, min(100, state.energy + energy_delta))
        state.happiness = max(0, min(100, state.happiness + happiness_delta))

        if inventory_updates:
            inv = state.get_inventory()
            for item, delta in inventory_updates.items():
                inv[item] = max(0, inv.get(item, 0) + delta)
            state.set_inventory(inv)

        db.commit()

    @staticmethod
    def add_event(db: Session, agent_id: str, agent_name: str, event_type: str, description: str, location: str, timestamp: str):
        event = EventModel(
            agent_id=agent_id,
            agent_name=agent_name,
            event_type=event_type,
            description=description,
            location=location,
            timestamp=timestamp,
        )
        db.add(event)
        db.commit()

    @staticmethod
    def get_recent_events(db: Session, limit: int = 30) -> List[Dict[str, Any]]:
        events = db.query(EventModel).order_by(EventModel.id.desc()).limit(limit).all()
        return [
            {
                "id": str(e.id),
                "agent_id": e.agent_id,
                "agent_name": e.agent_name,
                "type": e.event_type,
                "description": e.description,
                "location": e.location,
                "time": e.timestamp,
            }
            for e in reversed(events)
        ]

    @staticmethod
    def add_memory(db: Session, agent_id: str, text: str, importance: float = 0.5, event_type: str = "event", related_agent: Optional[str] = None):
        mem = MemoryModel(
            agent_id=agent_id,
            text=text,
            importance=importance,
            event_type=event_type,
            related_agent=related_agent,
        )
        db.add(mem)
        db.commit()

    @staticmethod
    def get_agent_memories(db: Session, agent_id: str, limit: int = 5) -> List[str]:
        memories = db.query(MemoryModel).filter(MemoryModel.agent_id == agent_id).order_by(MemoryModel.id.desc()).limit(limit).all()
        return [m.text for m in memories]

    @staticmethod
    def get_world_state(db: Session) -> Dict[str, Any]:
        world = db.query(WorldStateModel).filter(WorldStateModel.id == 1).first()
        if not world:
            return {"day": 1, "time_minutes": 510, "is_running": True, "speed": 1.0, "weather": "Sunny"}
        return {
            "day": world.day,
            "time_minutes": world.time_minutes,
            "is_running": world.is_running,
            "speed": world.speed,
            "weather": world.weather,
        }

    @staticmethod
    def update_world_time(db: Session, delta_minutes: int):
        world = db.query(WorldStateModel).filter(WorldStateModel.id == 1).first()
        if world and world.is_running:
            world.time_minutes += int(delta_minutes * world.speed)
            if world.time_minutes >= 24 * 60:
                world.time_minutes = 0
                world.day += 1
            db.commit()
