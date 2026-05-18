const storage = require('./storage')
const dateUtil = require('./date')
const constants = require('./constants')

const CARD_IMAGES = {
  mood: {
    display: '../../assets/images/share-cards/mood-card.jpg',
    file: '/assets/images/share-cards/mood-card.jpg'
  },
  income: {
    display: '../../assets/images/share-cards/income-card.jpg',
    file: '/assets/images/share-cards/income-card.jpg'
  },
  weekly: {
    display: '../../assets/images/share-cards/mood-card-template.jpg',
    file: '/assets/images/share-cards/mood-card-template.jpg'
  },
  monthly: {
    display: '../../assets/images/share-cards/mood-card-template.jpg',
    file: '/assets/images/share-cards/mood-card-template.jpg'
  },
  streak: {
    display: '../../assets/images/share-cards/mood-card-template.jpg',
    file: '/assets/images/share-cards/mood-card-template.jpg'
  },
  wish: {
    display: '../../assets/images/share-cards/mood-card-template.jpg',
    file: '/assets/images/share-cards/mood-card-template.jpg'
  },
  calm: {
    display: '../../assets/images/share-cards/mood-card-template.jpg',
    file: '/assets/images/share-cards/mood-card-template.jpg'
  }
}

const MOOD_TEMPLATE_IMAGE = {
  display: '../../assets/images/share-cards/mood-card-template.jpg',
  file: '/assets/images/share-cards/mood-card-template.jpg'
}

const MOOD_BUTTON_IMAGE = {
  display: '../../assets/images/share-cards/mood-share-button.png',
  file: '/assets/images/share-cards/mood-share-button.png'
}

const POSTER_CANVAS_ID = 'sharePosterCanvas'
const POSTER_WIDTH = 626
const CARD_HEIGHT = 980
const POSTER_FOOTER_HEIGHT = 162
const POSTER_HEIGHT = CARD_HEIGHT + POSTER_FOOTER_HEIGHT
const QR_SIZE = 112

function clampIndex(value) {
  var number = Number(value)
  if (isNaN(number)) return 50
  return Math.max(0, Math.min(100, Math.round(number)))
}

function getTodayMoodRecord() {
  var today = dateUtil.getToday()
  return storage.getDailyDraft(today) || storage.getDailyRecord(today) || {
    quitIndex: 50,
    mood: 'annoyed'
  }
}

function getMoodVisualState(index) {
  var value = clampIndex(index)

  if (value >= 90) {
    return {
      scene: 'explode',
      statusText: '今日状态：雷雨已上线',
      pillBg: '#f4d1bd',
      textColor: '#9f3b25',
      shareTitle: '今天班味爆表，先记一下'
    }
  }

  if (value >= 75) {
    return {
      scene: 'storm',
      statusText: '今日状态：乌云压顶中',
      pillBg: '#f0ddb5',
      textColor: '#805926',
      shareTitle: '今天乌云压顶，先不裸辞'
    }
  }

  if (value >= 55) {
    return {
      scene: 'edge',
      statusText: '今日状态：快到草原边',
      pillBg: '#e9f1c9',
      textColor: '#2f6a35',
      shareTitle: '今天快到草原边'
    }
  }

  if (value >= 30) {
    return {
      scene: 'cloudy',
      statusText: '今日状态：云有点多',
      pillBg: '#edf4d6',
      textColor: '#386d3c',
      shareTitle: '今天云有点多'
    }
  }

  return {
    scene: 'sunny',
    statusText: '今日状态：还能晒太阳',
    pillBg: '#e9f5cf',
    textColor: '#31723b',
    shareTitle: '今天还能晒太阳'
  }
}

function buildTypeState(type) {
  var isIncome = type === 'income'
  var isWeekly = type === 'weekly'
  var isMonthly = type === 'monthly'
  var isStreak = type === 'streak'
  var isWish = type === 'wish'
  var isCalm = type === 'calm'
  var card = isIncome ? CARD_IMAGES.income : ((isWeekly || isMonthly || isStreak || isWish || isCalm) ? CARD_IMAGES.weekly : MOOD_TEMPLATE_IMAGE)
  var moodRecord = getTodayMoodRecord()
  var moodIndex = clampIndex(moodRecord.quitIndex)
  var moodVisual = getMoodVisualState(moodIndex)
  var isMoodCard = !isIncome && !isWeekly && !isMonthly && !isStreak && !isWish && !isCalm

  return {
    cardTitle: isIncome ? '今日赚钱卡' : (isWeekly ? '最近 7 天复盘' : (isMonthly ? '月度班味复盘' : (isStreak ? '连续打卡成就' : (isWish ? '离开后的愿望' : (isCalm ? '冷静器结论' : '今日班味指数'))))),
    cardHint: isIncome
      ? '这张卡只展示坚持状态，不展示工资 and 金额。'
      : (isWeekly ? '展示过去 7 天的平均状态和坚持成果。' : (isMonthly ? '展示全月班味统计，不含吐槽原文。' : (isStreak ? '展示你连续记录的天数，不含任何压力细节。' : (isWish ? '展示你为未来留下的退路愿望。' : (isCalm ? '展示冷静器得出的建议结论。' : '这张卡会按班味指数生成不同状态，不展示指数数字。'))))),
    pageHint: isIncome
      ? '赚钱卡默认脱敏，只表达今天又撑住了。'
      : (isWeekly ? '周复盘卡整合了过去一周的班味统计。' : (isMonthly ? '月复盘卡展示当月班味数据。' : (isStreak ? '连续打卡卡展示你的坚持成果。' : (isWish ? '愿望卡展示你对未来的期待。' : (isCalm ? '冷静卡展示当前的理智建议。' : '指数卡默认脱敏，只表达今天的牛马状态。'))))),
    previewBadge: isIncome ? '赚钱卡' : (isWeekly ? '周复盘' : (isMonthly ? '月复盘' : (isStreak ? '连续打卡' : (isWish ? '愿望卡' : (isCalm ? '冷静卡' : '指数卡'))))),
    moodModeClass: (isMoodCard) ? 'active' : '',
    incomeModeClass: isIncome ? 'active' : '',
    weeklyModeClass: isWeekly ? 'active' : '',
    monthlyModeClass: isMonthly ? 'active' : '',
    streakModeClass: isStreak ? 'active' : '',
    wishModeClass: isWish ? 'active' : '',
    calmModeClass: isCalm ? 'active' : '',
    cardImage: card.display,
    cardFile: card.file,
    primaryButtonText: (isIncome || isStreak || isWish || isCalm) ? '保存这份坚持' : '分享复盘状态',
    actionButtonImage: (isIncome || isStreak || isWish || isCalm) ? '' : MOOD_BUTTON_IMAGE.display,
    isMoodCard: isMoodCard,
    isIncomeCard: isIncome,
    isWeeklyCard: isWeekly,
    isMonthlyCard: isMonthly,
    isStreakCard: isStreak,
    isWishCard: isWish,
    isCalmCard: isCalm,
    moodIndex: moodIndex,
    moodVisual: moodVisual,
    moodSceneClass: 'mood-scene-' + moodVisual.scene
  }
}

module.exports = {
  CARD_IMAGES: CARD_IMAGES,
  MOOD_TEMPLATE_IMAGE: MOOD_TEMPLATE_IMAGE,
  MOOD_BUTTON_IMAGE: MOOD_BUTTON_IMAGE,
  POSTER_CANVAS_ID: POSTER_CANVAS_ID,
  POSTER_WIDTH: POSTER_WIDTH,
  CARD_HEIGHT: CARD_HEIGHT,
  POSTER_FOOTER_HEIGHT: POSTER_FOOTER_HEIGHT,
  POSTER_HEIGHT: POSTER_HEIGHT,
  QR_SIZE: QR_SIZE,
  getMoodVisualState: getMoodVisualState,
  buildTypeState: buildTypeState
}
