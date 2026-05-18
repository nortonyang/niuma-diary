# 阶段与子任务文档：REQ-1303 连续打卡

## 阶段目的

计算并展示用户的连续打卡天数，增强用户粘性，并提供连续打卡分享卡。

## 依赖

- 需求文档：`docs/future-development-requirements.md` (REQ-1303)
- 现有逻辑：`utils/calculations.js`, `utils/storage.js`
- 现有页面：`pages/today/today`, `pages/share/share`

## 子任务

| 子任务 | 交付结果 | 原子任务 | 状态 |
| --- | --- | --- | --- |
| ST-001 连续打卡算法 | `utils/calculations.js` 支持 `calculateStreak` | AT-001 | 已完成 |
| ST-002 首页展示打卡天数 | `pages/today/today` 展示当前连续天数 | AT-002 | 已完成 |
| ST-003 连续打卡分享卡 | `utils/share-card-renderer.js` 支持 `renderStreakCard` | AT-003 | 已完成 |
| ST-004 分享页集成 | `pages/share/share` 支持 `streak` 类型 | AT-004 | 已完成 |

## AT-001：连续打卡算法

### 范围

- 在 `utils/calculations.js` 中新增 `calculateStreak(records, today)`。

### 验收标准

- Given 今天有记录，昨日有记录，返回 2。
- Given 今天无记录，昨日有记录，返回 1（宽容今天还没打卡）。
- Given 今天无记录，昨日无记录，返回 0。
- Given 跨月连续打卡，能正确计算天数。

## AT-002：首页展示打卡天数

### 范围

- 修改 `pages/today/today.js` 和 `today.wxml`。
- 在顶部或打卡区域显示“已连续打卡 X 天”。

### 验收标准

- 页面加载时正确显示连续打卡天数。
- 打卡成功后，天数实时更新。

## AT-003：连续打卡分享卡

### 范围

- 在 `utils/share-card-config.js` 增加 `streak` 配置。
- 在 `utils/share-card-renderer.js` 实现 `renderStreakCard`。

### 验收标准

- 生成的卡片展示“连续打卡 X 天”及其对应的勋章或文案。
- 脱敏处理，不展示具体日期和记录内容。

## AT-004：分享页集成

### 范围

- 在 `pages/share/share.js` 中集成 `streak` 类型。
- 允许用户从首页点击进入连续打卡分享页。

### 验收标准

- 用户能看到并切换到连续打卡分享卡。
- 保存成功后提示“已保存连续打卡卡”。

## 验证结果

- `node --check utils/calculations.js`: 通过
- `node --check pages/today/today.js`: 通过
- `node --check pages/share/share.js`: 通过
- `git diff --check`: 通过
