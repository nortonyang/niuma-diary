# Codex 5.5 审核报告：v1 稳定性返工前置审核

审核日期：2026-05-14  
审核对象：当前未提交代码变更。  
审核结论：不建议合并或上线，需先完成 RF-001 到 RF-006。

## 审核范围

- `app.js`
- `pages/today/today.js`
- `pages/wishes/wishes.js`
- `pages/checklist/checklist.js`
- `pages/me/me.js`
- `utils/storage.js`
- `utils/sync.js`
- `utils/cloud-data.js`
- `docs/ai-workflow/future-development-requirements.md`

## 问题发现

| 严重级别 | 返工编号 | 问题 | 证据 | 必要动作 |
| --- | --- | --- | --- | --- |
| P1 | RF-001 | 首页加载会直接运行时报错 | `pages/today/today.js` 第 179 行调用 `buildHolidayCard(now)`，该函数已被迁移删除 | 改为 `holidays.buildHolidayCard(now)` |
| P1 | RF-002 | pending queue 重试早于云初始化 | `app.js` 第 8 行先调用 `sync.processPendingQueue()`，第 11 行才 `wx.cloud.init` | 先初始化云环境，再执行自动重试，并 catch 错误 |
| P1 | RF-003 | 设置同步会用旧云覆盖新本地 | `utils/storage.js` 的 `normalizeSettings` 不保留 `updatedAt` | settings 读写保留 `updatedAt`，同步按时间策略处理 |
| P1 | RF-004 | 云端清空缺少代码层当前用户边界 | `utils/cloud-data.js` 使用客户端 `where({}).remove()` | 改为云函数基于 `OPENID` 删除 |
| P2 | RF-005 | 清单云拉取会覆盖本地较新项 | `utils/storage.js` 的 `mergeChecklistItems` 无条件覆盖同 id | 按 `id + updatedAt` 合并 |
| P2 | RF-006 | 愿望云拉取会覆盖本地较新列表 | `pages/wishes/wishes.js` 直接 `writeWishes(res.data)` | 新增愿望合并策略 |

## 验收标准检查

| 用户故事 | 结果 | 证据 |
| --- | --- | --- |
| US-001 首页正常打开 | 失败 | 存在 `buildHolidayCard` 未定义风险 |
| US-002 启动同步不阻塞使用 | 失败 | 云初始化顺序错误 |
| US-003 设置不被旧云覆盖 | 失败 | 本地 settings 缺 `updatedAt` |
| US-004 清单不被旧云覆盖 | 失败 | 清单合并无更新时间比较 |
| US-005 愿望不被旧云覆盖 | 失败 | 愿望云拉取直接覆盖本地 |
| US-006 云端清空只删当前用户 | 失败 | 客户端批量删除未绑定 openid |

## 验证结果

已执行静态语法检查，以下命令通过：

```bash
node --check app.js
node --check pages/today/today.js
node --check pages/share/share.js
node --check utils/sync.js
node --check utils/cloud-data.js
node --check utils/share-card-renderer.js
node --check cloudfunctions/getAppCode/index.js
node --check utils/holidays.js
```

说明：语法检查通过不代表需求通过。当前问题主要是运行时调用、初始化顺序、同步策略和云端安全边界。

## 完成度更新

| 项目 | 更新前 | 更新后 | 证据 |
| --- | ---: | ---: | --- |
| REQ-1004 节假日正确性 | 已完成 | 部分完成 / 需返工 | 首页调用旧函数名 |
| REQ-1104 云同步状态中心 | 已完成待审核 | 部分完成 / 需返工 | 启动重试早于云初始化 |
| REQ-1202 云同步冲突策略 | 已完成待审核 | 部分完成 / 需返工 | settings、wish、checklist 均有覆盖风险 |
| REQ-1203 待同步队列 | 已完成待审核 | 部分完成 / 需返工 | 自动重试时机和错误保护不足 |
| REQ-1204 云端清空数据 | 已完成待审核 | 部分完成 / 需返工 | 缺少云函数 openid 删除边界 |
| REQ-2001 首页节假日模块拆分 | 部分完成 | 部分完成 / 需返工 | 拆分后调用未同步更新 |

## 剩余工作

- Gemini 按 `implementation-plan.md` 完成 RF-001 到 RF-006。
- 开发者在微信开发者工具部署新增云函数。
- Codex 5.5 在 Gemini 返回后按本报告和原子任务重新审核。

## 二次审核补充：2026-05-14

审核对象：Gemini 标记 RF-001 到 RF-006 已完成后的当前代码。

| 严重级别 | 返工编号 | 问题 | 证据 | 必要动作 |
| --- | --- | --- | --- | --- |
| P1 | RF-007 | 缺时间戳的旧云数据会覆盖本地新数据 | 本地模拟显示本地 `updatedAt=200` 的愿望/清单会被缺失 `updatedAt` 的云端同 id 数据覆盖，因为 normalizer 补了 `Date.now()` | 云端 normalizer 和冲突比较使用 `Number(updatedAt) || Number(createdAt) || 0`，不要用当前时间参与冲突判断 |
| P2 | RF-008 | 新增 `clearUserData` 云函数没有部署说明 | `docs/cloudbase-setup.md` 仍只说明部署 `getAppCode`，上线前检查也只列了 `getAppCode` | 补充 `cloudfunctions/clearUserData` 部署步骤和上线前检查项 |

二次审核验证：

```bash
node --check app.js
node --check pages/today/today.js
node --check pages/me/me.js
node --check pages/wishes/wishes.js
node --check pages/checklist/checklist.js
node --check utils/storage.js
node --check utils/sync.js
node --check utils/cloud-data.js
node --check cloudfunctions/clearUserData/index.js
node --check cloudfunctions/getAppCode/index.js
```

以上语法检查通过，但 RF-007 未通过需求验收；RF-008 已通过文档检查。

## 三次审核补充：2026-05-14

审核对象：Gemini 修复 RF-007/RF-008 后的当前代码。

| 严重级别 | 返工编号 | 结果 | 证据 | 必要动作 |
| --- | --- | --- | --- | --- |
| P1 | RF-007 | 未通过 | 本地模拟显示：本地 `updatedAt=200` 的愿望/清单，仍会被缺失 `updatedAt` 的云端同 id 数据覆盖。问题在 `utils/storage.js` 的 `normalizeWish`、`normalizeChecklistItem` 仍使用 `Date.now()` 补时间。 | 修改本地合并路径 normalizer，冲突比较用 `Number(updatedAt) || Number(createdAt) || 0`；本地新建/迁移可单独补当前时间。 |
| P2 | RF-008 | 通过 | `docs/cloudbase-setup.md` 已列出 `getAppCode` 和 `clearUserData` 两个云函数的部署步骤，并在上线前检查项中列出 `clearUserData`。 | 无需继续返工。 |

三次审核验证：

```bash
node --check app.js
node --check utils/cloud-data.js
node --check utils/storage.js
node --check utils/sync.js
node --check cloudfunctions/clearUserData/index.js
```

语法检查通过。下面的本地模拟仍失败，需要继续作为回归用例：

```bash
本地愿望/清单 updatedAt=200
云端同 id 愿望/清单缺 updatedAt
期望：保留本地数据
实际：云端缺时间戳数据被补成当前时间并覆盖本地数据
```

## 四次审核补充：2026-05-14

审核对象：Gemini 修复 RF-007/RF-008 后的当前代码。

| 严重级别 | 返工编号 | 结果 | 证据 | 必要动作 |
| --- | --- | --- | --- | --- |
| P1 | RF-007 | 通过 | 本地模拟显示：本地 `updatedAt=200` 的愿望/清单不会被缺失 `updatedAt` 的云端同 id 数据覆盖。`utils/storage.js` 的本地合并 normalizer 已使用稳定时间戳。 | 保留该模拟作为回归用例。 |
| P2 | RF-008 | 通过 | `docs/cloudbase-setup.md` 已列出 `getAppCode` 和 `clearUserData` 两个云函数部署步骤，并在上线前检查项中列出 `clearUserData`。 | 无需继续返工。 |
| P1 | RF-009 | 未通过 | 本地模拟显示：执行 `storage.clearAllData()` 后，`niuma_pending_sync_queue` 和 `niuma_sync_status` 仍保留。清空后如果自动重试 pending queue，旧保存任务可能重新写回云端。 | 清空本地数据时删除 pending queue 和 sync status；云端清空成功后选择清空本地时也必须走同一清理逻辑。 |

四次审核验证：

```bash
node --check app.js
node --check pages/today/today.js
node --check pages/me/me.js
node --check pages/wishes/wishes.js
node --check pages/checklist/checklist.js
node --check pages/share/share.js
node --check utils/storage.js
node --check utils/sync.js
node --check utils/cloud-data.js
node --check utils/share-card-renderer.js
node --check utils/share-card-config.js
node --check utils/holidays.js
node --check utils/migration.js
node --check utils/share-code.js
node --check cloudfunctions/clearUserData/index.js
```

语法检查通过。RF-009 的失败模拟：

```bash
输入：本地存在 niuma_pending_sync_queue 和 niuma_sync_status
操作：storage.clearAllData()
期望：业务数据、pending queue、sync status 均被清空
实际：pending queue 和 sync status 仍保留
```

## 五次审核补充：2026-05-15

审核对象：Gemini 修复 RF-009 后的当前代码。

| 严重级别 | 返工编号 | 结果 | 证据 | 必要动作 |
| --- | --- | --- | --- | --- |
| P1 | RF-009 | 通过 | 本地模拟显示：执行 `storage.clearAllData()` 后，业务数据、`niuma_pending_sync_queue` 和 `niuma_sync_status` 均被清空。 | 保留该模拟作为回归用例。 |
| P1 | RF-010 | 未通过 | `utils/cloud-data.js` 的 `processPendingQueue()` 仍直接调用 `saveDailyRecord`、`saveSettings`、`saveWish`、`saveChecklistItem`，绕过 `syncItem` 中的 `updatedAt` 冲突判断。 | pending save 重试必须复用或等价实现 `updatedAt` 冲突判断；旧 pending payload 不能覆盖云端较新数据。 |
| P2 | 提交清理 | 未通过 | `git diff --check` 仍报告多处 trailing whitespace。 | 提交前清理所有 trailing whitespace。 |

五次审核验证：

```bash
node --check app.js
node --check utils/cloud-data.js
node --check utils/storage.js
node --check utils/sync.js
node --check pages/today/today.js
node --check pages/me/me.js
node --check pages/share/share.js
```

以上语法检查通过。RF-007 和 RF-009 的本地回归模拟通过。

RF-010 需要新增的回归场景：

```bash
设备 A pending payload updatedAt=100
设备 B 已把云端同 id 数据更新到 updatedAt=200
执行 processPendingQueue()
期望：保留云端 updatedAt=200，不被旧 pending payload 覆盖
```

## 六次审核补充：2026-05-15

说明：本节是当前最新审核结论，覆盖五次审核中 `RF-010` 未通过的历史结论。

审核对象：Gemini 修复 RF-010 后的当前代码。

| 严重级别 | 项目 | 结果 | 证据 | 必要动作 |
| --- | --- | --- | --- | --- |
| P1 | RF-010 | 通过 | `utils/cloud-data.js` 的 `upsertItem()` 已比较 `payload.updatedAt` 与云端 `updatedAt`。本地 mock 验证：pending `updatedAt=100` 不覆盖云端 `updatedAt=200`；pending `updatedAt=300` 可更新云端 `updatedAt=200`。 | 保留该 mock 场景作为回归用例。 |
| P2 | 提交清理 | 未通过 | `git diff --check` 仍报告多处 trailing whitespace。 | 提交前清理行尾空格。 |

六次审核验证：

```bash
node --check app.js
node --check utils/cloud-data.js
node --check utils/storage.js
node --check utils/sync.js
node --check pages/today/today.js
node --check pages/me/me.js
node --check pages/share/share.js
```

以上语法检查通过。RF-007、RF-009、RF-010 的本地回归模拟通过。当前业务需求与代码实现基本一致，剩余问题是提交前格式清理和云函数/真机人工确认。
