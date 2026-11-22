import Phaser from 'phaser';
import type { ActionType, AgentPersonality, AgentState } from '../../types/simulation';
import { MovementSystem, type Point } from '../systems/MovementSystem';

export class Character extends Phaser.GameObjects.Container {
  public id: string;
  public agentName: string;
  public personality: AgentPersonality;
  public stateData: AgentState;

  // Visual sub-elements
  private sprite: Phaser.GameObjects.Sprite;
  private nameLabel: Phaser.GameObjects.Text;
  private nameBg: Phaser.GameObjects.Graphics;
  private actionIcon: Phaser.GameObjects.Text;
  private speechContainer: Phaser.GameObjects.Container;
  private speechBubble: Phaser.GameObjects.Graphics;
  private speechText: Phaser.GameObjects.Text;
  private selectionRing: Phaser.GameObjects.Graphics;

  // Movement & navigation
  private path: Point[] = [];
  private currentPathIndex = 0;
  private moveSpeed = 70; // pixels per second
  private isMoving = false;
  private currentDirection: 'down' | 'left' | 'right' | 'up' = 'down';
  private onReachCallback: (() => void) | null = null;
  private speechTimer?: Phaser.Time.TimerEvent;
  public isSelected = false;

  // Stuck detection & recovery
  private lastCheckX = 0;
  private lastCheckY = 0;
  private stuckTimer = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    personality: AgentPersonality,
    initialState?: Partial<AgentState>
  ) {
    super(scene, x, y);
    this.id = personality.id;
    this.agentName = personality.name;
    this.personality = personality;

    this.stateData = {
      id: personality.id,
      name: personality.name,
      occupation: personality.occupation,
      color: personality.color,
      energy: 100,
      happiness: 75,
      currentAction: 'idle',
      actionDetail: 'Observing the morning village',
      currentLocation: personality.homeLocation,
      targetLocation: null,
      x,
      y,
      inventory: { coins: 15, food: 3, wood: 1 },
      relationships: {},
      recentMemories: [`Arrived at ${personality.homeLocation}`],
      ...initialState,
    };

    // 1. Selection indicator ring under character's feet
    this.selectionRing = scene.add.graphics();
    this.selectionRing.lineStyle(2, 0x48bb78, 0.9);
    this.selectionRing.strokeEllipse(0, 16, 26, 12);
    this.selectionRing.setVisible(false);
    this.add(this.selectionRing);

    // 2. Character Sprite
    this.sprite = scene.add.sprite(0, 0, `char_${this.id}`);
    this.sprite.setOrigin(0.5, 0.75); // origin near feet
    this.sprite.setScale(0.85);
    this.add(this.sprite);

    // 3. Name pill background & text
    this.nameBg = scene.add.graphics();
    this.nameLabel = scene.add.text(0, 18, this.agentName, {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    this.nameLabel.setOrigin(0.5, 0.5);
    this.nameLabel.setResolution(3);

    this.drawNamePlate();
    this.add(this.nameBg);
    this.add(this.nameLabel);

    // 4. Activity status icon (e.g. 🌾, 💬, 🛒, 💤)
    this.actionIcon = scene.add.text(0, -36, '🌱', {
      fontSize: '13px',
    });
    this.actionIcon.setOrigin(0.5, 0.5);
    this.add(this.actionIcon);

    // 5. High-resolution Speech Bubble popup
    this.speechContainer = scene.add.container(0, 0);
    this.speechBubble = scene.add.graphics();
    this.speechText = scene.add.text(0, 0, '', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '12.5px',
      color: '#0f172a',
      fontStyle: '700',
      wordWrap: { width: 180 },
      align: 'center',
      lineSpacing: 3,
    });
    this.speechText.setOrigin(0.5, 0.5);
    this.speechText.setResolution(4); // 4x supersampled resolution
    this.speechText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR); // Smooth anti-aliased font

    this.speechContainer.add(this.speechBubble);
    this.speechContainer.add(this.speechText);
    this.speechContainer.setVisible(false);
    this.add(this.speechContainer);

    // Enable physics for this container
    scene.physics.world.enable(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 8);
    body.setOffset(-5, 12);
    body.setCollideWorldBounds(true);

    // Make interactive for mouse clicks
    this.setSize(32, 48);
    this.setInteractive(new Phaser.Geom.Rectangle(-16, -28, 32, 48), Phaser.Geom.Rectangle.Contains);

    this.updateActionDisplay();
    scene.add.existing(this);
  }

  private drawNamePlate() {
    this.nameLabel.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    const textWidth = this.nameLabel.width + 10;
    const textHeight = 14;
    this.nameBg.clear();
    this.nameBg.fillStyle(0x1a202c, 0.75);
    this.nameBg.fillRoundedRect(-textWidth / 2, 11, textWidth, textHeight, 4);
    this.nameBg.lineStyle(1, Phaser.Display.Color.HexStringToColor(this.personality.color).color, 0.9);
    this.nameBg.strokeRoundedRect(-textWidth / 2, 11, textWidth, textHeight, 4);
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.selectionRing.setVisible(selected);
  }

  public setAction(action: ActionType, detail: string) {
    this.stateData.currentAction = action;
    this.stateData.actionDetail = detail;
    this.updateActionDisplay();
  }

  public updateActionDisplay() {
    const iconMap: Record<ActionType, string> = {
      idle: '👀',
      move: '🚶',
      work: this.getWorkIcon(),
      talk: '💬',
      trade: '⚖️',
      help: '🤝',
      rest: '💤',
    };
    this.actionIcon.setText(iconMap[this.stateData.currentAction] || '✨');
  }

  private getWorkIcon(): string {
    switch (this.id) {
      case 'alex':
        return '🌾';
      case 'mia':
        return '🥖';
      case 'noah':
        return '🛒';
      case 'emma':
        return '🌿';
      case 'leo':
        return '🔨';
      default:
        return '💼';
    }
  }

  public say(text: string, durationMs: number = 4000) {
    this.speechText.setText(text);
    if (this.speechText.texture) {
      this.speechText.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }

    // Dynamic zoom-adaptive scale compensation:
    // When camera is zoomed out, scale bubble up so text remains easily readable!
    const cameraZoom = this.scene.cameras.main.zoom;
    const invScale = Math.max(1.0, 1.35 / Math.max(0.6, cameraZoom));
    this.speechContainer.setScale(invScale);

    // Accurate local text dimensions
    const textW = this.speechText.width;
    const textH = this.speechText.height;
    const padX = 14;
    const padY = 9;
    const w = Math.max(textW + padX * 2, 80);
    const h = Math.max(textH + padY * 2, 30);
    const bubbleY = -44; // Positioned cleanly above character head

    this.speechBubble.clear();

    // Subtle dark drop shadow
    this.speechBubble.fillStyle(0x000000, 0.28);
    this.speechBubble.fillRoundedRect(-w / 2 + 2, bubbleY - h + 2, w, h, 6);

    // Clean white speech bubble
    this.speechBubble.fillStyle(0xffffff, 0.99);
    this.speechBubble.lineStyle(1.8, 0x0f172a, 1);
    this.speechBubble.fillRoundedRect(-w / 2, bubbleY - h, w, h, 6);
    this.speechBubble.strokeRoundedRect(-w / 2, bubbleY - h, w, h, 6);

    // Pointer tail pointing down to character's head
    this.speechBubble.fillStyle(0xffffff, 0.99);
    this.speechBubble.fillTriangle(-6, bubbleY, 6, bubbleY, 0, bubbleY + 6);
    this.speechBubble.lineStyle(1.8, 0x0f172a, 1);
    this.speechBubble.lineBetween(-6, bubbleY, 0, bubbleY + 6);
    this.speechBubble.lineBetween(6, bubbleY, 0, bubbleY + 6);

    // Center text perfectly inside the bubble
    this.speechText.setPosition(0, bubbleY - h / 2);
    this.speechContainer.setVisible(true);

    // Elevate depth so speech is in front of everything
    this.setDepth(10000 + Math.round(this.y));

    if (this.speechTimer) {
      this.speechTimer.remove();
    }
    this.speechTimer = this.scene.time.delayedCall(durationMs, () => {
      this.speechContainer.setVisible(false);
      this.setDepth(Math.round(this.y));
    });
  }

  public isSpeaking(): boolean {
    return this.speechContainer.visible;
  }

  public isTraveling(): boolean {
    return this.isMoving;
  }

  public walkTo(targetX: number, targetY: number, onReach?: () => void) {
    this.path = MovementSystem.findPath(this.x, this.y, targetX, targetY);
    this.currentPathIndex = 0;
    this.onReachCallback = onReach || null;
    this.isMoving = true;
    this.stuckTimer = 0;
    this.lastCheckX = this.x;
    this.lastCheckY = this.y;
    this.setAction('move', `Heading to destination`);
  }

  public face(direction: 'down' | 'left' | 'right' | 'up') {
    this.currentDirection = direction;
    this.sprite.play(`idle_${this.id}_${direction}`, true);
  }

  public update(time: number, delta: number) {
    super.update(time, delta);
    this.stateData.x = Math.round(this.x);
    this.stateData.y = Math.round(this.y);

    // Natural depth sorting unless speaking; keep scale invariant to camera zoom
    if (this.speechContainer.visible) {
      const cameraZoom = this.scene.cameras.main.zoom;
      const invScale = Math.max(1.0, 1.35 / Math.max(0.6, cameraZoom));
      this.speechContainer.setScale(invScale);
    } else {
      this.setDepth(Math.round(this.y));
    }

    if (!this.isMoving || this.path.length === 0) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      if (body) body.setVelocity(0, 0);
      return;
    }

    const targetPoint = this.path[this.currentPathIndex];
    if (!targetPoint) {
      this.finishMovement();
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetPoint.x, targetPoint.y);

    const isFinal = this.currentPathIndex === this.path.length - 1;
    const threshold = isFinal ? 8 : 12;

    if (dist < threshold) {
      // Reached current waypoint
      this.stuckTimer = 0;
      this.currentPathIndex++;
      if (this.currentPathIndex >= this.path.length) {
        this.finishMovement();
        return;
      }
    }

    // Stuck detection & recovery:
    // If agent has moved less than 2 pixels over 1.2 seconds while traveling, auto-recover!
    const moved = Phaser.Math.Distance.Between(this.x, this.y, this.lastCheckX, this.lastCheckY);
    if (moved < 2.0) {
      this.stuckTimer += delta;
      if (this.stuckTimer > 1200) {
        this.stuckTimer = 0;
        if (this.currentPathIndex < this.path.length - 1) {
          // Skip past the blocked waypoint
          this.currentPathIndex++;
        } else {
          // At final destination waypoint: finish movement cleanly
          this.setPosition(targetPoint.x, targetPoint.y);
          this.finishMovement();
          return;
        }
      }
    } else {
      this.stuckTimer = 0;
      this.lastCheckX = this.x;
      this.lastCheckY = this.y;
    }

    // Move towards current waypoint
    const nextTarget = this.path[this.currentPathIndex];
    const angle = Phaser.Math.Angle.Between(this.x, this.y, nextTarget.x, nextTarget.y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = this.moveSpeed;

    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    body.setVelocity(vx, vy);

    // Direction calculation
    if (Math.abs(vx) > Math.abs(vy)) {
      if (vx > 0) {
        this.currentDirection = 'right';
      } else {
        this.currentDirection = 'left';
      }
    } else {
      if (vy > 0) {
        this.currentDirection = 'down';
      } else {
        this.currentDirection = 'up';
      }
    }

    this.sprite.play(`walk_${this.id}_${this.currentDirection}`, true);
  }

  private finishMovement() {
    this.isMoving = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);

    this.face(this.currentDirection);
    this.setAction('idle', 'Standing and resting');

    if (this.onReachCallback) {
      const cb = this.onReachCallback;
      this.onReachCallback = null;
      cb();
    }
  }
}
