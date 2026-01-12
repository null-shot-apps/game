'use client';

import { useState } from 'react';

type GameState = 'intro' | 'character-creation' | 'playing';
type Path = 'virtue' | 'luck' | null;

export default function BritanniaRPG() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [playerPath, setPlayerPath] = useState<Path>(null);
  const [playerName, setPlayerName] = useState('');
  const [stats, setStats] = useState({
    virtue: 0,
    luck: 0,
    steam: 0,
    gold: 50,
  });

  const startGame = () => {
    setGameState('character-creation');
  };

  const choosePath = (path: Path) => {
    setPlayerPath(path);
    setGameState('playing');
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
          <div className="grid grid-cols-3 gap-4">
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
          </div>
        </div>

        {/* Main game area */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Story/Events */}
          <div className="md:col-span-2 bg-black/40 backdrop-blur-sm border border-amber-600/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-amber-400">
              {playerPath === 'virtue' ? 'Britain Town Square' : 'The Thieves\' Den'}
            </h2>
            <div className="prose prose-invert">
              {playerPath === 'virtue' ? (
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
              {playerPath === 'virtue' ? (
                <>
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left">
                    Help the merchant
                  </button>
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left">
                    Read the notice board
                  </button>
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left">
                    Visit the temple
                  </button>
                  <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left">
                    Explore the city
                  </button>
                </>
              ) : (
                <>
                  <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left">
                    Talk to the Guildmaster
                  </button>
                  <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left">
                    Browse the fence's wares
                  </button>
                  <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left">
                    Accept a heist contract
                  </button>
                  <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors text-left">
                    Return to the surface
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

