import { useState } from 'react';
import type { PlayerType } from './types';

interface SetupScreenProps {
  onStart: (playerCount: number, aiTypes: PlayerType[]) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);

  const handleStart = () => {
    const aiTypes: PlayerType[] = [];
    for (let i = 1; i < playerCount; i++) {
      aiTypes.push(i === 1 ? 'normal-ai' : 'easy-ai');
    }
    onStart(1, aiTypes);
  };

  const aiNames = ['普通AI', '简单AI', '简单AI', '简单AI', '简单AI'];

  return (
    <div className="min-h-screen bg-[length:20px_20px] bg-[linear-gradient(45deg,#e8e8e8_25%,transparent_25%),linear-gradient(-45deg,#e8e8e8_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f5f5f5_75%),linear-gradient(-45deg,transparent_75%,#f5f5f5_75%)] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] flex flex-col items-center justify-center p-8">
      <div className="text-lg text-amber-400 font-serif mb-8">Love Letter 2019</div>

      <div className="bg-amber-100 rounded-xl p-8 border-2 border-amber-700 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <label className="text-sm font-bold text-gray-700 font-serif">玩家人数 (2-6人)</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(count => (
              <button
                key={count}
                className={`px-4 py-2 rounded-lg font-serif text-sm transition ${playerCount === count ? 'bg-red-700 text-amber-100 border-2 border-amber-500' : 'bg-amber-100 text-gray-700 border-2 border-amber-300 hover:bg-amber-200'}`}
                onClick={() => setPlayerCount(count)}
              >
                {count}人
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-700 font-serif">
            <span>👤</span>
            <span>玩家</span>
          </div>
          {Array.from({ length: playerCount - 1 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 text-gray-700 font-serif">
              <span>🤖</span>
              <span>{aiNames[i] || 'AI'}</span>
            </div>
          ))}
        </div>

        <button className="px-8 py-3 text-lg font-serif bg-gradient-to-b from-red-700 to-red-900 text-amber-100 border-2 border-amber-500 rounded-lg cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition" onClick={handleStart}>
          开始游戏
        </button>
      </div>

      <div className="mt-8 bg-red-900/60 rounded-lg p-4 border border-amber-500/30 max-w-md">
        <div className="text-sm font-bold text-amber-400 font-serif mb-2">游戏规则</div>
        <ul className="text-xs text-amber-100 font-serif space-y-1">
          <li>• 每回合抽1张牌，打出1张牌</li>
          <li>• 被猜中手牌或打出公主即淘汰</li>
          <li>• 点数最大者赢得胜利</li>
          <li>• 间谍(Spy): 独家打出且存活至局末，额外+1分</li>
          <li>• 大臣(Chancellor): 抽2选1，其余放回牌库底</li>
        </ul>
      </div>
    </div>
  );
}