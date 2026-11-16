import Phaser from 'phaser';
import { Character } from '../entities/Character';
import { AGENT_PERSONALITIES } from '../personalities';
import { VILLAGE_LOCATIONS, VILLAGE_OBSTACLES } from '../VillageLocations';
import { EventBus } from '../EventBus';
import type { AgentState, SimulationEvent } from '../../types/simulation';

export class VillageScene extends Phaser.Scene {
  public characters: Map<string, Character> = new Map();
  private obstaclesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private selectedCharacterId: string | null = null;
  private isSimulationRunning = true;
  private simulationSpeed = 1;
  private simTimeMinutes = 8 * 60 + 30; // Starts at 08:30 AM (Day 1)
  private day = 1;
  private isBackendConnected = false;

  // Camera pan state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;

  // Autonomous schedule timers & social cooldowns
  private agentTickTimers: Map<string, number> = new Map();
  private socialCooldowns: Map<string, number> = new Map();
  private agentSocialCooldowns: Map<string, number> = new Map();
  private lastDialogueIndex: Map<string, number> = new Map();

  constructor() {
    super({ key: 'VillageScene' });
  }

  create() {
    // 1. Add background map image (794 x 630)
    const map = this.add.image(0, 0, 'village_map');
    map.setOrigin(0, 0);

    // Set world physics and camera bounds to exact map size
    this.physics.world.setBounds(0, 0, 794, 630);
    this.cameras.main.setBounds(0, 0, 794, 630);
    this.cameras.main.setZoom(1.25);
    this.cameras.main.centerOn(395, 345); // Start centered on Town Square fountain

    // 2. Setup static obstacle collision boxes
    this.obstaclesGroup = this.physics.add.staticGroup();
    for (const obs of VILLAGE_OBSTACLES) {
      // Invisible static collision zone
      const zone = this.add.zone(obs.x + obs.w / 2, obs.y + obs.h / 2, obs.w, obs.h);
      this.physics.add.existing(zone, true);
      this.obstaclesGroup.add(zone);
    }

    // 3. Spawn 5 autonomous characters
    const spawnPoints: Record<string, { x: number; y: number }> = {
      alex: { x: 240, y: 530 }, // Farm
      mia: { x: 240, y: 285 },  // Bakery
      noah: { x: 515, y: 305 }, // Shop
      emma: { x: 475, y: 170 }, // Clinic
      leo: { x: 460, y: 470 },  // Workshop
    };

    for (const [id, personality] of Object.entries(AGENT_PERSONALITIES)) {
      const pt = spawnPoints[id] || { x: 395, y: 355 };
      const char = new Character(this, pt.x, pt.y, personality);

      // Collide character with static obstacles
      this.physics.add.collider(char, this.obstaclesGroup);

      // Click on character to select
      char.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonDown()) {
          this.selectCharacter(id);
        }
      });

      this.characters.set(id, char);
      this.agentTickTimers.set(id, this.time.now + Phaser.Math.Between(2000, 6000));
    }

    // 4. Setup Input: Camera drag/pan & mouse wheel zoom
    this.setupCameraControls();

    // 5. Interactive clicks on village landmarks
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if clicked near any landmark
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      let clickedLocationKey: string | null = null;

      for (const [key, loc] of Object.entries(VILLAGE_LOCATIONS)) {
        if (Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, loc.x, loc.y) < 30) {
          clickedLocationKey = key;
          break;
        }
      }

      if (clickedLocationKey) {
        const loc = VILLAGE_LOCATIONS[clickedLocationKey];
        EventBus.emit('location-selected', loc);

        // If an agent is currently selected, send them to this location!
        if (this.selectedCharacterId && pointer.rightButtonDown()) {
          const char = this.characters.get(this.selectedCharacterId);
          if (char) {
            char.walkTo(loc.x, loc.y, () => {
              char.setAction('idle', `Arrived at ${loc.name}`);
              this.logEvent(char.id, char.agentName, 'move', `Arrived at ${loc.name}`);
            });
            this.logEvent(char.id, char.agentName, 'move', `Walking to ${loc.name}`);
          }
        }
      }
    });

    // 6. Listen for React controls via EventBus
    this.setupEventBusListeners();

    // Announce initial world load
    this.broadcastAgentStates();
    this.logEvent('system', 'Village', 'start', 'Tiny Society simulation started. 5 villagers are active.');
  }

  private setupCameraControls() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = this.cameras.main.scrollX;
        this.cameraStartY = this.cameras.main.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = (pointer.x - this.dragStartX) / this.cameras.main.zoom;
        const dy = (pointer.y - this.dragStartY) / this.cameras.main.zoom;
        this.cameras.main.scrollX = this.cameraStartX - dx;
        this.cameras.main.scrollY = this.cameraStartY - dy;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Mouse wheel zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const currentZoom = this.cameras.main.zoom;
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Phaser.Math.Clamp(currentZoom * zoomFactor, 0.9, 2.5);
      this.cameras.main.setZoom(newZoom);
    });
  }

  private setupEventBusListeners() {
    // Select agent from React UI
    EventBus.on('select-agent', (agentId: string) => {
      this.selectCharacter(agentId);
    });

    // Toggle pause/play
    EventBus.on('toggle-simulation', (running: boolean) => {
      this.isSimulationRunning = running;
      this.logEvent('system', 'Simulation', 'control', running ? 'Simulation resumed.' : 'Simulation paused.');
    });

    // Set speed
    EventBus.on('set-speed', (speed: number) => {
      this.simulationSpeed = speed;
      this.logEvent('system', 'Simulation', 'speed', `Simulation speed set to ${speed}x.`);
    });

    // Move agent to destination directly from React UI
    EventBus.on('command-agent-move', (data: { agentId: string; locationId: string }) => {
      const char = this.characters.get(data.agentId);
      const loc = VILLAGE_LOCATIONS[data.locationId];
      if (char && loc) {
        char.walkTo(loc.x, loc.y, () => {
          char.setAction('idle', `Arrived at ${loc.name}`);
          this.logEvent(char.id, char.agentName, 'move', `Arrived at ${loc.name}`);
          this.broadcastAgentStates();
        });
        this.logEvent(char.id, char.agentName, 'move', `Commanded to walk to ${loc.name}`);
        this.broadcastAgentStates();
      }
    });

    // Trigger dialogue / conversation
    EventBus.on('agent-say', (data: { agentId: string; message: string }) => {
      const char = this.characters.get(data.agentId);
      if (char) {
        char.say(data.message);
        this.logEvent(char.id, char.agentName, 'talk', data.message);
      }
    });

    // Center camera on agent
    EventBus.on('focus-agent', (agentId: string) => {
      const char = this.characters.get(agentId);
      if (char) {
        this.cameras.main.pan(char.x, char.y, 500, 'Power2');
      }
    });

    // Reset world
    EventBus.on('reset-world', () => {
      this.simTimeMinutes = 8 * 60 + 30;
      this.day = 1;
      const spawnPoints: Record<string, { x: number; y: number }> = {
        alex: { x: 240, y: 530 },
        mia: { x: 240, y: 285 },
        noah: { x: 515, y: 305 },
        emma: { x: 475, y: 170 },
        leo: { x: 460, y: 470 },
      };
      for (const [id, char] of this.characters.entries()) {
        const pt = spawnPoints[id] || { x: 395, y: 355 };
        char.setPosition(pt.x, pt.y);
        char.setAction('idle', 'Resting at home');
      }
      this.socialCooldowns.clear();
      this.agentSocialCooldowns.clear();
      this.cameras.main.pan(395, 345, 600, 'Power2');
      this.logEvent('system', 'Village', 'reset', 'World state reset to Day 1 Morning.');
      this.broadcastAgentStates();
    });

    // Backend WebSocket connection status
    EventBus.on('ws-status-changed', (status: string) => {
      this.isBackendConnected = (status === 'connected');
      this.logEvent(
        'system',
        'AI Core',
        'network',
        status === 'connected'
          ? 'Connected to local Ollama Llama 3.2 engine via WebSocket.'
          : 'AI server offline; operating on autonomous local rules.'
      );
    });

    // Backend AI agent action execution
    EventBus.on('backend-agent-action', (data: any) => {
      if (!data || !data.agent_id) return;
      const char = this.characters.get(data.agent_id);
      if (!char) return;

      // Update state attributes
      if (data.energy !== undefined) char.stateData.energy = data.energy;
      if (data.happiness !== undefined) char.stateData.happiness = data.happiness;
      if (data.inventory) char.stateData.inventory = { ...data.inventory };
      if (data.action_detail) char.stateData.actionDetail = data.action_detail;
      if (data.action) char.stateData.currentAction = data.action;
      if (data.location) char.stateData.currentLocation = data.location;
      if (data.description) {
        if (!char.stateData.recentMemories.includes(data.description)) {
          char.stateData.recentMemories.unshift(data.description);
          if (char.stateData.recentMemories.length > 10) char.stateData.recentMemories.pop();
        }
      }

      // If location is provided, navigate to landmark
      const loc = VILLAGE_LOCATIONS[data.location];
      if (loc && Phaser.Math.Distance.Between(char.x, char.y, loc.x, loc.y) > 28) {
        char.walkTo(loc.x, loc.y, () => {
          char.setAction(data.action || 'idle', data.action_detail || `At ${loc.name}`);
          if (data.dialogue) {
            char.say(data.dialogue, 4500);
          }
          this.broadcastAgentStates();
        });
      } else {
        char.setAction(data.action || 'idle', data.action_detail || 'Active');
        if (data.dialogue) {
          char.say(data.dialogue, 4500);
        }
      }

      this.logEvent(
        data.agent_id,
        data.agent_name || char.agentName,
        data.action || 'action',
        data.description || data.action_detail || `Action: ${data.action}`
      );

      this.broadcastAgentStates();

      // If this agent is currently inspected in AgentPanel, refresh view
      if (this.selectedCharacterId === data.agent_id) {
        EventBus.emit('agent-selected', {
          ...char.stateData,
          x: Math.round(char.x),
          y: Math.round(char.y),
        });
      }
    });

    // Backend AI dynamic agent-to-agent conversation execution
    EventBus.on('backend-agent-conversation', (data: any) => {
      if (!data || !data.initiator_id || !data.receiver_id) return;
      const a = this.characters.get(data.initiator_id);
      const b = this.characters.get(data.receiver_id);
      if (!a || !b) return;

      // Face each other
      if (a.x < b.x) {
        a.face('right');
        b.face('left');
      } else {
        a.face('left');
        b.face('right');
      }

      a.setAction('talk', `Talking with ${b.agentName}`);
      b.setAction('talk', `Talking with ${a.agentName}`);

      const lineA = data.dialogue?.[0]?.text || 'Good day!';
      const lineB = data.dialogue?.[1]?.text || 'Good to see you!';

      a.say(lineA, 4000);
      this.time.delayedCall(4200, () => {
        b.say(lineB, 4000);
      });

      this.time.delayedCall(8500, () => {
        if (a.stateData.currentAction === 'talk') a.setAction('idle', 'Resting after chat');
        if (b.stateData.currentAction === 'talk') b.setAction('idle', 'Resting after chat');
        this.broadcastAgentStates();
      });

      this.logEvent(
        'social',
        `${a.agentName} & ${b.agentName}`,
        'conversation',
        `[${data.topic}] "${lineA}" — "${lineB}"`
      );

      EventBus.emit('conversation-logged', data);
      this.broadcastAgentStates();
    });

    // Backend world tick synchronization
    EventBus.on('backend-world-tick', (data: any) => {
      if (data) {
        if (data.time_minutes !== undefined) {
          this.simTimeMinutes = data.time_minutes;
        }
        if (data.day !== undefined) {
          this.day = data.day;
        }
      }
    });

    // Backend simulation play/pause control sync
    EventBus.on('backend-simulation-status', (data: any) => {
      if (data && data.is_running !== undefined) {
        this.isSimulationRunning = data.is_running;
      }
    });

    // Backend simulation speed sync
    EventBus.on('backend-simulation-speed', (data: any) => {
      if (data && data.speed !== undefined) {
        this.simulationSpeed = data.speed;
      }
    });
  }

  public selectCharacter(agentId: string | null) {
    // Deselect previous
    if (this.selectedCharacterId && this.characters.has(this.selectedCharacterId)) {
      this.characters.get(this.selectedCharacterId)?.setSelected(false);
    }

    this.selectedCharacterId = agentId;

    if (agentId && this.characters.has(agentId)) {
      const char = this.characters.get(agentId)!;
      char.setSelected(true);
      this.cameras.main.pan(char.x, char.y, 400, 'Power2');
      EventBus.emit('agent-selected', char.stateData);
    } else {
      EventBus.emit('agent-selected', null);
    }
  }

  update(time: number, delta: number) {
    if (!this.isSimulationRunning) return;

    // Apply simulation speed multiplier
    const effectiveDelta = delta * this.simulationSpeed;

    // 1. Advance simulation clock (1 real second = 1 sim minute at 1x speed)
    this.simTimeMinutes += (effectiveDelta / 1000) * (60 / 60);
    if (this.simTimeMinutes >= 24 * 60) {
      this.simTimeMinutes = 0;
      this.day++;
      this.logEvent('system', 'World', 'day', `A new day dawns: Day ${this.day}.`);
    }

    // Broadcast world state every 60 frames
    if (this.game.loop.frame % 30 === 0) {
      this.broadcastWorldState();
    }

    // 2. Update characters
    for (const [id, char] of this.characters.entries()) {
      char.update(time, effectiveDelta);

      // Check autonomous action tick for this agent (runs if backend is offline)
      const nextTick = this.agentTickTimers.get(id) || 0;
      if (time >= nextTick) {
        if (!this.isBackendConnected) {
          this.runAutonomousAction(char);
        }
        // Next tick in 9 to 16 seconds (scaled by speed)
        const delay = (Phaser.Math.Between(9000, 16000) / this.simulationSpeed);
        this.agentTickTimers.set(id, time + delay);
      }
    }

    // 3. Check for social encounters between nearby agents
    if (this.game.loop.frame % 60 === 0) {
      this.checkSocialEncounters();
      this.broadcastAgentStates();
    }
  }

  /**
   * Autonomous behavior loop per character
   */
  private runAutonomousAction(char: Character) {
    const p = char.personality;
    const hour = Math.floor(this.simTimeMinutes / 60);

    // Pick activity based on personality & time of day
    if (hour >= 21 || hour < 6) {
      // Night: Sleep / rest at home
      const home = VILLAGE_LOCATIONS[p.homeLocation];
      if (home && Phaser.Math.Distance.Between(char.x, char.y, home.x, home.y) > 25) {
        char.walkTo(home.x, home.y, () => {
          char.setAction('rest', 'Sleeping peacefully at home');
          this.logEvent(char.id, char.agentName, 'rest', 'Returned home to rest for the night.');
        });
      } else {
        char.setAction('rest', 'Sleeping peacefully at home');
      }
      return;
    }

    // Daytime activity choices per agent
    const roll = Math.random();

    if (char.id === 'alex') {
      if (roll < 0.35) {
        const target = VILLAGE_LOCATIONS['wheat_field'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('work', 'Inspecting golden wheat crops');
          char.say('The harvest is looking great this season!', 3500);
          this.logEvent(char.id, char.agentName, 'work', 'Harvested golden wheat in the field.');
        });
      } else if (roll < 0.65) {
        const target = VILLAGE_LOCATIONS['alex_farm'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('work', 'Feeding cattle & stacking hay');
          this.logEvent(char.id, char.agentName, 'work', 'Tended cattle and checked fences.');
        });
      } else {
        const target = VILLAGE_LOCATIONS['town_square'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('idle', 'Resting by the fountain');
          char.say('Good day, everyone! Fresh bread smells great today.', 4000);
          this.logEvent(char.id, char.agentName, 'social', 'Visited the Town Square to greet villagers.');
        });
      }
    } else if (char.id === 'mia') {
      if (roll < 0.4) {
        const target = VILLAGE_LOCATIONS['town_square'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('talk', 'Chatting with villagers');
          char.say('Has anyone seen Leo? We need more timber in town!', 4000);
          this.logEvent(char.id, char.agentName, 'social', 'Shared village gossip near the fountain.');
        });
      } else if (roll < 0.7) {
        const target = VILLAGE_LOCATIONS['noah_shop'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('trade', 'Browsing merchant supplies');
          char.say('Noah, do you have any sugar or salt in stock?', 3800);
          this.logEvent(char.id, char.agentName, 'trade', 'Visited Noah’s shop to check ingredients.');
        });
      } else {
        const target = VILLAGE_LOCATIONS['mia_bakery'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('work', 'Baking fresh sourdough bread');
          char.say('Warm bread is almost ready!', 3500);
          this.logEvent(char.id, char.agentName, 'work', 'Prepared freshly baked pastries in the oven.');
        });
      }
    } else if (char.id === 'noah') {
      if (roll < 0.5) {
        const target = VILLAGE_LOCATIONS['noah_shop'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('work', 'Organizing shop wares & books');
          char.say('Fresh tools and seeds available for trade!', 3500);
          this.logEvent(char.id, char.agentName, 'work', 'Polished shop wares and checked account ledger.');
        });
      } else if (roll < 0.75) {
        const target = VILLAGE_LOCATIONS['town_square'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('trade', 'Evaluating trade opportunities');
          this.logEvent(char.id, char.agentName, 'social', 'Checked village square for trade demands.');
        });
      } else {
        const target = VILLAGE_LOCATIONS['campsite'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('trade', 'Visiting traveler pavilion');
          char.say('Any rare goods from the capital for trade?', 3800);
          this.logEvent(char.id, char.agentName, 'trade', 'Scouted the traveler tent for trade items.');
        });
      }
    } else if (char.id === 'emma') {
      if (roll < 0.4) {
        const target = VILLAGE_LOCATIONS['lake_dock'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('work', 'Gathering water lilies & herbs');
          char.say('These lake reeds make soothing tea.', 3500);
          this.logEvent(char.id, char.agentName, 'work', 'Gathered medicinal herbs by the blue pond.');
        });
      } else if (roll < 0.7) {
        const target = VILLAGE_LOCATIONS['emma_healer'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('work', 'Brewing herbal salves');
          this.logEvent(char.id, char.agentName, 'work', 'Mixed soothing salves in the apothecary.');
        });
      } else {
        const target = VILLAGE_LOCATIONS['town_square'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('help', 'Checking on villager health');
          char.say('Stay hydrated today, everyone!', 3500);
          this.logEvent(char.id, char.agentName, 'social', 'Offered healing remedies in the square.');
        });
      }
    } else if (char.id === 'leo') {
      if (roll < 0.45) {
        const target = VILLAGE_LOCATIONS['leo_workshop'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('work', 'Planing oak boards at workbench');
          char.say('Measure twice, cut once.', 3000);
          this.logEvent(char.id, char.agentName, 'work', 'Crafted timber beams for village repairs.');
        });
      } else if (roll < 0.75) {
        const target = VILLAGE_LOCATIONS['old_shed'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('work', 'Selecting dry lumber');
          this.logEvent(char.id, char.agentName, 'work', 'Fetched seasoned wood from storage shed.');
        });
      } else {
        const target = VILLAGE_LOCATIONS['alex_farm'];
        char.walkTo(target.x, target.y, () => {
          char.setAction('help', 'Inspecting farm barn door');
          char.say('Alex, that hinge on the barn needs greasing.', 3800);
          this.logEvent(char.id, char.agentName, 'help', 'Inspected structural integrity of the barn.');
        });
      }
    }
  }

  /**
   * Check if any two idle agents are close enough to start a dialogue exchange
   */
  private checkSocialEncounters() {
    const chars = Array.from(this.characters.values());
    const interactionDist = 38;

    for (let i = 0; i < chars.length; i++) {
      for (let j = i + 1; j < chars.length; j++) {
        const a = chars[i];
        const b = chars[j];

        // Do not interrupt if either villager is speaking or actively walking to a destination
        if (a.isSpeaking() || b.isSpeaking()) continue;
        if (a.isTraveling() || b.isTraveling()) continue;

        // Check social cooldowns to prevent repetitive loops
        const pairKey = [a.id, b.id].sort().join('_');
        const pairCooldown = this.socialCooldowns.get(pairKey) || 0;
        if (this.time.now < pairCooldown) continue;

        const agentCoolA = this.agentSocialCooldowns.get(a.id) || 0;
        const agentCoolB = this.agentSocialCooldowns.get(b.id) || 0;
        if (this.time.now < agentCoolA || this.time.now < agentCoolB) continue;

        const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);

        if (dist <= interactionDist) {
          // Orient towards each other
          if (a.x < b.x) {
            a.face('right');
            b.face('left');
          } else {
            a.face('left');
            b.face('right');
          }

          // Set 45s cooldown per pair and 25s per agent
          this.socialCooldowns.set(pairKey, this.time.now + 45000);
          this.agentSocialCooldowns.set(a.id, this.time.now + 25000);
          this.agentSocialCooldowns.set(b.id, this.time.now + 25000);

          // Trigger dialogue exchange
          this.triggerConversation(a, b);
          return;
        }
      }
    }
  }

  private triggerConversation(a: Character, b: Character) {
    const pairKey = [a.id, b.id].sort().join('_');
    const dialogues: Record<string, [string, string][]> = {
      alex_mia: [
        [
          'Hey Mia! How is the wheat flour holding up for baking?',
          'Alex! It makes the best crust. Bring me a sack when ready!',
        ],
        [
          'Morning Mia, the breeze smells sweet like fresh brioche.',
          'Fresh out of the oven! Stop by later for a crusty loaf.',
        ],
        [
          'Mia, the harvest is ripening fast. We will have grain for winter.',
          'That warms my heart, Alex! Good bread brings the village together.',
        ],
      ],
      alex_noah: [
        [
          'Noah, I need some iron nails to fix the cow pen.',
          'I have a box from the city. What can you offer in trade?',
        ],
        [
          'Good morning, Noah. Any word on the harvest prices at the capital?',
          'Grain demand is high this season, Alex. Your yield will fetch a fine price!',
        ],
      ],
      alex_emma: [
        [
          'Emma, my back aches after plowing the south furrow.',
          'Sit by the well, Alex. I have some soothing mint salve for you.',
        ],
        [
          'Good day Emma, finding any wild herbs near the south creek?',
          'Plenty of dandelion and feverfew, Alex. Nature is generous today.',
        ],
      ],
      alex_leo: [
        [
          'Leo, could you inspect the barn roof beam sometime?',
          'I will bring my adze and square this afternoon, Alex.',
        ],
        [
          'Leo, how is that oak timber holding up in the workshop?',
          'Solid as stone, Alex. Once seasoned, it will build sturdy fences.',
        ],
      ],
      mia_noah: [
        [
          'Noah, your prices on honey are getting a bit steep!',
          'Quality goods don’t come cheap, Mia, but for you, 10% off.',
        ],
        [
          'Noah, did the salt barrel arrive from the coast yet?',
          'Just rolled it in this morning, Mia! Ready whenever you are.',
        ],
      ],
      emma_mia: [
        [
          'Mia, your cinnamon rolls brightened everyone’s morning!',
          'Thank you, Emma! Food is the quickest path to a happy heart.',
        ],
        [
          'Mia, I brewed fresh chamomile tea if you need a break.',
          'Oh, that would be lovely! Let me dust the flour off first.',
        ],
      ],
      emma_leo: [
        [
          'Leo, don’t work so late in the cold shed without a coat.',
          'Just finishing this dovetail joint, Emma... but thank you.',
        ],
        [
          'Leo, mind your thumbs with the broadax today!',
          'Always careful, Emma! No splinters today, promise.',
        ],
      ],
      leo_noah: [
        [
          'Noah, did the new iron saw blades arrive with the caravan?',
          'Yes, Leo! Stored safely inside. Come take a look.',
        ],
        [
          'Noah, got any spare whetstones for my chisels?',
          'Top shelf, Leo. Straight from the river quarry.',
        ],
      ],
    };

    const options = dialogues[pairKey] || [
      [
        `Greetings, ${b.agentName}! Peaceful morning in the village.`,
        `Good to see you too, ${a.agentName}! Hope chores go smoothly.`,
      ],
      [
        `Fine weather today, ${b.agentName}.`,
        `Indeed it is, ${a.agentName}! The sun does wonders.`,
      ],
    ];

    const lastIdx = this.lastDialogueIndex.get(pairKey) ?? -1;
    const nextIdx = (lastIdx + 1) % options.length;
    this.lastDialogueIndex.set(pairKey, nextIdx);
    const dialog = options[nextIdx];

    a.setAction('talk', `Speaking with ${b.agentName}`);
    b.setAction('talk', `Speaking with ${a.agentName}`);

    // Turn-based dialogue: Person A speaks, then Person B responds
    a.say(dialog[0], 3500);
    this.time.delayedCall(3800, () => {
      b.say(dialog[1], 3500);
    });

    // Reset action back to idle after conversation completes
    this.time.delayedCall(7400, () => {
      if (a.stateData.currentAction === 'talk') {
        a.setAction('idle', 'Resting after chat');
      }
      if (b.stateData.currentAction === 'talk') {
        b.setAction('idle', 'Resting after chat');
      }
      this.broadcastAgentStates();
    });

    this.logEvent('social', `${a.agentName} & ${b.agentName}`, 'conversation', `"${dialog[0]}" — "${dialog[1]}"`);
  }

  private logEvent(agentId: string, agentName: string, type: string, description: string) {
    const hours = Math.floor(this.simTimeMinutes / 60).toString().padStart(2, '0');
    const mins = Math.floor(this.simTimeMinutes % 60).toString().padStart(2, '0');
    const timeStr = `${hours}:${mins}`;

    const event: SimulationEvent = {
      id: `${Date.now()}_${Math.random()}`,
      time: timeStr,
      agentId,
      agentName,
      type,
      description,
    };
    EventBus.emit('event-logged', event);
  }

  private broadcastWorldState() {
    const hours = Math.floor(this.simTimeMinutes / 60);
    const mins = Math.floor(this.simTimeMinutes % 60).toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = (hours % 12 === 0 ? 12 : hours % 12).toString().padStart(2, '0');
    const timeString = `${displayHour}:${mins} ${ampm}`;

    let period: 'Morning' | 'Afternoon' | 'Evening' | 'Night' = 'Morning';
    if (hours >= 12 && hours < 17) period = 'Afternoon';
    else if (hours >= 17 && hours < 21) period = 'Evening';
    else if (hours >= 21 || hours < 5) period = 'Night';

    EventBus.emit('world-updated', {
      day: this.day,
      timeString,
      period,
      weather: 'Sunny',
      isRunning: this.isSimulationRunning,
      speed: this.simulationSpeed,
    });
  }

  private broadcastAgentStates() {
    const states: AgentState[] = Array.from(this.characters.values()).map((c) => ({
      ...c.stateData,
      x: Math.round(c.x),
      y: Math.round(c.y),
    }));
    EventBus.emit('agents-updated', states);
  }
}
