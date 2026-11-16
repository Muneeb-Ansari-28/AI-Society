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
        relationships_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs the full AI decision cycle for an agent:
        Observe -> Retrieve memories & relationships -> Think (Ollama Llama 3.2 call) -> Validate -> Return structured action
        """
        system_prompt = build_system_prompt(agent)
        observation_prompt = build_observation_prompt(
            agent, world, memories, nearby_agents, relationships_text=relationships_text
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
            action_data = DecisionEngine._parse_and_validate(raw_response, agent)
            return action_data
        except Exception:
            # Fallback contextual action if Ollama fails or times out
            return DecisionEngine._get_contextual_fallback(agent)

    @staticmethod
    def _parse_and_validate(raw_response: str, agent: Dict[str, Any]) -> Dict[str, Any]:
        """Cleans and validates the JSON response from Llama 3.2"""
        text = raw_response.strip()
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            text = json_match.group(0)

        data = json.loads(text)

        # Validate action
        action = data.get("action", "idle").lower()
        if action not in VALID_ACTIONS:
            action = "work" if agent.get("id") == "alex" else "idle"

        # Validate location
        location = data.get("location")
        if not location or location not in VALID_LOCATIONS:
            location = agent.get("work_location", "town_square")

        reason = data.get("reason", f"Decided to {action} based on daily routine.")
        dialogue = data.get("dialogue")

        return {
            "action": action,
            "location": location,
            "target": data.get("target"),
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
