# 总开发阶段文档：v1 稳定性返工

评审日期：2026-05-14  
适用范围：当前未提交变更的返工，不新增业务功能。

## 目标

修复当前代码中已经暴露的首页运行时错误、云同步初始化顺序、同步冲突覆盖、云端清空安全边界问题，让 `REQ-1004`、`REQ-1104`、`REQ-1202`、`REQ-1203`、`REQ-1204`、`REQ-2001` 能重新进入待审核状态。

## 非目标

- 不开发周复盘、月复盘、连续打卡、提醒订阅、头像授权等后续功能。
- 不重做首页视觉、分享卡视觉和品牌文案。
- 不修改与 RF-001 到 RF-006 无关的页面和资源。
- 不把控制台权限配置当作代码层安全边界的替代方案。

## 当前证据

- `docs/future-development-requirements.md` 已新增 `RF-001` 到 `RF-006` 返工标记。
- `pages/today/today.js` 第 179 行调用已不存在的 `buildHolidayCard(now)`。
- `app.js` 第 8 行在 `wx.cloud.init` 之前调用 `sync.processPendingQueue()`。
- `utils/storage.js` 的 `normalizeSettings` 没有保留 `updatedAt`。
- `utils/storage.js` 的 `mergeChecklistItems` 会无条件用云端同 id 数据覆盖本地数据。
- `pages/wishes/wishes.js` 拉取云端愿望后直接 `writeWishes(res.data)` 覆盖本地列表。
- `utils/cloud-data.js` 使用客户端 `where({}).remove()` 执行云端清空。

## 假设

- 小程序仍使用微信云开发，用户身份以云开发上下文中的 `OPENID` 为准。
- 云数据库集合包括 `daily_records`、`user_settings`、`wishes`、`checklist_items`。
- `app_codes` 缓存集合已由控制台配置，当前返工不调整小程序码缓存方案。
- 本轮只做代码和文档返工；真机、云函数部署和控制台权限由开发者在微信开发者工具中验证。

## 风险

| 风险 | 影响 | 缓解方案 | 负责人 |
| --- | --- | --- | --- |
| 云初始化顺序修复不完整 | App 启动或 onShow 时同步报错，影响首屏 | 云环境初始化后再重试；所有重试 Promise 必须 catch | Gemini |
| 冲突合并策略不一致 | 本地离线数据被旧云端覆盖 | 给 settings、wish、checklist 统一 `updatedAt` 比较策略 | Gemini |
| 云端清空仍在客户端执行 | 权限误配时可能误删数据 | 新增云函数基于 `OPENID` 删除当前用户数据 | Gemini |
| 返工扩大范围 | 引入新回归，影响已上线版本 | 只修改计划内文件；偏离计划先报告 | Gemini |

## 阶段地图

| 阶段 | 目的 | 子任务 | 进入条件 | 退出条件 | 状态 |
| --- | --- | --- | --- | --- | --- |
| S1 | 修复首页和启动级 P1 错误 | ST-001, ST-002 | 当前返工文档已确认 | 首页不再报 `buildHolidayCard` 未定义；pending queue 不早于云初始化执行 | 已完成 (待真机确认) |
| S2 | 修复数据冲突和覆盖策略 | ST-003, ST-004, ST-005 | S1 完成或可并行修改无冲突文件 | 设置、愿望、清单均不会被旧云端静默覆盖 | 已完成 (待真机确认 settings) |
| S3 | 修复云端清空安全边界 | ST-006 | 云开发环境可部署云函数 | 清空云端只删除当前 `OPENID` 数据，失败不删本地 | 已完成 (待云函数真机验证) |
| S4 | 验证和回归文档更新 | ST-007 | S1-S3 完成 | 验证命令、人工真机清单、需求完成度更新齐全 | 已完成 (待提交清理) |
| S5 | 清空后队列清理返工 | ST-008 | RF-009 已确认 | 清空本地/云端后 pending queue 不会重放旧任务 | 已完成 |
| S6 | pending 重试冲突保护 | ST-009 | RF-010 已确认 | pending save 重试不会覆盖云端较新数据 | 已完成 |
| S7 | 提交清理 | 提交前清理 | 所有业务返工通过 | `git diff --check` 通过，无 trailing whitespace | 已完成 |

## 验证策略

- 必跑静态验证：
  - `node --check app.js`
  - `node --check pages/today/today.js`
  - `node --check pages/wishes/wishes.js`
  - `node --check pages/checklist/checklist.js`
  - `node --check utils/storage.js`
  - `node --check utils/sync.js`
  - `node --check utils/cloud-data.js`
- 必做人工验证：
  - 微信开发者工具打开首页，首页无 `ReferenceError`。
  - 云环境已配置时，App 启动和从后台恢复不因 pending queue 报错。
  - 离线新增愿望，云端存在旧愿望，恢复网络后本地新增不丢失。
  - 离线修改清单，云端存在旧清单，恢复网络后本地修改不丢失。
  - 修改月薪后同步，不被旧云端设置覆盖。
  - 清空云端失败时，本地数据仍保留。
