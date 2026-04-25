# 留马

面向职场人的微信小程序 MVP：每天 30 秒记录班味状态，看看自己为什么累、忍住赚了多少钱、离开后最想干什么。

## 当前版本

- 原生微信小程序，已接入微信云开发环境配置。
- 数据默认先保存在微信小程序本地存储，配置云开发后同步到云数据库。
- 已实现 4 个 Tab：今天、日历、愿望、我的。
- 已实现今日打卡、班味日历、离开后愿望、收入换算、脱敏分享卡、隐私政策和关于页面。
- 今日打卡完成后会进入指数卡页面；指数卡可生成“卡图 + 小程序码”分享图，赚钱卡可保存图片。

## 本地运行

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择本仓库根目录。
4. AppID 可先使用测试号或 `touristappid`。
5. 编译后从“今天”页开始体验 MVP 主链路。

## 目录结构

```text
app.js
app.json
app.wxss
pages/
  today/      今日打卡
  calendar/   班味日历
  wishes/     离开后想干的事
  me/         设置、隐私和本地数据
  share/      分享图
  privacy/    隐私政策
  about/      关于
cloudfunctions/
  getAppCode/ 分享海报小程序码
utils/
  constants.js
  date.js
  storage.js
  calculations.js
docs/
  mvp-spec.md
  full-product-spec.md
```

## 数据存储 Key

- `niuma_daily_records`
- `niuma_after_quit_wishes`
- `niuma_user_settings`

## 云开发

项目已预留微信云开发接入层。默认未填写环境 ID 时只使用本地存储；填写环境 ID 后，`daily_records`、`user_settings`、`wishes` 和 `checklist_items` 会同步到云数据库。

分享指数卡需要部署 `cloudfunctions/getAppCode` 云函数来生成小程序码。配置步骤见 [docs/cloudbase-setup.md](docs/cloudbase-setup.md)。
