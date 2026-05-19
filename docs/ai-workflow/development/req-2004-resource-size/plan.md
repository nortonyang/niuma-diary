# REQ-2004 资源体积控制计划

## 目标

完成 `REQ-2004 资源体积控制`，降低默认头像资源体积，并固化云函数依赖目录不上传的约束。

## 当前证据

- `assets/images/default-avatar.png`：512x512 PNG，约 343K，明显偏大。
- 分享卡资源：
  - `assets/images/share-cards/income-card.jpg`：约 192K。
  - `assets/images/share-cards/mood-card.jpg`：约 162K。
  - `assets/images/share-cards/mood-card-template.jpg`：约 145K。
  - `assets/images/share-cards/mood-share-button.png`：约 49K。
- 当前未发现 `cloudfunctions/**/node_modules` 实体目录。
- 根 `.gitignore` 已忽略 `node_modules/`，但建议补充云函数目录级说明或忽略规则，避免上传包误含本地依赖。

## 非目标

- 不重做分享卡视觉设计。
- 不引入新的远程图片托管。
- 不改变业务逻辑。
- 不删除 `package-lock.json` 或 `package.json`。

## 实现要求

- 将 `assets/images/default-avatar.png` 压缩到合理大小，目标小于 80K，保持微信头像展示质量可接受。
- 保持图片路径不变，避免改页面引用。
- 补充云函数 `node_modules` 不上传的忽略规则或部署说明。
- 更新 `docs/ai-workflow/future-development-requirements.md` 中 `REQ-2004` 状态与实现说明。

## 验证方式

- `file assets/images/default-avatar.png`
- `ls -lh assets/images/default-avatar.png assets/images/share-cards/*.jpg assets/images/share-cards/*.png`
- `find cloudfunctions -maxdepth 3 -type d -name node_modules -print`
- `git diff --check`

## Codex 审核重点

- 默认头像体积是否明显下降。
- 图片是否仍可被小程序路径引用。
- 是否没有误删云函数依赖声明文件。
- 是否没有把 Gemini 运行产物提交进 `docs/ai-workflow/jobs`、`signals` 或 `tasks/working`。
