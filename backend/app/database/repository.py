import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import AgentModel, AgentStateModel, EventModel, MemoryModel, PromiseModel, RelationshipModel, WorldStateModel
from ..agents.personalities import AGENT_PROFILES

DEFAULT_RELATIONSHIPS = [
    ("alex", "mia", 65, 70, "Friendly trade partners: grain for baked bread"),
    ("alex", "noah", 55, 50, "Business acquaintances: seeds and farm tools"),
    ("alex", "emma", 70, 65, "Warm neighbors: herbal salves for farm aches"),
    ("alex", "leo", 65, 65, "Supportive villagers: barn repairs and oak timber"),
    ("mia", "noah", 45, 45, "Barter tension over honey and flour prices"),
    ("mia", "emma", 75, 80, "Close friends: morning tea and fresh pastries"),
    ("mia", "leo", 55, 55, "Good neighbors: pastry delivery for carpentry"),
    ("noah", "emma", 60, 55, "Respectful traders: rare medicinal roots from caravan"),
    ("noah", "leo", 60, 55, "Trading partners: saw blades and timber orders"),
    ("emma", "leo", 65, 65, "Caring friend: reminding Leo not to work late"),
]

class Repository:
    @staticmethod
    def initialize_default_data(db: Session):
        """Populate database with default agents, initial states, world state, and relationships"""
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

        # 3. Initialize default relationships (bidirectional)
        for s_id, t_id, trust, friendship, note in DEFAULT_RELATIONSHIPS:
            # Source -> Target
            rel_forward = db.query(RelationshipModel).filter(
                RelationshipModel.source_id == s_id,
                RelationshipModel.target_id == t_id
            ).first()
            if not rel_forward:
                db.add(RelationshipModel(
                    source_id=s_id,
                    target_id=t_id,
                    trust=trust,
                    friendship=friendship,
                    last_interaction=note
                ))

            # Target -> Source
            rel_reverse = db.query(RelationshipModel).filter(
                RelationshipModel.source_id == t_id,
                RelationshipModel.target_id == s_id
            ).first()
            if not rel_reverse:
                db.add(RelationshipModel(
                    source_id=t_id,
                    target_id=s_id,
                    trust=trust,
                    friendship=friendship,
                    last_interaction=note
                ))

        db.commit()

    @staticmethod
    def get_agent_relationships(db: Session, agent_id: str) -> Dict[str, Dict[str, Any]]:
        rels = db.query(RelationshipModel).filter(RelationshipModel.source_id == agent_id).all()
        result = {}
        for r in rels:
            target_profile = AGENT_PROFILES.get(r.target_id, {})
            result[r.target_id] = {
                "name": target_profile.get("name", r.target_id.capitalize()),
                "occupation": target_profile.get("occupation", ""),
                "trust": r.trust,
                "friendship": r.friendship,
                "last_interaction": r.last_interaction,
            }
        return result

    @staticmethod
    def get_relationship(db: Session, source_id: str, target_id: str) -> Optional[Dict[str, Any]]:
        rel = db.query(RelationshipModel).filter(
            RelationshipModel.source_id == source_id,
            RelationshipModel.target_id == target_id
        ).first()
        if not rel:
            return None
        return {
            "source_id": rel.source_id,
            "target_id": rel.target_id,
            "trust": rel.trust,
            "friendship": rel.friendship,
            "last_interaction": rel.last_interaction,
        }

    @staticmethod
    def update_relationship(
        db: Session,
        source_id: str,
        target_id: str,
        trust_delta: int = 0,
        friendship_delta: int = 0,
        interaction: str = ""
    ):
        """Update directional relationship scores and reciprocity"""
        for s, t in [(source_id, target_id), (target_id, source_id)]:
            rel = db.query(RelationshipModel).filter(
                RelationshipModel.source_id == s,
                RelationshipModel.target_id == t
            ).first()
            if rel:
                rel.trust = max(0, min(100, rel.trust + trust_delta))
                rel.friendship = max(0, min(100, rel.friendship + friendship_delta))
                if interaction:
                    rel.last_interaction = interaction
            else:
                db.add(RelationshipModel(
                    source_id=s,
                    target_id=t,
                    trust=max(0, min(100, 50 + trust_delta)),
                    friendship=max(0, min(100, 50 + friendship_delta)),
                    last_interaction=interaction
                ))
        db.commit()

    @staticmethod
    def get_agent(db: Session, agent_id: str) -> Optional[Dict[str, Any]]:
        agent = db.query(AgentModel).filter(AgentModel.id == agent_id).first()
        state = db.query(AgentStateModel).filter(AgentStateModel.agent_id == agent_id).first()
        if not agent or not state:
            return None

        memories = Repository.get_agent_memories(db, agent_id, limit=5)
        relationships = Repository.get_agent_relationships(db, agent_id)

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
            "relationships": relationships,
            "recent_memories": memories,
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
    def add_memory(
        db: Session,
        agent_id: str,
        text: str,
        importance: float = 0.5,
        event_type: str = "event",
        related_agent: Optional[str] = None,
        location: str = "",
        day: int = 1,
        is_promise: bool = False,
    ) -> MemoryModel:
        mem = MemoryModel(
            agent_id=agent_id,
            text=text,
            importance=importance,
            event_type=event_type,
            related_agent=related_agent,
            location=location,
            day=day,
            is_promise=is_promise,
        )
        db.add(mem)
        db.commit()
        db.refresh(mem)
        return mem

    @staticmethod
    def get_agent_memories(db: Session, agent_id: str, limit: int = 10) -> List[str]:
        memories = db.query(MemoryModel).filter(MemoryModel.agent_id == agent_id).order_by(MemoryModel.id.desc()).limit(limit).all()
        return [m.text for m in memories]

    @staticmethod
    def get_agent_memory_details(db: Session, agent_id: str, limit: int = 25) -> List[Dict[str, Any]]:
        memories = db.query(MemoryModel).filter(MemoryModel.agent_id == agent_id).order_by(MemoryModel.id.desc()).limit(limit).all()
        return [
            {
                "id": m.id,
                "agent_id": m.agent_id,
                "text": m.text,
                "importance": round(m.importance, 2),
                "event_type": m.event_type,
                "related_agent": m.related_agent,
                "location": m.location,
                "day": m.day,
                "is_promise": bool(m.is_promise),
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in memories
        ]

    @staticmethod
    def create_promise(
        db: Session,
        agent_id: str,
        target_agent_id: str,
        content: str,
        day_made: int = 1,
        deadline_day: int = 2,
        status: str = "active",
    ) -> PromiseModel:
        promise = PromiseModel(
            agent_id=agent_id,
            target_agent_id=target_agent_id,
            content=content,
            day_made=day_made,
            deadline_day=deadline_day,
            status=status,
        )
        db.add(promise)
        db.commit()
        db.refresh(promise)
        return promise

    @staticmethod
    def get_active_promises(db: Session, agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(PromiseModel).filter(PromiseModel.status == "active")
        if agent_id:
            query = query.filter((PromiseModel.agent_id == agent_id) | (PromiseModel.target_agent_id == agent_id))
        promises = query.order_by(PromiseModel.id.desc()).all()
        return [
            {
                "id": p.id,
                "agent_id": p.agent_id,
                "target_agent_id": p.target_agent_id,
                "content": p.content,
                "day_made": p.day_made,
                "deadline_day": p.deadline_day,
                "status": p.status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in promises
        ]

    @staticmethod
    def get_all_promises_for_agent(db: Session, agent_id: str) -> List[Dict[str, Any]]:
        promises = db.query(PromiseModel).filter(
            (PromiseModel.agent_id == agent_id) | (PromiseModel.target_agent_id == agent_id)
        ).order_by(PromiseModel.id.desc()).all()
        return [
            {
                "id": p.id,
                "agent_id": p.agent_id,
                "target_agent_id": p.target_agent_id,
                "content": p.content,
                "day_made": p.day_made,
                "deadline_day": p.deadline_day,
                "status": p.status,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in promises
        ]

    @staticmethod
    def update_promise_status(db: Session, promise_id: int, status: str) -> bool:
        p = db.query(PromiseModel).filter(PromiseModel.id == promise_id).first()
        if p:
            p.status = status
            db.commit()
            return True
        return False

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
