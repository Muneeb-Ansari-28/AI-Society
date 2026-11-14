import asyncio
import logging
from typing import Optional, List
from ..database.session import SessionLocal
from ..database.repository import Repository
from ..agents.decision_engine import DecisionEngine
from .action_executor import ActionExecutor
from ..api.websocket import manager
from ..config import SIMULATION_TICK_SECONDS

logger = logging.getLogger("tiny_society.scheduler")

class SimulationScheduler:
    def __init__(self):
        self.is_running = True
        self.speed = 1.0
        self.task: Optional[asyncio.Task] = None
        # Agent rotation list (Focus on Alex for Phase 2 AI loop, with other villagers scheduled)
        self.agent_queue: List[str] = ["alex", "mia", "noah", "emma", "leo"]
        self.current_agent_index = 0

    def start(self):
        if not self.task or self.task.done():
            self.is_running = True
            self.task = asyncio.create_task(self._run_loop())
            logger.info("Simulation scheduler loop started.")

    def pause(self):
        self.is_running = False
        logger.info("Simulation scheduler paused.")

    def resume(self):
        self.is_running = True
        logger.info("Simulation scheduler resumed.")

    def set_speed(self, speed: float):
        self.speed = max(0.5, min(10.0, speed))
        logger.info(f"Simulation speed set to {self.speed}x.")

    async def _run_loop(self):
        while True:
            try:
                # Delay based on simulation speed (e.g. 6s at 1x, 3s at 2x)
                delay = max(2.0, SIMULATION_TICK_SECONDS / self.speed)
                await asyncio.sleep(delay)

                if not self.is_running:
                    continue

                db = SessionLocal()
                try:
                    # 1. Advance simulation time
                    Repository.update_world_time(db, delta_minutes=2)
                    world = Repository.get_world_state(db)

                    # Broadcast world tick
                    await manager.broadcast({
                        "type": "world_tick",
                        "data": world
                    })

                    # 2. Select agent for this AI decision cycle
                    # Phase 2 prioritizes Alex every other tick to make his AI loop immediately evident
                    agent_id = self.agent_queue[self.current_agent_index]
                    self.current_agent_index = (self.current_agent_index + 1) % len(self.agent_queue)

                    agent = Repository.get_agent(db, agent_id)
                    if not agent:
                        continue

                    # 3. Retrieve memories and nearby agents
                    memories = Repository.get_agent_memories(db, agent_id, limit=4)
                    all_agents = Repository.get_all_agents(db)
                    nearby = [
                        a["name"] for a in all_agents
                        if a["id"] != agent_id and a["location"] == agent["location"]
                    ]

                    # 4. Generate AI decision using Ollama Llama 3.2
                    decision = await DecisionEngine.decide_next_action(
                        agent=agent,
                        world=world,
                        memories=memories,
                        nearby_agents=nearby
                    )

                    # 5. Execute action & update database
                    result = ActionExecutor.execute(db, agent_id, decision)

                    # 6. Broadcast live action to Phaser frontend
                    await manager.broadcast({
                        "type": "agent_action",
                        "data": result
                    })

                    # 7. Broadcast event log
                    await manager.broadcast({
                        "type": "event_logged",
                        "data": {
                            "id": f"{agent_id}_{world.get('time_minutes')}",
                            "agent_id": agent_id,
                            "agent_name": agent["name"],
                            "type": result["action"],
                            "description": result["description"],
                            "location": result["location"],
                            "time": result["time"]
                        }
                    })

                finally:
                    db.close()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler tick: {e}", exc_info=True)
                await asyncio.sleep(2)

# Global singleton
scheduler = SimulationScheduler()
