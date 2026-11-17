import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class AgentModel(Base):
    __tablename__ = "agents"

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    occupation = Column(String(100), nullable=False)
    color = Column(String(20), default="#38a169")
    personality = Column(Text, nullable=False)
    goals = Column(Text, nullable=False)
    conflict = Column(Text, default="")
    home_location = Column(String(100), default="town_square")
    work_location = Column(String(100), default="town_square")

class AgentStateModel(Base):
    __tablename__ = "agent_states"

    agent_id = Column(String(50), primary_key=True)
    energy = Column(Integer, default=100)
    happiness = Column(Integer, default=75)
    location = Column(String(100), default="alex_farm")
    current_action = Column(String(50), default="idle")
    action_detail = Column(Text, default="Observing surroundings")
    inventory_json = Column(Text, default="{}")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_inventory(self) -> dict:
        try:
            return json.loads(self.inventory_json)
        except Exception:
            return {}

    def set_inventory(self, data: dict):
        self.inventory_json = json.dumps(data)

class RelationshipModel(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=False)
    trust = Column(Integer, default=50) # 0 to 100
    friendship = Column(Integer, default=50) # 0 to 100
    last_interaction = Column(String(100), default="")

class EventModel(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(50), nullable=False)
    agent_name = Column(String(100), nullable=False)
    event_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(100), default="")
    timestamp = Column(String(50), default="")

class MemoryModel(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(50), nullable=False)
    text = Column(Text, nullable=False)
    importance = Column(Float, default=0.5)
    event_type = Column(String(50), default="observation")
    related_agent = Column(String(50), nullable=True)
    location = Column(String(100), default="")
    day = Column(Integer, default=1)
    is_promise = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class PromiseModel(Base):
    __tablename__ = "promises"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(String(50), nullable=False) # Promiser
    target_agent_id = Column(String(50), nullable=False) # Beneficiary / Promisee
    content = Column(Text, nullable=False)
    day_made = Column(Integer, default=1)
    deadline_day = Column(Integer, default=2)
    status = Column(String(20), default="active") # active, fulfilled, expired
    created_at = Column(DateTime, default=datetime.utcnow)

class WorldStateModel(Base):
    __tablename__ = "world_state"

    id = Column(Integer, primary_key=True, default=1)
    day = Column(Integer, default=1)
    time_minutes = Column(Integer, default=510) # 08:30 AM = 8*60+30
    is_running = Column(Boolean, default=True)
    speed = Column(Float, default=1.0)
    weather = Column(String(50), default="Sunny")
