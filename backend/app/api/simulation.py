from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List

from ..database.session import get_db
from ..database.repository import Repository
from ..simulation.scheduler import scheduler
from ..api.websocket import manager

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

class SpeedRequest(BaseModel):
    speed: float

@router.get("/world")
def get_world(db: Session = Depends(get_db)):
    return Repository.get_world_state(db)

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
    return {"status": "started"}

@router.post("/pause")
async def pause_simulation():
    scheduler.pause()
    await manager.broadcast({
        "type": "simulation_status",
        "data": {"is_running": False}
    })
    return {"status": "paused"}

@router.post("/speed")
async def set_speed(req: SpeedRequest):
    scheduler.set_speed(req.speed)
    await manager.broadcast({
        "type": "simulation_speed",
        "data": {"speed": req.speed}
    })
    return {"status": "updated", "speed": req.speed}

@router.post("/reset")
async def reset_simulation(db: Session = Depends(get_db)):
    Repository.initialize_default_data(db)
    world = Repository.get_world_state(db)
    await manager.broadcast({
        "type": "world_reset",
        "data": world
    })
    return {"status": "reset"}
