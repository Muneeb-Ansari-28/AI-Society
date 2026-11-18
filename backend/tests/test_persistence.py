import os
import pytest
from app.simulation.persistence import PersistenceManager
from app.database.repository import Repository
from app.database.models import AgentStateModel, WorldStateModel

TEST_SAVE_NAME = "pytest_test_snapshot"

@pytest.fixture(autouse=True)
def cleanup_save_file():
    """Ensure any test snapshot file is removed after test."""
    yield
    path = PersistenceManager.get_save_path(TEST_SAVE_NAME)
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass

def test_save_state_creates_snapshot(db_session):
    """Saving simulation creates a comprehensive JSON file with world, agents, and relationships."""
    res = PersistenceManager.save_state(db_session, save_name=TEST_SAVE_NAME)
    assert res["status"] == "success"
    assert res["agents_count"] == 5

    info = PersistenceManager.get_save_info(TEST_SAVE_NAME)
    assert info["exists"] is True
    assert info["world_day"] == 1
    assert info["agents_count"] == 5

def test_load_state_restores_snapshot(db_session):
    """Loading a snapshot restores previous world and agent attributes."""
    # 1. Modify agent state directly
    state = db_session.query(AgentStateModel).filter_by(agent_id="alex").first()
    state.energy = 88
    state.happiness = 99
    db_session.commit()

    PersistenceManager.save_state(db_session, save_name=TEST_SAVE_NAME)

    # 2. Modify again
    state.energy = 10
    state.happiness = 15
    db_session.commit()

    alex_drained = Repository.get_agent(db_session, "alex")
    assert alex_drained["energy"] == 10

    # 3. Load snapshot
    load_res = PersistenceManager.load_state(db_session, save_name=TEST_SAVE_NAME)
    assert load_res["status"] == "success"

    alex_restored = Repository.get_agent(db_session, "alex")
    assert alex_restored["energy"] == 88
    assert alex_restored["happiness"] == 99

def test_reset_world_resets_defaults(db_session):
    """World reset restores Day 1 Morning state and all 5 initial agents."""
    # Modify world day
    world = db_session.query(WorldStateModel).filter_by(id=1).first()
    world.day = 7
    world.time_minutes = 1200
    db_session.commit()

    reset_res = PersistenceManager.reset_world(db_session)
    assert reset_res["status"] == "success"

    world_res = Repository.get_world_state(db_session)
    assert world_res["day"] == 1
    assert world_res["time_minutes"] == 510

    agents = Repository.get_all_agents(db_session)
    assert len(agents) == 5
