# REQ-1404 冷静器结果历史开发规划

## 目标

实现 `REQ-1404 冷静器结果历史`：用户完成冷静器后可以保存本次结果，并能在冷静器页查看、删除历史结果。

## 非目标

- 不新增独立页面。
- 不新增云数据库集合或云同步链路。
- 不改变每日打卡 `daily_records` 的读写逻辑。
- 不在分享卡里展示用户的具体选择项。

## 当前证据

- 需求来源：`docs/future-development-requirements.md` 的 `REQ-1404`。
- 当前页面：`pages/calm/calm.js` 只计算当前结果并跳转分享页，没有保存历史。
- 当前分享：`pages/calm/calm.js` 的 `shareResult` 只传 `result.title`、`result.copy` 和 `pressurePercent`，未传用户具体选择项。
- 当前本地存储：`utils/storage.js` 已集中管理打卡、愿望、清单和设置，可新增独立 storage key。

## 假设

- 冷静器历史先作为本机数据保存；后续如要云同步，应另立需求补集合、权限和冲突策略。
- 历史记录展示在冷静器页面底部，避免新增路由和导航复杂度。

## 风险

| 风险 | 影响 | 缓解方案 | 负责人 |
| --- | --- | --- | --- |
| 历史记录误写入每日打卡 | 污染打卡统计 | 使用独立 `CALM_HISTORY` storage key | Gemini |
| 分享泄露用户选择项 | 不符合验收 | 分享方法继续只传结果标题、建议文案和压力百分比 | Gemini |
| 历史过长影响页面 | 页面冗长 | 默认按时间倒序展示，必要时只保留最近记录或通过样式压缩 | Gemini |

## 阶段地图

| 阶段 | 目的 | 子任务 | 进入条件 | 退出条件 | 状态 |
| --- | --- | --- | --- | --- | --- |
| S1 | 数据模型 | ST-001 | 已确认 storage 现状 | `storage.js` 支持保存、读取、删除冷静器历史 | 未开始 |
| S2 | 页面交互 | ST-002 | S1 完成 | 冷静器页可保存、查看、删除历史 | 未开始 |
| S3 | 文档和验证 | ST-003 | S1-S2 完成 | 需求状态和验证证据更新 | 未开始 |

## 子任务与用户故事

| 子任务 | 交付结果 | 原子任务 | 用户故事 | 状态 |
| --- | --- | --- | --- | --- |
| ST-001 | 独立历史存储 | AT-001 | US-001 | 未开始 |
| ST-002 | 冷静器页历史 UI | AT-002, AT-003 | US-002, US-003 | 未开始 |
| ST-003 | 文档更新 | AT-004 | US-004 | 未开始 |

## 原子任务

### AT-001：冷静器历史数据存储

用户故事：作为用户，我希望保存一次冷静器结果，以便之后回看当时的准备状态。

验收标准：

- Given 用户点击保存结果，When 保存成功，Then 生成一条独立历史记录。
- Given 保存历史，When 查看每日打卡数据，Then 每日打卡不新增、不修改。
- Given 历史记录包含用户选择项，When 分享结果，Then 分享仍只展示结果标题和建议，不展示具体选择项。

实现备注：

- 建议新增 `constants.STORAGE_KEYS.CALM_HISTORY`。
- 建议新增 `storage.getCalmHistory`、`storage.saveCalmHistoryItem`、`storage.deleteCalmHistoryItem`。
- 历史字段至少包含：`id`、`date`、`resultTitle`、`resultCopy`、`pressurePercent`、`highPressureDays`、`durationText`、`runwayText`、`choices`、`createdAt`。

验证方式：

- `node --check utils/constants.js`
- `node --check utils/storage.js`

### AT-002：保存当前冷静器结果

用户故事：作为用户，我希望在冷静器结论出来后点击保存，以便把这次判断留档。

验收标准：

- Given 冷静器当前已有结果，When 点击保存结果，Then 页面提示保存成功并刷新历史列表。
- Given 用户多次保存，When 查看历史，Then 每次保存都是独立记录。

实现备注：

- 在 `pages/calm/calm.js` 组装当前表单选择和结果。
- 在 `pages/calm/calm.wxml` 的结果区域新增“保存结果”按钮。

验证方式：

- `node --check pages/calm/calm.js`

### AT-003：查看和删除历史

用户故事：作为用户，我希望在冷静器页查看和删除历史，以便保留有价值的记录。

验收标准：

- Given 已保存历史，When 打开冷静器页面，Then 按时间倒序显示历史。
- Given 点击删除历史，When 用户确认，Then 该条历史从列表移除。
- Given 删除历史，When 查看每日打卡，Then 每日打卡不受影响。

实现备注：

- 在 `pages/calm/calm.wxml` 底部新增历史卡片列表。
- 删除前使用 `wx.showModal` 确认。

验证方式：

- `node --check pages/calm/calm.js`

### AT-004：需求文档更新

用户故事：作为开发者，我希望需求状态准确，以便后续不要重复开发。

验收标准：

- `REQ-1404` 状态更新为 `已完成 (待审核)`。
- `REQ-1404` 章节补充实现说明。

## Gemini 开发交接

你将根据本规划实现 `REQ-1404 冷静器结果历史`。

事实来源：

- `docs/development/req-1404-calm-history/plan.md`
- `docs/future-development-requirements.md`
- `pages/calm/calm.js`
- `pages/calm/calm.wxml`
- `pages/calm/calm.wxss`
- `utils/storage.js`
- `utils/constants.js`

实现范围：

- 新增冷静器历史的本地存储能力。
- 冷静器页新增保存、历史查看、删除能力。
- 更新需求文档状态和实现说明。

约束：

- 不新增云集合。
- 不改每日打卡保存逻辑。
- 不新增页面路由。
- 不提交、不推送、不暂存。
- 不运行 shell 命令；如需验证，在最终回复列出建议验证命令。

预期改动区域：

- `utils/constants.js`
- `utils/storage.js`
- `pages/calm/calm.js`
- `pages/calm/calm.wxml`
- `pages/calm/calm.wxss`
- `docs/future-development-requirements.md`

Codex 完成后会运行：

- `node --check pages/calm/calm.js`
- `node --check utils/storage.js`
- `node --check utils/constants.js`
- `git diff --check`

返回内容：

- 变更文件列表。
- 实现摘要。
- 未运行验证的说明。
- 阻塞点或偏离计划的地方。
