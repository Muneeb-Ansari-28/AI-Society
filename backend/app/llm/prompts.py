import json
from typing import Dict, Any, List, Optional

VALID_ACTIONS = ["move", "work", "talk", "trade", "help", "rest", "idle"]
VALID_LOCATIONS = [
    "alex_farm",
    "wheat_field",
    "town_square",
    "noah_shop",
    "mia_bakery",
    "emma_healer",
    "leo_workshop",
    "lake_dock",
    "old_shed",
    "campsite"
]

def format_time_string(time_minutes: int) -> str:
    hours = time_minutes // 60
    mins = time_minutes % 60
    ampm = "PM" if hours >= 12 else "AM"
    h12 = 12 if hours % 12 == 0 else hours % 12
    return f"{h12:02d}:{mins:02d} {ampm}"

def build_system_prompt(profile: Dict[str, Any]) -> str:
    return (
        f"You are {profile['name']}, an autonomous {profile['occupation']} living in the village of Tiny Society.\n"
        f"Personality: {profile['personality']}\n"
        f"Personal Goal: {profile['goals']}\n"
        f"Key Tension/Conflict: {profile.get('conflict', '')}\n"
        f"Home: {profile.get('home_location', 'town_square')} | Primary Workplace: {profile.get('work_location', 'town_square')}\n\n"
        "You must make an autonomous decision for your next simulation action.\n"
        "Allowed Actions: [move, work, talk, trade, help, rest, idle]\n"
        "Allowed Locations: [alex_farm, wheat_field, town_square, noah_shop, mia_bakery, emma_healer, leo_workshop, lake_dock, old_shed, campsite]\n\n"
        "You MUST respond ONLY with a valid JSON object matching this exact format:\n"
        "{\n"
        '  "action": "work",\n'
        '  "location": "wheat_field",\n'
        '  "target": null,\n'
        '  "reason": "Brief explanation why you chose this action.",\n'
        '  "dialogue": "A short, immersive in-character sentence you say out loud (or null)."\n'
        "}\n"
        "No conversational preamble, markdown headers, or explanations outside the JSON."
    )

def build_observation_prompt(
    agent: Dict[str, Any],
    world: Dict[str, Any],
    recent_memories: List[str],
    nearby_agents: List[str]
) -> str:
    time_str = format_time_string(world.get("time_minutes", 510))
    day = world.get("day", 1)
    weather = world.get("weather", "Sunny")

    memories_text = "\n".join([f"- {m}" for m in recent_memories]) if recent_memories else "- Settled into the peaceful village."
    nearby_text = ", ".join(nearby_agents) if nearby_agents else "None nearby"

    inventory_items = [f"{k}: {v}" for k, v in agent.get("inventory", {}).items()]
    inv_str = ", ".join(inventory_items) if inventory_items else "Empty pockets"

    return (
        f"Current World State:\n"
        f"- Time: Day {day}, {time_str} ({weather})\n"
        f"- Your Location: {agent.get('location', 'alex_farm')}\n"
        f"- Energy Level: {agent.get('energy', 100)}/100\n"
        f"- Happiness Level: {agent.get('happiness', 75)}/100\n"
        f"- Inventory: {inv_str}\n"
        f"- Nearby Villagers: {nearby_text}\n"
        f"Recent Experiences & Memories:\n"
        f"{memories_text}\n\n"
        f"Based on your personality ({agent.get('name')}, {agent.get('occupation')}), current energy, and the time of day, what is your next action?"
    )
