---
taskId: TASK-20260520-complete-non-final-requirements
status: todo
phase: non-final-requirements-closure
createdAt: 2026-05-20T00:00:00+08:00
focusFiles:
  - docs/ai-workflow/future-development-requirements.md
  - docs/ai-workflow/rework-required-2026-05-19.md
  - docs/ai-workflow/development/requirements-audit-2026-05-18/codex-review-report.md
  - docs/ai-workflow/development/rework-2026-05-19-reminder-profile-privacy/codex-review-report.md
  - docs/ai-workflow/development/req-1501-checkin-reminder/codex-push-review-2026-05-19.md
---

# Gemini 任务：完成未最终闭环需求

任务 ID：`TASK-20260520-complete-non-final-requirements`

创建时间：2026-05-20

执行方：Gemini

审核方：Codex 5.5

## 背景

用户要求把“没有开发完成的需求”交给 Gemini 继续开发完成。当前总需求状态表位于 `docs/ai-workflow/future-development-requirements.md`。

注意：当前总表没有明确标记为 `未完成` 或 `部分完成` 的需求。未最终闭环的范围主要是：

- `已完成 (待审核)`：代码已宣称完成，但还需要复核是否真正满足验收标准。
- `已完成 / 需人工确认`：代码链路已完成，但依赖微信公众平台、云开发控制台或真机环境确认。

Gemini 必须先复核，再开发。不得重复实现已经完成且验收通过的能力。

## 本次任务目标

1. 对 `future-development-requirements.md` 中所有非最终状态需求逐项复核。
2. 如果发现代码与需求或验收标准不吻合，补齐代码和必要文档。
3. 如果只是外部配置、真机验证或微信控制台确认，不要伪造完成；写入人工确认清单。
4. 输出变更摘要、验证结果、未处理原因和后续需要 Codex 审核的证据。

## 需要复核的需求范围

### A. 已完成待审核

- `REQ-1001` 隐私与数据文案
- `REQ-1003` 小程序码缓存云函数与文档
- `REQ-1004` 节假日逻辑
- `REQ-1102` 首页草稿保存防抖与强制落盘
- `REQ-1104` 云同步状态中心
- `REQ-1105` 动态图失败降级
- `REQ-1201` v1 数据迁移
- `REQ-1202` 云同步冲突策略
- `REQ-1203` 待同步队列
- `REQ-1204` 云端清空数据
- `REQ-1301` 周复盘
- `REQ-1302` 月复盘
- `REQ-1303` 连续打卡
- `REQ-1304` 更多分享卡与小程序码链路
- `REQ-1401` 愿望进度、置顶与首页重点愿望
- `REQ-1402` 愿望转准备清单
- `REQ-1404` 冷静器结果历史
- `REQ-1502` 头像昵称与分享隐私
- `REQ-2001` 首页模块拆分
- `REQ-2002` 分享卡模块拆分与小程序码缓存
- `REQ-2003` 云同步服务层封装

### B. 已完成 / 需人工确认

- `REQ-1002`：确认云开发控制台已创建 `app_codes` 集合并配置权限；如代码或文档缺配置说明则补齐。
- `REQ-1005`：确认产品名、关于页和“不鼓励冲动辞职”边界文案；如代码或文档缺口则补齐。
- `REQ-1501`：确认订阅消息模板 ID、模板字段、`sendDailyReminder` 云函数部署和每分钟定时触发器；如代码或文档缺口则补齐。

## 重点历史风险

必须重点回归以下历史问题，避免旧报告里的问题再次出现：

- `RA-001`：分享卡保存/转发必须覆盖带小程序码的通用分享图链路。
- `RA-002`：愿望进度、置顶、首页重点愿望和云同步字段必须完整闭环。
- `RA-003`：提交前必须通过 whitespace 检查。
- `RA-20260519-002`：打卡提醒不能误导用户；未配置模板时不得承诺真实推送。
- `RA-20260519-003`：分享海报昵称展示必须默认脱敏并受用户开关控制。
- `RA-20260519-004`：非云模式不得持久化微信临时头像路径。
- `REQ-1501` 定时触发器必须每分钟触发，否则按 `HH:mm` 精确匹配会漏发。

## 约束

- 所有新增或更新的开发文档必须放在 `docs/ai-workflow/` 下。
- 不要移动文档到 `docs/development/` 或其他目录。
- 不要引入 iOS App、社区、AI 聊天、付费商业化等范围外功能。
- 不要计划外大重构；只修改与复核缺口直接相关的文件。
- 不能把外部控制台配置伪装成代码已验证完成。
- 如果没有发现代码缺口，只更新复核报告，不要改业务代码。
- 保持微信小程序原有代码风格，使用 CommonJS 和现有页面结构。

## 建议读取文档

- `docs/ai-workflow/future-development-requirements.md`
- `docs/ai-workflow/rework-required-2026-05-19.md`
- `docs/ai-workflow/development/requirements-audit-2026-05-18/codex-review-report.md`
- `docs/ai-workflow/development/rework-2026-05-19-reminder-profile-privacy/codex-review-report.md`
- `docs/ai-workflow/development/req-1501-checkin-reminder/codex-push-review-2026-05-19.md`
- 各需求目录下已有 `tasks-and-stories.md`、`plan.md`、`implementation-plan.md` 和审核报告。

## 验证要求

至少执行并回传结果：

```sh
node --check app.js
node --check pages/index/index.js
node --check pages/calendar/calendar.js
node --check pages/share/share.js
node --check pages/wishes/wishes.js
node --check pages/wish-editor/wish-editor.js
node --check pages/checklist/checklist.js
node --check pages/calm/calm.js
node --check pages/me/me.js
node --check utils/storage.js
node --check utils/cloud-data.js
node --check utils/calculations.js
node --check utils/share-card-config.js
node --check utils/share-card-renderer.js
node --check cloudfunctions/getAppCode/index.js
node --check cloudfunctions/clearUserData/index.js
node --check cloudfunctions/sendDailyReminder/index.js
git diff --check
```

如果某个文件不存在或命令不适用，必须说明原因。

## 交付物

Gemini 完成后必须提交：

1. 变更文件列表。
2. 每个被复核需求的结论：`通过`、`已补齐`、`仅需人工确认` 或 `仍阻塞`。
3. 如果有代码改动，说明对应需求和修复点。
4. 验证命令和结果。
5. 新增或更新的 `docs/ai-workflow/` 复核报告。
6. 仍需 Codex 或人工处理的事项。

## 完成标准

- 所有可由代码完成的缺口均已补齐。
- 所有只能外部确认的事项被列入人工确认清单。
- `git diff --check` 通过。
- 关键 JS 文件语法检查通过。
- Codex 5.5 可以据此做最终审核。
