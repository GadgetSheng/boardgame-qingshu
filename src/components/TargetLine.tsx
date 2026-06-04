import { useEffect, useRef, useState } from 'react';

interface Props {
  containerClassName?: string;
  fromSlot: string | null;
  toPlayerId: number;
  slotRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  slotToPlayerId: Record<string, number>;
  delay?: number; // 等待目标选择完成后再展示
}

export function TargetLine({ containerClassName, fromSlot, toPlayerId, slotRefs, slotToPlayerId, delay = 250 }: Props) {
  const [coords, setCoords] = useState<{ x1: number; y1: number; x2: number; y2: number; len: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const showTimerRef = useRef<number | null>(null);

  // 目标变化 → 延时展示 + 重启动画
  useEffect(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    setVisible(false);
    setCoords(null);
    setAnimKey((k) => k + 1);
    showTimerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, delay);
    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
  }, [fromSlot, toPlayerId, delay]);

  // 计算坐标
  useEffect(() => {
    if (!visible) return;
    const update = () => {
      if (!fromSlot) return;
      const fromEl = slotRefs.current[fromSlot];
      const toSlot = Object.entries(slotToPlayerId).find(([, id]) => id === toPlayerId)?.[0];
      if (!fromEl || !toSlot) return;
      const toEl = slotRefs.current[toSlot];
      if (!fromEl || !toEl) return;

      const container = fromEl.closest('.grid');
      if (!container) return;

      const c = container.getBoundingClientRect();
      const a = fromEl.getBoundingClientRect();
      const b = toEl.getBoundingClientRect();

      const cx1 = a.left + a.width / 2 - c.left;
      const cy1 = a.top + a.height / 2 - c.top;
      const cx2 = b.left + b.width / 2 - c.left;
      const cy2 = b.top + b.height / 2 - c.top;

      const dx = cx2 - cx1;
      const dy = cy2 - cy1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;

      // 把端点拉到元素边缘
      const ox1 = (a.width / 2) * (dx / len);
      const oy1 = (a.height / 2) * (dy / len);
      const ox2 = (b.width / 2) * (dx / len);
      const oy2 = (b.height / 2) * (dy / len);

      setCoords({
        x1: cx1 + ox1,
        y1: cy1 + oy1,
        x2: cx2 - ox2,
        y2: cy2 - oy2,
        len,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [visible, fromSlot, toPlayerId, slotRefs, slotToPlayerId]);

  if (!visible || !coords) return null;

  const { x1, y1, x2, y2, len } = coords;
  const d = `M ${x1} ${y1} L ${x2} ${y2}`;

  return (
    <svg
      key={animKey}
      className={containerClassName}
      style={{ width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      <defs>
        <filter id="target-line-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 阴影 */}
      <path d={d} stroke="rgba(0,0,0,0.35)" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* 发光主线（CSS draw 动画） */}
      <path
        d={d}
        stroke="rgba(251,191,36,1)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        filter="url(#target-line-glow)"
        style={{
          strokeDasharray: len,
          strokeDashoffset: len,
          animation: 'target-line-draw 0.45s ease-out forwards',
        }}
      />
      {/* 起点光圈 */}
      <circle
        cx={x1}
        cy={y1}
        r="6"
        fill="none"
        stroke="rgba(251,191,36,0.9)"
        strokeWidth="2"
        style={{
          animation: 'target-line-pulse 0.6s ease-out forwards',
          transformOrigin: `${x1}px ${y1}px`,
        }}
      />
      {/* 终点爆炸（击中特效） */}
      <g style={{ transform: `translate(${x2}px, ${y2}px)` }}>
        <circle r="0" fill="rgba(251,191,36,0.9)" style={{ animation: 'target-line-hit 0.5s ease-out forwards' }} />
      </g>
      {/* 移动粒子（CSS transform 动画） */}
      <circle
        r="3.5"
        fill="#fde68a"
        style={{
          transform: `translate(${x1}px, ${y1}px)`,
          animation: `target-line-fly 0.45s ease-out forwards`,
          offsetPath: `path("${d}")`,
          offsetRotate: '0deg',
        } as React.CSSProperties}
      />
      <style>{`
        @keyframes target-line-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes target-line-pulse {
          0%   { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes target-line-hit {
          0%   { r: 0;   opacity: 1; }
          60%  { r: 14;  opacity: 0.8; }
          100% { r: 24;  opacity: 0; }
        }
        @keyframes target-line-fly {
          0%   { offset-distance: 0%;   opacity: 1; }
          90%  { offset-distance: 100%; opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
      `}</style>
    </svg>
  );
}