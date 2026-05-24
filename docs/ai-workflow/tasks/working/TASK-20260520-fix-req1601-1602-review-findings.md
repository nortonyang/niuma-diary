---
taskId: TASK-20260520-fix-req1601-1602-review-findings
status: done
phase: req1601-req1602-review-rework
createdAt: 2026-05-20T00:00:00+08:00
focusFiles:
  - utils/share-card-renderer.js
  - pages/share/share.js
  - pages/today/today.js
  - pages/today/today.wxml
  - pages/today/today.wxss
  - pages/calendar/calendar.js
  - pages/calendar/calendar.wxml
  - pages/calendar/calendar.wxss
  - pages/wishes/wishes.js
  - pages/wishes/wishes.wxml
  - pages/wishes/wishes.wxss
  - pages/checklist/checklist.js
  - pages/checklist/checklist.wxml
  - pages/checklist/checklist.wxss
  - assets/images/share-cards/
  - project.config.json
---

# Gemini 返工任务：修复 REQ-1601/REQ-1602 审核问题

任务 ID：`TASK-20260520-fix-req1601-1602-review-findings`

执行方：Gemini

审核方：Codex 5.5

## 背景

当前工作区包含新开发的 `REQ-1601 首页主角滑动交互` 和 `REQ-1602 全局空状态插画`。Codex 审核发现该批变更不能通过，必须先返工再复审。

本任务只修复审核发现的问题，不新增需求，不做无关重构。

## 必须修复的问题

### RF-1601-001：连续打卡分享卡导出函数被改坏

严重级别：P1

证据：

- `utils/share-card-renderer.js` 当前导出：
  - `renderStreakCard: streak => renderStreakCard(null, streak)`
- `pages/share/share.js` 调用：
  - `renderer.renderStreakCard(this, streak)`

影响：

- `page` 参数被丢成 `null`，真实 `streak` 参数被错位。
- 连续打卡分享卡动态渲染会失败、降级或显示错误内容。

修复要求：

- 恢复 `renderStreakCard` 的正确导出签名，必须支持 `renderer.renderStreakCard(this, streak)`。
- 不破坏其他卡片类型。
- 不把错误注释保留在代码中。

### RF-1601-002：提交前 whitespace 检查失败

严重级别：P2

证据：

- `git diff --check` 报告 `utils/share-card-renderer.js` 多处 trailing whitespace。

修复要求：

- 清理所有 trailing whitespace。
- `git diff --check` 必须通过。

### RF-1602-001：资源体积回归

严重级别：P2

证据：

- `assets/images/share-cards/success_cheer.jpg` 约 1.7M。
- `assets/images/share-cards/` 当前约 3.0M。
- 这与 `REQ-2004 资源体积控制` 方向冲突。

修复要求：

- 压缩或替换超大资源，尤其是 `success_cheer.jpg`。
- 如果成功弹窗可以用 Canvas 或现有轻量资源实现，优先减少新增大图依赖。
- 保持视觉功能，但不得显著增加小程序包体。
- 更新相关文档说明最终资源策略。

### RF-1601-003：范围外本地配置污染

严重级别：P3

证据：

- `project.config.json` 新增 `simulatorPluginLibVersion`。
- 该配置与 `REQ-1601/REQ-1602` 无直接关系，疑似微信开发者工具本地状态。

修复要求：

- 移除该无关配置，除非能证明它是运行新需求的必要代码配置。
- 保持 `project.config.json` 不引入本地开发环境噪音。

## 需要保留的目标功能

- `REQ-1601`：首页顶部 Canvas 主角展示区域，随“班味指数”滑动实时切换表情。
- `REQ-1602`：日历、愿望和清单页面空状态显示轻量牛马插画。

如果为修复资源体积需要调整成功弹窗图片方案，可以替换为轻量图片、Canvas 绘制或移除非必要大图，但不能影响打卡保存主流程。

## 禁止事项

- 不要扩大到 iOS、AI、社区、付费等范围外功能。
- 不要重复改写已完成的云同步、提醒、愿望、分享卡主链路。
- 不要提交 Gemini 运行产物中的无关日志文件，除非 Codex 明确要求保留。
- 不要把人工真机验证写成已自动验证。

## 验证命令

必须执行并回传结果：

```sh
node --check pages/today/today.js
node --check pages/calendar/calendar.js
node --check pages/wishes/wishes.js
node --check pages/checklist/checklist.js
node --check pages/share/share.js
node --check utils/share-card-renderer.js
node --check utils/share-card-config.js
node --check utils/character-drawer.js
git diff --check
du -sh assets/images/share-cards
ls -lh assets/images/share-cards
```

## 交付物

Gemini 完成后必须输出：

1. 变更文件列表。
2. 每个 RF 项的修复说明。
3. 验证命令与结果。
4. 资源体积变化前后对比。
5. 是否仍需真机或微信开发者工具人工验证。

## 完成标准

- 连续打卡分享卡恢复正常动态渲染。
- `git diff --check` 通过。
- 超大图片资源已压缩、替换或移除。
- `project.config.json` 不再包含无关本地配置。
- Codex 可重新审核并判断是否通过。
