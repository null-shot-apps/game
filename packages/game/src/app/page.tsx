'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RockAudioEngine } from './audioEngine';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type GameState = 'intro' | 'character-creation' | 'playing' | 'combat' | 'dialogue' | 'shop' | 'game-over';
type Path = 'virtue' | 'luck' | null;
type Location = 'britain' | 'thieves-den' | 'forest' | 'dungeon' | 'castle' | 'port' | 'mountains' | 'shrine';
type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';


interface Position {
  x: number;
  y: number;
}

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

interface Building {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'shop' | 'inn' | 'guild' | 'temple' | 'house' | 'tavern';
  canEnter: boolean;
}

interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  dialogue: string[];
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
  { id: 'lockpick', name: 'Lockpick Set', price: 30, type: 'tool', description: 'Essential tools for any aspiring thief', effect: { luck: 2 } },
  { id: 'cloak', name: 'Shadow Cloak', price: 75, type: 'armor', description: 'Blend into darkness', effect: { luck: 5, steam: 1, defense: 2 } },
  { id: 'dice', name: 'Loaded Dice', price: 20, type: 'tool', description: 'Fortune favors the prepared', effect: { luck: 3 } },
  { id: 'dagger', name: 'Thief\'s Dagger', price: 50, type: 'weapon', description: 'Quick and silent', effect: { damage: 5, luck: 1 } },
  { id: 'sword', name: 'Knight\'s Sword', price: 100, type: 'weapon', description: 'A blade of honor', effect: { damage: 8, virtue: 2 } },
  { id: 'shield', name: 'Guardian Shield', price: 80, type: 'armor', description: 'Protects the righteous', effect: { defense: 5, virtue: 1 } },
  { id: 'amulet', name: 'Virtue Amulet', price: 60, type: 'tool', description: 'Blessed by the temples', effect: { virtue: 5 } },
  { id: 'potion', name: 'Health Potion', price: 25, type: 'consumable', description: 'Restores 50 health', effect: { health: 50 } },
  { id: 'elixir', name: 'Lucky Elixir', price: 40, type: 'consumable', description: 'Temporarily boosts luck', effect: { luck: 5 } },
];

// City layouts with buildings and NPCs
const CITY_DATA: Record<Location, { buildings: Building[], npcs: NPC[], width: number, height: number }> = {
  britain: {
    width: 800,
    height: 600,
    buildings: [
      { id: 'shop1', name: 'General Store', x: 100, y: 100, width: 80, height: 80, color: '#8B4513', type: 'shop', canEnter: true },
      { id: 'inn1', name: 'The Prancing Pony', x: 250, y: 100, width: 100, height: 80, color: '#A0522D', type: 'inn', canEnter: true },
      { id: 'temple1', name: 'Temple of Virtue', x: 450, y: 80, width: 120, height: 100, color: '#BDC3C7', type: 'temple', canEnter: true },
      { id: 'house1', name: 'Cottage', x: 100, y: 250, width: 60, height: 60, color: '#CD853F', type: 'house', canEnter: false },
      { id: 'house2', name: 'Manor', x: 200, y: 250, width: 80, height: 70, color: '#D2691E', type: 'house', canEnter: false },
      { id: 'tavern1', name: 'The Drunken Dragon', x: 350, y: 250, width: 90, height: 70, color: '#8B4513', type: 'tavern', canEnter: true },
      { id: 'guild1', name: 'Adventurers Guild', x: 500, y: 250, width: 100, height: 80, color: '#696969', type: 'guild', canEnter: true },
      { id: 'house3', name: 'Townhouse', x: 100, y: 400, width: 70, height: 60, color: '#BC8F8F', type: 'house', canEnter: false },
      { id: 'shop2', name: 'Blacksmith', x: 250, y: 400, width: 80, height: 70, color: '#2F4F4F', type: 'shop', canEnter: true },
      { id: 'house4', name: 'Villa', x: 400, y: 400, width: 90, height: 70, color: '#DEB887', type: 'house', canEnter: false },
    ],
    npcs: [
      { id: 'merchant', name: 'Merchant', x: 120, y: 130, color: '#3498DB', dialogue: ['Welcome to my shop!', 'I have the finest goods in Britannia!'] },
      { id: 'guard', name: 'Guard', x: 470, y: 120, color: '#E74C3C', dialogue: ['Halt! State your business.', 'The temple is a sacred place.'] },
      { id: 'beggar', name: 'Beggar', x: 300, y: 350, color: '#95A5A6', dialogue: ['Spare a coin?', 'Times are hard...'] },
      { id: 'bard', name: 'Bard', x: 370, y: 280, color: '#9B59B6', dialogue: ['Have you heard the tale of the Shadow Lord?', 'I sing for my supper!'] },
    ]
  },
  'thieves-den': {
    width: 600,
    height: 500,
    buildings: [
      { id: 'fence', name: 'The Fence', x: 100, y: 100, width: 80, height: 60, color: '#2C3E50', type: 'shop', canEnter: true },
      { id: 'hideout', name: 'Guild Hall', x: 300, y: 100, width: 120, height: 100, color: '#34495E', type: 'guild', canEnter: true },
      { id: 'storage', name: 'Storage', x: 100, y: 250, width: 70, height: 60, color: '#1C2833', type: 'house', canEnter: false },
      { id: 'training', name: 'Training Room', x: 250, y: 250, width: 100, height: 80, color: '#273746', type: 'guild', canEnter: true },
      { id: 'vault', name: 'Vault', x: 400, y: 250, width: 80, height: 80, color: '#17202A', type: 'house', canEnter: false },
    ],
    npcs: [
      { id: 'fence-npc', name: 'The Fence', x: 120, y: 130, color: '#8E44AD', dialogue: ['Looking to buy or sell?', 'No questions asked...'] },
      { id: 'guildmaster', name: 'Guildmaster', x: 340, y: 140, color: '#C0392B', dialogue: ['You want to join us?', 'Prove your worth first.'] },
      { id: 'thief', name: 'Thief', x: 280, y: 280, color: '#7F8C8D', dialogue: ['Keep your eyes open.', 'The guards are watching.'] },
    ]
  },
  forest: {
    width: 800,
    height: 600,
    buildings: [
      { id: 'cabin', name: 'Hermit\'s Cabin', x: 300, y: 200, width: 70, height: 60, color: '#654321', type: 'house', canEnter: true },
    ],
    npcs: [
      { id: 'hermit', name: 'Hermit', x: 320, y: 230, color: '#27AE60', dialogue: ['Leave me be!', 'The forest is dangerous at night.'] },
    ]
  },
  dungeon: {
    width: 600,
    height: 500,
    buildings: [],
    npcs: []
  },
  castle: {
    width: 800,
    height: 600,
    buildings: [
      { id: 'throne', name: 'Throne Room', x: 300, y: 150, width: 200, height: 150, color: '#7F8C8D', type: 'guild', canEnter: true },
      { id: 'barracks', name: 'Barracks', x: 100, y: 200, width: 100, height: 80, color: '#95A5A6', type: 'guild', canEnter: false },
      { id: 'armory', name: 'Armory', x: 550, y: 200, width: 100, height: 80, color: '#BDC3C7', type: 'shop', canEnter: true },
    ],
    npcs: [
      { id: 'king', name: 'King', x: 400, y: 220, color: '#F39C12', dialogue: ['Welcome to my castle.', 'What brings you here?'] },
      { id: 'knight', name: 'Knight', x: 150, y: 240, color: '#E74C3C', dialogue: ['For honor and glory!', 'I serve the crown.'] },
    ]
  },
  port: {
    width: 800,
    height: 600,
    buildings: [
      { id: 'warehouse', name: 'Warehouse', x: 100, y: 100, width: 100, height: 80, color: '#8B4513', type: 'house', canEnter: false },
      { id: 'tavern', name: 'Sailor\'s Rest', x: 250, y: 100, width: 90, height: 70, color: '#A0522D', type: 'tavern', canEnter: true },
      { id: 'shipyard', name: 'Shipyard', x: 400, y: 100, width: 120, height: 100, color: '#654321', type: 'shop', canEnter: true },
    ],
    npcs: [
      { id: 'captain', name: 'Captain', x: 430, y: 140, color: '#3498DB', dialogue: ['Ahoy there!', 'Looking to sail?'] },
      { id: 'sailor', name: 'Sailor', x: 270, y: 130, color: '#2980B9', dialogue: ['The sea is rough today.', 'I need a drink...'] },
    ]
  },
  mountains: {
    width: 800,
    height: 600,
    buildings: [
      { id: 'cave', name: 'Cave Entrance', x: 350, y: 250, width: 100, height: 80, color: '#34495E', type: 'house', canEnter: true },
    ],
    npcs: []
  },
  shrine: {
    width: 600,
    height: 500,
    buildings: [
      { id: 'altar', name: 'Sacred Altar', x: 250, y: 200, width: 100, height: 80, color: '#ECF0F1', type: 'temple', canEnter: true },
    ],
    npcs: [
      { id: 'priest', name: 'Priest', x: 290, y: 240, color: '#F39C12', dialogue: ['Seek the Eight Virtues.', 'May you find enlightenment.'] },
    ]
  }
};

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

export default function BritanniaRPG() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [playerPath, setPlayerPath] = useState<Path>(null);
  const [playerName, setPlayerName] = useState('');
  const [location, setLocation] = useState<Location>('britain');
  const [playerPos, setPlayerPos] = useState<Position>({ x: 400, y: 300 });
  const [timeOfDay] = useState<TimeOfDay>('day');
  const [message, setMessage] = useState('');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [currentNPC, setCurrentNPC] = useState<NPC | null>(null);
  const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const audioEngine = useRef<RockAudioEngine | null>(null);
  
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

  // ============================================================================
  // INTERACTION SYSTEM
  // ============================================================================

  const checkInteraction = useCallback(() => {
    const cityData = CITY_DATA[location];
    
    // Check for NPC interaction
    for (const npc of cityData.npcs) {
      const distance = Math.sqrt(
        Math.pow(playerPos.x - npc.x, 2) + Math.pow(playerPos.y - npc.y, 2)
      );
      
      if (distance < 30) {
        setCurrentNPC(npc);
        setGameState('dialogue');
        return;
      }
    }
    
    // Check for building interaction
    for (const building of cityData.buildings) {
      if (
        building.canEnter &&
        playerPos.x + 12 > building.x &&
        playerPos.x < building.x + building.width &&
        playerPos.y + 16 > building.y &&
        playerPos.y < building.y + building.height
      ) {
        setCurrentBuilding(building);
        if (building.type === 'shop') {
          setGameState('shop');
        } else {
          setMessage(`You entered ${building.name}`);
        }
        return;
      }
    }
  }, [location, playerPos.x, playerPos.y]);

  // ============================================================================
  // KEYBOARD CONTROLS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      keysPressed.current.add(e.key);
      
      // Handle inventory toggle
      if (e.key === 'i' || e.key === 'I') {
        setShowInventory(prev => !prev);
      }
      
      // Handle map toggle
      if (e.key === 'm' || e.key === 'M') {
        setShowMap(prev => !prev);
      }
      
      // Handle interaction
      if (e.key === ' ' || e.key === 'Enter') {
        checkInteraction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, playerPos, location, checkInteraction]);

  // ============================================================================
  // GAME LOOP
  // ============================================================================

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Move player based on keys pressed
      const speed = 3;
      let newX = playerPos.x;
      let newY = playerPos.y;

      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) {
        newY -= speed;
      }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S')) {
        newY += speed;
      }
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || keysPressed.current.has('A')) {
        newX -= speed;
      }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) {
        newX += speed;
      }

      // Check collision with buildings
      const cityData = CITY_DATA[location];
      let collision = false;
      
      for (const building of cityData.buildings) {
        if (
          newX + 8 > building.x &&
          newX < building.x + building.width &&
          newY + 12 > building.y &&
          newY < building.y + building.height
        ) {
          collision = true;
          break;
        }
      }

      // Keep player in bounds
      if (!collision) {
        newX = Math.max(0, Math.min(newX, cityData.width - 16));
        newY = Math.max(0, Math.min(newY, cityData.height - 16));
        setPlayerPos({ x: newX, y: newY });
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [gameState, playerPos, location]);

  // ============================================================================
  // RENDERING
  // ============================================================================

  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const cityData = CITY_DATA[location];

    // Color palettes based on time of day
    const palettes = {
      dawn: { sky: '#8B4789', ground: '#4A3B5C', text: '#D4A574' },
      day: { sky: '#5DADE2', ground: '#52B788', text: '#2C3E50' },
      dusk: { sky: '#E67E22', ground: '#6C5B7B', text: '#F39C12' },
      night: { sky: '#1C2833', ground: '#2C3E50', text: '#85929E' }
    };

    const palette = palettes[timeOfDay];

    // Clear canvas
    ctx.fillStyle = palette.sky;
    ctx.fillRect(0, 0, cityData.width, cityData.height);

    // Draw ground
    ctx.fillStyle = palette.ground;
    ctx.fillRect(0, cityData.height - 100, cityData.width, 100);

    // Draw roads/paths
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, cityData.height / 2 - 20, cityData.width, 40);
    ctx.fillRect(cityData.width / 2 - 20, 0, 40, cityData.height);

    // Draw buildings
    for (const building of cityData.buildings) {
      // Building shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(building.x + 4, building.y + 4, building.width, building.height);
      
      // Building body
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.width, building.height);
      
      // Building outline
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(building.x, building.y, building.width, building.height);
      
      // Door
      ctx.fillStyle = '#654321';
      ctx.fillRect(building.x + building.width / 2 - 10, building.y + building.height - 20, 20, 20);
      
      // Windows
      ctx.fillStyle = '#F39C12';
      ctx.fillRect(building.x + 10, building.y + 15, 15, 15);
      ctx.fillRect(building.x + building.width - 25, building.y + 15, 15, 15);
      
      // Building name
      if (building.canEnter) {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(building.name, building.x + building.width / 2, building.y - 5);
      }
    }

    // Draw NPCs
    for (const npc of cityData.npcs) {
      // NPC shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(npc.x + 2, npc.y + 14, 12, 4);
      
      // NPC body
      ctx.fillStyle = npc.color;
      ctx.fillRect(npc.x, npc.y, 12, 16);
      
      // NPC head
      ctx.fillStyle = '#FDBCB4';
      ctx.fillRect(npc.x + 2, npc.y - 6, 8, 8);
      
      // NPC name
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, npc.x + 6, npc.y - 10);
    }

    // Draw player
    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(playerPos.x + 2, playerPos.y + 14, 12, 4);
    
    // Player body
    ctx.fillStyle = playerPath === 'virtue' ? '#3498DB' : '#8E44AD';
    ctx.fillRect(playerPos.x, playerPos.y, 12, 16);
    
    // Player head
    ctx.fillStyle = '#FDBCB4';
    ctx.fillRect(playerPos.x + 2, playerPos.y - 6, 8, 8);
    
    // Player name
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(playerName, playerPos.x + 6, playerPos.y - 10);

    // Draw location name
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 30);
    ctx.fillStyle = '#F39C12';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(location.toUpperCase().replace('-', ' '), 20, 30);

  }, [gameState, playerPos, location, timeOfDay, playerName, playerPath]);

  // ============================================================================
  // AUDIO ENGINE
  // ============================================================================

  // Initialize audio engine
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioEngine.current) {
      audioEngine.current = new RockAudioEngine();
    }
  }, []);

  // Control music based on game state
  useEffect(() => {
    if (!audioEngine.current || !musicEnabled) return;

    if (gameState === 'intro' || gameState === 'character-creation') {
      audioEngine.current.playIntro();
    } else if (gameState === 'combat') {
      if (currentEnemy && currentEnemy.name.toLowerCase().includes('boss')) {
        audioEngine.current.playBoss();
      } else {
        audioEngine.current.playCombat();
      }
    } else if (gameState === 'playing') {
      audioEngine.current.playExploration();
    }

    return () => {
      // Cleanup when component unmounts
      if (audioEngine.current) {
        audioEngine.current.stop();
      }
    };
  }, [gameState, musicEnabled, currentEnemy]);

  const toggleMusic = async () => {
    if (!audioEngine.current) return;
    
    if (!musicEnabled) {
      await audioEngine.current.init();
      setMusicEnabled(true);
    } else {
      audioEngine.current.stop();
      setMusicEnabled(false);
    }
  };

  // ============================================================================
  // GAME ACTIONS
  // ============================================================================

  const startGame = () => {
    setGameState('character-creation');
  };

  const choosePath = (path: Path) => {
    setPlayerPath(path);
    setLocation(path === 'virtue' ? 'britain' : 'thieves-den');
    setPlayerPos({ x: 400, y: 300 });
    setGameState('playing');
    setMessage('Use arrow keys or WASD to move. Press SPACE to interact. Press I for inventory, M for map.');
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

  const changeLocation = (newLocation: Location) => {
    setLocation(newLocation);
    setPlayerPos({ x: 400, y: 300 });
    setShowMap(false);
    setMessage(`Traveled to ${newLocation.replace('-', ' ')}`);
    
    // Random encounter chance
    if (Math.random() < 0.2) {
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

    const playerDamage = Math.max(10 + (stats.luck * 2) - currentEnemy.defense, 1);
    const newEnemyHealth = currentEnemy.health - playerDamage;

    if (newEnemyHealth <= 0) {
      setStats(prev => ({
        ...prev,
        gold: prev.gold + currentEnemy.goldReward,
        experience: prev.experience + currentEnemy.experienceReward,
      }));
      setMessage(`Victory! Gained ${currentEnemy.goldReward} gold and ${currentEnemy.experienceReward} XP!`);
      
      // Play victory music
      if (audioEngine.current && musicEnabled) {
        audioEngine.current.playVictory();
      }
      
      setCurrentEnemy(null);
      setGameState('playing');
      return;
    }

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
              Beneath the cities and castles lies the <span className="text-purple-400 font-semibold">Thieves&apos; Guild</span>, 
              a secretive network of cutpurses, smugglers, and masterminds who believe that fortune favors the bold. 
              Through clever thefts, daring gambits, and calculated risks, you may build <span className="text-green-400 font-semibold">Luck</span> &mdash; 
              an unseen force that bends fate itself.
            </p>
            <p className="text-xl leading-relaxed text-amber-300">
              The world reacts to your path. Cities whisper your name. The righteous may shun you, while the desperate seek your aid. 
              In Britannia, victory is no longer reserved for the pure of heart — but also for those clever enough to steal it.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={toggleMusic}
              className={`${musicEnabled ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors font-mono border-4 border-amber-900`}
              title="Toggle Rock Soundtrack (AC/DC & Guns N' Roses inspired)"
            >
              {musicEnabled ? '🎸 ROCK ON!' : '🎸 ENABLE MUSIC'}
            </button>
            <button
              onClick={startGame}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors font-mono border-4 border-amber-900"
            >
              &gt; BEGIN YOUR JOURNEY
            </button>
          </div>
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
                Join the Thieves&apos; Guild and master the art of fortune. Build Luck through cunning, 
                risk, and daring heists. Let chance be your weapon.
              </p>
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

  if (gameState === 'dialogue') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-black/60 border-4 border-amber-900 rounded-lg p-8">
            {currentNPC && (
              <>
                <h2 className="text-3xl font-bold mb-6 text-amber-400 font-mono">{currentNPC.name}</h2>
                <div className="space-y-4 mb-6">
                  {currentNPC.dialogue.map((line, idx) => (
                    <p key={idx} className="text-lg font-mono text-gray-300">
                      &quot;{line}&quot;
                    </p>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setCurrentNPC(null);
                    setGameState('playing');
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg transition-colors font-mono border-2 border-amber-900"
                >
                  &gt; CONTINUE
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'shop') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/60 border-4 border-amber-900 rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-amber-400 font-mono">
              {currentBuilding?.name || 'SHOP'}
            </h2>
            <div className="mb-4 text-xl font-mono text-yellow-400">
              Your Gold: {stats.gold}g
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {ITEMS.map(item => (
                <div key={item.id} className="bg-gray-900/60 border-2 border-gray-700 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-amber-300 font-mono mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-400 font-mono mb-2">{item.description}</p>
                  <div className="text-lg text-yellow-400 font-mono mb-3">{item.price}g</div>
                  <button
                    onClick={() => buyItem(item)}
                    disabled={stats.gold < item.price}
                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors font-mono"
                  >
                    BUY
                  </button>
                </div>
              ))}
            </div>
            {message && (
              <div className="bg-amber-900/40 border-2 border-amber-600 rounded-lg p-4 mb-4 font-mono text-center">
                {message}
              </div>
            )}
            <button
              onClick={() => {
                setCurrentBuilding(null);
                setGameState('playing');
              }}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-colors font-mono border-2 border-red-900"
            >
              &gt; LEAVE
            </button>
          </div>
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
    <div className="min-h-screen bg-black text-white">
      {/* HUD */}
      <div className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-b-4 border-amber-900 p-2 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-xl font-bold text-amber-400 font-mono">{playerName}</div>
            <div className="text-sm text-gray-400 font-mono">Lv.{stats.level}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-mono">
              <span className="text-red-400">HP: {stats.health}/{stats.maxHealth}</span>
            </div>
            <div className="text-sm font-mono">
              <span className="text-blue-400">Virtue: {stats.virtue}</span>
            </div>
            <div className="text-sm font-mono">
              <span className="text-purple-400">Luck: {stats.luck}</span>
            </div>
            <div className="text-sm font-mono">
              <span className="text-yellow-400">💰 {stats.gold}g</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleMusic}
              className={`${musicEnabled ? 'bg-green-700 hover:bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} px-3 py-1 rounded font-mono text-sm`}
              title="Toggle Rock Soundtrack"
            >
              {musicEnabled ? '🎸 ON' : '🎸 OFF'}
            </button>
            <button
              onClick={() => setShowInventory(!showInventory)}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded font-mono text-sm"
            >
              [I] Inventory
            </button>
            <button
              onClick={() => setShowMap(!showMap)}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded font-mono text-sm"
            >
              [M] Map
            </button>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex justify-center items-center min-h-screen pt-16">
        <div className="border-4 border-amber-900 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CITY_DATA[location].width}
            height={CITY_DATA[location].height}
            className="image-rendering-pixelated bg-black"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* Controls Help */}
      <div className="fixed bottom-4 left-4 bg-black/80 backdrop-blur-sm border-2 border-amber-900 rounded-lg p-3 font-mono text-xs">
        <div className="text-amber-400 font-bold mb-1">CONTROLS:</div>
        <div>Arrow Keys / WASD - Move</div>
        <div>SPACE / ENTER - Interact</div>
        <div>I - Inventory</div>
        <div>M - Map</div>
      </div>

      {/* Message */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-amber-900/90 backdrop-blur-sm border-2 border-amber-600 rounded-lg p-4 font-mono max-w-md">
          <p>{message}</p>
          <button
            onClick={() => setMessage('')}
            className="mt-2 text-sm text-amber-400 hover:text-amber-300"
          >
            [X] Close
          </button>
        </div>
      )}

      {/* Inventory Panel */}
      {showInventory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-slate-900 border-4 border-amber-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-3xl font-bold mb-4 text-amber-400 font-mono">INVENTORY</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {inventory.length === 0 ? (
                <p className="text-gray-500 font-mono col-span-2">Empty</p>
              ) : (
                inventory.map((item, idx) => (
                  <div key={idx} className="bg-gray-800 border-2 border-gray-700 rounded-lg p-3">
                    <div className="font-bold text-amber-300 font-mono">{item.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{item.description}</div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowInventory(false)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors font-mono"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Map Panel */}
      {showMap && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-slate-900 border-4 border-amber-900 rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-3xl font-bold mb-4 text-amber-400 font-mono">WORLD MAP</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(['britain', 'thieves-den', 'forest', 'dungeon', 'castle', 'port', 'mountains', 'shrine'] as Location[]).map(loc => (
                <button
                  key={loc}
                  onClick={() => changeLocation(loc)}
                  disabled={loc === location}
                  className={`py-3 px-4 rounded font-mono font-bold transition-colors ${
                    loc === location
                      ? 'bg-amber-600 text-white cursor-not-allowed'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {loc.toUpperCase().replace('-', ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMap(false)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors font-mono"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}














