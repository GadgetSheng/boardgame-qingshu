# 情书桌游 Web 版 - SPEC

## 1. 概述

单页 web 应用，复刻 2019 新版《情书》(Love Letter, AEG) 桌游。1 名真人玩家 + 1~5 名电脑玩家。所有玩家手牌明牌显示（教学/旁观模式），游戏日志完整记录每回合抽牌/出牌/指定/弃置全过程。

## 2. 牌库（共 21 张，开局移除 1 张剩 20 张）

| 牌名 | 数值 | 数量 | 效果 |
|------|------|------|------|
| 公主 Princess | 8 | 1 | 打出此牌者立即出局（自爆） |
| 女伯爵 Countess | 7 | 1 | 强制规则：若手中同时持有国王或王子，必须出女伯爵（实际游戏常被弱化为推荐） |
| 国王 King | 6 | 1 | 指定另一存活玩家，交换手牌 |
| 大臣 Chancellor | 5 | 2 | 摸 1 张牌，可从手中选 1 张放回牌库底，保留另一张 |
| 王子 Prince | 5 | 2 | 指定一玩家，该玩家弃当前手牌并从牌库摸 1 张新牌（可指定自己） |
| 侍女 Handmaid | 4 | 2 | 打出后至下一回合开始前，自己免疫（不能被任何牌指定） |
| 男爵 Baron | 3 | 2 | 指定一玩家，秘密比手牌数值，小者出局 |
| 僧侣 Priest | 2 | 2 | 指定一玩家，查看其手牌 |
| 守卫 Guard | 1 | 6 | 指定一玩家并猜其手牌牌名，猜对则该玩家出局（不能猜守卫） |
| 间谍 Spy | 0 | 2 | 摸 1 张牌（牌库顶），可选择：(a) 放回牌库顶，或 (b) 弃该牌并让自己本轮免疫 |

实际新版 2019 中"女伯爵"规则：手里同时有国王或王子时必须出女伯爵。本实现采用此强制规则。

## 3. 流程

### 初始化
1. 洗牌
2. 翻开牌库顶 1 张移除（面朝下，置于一旁）—— 这是开局移除的 1 张
3. 给每位存活玩家发 1 张手牌
4. 玩家从人类玩家开始按座位顺序依次行动

### 回合流程
玩家 A 回合开始 → 摸 1 张（手牌上限 2）→ 选 1 张打出 → 执行效果 → 弃牌入弃牌堆 → 检查胜负 → 下一玩家

### 免疫失效
侍女 / 间谍(b 路径) 让出牌者本轮免疫。免疫在自己下一回合开始时清除。

### 回合推进
- 跳过被侍女免疫的下一玩家（仍要继续）
- 跳过已出局的玩家

### 胜负判定
每张牌打出后立即检查：
1. **剩 1 存活玩家** → 该玩家胜
2. **牌库摸完时** → 存活玩家比较手牌数值（公主 8 最大），最大者胜；若数值相同则持牌数量多者胜
3. **公主打出** → 打出者立即出局，不进入上述

## 4. 电脑 AI（中等 + 简单记忆）

每位 AI 维护私有状态：
- 自己手牌
- 记牌表：每种牌剩余张数（开局 21 - 已弃/手牌/移除）
- 免疫状态
- 上一回合观察到的他人手牌（僧侣/间谍/被王子的弃牌）

### 决策启发式
1. **侍女优先**：若手牌 ≤ 2 且手中有侍女，先出侍女保护自己
2. **猜牌**：守卫出牌时排除已知牌 + 自己牌，猜概率最高者
3. **保护公主**：自己持有公主时，若手牌里有侍女 → 留侍女；否则考虑用国王/大臣/王子换手牌
4. **王子自用**：若手持公主 → 用王子弃自己公主再摸新牌
5. **男爵/国王**：随机选非侍女状态的存活玩家
6. **间谍 (b 路径)**：当手牌为 0~1 张且低牌 → 选 (b) 免疫

## 5. UI 布局

### SetupScreen
- 标题
- 玩家数量选择（1~5 AI）
- 「开始游戏」按钮

### Game
```
+-------------------------------------+
| GameHeader (回合数 / 牌库剩余 / 移除) |
+-------------------------------------+
|                                     |
|  PlayerArea (AI 5)                  |
|  PlayerArea (AI 4)                  |
|  PlayerArea (AI 3)                  |
|  PlayerArea (AI 2)                  |
|  PlayerArea (AI 1)                  |
|  +-----------------+                |
|  | TableCenter     |  GameLog       |
|  | 牌库/弃牌堆/移除|  (右侧侧栏)    |
|  +-----------------+                |
|  PlayerArea (人类玩家)              |
|  - 手牌（可点击出牌）               |
+-------------------------------------+
```

### 明牌规则
所有玩家手牌（人类 + AI）**全部明牌**显示在 UI 上。AI 手牌无底色"盖住"效果。

### GameOverModal
- 显示获胜者
- 出牌历史摘要
- 「再来一局」按钮

## 6. 日志格式

每条日志条目：
```
[回合 3] 玩家A 摸到 [国王]。手牌: 公主 / 国王
[回合 3] 玩家A 打出 [国王]，指定 玩家B。效果: 交换手牌。
[回合 3] 玩家B 新手牌: 大臣。玩家A 新手牌: 男爵。
[回合 3] 玩家A 弃 [国王] 入弃牌堆。
[回合 3] 胜负检查: 继续。
```

关键事件：
- `DRAW` 摸牌
- `PLAY` 出牌
- `TARGET` 指定目标
- `EFFECT` 效果执行
- `DISCARD` 弃牌
- `PROTECT` 免疫
- `ELIMINATE` 出局
- `GAME_OVER` 游戏结束

## 7. 技术栈

- Vite 8 + React 19 + TypeScript 6
- Tailwind 4（via @tailwindcss/vite）
- Zustand 5（状态管理）
- clsx（class 合并）
- 无后端，纯前端 SPA

## 8. 文件结构

```
src/
  types.ts          # Card, CardName, Player, GameState, LogEntry 类型
  gameLogic.ts      # 纯函数: initGame, playCard, 牌效果, 胜负判定
  ai.ts             # AI 决策
  store/
    gameStore.ts    # zustand store
  components/
    SetupScreen.tsx
    GameHeader.tsx
    PlayerArea.tsx
    TableCenter.tsx
    Card.tsx
    GameLog.tsx
    GameOverModal.tsx
  App.tsx
  main.tsx
  index.css
```

## 9. 状态机

```
SETUP → PLAYING → GAME_OVER → SETUP
```

回合内：
```
IDLE (回合开始) → MUST_DISCARD (强制女伯爵)
  → CHOOSE_CARD (选牌)
  → CHOOSE_TARGET (选目标, 若需要)
  → RESOLVE_EFFECT
  → CHECK_WIN
  → NEXT_TURN
```

特殊效果分支：
- 大臣：抽牌后进入 CHOOSE_DECK_OR_KEEP
- 王子：选目标后 RESOLVE（自动弃 + 摸）
- 间谍：摸牌后进入 SPY_KEEP_OR_PROTECT
- 公主：出牌时直接 ELIMINATE

## 10. 验收

- [ ] 选 1~5 AI 能开游戏
- [ ] 所有玩家手牌明牌显示
- [ ] 21 张牌开局移除 1 张
- [ ] 女伯爵强制规则生效
- [ ] 侍女/间谍(b) 免疫下一回合
- [ ] 公主出牌自爆
- [ ] 国王交换手牌
- [ ] 大臣抽 1 + 选 1 留 1
- [ ] 王子指定一玩家弃牌+摸牌
- [ ] 男爵比牌小者出局
- [ ] 僧侣查看手牌
- [ ] 守卫猜牌名对则出局
- [ ] 间谍看牌库顶+免疫选项
- [ ] 牌库耗尽比牌胜负
- [ ] 剩 1 人胜负
- [ ] 日志记录全过程
- [ ] AI 不出非法牌
- [ ] 浏览器跑通

## 11. 修订与对齐记录

追加章节。汇总代码已落地、但前 10 章未覆盖或不一致的所有非样式改动。

### 11.1 牌数值校准（修正第 2 章表）

| 牌名 | SPEC 原值 | 代码现值 |
|------|----------|---------|
| 公主 | 8 | 9 |
| 女伯爵 | 7 | 8 |
| 国王 | 6 | 7 |
| 大臣 | 5 | 6 |
| 王子 | 5 | 5（不变） |
| 侍女 | 4 | 4（不变） |
| 男爵 | 3 | 3（不变） |
| 神父 | 2 | 2（不变） |
| 卫兵 | 1 | 1（不变） |
| 间谍 | 0 | 0（不变） |

21 张总张数、开局移除 1 张剩 20 张 — 不变。

### 11.2 牌效果调整

**大臣**（取代第 2 章表内描述）
- SPEC 旧：摸 1 张牌，可从手中选 1 张放回牌库底，保留另一张
- 代码现：摸 **2** 张，从原手牌 1 张 + 抽到 2 张 共 3 张中选 **1** 张留手牌，其余按指定顺序放回牌库底
- 牌库只够抽 1 张时只放回 1 张，2 张都不够时直接结算（无牌可抽）
- 抽牌池为空时不下发选牌 UI，直接 advanceTurn

**间谍**（取代第 2 章表内描述）
- SPEC 旧：摸 1 张牌（牌库顶），选 (a) 放回牌库顶 或 (b) 弃该牌让自己本轮免疫
- 代码现：**无即时效果**。打出后标记 `usedSpy=true`；本局结算时
  - 唯一打出间谍且存活到最后的玩家 → +1 胜利标记
  - 多人打出间谍 → 无人得奖励
- 第 3 章「免疫失效」中"间谍(b 路径)"已不存在，**只剩侍女提供免疫**

**王子**（追加第 2 章表内描述）
- 附加规则：王子是最后一张牌打出后，若牌库已空 → 从开局 `removed` 堆拿 1 张牌给目标
- `removed` 也空 → 目标无牌可摸，log 记录

### 11.3 多局制 + 胜利标记

第 3 章「胜负判定」改为多局累计：

**胜利标记目标（`targetTokens`）**
- 2 人局：3 个
- 3-4 人局：4 个
- 5-6 人局：5 个

**单局胜负**（任一触发 → `endRound`）
- 仅剩 1 存活玩家 → 该玩家 +1
- 牌库摸完时进入 `FINAL_REVEAL` 亮牌动画
  - 持牌数值最大者 +1
  - 数值相同（平局）→ 平局玩家各 +1
- 全部存活玩家均死亡 → 无人 +1，本局无胜者

**全局胜利**
- 任何玩家 `tokens >= targetTokens` → `phase = GAME_OVER`
- 未达成 → 自动 `startNextRound`：回收 deck + discard + removed + removedPublic + 玩家手牌 全部洗牌重发，暗抽 1 张作新 removed，重置 alive/hand/protected/usedSpy

**公主自爆**
- 公主打出仅令出牌者出局，**不**触发单局胜负（除非因此变成剩 1 人）

### 11.4 神父查看 → 翻牌动画

- 人类施法 → 进入 `PRIEST_REVEAL` 阶段，暂停推进
- 翻牌动画：背面 → 旋转 180° 展示目标手牌 → 旋转回背面，共 3s
- 用户点空白 / 等自动结束 → 调 `priestRevealDismissAction` 推进
- AI 施法：跳过动画，直接 `advanceTurn`

### 11.5 牌库耗尽 → 亮牌动画

- `advanceTurn` 检测 `deck.length === 0` → 计算胜者 → 进入 `FINAL_REVEAL`
- 亮牌动画：所有存活玩家手牌同时翻牌，胜者牌加 ring + pulse 高亮
- 3.5s 后用户点空白 / 自动结束 → 调 `finalRevealAction` 真正结算本局（`endRound` → 检查全局胜利 → `startNextRound`）

### 11.6 目标线动画

- 选目标阶段（`PRINCE/KING/BARON/PRIEST/GUARD` 任一）显示从出牌者 DOM 中心到目标 DOM 中心的动画线
- 包含：阴影线 + 发光主线（CSS draw 动画 0.45s） + 起点脉冲 + 终点爆炸 + 粒子飞行
- 选完目标后 250ms 延时展示，给 UI 选中动画留缓冲
- `pendingTargetId` 变化时重启动画（`lineKey`）

### 11.7 日志私密内容

`LogEntry` 新增 `secret?: string` + `knownBy?: number[]`：

- `secret` 仅对 `knownBy` 内的玩家可见
- 其他玩家看到 `**` 遮蔽
- 完整内容含 `secret` 写浏览器控制台（调试用）
- 鼠标 hover 遮蔽条目提示「被遮蔽的内容在浏览器控制台有完整记录」

私密内容场景：
- 摸牌结果 → 仅本人
- 抽到/被弃牌 → 仅本人
- 大臣选牌结果 → 仅本人
- 神父查看 → 仅出牌者
- 国王交换 → 仅涉事双方 + 人类
- 男爵比牌 → 仅涉事双方 + 人类
- 玩家出局手牌 → 仅人类出局时公开，否则私密

### 11.8 状态机扩展

第 9 章追加阶段：

- `CHANCELLOR_DISCARD` — 大臣：3 张中选 1 张留手牌，其余按指定顺序放牌库底
- `PRIEST_REVEAL` — 神父：人类查看后翻牌动画阶段，等用户 dismiss 才推进
- `FINAL_REVEAL` — 牌库耗尽：所有存活玩家亮牌动画阶段，等用户 dismiss 才结算

`PendingState` 字段：
- `chancellorDrawn?: Card[]` — 大臣抽到的 2 张
- `priestRevealed?: { targetId; card: Card | null }` — 神父翻牌动画上下文
- `finalReveal?: { winnerId; reason; tiedIds? }` — 亮牌结算上下文

### 11.9 关键修复记录

| 提交 | 类别 | 改动 |
|------|------|------|
| 0712b16 | API 重构 | `eliminatePlayer` 改用 `opts` 对象传 `reasonSecret` / `reasonKnownBy` / `card`，所有调用点同步 |
| 2a7d148 | bug | 弃牌按玩家分组归属显示；摸牌后手牌上限校验 |
| 36be50f | 规则+UI | 译名统一「伯爵夫人」→「女伯爵」；牌库耗尽亮牌流程；目标线动画 |
| ea433b9 | feature | 神父人类施法时 PRIEST_REVEAL 翻牌交互 |
| 32fbe95 | 规则 | 王子是最后一张牌打出且牌库空 → 从 removed 堆拿牌 |
| 7c10a21 | 规则 | 新增 `removed` 字段；`initGame` 暗抽 1 张作开局移除 |
| abf7b24 | 规则 | 跟踪 `usedSpy` 字段，局末结算间谍奖励 |
| acaf6dd | bug | `checkSpyBonus` / `checkWinCondition` 条件修正 |
| 909b8e6 | bug | `handlePrince` 改用 immutable 模式处理 `removed` |
| b00c818 | bug | `setupGame` 改用 immutable 模式 |
| c1da245 | bug | `drawTwoCards` 牌库不足时的容错 |
| 21c87f6 | 类型+bug | GameState 新增 `removed` / `removedPublic` / `targetTokens` / `usedSpy`；`drawCard` 边界 |
| dfbb4ef | bug | 大臣 UI 改为三槽位（最底/次底/第三底）选牌放回 |
| 4271364 | 重构 | 统一 AI 与 Human 的 turn 流程 |
| 4854a40 | 重构 | 大型重构：间谍奖励 / 多局制 / 目标标记 / removed 堆 等 |

### 11.10 AI 行为对齐（第 4 章补充）

- **强制伯爵夫人**：`mustPlayCountess` 检查 + `canPlayCard` 校验，非伯爵夫人不可出
- **持公主**：优先出王子自指弃公主摸新牌；无王子 → 大臣换手；无大臣 → 国王交换；无国王 → 卫兵猜人；无卫兵 → 间谍（标记 usedSpy）
- **侍女策略**：手牌 ≥ 2 且另一张 `value >= 3`（有高牌）→ 留侍女出其他；否则侍女优先出保护自己
- **卫兵猜牌**：按公开弃牌 + removed 剩余分布权重采样，排除卫兵和已知手牌
- **王子自指**：持公主 → 用王子弃自己
- **男爵/国王/神父/卫兵目标**：从 `alive && !protected && id !== self` 中随机选；无候选时效果无效直接 `advanceTurn`
- **大臣选牌**：留最强牌（含公主），其余按 `value` 升序放牌库底（最弱先放）
- **AI 记忆**：`buildMemory(state)` 实时构建 `remaining[牌名]`，覆盖 deck + discard + removed + removedPublic + 玩家手牌

### 11.11 出局处理

`eliminatePlayer(state, playerId, reason, opts?)`：
- `alive = false`，手牌全部入 `discard`（带 `playerId` 归属）
- `handSecret`：手牌内容字符串，仅人类出局时进 `knownBy` 公开
- `reasonSecret` / `reasonKnownBy`：可选外部补充
- `usedSpy` 不因公主自爆 / 被王子弃而误算（出局时直接清空 `usedSpy`？— 代码现行为：出局不重置 `usedSpy`，间谍奖励判定基于本局是否唯一打出者存活）

### 11.12 摸牌规则

- 玩家手牌上限 2：回合开始 `if (hand.length < 2 && deck.length > 0)` 才摸
- 摸空（`drawOne` 返回 null）→ log "牌库为空" 结束回合，`advanceTurn` 检测触发牌库耗尽流程
- 王子指定 → 牌库空 → 走 11.2 王子附加规则

### 11.13 文件结构对齐（第 8 章补充）

实际多出：
- `components/TargetLine.tsx` — 目标线动画
- `components/GameLog.tsx` — 日志组件（含私密遮蔽）
- `components/GameOverModal.tsx`
- `hooks/useMediaQuery.ts` — 移动端断点判断
- `store/gameStore.ts` — zustand store

### 11.14 UI 元素

第 5 章补充：
- **GameHeader**：回合 `round·turn`、牌 `deck.length`、弃 `discard.length`、移 `removed.length`、🎯 `targetTokens`
- **PlayerArea**：座号圆形 chip（人类=琥珀色，AI=灰色），手牌 `peekOnHover` 鼠标悬浮翻牌，已打 `usedSpy` 🕵 图标，被保护 🛡 图标，出局/存活样式
- **TableCenter**：牌库顶（小图，倒数 3 张 removed 可 hover 翻看；`removedPublic` 强制正面），明牌区"hover 看牌"提示
- **PriestRevealDialog**：神父翻牌弹窗（人类专属）
- **FinalRevealDialog**：牌库耗尽亮牌弹窗（全局 + 胜者高亮）
- **ChancellorDialog**：三槽位选牌放回 UI
- **GuardGuessDialog**：卫兵猜牌 9 选 1
- **目标线**：详见 11.6
