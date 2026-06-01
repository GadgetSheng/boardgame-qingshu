interface Props {
  winnerName: string;
  onRestart: () => void;
}

export function GameOverModal({ winnerName, onRestart }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 p-6">
      <div className="bg-gradient-to-br from-amber-900 to-slate-900 border-2 border-amber-400 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold text-amber-300 mb-2">全局胜利</h2>
        <p className="text-xl text-white mb-6">
          <span className="font-bold text-amber-300">{winnerName}</span> 赢得游戏！
        </p>
        <button
          onClick={onRestart}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all"
        >
          再来一局
        </button>
      </div>
    </div>
  );
}
