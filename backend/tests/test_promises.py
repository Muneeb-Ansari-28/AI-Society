import pytest
from app.memory.promise_tracker import PromiseTracker
from app.database.repository import Repository

def test_extract_promise_text_detected():
    """Valid commitment statements are properly identified."""
    samples = [
        "I will bring you 5 sacks of fresh wheat tomorrow.",
        "I'll craft the sturdy wooden beams for your bench.",
        "Let's meet at the plaza fountain tomorrow morning.",
        "I promise to help repair the bridge after the storm.",
    ]
    for sample in samples:
        extracted = PromiseTracker.extract_promise_text(sample)
        assert extracted is not None
        assert extracted == sample

def test_extract_promise_text_ignored_non_promises():
    """Casual chit-chat or observations are not mistaken for promises."""
    samples = [
        "Good morning, wonderful sunny weather we have!",
        "The fountain water feels cold today.",
        "I need to work on the farm soon.",
        "Just walking through town to see what is new.",
    ]
    for sample in samples:
        assert PromiseTracker.extract_promise_text(sample) is None

def test_record_promise_creates_active_entry(db_session):
    """Recording a detected promise stores an active database record with proper deadline."""
    dialogue = "I promise to bring you 3 healing salves tomorrow!"
    created = PromiseTracker.record_promise_if_detected(
        db=db_session,
        speaker_id="emma",
        listener_id="alex",
        dialogue_text=dialogue,
        current_day=2
    )

    assert created is not None
    assert created["agent_id"] == "emma"
    assert created["target_agent_id"] == "alex"
    assert created["status"] == "active"
    assert created["day_made"] == 2
    assert created["deadline_day"] == 3 # Next day

def test_record_promise_same_day_deadline(db_session):
    """Promises explicitly mentioning 'today' get same-day deadlines."""
    dialogue = "I will deliver the oak timber today before sunset."
    created = PromiseTracker.record_promise_if_detected(
        db=db_session,
        speaker_id="leo",
        listener_id="mia",
        dialogue_text=dialogue,
        current_day=4
    )
    assert created is not None
    assert created["deadline_day"] == 4

def test_fulfill_promise(db_session):
    """Active promises can be marked fulfilled in the repository."""
    promise = Repository.create_promise(
        db=db_session,
        agent_id="alex",
        target_agent_id="mia",
        content="Bring 5 flour",
        day_made=1,
        deadline_day=2
    )
    assert promise.status == "active"

    Repository.update_promise_status(db_session, promise.id, "fulfilled")
    active = Repository.get_active_promises(db_session, agent_id="alex")
    assert not any(p["id"] == promise.id for p in active)
