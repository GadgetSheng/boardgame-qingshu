# 情书 (Love Letter) - Bug修复 + 功能重构设计

**日期**: 2026-05-17
**状态**: 待评审

---

## 1. 问题清单

### 1.1 Bug修复

| # | 位置 | 问题 |
|---|------|------|
| 1 | `setupGame` | 开局没有从牌堆移出1张牌 |
| 2 | `GameState` | 缺少 `removedCard: CardName \| null` 字段 |
| 3 | `handlePrince` | 最后玩家被王子指定时没有使用移出牌 |
| 4 | `drawCard` | deck空时错误设置 `hand = null`，应保留原手牌 |
| 5 | `checkWinCondition` | 错误使用 `every(p => p.hand !== null)` 判断游戏结束 |
| 6 | AI vs Human turn flow | 两套完全不同逻辑，状态泄漏到UI层 |
| 7 | `checkSpyBonus` | 每个Spy给所有玩家+1，而非每个玩家独立统计 |
| 8 | SPEC.md | "不能猜守卫/间谍" → "不能猜守卫" |

### 1.2 新功能

| # | 功能 | 描述 |
|---|------|------|
| 9 | 记牌器 | 侧边栏显示弃牌堆卡牌数量，按点数分组 |
| 10 | 多轮制 | 游戏多轮进行，tokens累积，先到指定积分获胜 |
| 11 | 积分显示 | 每名角色积分用❤️emoji表示 |
| 12 | 操作日志 | 取消截断，全部显示 |

---

## 2. 规则确认

### 2.1 开局

- 洗牌后，移出1张牌（隐藏），不参与游戏
- 每人发1张手牌

### 2.2 王子指定最后玩家

- 正常王子：目标弃手牌，从牌堆抽1张
- **王子指定唯一存活玩家（除自己外）**：目标弃手牌，抽取开局移出的牌

### 2.3 抽牌阶段

- 玩家从牌堆抽1张，手里有2张
- **若牌堆空（抽牌后）**：直接进入最终结算，比较点数

### 2.4 每轮结算

- 牌堆空 → 立即结算当前轮
- 比较所有存活玩家手牌点数
- 最大者+1分（平局无人得分）
- 间谍奖励：唯一在弃牌堆中有Spy的玩家+1分

### 2.5 游戏结束

- 先获得 **4分** 的玩家获胜
- 触发条件：某玩家tokens >= 4

### 2.6 Guard猜牌

- 不能猜守卫(Guard)
- 允许猜间谍(Spy)和其他所有牌

### 2.7 操作日志

- 显示完整历史，不截断

---

## 3. 重构方案

### 3.1 统一Turn流程

**现状问题：**
- 人类：依赖 `useEffect` + `autoDrawIfNeeded` + UI状态控制
- AI：在 `executeAITurn` 循环中手动调用

**重构目标：**
```
takeTurn() = 抽牌 → 出牌 → 结算 → 检查结束 → 下一玩家
```

**实现：**
1. `playCard` 内部处理 `handChoices`（Chancellor抽2选1）
2. 选择完成后继续结算流程，不返回 `handChoices` 让外部处理
3. AI的 `useEffect` 只负责检测轮到AI时触发 `takeAITurn`

### 3.2 新增状态字段

```typescript
interface GameState {
  // ... existing fields
  removedCard: CardName | null;  // 新增：开局移出的牌
  targetTokens: number;          // 新增：获胜所需积分，默认4
}
```

### 3.3 新增记牌器UI

侧边栏显示弃牌堆卡牌：
- 按点数分组显示每种卡牌已打出数量
- 格式：`守卫 x3, 牧师 x1, ...`

### 3.4 积分显示

每位玩家显示：名字 + ❤️x数字

---

## 4. 实现顺序

1. **数据层修复**：Bug 2,4,5,7（GameState新增removedCard、drawCard修复、checkWinCondition修复、checkSpyBonus修复）
2. **开局移牌**：Bug 1,3（setupGame移牌、handlePrince特殊处理）
3. **重构turn流程**：Bug 6（统一AI/Human逻辑）
4. **UI更新**：Feature 9,10,11,12（记牌器、多轮制、积分显示、日志不截断）
5. **更新SPEC.md**：Bug 8

---

## 5. 待确认

无，所有问题已确认。