from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from ..database.session import get_db
from ..database.repository import Repository
from ..simulation.scheduler import scheduler
from ..simulation.persistence import persistence_manager
from ..api.websocket import manager

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

class SpeedRequest(BaseModel):
    speed: float

class SaveLoadRequest(BaseModel):
    save_name: Optional[str] = "quicksave"

@router.get("/world")
def get_world(db: Session = Depends(get_db)):
    world = Repository.get_world_state(db)
    from ..llm.prompts import format_time_string
    time_str = format_time_string(world.get("time_minutes", 510))
    minutes = world.get("time_minutes", 510)
    period = "Night"
    if 360 <= minutes < 720:
        period = "Morning"
    elif 720 <= minutes < 1080:
        period = "Afternoon"
    elif 1080 <= minutes < 1320:
        period = "Evening"

    world["timeString"] = time_str
    world["period"] = period
    world["isRunning"] = world.get("is_running", True)
    return world

@router.get("/events")
def get_events(limit: int = 30, db: Session = Depends(get_db)):
    return Repository.get_recent_events(db, limit=limit)

@router.post("/start")
async def start_simulation():
    scheduler.resume()
    await manager.broadcast({
        "type": "simulation_status",
        "data": {"is_running": True}
    })
    return {"status": "started", "is_running": True}

@router.post("/pause")
async def pause_simulation():
    scheduler.pause()
    await manager.broadcast({
        "type": "simulation_status",
        "data": {"is_running": False}
    })
    return {"status": "paused", "is_running": False}

@router.post("/speed")
async def set_speed(req: SpeedRequest):
    scheduler.set_speed(req.speed)
    await manager.broadcast({
        "type": "simulation_speed",
        "data": {"speed": req.speed}
    })
    return {"status": "updated", "speed": req.speed}

@router.post("/save")
async def save_simulation(req: SaveLoadRequest = SaveLoadRequest(), db: Session = Depends(get_db)):
    """Saves a complete simulation snapshot (world, agents, inventory, relationships, promises)"""
    res = persistence_manager.save_state(db, save_name=req.save_name or "quicksave")
    await manager.broadcast({
        "type": "simulation_saved",
        "data": res
    })
    return res

@router.post("/load")
async def load_simulation(req: SaveLoadRequest = SaveLoadRequest(), db: Session = Depends(get_db)):
    """Restores full simulation snapshot and syncs all connected clients"""
    res = persistence_manager.load_state(db, save_name=req.save_name or "quicksave")
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))

    await manager.broadcast({
        "type": "world_reset",
        "data": {
            "world": res.get("world"),
            "agents": res.get("agents")
        }
    })
    return res

@router.get("/save/info")
def get_save_info(name: str = "quicksave"):
    info = persistence_manager.get_save_info(name)
    if not info:
        return {"exists": False}
    return info

@router.post("/reset")
async def reset_simulation(db: Session = Depends(get_db)):
    """Hard resets the entire world back to Day 1 Morning defaults"""
    res = persistence_manager.reset_world(db)
    await manager.broadcast({
        "type": "world_reset",
        "data": {
            "world": res.get("world"),
            "agents": res.get("agents")
        }
    })
    return res
