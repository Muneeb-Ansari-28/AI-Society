import json
import logging
import re
import random
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..database.repository import Repository
from ..llm.ollama_client import ollama_client
from .relationship_manager import RelationshipManager
from ..memory.memory_manager import memory_manager
from ..memory.promise_tracker import promise_tracker

logger = logging.getLogger("tiny_society.conversation")

class ConversationEngine:
    @staticmethod
    async def generate_conversation(
        db: Session,
        agent_a: Dict[str, Any],
        agent_b: Dict[str, Any],
        location_name: str,
        initial_topic: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates an authentic in-character two-stage conversation between two villagers using Ollama Llama 3.2.
        Updates their relationships, stores mutual memories, checks for promises made, and logs the event.
        """
        rel = Repository.get_relationship(db, agent_a["id"], agent_b["id"]) or {"trust": 50, "friendship": 50}
        world = Repository.get_world_state(db)
        current_day = world.get("day", 1)

        # Semantic memories relevant to the other villager
        memories_a_objs = memory_manager.search_relevant_memories(
            db=db,
            agent_id=agent_a["id"],
            query=f"Interactions, trades, and history with {agent_b['name']}",
            n_results=2
        )
        memories_b_objs = memory_manager.search_relevant_memories(
            db=db,
            agent_id=agent_b["id"],
            query=f"Interactions, trades, and history with {agent_a['name']}",
            n_results=2
        )
        memories_a = [m["text"] for m in memories_a_objs]
        memories_b = [m["text"] for m in memories_b_objs]

        # Active promises between these two
        all_promises = Repository.get_active_promises(db, agent_id=agent_a["id"])
        pair_promises = [
            p for p in all_promises
            if (p["agent_id"] == agent_a["id"] and p["target_agent_id"] == agent_b["id"]) or
               (p["agent_id"] == agent_b["id"] and p["target_agent_id"] == agent_a["id"])
        ]
        promises_prompt = promise_tracker.format_promises_for_prompt(pair_promises, agent_a["id"])

        system_prompt = (
            "You are the dynamic dialogue director for the peaceful village simulation 'Tiny Society'.\n"
            "Generate a realistic, short 2-turn dialogue exchange between two villagers meeting at a location.\n"
            "Turn 1: Person A initiates.\n"
            "Turn 2: Person B responds in character.\n"
            "Stay strictly in character for both individuals. Keep each spoken line between 1 and 2 brief sentences.\n"
            "Villagers may discuss work, request items, or make commitments ('I'll bring you...').\n"
            "You MUST respond ONLY with a JSON object matching this schema:\n"
            "{\n"
            '  "topic": "brief topic of discussion",\n'
            '  "dialogue": [\n'
            '    {"speaker": "agent_a_id", "text": "First line spoken by Person A"},\n'
            '    {"speaker": "agent_b_id", "text": "Response spoken by Person B"}\n'
            "  ],\n"
            '  "outcome": "One sentence summary of the social outcome",\n'
            '  "trust_delta": 2,\n'
            '  "friendship_delta": 3\n'
            "}\n"
            "No conversational preamble, markdown markers, or text outside the JSON."
        )

        promises_sec = f"Existing Commitments between you:\n{promises_prompt}\n\n" if pair_promises else ""

        user_prompt = (
            f"Location: {location_name}\n\n"
            f"Person A:\n"
            f"- Name: {agent_a['name']} ({agent_a['occupation']})\n"
            f"- Personality: {agent_a['personality']}\n"
            f"- Goal: {agent_a['goals']}\n"
            f"- Relevant Memories: {', '.join(memories_a) if memories_a else 'Working hard in the village'}\n\n"
            f"Person B:\n"
            f"- Name: {agent_b['name']} ({agent_b['occupation']})\n"
            f"- Personality: {agent_b['personality']}\n"
            f"- Goal: {agent_b['goals']}\n"
            f"- Relevant Memories: {', '.join(memories_b) if memories_b else 'Going about daily village chores'}\n\n"
            f"{promises_sec}"
            f"Current Relationship: Friendship {rel.get('friendship', 50)}/100, Trust {rel.get('trust', 50)}/100.\n"
            f"Suggested context/topic: {initial_topic or 'daily village work, supplies, or weather'}.\n\n"
            f"Generate their authentic 2-turn dialogue now."
        )

        # Attempt Ollama LLM generation
        try:
            raw_response = await ollama_client.generate(
                prompt=user_prompt,
                system=system_prompt,
                format_json=True,
                max_tokens=220
            )
            text = raw_response.strip()
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            if json_match:
                text = json_match.group(0)

            data = json.loads(text)

            # Validate structure
            topic = data.get("topic", "village life")
            dialogue_list = data.get("dialogue", [])
            outcome = data.get("outcome", f"{agent_a['name']} and {agent_b['name']} shared a friendly chat.")
            trust_delta = int(data.get("trust_delta", 2))
            friendship_delta = int(data.get("friendship_delta", 3))

            if len(dialogue_list) >= 2:
                line_a = str(dialogue_list[0].get("text", "")).strip('"\n ')
                line_b = str(dialogue_list[1].get("text", "")).strip('"\n ')
            else:
                line_a, line_b = ConversationEngine._get_fallback_dialogue(agent_a["id"], agent_b["id"])

        except Exception as e:
            logger.warning(f"Ollama conversation generation fell back to contextual defaults: {e}")
            topic = "daily village chores and weather"
            line_a, line_b = ConversationEngine._get_fallback_dialogue(agent_a["id"], agent_b["id"])
            outcome = f"{agent_a['name']} and {agent_b['name']} exchanged warm greetings at {location_name}."
            trust_delta = 2
            friendship_delta = 3

        # Apply relationship updates in database
        updated_rel = RelationshipManager.apply_social_interaction(
            db=db,
            source_id=agent_a["id"],
            target_id=agent_b["id"],
            interaction_type="talk",
            topic=topic,
            custom_trust_delta=trust_delta,
            custom_friendship_delta=friendship_delta
        )

        # Check for promises made in dialogue
        new_promise_a = promise_tracker.record_promise_if_detected(
            db=db,
            speaker_id=agent_a["id"],
            listener_id=agent_b["id"],
            dialogue_text=line_a,
            current_day=current_day,
        )
        new_promise_b = promise_tracker.record_promise_if_detected(
            db=db,
            speaker_id=agent_b["id"],
            listener_id=agent_a["id"],
            dialogue_text=line_b,
            current_day=current_day,
        )

        detected_promise = new_promise_a or new_promise_b

        # Store memories for both agents in MemoryManager (with ChromaDB indexing)
        memory_manager.add_memory(
            db=db,
            agent_id=agent_a["id"],
            text=f"Spoke with {agent_b['name']} about {topic}: '{line_a}'",
            event_type="promise" if new_promise_a else "conversation",
            related_agent=agent_b["id"],
            location=location_name,
            day=current_day,
            is_promise=bool(new_promise_a),
        )
        memory_manager.add_memory(
            db=db,
            agent_id=agent_b["id"],
            text=f"Discussed {topic} with {agent_a['name']}: '{line_b}'",
            event_type="promise" if new_promise_b else "conversation",
            related_agent=agent_a["id"],
            location=location_name,
            day=current_day,
            is_promise=bool(new_promise_b),
        )

        # Log event in global simulation feed
        from ..llm.prompts import format_time_string
        time_str = format_time_string(world.get("time_minutes", 510))

        Repository.add_event(
            db=db,
            agent_id=agent_a["id"],
            agent_name=f"{agent_a['name']} & {agent_b['name']}",
            event_type="promise" if detected_promise else "conversation",
            description=f"\"{line_a}\" — \"{line_b}\"",
            location=location_name,
            timestamp=time_str
        )

        return {
            "initiator_id": agent_a["id"],
            "initiator_name": agent_a["name"],
            "receiver_id": agent_b["id"],
            "receiver_name": agent_b["name"],
            "location": location_name,
            "topic": topic,
            "dialogue": [
                {"speaker": agent_a["id"], "speaker_name": agent_a["name"], "text": line_a},
                {"speaker": agent_b["id"], "speaker_name": agent_b["name"], "text": line_b}
            ],
            "outcome": outcome,
            "trust_delta": trust_delta,
            "friendship_delta": friendship_delta,
            "relationship": updated_rel,
            "promise": detected_promise,
            "time": time_str
        }

    @staticmethod
    def _get_fallback_dialogue(id_a: str, id_b: str) -> tuple[str, str]:
        pair_key = tuple(sorted([id_a, id_b]))
        table = {
            ("alex", "mia"): (
                "Good day Mia! The wheat harvest looks golden this year.",
                "Wonderful, Alex! Bring me a fresh sack and I'll bake the village's best sourdough."
            ),
            ("alex", "noah"): (
                "Noah, do you have any spare iron nails or hinges for the barn?",
                "Fresh shipment from the merchants arrived this morning, Alex. Come take a look!"
            ),
            ("alex", "emma"): (
                "Emma, that soothing mint salve you brewed worked wonders on my back.",
                "I'm glad to hear it, Alex. Remember to rest and stay hydrated by the fountain."
            ),
            ("alex", "leo"): (
                "Leo, that oak timber you planed is holding up the barn roof solidly.",
                "Sturdy craftsmanship is what keeps our village standing, Alex. Always happy to help."
            ),
            ("emma", "mia"): (
                "Mia, your morning brioche brought smiles to everyone coming by the clinic.",
                "Thank you, Emma! Good food and good medicine make the happiest village."
            ),
            ("emma", "leo"): (
                "Leo, make sure to take breaks and not work through the chilly evening in the shed.",
                "Just finishing these dovetail joints, Emma... but thank you for looking out for me."
            ),
            ("leo", "noah"): (
                "Noah, did the caravan bring the new tempered steel saw blades?",
                "Yes they did, Leo! Stored safely inside. What timber are you cutting today?"
            ),
            ("mia", "noah"): (
                "Noah, I hope your honey prices haven't climbed with the autumn caravan.",
                "For our master baker, Mia? Always a 10% discount on the sweetest wildflower honey."
            ),
        }
        return table.get(pair_key, (
            "Greetings! It's a fine, productive day in our village.",
            "Indeed it is! Glad to see you around and in good spirits."
        ))
