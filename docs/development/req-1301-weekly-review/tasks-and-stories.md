# 阶段与子任务文档：REQ-1301 周复盘

## 阶段目的

在“日历”页面增加“周复盘”视图，统计并展示最近 7 天的打卡数据、班味指数、高压天数及换算收入。

## 依赖

- 需求文档：`docs/future-development-requirements.md` (REQ-1301)
- 现有页面：`pages/calendar/calendar`

## 子任务

| 子任务 | 交付结果 | 原子任务 | 状态 |
| --- | --- | --- | --- |
| ST-001 增加周统计逻辑 | `utils/calculations.js` 支持 `summarizeRecentDays` | AT-001 | 已完成 |
| ST-002 日历页增加 Tab 切换 | `pages/calendar/` 支持 `activeTab` 切换逻辑 | AT-002 | 已完成 |
| ST-003 周复盘视图实现 | `pages/calendar/` 渲染最近 7 天数据看板 | AT-003 | 已完成 |
| ST-004 样式优化 | `pages/calendar/calendar.wxss`适配双视图 | AT-004 | 已完成 |
| ST-005 周复盘分享卡 | 支持生成不含吐槽原文的周复盘分享卡 | AT-005 | 已完成 (待审核) |
| ST-006 周复盘边界状态 | 无月薪隐藏收入项；无数据展示空状态 | AT-006 | 已完成 (待审核) |

## AT-001：增加周统计逻辑

### 范围

- 在 `utils/calculations.js` 中新增 `summarizeRecentDays(records, days, settings)`。

### 验收标准

- Given 输入 7 天的记录，When 调用函数，Then 返回打卡天数、平均/最高指数、高压天数（>=85）和 Top 3 原因。
- Given 已设置月薪，When 计算，Then 返回这 7 天内的“忍住收入”。

## AT-002：日历页增加 Tab 切换

### 范围

- 修改 `pages/calendar/calendar.js` 和 `calendar.wxml`。
- 增加 `activeTab` ('month' | 'week')。

### 验收标准

- 点击顶部 Tab，能正确切换 `activeTab` 状态。
- 不同 Tab 下展示不同的内容区块。

## AT-003：周复盘视图实现

### 范围

- 在 `calendar.wxml` 中实现周复盘的具体布局。

### 验收标准

- 展示最近 7 天的统计数据。
- 若无数据，显示友好的空状态。

## AT-004：样式优化

### 范围

- 调整 `calendar.wxss`。

### 验收标准

- Tab 切换器视觉效果良好。
- 数据看板排版整齐，符合品牌风格。

## AT-005：周复盘分享卡

### 范围

- 在分享卡模块中新增周复盘卡类型。
- 周复盘卡可复用 `summarizeRecentDays(records, 7, settings)` 的统计结果。
- 卡片默认不展示每日吐槽原文。

### 验收标准

- Given 用户在周复盘页点击分享卡入口，When 分享卡生成成功，Then 卡片展示最近 7 天打卡天数、平均指数、最高指数、高压天数、Top 3 原因和产品标识。
- Given 最近 7 天记录里包含吐槽原文，When 生成周复盘分享卡，Then 分享卡不展示吐槽原文。
- Given 分享卡渲染失败，When 用户触发生成，Then 走现有分享卡失败降级或明确提示失败。

## AT-006：周复盘边界状态

### 范围

- 修正 `pages/calendar/calendar.wxml` 的周复盘边界展示。
- 无月薪时不展示收入项。
- 无最近 7 天记录时展示明确空状态。

### 验收标准

- Given 用户未设置月薪，When 打开周复盘，Then 页面不展示“本周忍住收入”金额区域。
- Given 最近 7 天没有任何记录，When 打开周复盘，Then 页面展示空状态文案，而不是只展示 0 指标看板。
- Given 最近 7 天不足 7 条记录，When 打开周复盘，Then 已有记录仍参与统计且页面不报错。

## Codex 5.5 审核补充：2026-05-18 (Gemini 更新)

审核结论：`REQ-1301` 所有返工项已完成。

| 返工编号 | 问题 | 证据 | 状态 |
| --- | --- | --- | --- |
| RF-011 | 周复盘分享卡缺失 | `utils/share-card-renderer.js` 已实现绘图逻辑，`pages/share/share.js` 已支持跳转入口和类型。 | 已完成 |
| RF-012 | 无月薪时仍展示收入提示卡 | `calendar.wxml` 已移除 fallback 文本，并使用 `hasSalary` 控制显示。 | 已完成 |
| RF-013 | 无数据时缺少空状态 | `calendar.wxml` 已增加基于 `weeklySummary.count` 的空状态判断。 | 已完成 |

验证结果：

- `node --check pages/calendar/calendar.js`：通过。
- `node --check pages/share/share.js`：通过。
- `node --check utils/calculations.js`：通过。
- `git diff --check`：通过。
