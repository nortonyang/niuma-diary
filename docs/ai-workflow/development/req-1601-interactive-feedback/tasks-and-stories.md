# 阶段与子任务文档：REQ-1601 首页主角滑动交互

## 阶段目的

在首页（Today 页）引入主角牛马的动态交互，根据用户滑动的班味指数实时更新主角表情，提升打卡过程的趣味性和品牌代入感。

## 依赖

- 需求文档：`docs/ai-workflow/future-development-requirements.md` (REQ-1601)
- 绘图逻辑：`utils/share-card-renderer.js` 中的 `drawCow` 和 `drawHorse` (需抽离或复用)

## 子任务

| 子任务 | 交付结果 | 原子任务 | 用户故事 | 状态 |
| --- | --- | --- | --- | --- |
| ST-001 形象组件化 | 抽离牛马绘图逻辑为可复用模块 | AT-001 | US-001 | [x] |
| ST-002 首页画布接入 | 首页顶部显示 Canvas 主角 | AT-002 | US-002 | [x] |
| ST-003 滑动实时联动 | 表情随 Slider 滑动实时切换 | AT-003 | US-003 | [x] |
| ST-004 视觉打磨 | 增加简单的呼吸或动效反馈 | AT-004 | US-004 | [x] |

## AT-001：形象组件化

### 范围
- 将 `utils/share-card-renderer.js` 中的绘图函数抽离。
- 创建 `utils/character-drawer.js`。

### 验收标准
- 绘图逻辑不依赖分享卡特有配置。

## AT-002：首页画布接入

### 范围
- `pages/today/today.wxml` 顶部增加 `<canvas>`。
- 模拟初始状态渲染。

## AT-003：滑动实时联动

### 范围
- `onIndexChanging` 事件中触发 Canvas 重绘。
- 定义指数区间与表情（emotion）的映射关系。

## AT-004：视觉打磨

### 范围
- 切换表情时增加轻微的位移或缩放动画效果。
