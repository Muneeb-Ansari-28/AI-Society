import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "ollama_model" in data

def test_get_all_agents():
    resp = client.get("/api/agents")
    assert resp.status_code == 200
    agents = resp.json()
    assert len(agents) == 5
    ids = [a["id"] for a in agents]
    assert set(ids) == {"alex", "mia", "noah", "emma", "leo"}

def test_get_agent_detail():
    resp = client.get("/api/agents/alex")
    assert resp.status_code == 200
    agent = resp.json()
    assert agent["id"] == "alex"
    assert agent["name"] == "Alex"
    assert "energy" in agent
    assert "inventory" in agent

def test_get_agent_memories():
    resp = client.get("/api/agents/alex/memories")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_get_agent_promises():
    resp = client.get("/api/agents/alex/promises")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_get_agent_relationships():
    resp = client.get("/api/agents/alex/relationships")
    assert resp.status_code == 200
    rels = resp.json()
    assert isinstance(rels, dict)
    assert "mia" in rels

def test_command_agent_move():
    resp = client.post("/api/agents/alex/move", json={"location": "town_square"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["location"] == "town_square"

def test_simulation_world_state():
    resp = client.get("/api/simulation/world")
    assert resp.status_code == 200
    world = resp.json()
    assert "day" in world
    assert "period" in world
    assert "timeString" in world

def test_simulation_controls():
    pause_res = client.post("/api/simulation/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["is_running"] is False

    start_res = client.post("/api/simulation/start")
    assert start_res.status_code == 200
    assert start_res.json()["is_running"] is True

    speed_res = client.post("/api/simulation/speed", json={"speed": 2.0})
    assert speed_res.status_code == 200
    assert speed_res.json()["speed"] == 2.0

def test_simulation_events():
    resp = client.get("/api/simulation/events")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_simulation_save_load_info():
    save_res = client.post("/api/simulation/save", json={"save_name": "api_test_save"})
    assert save_res.status_code == 200
    assert save_res.json()["status"] == "success"

    info_res = client.get("/api/simulation/save/info?name=api_test_save")
    assert info_res.status_code == 200
    info = info_res.json()
    assert info["exists"] is True

    load_res = client.post("/api/simulation/load", json={"save_name": "api_test_save"})
    assert load_res.status_code == 200
    assert load_res.json()["status"] == "success"

@pytest.mark.asyncio
async def test_live_agent_chat_with_ollama():
    """Tests interactive user dialogue with live Llama 3.2."""
    resp = client.post("/api/agents/alex/interact", json={"message": "Good morning Alex, how are your crops?"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["agent_id"] == "alex"
    assert len(data["response"]) > 0
    print("Alex replied:", data["response"])
