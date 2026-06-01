import { useState } from 'react';

interface Props {
  onStart: (aiCount: number) => void;
}

export function SetupScreen({ onStart }: Props) {
  const [count, setCount] = useState(1);
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-10 shadow-2xl border border-amber-500/30 max-w-lg w-full">
        <h1 className="text-4xl font-bold text-amber-300 text-center mb-2">情书</h1>
        <p className="text-center text-slate-400 text-sm mb-8">Love Letter · 2019 扩展版（含间谍 + 大臣）</p>
        <div className="space-y-4">
          <div>
            <label className="text-slate-300 block mb-2 text-sm">电脑玩家数量</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`py-3 rounded-lg font-bold text-lg transition-all ${
                    count === n
                      ? 'bg-amber-500 text-slate-900 shadow-lg scale-105'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              共 {count + 1} 人局 · 胜利目标 {count + 1 <= 2 ? 3 : count + 1 <= 4 ? 4 : 5} 个标记
            </p>
          </div>
          <button
            onClick={() => onStart(count)}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold text-lg rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg"
          >
            开始游戏
          </button>
          <div className="text-xs text-slate-500 mt-4 space-y-1">
            <p>• 21 张牌，开局移除 1 张（2 人局额外明抽 3 张）</p>
            <p>• 全部玩家手牌明牌展示（教学模式）</p>
            <p>• 日志记录完整抽牌/出牌/指定/弃置过程</p>
          </div>
        </div>
      </div>
    </div>
  );
}
