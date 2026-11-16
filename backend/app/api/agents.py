from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database.session import get_db
from ..database.repository import Repository
from ..agents.decision_engine import DecisionEngine
from ..simulation.action_executor import ActionExecutor
from ..social.relationship_manager import RelationshipManager
from ..social.conversation import ConversationEngine
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

@router.get("/{agent_id}/relationships")
def get_agent_relationships(agent_id: str, db: Session = Depends(get_db)):
    agent = Repository.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return Repository.get_agent_relationships(db, agent_id)

@router.post("/{agent_id}/converse/{target_id}")
async def trigger_conversation(agent_id: str, target_id: str, db: Session = Depends(get_db)):
    """Manually triggers a dynamic in-character conversation between two villagers using Llama 3.2"""
    if agent_id == target_id:
        raise HTTPException(status_code=400, detail="An agent cannot converse with themselves")

    agent_a = Repository.get_agent(db, agent_id)
    agent_b = Repository.get_agent(db, target_id)
    if not agent_a or not agent_b:
        raise HTTPException(status_code=404, detail="One or both agents not found")

    convo = await ConversationEngine.generate_conversation(
        db=db,
        agent_a=agent_a,
        agent_b=agent_b,
        location_name=agent_a["location"],
    )

    # Broadcast conversation to all connected frontend clients
    await manager.broadcast({
        "type": "agent_conversation",
        "data": convo
    })

    return convo

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
    nearby_ids = [
        a["id"] for a in all_agents
        if a["id"] != agent_id and a["location"] == agent["location"]
    ]
    rel_text = RelationshipManager.get_relationship_prompt_text(db, agent_id, nearby_ids)

    decision = await DecisionEngine.decide_next_action(
        agent=agent,
        world=world,
        memories=memories,
        nearby_agents=nearby,
        relationships_text=rel_text
    )

    result = ActionExecutor.execute(db, agent_id, decision)

    # Broadcast over WebSocket
    await manager.broadcast({
        "type": "agent_action",
        "data": result
    })

    # If action is talk and target exists, trigger dynamic conversation
    target_id = result.get("target")
    convo_result = None
    if target_id:
        target_agent = Repository.get_agent(db, target_id)
        if target_agent:
            convo_result = await ConversationEngine.generate_conversation(
                db=db,
                agent_a=agent,
                agent_b=target_agent,
                location_name=result["location"],
                initial_topic=decision.get("reason")
            )
            await manager.broadcast({
                "type": "agent_conversation",
                "data": convo_result
            })

    return {
        "agent": agent["name"],
        "decision": decision,
        "execution": result,
        "conversation": convo_result
    }
