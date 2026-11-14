from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database.session import get_db
from ..database.repository import Repository
from ..agents.decision_engine import DecisionEngine
from ..simulation.action_executor import ActionExecutor
from ..api.websocket import manager

router = APIRouter(prefix="/api/agents", tags=["Agents"])

@router.get("", response_model=List[Dict[str, Any]])
def list_agents(db: Session = Depends(get_db)):
    return Repository.get_all_agents(db)

@router.get("/{agent_id}")
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = Repository.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.get("/{agent_id}/memories")
def get_agent_memories(agent_id: str, limit: int = 10, db: Session = Depends(get_db)):
    return Repository.get_agent_memories(db, agent_id, limit=limit)

@router.post("/{agent_id}/decide")
async def trigger_agent_decision(agent_id: str, db: Session = Depends(get_db)):
    """Manually triggers an instant Ollama Llama 3.2 decision cycle for an agent"""
    agent = Repository.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    world = Repository.get_world_state(db)
    memories = Repository.get_agent_memories(db, agent_id, limit=4)
    all_agents = Repository.get_all_agents(db)
    nearby = [
        a["name"] for a in all_agents
        if a["id"] != agent_id and a["location"] == agent["location"]
    ]

    decision = await DecisionEngine.decide_next_action(
        agent=agent,
        world=world,
        memories=memories,
        nearby_agents=nearby
    )

    result = ActionExecutor.execute(db, agent_id, decision)

    # Broadcast over WebSocket
    await manager.broadcast({
        "type": "agent_action",
        "data": result
    })

    return {
        "agent": agent["name"],
        "decision": decision,
        "execution": result
    }
