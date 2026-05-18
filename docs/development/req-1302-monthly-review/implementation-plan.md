# 具体开发方案：REQ-1302 月复盘

## 开发方案

| 步骤 | 工作内容 | 负责人 | 文件或区域 | 验证方式 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 1 | 补齐月度统计模型，包含最高指数日期、连续高压最长天数和月度收入 | Gemini | `utils/calculations.js`, `utils/date.js` | `node --check utils/calculations.js` | 已完成 (待审核) |
| 2 | 在日历页增加月复盘视图或入口，复用现有月份切换 | Gemini | `pages/calendar/calendar.js`, `pages/calendar/calendar.wxml`, `pages/calendar/calendar.wxss` | `node --check pages/calendar/calendar.js`，微信开发者工具人工验证 | 已完成 (待审核) |
| 3 | 增加月度报告图类型，默认不展示吐槽原文、月薪等敏感内容 | Gemini | `pages/share/share.js`, `pages/share/share.wxml`, `pages/share/share.wxss`, `utils/share-card-config.js`, `utils/share-card-renderer.js` | `node --check pages/share/share.js`，分享卡人工保存验证 | 已完成 (待审核) |
| 4 | 同步更新需求完成度和本开发目录审核基础材料 | Gemini | `docs/future-development-requirements.md`, `docs/development/req-1302-monthly-review/` | 文档检查 | 已完成 (待审核) |

## 完成度

| 项目 | 完成度 | 证据 | 备注 |
| --- | ---: | --- | --- |
| REQ-1302 月复盘 | 100% | 已实现完整月统计、日历页月复盘展示及月度分享卡 | 待审核 |
| 月度统计模型 | 100% | `summarizeMonth` 已包含完整字段 | 待审核 |
| 月复盘页面展示 | 100% | `pages/calendar` 已集成月复盘视图及空状态 | 待审核 |
| 月度报告图 | 100% | `monthly` 分享卡类型已实现 | 待审核 |

## 要修复的问题

| 问题 | 严重级别 | 关联用户故事 | 修复方案 | 状态 |
| --- | --- | --- | --- | --- |
| 月复盘统计字段不足 | P2 | US-001 | 扩展 `summarizeMonth` | 已修复 |
| 月历页没有完整月复盘视图 | P2 | US-002 | 在 `pages/calendar` 增加月复盘展示 | 已修复 |
| 没有月度报告图 | P2 | US-003 | 新增 `monthly` 分享卡类型 | 已修复 |

## 具体案例

| 案例 | 输入或上下文 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| 月份切换 | 2026 年 5 月和 2026 年 6 月各有不同记录 | 切换月份后月复盘统计随当前月份变化 | 微信开发者工具人工验证 |
| 最高指数日期 | 当前月多条记录，最高指数出现在 5 月 12 日 | 月复盘展示最高指数和对应日期 | 本地模拟或人工构造数据 |
| 连续高压 | 当前月存在连续 3 天 `quitIndex >= 85` | 月复盘展示最长连续高压 3 天 | 本地模拟或人工构造数据 |
| 无记录 | 当前月份没有任何记录 | 月复盘展示空状态，不显示 0 指标误导用户 | 微信开发者工具人工验证 |
| 无月薪 | 用户未设置月薪 | 页面和报告图不展示月度收入项 | 人工验证 |
| 报告图脱敏 | 当前月记录包含 `note` 吐槽原文 | 月度报告图只展示聚合统计，不展示吐槽原文、月薪 | 代码检查和人工保存验证 |

## Gemini 开发交接

你将根据已经批准的敏捷规划文档实现代码。

事实来源：

- `docs/future-development-requirements.md` 的 `REQ-1302 月复盘`
- `docs/development/req-1302-monthly-review/implementation-plan.md`
- 当前代码：`pages/calendar/`, `pages/share/`, `utils/calculations.js`, `utils/share-card-renderer.js`

实现范围：

- 完成 `REQ-1302`：当前月份月复盘、连续高压最长天数、最高班味日期、最常见原因、月度忍住收入、月份切换后统计更新、无记录空状态、月度报告图保存。
- 可以复用现有日历页月份切换，不新增独立 `pages/report`，除非现有结构无法承载。
- 新增月度报告图类型时沿用现有 `weekly` 分享卡的模式，类型建议为 `monthly`。

约束：

- 不修改无关文件。
- 不新增云函数。
- 不引入第三方依赖。
- 不展示吐槽原文、月薪原始值等敏感内容到月度报告图。
- 保持现有微信小程序原生代码风格，继续使用 CommonJS 和当前 `wx` API。
- 兼容旧记录：缺少 `quitIndex`、`reasons` 或日期字段时不能报错。
- 当前工作树已有未提交改动，不要回退或覆盖无关改动。

验收标准：

- 月份切换后，月复盘统计和月历当前月份一致。
- 当前月有记录时展示打卡天数、平均班味指数、最高班味日期、连续高压最长天数、最常见原因。
- 用户设置月薪时展示月度忍住收入；未设置月薪时不展示收入项。
- 当前月没有记录时展示友好的空状态。
- 月度报告图可保存，并且不展示吐槽原文、月薪原始值或其他敏感明细。
- 分享卡渲染失败时沿用现有降级策略，不阻塞页面使用。

预期改动区域：

- `utils/calculations.js`
- `utils/share-card-config.js`
- `utils/share-card-renderer.js`
- `pages/calendar/calendar.js`
- `pages/calendar/calendar.wxml`
- `pages/calendar/calendar.wxss`
- `pages/share/share.js`
- `pages/share/share.wxml`
- `pages/share/share.wxss`
- `docs/future-development-requirements.md`
- `docs/development/req-1302-monthly-review/`

需要运行的验证：

```bash
node --check utils/calculations.js
node --check utils/share-card-config.js
node --check utils/share-card-renderer.js
node --check pages/calendar/calendar.js
node --check pages/share/share.js
git diff --check
```

需要人工验证：

- 微信开发者工具打开日历页，切换月历和周复盘仍可用。
- 切换上月和下月后，月复盘统计随月份变化。
- 当前月无记录时显示空状态。
- 未设置月薪时页面和报告图不展示收入项。
- 点击月度报告图保存入口后，生成图片不展示吐槽原文。

返回内容：

- 变更文件列表。
- 实现摘要。
- 验证命令和结果。
- 人工验证建议。
- 阻塞点或偏离计划的地方。

## Codex 5.5 审核清单

- 实现是否只覆盖 `REQ-1302`。
- 月份切换后统计是否使用当前 `year/month`。
- 最高班味日期和连续高压最长天数是否按当前月计算。
- 无记录和无月薪分支是否符合验收标准。
- 月度报告图是否脱敏，不展示吐槽原文和月薪原始值。
- 是否引入无关文件、第三方依赖或计划外重构。
- 验证命令是否全部执行并记录结果。
