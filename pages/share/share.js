const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

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

function getImageInfo(src) {
  return new Promise(function (resolve, reject) {
    wx.getImageInfo({
      src: src,
      success: resolve,
      fail: reject
    })
  })
}

function canvasToTempFilePath(page) {
  return new Promise(function (resolve, reject) {
    wx.canvasToTempFilePath({
      canvasId: POSTER_CANVAS_ID,
      width: POSTER_WIDTH,
      height: POSTER_HEIGHT,
      destWidth: POSTER_WIDTH * 2,
      destHeight: POSTER_HEIGHT * 2,
      success: function (res) {
        resolve(res.tempFilePath)
      },
      fail: reject
    }, page)
  })
}

function canvasToCardTempFilePath(page) {
  return new Promise(function (resolve, reject) {
    wx.canvasToTempFilePath({
      canvasId: POSTER_CANVAS_ID,
      width: POSTER_WIDTH,
      height: CARD_HEIGHT,
      destWidth: POSTER_WIDTH * 2,
      destHeight: CARD_HEIGHT * 2,
      success: function (res) {
        resolve(res.tempFilePath)
      },
      fail: reject
    }, page)
  })
}

function saveToAlbum(filePath, successTitle) {
  return new Promise(function (resolve, reject) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: function () {
        wx.showToast({
          title: successTitle || '已保存',
          icon: 'success'
        })
        resolve()
      },
      fail: reject
    })
  })
}

function drawRoundRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function fillRoundRect(ctx, x, y, width, height, radius, color) {
  drawRoundRectPath(ctx, x, y, width, height, radius)
  ctx.setFillStyle(color)
  ctx.fill()
}

function drawCloud(ctx, x, y, scale, color) {
  ctx.setFillStyle(color)
  ctx.beginPath()
  ctx.arc(x, y + 22 * scale, 22 * scale, Math.PI, Math.PI * 2)
  ctx.arc(x + 28 * scale, y + 11 * scale, 28 * scale, Math.PI, Math.PI * 2)
  ctx.arc(x + 62 * scale, y + 24 * scale, 23 * scale, Math.PI, Math.PI * 2)
  ctx.arc(x + 92 * scale, y + 28 * scale, 18 * scale, Math.PI, Math.PI * 2)
  ctx.lineTo(x + 110 * scale, y + 46 * scale)
  ctx.lineTo(x - 4 * scale, y + 46 * scale)
  ctx.closePath()
  ctx.fill()
}

function drawHill(ctx, color, yOffset, lift) {
  ctx.setFillStyle(color)
  ctx.beginPath()
  ctx.moveTo(163, 608 + yOffset)
  ctx.bezierCurveTo(220, 548 + lift, 274, 578 + yOffset, 324, 548 + lift)
  ctx.bezierCurveTo(380, 515 + lift, 425, 562 + yOffset, 463, 535 + lift)
  ctx.lineTo(463, 608 + yOffset)
  ctx.closePath()
  ctx.fill()
}

function drawRain(ctx) {
  ctx.setStrokeStyle('rgba(84, 115, 136, 0.5)')
  ctx.setLineWidth(3)
  var drops = [
    [214, 535], [248, 548], [292, 532], [337, 550], [382, 535], [418, 552]
  ]
  drops.forEach(function (drop) {
    ctx.beginPath()
    ctx.moveTo(drop[0], drop[1])
    ctx.lineTo(drop[0] - 8, drop[1] + 20)
    ctx.stroke()
  })
}

function drawLightning(ctx) {
  ctx.setFillStyle('#ffd760')
  ctx.beginPath()
  ctx.moveTo(360, 536)
  ctx.lineTo(337, 579)
  ctx.lineTo(361, 573)
  ctx.lineTo(343, 616)
  ctx.lineTo(390, 558)
  ctx.lineTo(364, 565)
  ctx.closePath()
  ctx.fill()
}

function drawMoodScene(ctx, visual) {
  var scene = visual.scene
  var skyTop = '#dff0b5'
  var skyBottom = '#edf8cf'

  if (scene === 'cloudy') {
    skyTop = '#d6e8c3'
    skyBottom = '#eef4d0'
  } else if (scene === 'edge') {
    skyTop = '#d8e5af'
    skyBottom = '#eef4cf'
  } else if (scene === 'storm') {
    skyTop = '#b9c9c7'
    skyBottom = '#e9dfba'
  } else if (scene === 'explode') {
    skyTop = '#f0c18a'
    skyBottom = '#f4d4a3'
  }

  ctx.save()
  drawRoundRectPath(ctx, 163, 505, 300, 104, 48)
  ctx.clip()

  var gradient = ctx.createLinearGradient(163, 505, 163, 609)
  gradient.addColorStop(0, skyTop)
  gradient.addColorStop(1, skyBottom)
  ctx.setFillStyle(gradient)
  ctx.fillRect(163, 505, 300, 104)

  drawHill(ctx, scene === 'storm' ? '#9aaa6a' : '#9ccf61', 0, 0)
  drawHill(ctx, scene === 'explode' ? '#8cab55' : '#75b64b', 13, 16)

  if (scene === 'sunny') {
    ctx.setFillStyle('#f7b73e')
    ctx.beginPath()
    ctx.arc(356, 542, 30, 0, Math.PI * 2)
    ctx.fill()
    drawCloud(ctx, 205, 534, 0.72, 'rgba(255, 255, 255, 0.84)')
  } else if (scene === 'cloudy') {
    ctx.setFillStyle('#f4b84a')
    ctx.beginPath()
    ctx.arc(372, 536, 27, 0, Math.PI * 2)
    ctx.fill()
    drawCloud(ctx, 201, 527, 0.88, 'rgba(255, 255, 255, 0.9)')
    drawCloud(ctx, 282, 542, 0.72, 'rgba(255, 255, 255, 0.72)')
  } else if (scene === 'edge') {
    ctx.setFillStyle('#f4aa37')
    ctx.beginPath()
    ctx.arc(365, 536, 31, 0, Math.PI * 2)
    ctx.fill()
    drawCloud(ctx, 196, 524, 0.94, 'rgba(255, 255, 255, 0.94)')
    drawCloud(ctx, 281, 543, 0.76, 'rgba(245, 250, 244, 0.8)')
  } else if (scene === 'storm') {
    drawCloud(ctx, 195, 524, 1.02, 'rgba(93, 105, 105, 0.74)')
    drawCloud(ctx, 275, 532, 0.9, 'rgba(116, 128, 126, 0.72)')
    drawRain(ctx)
  } else {
    ctx.setFillStyle('rgba(169, 83, 43, 0.3)')
    ctx.fillRect(163, 505, 300, 104)
    drawCloud(ctx, 190, 522, 1.06, 'rgba(86, 83, 79, 0.78)')
    drawCloud(ctx, 280, 535, 0.9, 'rgba(95, 90, 84, 0.72)')
    drawLightning(ctx)
    drawRain(ctx)
  }

  ctx.restore()
}

function drawStatusPill(ctx, visual) {
  fillRoundRect(ctx, 132, 628, 362, 64, 32, '#fffdf0')
  fillRoundRect(ctx, 146, 641, 334, 45, 22, visual.pillBg)
  ctx.setTextAlign('center')
  ctx.setFontSize(25)
  ctx.setFillStyle(visual.textColor)
  ctx.fillText(visual.statusText, 313, 673)
  ctx.setTextAlign('left')
}

function drawSprout(ctx, x, y, scale, color) {
  ctx.setStrokeStyle(color)
  ctx.setLineWidth(5 * scale)
  ctx.beginPath()
  ctx.moveTo(x, y + 32 * scale)
  ctx.lineTo(x, y)
  ctx.stroke()

  ctx.setFillStyle(color)
  ctx.beginPath()
  ctx.arc(x - 15 * scale, y + 4 * scale, 12 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + 15 * scale, y + 4 * scale, 12 * scale, 0, Math.PI * 2)
  ctx.fill()
}

function drawIncomeScene(ctx) {
  ctx.save()
  drawRoundRectPath(ctx, 205, 555, 216, 118, 58)
  ctx.clip()

  var gradient = ctx.createLinearGradient(205, 555, 205, 673)
  gradient.addColorStop(0, '#eef6a7')
  gradient.addColorStop(1, '#c7e27b')
  ctx.setFillStyle(gradient)
  ctx.fillRect(205, 555, 216, 118)

  ctx.setStrokeStyle('rgba(246, 216, 87, 0.7)')
  ctx.setLineWidth(5)
  ;[
    [276, 617, 250, 579],
    [291, 610, 283, 565],
    [313, 606, 313, 562],
    [335, 610, 344, 566],
    [352, 618, 377, 580]
  ].forEach(function (ray) {
    ctx.beginPath()
    ctx.moveTo(ray[0], ray[1])
    ctx.lineTo(ray[2], ray[3])
    ctx.stroke()
  })

  ctx.setFillStyle('rgba(122, 176, 63, 0.35)')
  ctx.beginPath()
  ctx.moveTo(205, 654)
  ctx.bezierCurveTo(255, 616, 303, 650, 351, 622)
  ctx.bezierCurveTo(383, 604, 405, 622, 421, 610)
  ctx.lineTo(421, 673)
  ctx.lineTo(205, 673)
  ctx.closePath()
  ctx.fill()

  ctx.setFillStyle('rgba(78, 147, 56, 0.42)')
  ctx.beginPath()
  ctx.moveTo(205, 671)
  ctx.bezierCurveTo(256, 638, 306, 661, 354, 638)
  ctx.bezierCurveTo(386, 623, 404, 644, 421, 631)
  ctx.lineTo(421, 673)
  ctx.lineTo(205, 673)
  ctx.closePath()
  ctx.fill()

  drawSprout(ctx, 313, 620, 1.08, '#5f9f35')
  ctx.restore()
}

function drawIncomeProgressIcon(ctx, x, y, type, active) {
  var bg = active ? '#eef5bf' : '#f5f0d7'
  var stroke = active ? '#97bd4f' : '#d8d0a7'
  var color = active ? '#4f8d34' : '#94a16d'

  ctx.setFillStyle(bg)
  ctx.beginPath()
  ctx.arc(x, y, 32, 0, Math.PI * 2)
  ctx.fill()
  ctx.setStrokeStyle(stroke)
  ctx.setLineWidth(active ? 4 : 2)
  ctx.stroke()

  if (type === 'sprout') {
    drawSprout(ctx, x, y - 13, 0.7, color)
    return
  }

  if (type === 'clover') {
    ctx.setFillStyle(color)
    ;[
      [-9, -8], [9, -8], [-8, 8], [8, 8]
    ].forEach(function (leaf) {
      ctx.beginPath()
      ctx.arc(x + leaf[0], y + leaf[1], 9, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.setStrokeStyle(color)
    ctx.setLineWidth(3)
    ctx.beginPath()
    ctx.moveTo(x, y + 6)
    ctx.lineTo(x - 8, y + 22)
    ctx.stroke()
    return
  }

  if (type === 'flower') {
    ctx.setFillStyle('#e8b94e')
    ;[
      [0, -13], [12, -2], [7, 12], [-7, 12], [-12, -2]
    ].forEach(function (petal) {
      ctx.beginPath()
      ctx.arc(x + petal[0], y + petal[1], 7, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.setFillStyle(color)
    ctx.beginPath()
    ctx.arc(x, y, 7, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  ctx.setFillStyle(color)
  ctx.beginPath()
  ctx.moveTo(x, y - 23)
  ctx.lineTo(x - 20, y + 12)
  ctx.lineTo(x + 20, y + 12)
  ctx.closePath()
  ctx.fill()
  ctx.fillRect(x - 4, y + 10, 8, 16)
}

function drawIncomeProgress(ctx) {
  var points = [
    { x: 113, type: 'sprout', active: true },
    { x: 247, type: 'clover', active: true },
    { x: 380, type: 'flower', active: true },
    { x: 514, type: 'tree', active: false }
  ]

  ctx.setStrokeStyle('#d9d9a8')
  ctx.setLineWidth(3)
  var x
  for (x = 113; x < 514; x += 20) {
    ctx.beginPath()
    ctx.moveTo(x, 754)
    ctx.lineTo(Math.min(x + 10, 514), 754)
    ctx.stroke()
  }

  points.forEach(function (item) {
    drawIncomeProgressIcon(ctx, item.x, 754, item.type, item.active)
  })
}

function drawIncomeCardContent(ctx) {
  ctx.setFillStyle('#fffdf8')
  ctx.fillRect(58, 492, 510, 432)

  fillRoundRect(ctx, 207, 499, 212, 47, 23, '#eef4d8')
  ctx.setTextAlign('center')
  ctx.setFontSize(28)
  ctx.setFillStyle('#3f6f37')
  ctx.fillText('今天没裸辞', 313, 531)

  drawIncomeScene(ctx)

  fillRoundRect(ctx, 171, 646, 284, 66, 14, '#75a93a')
  ctx.setFillStyle('#fff8df')
  ctx.setFontSize(34)
  ctx.setTextAlign('center')
  ctx.fillText('牛马续航中', 313, 690)

  drawIncomeProgress(ctx)

  ctx.setFillStyle('#4a3a2c')
  ctx.setFontSize(30)
  ctx.fillText('离自由更近一点', 313, 822)
  ctx.setTextAlign('left')
}

function callGetAppCode() {
  if (!wx.cloud || !wx.cloud.callFunction) {
    return Promise.reject(new Error('cloud unavailable'))
  }

  return wx.cloud.callFunction({
    name: 'getAppCode',
    data: {
      page: 'pages/today/today',
      scene: 'share'
    }
  }).then(function (res) {
    var result = res.result || {}

    if (!result.fileID) {
      return Promise.reject(new Error('empty app code'))
    }

    return wx.cloud.downloadFile({
      fileID: result.fileID
    }).then(function (downloadRes) {
      return downloadRes.tempFilePath
    })
  })
}

Page({
  data: Object.assign({
    type: 'mood',
    actionLoading: false
  }, buildTypeState('mood')),

  onLoad: function (options) {
    var requestedType = options && options.type
    var type = requestedType === 'income' ? 'income' : 'mood'
    this.setType(type)
  },

  setType: function (type, callback) {
    this.setData(Object.assign({
      type: type
    }, buildTypeState(type)), function () {
      if (type === 'mood') {
        this.renderDynamicMoodCard(callback)
        return
      }
      if (type === 'income') {
        this.renderDynamicIncomeCard(callback)
        return
      }
      if (callback) callback()
    }.bind(this))
  },

  renderDynamicMoodCard: function (callback) {
    var visual = this.data.moodVisual || getMoodVisualState(50)
    return getImageInfo(MOOD_TEMPLATE_IMAGE.display)
      .then(function (templateInfo) {
        var ctx = wx.createCanvasContext(POSTER_CANVAS_ID, this)

        ctx.drawImage(templateInfo.path, 0, 0, POSTER_WIDTH, CARD_HEIGHT)
        drawMoodScene(ctx, visual)
        drawStatusPill(ctx, visual)

        return new Promise(function (resolve) {
          ctx.draw(false, function () {
            resolve()
          })
        })
      })
      .then(function () {
        return canvasToCardTempFilePath(this)
      }.bind(this))
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function () {
        if (callback) callback()
      })
  },

  renderDynamicIncomeCard: function (callback) {
    return getImageInfo(CARD_IMAGES.income.display)
      .then(function (templateInfo) {
        var ctx = wx.createCanvasContext(POSTER_CANVAS_ID, this)

        ctx.drawImage(templateInfo.path, 0, 0, POSTER_WIDTH, CARD_HEIGHT)
        drawIncomeCardContent(ctx)

        return new Promise(function (resolve) {
          ctx.draw(false, function () {
            resolve()
          })
        })
      }.bind(this))
      .then(function () {
        return canvasToCardTempFilePath(this)
      }.bind(this))
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function () {
        if (callback) callback()
      })
  },

  prepareCurrentCard: function () {
    if (this.data.type === 'income') {
      return this.renderDynamicIncomeCard()
    }

    if (this.data.type === 'mood') {
      return this.renderDynamicMoodCard()
    }

    return Promise.resolve()
  },

  saveImage: function (successTitle) {
    return getImageInfo(this.data.cardFile)
      .then(function (info) {
        return saveToAlbum(info.path, successTitle)
      })
      .catch(function () {
        wx.showModal({
          title: '保存失败',
          content: '请确认已经允许保存到相册。',
          showCancel: false,
          confirmColor: '#de5a32'
        })
      })
  },

  sharePoster: function () {
    if (this.data.actionLoading) return

    if (!wx.showShareImageMenu) {
      this.setData({
        actionLoading: true
      })
      this.prepareCurrentCard()
        .then(function () {
          return this.saveImage(this.data.type === 'income' ? '已保存赚钱卡' : '已保存指数卡')
        }.bind(this))
        .then(function () {
          this.setData({
            actionLoading: false
          })
        }.bind(this), function () {
          this.setData({
            actionLoading: false
          })
        }.bind(this))
      return
    }

    this.setData({
      actionLoading: true
    })

    var prepareCard = this.prepareCurrentCard()

    prepareCard
      .then(function () {
        return Promise.all([
          getImageInfo(this.data.cardFile),
          callGetAppCode()
        ])
      }.bind(this))
      .then(function (res) {
        return this.drawSharePoster(res[0].path, res[1])
      }.bind(this))
      .then(function (posterPath) {
        wx.showShareImageMenu({
          path: posterPath,
          fail: function () {
            saveToAlbum(posterPath, '已保存分享图')
          }
        })
      })
      .catch(function () {
        this.saveImage(this.data.type === 'income' ? '已保存赚钱卡' : '已保存指数卡')
      }.bind(this))
      .then(function () {
        this.setData({
          actionLoading: false
        })
      }.bind(this), function () {
        this.setData({
          actionLoading: false
        })
      }.bind(this))
  },

  drawSharePoster: function (cardPath, appCodePath) {
    var ctx = wx.createCanvasContext(POSTER_CANVAS_ID, this)

    ctx.setFillStyle('#fff7e8')
    ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT)
    ctx.drawImage(cardPath, 0, 0, POSTER_WIDTH, CARD_HEIGHT)

    ctx.setFillStyle('#fffdf8')
    ctx.fillRect(0, CARD_HEIGHT, POSTER_WIDTH, POSTER_FOOTER_HEIGHT)
    ctx.setFillStyle('#2d2822')
    ctx.setFontSize(28)
    ctx.setTextAlign('left')
    ctx.fillText('长按识别小程序码', 42, CARD_HEIGHT + 64)
    ctx.setFillStyle('#6f6254')
    ctx.setFontSize(22)
    ctx.fillText('打开留马日记，先记一下今天的牛马状态', 42, CARD_HEIGHT + 104)
    ctx.drawImage(appCodePath, POSTER_WIDTH - QR_SIZE - 42, CARD_HEIGHT + 24, QR_SIZE, QR_SIZE)

    return new Promise(function (resolve) {
      ctx.draw(false, function () {
        resolve()
      })
    }).then(function () {
      return canvasToTempFilePath(this)
    }.bind(this))
  },

  handlePrimaryAction: function () {
    if (this.data.type === 'income') {
      if (this.data.actionLoading) return
      this.setData({
        actionLoading: true
      })
      this.renderDynamicIncomeCard()
        .then(function () {
          return this.saveImage('已保存赚钱卡')
        }.bind(this))
        .then(function () {
          this.setData({
            actionLoading: false
          })
        }.bind(this), function () {
          this.setData({
            actionLoading: false
          })
        }.bind(this))
      return
    }

    this.sharePoster()
  },

  redrawMood: function () {
    this.setType('mood')
  },

  redrawIncome: function () {
    this.setType('income')
  },

  onShareAppMessage: function () {
    return {
      title: this.data.type === 'income'
        ? '留马日记：今天没裸辞，牛马续航中。'
        : '留马日记：' + (this.data.moodVisual ? this.data.moodVisual.shareTitle : '我的今日班味状态'),
      path: '/pages/today/today'
    }
  }
})
