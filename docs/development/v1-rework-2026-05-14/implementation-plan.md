# 具体开发方案：v1 稳定性返工

## 开发方案

| 步骤 | 工作内容 | 负责人 | 文件或区域 | 验证方式 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 1 | 修复首页节假日模块调用错误 | Gemini | `pages/today/today.js` | `node --check pages/today/today.js`，首页人工打开 | 已完成 (待真机确认) |
| 2 | 调整云初始化和 pending queue 重试顺序 | Gemini | `app.js`, `utils/sync.js` | `node --check app.js`，有 pending queue 时启动验证 | 已完成 (待真机确认) |
| 3 | settings 保留 `updatedAt` 并修复同步覆盖 | Gemini | `utils/storage.js`, `utils/sync.js`, `pages/me/me.js` | 手动构造本地新、云端旧数据验证 | 已完成 (待真机确认) |
| 4 | 清单按 `id + updatedAt` 合并 | Gemini | `utils/storage.js`, `pages/checklist/checklist.js` | 手动构造清单合并验证 | 已完成 |
| 5 | 愿望按 `id + updatedAt` 合并 | Gemini | `utils/storage.js`, `pages/wishes/wishes.js` | 手动构造愿望合并验证 | 已完成 |
| 6 | 云端清空改为云函数按 `OPENID` 删除 | Gemini | `utils/cloud-data.js`, `pages/me/me.js`, `cloudfunctions/clearUserData/`, `docs/cloudbase-setup.md` | 云函数部署后真机验证 | 已完成 (待云函数真机验证) |
| 7 | 更新完成度和审核记录 | Codex 5.5 | `docs/future-development-requirements.md`, 本目录审核文档 | Codex 审核 | 进行中 |

## 完成度

| 项目 | 完成度 | 证据 | 备注 |
| --- | ---: | --- | --- |
| RF-001 首页节假日调用 | 100% | `pages/today/today.js` 已调用 `holidays.buildHolidayCard(now)`；语法检查通过 | 待首页真机确认 |
| RF-002 云初始化顺序 | 100% | `app.js` 已先 `wx.cloud.init`，再 catch 包裹 `sync.processPendingQueue()` | 待 pending queue 真机确认 |
| RF-003 设置同步冲突 | 100% | `utils/storage.js` 已保留 settings `updatedAt`，同步按时间戳比较 | 待真机确认 |
| RF-004 云端清空安全边界 | 90% | 已新增 `clearUserData` 云函数并由客户端调用 | 待云函数部署后真机确认 |
| RF-005 清单合并 | 100% | `mergeChecklistItems` 已按 `id + updatedAt` 合并，本地模拟通过 | 已通过代码审核 |
| RF-006 愿望合并 | 100% | `mergeWishes` 已按 `id + updatedAt` 合并，本地模拟通过 | 已通过代码审核 |
| RF-007 缺时间戳旧云数据处理 | 100% | 本地模拟显示缺时间戳旧云数据不会覆盖本地较新愿望/清单 | 已通过代码审核 |
| RF-008 新增云函数部署说明 | 100% | `cloudbase-setup.md` 已说明 `getAppCode` 和 `clearUserData` 都需部署 | P2 |
| RF-009 清空后 pending queue 残留 | 100% | 本地模拟显示 `storage.clearAllData()` 后业务数据、`niuma_pending_sync_queue` 与 `niuma_sync_status` 均被清空 | 已通过代码审核 |
| RF-010 pending queue 重试绕过冲突判断 | 100% | `upsertItem()` 已按 `payload.updatedAt` 与云端 `updatedAt` 做保护；本地 mock 验证旧 pending 不覆盖新云端，新 pending 可更新旧云端 | 已通过代码审核 |

## 要修复的问题

| 问题 | 严重级别 | 关联用户故事 | 修复方案 | 状态 |
| --- | --- | --- | --- | --- |
| 首页调用不存在的节假日函数 | P1 | US-001 | 改用 `holidays.buildHolidayCard`，补人工验证 | 已修复 (待真机确认) |
| App 启动时 pending queue 早于云初始化 | P1 | US-002 | 云初始化成功后再重试，并 catch 错误 | 已修复 (待真机确认) |
| 设置同步可能旧云覆盖新本地 | P1 | US-003 | settings 保留 `updatedAt`，同步按时间策略处理 | 已修复 (待真机确认) |
| 云端清空缺少代码层用户边界 | P1 | US-006 | 新增 `clearUserData` 云函数，按 `OPENID` 删除 | 已修复 (待云函数真机验证) |
| 清单合并会旧云覆盖新本地 | P2 | US-004 | 清单按 `id + updatedAt` 合并 | 已修复 |
| 愿望拉取会旧云覆盖新本地 | P2 | US-005 | 愿望按 `id + updatedAt` 合并 | 已修复 |
| 缺时间戳的旧云数据会被误判为最新 | P1 | US-003, US-004, US-005 | `utils/storage.js` 的合并 normalizer 使用 `Number(updatedAt) || Number(createdAt) || 0`，禁止用 `Date.now()` 参与冲突判断 | 已修复 |
| 新增云函数缺部署说明 | P2 | US-006 | 在 `docs/cloudbase-setup.md` 补充 `clearUserData` 部署步骤和上线前检查项 | 已修复 |
| 清空数据后 pending queue 残留 | P1 | US-002, US-006 | `storage.clearAllData()` 和云端清空成功路径必须同步清理 `niuma_pending_sync_queue` 与 `niuma_sync_status`，避免旧保存任务自动重试后回写云端 | 已修复 |
| pending queue 重试绕过冲突判断 | P1 | US-003, US-004, US-005 | pending save 重试必须复用 `syncRecord`、`syncSettings`、`syncWish`、`syncChecklistItem` 的冲突逻辑，或在重试前先拉云端并比较 `updatedAt` | 已修复 |

## 具体案例

| 案例 | 输入或上下文 | 期望行为 | 验证方式 |
| --- | --- | --- | --- |
| 首页打开 | 当前代码进入 `pages/today/today` | 首页正常渲染，不报 `buildHolidayCard is not defined` | 微信开发者工具 Console |
| 启动重试 | 本地存在 `niuma_pending_sync_queue`，云环境已配置 | App 先 `wx.cloud.init`，再重试 pending；失败不阻塞首页 | 真机或开发者工具 |
| 设置冲突 | 本地月薪更新时间晚于云端 | 本地月薪保留并同步到云端 | 手工数据验证 |
| 清单冲突 | 本地清单项 `updatedAt=200`，云端同 id `updatedAt=100` | 合并后保留本地项 | 手工数据验证 |
| 愿望冲突 | 本地新增愿望未同步，云端只有旧愿望 | 合并后本地新增仍存在 | 手工数据验证 |
| 云端清空 | 用户 A 调用清空云端，用户 B 也有数据 | 只删除用户 A 的数据；失败时本地不清空 | 云函数日志和数据库检查 |
| 旧云数据缺时间戳 | 本地数据 `updatedAt=200`，云端同 id 数据缺 `updatedAt` | 本地数据不被云端旧数据覆盖 | 本地模拟或真机调试 |
| 云函数部署说明 | 开发者按 `cloudbase-setup.md` 上线 | 会部署 `getAppCode` 和 `clearUserData` 两个云函数 | 文档检查 |
| 清空后队列残留 | 本地存在 `niuma_pending_sync_queue`，用户执行清空本地或云端清空后选择清空本地 | pending queue 和 sync status 同步清空，不会在下次启动时把旧数据重新写回云端 | 本地模拟或真机调试 |
| pending 旧任务冲突 | 设备 A 离线保存 `updatedAt=100` 进入 pending，设备 B 已把云端同 id 数据更新到 `updatedAt=200` | 设备 A 恢复网络后不能用旧 pending payload 覆盖云端较新数据 | 本地 mock 或真机双设备调试 |
| 提交清理 | 当前未提交 diff 中存在 trailing whitespace | `git diff --check` 通过，避免提交失败或格式噪声 | `git diff --check` |

## Gemini 开发交接

你将根据已经批准的敏捷规划文档实现代码。

事实来源：

- `docs/future-development-requirements.md`
- `docs/development/v1-rework-2026-05-14/phase-plan.md`
- `docs/development/v1-rework-2026-05-14/tasks-and-stories.md`
- `docs/development/v1-rework-2026-05-14/implementation-plan.md`

实现范围：

- RF-001：修复首页节假日调用错误。
- RF-002：修复云初始化与 pending queue 重试顺序。
- RF-003：修复 settings `updatedAt` 和同步冲突。
- RF-004：云端清空改为云函数按当前 `OPENID` 删除。
- RF-005：清单按 `id + updatedAt` 合并。
- RF-006：愿望按 `id + updatedAt` 合并。
- RF-009：清空本地或云端清空后同步清理 pending queue 与 sync status。
- RF-010：pending queue 保存任务重试时必须执行同一套 `updatedAt` 冲突判断，不能直接无条件 upsert 云端。

约束：

- 不修改无关文件。
- 不新增业务功能。
- 不调整首页、分享卡、我的页视觉，除非为修复交互文案所必需。
- 不依赖“控制台权限正确”作为唯一安全边界；云端清空必须在代码层绑定当前用户。
- 如果需要新增云函数，必须补充部署说明，并列出需要在微信开发者工具部署的函数。

验收标准：

- 首页打开不出现 `buildHolidayCard is not defined`。
- App 启动和恢复前台时，pending queue 同步失败不影响页面使用。
- 设置、愿望、清单同步不再被旧云端静默覆盖本地较新数据。
- 云端清空只删除当前用户数据；云端清空失败时本地数据不被误删。
- 缺失 `updatedAt` 的旧云数据不能被补成当前时间参与冲突判断。
- `cloudbase-setup.md` 必须列出 `clearUserData` 云函数部署步骤。
- 清空本地数据和云端清空后的本地清理必须同时清掉 pending queue 和 sync status。
- pending queue 中的 save 任务重试时，不能覆盖云端 `updatedAt` 更新的数据。
- 所有修改文件通过 `node --check`。

预期改动区域：

- `app.js`
- `pages/today/today.js`
- `pages/me/me.js`
- `pages/wishes/wishes.js`
- `pages/checklist/checklist.js`
- `utils/storage.js`
- `utils/sync.js`
- `utils/cloud-data.js`
- `cloudfunctions/clearUserData/`
- `docs/cloudbase-setup.md`
- `docs/development/v1-rework-2026-05-14/`

需要运行的验证：

```bash
node --check app.js
node --check pages/today/today.js
node --check pages/me/me.js
node --check pages/wishes/wishes.js
node --check pages/checklist/checklist.js
node --check utils/storage.js
node --check utils/sync.js
node --check utils/cloud-data.js
```

需要人工验证：

- 首页真机或开发者工具打开无报错。
- 有 pending queue 时启动无白屏。
- 本地新 settings 不被旧云端覆盖。
- 本地新愿望和清单不被旧云端覆盖。
- 云函数 `clearUserData` 部署后，只删除当前用户数据。
- 清空本地或云端清空后，本地 pending queue 不会残留旧保存任务。
- pending queue 旧保存任务不能覆盖云端较新记录。
- 提交前清理 trailing whitespace，使 `git diff --check` 通过。

返回内容：

- 变更文件列表。
- 实现摘要。
- 验证命令和结果。
- 云函数部署说明。
- 阻塞点或偏离计划的地方。

## Codex 5.5 审核清单

- 实现是否只覆盖 RF-001 到 RF-010。
- 是否引入无关文件或计划外重构。
- settings、wish、checklist 是否都有 `updatedAt` 保留和冲突判断。
- 云端清空是否通过云函数中的 `OPENID` 限定当前用户。
- 启动和 onShow 的同步错误是否全部 catch。
- 清空本地和云端清空后的本地清理是否会清掉 pending queue 与 sync status。
- pending queue 的 save 重试是否复用或等价实现了 `updatedAt` 冲突判断。
- 验证命令和人工验证是否覆盖具体案例。
- 需求文档完成度是否按证据更新。
