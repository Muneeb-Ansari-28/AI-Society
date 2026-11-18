import pytest
from app.memory.importance_scorer import score_event_importance, EVENT_TYPE_BASE_SCORES

def test_promise_memory_importance():
    """Promises are assigned near-maximum importance (0.95)."""
    score = score_event_importance(
        text="I promised to deliver 10 bags of flour tomorrow",
        event_type="promise",
        is_promise=True
    )
    assert score == 0.95

def test_base_scores_by_event_type():
    """Event types correlate to their semantic baseline weights."""
    trade_score = score_event_importance("Traded 5 apples for 2 coins", event_type="trade")
    work_score = score_event_importance("Cut wheat in the field", event_type="work")
    rest_score = score_event_importance("Took a brief rest", event_type="rest")

    assert trade_score > work_score
    assert work_score > rest_score
    assert rest_score <= 0.25

def test_social_interaction_boosts_importance():
    """Having a named related villager boosts event importance by +0.10."""
    solo_score = score_event_importance("Drank water at the fountain", event_type="idle")
    social_score = score_event_importance("Drank water at the fountain", event_type="idle", related_agent="mia")

    assert round(social_score - solo_score, 2) == 0.10

def test_impact_keywords_add_bonus():
    """Impact words (deal, debt, emergency, stolen, secret) increase importance."""
    plain = score_event_importance("Talked about the weather", event_type="conversation")
    dramatic = score_event_importance("Discussed a secret deal and an urgent debt", event_type="conversation")

    assert dramatic > plain

def test_score_bounded_between_zero_and_one():
    """Importance scores never exceed 1.0 or drop below 0.0."""
    extreme_high = score_event_importance(
        "emergency promise deal debt ally friend excited meeting stolen secret love save",
        event_type="conflict",
        related_agent="noah"
    )
    assert 0.0 <= extreme_high <= 1.0

    low = score_event_importance("", event_type="idle")
    assert 0.0 <= low <= 1.0
