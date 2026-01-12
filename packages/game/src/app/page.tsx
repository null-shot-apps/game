'use client';

import { useState, useEffect, useRef } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type GameState = 'intro' | 'character-creation' | 'playing' | 'combat' | 'dialogue' | 'game-over' | 'victory';
type Path = 'virtue' | 'luck' | null;
type Location = 'britain' | 'thieves-den' | 'forest' | 'dungeon' | 'castle' | 'port' | 'mountains' | 'shrine';
type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

interface Stats {
  virtue: number;
  luck: number;
  steam: number;
  gold: number;
  reputation: number;
  health: number;
  maxHealth: number;
  level: number;
  experience: number;
  experienceToNext: number;
}

interface Item {
  id: string;
  name: string;
  price: number;
  description: string;
  type: 'weapon' | 'armor' | 'tool' | 'consumable' | 'quest';
  effect?: {
    luck?: number;
    virtue?: number;
    steam?: number;
    health?: number;
    damage?: number;
    defense?: number;
  };
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side';
  chapter: number;
  completed: boolean;
  objectives: QuestObjective[];
  rewards: {
    gold?: number;
    experience?: number;
    virtue?: number;
    luck?: number;
    item?: Item;
  };
}

interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
}

interface NPC {
  id: string;
  name: string;
  location: Location;
  dialogue: DialogueNode[];
  questGiver?: boolean;
}

interface DialogueNode {
  id: string;
  text: string;
  options: DialogueOption[];
}

interface DialogueOption {
  text: string;
  nextNodeId?: string;
  action?: () => void;
  requirement?: {
    virtue?: number;
    luck?: number;
    gold?: number;
  };
}

interface Enemy {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  goldReward: number;
  experienceReward: number;
}

// ============================================================================
// GAME DATA
// ============================================================================

const ITEMS: Item[] = [
  // Thieves' Guild Items
  { id: 'lockpick', name: 'Lockpick Set', price: 30, type: 'tool', description: 'Essential tools for any aspiring thief', effect: { luck: 2 } },
  { id: 'cloak', name: 'Shadow Cloak', price: 75, type: 'armor', description: 'Blend into darkness', effect: { luck: 5, steam: 1, defense: 2 } },
  { id: 'dice', name: 'Loaded Dice', price: 20, type: 'tool', description: 'Fortune favors the prepared', effect: { luck: 3 } },
  { id: 'dagger', name: 'Thief\'s Dagger', price: 50, type: 'weapon', description: 'Quick and silent', effect: { damage: 5, luck: 1 } },
  
  // Virtue Items
  { id: 'sword', name: 'Knight\'s Sword', price: 100, type: 'weapon', description: 'A blade of honor', effect: { damage: 8, virtue: 2 } },
  { id: 'shield', name: 'Guardian Shield', price: 80, type: 'armor', description: 'Protects the righteous', effect: { defense: 5, virtue: 1 } },
  { id: 'amulet', name: 'Virtue Amulet', price: 60, type: 'tool', description: 'Blessed by the temples', effect: { virtue: 5 } },
  
  // Consumables
  { id: 'potion', name: 'Health Potion', price: 25, type: 'consumable', description: 'Restores 50 health', effect: { health: 50 } },
  { id: 'elixir', name: 'Lucky Elixir', price: 40, type: 'consumable', description: 'Temporarily boosts luck', effect: { luck: 5 } },
];

const INITIAL_QUESTS: Quest[] = [
  {
    id: 'main-1',
    title: 'The First Choice',
    description: 'Decide your path in Britannia',
    type: 'main',
    chapter: 1,
    completed: false,
    objectives: [
      { id: 'choose-path', description: 'Choose between Virtue and Luck', completed: false }
    ],
    rewards: { experience: 50 }
  },
  {
    id: 'main-2-virtue',
    title: 'The Merchant\'s Plea',
    description: 'Help the struggling merchant in Britain',
    type: 'main',
    chapter: 2,
    completed: false,
    objectives: [
      { id: 'help-merchant', description: 'Assist the merchant with his cart', completed: false }
    ],
    rewards: { gold: 50, experience: 100, virtue: 5 }
  },
  {
    id: 'main-2-luck',
    title: 'First Blood',
    description: 'Complete your first heist for the Thieves\' Guild',
    type: 'main',
    chapter: 2,
    completed: false,
    objectives: [
      { id: 'first-heist', description: 'Successfully rob the merchant\'s stall', completed: false }
    ],
    rewards: { gold: 100, experience: 100, luck: 5 }
  },
];

// ============================================================================
// PIXEL ART RENDERER
// ============================================================================

const PixelCanvas = ({ scene, timeOfDay }: { scene: Location; timeOfDay: TimeOfDay }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set pixel art rendering
    ctx.imageSmoothingEnabled = false;

    // Color palettes (C64/Amiga inspired)
    const palettes = {
      dawn: { sky: '#8B4789', ground: '#4A3B5C', accent: '#D4A574' },
      day: { sky: '#5DADE2', ground: '#52B788', accent: '#F4D03F' },
      dusk: { sky: '#E67E22', ground: '#6C5B7B', accent: '#F39C12' },
      night: { sky: '#1C2833', ground: '#2C3E50', accent: '#85929E' }
    };

    const palette = palettes[timeOfDay];

    // Clear canvas
    ctx.fillStyle = palette.sky;
    ctx.fillRect(0, 0, 320, 200);

    // Draw scene based on location
    switch (scene) {
      case 'britain':
        drawBritain(ctx, palette);
        break;
      case 'thieves-den':
        drawThievesDen(ctx, palette);
        break;
      case 'forest':
        drawForest(ctx, palette);
        break;
      case 'dungeon':
        drawDungeon(ctx, palette);
        break;
      case 'castle':
        drawCastle(ctx, palette);
        break;
      case 'port':
        drawPort(ctx, palette);
        break;
      case 'mountains':
        drawMountains(ctx, palette);
        break;
      case 'shrine':
        drawShrine(ctx, palette);
        break;
    }
  }, [scene, timeOfDay]);

  // Drawing functions for each location
  const drawBritain = (ctx: CanvasRenderingContext2D, palette: any) => {
    // Ground
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, 140, 320, 60);

    // Buildings
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(20, 80, 60, 60);
    ctx.fillRect(100, 90, 50, 50);
    ctx.fillRect(200, 70, 70, 70);

    // Windows
    ctx.fillStyle = palette.accent;
    ctx.fillRect(30, 95, 15, 15);
    ctx.fillRect(55, 95, 15, 15);
    ctx.fillRect(110, 105, 12, 12);
    ctx.fillRect(128, 105, 12, 12);

    // Town square fountain
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(140, 150, 40, 20);
    ctx.fillStyle = '#3498DB';
    ctx.fillRect(145, 155, 30, 10);

    // People (simple sprites)
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(90, 155, 8, 12);
    ctx.fillStyle = '#3498DB';
    ctx.fillRect(180, 158, 8, 12);
  };

  const drawThievesDen = (ctx: CanvasRenderingContext2D, palette: any) => {
    // Dark underground
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(0, 0, 320, 200);

    // Stone walls
    ctx.fillStyle = '#4A4A4A';
    for (let i = 0; i < 320; i += 20) {
      ctx.fillRect(i, 0, 18, 200);
    }

    // Torches
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(50, 40, 8, 30);
    ctx.fillRect(250, 40, 8, 30);
    
    ctx.fillStyle = '#E67E22';
    ctx.fillRect(48, 35, 12, 10);
    ctx.fillRect(248, 35, 12, 10);

    // Table with goods
    ctx.fillStyle = '#654321';
    ctx.fillRect(120, 120, 80, 40);
    
    // Mysterious figures
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(40, 140, 12, 20);
    ctx.fillRect(270, 135, 12, 20);
    
    // Hooded cloaks
    ctx.fillStyle = '#1C2833';
    ctx.fillRect(38, 138, 16, 8);
    ctx.fillRect(268, 133, 16, 8);
  };

  const drawForest = (ctx: CanvasRenderingContext2D, palette: any) => {
    // Ground
    ctx.fillStyle = '#2D5016';
    ctx.fillRect(0, 140, 320, 60);

    // Trees
    for (let i = 0; i < 10; i++) {
      const x = i * 35 + (i % 2) * 15;
      const y = 60 + (i % 3) * 20;
      
      // Trunk
      ctx.fillStyle = '#654321';
      ctx.fillRect(x, y, 12, 80);
      
      // Foliage
      ctx.fillStyle = '#228B22';
      ctx.fillRect(x - 15, y - 20, 42, 40);
      ctx.fillRect(x - 10, y - 35, 32, 25);
    }

    // Path
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(130, 140, 60, 60);
  };

  const drawDungeon = (ctx: CanvasRenderingContext2D, palette: any) => {
    // Dark stone
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(0, 0, 320, 200);

    // Stone blocks
    ctx.fillStyle = '#3E3E3E';
    for (let y = 0; y < 200; y += 20) {
      for (let x = 0; x < 320; x += 40) {
        ctx.fillRect(x, y, 38, 18);
      }
    }

    // Corridor
    ctx.fillStyle = '#1C1C1C';
    ctx.fillRect(100, 0, 120, 200);

    // Torches
    ctx.fillStyle = '#E67E22';
    ctx.fillRect(105, 50, 8, 8);
    ctx.fillRect(207, 50, 8, 8);
    ctx.fillRect(105, 140, 8, 8);
    ctx.fillRect(207, 140, 8, 8);
  };

  const drawCastle = (ctx: CanvasRenderingContext2D, palette: any) => {
    // Ground
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, 140, 320, 60);

    // Castle walls
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(60, 40, 200, 100);

    // Towers
    ctx.fillRect(50, 20, 30, 120);
    ctx.fillRect(240, 20, 30, 120);

    // Tower tops
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(45, 10, 40, 15);
    ctx.fillRect(235, 10, 40, 15);

    // Gate
    ctx.fillStyle = '#654321';
    ctx.fillRect(140, 90, 40, 50);

    // Windows
    ctx.fillStyle = '#34495E';
    ctx.fillRect(100, 60, 15, 20);
    ctx.fillRect(205, 60, 15, 20);
    ctx.fillRect(160, 50, 10, 15);
  };

  const drawPort = (ctx: CanvasRenderingContext2D, palette: any) => {
    // Water
    ctx.fillStyle = '#2980B9';
    ctx.fillRect(0, 100, 320, 100);

    // Waves
    ctx.fillStyle = '#3498DB';
    for (let i = 0; i < 320; i += 30) {
      ctx.fillRect(i, 110 + Math.sin(i) * 5, 20, 3);
    }

    // Dock
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 90, 320, 15);
    ctx.fillRect(50, 90, 8, 60);
    ctx.fillRect(150, 90, 8, 60);
    ctx.fillRect(250, 90, 8, 60);

    // Ship
    ctx.fillStyle = '#654321';
    ctx.fillRect(200, 120, 80, 40);
    ctx.fillRect(230, 80, 8, 40);
    
    // Sail
    ctx.fillStyle = '#ECF0F1';
    ctx.fillRect(220, 85, 30, 35);
  };

  const drawMountains = (ctx: CanvasRenderingContext2D, palette: any) => {
    // Sky gradient
    ctx.fillStyle = palette.sky;
    ctx.fillRect(0, 0, 320, 200);

    // Mountains
    ctx.fillStyle = '#5D6D7E';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(80, 80);
    ctx.lineTo(160, 200);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(100, 200);
    ctx.lineTo(160, 60);
    ctx.lineTo(220, 200);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(180, 200);
    ctx.lineTo(260, 100);
    ctx.lineTo(320, 200);
    ctx.fill();

    // Snow caps
    ctx.fillStyle = '#ECF0F1';
    ctx.beginPath();
    ctx.moveTo(150, 70);
    ctx.lineTo(160, 60);
    ctx.lineTo(170, 70);
    ctx.fill();
  };

  const drawShrine = (ctx: CanvasRenderingContext2D, palette: any) => {
    // Ground
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, 140, 320, 60);

    // Shrine building
    ctx.fillStyle = '#BDC3C7';
    ctx.fillRect(100, 60, 120, 80);

    // Roof
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.moveTo(80, 60);
    ctx.lineTo(160, 30);
    ctx.lineTo(240, 60);
    ctx.fill();

    // Pillars
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(110, 80, 12, 60);
    ctx.fillRect(198, 80, 12, 60);

    // Altar
    ctx.fillStyle = '#7F8C8D';
    ctx.fillRect(140, 120, 40, 20);

    // Candles
    ctx.fillStyle = '#F39C12';
    ctx.fillRect(145, 115, 4, 8);
    ctx.fillRect(171, 115, 4, 8);
  };

  return (
    <div className="flex justify-center items-center bg-black p-4 rounded-lg border-4 border-amber-900">
      <canvas
        ref={canvasRef}
        width={320}
        height={200}
        className="image-rendering-pixelated"
        style={{ 
          width: '640px', 
          height: '400px',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
};

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

export default function BritanniaRPG() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [playerPath, setPlayerPath] = useState<Path>(null);
  const [playerName, setPlayerName] = useState('');
  const [location, setLocation] = useState<Location>('britain');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [chapter, setChapter] = useState(1);
  
  const [stats, setStats] = useState<Stats>({
    virtue: 0,
    luck: 0,
    steam: 0,
    gold: 50,
    reputation: 0,
    health: 100,
    maxHealth: 100,
    level: 1,
    experience: 0,
    experienceToNext: 100,
  });

  // Time progression
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setTimeOfDay(prev => {
        const cycle: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
        const currentIndex = cycle.indexOf(prev);
        return cycle[(currentIndex + 1) % cycle.length];
      });
    }, 60000); // Change every minute

    return () => clearInterval(timeInterval);
  }, []);

  // Level up system
  useEffect(() => {
    if (stats.experience >= stats.experienceToNext) {
      setStats(prev => ({
        ...prev,
        level: prev.level + 1,
        experience: prev.experience - prev.experienceToNext,
        experienceToNext: Math.floor(prev.experienceToNext * 1.5),
        maxHealth: prev.maxHealth + 20,
        health: prev.maxHealth + 20,
      }));
      setMessage(`🎉 Level Up! You are now level ${stats.level + 1}!`);
    }
  }, [stats.experience]);

  // ============================================================================
  // GAME ACTIONS
  // ============================================================================

  const startGame = () => {
    setGameState('character-creation');
  };

  const choosePath = (path: Path) => {
    setPlayerPath(path);
    setLocation(path === 'virtue' ? 'britain' : 'thieves-den');
    setGameState('playing');
    
    // Complete first quest
    completeQuestObjective('main-1', 'choose-path');
  };

  const completeQuestObjective = (questId: string, objectiveId: string) => {
    setQuests(prev => prev.map(quest => {
      if (quest.id === questId) {
        const updatedObjectives = quest.objectives.map(obj =>
          obj.id === objectiveId ? { ...obj, completed: true } : obj
        );
        const allCompleted = updatedObjectives.every(obj => obj.completed);
        
        if (allCompleted && !quest.completed) {
          // Award rewards
          if (quest.rewards.gold) {
            setStats(s => ({ ...s, gold: s.gold + quest.rewards.gold! }));
          }
          if (quest.rewards.experience) {
            setStats(s => ({ ...s, experience: s.experience + quest.rewards.experience! }));
          }
          if (quest.rewards.virtue) {
            setStats(s => ({ ...s, virtue: s.virtue + quest.rewards.virtue! }));
          }
          if (quest.rewards.luck) {
            setStats(s => ({ ...s, luck: s.luck + quest.rewards.luck! }));
          }
          
          setMessage(`✅ Quest Complete: ${quest.title}`);
        }
        
        return {
          ...quest,
          objectives: updatedObjectives,
          completed: allCompleted
        };
      }
      return quest;
    }));
  };

  const travel = (newLocation: Location) => {
    setLocation(newLocation);
    setMessage(`You travel to ${newLocation}...`);
    
    // Random encounter chance
    if (Math.random() < 0.3) {
      triggerRandomEncounter();
    }
  };

  const triggerRandomEncounter = () => {
    const enemies: Enemy[] = [
      { id: 'bandit', name: 'Bandit', health: 50, maxHealth: 50, damage: 10, defense: 2, goldReward: 30, experienceReward: 25 },
      { id: 'wolf', name: 'Wolf', health: 40, maxHealth: 40, damage: 12, defense: 1, goldReward: 15, experienceReward: 20 },
      { id: 'guard', name: 'Guard', health: 70, maxHealth: 70, damage: 15, defense: 5, goldReward: 50, experienceReward: 40 },
    ];
    
    const enemy = enemies[Math.floor(Math.random() * enemies.length)];
    setCurrentEnemy(enemy);
    setGameState('combat');
  };

  const attack = () => {
    if (!currentEnemy) return;

    // Player attacks
    const playerDamage = Math.max(10 + (stats.luck * 2) - currentEnemy.defense, 1);
    const newEnemyHealth = currentEnemy.health - playerDamage;

    if (newEnemyHealth <= 0) {
      // Victory
      setStats(prev => ({
        ...prev,
        gold: prev.gold + currentEnemy.goldReward,
        experience: prev.experience + currentEnemy.experienceReward,
      }));
      setMessage(`Victory! Gained ${currentEnemy.goldReward} gold and ${currentEnemy.experienceReward} XP!`);
      setCurrentEnemy(null);
      setGameState('playing');
      return;
    }

    // Enemy attacks
    const enemyDamage = Math.max(currentEnemy.damage - Math.floor(stats.virtue / 2), 1);
    const newPlayerHealth = stats.health - enemyDamage;

    if (newPlayerHealth <= 0) {
      setGameState('game-over');
      return;
    }

    setCurrentEnemy({ ...currentEnemy, health: newEnemyHealth });
    setStats(prev => ({ ...prev, health: newPlayerHealth }));
    setMessage(`You deal ${playerDamage} damage! Enemy deals ${enemyDamage} damage!`);
  };

  const flee = () => {
    const fleeChance = 50 + (stats.luck * 3);
    if (Math.random() * 100 < fleeChance) {
      setMessage('You successfully fled!');
      setCurrentEnemy(null);
      setGameState('playing');
    } else {
      const enemyDamage = currentEnemy ? Math.max(currentEnemy.damage - Math.floor(stats.virtue / 2), 1) : 0;
      setStats(prev => ({ ...prev, health: Math.max(prev.health - enemyDamage, 0) }));
      setMessage('Failed to flee! Enemy attacks!');
    }
  };

  const rest = () => {
    setStats(prev => ({
      ...prev,
      health: Math.min(prev.health + 30, prev.maxHealth)
    }));
    setMessage('You rest and recover 30 health.');
  };

  const buyItem = (item: Item) => {
    if (stats.gold >= item.price) {
      setStats(prev => ({
        ...prev,
        gold: prev.gold - item.price,
        luck: prev.luck + (item.effect?.luck || 0),
        virtue: prev.virtue + (item.effect?.virtue || 0),
        steam: prev.steam + (item.effect?.steam || 0),
      }));
      setInventory(prev => [...prev, item]);
      setMessage(`Acquired ${item.name}!`);
    } else {
      setMessage('Not enough gold!');
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-center mb-8 text-amber-400 font-mono">
            BRITANNIA
          </h1>
          <div className="bg-black/60 backdrop-blur-sm border-4 border-amber-900 rounded-lg p-8 mb-8 font-mono">
            <p className="text-xl leading-relaxed mb-6">
              In a land ruled not only by virtue, but by chance and cunning, Britannia stands at a crossroads.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              You are summoned not as a hero crowned by destiny, but as a wanderer shaped by choice. 
              The <span className="text-blue-400 font-semibold">Eight Virtues</span> still guide the righteous — 
              Honesty, Compassion, Valor, Justice, Sacrifice, Honor, Spirituality, and Humility — yet in the shadows, another path has emerged.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Beneath the cities and castles lies the <span className="text-purple-400 font-semibold">Thieves' Guild</span>, 
              a secretive network of cutpurses, smugglers, and masterminds who believe that fortune favors the bold. 
              Through clever thefts, daring gambits, and calculated risks, you may build <span className="text-green-400 font-semibold">Luck</span> — 
              an unseen force that bends fate itself.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              As your Luck grows, chance encounters turn favorable, guards look the other way, locks weaken, and fortunes multiply. 
              Success breeds momentum — <span className="text-orange-400 font-semibold">Steam</span> — allowing a skilled rogue to rise 
              from gutter thief to legendary shadow lord, outwitting dragons, kings, and even the Virtues themselves.
            </p>
            <p className="text-xl leading-relaxed text-amber-300">
              The world reacts to your path. Cities whisper your name. The righteous may shun you, while the desperate seek your aid. 
              In Britannia, victory is no longer reserved for the pure of heart — but also for those clever enough to steal it.
            </p>
          </div>
          <button
            onClick={startGame}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors font-mono border-4 border-amber-900"
          >
            &gt; BEGIN YOUR JOURNEY
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'character-creation') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8 text-amber-400 font-mono">
            CHOOSE YOUR PATH
          </h1>
          
          <div className="mb-8">
            <label className="block text-xl mb-3 font-mono">ENTER THY NAME:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="..."
              className="w-full bg-black/60 border-4 border-amber-900 rounded-lg px-4 py-3 text-lg text-amber-400 placeholder-gray-600 font-mono"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-black/60 backdrop-blur-sm border-4 border-blue-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <h2 className="text-3xl font-bold mb-4 text-blue-400 font-mono">PATH OF VIRTUE</h2>
              <p className="mb-4 text-gray-300 font-mono text-sm">
                Walk the righteous path of the Eight Virtues. Earn honor through noble deeds, 
                help the innocent, and become a beacon of hope in Britannia.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-gray-400 font-mono">
                <li>+ Gain Virtue through honorable actions</li>
                <li>+ Respected by guards and nobility</li>
                <li>+ Access to temples and sacred quests</li>
                <li>- Harder to gain wealth quickly</li>
              </ul>
              <button
                onClick={() => choosePath('virtue')}
                disabled={!playerName}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors font-mono border-2 border-blue-900"
              >
                &gt; CHOOSE VIRTUE
              </button>
            </div>

            <div className="bg-black/60 backdrop-blur-sm border-4 border-purple-700 rounded-lg p-6 hover:border-purple-500 transition-colors">
              <h2 className="text-3xl font-bold mb-4 text-purple-400 font-mono">PATH OF LUCK</h2>
              <p className="mb-4 text-gray-300 font-mono text-sm">
                Join the Thieves' Guild and master the art of fortune. Build Luck through cunning, 
                risk, and daring heists. Let chance be your weapon.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-gray-400 font-mono">
                <li>+ Gain Luck through successful thefts</li>
                <li>+ Build Steam for powerful momentum</li>
                <li>+ Access to black markets and heists</li>
                <li>- Risk of capture and reputation loss</li>
              </ul>
              <button
                onClick={() => choosePath('luck')}
                disabled={!playerName}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors font-mono border-2 border-purple-900"
              >
                &gt; CHOOSE LUCK
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'combat') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950 via-slate-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-red-400 font-mono">
            ⚔️ COMBAT ⚔️
          </h1>

          {currentEnemy && (
            <div className="bg-black/60 border-4 border-red-900 rounded-lg p-6 mb-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-red-400 font-mono mb-2">{currentEnemy.name}</h2>
                <div className="flex justify-center items-center gap-4">
                  <div>
                    <div className="text-sm text-gray-400 font-mono">HEALTH</div>
                    <div className="text-2xl font-bold text-red-400 font-mono">
                      {currentEnemy.health}/{currentEnemy.maxHealth}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 font-mono">DAMAGE</div>
                    <div className="text-2xl font-bold text-orange-400 font-mono">{currentEnemy.damage}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 font-mono">DEFENSE</div>
                    <div className="text-2xl font-bold text-blue-400 font-mono">{currentEnemy.defense}</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/30 rounded-lg p-4 mb-4">
                <div className="h-4 bg-black rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${(currentEnemy.health / currentEnemy.maxHealth) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-xl font-bold text-green-400 font-mono mb-2">YOUR HEALTH</div>
                <div className="text-3xl font-bold text-green-400 font-mono mb-2">
                  {stats.health}/{stats.maxHealth}
                </div>
                <div className="bg-green-900/30 rounded-lg p-4">
                  <div className="h-4 bg-black rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div className="bg-amber-900/40 border-2 border-amber-600 rounded-lg p-4 mb-4 font-mono text-center">
                  {message}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={attack}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-lg transition-colors font-mono border-2 border-red-900"
                >
                  ⚔️ ATTACK
                </button>
                <button
                  onClick={flee}
                  className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-colors font-mono border-2 border-gray-900"
                >
                  🏃 FLEE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'game-over') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-950 via-black to-black text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-8 text-red-500 font-mono">GAME OVER</h1>
          <p className="text-2xl mb-8 font-mono">Your journey ends here...</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors font-mono border-4 border-red-900"
          >
            &gt; TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // Main playing state
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-black/60 backdrop-blur-sm border-4 border-amber-900 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-amber-400 font-mono">{playerName}</h1>
              <div className="text-sm text-gray-400 font-mono">
                Level {stats.level} • Chapter {chapter} • {timeOfDay.toUpperCase()}
              </div>
            </div>
            <div className="text-2xl text-yellow-400 font-mono">💰 {stats.gold}g</div>
          </div>
          
          <div className="grid grid-cols-6 gap-2">
            <div className="bg-red-900/30 rounded p-2 border-2 border-red-700">
              <div className="text-xs text-gray-400 font-mono">HP</div>
              <div className="text-lg font-bold text-red-400 font-mono">{stats.health}/{stats.maxHealth}</div>
            </div>
            <div className="bg-blue-900/30 rounded p-2 border-2 border-blue-700">
              <div className="text-xs text-gray-400 font-mono">VIRTUE</div>
              <div className="text-lg font-bold text-blue-400 font-mono">{stats.virtue}</div>
            </div>
            <div className="bg-purple-900/30 rounded p-2 border-2 border-purple-700">
              <div className="text-xs text-gray-400 font-mono">LUCK</div>
              <div className="text-lg font-bold text-purple-400 font-mono">{stats.luck}</div>
            </div>
            <div className="bg-orange-900/30 rounded p-2 border-2 border-orange-700">
              <div className="text-xs text-gray-400 font-mono">STEAM</div>
              <div className="text-lg font-bold text-orange-400 font-mono">{stats.steam}</div>
            </div>
            <div className={`rounded p-2 border-2 ${stats.reputation >= 0 ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
              <div className="text-xs text-gray-400 font-mono">REP</div>
              <div className={`text-lg font-bold font-mono ${stats.reputation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.reputation > 0 ? '+' : ''}{stats.reputation}
              </div>
            </div>
            <div className="bg-yellow-900/30 rounded p-2 border-2 border-yellow-700">
              <div className="text-xs text-gray-400 font-mono">XP</div>
              <div className="text-lg font-bold text-yellow-400 font-mono">{stats.experience}/{stats.experienceToNext}</div>
            </div>
          </div>
        </div>

        {/* Pixel Art Scene */}
        <div className="mb-4">
          <PixelCanvas scene={location} timeOfDay={timeOfDay} />
        </div>

        {/* Message */}
        {message && (
          <div className="bg-amber-900/60 border-4 border-amber-600 rounded-lg p-4 mb-4 font-mono">
            <p className="text-amber-100">{message}</p>
            <button
              onClick={() => setMessage('')}
              className="mt-2 text-sm text-amber-400 hover:text-amber-300 font-mono"
            >
              &gt; DISMISS
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Actions */}
          <div className="bg-black/60 backdrop-blur-sm border-4 border-amber-900 rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-amber-400 font-mono">ACTIONS</h3>
            <div className="space-y-2">
              <button 
                onClick={() => travel('britain')}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left font-mono border-2 border-blue-900"
              >
                &gt; Britain Town
              </button>
              <button 
                onClick={() => travel('thieves-den')}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left font-mono border-2 border-purple-900"
              >
                &gt; Thieves' Den
              </button>
              <button 
                onClick={() => travel('forest')}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left font-mono border-2 border-green-900"
              >
                &gt; Dark Forest
              </button>
              <button 
                onClick={() => travel('dungeon')}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left font-mono border-2 border-gray-900"
              >
                &gt; Dungeon
              </button>
              <button 
                onClick={() => travel('castle')}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left font-mono border-2 border-red-900"
              >
                &gt; Castle
              </button>
              <button 
                onClick={rest}
                className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors text-left font-mono border-2 border-green-900"
              >
                &gt; Rest (+30 HP)
              </button>
            </div>
          </div>

          {/* Quests */}
          <div className="bg-black/60 backdrop-blur-sm border-4 border-amber-900 rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-amber-400 font-mono">QUESTS</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {quests.filter(q => !q.completed).map(quest => (
                <div key={quest.id} className="bg-purple-900/20 border-2 border-purple-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-purple-300 font-mono text-sm">{quest.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded font-mono ${quest.type === 'main' ? 'bg-red-900 text-red-300' : 'bg-blue-900 text-blue-300'}`}>
                      {quest.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 font-mono">{quest.description}</p>
                  {quest.objectives.map(obj => (
                    <div key={obj.id} className="text-xs font-mono">
                      <span className={obj.completed ? 'text-green-400' : 'text-gray-500'}>
                        {obj.completed ? '✓' : '○'} {obj.description}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-black/60 backdrop-blur-sm border-4 border-amber-900 rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-amber-400 font-mono">INVENTORY</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {inventory.length === 0 ? (
                <p className="text-gray-500 font-mono text-sm">Empty</p>
              ) : (
                inventory.map((item, idx) => (
                  <div key={idx} className="bg-gray-900/40 border-2 border-gray-700 rounded-lg p-2">
                    <div className="font-bold text-gray-300 font-mono text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{item.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

