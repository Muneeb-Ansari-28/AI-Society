import pytest
from app.simulation.action_executor import ActionExecutor
from app.database.repository import Repository

def test_work_action_updates_inventory_and_energy(db_session):
    """Alex working in the wheat field increases food inventory and expends energy."""
    initial_alex = Repository.get_agent(db_session, "alex")
    initial_energy = initial_alex["energy"]
    initial_food = initial_alex["inventory"].get("food", 0)

    decision = {
        "action": "work",
        "location": "wheat_field",
        "reason": "Harvesting crops",
    }
    result = ActionExecutor.execute(db_session, "alex", decision)

    assert result["status"] == "success"
    updated_alex = Repository.get_agent(db_session, "alex")
    assert updated_alex["energy"] == initial_energy - 5
    assert updated_alex["inventory"]["food"] == initial_food + 1

def test_rest_action_recovers_energy_and_happiness(db_session):
    """Resting recovers energy and boosts happiness."""
    # Drain energy first
    Repository.update_agent_state(db_session, "mia", energy_delta=-75, happiness_delta=-35)

    decision = {
        "action": "rest",
        "location": "mia_bakery",
        "reason": "Resting near the ovens",
    }
    result = ActionExecutor.execute(db_session, "mia", decision)

    assert result["status"] == "success"
    updated_mia = Repository.get_agent(db_session, "mia")
    assert updated_mia["energy"] == 25 + 18
    assert updated_mia["happiness"] == 40 + 5

def test_move_action_updates_location(db_session):
    """Moving changes current location and burns small energy."""
    initial_noah = Repository.get_agent(db_session, "noah")
    initial_energy = initial_noah["energy"]

    decision = {
        "action": "move",
        "location": "town_square",
        "reason": "Heading to plaza fountain",
    }
    result = ActionExecutor.execute(db_session, "noah", decision)

    assert result["status"] == "success"
    updated_noah = Repository.get_agent(db_session, "noah")
    assert updated_noah["location"] == "town_square"
    assert updated_noah["energy"] == initial_energy - 2

def test_noah_work_earns_coins(db_session):
    """Noah running the general store earns coins."""
    initial_noah = Repository.get_agent(db_session, "noah")
    initial_coins = initial_noah["inventory"].get("coins", 0)

    decision = {
        "action": "work",
        "location": "noah_shop",
        "reason": "Managing inventory",
    }
    ActionExecutor.execute(db_session, "noah", decision)
    updated = Repository.get_agent(db_session, "noah")
    assert updated["inventory"].get("coins", 0) == initial_coins + 2

def test_leo_work_yields_wood(db_session):
    """Leo working at the carpentry workshop crafts wood beams."""
    initial_leo = Repository.get_agent(db_session, "leo")
    initial_wood = initial_leo["inventory"].get("wood", 0)

    decision = {
        "action": "work",
        "location": "leo_workshop",
        "reason": "Planing timber",
    }
    ActionExecutor.execute(db_session, "leo", decision)
    updated = Repository.get_agent(db_session, "leo")
    assert updated["inventory"].get("wood", 0) == initial_wood + 1
