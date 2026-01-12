'use client';

import { useState } from 'react';

type GameState = 'intro' | 'character-creation' | 'playing';
type Path = 'virtue' | 'luck' | null;
type ShopState = 'closed' | 'fence' | 'temple';
type EventState = 'none' | 'heist' | 'merchant' | 'notice' | 'guildmaster' | 'explore' | 'temple-visit';

interface Item {
  id: string;
  name: string;
  price: number;
  description: string;
  effect?: {
    luck?: number;
    virtue?: number;
    steam?: number;
  };
}

interface HeistOption {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward: number;
  luckRequired: number;
  description: string;
}

const FENCE_ITEMS: Item[] = [
  { id: 'lockpick', name: 'Lockpick Set', price: 30, description: 'Essential tools for any aspiring thief', effect: { luck: 2 } },
  { id: 'cloak', name: 'Shadow Cloak', price: 75, description: 'Blend into darkness more easily', effect: { luck: 5, steam: 1 } },
  { id: 'dice', name: 'Loaded Dice', price: 20, description: 'Fortune favors the prepared', effect: { luck: 3 } },
  { id: 'map', name: 'Sewer Map', price: 15, description: 'Secret routes through the city' },
];

const HEIST_OPTIONS: HeistOption[] = [
  { id: 'merchant', name: 'Rob the Merchant\'s Stall', difficulty: 'easy', reward: 40, luckRequired: 0, description: 'A simple snatch-and-grab in the market district.' },
  { id: 'manor', name: 'Burgle the Noble\'s Manor', difficulty: 'medium', reward: 120, luckRequired: 5, description: 'Break into a wealthy estate under cover of night.' },
  { id: 'treasury', name: 'Raid the City Treasury', difficulty: 'hard', reward: 300, luckRequired: 15, description: 'The ultimate score - but heavily guarded.' },
];

export default function BritanniaRPG() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [playerPath, setPlayerPath] = useState<Path>(null);
  const [playerName, setPlayerName] = useState('');
  const [shopState, setShopState] = useState<ShopState>('closed');
  const [eventState, setEventState] = useState<EventState>('none');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    virtue: 0,
    luck: 0,
    steam: 0,
    gold: 50,
    reputation: 0, // Positive = respected, Negative = feared
  });

  const startGame = () => {
    setGameState('character-creation');
  };

  const choosePath = (path: Path) => {
    setPlayerPath(path);
    setGameState('playing');
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
      setShopState('closed');
    }
  };

  const attemptHeist = (heist: HeistOption) => {
    // Calculate success chance based on luck and steam
    const baseChance = heist.difficulty === 'easy' ? 70 : heist.difficulty === 'medium' ? 50 : 30;
    const luckBonus = Math.min(stats.luck * 2, 30);
    const steamBonus = Math.min(stats.steam * 3, 20);
    const successChance = baseChance + luckBonus + steamBonus;
    
    const roll = Math.random() * 100;
    
    if (roll < successChance) {
      // Success!
      const goldGained = heist.reward + Math.floor(stats.luck * 2);
      const luckGained = heist.difficulty === 'easy' ? 1 : heist.difficulty === 'medium' ? 2 : 4;
      const steamGained = 1;
      
      setStats(prev => ({
        ...prev,
        gold: prev.gold + goldGained,
        luck: prev.luck + luckGained,
        steam: prev.steam + steamGained,
        reputation: prev.reputation - 1,
      }));
      
      setMessage(`🎉 Success! You gained ${goldGained} gold, +${luckGained} Luck, +${steamGained} Steam. Your reputation in the underworld grows...`);
    } else {
      // Failure - lose some gold and steam
      const goldLost = Math.min(Math.floor(stats.gold * 0.2), 30);
      const steamLost = Math.max(stats.steam - 1, 0);
      
      setStats(prev => ({
        ...prev,
        gold: Math.max(prev.gold - goldLost, 0),
        steam: steamLost,
        reputation: prev.reputation - 2,
      }));
      
      setMessage(`💥 Caught! You lost ${goldLost} gold and momentum. The guards are on alert...`);
    }
    
    setEventState('none');
  };

  const helpMerchant = () => {
    const goldReward = 20;
    const virtueGained = 3;
    
    setStats(prev => ({
      ...prev,
      gold: prev.gold + goldReward,
      virtue: prev.virtue + virtueGained,
      reputation: prev.reputation + 2,
    }));
    
    setMessage(`The merchant thanks you profusely and rewards you with ${goldReward} gold. +${virtueGained} Virtue. The townsfolk smile at you.`);
    setEventState('none');
  };

  const ignoreMerchant = () => {
    setMessage(`You walk past the struggling merchant. Sometimes fortune favors those who mind their own business.`);
    setEventState('none');
  };

  const exploreCity = () => {
    const roll = Math.random() * 100;
    const luckModifier = stats.luck * 2;
    
    if (roll + luckModifier > 70) {
      // Lucky find!
      const goldFound = Math.floor(Math.random() * 30) + 10;
      setStats(prev => ({ ...prev, gold: prev.gold + goldFound }));
      setMessage(`🍀 While exploring, you stumble upon a hidden cache! Found ${goldFound} gold.`);
    } else if (roll < 20) {
      // Trouble!
      const goldLost = Math.floor(Math.random() * 15) + 5;
      setStats(prev => ({ ...prev, gold: Math.max(prev.gold - goldLost, 0) }));
      setMessage(`⚔️ You encounter bandits in an alley! Lost ${goldLost} gold in the scuffle.`);
    } else {
      setMessage(`You wander the streets of Britain, observing the daily life of Britannia's citizens.`);
    }
    setEventState('none');
  };

  const visitTemple = () => {
    if (stats.gold >= 10) {
      setStats(prev => ({
        ...prev,
        gold: prev.gold - 10,
        virtue: prev.virtue + 2,
        reputation: prev.reputation + 1,
      }));
      setMessage(`You donate 10 gold to the temple. The priests bless you. +2 Virtue.`);
    } else {
      setMessage(`The temple welcomes all, but donations help maintain this sacred place. (Need 10 gold)`);
    }
    setEventState('none');
  };

  const talkToGuildmaster = () => {
    const messages = [
      `"${playerName}, your reputation grows. Keep building your Luck, and greater opportunities will come."`,
      `"Remember, fortune favors the bold, but the reckless end up in chains. Balance risk and reward."`,
      `"The nobility grows fat on the labor of others. We simply... redistribute their wealth."`,
      `"Steam is momentum. Success breeds success. String together victories and you'll become unstoppable."`,
    ];
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
    setEventState('none');
  };

  const readNoticeBoard = () => {
    const notices = [
      `WANTED: Bandits terrorizing the roads. 50 gold reward.`,
      `NOTICE: The Lord's Ball is this weekend. Extra guards on duty.`,
      `HELP WANTED: Shepherd needs assistance finding lost sheep. Modest pay.`,
      `WARNING: Increased thefts reported. Thieves will be prosecuted.`,
    ];
    setMessage(notices[Math.floor(Math.random() * notices.length)]);
    setEventState('none');
  };

  if (gameState === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-center mb-8 text-amber-400">
            Britannia
          </h1>
          <div className="bg-black/40 backdrop-blur-sm border border-amber-600/30 rounded-lg p-8 mb-8">
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
            <p className="text-lg leading-relaxed mb-6">
              Yet every gain carries risk. Too much greed invites ruin. Too much luck attracts attention. 
              Will you balance virtue and vice, or embrace fortune as your guiding star?
            </p>
            <p className="text-xl leading-relaxed text-amber-300">
              The world reacts to your path. Cities whisper your name. The righteous may shun you, while the desperate seek your aid. 
              In Britannia, victory is no longer reserved for the pure of heart — but also for those clever enough to steal it.
            </p>
          </div>
          <button
            onClick={startGame}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
          >
            Begin Your Journey
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'character-creation') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-8 text-amber-400">
            Choose Your Path
          </h1>
          
          <div className="mb-8">
            <label className="block text-xl mb-3">What name shall you be known by?</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-black/40 border border-amber-600/30 rounded-lg px-4 py-3 text-lg text-white placeholder-gray-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Virtue Path */}
            <div className="bg-black/40 backdrop-blur-sm border border-blue-500/50 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <h2 className="text-3xl font-bold mb-4 text-blue-400">Path of Virtue</h2>
              <p className="mb-4 text-gray-300">
                Walk the righteous path of the Eight Virtues. Earn honor through noble deeds, 
                help the innocent, and become a beacon of hope in Britannia.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-gray-400">
                <li>• Gain Virtue through honorable actions</li>
                <li>• Respected by guards and nobility</li>
                <li>• Access to temples and sacred quests</li>
                <li>• Harder to gain wealth quickly</li>
              </ul>
              <button
                onClick={() => choosePath('virtue')}
                disabled={!playerName}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Choose Virtue
              </button>
            </div>

            {/* Luck Path */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/50 rounded-lg p-6 hover:border-purple-400 transition-colors">
              <h2 className="text-3xl font-bold mb-4 text-purple-400">Path of Luck</h2>
              <p className="mb-4 text-gray-300">
                Join the Thieves' Guild and master the art of fortune. Build Luck through cunning, 
                risk, and daring heists. Let chance be your weapon.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-gray-400">
                <li>• Gain Luck through successful thefts</li>
                <li>• Build Steam for powerful momentum</li>
                <li>• Access to black markets and heists</li>
                <li>• Risk of capture and reputation loss</li>
              </ul>
              <button
                onClick={() => choosePath('luck')}
                disabled={!playerName}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Choose Luck
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Playing state
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with stats */}
        <div className="bg-black/40 backdrop-blur-sm border border-amber-600/30 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-amber-400">{playerName}</h1>
            <div className="text-xl text-yellow-400">💰 {stats.gold} Gold</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-900/30 rounded p-3">
              <div className="text-sm text-gray-400">Virtue</div>
              <div className="text-2xl font-bold text-blue-400">{stats.virtue}</div>
            </div>
            <div className="bg-purple-900/30 rounded p-3">
              <div className="text-sm text-gray-400">Luck</div>
              <div className="text-2xl font-bold text-purple-400">{stats.luck}</div>
            </div>
            <div className="bg-orange-900/30 rounded p-3">
              <div className="text-sm text-gray-400">Steam</div>
              <div className="text-2xl font-bold text-orange-400">{stats.steam}</div>
            </div>
            <div className={`rounded p-3 ${stats.reputation >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
              <div className="text-sm text-gray-400">Reputation</div>
              <div className={`text-2xl font-bold ${stats.reputation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.reputation > 0 ? '+' : ''}{stats.reputation}
              </div>
            </div>
          </div>
        </div>

        {/* Message display */}
        {message && (
          <div className="bg-amber-900/40 border border-amber-500/50 rounded-lg p-4 mb-6">
            <p className="text-amber-100">{message}</p>
            <button
              onClick={() => setMessage('')}
              className="mt-2 text-sm text-amber-400 hover:text-amber-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main game area */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Story/Events */}
          <div className="md:col-span-2 bg-black/40 backdrop-blur-sm border border-amber-600/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-amber-400">
              {shopState === 'fence' ? 'The Fence\'s Wares' : 
               eventState === 'heist' ? 'Choose Your Heist' :
               eventState === 'merchant' ? 'The Struggling Merchant' :
               eventState === 'notice' ? 'Notice Board' :
               eventState === 'guildmaster' ? 'The Guildmaster' :
               eventState === 'explore' ? 'Exploring Britain' :
               eventState === 'temple-visit' ? 'The Temple' :
               playerPath === 'virtue' ? 'Britain Town Square' : 'The Thieves\' Den'}
            </h2>
            <div className="prose prose-invert">
              {shopState === 'fence' ? (
                <div>
                  <p className="text-gray-300 mb-4">
                    The fence spreads out various stolen goods on a worn table. "Looking for something special?" they whisper.
                  </p>
                  <div className="space-y-3">
                    {FENCE_ITEMS.map(item => {
                      const alreadyOwned = inventory.some(i => i.id === item.id);
                      const canAfford = stats.gold >= item.price;
                      return (
                        <div key={item.id} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-purple-300">{item.name}</h3>
                              <p className="text-sm text-gray-400">{item.description}</p>
                              {item.effect && (
                                <div className="text-xs text-green-400 mt-1">
                                  {item.effect.luck && `+${item.effect.luck} Luck `}
                                  {item.effect.virtue && `+${item.effect.virtue} Virtue `}
                                  {item.effect.steam && `+${item.effect.steam} Steam`}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-yellow-400 font-bold">{item.price}g</div>
                              {alreadyOwned ? (
                                <div className="text-xs text-gray-500 mt-1">Owned</div>
                              ) : (
                                <button
                                  onClick={() => buyItem(item)}
                                  disabled={!canAfford}
                                  className="mt-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold py-1 px-3 rounded transition-colors"
                                >
                                  Buy
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setShopState('closed')}
                    className="mt-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              ) : eventState === 'heist' ? (
                <div>
                  <p className="text-gray-300 mb-4">
                    The Guildmaster spreads out several contracts on the table. "Choose wisely, {playerName}. 
                    Each job carries risk, but fortune favors the bold."
                  </p>
                  <div className="space-y-3">
                    {HEIST_OPTIONS.map(heist => {
                      const canAttempt = stats.luck >= heist.luckRequired;
                      const difficultyColor = heist.difficulty === 'easy' ? 'text-green-400' : 
                                             heist.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400';
                      return (
                        <div key={heist.id} className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-purple-300">{heist.name}</h3>
                              <p className="text-sm text-gray-400">{heist.description}</p>
                              <div className="flex gap-3 mt-2 text-xs">
                                <span className={difficultyColor}>● {heist.difficulty.toUpperCase()}</span>
                                <span className="text-yellow-400">💰 {heist.reward}g reward</span>
                                <span className="text-purple-400">🎲 {heist.luckRequired} Luck required</span>
                              </div>
                            </div>
                            <button
                              onClick={() => attemptHeist(heist)}
                              disabled={!canAttempt}
                              className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
                            >
                              {canAttempt ? 'Attempt' : 'Locked'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setEventState('none')}
                    className="mt-4 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              ) : eventState === 'merchant' ? (
                <div>
                  <p className="text-gray-300 mb-4">
                    A merchant's cart has overturned, spilling goods across the cobblestones. 
                    He struggles to lift it alone while passersby ignore him. You could help... or walk away.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={helpMerchant}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded transition-colors"
                    >
                      Help him (+Virtue, +Gold, +Reputation)
                    </button>
                    <button
                      onClick={ignoreMerchant}
                      className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-6 rounded transition-colors"
                    >
                      Walk away
                    </button>
                  </div>
                </div>
              ) : eventState === 'notice' ? (
                <div>
                  <p className="text-gray-300 mb-4">
                    The notice board is covered with various announcements, wanted posters, and job listings.
                  </p>
                  <button
                    onClick={readNoticeBoard}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Read a notice
                  </button>
                </div>
              ) : eventState === 'guildmaster' ? (
                <div>
                  <p className="text-gray-300 mb-4">
                    The Guildmaster leans back in their chair, studying you with keen eyes.
                  </p>
                  <button
                    onClick={talkToGuildmaster}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Listen to their wisdom
                  </button>
                </div>
              ) : eventState === 'explore' ? (
                <div>
                  <p className="text-gray-300 mb-4">
                    You wander through the winding streets of Britain. Who knows what you might find?
                  </p>
                  <button
                    onClick={exploreCity}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Take your chances
                  </button>
                </div>
              ) : eventState === 'temple-visit' ? (
                <div>
                  <p className="text-gray-300 mb-4">
                    The temple is a sanctuary of peace. Candles flicker before shrines to the Eight Virtues. 
                    A donation box sits near the entrance.
                  </p>
                  <button
                    onClick={visitTemple}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    Make a donation (10 gold)
                  </button>
                </div>
              ) : playerPath === 'virtue' ? (
                <p className="text-gray-300">
                  You stand in the bustling town square of Britain, the heart of Britannia. 
                  Citizens go about their daily business, and you notice a guard posting a notice on the town board. 
                  A merchant nearby seems to be in distress, his cart overturned.
                </p>
              ) : (
                <p className="text-gray-300">
                  You descend into the shadowy underground tavern known as the Thieves' Den. 
                  Hooded figures whisper in corners, and a mysterious fence examines stolen goods by candlelight. 
                  The Guildmaster beckons you over with a knowing smile.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-black/40 backdrop-blur-sm border border-amber-600/30 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-amber-400">Actions</h3>
            <div className="space-y-3">
              {shopState === 'closed' && eventState === 'none' && (
                <>
                  {playerPath === 'virtue' ? (
                    <>
                      <button 
                        onClick={() => setEventState('merchant')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left"
                      >
                        Help the merchant
                      </button>
                      <button 
                        onClick={() => setEventState('notice')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left"
                      >
                        Read the notice board
                      </button>
                      <button 
                        onClick={() => setEventState('temple-visit')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left"
                      >
                        Visit the temple
                      </button>
                      <button 
                        onClick={() => setEventState('explore')}
                        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left"
                      >
                        Explore the city
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setEventState('guildmaster')}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left"
                      >
                        Talk to the Guildmaster
                      </button>
                      <button 
                        onClick={() => setShopState('fence')}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left"
                      >
                        Browse the fence's wares
                      </button>
                      <button 
                        onClick={() => setEventState('heist')}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left"
                      >
                        Accept a heist contract
                      </button>
                      <button 
                        onClick={() => setEventState('explore')}
                        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left"
                      >
                        Return to the surface
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












