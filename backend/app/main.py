from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import OLLAMA_MODEL
from .database.session import init_db, SessionLocal
from .database.repository import Repository
from .simulation.scheduler import scheduler
from .api.websocket import manager
from .api.agents import router as agents_router
from .api.simulation import router as simulation_router
from .agents.personalities import AGENT_PROFILES
from .llm.ollama_client import ollama_client

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite Database & populate default agents
    init_db()
    db = SessionLocal()
    try:
        Repository.initialize_default_data(db)
    finally:
        db.close()

    # 2. Start simulation scheduler background loop
    scheduler.start()
    yield

    # Clean shutdown
    scheduler.pause()

app = FastAPI(title="Tiny Society API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router)
app.include_router(simulation_router)

class InteractRequest(BaseModel):
    message: str

class InteractResponse(BaseModel):
    agent_id: str
    agent_name: str
    response: str
    mood: str

@app.get("/health")
async def health_check():
    ollama_ok = await ollama_client.check_health()
    return {
        "status": "healthy",
        "ollama_model": OLLAMA_MODEL,
        "ollama_connected": ollama_ok,
        "version": "2.0.0"
    }

@app.post("/api/agents/{agent_id}/interact", response_model=InteractResponse)
async def interact_with_agent(agent_id: str, req: InteractRequest):
    if agent_id not in AGENT_PROFILES:
        raise HTTPException(status_code=404, detail="Agent not found")

    profile = AGENT_PROFILES[agent_id]
    name = profile["name"]
    occupation = profile["occupation"]
    personality = profile["personality"]
    goals = profile["goals"]

    system_prompt = (
        f"You are {name}, a {occupation} living in the peaceful village of Tiny Society.\n"
        f"Personality: {personality}\n"
        f"Your goals: {goals}\n"
        f"Stay strictly in character. Keep responses brief (1 to 2 sentences), warm, and immersive."
    )

    try:
        reply = await ollama_client.generate(prompt=req.message, system=system_prompt)
        reply = reply.strip().strip('"')
    except Exception:
        reply = f"Hello traveler! I am {name}. Glad you stopped by our village today."

    return InteractResponse(
        agent_id=agent_id,
        agent_name=name,
        response=reply,
        mood="friendly"
    )

@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & handle incoming client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
