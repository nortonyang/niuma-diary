# REQ-1501 打卡提醒开发计划

## 目标

把 `REQ-1501 打卡提醒` 从“本地提醒偏好”推进到“代码链路完成，微信控制台配置待确认”。

## 当前状态

- `pages/me` 已有提醒开关和提醒时间。
- `utils/storage.js` 已有 `getReminderSettings`、`saveReminderSettings`。
- 当前提醒设置只保存在本地，服务端无法按用户时间发送。
- `DEFAULT_REMINDER_SETTINGS.templateId` 仍是占位值 `REPLACE_WITH_YOUR_TEMPLATE_ID`。
- 云函数目录已有 `getAppCode` 和 `clearUserData`，可新增 `sendDailyReminder`。

## 非目标

- 不在代码中硬编码真实微信订阅模板 ID。
- 不伪造微信控制台配置完成状态。
- 不发送敏感、焦虑、过激或离职诱导文案。
- 不改变每日打卡保存逻辑。

## 方案

### 客户端

- 设置页继续提供开关和时间选择。
- 开启提醒时，如果没有有效模板 ID，应明确提示“需要配置模板后才能推送”，不要误导用户。
- 如果有有效模板 ID，调用 `wx.requestSubscribeMessage`，仅在用户授权后启用提醒。
- 将提醒设置同步到云端可被云函数读取的数据中，建议复用 `user_settings`，字段至少包括：
  - `reminderEnabled`
  - `reminderTime`
  - `reminderTemplateId`
  - `reminderAuthorizedAt`
- 用户关闭提醒时同步云端关闭状态。

### 服务端

- 新增云函数 `sendDailyReminder`。
- 云函数根据当前时间或传入测试时间，筛选开启提醒且提醒时间匹配的用户。
- 对每个用户调用 `cloud.openapi.subscribeMessage.send`。
- 文案必须中性，例如“今天还没记录，花 30 秒记一下状态”。
- 发送失败时记录错误并继续处理其他用户。
- 返回发送统计，便于定时任务日志排查。

### 文档

- 更新 `docs/cloudbase-setup.md`：
  - 说明订阅模板 ID 需要在微信公众平台配置。
  - 说明 `sendDailyReminder` 需要部署云函数并配置定时触发器。
  - 说明模板字段名需与云函数代码保持一致。
- 更新 `docs/ai-workflow/future-development-requirements.md`：
  - 若代码链路完成但模板/定时器需控制台配置，状态应为 `已完成 / 需人工确认`。

## 预期文件

- `pages/me/me.js`
- `pages/me/me.wxml`
- `utils/constants.js`
- `utils/storage.js`
- `utils/cloud-data.js`
- `cloudfunctions/sendDailyReminder/index.js`
- `cloudfunctions/sendDailyReminder/package.json`
- `cloudfunctions/sendDailyReminder/.cloudignore`
- `docs/cloudbase-setup.md`
- `docs/ai-workflow/future-development-requirements.md`

## 验证方式

- `node --check pages/me/me.js`
- `node --check utils/constants.js`
- `node --check utils/storage.js`
- `node --check utils/cloud-data.js`
- `node --check cloudfunctions/sendDailyReminder/index.js`
- `git diff --check`

## 风险

- 订阅消息模板 ID、模板字段和定时触发器都必须在微信公众平台或云开发控制台配置，代码无法单独验证。
- 微信订阅消息通常需要用户主动授权，授权可能是一次性或长期能力取决于模板和平台规则，代码必须处理拒绝授权。
