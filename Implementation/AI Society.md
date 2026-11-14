_Five autonomous minds. One tiny world. Unlimited possibilities._

Your selected direction:

|Decision|Selection|
|---|---|
|Visual style|Pixel art|
|Main focus|Balanced AI + simulation|
|Initial agents|5|
|LLM runtime|Ollama (local)|
|Platform|Desktop-first web application|
|Project scale|Small, polished, expandable|

I want to establish one important design principle:

**Tiny Society should be a simulation of five autonomous AI characters, not five chatbots placed inside a game.**

The characters should have their own lives. They should make decisions, remember experiences, form relationships, and occasionally interact without the user instructing them.

The user should be an observer who can also interact with the world.
![[Pasted image 20261113213240.png]]

Tiny Society is a small 2D virtual village populated by five autonomous AI agents.

Each agent has:

- A unique personality.
    
- A profession.
    
- Personal goals.
    
- Daily activities.
    
- Short-term and long-term memory.
    
- Relationships with other agents.
    
- Independent decision-making.
    

The simulation runs continuously.

For example:

**Morning**

Alex goes to the farm to collect resources.

**Afternoon**

Mia visits the village square and meets Alex. They start talking about a shortage of food.

**Evening**

Mia remembers that Noah owns a shop. She decides to ask him for help.

**Night**

Noah refuses because he wants to preserve his resources. This affects his relationship with Mia.

The following day, their previous experiences influence their decisions.

This is the kind of emergent behaviour we want.

## **Project boundaries**

To keep the project small, the initial version will have:

# **5**

**AI characters**

Independent agents

# **1**

**Village**

One compact map

# **4**

**Buildings**

Farm, shop, home, town hall

# **1**

**Shared world**

Common environment and events

No multiplayer, no complex economy, no combat, and no enormous open world.

Those features are unnecessary for the first release.

# **2. Visual design and world layout**

## **Village design**

I recommend a top-down 2D pixel-art environment, similar in perspective to classic RPG and farming simulation games.

![[Pasted image 20261113213325.png]]


The map should contain:

|Location|Purpose|
|---|---|
|Alex's Farm|Growing and collecting food|
|Noah's Shop|Trading and collecting resources|
|Town Square|Social interactions|
|Community Hall|Group meetings|
|Five Houses|Agent homes and resting places|

The map should be compact enough that the characters are usually visible together.

## **Character design**

![[Pasted image 20261113213347.png]]

![[Pasted image 20261113213420.png]]

Use five distinguishable characters with different clothing, colours, and accessories.

Each character should support:

- Idle animation.
    
- Walking animation.
    
- Four-direction movement.
    
- Talking indicator.
    
- Activity indicator.
    
- Optional emotion indicator.
    

For the first version, use simple sprites rather than complex skeletal animation.

# **3. The five AI agents**

I recommend five agents with personalities that naturally create opportunities for cooperation and disagreement.

[Pixel Art Traveler Sprite Design | Freelancer](https://images.openai.com/static-rsc-4/rLy5RITjR-yihVPx-XCJRmH1MwJtvMff3GhU9V-iwV_VpJuiILPd89FAFwP-nwkHSu-r3wFInDKvFDb-oGb3LvIE74aYP2Vkvk56RmCwIIsma69X_-YW5VaFLTlEs2cMiEVEEAPKRkmtCcOPskOZt2MhiMciSVylL9wJgbFUuv8?purpose=inline)

**1. Alex — The Farmer**

Friendly

- Occupation: Farmer
    
- Personality: Helpful, hardworking, optimistic.
    
- Goal: Maintain the farm and provide food.
    
- Conflict: Dislikes wasting resources.
    
- Memory focus: Who has helped him and who needs food.
    

[98th update: Characters' moods and more chefs - Modern Interiors - RPG Tileset [16X16] by LimeZu](https://images.openai.com/static-rsc-4/B5IP3S4KPth02MNBDBD7QdcM2sJcm-ScJ3p0bYQzBNTeXWrlYoDY5EUXSTWHnF-0UdO_pYOcgJkvzLKOZKmfGMy88X0AtHQhveWeI7euJFj8MViBMIyd8LjIq_yRpLBXMJYlzA9-6SXorBpTxAdpbNtouR3c1_qS-P28kBrr70o?purpose=inline)

**2. Mia — The Socializer**

Social

- Occupation: Baker
    
- Personality: Friendly, curious, talkative.
    
- Goal: Build friendships.
    
- Conflict: Dislikes being ignored.
    
- Memory focus: Conversations, friendships and promises.
    

[Top-Down RPG Character Sprite – Walk & Idle Animation by Agusstt](https://images.openai.com/static-rsc-4/Jz4EVS27PEjUUeHbsRkrsA8s3i5TIMJ-LKKQCYYlu9LjmyqNT-FgUHP6OPSr8uif0eO5KZ66axMVJd2JlR6iL4EVa8wLn2WnShoG_PDgQvGwx6C_f7CLa6l6FU0VBDaRR2BOeOUkgdgdQltvxn9bVEt5mqkAil8AOnyvyBRRlks?purpose=inline)

**3. Noah — The Merchant**

Self-interested

- Occupation: Shopkeeper
    
- Personality: Strategic, cautious, slightly greedy.
    
- Goal: Accumulate resources.
    
- Conflict: Hesitates to share possessions.
    
- Memory focus: Deals, trades and broken promises.
    

[Goatknyght (@goatknyght) on X](https://images.openai.com/static-rsc-4/ejkOpSlsJTCBT4S6KJMd8NjQg6c5IyjAPP9_TalePt1CMu_DUk4WBB2qOCE3_BQSO6w1PEjshgrSp2m9ucit5pTK5WYO6epFL31iaKGETda2c9rYCTltdhRxrgwp1fpvByhLHtjv1E0bIGbVzsNTCREVKoTdWojrJOB36lTtPg8?purpose=inline)

**4. Emma — The Caretaker**

Helpful

- Occupation: Village healer.
    
- Personality: Empathetic, patient, thoughtful.
    
- Goal: Keep villagers happy and healthy.
    
- Conflict: Often prioritizes others over herself.
    
- Memory focus: Villagers' problems and emotional experiences.
    

[Retro Cartoon Blacksmith](https://images.openai.com/static-rsc-4/uGw7p_4uhIQaRq-8VUzAKec-VBzGwH9UxypxBDy3YjEsLTcNEQrtaiCwFj_6NG3AbA1Y3-8BuiqYSsbHlm4UwIJFY_FmhS99AZ7nl7xVwxF57LIO73L7AgKj2W1uDbyscWrvcp0WYbrr7lSmt-soDCj1Z9NT7YHDHdOT5HnIBkioa2JWjPq0B5t01Y-ybiDQ?purpose=inline)

**5. Leo — The Builder**

Independent

- Occupation: Carpenter.
    
- Personality: Creative, introverted, practical.
    
- Goal: Improve the village.
    
- Conflict: Prefers working alone.
    
- Memory focus: Projects, materials and collaborations.
    

These personalities are intentionally different. You want their interests to sometimes overlap and sometimes conflict.

For example:

- Alex needs wood to repair his farm.
    
- Leo has wood but is busy building something.
    
- Mia tries to convince Leo to help Alex.
    
- Noah offers to sell the wood.
    
- Emma suggests that everyone contribute.
    

The outcome should emerge from the agents' decisions, not from a predefined script.

## **Character state**

Every agent should have a structured state that the simulation engine maintains.

class Agent:
    def __init__(self, name, personality, occupation, goals):
        self.name = name
        self.personality = personality
        self.occupation = occupation
        self.goals = goals

        self.energy = 100
        self.happiness = 70

        self.current_action = "idle"
        self.current_location = "home"

        self.memories = []
        self.relationships = {}
        self.inventory = {}

The LLM should not directly modify this object. It should propose actions, and your simulation engine should validate and apply them.

This distinction is important for making the simulation reliable.

# **4. AI architecture**

This is the most important technical section.

I recommend building your own lightweight multi-agent architecture rather than immediately integrating a large agent framework.

You will learn more about agent orchestration, memory management, decision-making, and state management.

## **Overall architecture**

![[Pasted image 20261113213710.png]]

### **Responsibilities of each component**

|Component|Responsibility|
|---|---|
|Agent Manager|Maintains five agents|
|Decision Engine|Requests and interprets AI decisions|
|Memory Manager|Stores and retrieves experiences|
|Social Engine|Updates relationships|
|Simulation Engine|Validates actions and updates the world|
|Ollama|Generates decisions and conversations|
|ChromaDB|Retrieves relevant memories|
|SQLite|Saves persistent simulation state|

### **Why this architecture?**

There are two different types of intelligence in the application:

**LLM intelligence**

- What should I do?
    
- What should I say?
    
- How should I react?
    
- What do I remember?
    
- How should I achieve my goal?
    

**Simulation intelligence**

- Where can I walk?
    
- Is the building accessible?
    
- Do I have enough resources?
    
- Is the requested action valid?
    
- Where should the character move?
    

Do not send basic game mechanics to the LLM. That would waste inference time and make the simulation slower.

# **5. Agent decision-making system**

Every agent needs a decision-making loop.

I recommend a simple cycle:

**1. Observe**

Understand current world and personal state

**2. Retrieve memories**

Find relevant previous experiences

**3. Think**

Ask Ollama to choose an appropriate action

**4. Validate**

Check action against simulation rules

**5. Execute**

Move, interact, work or rest

**6. Remember**

Record meaningful experiences

Repeat throughout the simulation

## **Example: Agent decision**

Suppose Alex is standing near his farm.

The backend prepares this observation:

```
{
  "agent": "Alex",
  "location": "farm",
  "energy": 75,
  "goal": "Collect food",
  "nearby_agents": ["Mia"],
  "inventory": {
    "food": 2,
    "wood": 0
  },
  "recent_events": [
    "Mia asked Alex for food yesterday"
  ]
}
```

The backend retrieves relevant memories and sends the information to Ollama.

The model might return:

```
{
  "action": "talk",
  "target": "Mia",
  "reason": "I remember Mia needed food",
  "dialogue": "Hello Mia! Did you manage to find some food?",
  "priority": 0.8
}
```

The backend validates this response and executes it.

The Phaser frontend receives the event and animates Alex walking towards Mia.

This creates the illusion of autonomous behaviour, but every decision is backed by an actual AI response.

## **Action types**

Keep the initial action vocabulary small.

|Action|Behaviour|
|---|---|
|`move`|Walk to a location|
|`work`|Perform occupation activity|
|`talk`|Initiate conversation|
|`trade`|Exchange resources|
|`help`|Assist another agent|
|`rest`|Recover energy|
|`idle`|Do nothing temporarily|

The LLM must select only from this allowed list.

### **Structured output**

Use Ollama's JSON Schema structured outputs instead of asking the model to return arbitrary text and hoping it produces valid JSON.

Ollama supports constrained structured output through its `format` parameter.

Ollama Blog+1

For example, your action schema could require:

```
ACTION_SCHEMA = {    "type": "object",    "properties": {        "action": {            "type": "string",            "enum": [                "move", "work", "talk",                "trade", "help", "rest", "idle"            ]        },        "target": {"type": ["string", "null"]},        "location": {"type": ["string", "null"]},        "reason": {"type": "string"},        "dialogue": {"type": ["string", "null"]}    },    "required": [        "action", "target", "location",        "reason", "dialogue"    ]}
```

Your backend should also enforce action-specific requirements. For example, `talk` requires a valid target, and `move` requires a valid destination.

# **6. Agent-to-agent conversations**

This is one of the features that will make Tiny Society feel alive.

I recommend a two-stage conversation system.

**Stage 1: Initiation**

An agent decides that it wants to speak with another agent.

**Stage 2: Response**

The second agent receives:

- The first agent's message.
    
- Its own personality.
    
- Relevant memories.
    
- Its current goals.
    
- Its relationship with the first agent.
    

It generates a response.

Example:

**Village conversation**

Live simulation example

[Farmer character. Pixel Art, Konstantin Tonkonozhko | Pixel art characters, Pixel art, Pixel art design](https://images.openai.com/static-rsc-4/W2da4lyKV7v-cKfDnP7aa80BuaaVaq16hoYJF8LCvmkZkfHabwicmf-Bv9XoE_BTB3p0D9a4SJ7qYzga2-Sm77CvuKpSHwNLwCKHuuwRuO4hPLxxFceFWOOK0V8qM-VntWuYyTqFOYD0JkMKtNUQV5L7tzabeehCObBM6bPUdZc?purpose=inline)

**Alex**  
"Hey Noah, I need some wood to repair my farm."

[Retro Cartoon Hooded Merchant](https://images.openai.com/static-rsc-4/3TxbA1vTtMSatLMr-e0ofMyv6mbUW3sSqVPfXOqoGjElfYyrWKQoY6oGcNZpk2Fd4LPP-FGxnlcU3RiNTCD6Oatxs3qqHFKLEhFG6ktLPi86ebiSzDqtoWIIgWNOsr4JPj6B_rMJSJuiMVey07DXVOlCRTRd7RhxalZjsYZ0MP5xpbogviTY2iyIQ6x9GpfT?purpose=inline)

**Noah**  
"I have some, but I was saving it for my shop. What can you offer?"

[Stardew Valley Character Generator | AI-Powered Visual Effects | kaze ai | kaze.ai](https://images.openai.com/static-rsc-4/G5Y9hgZpg7bx3DVWsfR3Mqxx23aZCR29PWPZpR7BsOsU6AhjJPHG46jEQLZcp81xYnjVX0oGB6U82fkOF1-STM_fUyCQj2FmjXaB6-1X6qmqGVUmDDtLYKkVXmWNT9oTYQ0aIHOv-d-ZlkC_cZ_7fT6DCb5lJJEWzz8CAuPztu8?purpose=inline)

**Alex**  
"I could give you some fresh vegetables in exchange."

["Pierre - Stardew Valley" Sticker for Sale by bwanly | Redbubble](https://images.openai.com/static-rsc-4/F-hP0-QBx7rgo-6lOnl5D3sbYYfQ1WU1kkY9Oe8hvjZxZyVkQsfk7Wnct2dRwiRH6hSG-KhFOMI4VAEvEs9cZAtMAgBFy84L1o_hHVjXK4wvB9-YO7PE3x4LyT3iLa5hdnxTirQNNoBjBexMsD_FHipZTGEpUL6bILkFwi350qc?purpose=inline)

**Noah**  
"That sounds fair. Bring them tomorrow."

Example outcome: Alex and Noah establish a trade agreement.

The conversation should not be endless.

Set these initial constraints:

- Maximum 4–6 exchanges per conversation.
    
- One conversation at a time per agent.
    
- No simultaneous LLM calls for every character.
    
- Save the conversation as an experience.
    
- Update relationships after the conversation.
    

You can later add group conversations, but they aren't necessary for the first release.

# **7. Memory architecture**

This is where you can make Tiny Society technically interesting.

I recommend three types of memory.

## **A. Short-term memory**

Contains recent events and conversations.

Example:

```
Alex recently spoke to Noah.
Noah agreed to exchange wood for vegetables.
Alex needs to bring vegetables tomorrow.
```

Keep a limited recent history for each agent.

## **B. Long-term memory**

Stores meaningful experiences that should influence future behaviour.

Example:

```
Alex remembers:
- Noah previously helped him repair the farm.
- Mia regularly asks him for food.
- Leo prefers working independently.
```

Store these as text documents with metadata and embeddings.

## **C. Relationship memory**

This is structured information, not just a collection of text memories.

For example:

|Relationship|Trust|Friendship|
|---|---|---|
|Alex → Mia|80|85|
|Alex → Noah|65|55|
|Alex → Emma|90|90|
|Alex → Leo|60|50|

Illustrative starting values, not actual simulation results.

Relationships should be directional. Alex's opinion of Noah doesn't have to equal Noah's opinion of Alex.

### **How ChromaDB fits in**

**New experience**

Alex exchanges resources with Noah

**Memory processing**

Extract important facts and experiences

**Ollama Embeddings**

Convert memory text into vectors

**ChromaDB**

Store and retrieve semantically similar memories

**Future decision**

Retrieve memories relevant to the current situation

For embeddings, start with:

```
ollama pull nomic-embed-text
```

Use the embedding model independently from your chat model.

For example, when Alex meets Noah, you can retrieve memories about:

- Noah.
    
- Previous trades.
    
- Previous disagreements.
    
- Existing promises.
    

Don't retrieve every memory on every decision. Retrieve only the most relevant few.

**Important:** ChromaDB is optional for your very first prototype. Start with SQLite-backed recent memory, then add semantic retrieval once the agent loop works. This keeps debugging manageable.

# **8. Ollama model configuration**

Since this project is intended to run locally, I would avoid using large models.

Your HP ZBook Firefly G9 has an i7-1265U and a 4GB T550 GPU, so inference efficiency matters. The model should be shared across all five agents.

qwen3:1.7b
**nomic-embed-text**

For semantic memory retrieval. This is not a chat model.


These are starting recommendations, not guaranteed performance benchmarks. Actual speed and memory consumption will depend on quantization, context size, GPU offloading and concurrent workloads.

### **How to use one model for five agents**

Do not create five separate Ollama instances.

Instead:

```
                Ollama
                   |
              Qwen3:1.7B
                   |
       -------------------------
       |    |    |    |       |
      Alex  Mia  Noah Emma    Leo
       |    |    |    |       |
      Own  Own  Own  Own     Own
    Profile Profile Profile Profile Profile
       |    |    |    |       |
      Own memories and goals
```

Every agent gets a different system prompt and state.

This makes it possible to create different personalities without needing different models.

### **Important performance optimization**

Use an event-driven LLM schedule.

For example:

- Movement: ordinary game logic.
    
- Hunger and energy: ordinary game logic.
    
- Decision: LLM call every few simulation minutes.
    
- Conversation: LLM call when an interaction starts.
    
- Memory extraction: after meaningful events.
    
- Memory retrieval: before relevant decisions.
    

The simulation can advance much faster than real time without generating a new LLM response for every frame.

# **9. Frontend and backend technology**

## **Frontend: React + Phaser 3**

[Phaser](https://images.openai.com/static-rsc-4/Hyuz9mPpnHpXQ1KlwQoXW8otqpTRGXR364jlUHYKeFVQvV8R_wvoLjsHBcG17cbUn22PhCPmzZML4m5dCXNXrtM9s5XFhcl4Nbif-QBlURoiipqAnsoKkDQaK2bSDo7VJuMcc7IRA5JHIXnbmjpWdlDotT-24h4JeAm3luR3QTw?purpose=inline)

**Phaser 3**

2D game rendering and simulation visualization

[Official website](https://phaser.io/?utm_source=chatgpt.com) · [Documentation](https://docs.phaser.io/?utm_source=chatgpt.com)

I recommend Phaser because it provides:

- Sprite rendering.
    
- Tilemaps.
    
- Character animation.
    
- Camera movement.
    
- Collision detection.
    
- Input handling.
    
- Scene management.
    

It is designed for browser-based 2D games and supports TypeScript.

Phaser+1

Use React for the surrounding application interface and Phaser for the actual village.

Do not build the entire game interface in Phaser.

## **Backend: Python + FastAPI**

[FastAPI Training online | Certification Course](https://images.openai.com/static-rsc-4/3oqMqrp7oPRSriMt9xXVBHZHsPei8fEWuA-8L4K7XuJ6mr_sRjvu-9xG8XhwQ6Cxii8kMDYBf2IPpic0w9lsd_WWzuUoqZsnVObn85H1cUBOsBkrUM-hiHgqvF7zNkL7ioxWOvl6qzqnTZgxAN23QuSS09nFm6DaRwaX6wcibpI?purpose=inline)

**FastAPI**

Agent orchestration, simulation and Ollama integration

[Documentation](https://fastapi.tiangolo.com/?utm_source=chatgpt.com)

FastAPI handles:

- Creating and loading agents.
    
- Starting and stopping simulation.
    
- Calling Ollama.
    
- Managing memories.
    
- Updating relationships.
    
- Broadcasting events to the frontend.
    

## **Communication**

Use:

- REST API for configuration, loading and saving.
    
- WebSockets for live simulation events.
    

For example, when Alex starts walking towards Mia, the backend sends an event:

```
{
  "type": "agent_action",
  "agent_id": "alex",
  "action": "move",
  "destination": "town_square"
}
```

Phaser receives the event and handles the animation.

The frontend should not ask Ollama to make decisions. Keep all AI orchestration on the backend.

# **10. Complete project folder structure**

I recommend a monorepo with two main applications.

```
tiny-society/
│
├── frontend/
│   ├── public/
│   │   ├── assets/
│   │   │   ├── characters/
│   │   │   ├── buildings/
│   │   │   ├── environment/
│   │   │   ├── tilesets/
│   │   │   └── ui/
│   │   │
│   │   └── maps/
│   │       └── village.json
│   │
│   ├── src/
│   │   ├── game/
│   │   │   ├── scenes/
│   │   │   │   ├── BootScene.ts
│   │   │   │   ├── VillageScene.ts
│   │   │   │   └── UIScene.ts
│   │   │   │
│   │   │   ├── entities/
│   │   │   │   └── Character.ts
│   │   │   │
│   │   │   ├── systems/
│   │   │   │   ├── MovementSystem.ts
│   │   │   │   └── AnimationSystem.ts
│   │   │   │
│   │   │   └── Game.ts
│   │   │
│   │   ├── components/
│   │   │   ├── AgentPanel.tsx
│   │   │   ├── EventLog.tsx
│   │   │   ├── ConversationPanel.tsx
│   │   │   ├── WorldControls.tsx
│   │   │   └── RelationshipPanel.tsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useSimulation.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── agents/
│   │   │   ├── agent.py
│   │   │   ├── agent_manager.py
│   │   │   ├── personalities.py
│   │   │   └── decision_engine.py
│   │   │
│   │   ├── simulation/
│   │   │   ├── engine.py
│   │   │   ├── world.py
│   │   │   ├── scheduler.py
│   │   │   └── action_executor.py
│   │   │
│   │   ├── memory/
│   │   │   ├── memory_manager.py
│   │   │   ├── embedding_service.py
│   │   │   └── retrieval.py
│   │   │
│   │   ├── social/
│   │   │   ├── conversation.py
│   │   │   └── relationship_manager.py
│   │   │
│   │   ├── llm/
│   │   │   ├── ollama_client.py
│   │   │   └── prompts.py
│   │   │
│   │   ├── database/
│   │   │   ├── models.py
│   │   │   └── repository.py
│   │   │
│   │   ├── api/
│   │   │   ├── agents.py
│   │   │   ├── simulation.py
│   │   │   └── websocket.py
│   │   │
│   │   └── config.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   ├── architecture.md
│   └── agent-design.md
│
├── README.md
└── .gitignore
```

This is the target structure, not something you need to create all at once.

Start with the smallest working modules and expand as each feature becomes necessary.

# **11. Database design**

Use SQLite for persistent data and ChromaDB for vector memories.

You only need a few tables.

|Table|Important fields|
|---|---|
|Agents|id, name, personality, occupation, goals|
|AgentState|agent_id, energy, happiness, location, current_action|
|Relationships|source_id, target_id, trust, friendship|
|Events|id, agent_id, event_type, description, timestamp|
|Conversations|id, participant_ids, messages|
|WorldState|id, simulation_time, current_weather|

For long-term memories, use a ChromaDB collection called:

`agent_memories`

Each memory should have metadata such as:

```
{
  "agent_id": "alex",
  "event_type": "trade",
  "related_agent": "noah",
  "importance": 0.85,
  "simulation_day": 2
}
```

This lets you retrieve memories belonging to a particular agent and related to a particular person or event.

### **Persistence requirement**

When the user closes the application:

- Save agent states.
    
- Save relationships.
    
- Save important memories.
    
- Save the world time.
    
- Save ongoing promises and tasks.
    

When the user reopens it, the village should continue from where it stopped.

This is an excellent feature to demonstrate.

# **12. API design**

Keep the backend API small.

|Method|Endpoint|Purpose|
|---|---|---|
|GET|`/agents`|Get all agents|
|GET|`/agents/{id}`|Get agent details|
|GET|`/world`|Get world state|
|POST|`/simulation/start`|Start simulation|
|POST|`/simulation/pause`|Pause simulation|
|POST|`/simulation/reset`|Reset world|
|POST|`/simulation/speed`|Change simulation speed|
|GET|`/agents/{id}/memories`|View agent memories|
|GET|`/agents/{id}/relationships`|View relationships|
|POST|`/agents/{id}/interact`|Let user interact with agent|
|WS|`/ws/simulation`|Receive live world events|

You can also add an endpoint for manually triggering an agent decision during development.

## **User interaction**

I would add one feature that makes the project more interesting:

**Talk to a villager.**

The user can click a character and initiate a conversation.

For example:

User: "Why did you refuse to help Alex?"

Noah: "I need to save my wood for the shop. Alex has helped me before, though, so perhaps I should reconsider."

The character should answer using its personality and relevant memories.

This is different from a generic chatbot because the response should be grounded in the character's actual simulation history.

# **13. User interface design**

I would create a clean, dark-themed simulation interface surrounding a pixel-art village.

![[Pasted image 20261113213944.png]]

**Main screen layout**

![[Pasted image 20261113214004.png]]
![[Pasted image 20261113214034.png]]
Conceptual interface layout, not a functional simulation.

The actual application should have four main areas:

1. **World:** The interactive village.
    
2. **Agents:** Character information and activities.
    
3. **Events:** Live event feed and conversations.
    
4. **Relationships:** Social connections and relationship changes.
    

When a character is selected, open a side panel containing their profile, current goal, memories and relationships.

Do not clutter the village with too many interface elements.

# **14. Development roadmap**

I recommend building this over approximately four weeks of focused development. You can adjust the pace around your academic work.

**Week 1 — Build the world**
![[Pasted image 20261113214159.png]]
Foundation


- Set up React, TypeScript and Phaser.
    
- Create the village map.
    
- Import character sprites.
    
- Implement movement and collision.
    
- Add five characters.
    
- Create the basic dashboard.
    

Milestone: Five characters can walk around the village.

**Week 2 — Add AI intelligence**
- Install Ollama and test Qwen3.
    
- Build FastAPI backend.
    
- Create five agent profiles.
    
- Implement the decision engine.
    
- Add structured JSON actions.
    
- Connect the simulation to the frontend.
    

Milestone: Characters independently decide what to do.

**Week 3 — Memory and social interactions**

- Add agent-to-agent conversations.
    
- Implement short-term memory.
    
- Integrate Ollama embeddings.
    
- Add ChromaDB retrieval.
    
- Implement relationship scores.
    
- Add shared goals and simple resource exchanges.
    

Milestone: Agents remember their experiences and develop relationships.

**Week 4 — Polish and evaluation**
- Add persistence with SQLite.
    
- Add simulation controls.
    
- Add character information panels.
    
- Add event history.
    
- Test different scenarios.
    
- Optimize Ollama inference.
    
- Create README, screenshots and demo video.
    

Milestone: A complete, demonstrable Tiny Society release

## **What should you build first?**

The development order is important.

Don't begin by creating all five AI agents.

Build one complete agent first:

1. Create Alex.
    
2. Give Alex a personality and goal.
    
3. Let Alex observe the environment.
    
4. Connect Alex to Ollama.
    
5. Let Alex choose an action.
    
6. Execute that action in Phaser.
    
7. Save the experience.
    

Once this works, create the other four agents using the same architecture.

This prevents you from debugging five different problems simultaneously.

# **15. Testing and evaluation**

This is something I particularly recommend adding because it will differentiate Tiny Society from a simple AI game.

You should be able to demonstrate that the characters actually behave differently and retain memories.

## **Test scenarios**

|Test|Expected result|
|---|---|
|Alex needs wood|Alex seeks a source of wood|
|Noah refuses a trade|Alex remembers the refusal|
|Mia meets Emma|They can initiate a conversation|
|Leo receives a request|He evaluates it based on his personality|
|Simulation restarts|Agent states and memories persist|

## **Evaluation metrics**

Add a small evaluation section to your project documentation.

|Metric|What it measures|
|---|---|
|Action validity|Percentage of valid actions generated|
|Memory retrieval relevance|Whether useful memories are retrieved|
|Goal completion|Whether agents achieve their goals|
|Personality consistency|Whether decisions reflect agent profiles|
|Conversation coherence|Whether conversations remain contextually relevant|

You don't need to train a model or develop a complicated evaluation framework.

Even a simple test suite with 20–30 controlled scenarios would make this project stronger.

For example, compare Noah's behaviour before and after he develops a friendship with Alex.

Does his willingness to help change?

That's an interesting experiment to show in your demo.

# **17. Initial setup commands**

Here is the initial environment setup for Windows.

**Frontend**

```
mkdir tiny-society
cd tiny-society

npm create vite@latest frontend -- --template react-ts

cd frontend
npm install
npm install phaser
```

**Backend**

Open another terminal:

```
cd tiny-society

mkdir backend
cd backend

py -m venv venv
.\venv\Scripts\activate

pip install fastapi uvicorn ollama
pip install chromadb
pip install sqlalchemy pydantic
```

You can add testing dependencies later:

```
pip install pytest httpx
```

**Ollama**

```
ollama pull qwen3:1.7b
ollama pull nomic-embed-text
```

Test Ollama:

```
ollama run qwen3:1.7b
```

Test the backend:

```
uvicorn app.main:app --reload
```

For the first prototype, you only need FastAPI, Ollama, Phaser and SQLite. Add ChromaDB after basic memory storage works.

# **18. Important development decisions**

I want to highlight five decisions that will save you considerable development time.

**1. Don't use LangChain or CrewAI initially.**

Build a lightweight custom agent manager. You only have five agents, so you don't need a large orchestration framework.

**2. Don't make every character think constantly.**

Use a scheduler and event-driven decisions. This is particularly important for local inference.

**3. Don't let the LLM control character movement directly.**

The LLM selects a destination. Phaser handles pathfinding and movement.

**4. Don't store every conversation as a permanent memory.**

Use memory importance scoring. Otherwise, the database will fill with irrelevant information.

**5. Make the simulation reproducible.**

Add a way to reset the world to its initial state and run the same scenario again. This will make evaluation and debugging much easier.



# **20. Final project definition**

# **Tiny Society**

_Five minds. One world. Their own stories._

**Core features**

- Five autonomous AI characters.
    
- Personality-based decision-making.
    
- Agent-to-agent conversations.
    
- Short-term and long-term memory.
    
- Dynamic relationships.
    
- Autonomous daily activities.
    
- Persistent simulation.
    
- Interactive 2D pixel-art world.
    

**Technology**

`Python` · `Ollama` · `Qwen3` · `FastAPI` · `React` · `Phaser 3` · `ChromaDB` · `SQLite`

**Definition of success**

You can start the application, leave the village running, and observe five AI characters independently making decisions, interacting, remembering experiences and developing relationships — all using local models.