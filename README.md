# 🏘️ Tiny Society — Autonomous AI Village Simulation

_Five autonomous minds. One tiny 2D world. Unlimited emergent possibilities._

Tiny Society is an autonomous agent simulation where 5 AI characters live in an interactive 2D pixel-art village. Powered by local LLM inference (**Ollama with Llama 3.2**), characters make independent decisions, converse with each other, tend to occupations, form evolving relationships, and retain memories.

---

## 🗺️ Village Overview & Locations

The village layout is rendered in authentic 2D pixel art based on the design map:
- **Alex's Farm & Barn:** Large red barn, cattle pasture, hay bales, and farming tools.
- **Wheat Field:** Fenced agricultural plot with golden crops.
- **Mia's Bakery & Cottage:** Stone cottage with chimney smoke and baking ovens.
- **Noah's General Merchant:** Blue-roof trading post with a fresh water well and bench.
- **Emma's Clinic & Thatch Cottage:** Thatched apothecary cottage surrounded by healing herbs.
- **Leo's Carpenter Workshop:** Timber framing workbench with open lean-to and lumber stacks.
- **Town Square & Fountain:** Central cobblestone gathering plaza with a stone water fountain.
- **Lake Dock & Campsite:** Blue pond with wooden pier, rowboat, reeds, and traveler tent.
- **Old Village Storage:** Rustic shed on the forest path.

---

## 👥 The 5 Autonomous Villagers

| Villager | Occupation | Personality | Key Goal | Home / Work |
|---|---|---|---|---|
| **Alex** | Farmer 🌾 | Helpful, hardworking, optimistic | Grow food & care for cattle | Barn & Wheat Field |
| **Mia** | Baker 🥖 | Friendly, curious, talkative | Bake bread & build village friendships | Bakery & Town Square |
| **Noah** | Merchant 🛒 | Strategic, cautious, calculating | Accumulate valuable trade inventory | General Store & Plaza |
| **Emma** | Healer 🌿 | Empathetic, patient, observant | Tend sick villagers & gather herbs | Clinic & Lake Dock |
| **Leo** | Carpenter 🔨 | Creative, introverted, practical | Craft furniture & repair village structures | Workshop & Storage Shed |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18+ (tested on v24)
- **Python:** 3.10+ (tested on 3.12)
- **Ollama:** Installed and running locally with `llama3.2`

```bash
ollama run llama3.2
```

### 2. Run Both Backend & Frontend with One Command

You can start both servers simultaneously with unified console logs using any of the following:

```bash
# Option A: Python unified runner (Cross-platform)
python run.py

# Option B: Windows double-clickable batch file
run.bat

# Option C: PowerShell
.\run.ps1
```

This will automatically:
1. Verify that local Ollama is active.
2. Launch the FastAPI backend on `http://localhost:8000`.
3. Launch the React + Phaser frontend on `http://localhost:5173`.
4. Cleanly terminate both child processes when you press `Ctrl+C`.

---

### 3. Or Run Separately (Manual)

#### Frontend (React + Phaser 3)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Backend API (FastAPI)
```bash
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
Backend API docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🎮 Interactive Controls
- **Camera Pan:** Left-click and drag across the village map.
- **Camera Zoom:** Mouse scroll wheel to zoom in (up to 2.5x) or out.
- **Select Villager:** Click any walking character on the map or click their card in the top Villagers bar to center camera and inspect their profile.
- **Send Villager:** In the inspector or by clicking a landmark, command an agent to walk to any destination.
- **Talk to Villager:** Type into the chat box in the agent panel to interact directly with the character in real-time.
- **Simulation Controls:** Pause/Resume, Speed (1x, 2x, 5x), Save state to SQLite, and Reset to Day 1 Morning.

---

## 📦 Project Architecture
```
AI Society/
├── frontend/                # React 19 + TypeScript + Phaser 3 + Tailwind CSS v4
│   ├── public/assets/       # Extracted character sprite sheets & 2D village map
│   └── src/
│       ├── game/            # Phaser scenes, MovementSystem, and Character entity
│       ├── components/      # TopBar, VillagersBar, AgentPanel, EventLog
│       └── App.tsx          # Main application dashboard layout
│
├── backend/                 # FastAPI + Ollama (Llama 3.2) + SQLite + SQLAlchemy
│   ├── app/
│   │   ├── config.py        # Configured for Ollama "llama3.2"
│   │   ├── main.py          # REST endpoints & agent interaction
│   │   ├── agents/          # Agent profiles & state tracking
│   │   └── llm/             # Async Ollama client with Llama 3.2 integration
│   └── requirements.txt
│
├── Assets/                  # Original design assets & reference images
├── Implementation/          # Detailed implementation plan & skills guide
└── README.md
```
