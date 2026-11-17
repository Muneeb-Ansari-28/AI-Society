from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..database.session import get_db
from ..database.repository import Repository
from ..agents.decision_engine import DecisionEngine
from ..simulation.action_executor import ActionExecutor
from ..social.relationship_manager import RelationshipManager
from ..social.conversation import ConversationEngine
from ..memory.memory_manager import memory_manager
from ..memory.promise_tracker import promise_tracker
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
def get_agent_memories(agent_id: str, limit: int = 15, db: Session = Depends(get_db)):
    """Returns detailed agent memories (short-term & long-term) with importance scores"""
    return Repository.get_agent_memory_details(db, agent_id, limit=limit)

@router.post("/{agent_id}/memories/search")
def search_agent_memories(agent_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Semantic vector search across an agent's ChromaDB memory"""
    query = payload.get("query", "")
    n_results = int(payload.get("limit", 4))
    min_importance = float(payload.get("min_importance", 0.0))
    return memory_manager.search_relevant_memories(
        db=db,
        agent_id=agent_id,
        query=query,
        n_results=n_results,
        min_importance=min_importance,
    )

@router.post("/{agent_id}/memories")
def add_agent_memory(agent_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Manually add an experience or observation to an agent's memory"""
    text = payload.get("text", "")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    event_type = payload.get("event_type", "observation")
    related_agent = payload.get("related_agent")
    location = payload.get("location", "")
    day = int(payload.get("day", 1))
    is_promise = bool(payload.get("is_promise", False))

    return memory_manager.add_memory(
        db=db,
        agent_id=agent_id,
        text=text,
        event_type=event_type,
        related_agent=related_agent,
        location=location,
        day=day,
        is_promise=is_promise,
    )

@router.get("/{agent_id}/promises")
def get_agent_promises(agent_id: str, db: Session = Depends(get_db)):
    """Returns all active, fulfilled, or pending promises involving this villager"""
    return Repository.get_all_promises_for_agent(db, agent_id)

@router.post("/{agent_id}/promises")
def create_agent_promise(agent_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Creates a new promise / commitment for an agent"""
    target_id = payload.get("target_id")
    content = payload.get("content", "")
    if not target_id or not content:
        raise HTTPException(status_code=400, detail="target_id and content required")
    day_made = int(payload.get("day_made", 1))
    deadline_day = int(payload.get("deadline_day", day_made + 1))
    p = Repository.create_promise(db, agent_id, target_id, content, day_made, deadline_day)
    return {
        "id": p.id,
        "agent_id": p.agent_id,
        "target_agent_id": p.target_agent_id,
        "content": p.content,
        "day_made": p.day_made,
        "deadline_day": p.deadline_day,
        "status": p.status,
    }

@router.post("/promises/{promise_id}/fulfill")
def fulfill_promise(promise_id: int, db: Session = Depends(get_db)):
    """Marks a promise fulfilled in the simulation"""
    success = Repository.update_promise_status(db, promise_id, "fulfilled")
    if not success:
        raise HTTPException(status_code=404, detail="Promise not found")
    return {"status": "success", "promise_id": promise_id}

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
    mem_context = memory_manager.build_agent_context(
        db=db,
        agent_id=agent_id,
        situation=f"At {agent['location']} with energy {agent['energy']}",
        nearby_agents=nearby,
        current_day=world.get("day", 1),
    )

    decision = await DecisionEngine.decide_next_action(
        agent=agent,
        world=world,
        memories=[m["text"] for m in mem_context["recent_memories"]],
        nearby_agents=nearby,
        relationships_text=rel_text,
        promises_text=mem_context["promises_text"],
        semantic_memories_text=mem_context["memories_text"],
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
