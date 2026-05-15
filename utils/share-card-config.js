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
  var card = isIncome ? CARD_IMAGES.income : MOOD_TEMPLATE_IMAGE
  var moodRecord = getTodayMoodRecord()
  var moodIndex = clampIndex(moodRecord.quitIndex)
  var moodVisual = getMoodVisualState(moodIndex)
  var isMoodCard = !isIncome
  var isIncomeCard = isIncome

  return {
    cardTitle: isIncome ? '今日赚钱卡' : '今日班味指数',
    cardHint: isIncome
      ? '这张卡只展示坚持状态，不展示工资和金额。'
      : '这张卡会按班味指数生成不同状态，不展示指数数字。',
    pageHint: isIncome
      ? '赚钱卡默认脱敏，只表达今天又撑住了。'
      : '指数卡默认脱敏，只表达今天的牛马状态。',
    previewBadge: isIncome ? '赚钱卡' : '指数卡',
    moodModeClass: isIncome ? '' : 'active',
    incomeModeClass: isIncome ? 'active' : '',
    cardImage: card.display,
    cardFile: card.file,
    primaryButtonText: isIncome ? '保存这份坚持' : '分享我的状态',
    actionButtonImage: isIncome ? '' : MOOD_BUTTON_IMAGE.display,
    isMoodCard: isMoodCard,
    isIncomeCard: isIncomeCard,
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
