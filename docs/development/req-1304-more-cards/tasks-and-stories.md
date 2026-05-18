# 阶段与子任务文档：REQ-1304 更多分享卡主题

## 阶段目的

丰富打卡成就以外的分享内容，包括愿望卡和冷静器结果卡。

## 依赖

- 需求文档：`docs/future-development-requirements.md` (REQ-1304)
- 现有页面：`pages/wishes/wishes`, `pages/calm/calm`, `pages/share/share`

## 子任务

| 子任务 | 交付结果 | 原子任务 | 状态 |
| --- | --- | --- | --- |
| ST-001 愿望分享卡渲染 | `utils/share-card-renderer.js` 支持 `renderWishCard` | AT-001 | 已完成 |
| ST-002 冷静器结果卡渲染 | `utils/share-card-renderer.js` 支持 `renderCalmCard` | AT-002 | 已完成 |
| ST-003 分享页支持新卡片 | `pages/share/share` 集成 `wish` 和 `calm` 类型 | AT-003 | 已完成 |
| ST-004 愿望页增加分享入口 | `pages/wishes/wishes` 支持分享单个愿望 | AT-004 | 已完成 |
| ST-005 冷静器增加分享入口 | `pages/calm/calm` 支持分享计算结果 | AT-005 | 已完成 |

## AT-001：愿望分享卡渲染

### 范围

- `utils/share-card-config.js` 增加 `wish` 类型。
- `utils/share-card-renderer.js` 实现 `renderWishCard(page, wish)`。

### 验收标准

- 卡片展示愿望标题、分类、第一小步。
- 视觉风格延续现有模板，脱敏处理。

## AT-002：冷静器结果卡渲染

### 范围

- `utils/share-card-config.js` 增加 `calm` 类型。
- `utils/share-card-renderer.js` 实现 `renderCalmCard(page, result)`。

### 验收标准

- 卡片展示冷静器结论标题和建议。
- 展示“高压检测”百分比。

## AT-003：分享页支持新卡片

### 范围

- `pages/share/share.js` 支持 `wish` 和 `calm` 类型。
- 动态加载对应数据进行渲染。

## AT-004：愿望页增加分享入口

### 范围

- 在愿望项上增加“分享”按钮或图标。
- 点击跳转到分享页并携带愿望 ID。

## AT-005：冷静器增加分享入口

### 范围

- 在结果区域增加“分享结论”按钮。
- 点击跳转到分享页并携带当前结论数据。

## 验证结果

- `node --check utils/share-card-renderer.js`: 通过
- `node --check pages/share/share.js`: 通过
- `node --check pages/wishes/wishes.js`: 通过
- `node --check pages/calm/calm.js`: 通过
- `git diff --check`: 通过
