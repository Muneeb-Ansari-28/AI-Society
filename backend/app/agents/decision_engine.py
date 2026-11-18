import json
import re
from typing import Dict, Any, List, Optional
from ..llm.ollama_client import ollama_client
from ..llm.prompts import (
    build_system_prompt,
    build_observation_prompt,
    VALID_ACTIONS,
    VALID_LOCATIONS
)

class DecisionEngine:
    @staticmethod
    async def decide_next_action(
        agent: Dict[str, Any],
        world: Dict[str, Any],
        memories: List[str],
        nearby_agents: List[str],
        relationships_text: Optional[str] = None,
        promises_text: Optional[str] = None,
        semantic_memories_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Runs the full AI decision cycle for an agent:
        Observe -> Retrieve memories & relationships -> Think (Ollama Llama 3.2 call) -> Validate -> Return structured action
        """
        system_prompt = build_system_prompt(agent)
        observation_prompt = build_observation_prompt(
            agent,
            world,
            memories,
            nearby_agents,
            relationships_text=relationships_text,
            promises_text=promises_text,
            semantic_memories_text=semantic_memories_text,
        )

        # 1. Low energy safety rule (simulation mechanic)
        energy = agent.get("energy", 100)
        if energy <= 15:
            return {
                "action": "rest",
                "location": agent.get("home_location", "town_square"),
                "target": None,
                "reason": "Exhausted from a hard day's work and needs to recover energy.",
                "dialogue": "I can barely keep my eyes open... heading home to rest."
            }

        # 2. Call Ollama with Llama 3.2
        try:
            raw_response = await ollama_client.generate(
                prompt=observation_prompt,
                system=system_prompt,
                format_json=True
            )
            action_data = DecisionEngine._parse_and_validate(
                raw_response=raw_response,
                agent=agent,
                nearby_agents=nearby_agents,
            )
            return action_data
        except Exception:
            # Fallback contextual action if Ollama fails or times out
            return DecisionEngine._get_contextual_fallback(agent)

    @staticmethod
    def _parse_and_validate(
        raw_response: str,
        agent: Dict[str, Any],
        nearby_agents: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Cleans, validates, and anti-loop guards the JSON response from Llama 3.2"""
        text = raw_response.strip()
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            text = json_match.group(0)

        data = json.loads(text)

        # Validate action
        action = str(data.get("action", "idle")).lower().strip()
        if action not in VALID_ACTIONS:
            action = "work" if agent.get("id") == "alex" else "idle"

        # Validate location
        location = data.get("location")
        if not location or location not in VALID_LOCATIONS:
            location = agent.get("work_location", "town_square")

        target = data.get("target")
        reason = data.get("reason", f"Decided to {action} based on daily routine.")
        dialogue = data.get("dialogue")

        current_loc = agent.get("location", "town_square")
        work_loc = agent.get("work_location", "town_square")
        home_loc = agent.get("home_location", "town_square")

        # Anti-Loop Rule 1: Working is always situated at the agent's workplace
        if action == "work":
            location = work_loc

        # Anti-Loop Rule 2: Social interactions require someone actually nearby (if nearby list is known)
        if action in ["talk", "trade", "help"] and nearby_agents is not None:
            nearby_clean = [str(n).lower().strip() for n in nearby_agents]
            if nearby_clean:
                # If chosen target is nearby, keep them; otherwise pick the first nearby villager
                matched_target = None
                if target:
                    t_str = str(target).lower().strip()
                    for n in nearby_clean:
                        if n in t_str or t_str in n:
                            matched_target = n
                            break
                target = matched_target or nearby_clean[0]
            else:
                # Nobody nearby to talk to! Switch to moving toward workplace or chores
                target = None
                if current_loc != work_loc:
                    action = "move"
                    location = work_loc
                    reason = f"Nobody nearby at {current_loc}, walking to {work_loc} to attend to chores."
                else:
                    action = "work"
                    location = work_loc
                    reason = f"Working peacefully at {work_loc}."

        # Anti-Loop Rule 3: Moving to current location is a no-op; vary destination
        if action == "move" and location == current_loc:
            if current_loc != work_loc:
                location = work_loc
            elif current_loc != "town_square":
                location = "town_square"
            else:
                location = home_loc

        return {
            "action": action,
            "location": location,
            "target": target,
            "reason": str(reason),
            "dialogue": str(dialogue) if dialogue else None
        }

    @staticmethod
    def _get_contextual_fallback(agent: Dict[str, Any]) -> Dict[str, Any]:
        """Safe fallback keeping agent personality intact"""
        aid = agent.get("id", "alex")
        if aid == "alex":
            return {
                "action": "work",
                "location": "wheat_field",
                "target": None,
                "reason": "Routine morning farm maintenance.",
                "dialogue": "Let's see how the crops are coming along."
            }
        elif aid == "mia":
            return {
                "action": "work",
                "location": "mia_bakery",
                "target": None,
                "reason": "Preparing sourdough bread for the village.",
                "dialogue": "The oven is preheated and smelling wonderful."
            }
        elif aid == "noah":
            return {
                "action": "work",
                "location": "noah_shop",
                "target": None,
                "reason": "Checking today's trading inventory.",
                "dialogue": "Time to open the shop and tally up the accounts."
            }
        elif aid == "emma":
            return {
                "action": "work",
                "location": "lake_dock",
                "target": None,
                "reason": "Gathering fresh herbs by the pond.",
                "dialogue": "The fresh air by the water is invigorating."
            }
        else: # leo
            return {
                "action": "work",
                "location": "leo_workshop",
                "target": None,
                "reason": "Working on oak planks for repair.",
                "dialogue": "A steady hand makes the best joints."
            }
