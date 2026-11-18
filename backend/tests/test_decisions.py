import pytest
from app.agents.decision_engine import DecisionEngine
from app.llm.prompts import build_system_prompt, build_observation_prompt, VALID_ACTIONS, VALID_LOCATIONS

@pytest.mark.asyncio
async def test_low_energy_triggers_rest():
    """Agent with energy <= 15 must choose to rest at their home location."""
    tired_agent = {
        "id": "alex",
        "name": "Alex",
        "occupation": "Farmer",
        "personality": "Diligent, humble",
        "goals": "Grow bountiful crops",
        "conflict": "Worries about drought",
        "energy": 12,
        "home_location": "wheat_field",
        "work_location": "wheat_field",
    }
    world = {"day": 1, "time_string": "09:00 AM", "weather": "Sunny", "period": "Morning"}
    
    decision = await DecisionEngine.decide_next_action(
        agent=tired_agent,
        world=world,
        memories=[],
        nearby_agents=[]
    )
    
    assert decision["action"] == "rest"
    assert decision["location"] == "wheat_field"
    assert "recover" in decision["reason"].lower() or "exhausted" in decision["reason"].lower()

def test_parse_and_validate_valid_json():
    """Valid JSON from LLM is correctly extracted and typed."""
    raw = '{"action": "work", "location": "wheat_field", "target": null, "reason": "Tending crops", "dialogue": "Wheat looks healthy!"}'
    agent = {"id": "alex", "work_location": "wheat_field"}
    
    parsed = DecisionEngine._parse_and_validate(raw, agent)
    assert parsed["action"] == "work"
    assert parsed["location"] == "wheat_field"
    assert parsed["reason"] == "Tending crops"
    assert parsed["dialogue"] == "Wheat looks healthy!"

def test_parse_and_validate_markdown_enclosed_json():
    """LLM output enclosed in markdown code fences is cleaned and parsed."""
    raw = '''```json
    {
      "action": "talk",
      "location": "town_square",
      "target": "mia",
      "reason": "Greet Mia at the fountain",
      "dialogue": "Good morning Mia!"
    }
    ```'''
    agent = {"id": "alex", "work_location": "wheat_field"}
    parsed = DecisionEngine._parse_and_validate(raw, agent)
    assert parsed["action"] == "talk"
    assert parsed["location"] == "town_square"
    assert parsed["target"] == "mia"

def test_parse_and_validate_invalid_action_fallback():
    """Invalid or unsupported action names fall back safely."""
    raw = '{"action": "teleport_to_mars", "location": "town_square", "reason": "Flying away"}'
    agent = {"id": "alex", "work_location": "wheat_field"}
    parsed = DecisionEngine._parse_and_validate(raw, agent)
    assert parsed["action"] in VALID_ACTIONS

def test_parse_and_validate_invalid_location_fallback():
    """Invalid locations fall back to the agent's work location."""
    raw = '{"action": "idle", "location": "atlantis_deep_ocean", "reason": "Exploring"}'
    agent = {"id": "mia", "work_location": "mia_bakery"}
    parsed = DecisionEngine._parse_and_validate(raw, agent)
    assert parsed["location"] in VALID_LOCATIONS
    assert parsed["location"] == "mia_bakery"

def test_contextual_fallbacks_for_all_agents():
    """Fallback generator provides distinct, thematic behaviors for every villager."""
    for agent_id in ["alex", "mia", "noah", "emma", "leo"]:
        agent = {"id": agent_id, "name": agent_id.capitalize()}
        fb = DecisionEngine._get_contextual_fallback(agent)
        assert fb["action"] in VALID_ACTIONS
        assert fb["location"] in VALID_LOCATIONS
        assert "reason" in fb

def test_prompt_builders():
    """System prompt and observation prompt format and populate required context fields."""
    agent = {
        "id": "alex",
        "name": "Alex",
        "occupation": "Farmer",
        "personality": "Diligent, humble",
        "goals": "Grow bountiful crops",
        "conflict": "Worries about drought",
        "energy": 80,
        "happiness": 70,
        "location": "wheat_field",
        "inventory": {"food": 3, "seeds": 5}
    }
    sys_prompt = build_system_prompt(agent)
    assert "Alex" in sys_prompt
    assert "Farmer" in sys_prompt
    assert "Diligent" in sys_prompt

    world = {"day": 2, "time_string": "11:30 AM", "period": "Morning", "weather": "Sunny"}
    obs_prompt = build_observation_prompt(
        agent=agent,
        world=world,
        recent_memories=["Watered tomatoes"],
        nearby_agents=["Mia"],
        relationships_text="Mia: 70% trust",
        promises_text="None",
        semantic_memories_text="Harvest was good yesterday"
    )
    assert "Day 2" in obs_prompt
    assert "Watered tomatoes" in obs_prompt
    assert "Mia: 70% trust" in obs_prompt
