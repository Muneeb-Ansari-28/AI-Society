import asyncio
import logging
from typing import Optional, List, Dict
from ..database.session import SessionLocal
from ..database.repository import Repository
from ..agents.decision_engine import DecisionEngine
from .action_executor import ActionExecutor
from ..social.relationship_manager import RelationshipManager
from ..social.conversation import ConversationEngine
from ..api.websocket import manager
from ..config import SIMULATION_TICK_SECONDS

logger = logging.getLogger("tiny_society.scheduler")

class SimulationScheduler:
    def __init__(self):
        self.is_running = True
        self.speed = 1.0
        self.task: Optional[asyncio.Task] = None
        # Staggered round-robin queue across all 5 agents
        self.agent_queue: List[str] = ["alex", "mia", "noah", "emma", "leo"]
        self.current_agent_index = 0
        self.last_conversation_time: Dict[str, float] = {}

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
                # Delay based on simulation speed (e.g. 3.5s at 1x)
                delay = max(2.0, SIMULATION_TICK_SECONDS / self.speed)
                await asyncio.sleep(delay)

                if not self.is_running:
                    continue

                db = SessionLocal()
                try:
                    # 1. Advance simulation clock (2 minutes per tick)
                    Repository.update_world_time(db, delta_minutes=2)
                    world = Repository.get_world_state(db)

                    # Broadcast world tick
                    await manager.broadcast({
                        "type": "world_tick",
                        "data": world
                    })

                    # 2. Select next agent from round-robin queue
                    agent_id = self.agent_queue[self.current_agent_index]
                    self.current_agent_index = (self.current_agent_index + 1) % len(self.agent_queue)

                    agent = Repository.get_agent(db, agent_id)
                    if not agent:
                        continue

                    # 3. Retrieve memories, nearby agents, and relationship context
                    memories = Repository.get_agent_memories(db, agent_id, limit=4)
                    all_agents = Repository.get_all_agents(db)
                    nearby_agents = [
                        a for a in all_agents
                        if a["id"] != agent_id and a["location"] == agent["location"]
                    ]
                    nearby_names = [a["name"] for a in nearby_agents]
                    nearby_ids = [a["id"] for a in nearby_agents]

                    rel_text = RelationshipManager.get_relationship_prompt_text(db, agent_id, nearby_ids)

                    # 4. Generate AI decision using Ollama Llama 3.2
                    decision = await DecisionEngine.decide_next_action(
                        agent=agent,
                        world=world,
                        memories=memories,
                        nearby_agents=nearby_names,
                        relationships_text=rel_text
                    )

                    # 5. Execute action & update database
                    result = ActionExecutor.execute(db, agent_id, decision)

                    # 6. Broadcast live action to Phaser frontend
                    await manager.broadcast({
                        "type": "agent_action",
                        "data": result
                    })

                    # 7. Check if a dynamic agent conversation should be triggered
                    target_id = result.get("target")
                    partner = Repository.get_agent(db, target_id) if target_id else (nearby_agents[0] if nearby_agents else None)

                    if partner and (result["action"] in ["talk", "help", "trade"] or (nearby_agents and result["action"] == "idle")):
                        pair_key = "_".join(sorted([agent_id, partner["id"]]))
                        now = asyncio.get_event_loop().time()
                        last_time = self.last_conversation_time.get(pair_key, 0)

                        # 40-second cooldown per pair to keep conversations natural
                        if now - last_time > (40.0 / self.speed):
                            self.last_conversation_time[pair_key] = now
                            convo = await ConversationEngine.generate_conversation(
                                db=db,
                                agent_a=agent,
                                agent_b=partner,
                                location_name=result["location"],
                                initial_topic=decision.get("reason")
                            )
                            await manager.broadcast({
                                "type": "agent_conversation",
                                "data": convo
                            })

                    # 8. Broadcast event log
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
