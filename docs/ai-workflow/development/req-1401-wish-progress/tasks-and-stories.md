# 阶段与子任务文档：REQ-1401 愿望进度与重点愿望

## 阶段目的

为愿望增加进度管理功能，并支持设置一个“重点愿望”在首页展示，强化“退路”的引导作用。

## 依赖

- 需求文档：`docs/ai-workflow/future-development-requirements.md` (REQ-1401)
- 现有逻辑：`utils/storage.js`, `utils/constants.js`
- 现有页面：`pages/wishes/wishes`, `pages/today/today`

## 子任务

| 子任务 | 交付结果 | 原子任务 | 状态 |
| --- | --- | --- | --- |
| ST-001 愿望模型扩展 | `storage.js` 支持 `progressStatus` 和 `pinned` | AT-001 | 待处理 |
| ST-002 愿望编辑支持进度 | `pages/wishes/wishes` 支持设置状态 | AT-002 | 待处理 |
| ST-003 重点愿望设置 | 支持在愿望列表置顶/取消置顶重点愿望 | AT-003 | 待处理 |
| ST-004 首页展示重点愿望 | `pages/today/today` 展示置顶愿望及进度 | AT-004 | 待处理 |

## AT-001：愿望模型扩展

### 范围

- `utils/constants.js` 增加 `WISH_STATUSES`。
- `utils/storage.js` 的 `normalizeWish` 包含新字段。
- `saveWish` 确保最多只有一个 `pinned` 为 true 的愿望。

### 验收标准

- 愿望对象包含 `progressStatus` (todo|doing|done|paused)。
- 愿望对象包含 `pinned` (boolean)。

## AT-002：愿望编辑支持进度

### 范围

- 愿望编辑弹窗增加“进度”选择器。
- 愿望项展示当前状态标签。

## AT-003：重点愿望设置

### 范围

- 愿望项增加“设为重点”/“取消重点”操作。
- 设置新重点时，自动取消旧重点。

## AT-004：首页展示重点愿望

### 范围

- 首页打卡按钮下方或适合位置展示重点愿望。
- 点击可跳转到愿望页。
