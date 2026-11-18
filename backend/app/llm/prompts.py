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
    work_loc = profile.get('work_location', 'town_square')
    home_loc = profile.get('home_location', 'town_square')
    return (
        f"You are {profile['name']}, an autonomous {profile['occupation']} living in the peaceful village of Tiny Society.\n"
        f"Personality: {profile['personality']}\n"
        f"Personal Goal: {profile['goals']}\n"
        f"Key Tension/Conflict: {profile.get('conflict', '')}\n"
        f"Home: {home_loc} | Primary Workplace: {work_loc}\n\n"
        "You must make an autonomous decision for your next simulation action.\n"
        "Allowed Actions: [move, work, talk, trade, help, rest, idle]\n"
        "Allowed Locations: [alex_farm, wheat_field, town_square, noah_shop, mia_bakery, emma_healer, leo_workshop, lake_dock, old_shed, campsite]\n\n"
        "Simulation Guidelines to Prevent Looping:\n"
        f"1. Work Activities: If choosing 'work', your location must be your workplace ({work_loc}). If you are elsewhere, choose 'move' to walk there first.\n"
        "2. Social Actions: You can only 'talk', 'trade', or 'help' with villagers who are listed under 'Nearby Villagers' at your current location! Do not talk to villagers who are elsewhere; move to meet them instead.\n"
        "3. Active Routine: Do not loiter in the town square repeating the same action. Maintain a dynamic schedule throughout the day: work your trade, visit shops for supplies, check on your home/chores, and interact meaningfully.\n"
        "4. Anti-Repetition: Do NOT repeat the exact same dialogue, target, or reason as your recent turns. Progress the day naturally.\n\n"
        "You MUST respond ONLY with a valid JSON object matching this exact format:\n"
        "{\n"
        '  "action": "work",\n'
        f'  "location": "{work_loc}",\n'
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
    nearby_agents: List[str],
    relationships_text: Optional[str] = None,
    promises_text: Optional[str] = None,
    semantic_memories_text: Optional[str] = None,
) -> str:
    time_str = format_time_string(world.get("time_minutes", 510))
    day = world.get("day", 1)
    weather = world.get("weather", "Sunny")

    nearby_text = ", ".join(nearby_agents) if nearby_agents else "None nearby"

    inventory_items = [f"{k}: {v}" for k, v in agent.get("inventory", {}).items()]
    inv_str = ", ".join(inventory_items) if inventory_items else "Empty pockets"

    rel_section = f"Relationships:\n{relationships_text}\n\n" if relationships_text else ""

    promises_section = ""
    if promises_text and "No pending promises" not in promises_text:
        promises_section = f"Active Promises & Commitments:\n{promises_text}\n\n"

    long_term_section = ""
    if semantic_memories_text and semantic_memories_text.strip():
        long_term_section = f"Relevant Past Experiences (Retrieved from Long-Term Memory):\n{semantic_memories_text}\n\n"

    short_term_text = "\n".join([f"- {m}" for m in recent_memories]) if recent_memories else "- Settled into the peaceful village."

    return (
        f"Current World State:\n"
        f"- Time: Day {day}, {time_str} ({weather})\n"
        f"- Your Location: {agent.get('location', 'alex_farm')}\n"
        f"- Energy Level: {agent.get('energy', 100)}/100\n"
        f"- Happiness Level: {agent.get('happiness', 75)}/100\n"
        f"- Inventory: {inv_str}\n"
        f"- Nearby Villagers: {nearby_text}\n\n"
        f"{rel_section}"
        f"{promises_section}"
        f"{long_term_section}"
        f"Recent Observations (Short-Term Memory):\n"
        f"{short_term_text}\n\n"
        f"Based on your personality ({agent.get('name')}, {agent.get('occupation')}), active promises, memories, and energy, what is your next action?"
    )
