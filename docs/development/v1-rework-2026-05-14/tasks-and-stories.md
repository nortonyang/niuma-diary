# 阶段与子任务文档：v1 稳定性返工

## 阶段目的

把本轮 Codex 审核发现的 RF-001 到 RF-006 拆成可执行的最小任务，交给 Gemini 逐项修复。每个原子任务必须能独立验证，完成前不能把相关需求恢复为“已完成”。

## 依赖

- 总开发阶段文档：`docs/development/v1-rework-2026-05-14/phase-plan.md`
- 需求状态文档：`docs/future-development-requirements.md`
- 云函数部署能力：微信开发者工具中选择云函数根目录并部署。

## 子任务

| 子任务 | 交付结果 | 原子任务 | 用户故事 | 状态 |
| --- | --- | --- | --- | --- |
| ST-001 首页节假日调用修复 | 首页加载不再运行时报错 | AT-001 | US-001 | 已完成 (待真机确认) |
| ST-002 云初始化顺序修复 | pending queue 不影响 App 启动 | AT-002 | US-002 | 已完成 (待真机确认) |
| ST-003 设置同步冲突修复 | 月薪和偏好设置不会被旧云端覆盖 | AT-003 | US-003 | 已完成 (待真机确认) |
| ST-004 清单合并修复 | 清单本地较新项不被旧云端覆盖 | AT-004 | US-004 | 已完成 |
| ST-005 愿望合并修复 | 愿望本地较新项不被旧云端覆盖 | AT-005 | US-005 | 已完成 |
| ST-006 云端清空安全修复 | 只删除当前用户云端数据 | AT-006 | US-006 | 已完成 (待云函数真机验证) |
| ST-007 验证和文档收尾 | 验证记录和需求状态更新 | AT-007 | US-007 | 已完成 |
| ST-008 清空后同步队列清理 | 清空数据后旧保存任务不会回写云端 | AT-008 | US-008 | 已完成 |
| ST-009 pending 重试冲突保护 | 旧 pending 保存任务不会覆盖云端较新数据 | AT-009 | US-009 | 已完成 (待真机确认) |

## AT-001：首页节假日调用修复

用户故事：作为用户，我希望打开首页时能正常看到最近假期倒计时，以便继续完成今日打卡。

### 范围

- 修复 `pages/today/today.js` 中对节假日模块的错误调用。
- 不调整节假日日期表和首页样式。

### 验收标准

- Given 用户进入首页，When `loadToday` 执行，Then 不出现 `buildHolidayCard is not defined`。
- Given 当前日期为 2026-05-14，When 首页渲染，Then 最近假期不再停留在劳动节，应显示后续假期。

### 实现备注

- 预期改动：`pages/today/today.js`
- 使用 `holidays.buildHolidayCard(now)`。

### 验证方式

- `node --check pages/today/today.js`
- 微信开发者工具打开首页并查看 Console。

### 完成定义

- 首页无运行时报错。
- RF-001 可标记为已修复待审核。

## AT-002：云初始化顺序修复

用户故事：作为用户，我希望小程序启动时不会因为云同步重试失败而影响使用，以便即使云端暂时不可用也能先使用本地数据。

### 范围

- 调整 `app.js` 的云初始化和 `sync.processPendingQueue()` 调用顺序。
- 所有启动和 onShow 自动重试都必须捕获错误。

### 验收标准

- Given 云环境已配置，When App 启动，Then 先执行 `wx.cloud.init`，再执行 pending queue。
- Given pending queue 同步失败，When App 启动或恢复前台，Then Console 可记录错误，但首页仍可打开。
- Given 云环境未配置，When App 启动，Then 不调用云数据库。

### 实现备注

- 预期改动：`app.js`、必要时 `utils/sync.js`。
- 不要求在 App 启动时同步所有数据，只处理 pending queue。

### 验证方式

- `node --check app.js`
- 模拟 `niuma_pending_sync_queue` 有数据，真机启动不白屏。

### 完成定义

- RF-002 可标记为已修复待审核。

## AT-003：设置同步冲突修复

用户故事：作为用户，我希望刚保存的月薪和设置不会被旧云端数据覆盖，以便我的本地修改可靠。

### 范围

- 本地 settings 读写保留 `updatedAt`。
- 保存 settings 时写入当前 `updatedAt`。
- 同步 settings 时避免本地新数据被旧云端覆盖。

### 验收标准

- Given 本地刚修改月薪，When 云端存在旧 settings，Then 本地月薪仍保留，并按策略同步到云端。
- Given 云端 settings 更新更晚，When 打开我的页，Then 本地 settings 可被云端较新数据更新。
- Given settings 缺少 `updatedAt`，When migration 或读取发生，Then 不抛错并补默认时间。

### 实现备注

- 预期改动：`utils/storage.js`、`utils/sync.js`、`pages/me/me.js`。
- 设置类数据可采用整对象时间优先；字段级合并如实现复杂，先保证不会旧云覆盖新本地。

### 验证方式

- `node --check utils/storage.js`
- `node --check utils/sync.js`
- 手动构造本地新 settings 和云端旧 settings 做真机验证。

### 完成定义

- RF-003 可标记为已修复待审核。

## AT-004：清单合并修复

用户故事：作为用户，我希望离线修改的清单不会在重新联网后被旧云端清单覆盖，以便准备事项不会丢失。

### 范围

- 清单按 `id` 合并。
- 同 id 时比较 `updatedAt`，保留较新的数据。
- 保留默认清单和自定义清单的排序兼容。

### 验收标准

- Given 本地清单项 `updatedAt` 晚于云端同 id 项，When 拉取云端清单，Then 保留本地项。
- Given 云端清单项 `updatedAt` 晚于本地同 id 项，When 拉取云端清单，Then 更新本地项。
- Given 两端是不同 id 清单项，When 合并，Then 两者都保留。

### 实现备注

- 预期改动：`utils/storage.js`、必要时 `pages/checklist/checklist.js`。
- 不改变现有阶段分组 UI。

### 验证方式

- `node --check utils/storage.js`
- 手动构造本地和云端清单数组，验证合并结果。

### 完成定义

- RF-005 可标记为已修复待审核。

## AT-005：愿望合并修复

用户故事：作为用户，我希望离线新增或修改的愿望不会被旧云端愿望覆盖，以便我记录的退路不会丢失。

### 范围

- 愿望按 `id` 合并。
- 同 id 时比较 `updatedAt`。
- 保持最多 3 条愿望规则，排序按最新更新时间或现有产品规则明确处理。

### 验收标准

- Given 本地新增愿望未同步，When 云端返回旧列表，Then 本地新增愿望仍存在。
- Given 云端某愿望更新更晚，When 拉取云端，Then 本地同 id 愿望被云端较新版本更新。
- Given 合并后超过 3 条，When 保存本地，Then 按明确排序只保留 3 条且不随机丢失最新项。

### 实现备注

- 预期改动：`utils/storage.js`、`pages/wishes/wishes.js`。
- 可新增 `mergeWishes` 工具函数，避免页面直接 `writeWishes(res.data)`。

### 验证方式

- `node --check utils/storage.js`
- `node --check pages/wishes/wishes.js`
- 手动构造本地新愿望和云端旧愿望做验证。

### 完成定义

- RF-006 可标记为已修复待审核。

## AT-006：云端清空安全修复

用户故事：作为用户，我希望清空云端数据只删除我自己的数据，以便不会因为权限配置错误造成误删。

### 范围

- 新增或调整云函数，使用 `cloud.getWXContext().OPENID`。
- 云函数删除 `daily_records`、`user_settings`、`wishes`、`checklist_items` 中当前用户数据。
- 客户端 `clearCloudData` 只调用云函数，不在前端执行批量 `where({}).remove()`。

### 验收标准

- Given 当前用户点击清空云端，When 云函数执行，Then 只删除 `_openid` 等于当前 `OPENID` 的数据。
- Given 云函数失败，When 页面收到错误，Then 本地数据不被清空。
- Given 云环境未配置，When 用户进入我的页，Then 不展示或不可执行云端清空。

### 实现备注

- 预期改动：`utils/cloud-data.js`、`pages/me/me.js`、新增 `cloudfunctions/clearUserData/` 或等价云函数。
- 需补充 `docs/cloudbase-setup.md` 的部署说明。

### 验证方式

- `node --check utils/cloud-data.js`
- `node --check pages/me/me.js`
- 部署云函数后用两个微信账号或测试 openid 验证隔离。

### 完成定义

- RF-004 可标记为已修复待审核。

## AT-007：验证和文档收尾

用户故事：作为维护者，我希望返工完成后需求状态能准确反映代码现状，以便后续 Gemini 不重复开发或误跳过缺陷。

### 范围

- 更新 `docs/future-development-requirements.md` 中 RF 状态。
- 记录验证命令和人工验证结果。
- 不把未验证的控制台配置项标为代码完成。

### 验收标准

- Given 代码返工完成，When Codex 审核，Then RF-001 到 RF-006 均有通过或未通过证据。
- Given 某项只完成代码未真机验证，When 更新文档，Then 标为“已完成 / 需人工确认”而非最终完成。

### 实现备注

- 预期改动：`docs/future-development-requirements.md`、本目录审核报告。

### 验证方式

- `git diff -- docs`
- Codex 5.5 按审核报告模板复核。

### 完成定义

- 文档和代码状态一致。

## AT-008：清空后同步队列清理

用户故事：作为用户，我希望清空本地或云端数据后，之前失败的同步任务不会再把旧数据写回云端，以便“清空”这个操作是真的可预期。

### 范围

- 清空本地数据时同步清理 pending queue 和 sync status。
- 云端清空成功后，如果用户选择清空本地，也必须走同一套完整清理逻辑。
- 不改变正常保存失败时加入 pending queue 的行为。

### 验收标准

- Given 本地存在 `niuma_pending_sync_queue`，When 用户执行清空本地数据，Then pending queue 被删除或置空。
- Given 本地存在 `niuma_sync_status`，When 用户执行清空本地数据，Then同步状态回到默认值。
- Given 云端清空成功且用户选择清空本地，When App 下次启动，Then 不会因为残留 pending queue 把旧记录重新写回云端。

### 实现备注

- 预期改动：`utils/storage.js`，必要时 `utils/cloud-data.js` 暴露清理 pending queue 的小工具。
- 建议将 `niuma_pending_sync_queue` 和 `niuma_sync_status` 收口到常量，避免硬编码散落。

### 验证方式

- `node --check utils/storage.js`
- 本地模拟：先写入 pending queue 和 sync status，再执行 `storage.clearAllData()`，检查两者已清空。
- 真机验证：构造同步失败队列，清空后重启小程序，不应重新上传旧数据。

### 完成定义

- RF-009 可标记为已修复待审核。

## AT-009：pending 重试冲突保护

用户故事：作为多设备用户，我希望离线失败队列恢复同步时仍遵守更新时间冲突规则，以便旧设备恢复网络后不会覆盖另一台设备上较新的云端数据。

### 范围

- `utils/cloud-data.js` 的 `processPendingQueue()` 中，save 类任务不能直接调用底层 `save*` 无条件 upsert。
- save 类任务重试必须复用 `syncRecord`、`syncSettings`、`syncWish`、`syncChecklistItem` 的冲突策略，或在 `cloud-data` 内部执行等价的 fetch + `updatedAt` 比较。
- delete 类任务仍可按现有删除语义处理，但需要确保不会因为旧 save 任务排在后面而把已删除数据重新创建。

### 验收标准

- Given pending queue 中保存的是 `updatedAt=100` 的愿望，When 云端同 id 愿望已经是 `updatedAt=200`，Then 处理 pending queue 后云端保留 `updatedAt=200` 的版本。
- Given pending queue 中保存的是 `updatedAt=300` 的清单，When 云端同 id 清单是 `updatedAt=200`，Then pending queue 可以把较新本地版本同步到云端。
- Given pending queue 中有多个 collection 的 save 任务，When 部分失败，Then失败任务仍保留重试次数，成功任务移出队列。

### 实现备注

- 预期改动：`utils/cloud-data.js`，必要时 `utils/sync.js`。
- 注意避免 `sync.js` 和 `cloud-data.js` 出现循环依赖；如果复用 `sync*` 会造成循环，建议把冲突合并函数抽到独立 helper，或在 `cloud-data.processPendingQueue()` 中实现本地等价逻辑。
- 需要补充一个本地 mock 验证脚本或命令，覆盖旧 pending 不覆盖新云端的场景。

### 验证方式

- `node --check utils/cloud-data.js`
- `node --check utils/sync.js`
- 本地 mock：模拟 pending payload `updatedAt=100`，云端 fetch 返回 `updatedAt=200`，确认不会调用 update 覆盖云端。

### 完成定义

- RF-010 可标记为已修复待审核。

## 提交前清理：trailing whitespace

目的：清理当前 diff 中的行尾空格，避免 `git diff --check` 失败和无意义格式噪声。

### 范围

- `app.js`
- `cloudfunctions/getAppCode/index.js`
- `pages/me/me.js`
- `pages/today/today.js`
- `utils/cloud-data.js`
- `utils/storage.js`

### 验收标准

- `git diff --check` 通过。
- 不改变业务逻辑。

### 完成定义

- 可以进入提交或继续上线前人工验证。
