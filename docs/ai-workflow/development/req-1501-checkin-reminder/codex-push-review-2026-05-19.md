# Codex 5.5 推送前审核：REQ-1501 打卡提醒

审核时间：2026-05-19

## 审核范围

- `pages/me/me.js`
- `utils/storage.js`
- `utils/cloud-data.js`
- `utils/constants.js`
- `cloudfunctions/sendDailyReminder/index.js`
- `docs/cloudbase-setup.md`
- `docs/ai-workflow/future-development-requirements.md`

## 发现与处理

| 严重级别 | 问题 | 证据 | 处理 |
| --- | --- | --- | --- |
| P2 | 部署文档曾允许按小时触发 `sendDailyReminder`，但云函数按 `HH:mm` 精确匹配用户提醒时间，按小时触发会漏发非整点提醒。 | `sendDailyReminder` 使用当前 UTC+8 的小时和分钟拼出 `timeStr`，再按 `reminderTime: timeStr` 查询。 | 已把 `docs/cloudbase-setup.md` 调整为要求每分钟触发，并说明低频触发会漏发。 |

## 需求吻合性

| 验收点 | 结论 | 证据 |
| --- | --- | --- |
| 用户可开启每日打卡提醒 | 通过 | `pages/me/me.js` 提供提醒开关，配置有效模板 ID 时先请求订阅授权。 |
| 用户选择提醒时间 | 通过 | `pages/me/me.js` 通过 Time Picker 保存提醒时间。 |
| 未授权时不发送提醒 | 通过 | 未授权不写入云端可发送状态，云函数还要求 `reminderAuthorizedAt > 0`。 |
| 用户可随时关闭提醒 | 通过 | 关闭提醒时同步 `reminderEnabled: false` 与 `reminderAuthorizedAt: 0`。 |
| 提醒文案不包含敏感或过激内容 | 通过 | 云函数发送“今日状态打卡”和中性提醒文案。 |
| 代码链路完成但外部配置待确认 | 通过 | 需求状态仍为 `已完成 / 需人工确认`，需要微信订阅模板和云开发定时触发器。 |

## 验证

- `node --check pages/me/me.js`：通过。
- `node --check pages/today/today.js`：通过。
- `node --check pages/calm/calm.js`：通过。
- `node --check pages/share/share.js`：通过。
- `node --check utils/storage.js`：通过。
- `node --check utils/cloud-data.js`：通过。
- `node --check utils/constants.js`：通过。
- `node --check cloudfunctions/sendDailyReminder/index.js`：通过。
- `git diff --check HEAD`：通过。

## 残留风险

- 微信订阅模板 ID、模板字段、云函数部署和定时触发器只能在微信公众平台或云开发控制台人工确认。
- 订阅授权、真机推送送达和用户关闭提醒后的行为仍需在微信开发者工具和真机环境验证。
