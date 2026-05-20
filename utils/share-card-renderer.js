const config = require('./share-card-config')
const storage = require('./storage')
const characterDrawer = require('./character-drawer')

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
      canvasId: config.POSTER_CANVAS_ID,
      width: config.POSTER_WIDTH,
      height: config.POSTER_HEIGHT,
      destWidth: config.POSTER_WIDTH * 2,
      destHeight: config.POSTER_HEIGHT * 2,
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
      canvasId: config.POSTER_CANVAS_ID,
      width: config.POSTER_WIDTH,
      height: config.CARD_HEIGHT,
      destWidth: config.POSTER_WIDTH * 2,
      destHeight: config.CARD_HEIGHT * 2,
      success: function (res) {
        resolve(res.tempFilePath)
      },
      fail: reject
    }, page)
  })
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
  characterDrawer.drawRoundRectPath(ctx, 163, 505, 300, 104, 48)
  ctx.clip()

  var gradient = ctx.createLinearGradient(163, 505, 163, 609)
  gradient.addColorStop(0, skyTop)
  gradient.addColorStop(1, skyBottom)
  ctx.setFillStyle(gradient)
  ctx.fillRect(163, 505, 300, 104)

  characterDrawer.drawHill(ctx, scene === 'storm' ? '#9aaa6a' : '#9ccf61', 0, 0)
  characterDrawer.drawHill(ctx, scene === 'explode' ? '#8cab55' : '#75b64b', 13, 16)

  if (scene === 'sunny') {
    ctx.setFillStyle('#f7b73e')
    ctx.beginPath()
    ctx.arc(356, 542, 30, 0, Math.PI * 2)
    ctx.fill()
    characterDrawer.drawCloud(ctx, 205, 534, 0.72, 'rgba(255, 255, 255, 0.84)')
    characterDrawer.drawCow(ctx, 230, 580, 0.6, 'happy')
    characterDrawer.drawHorse(ctx, 390, 585, 0.6, 'happy')
  } else if (scene === 'cloudy') {
    ctx.setFillStyle('#f4b84a')
    ctx.beginPath()
    ctx.arc(372, 536, 27, 0, Math.PI * 2)
    ctx.fill()
    characterDrawer.drawCloud(ctx, 201, 527, 0.88, 'rgba(255, 255, 255, 0.9)')
    characterDrawer.drawCloud(ctx, 282, 542, 0.72, 'rgba(255, 255, 255, 0.72)')
    characterDrawer.drawCow(ctx, 240, 585, 0.65, 'neutral')
    characterDrawer.drawHorse(ctx, 360, 590, 0.65, 'neutral')
  } else if (scene === 'edge') {
    ctx.setFillStyle('#f4aa37')
    ctx.beginPath()
    ctx.arc(365, 536, 31, 0, Math.PI * 2)
    ctx.fill()
    characterDrawer.drawCloud(ctx, 196, 524, 0.94, 'rgba(255, 255, 255, 0.94)')
    characterDrawer.drawCloud(ctx, 281, 543, 0.76, 'rgba(245, 250, 244, 0.8)')
    characterDrawer.drawCow(ctx, 220, 590, 0.7, 'tired')
    characterDrawer.drawHorse(ctx, 410, 595, 0.7, 'tired')
  } else if (scene === 'storm') {
    characterDrawer.drawCloud(ctx, 195, 524, 1.02, 'rgba(93, 105, 105, 0.74)')
    characterDrawer.drawCloud(ctx, 275, 532, 0.9, 'rgba(116, 128, 126, 0.72)')
    characterDrawer.drawRain(ctx)
    characterDrawer.drawCow(ctx, 260, 595, 0.75, 'tired')
    characterDrawer.drawHorse(ctx, 340, 600, 0.75, 'tired')
  } else {
    ctx.setFillStyle('rgba(169, 83, 43, 0.3)')
    ctx.fillRect(163, 505, 300, 104)
    characterDrawer.drawCloud(ctx, 190, 522, 1.06, 'rgba(86, 83, 79, 0.78)')
    characterDrawer.drawCloud(ctx, 280, 535, 0.9, 'rgba(95, 90, 84, 0.72)')
    characterDrawer.drawLightning(ctx)
    characterDrawer.drawRain(ctx)
    characterDrawer.drawCow(ctx, 250, 600, 0.8, 'explode')
    characterDrawer.drawHorse(ctx, 380, 605, 0.8, 'explode')
  }

  ctx.restore()
}

function drawStatusPill(ctx, visual) {
  characterDrawer.fillRoundRect(ctx, 132, 628, 362, 64, 32, '#fffdf0')
  characterDrawer.fillRoundRect(ctx, 146, 641, 334, 45, 22, visual.pillBg)
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
  characterDrawer.drawRoundRectPath(ctx, 205, 555, 216, 118, 58)
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
  // Main Scene
  drawIncomeScene(ctx)

  // Value section
  ctx.setFillStyle('#253b36')
  ctx.setFontSize(32)
  ctx.setTextAlign('center')
  ctx.fillText('每一分班味，都在明码标价', 313, 715)

  // Character celebration
  characterDrawer.drawCow(ctx, 220, 800, 0.7, 'happy')
  characterDrawer.drawHorse(ctx, 406, 805, 0.7, 'happy')

  // Income Progress
  drawIncomeProgress(ctx)

  ctx.setFillStyle('#de5a32')
  ctx.setFontSize(28)
  ctx.fillText('忍住今天，账户余额 +1', 313, 895)

  ctx.setTextAlign('left')
}

function drawWeeklyCardContent(ctx, summary) {
  // Main Stats Grid
  var gridY = 600
  characterDrawer.fillRoundRect(ctx, 92, gridY, 442, 140, 16, 'rgba(37, 59, 54, 0.05)')

  ctx.setTextAlign('center')
  ctx.setFillStyle('#7f7467')
  ctx.setFontSize(22)
  ctx.fillText('打卡天数', 160, gridY + 45)
  ctx.fillText('平均指数', 313, gridY + 45)
  ctx.fillText('高压天数', 466, gridY + 45)

  ctx.setFillStyle('#253b36')
  ctx.setFontSize(44)
  ctx.fillText(summary.count, 160, gridY + 105)
  ctx.fillText(summary.averageIndex + '%', 313, gridY + 105)
  ctx.fillText(summary.highPressureCount, 466, gridY + 105)

  // Reasons section
  var reasonY = 760
  ctx.setFillStyle('#5f4830')
  ctx.setFontSize(24)
  ctx.fillText('本周主要压力源', 313, reasonY)
  ctx.setFillStyle('#de5a32')
  ctx.setFontSize(30)
  ctx.fillText(summary.topReasonsText || '正在努力寻找中', 313, reasonY + 45)

  // Character decoration at bottom
  characterDrawer.drawCow(ctx, 130, 890, 0.45, 'happy')
  characterDrawer.drawHorse(ctx, 496, 895, 0.45, 'happy')

  ctx.setFillStyle('#4a3a2c')
  ctx.setFontSize(26)
  ctx.fillText('“哪怕只有 1% 的进步也值得肯定”', 313, 895)

  ctx.setTextAlign('left')
}

function drawMonthlyCardContent(ctx, summary, year, month) {
  // Stats Grid
  var gridY = 585
  ctx.setTextAlign('center')
  ctx.setFillStyle('#7f7467')
  ctx.setFontSize(20)
  ctx.fillText('打卡天数', 113, gridY + 30)
  ctx.fillText('平均指数', 247, gridY + 30)
  ctx.fillText('最高指数', 380, gridY + 30)
  ctx.fillText('连续高压', 514, gridY + 30)

  ctx.setFillStyle('#253b36')
  ctx.setFontSize(32)
  ctx.fillText(summary.count, 113, gridY + 75)
  ctx.fillText(summary.averageIndex + '%', 247, gridY + 75)
  ctx.fillText(summary.maxIndex + '%', 380, gridY + 75)
  ctx.fillText(summary.maxConsecutiveHighPressure + ' 天', 514, gridY + 75)

  // Top Reasons
  characterDrawer.fillRoundRect(ctx, 92, 685, 442, 100, 16, 'rgba(37, 59, 54, 0.05)')
  ctx.setFillStyle('#5f4830')
  ctx.setFontSize(24)
  ctx.fillText('本月主要压力源', 313, 720)
  ctx.setFillStyle('#de5a32')
  ctx.setFontSize(28)
  ctx.fillText(summary.topReasonsText || '平安无事的一个月', 313, 760)

  // Summary Footer with characters
  var footerY = 820
  ctx.setFillStyle('#8f8172')
  ctx.setFontSize(24)
  ctx.fillText('钱是自己的，气是公司的。', 313, footerY + 35)

  characterDrawer.drawCow(ctx, 160, 905, 0.4, 'happy')
  characterDrawer.drawHorse(ctx, 466, 910, 0.4, 'happy')

  ctx.setFillStyle('#4a3a2c')
  ctx.setFontSize(26)
  ctx.fillText('“新的一月，对自己好一点”', 313, 905)

  ctx.setTextAlign('left')
}

function drawStreakCardContent(ctx, streak) {
  ctx.setFillStyle('#fffdf8')
  ctx.fillRect(58, 492, 510, 432)

  characterDrawer.fillRoundRect(ctx, 207, 499, 212, 47, 23, '#f5efdf')
  ctx.setTextAlign('center')
  ctx.setFontSize(28)
  ctx.setFillStyle('#5f4830')
  ctx.fillText('连续坚持勋章', 313, 531)

  // Character celebration
  characterDrawer.drawCow(ctx, 180, 680, 0.8, 'happy')
  characterDrawer.drawHorse(ctx, 446, 685, 0.8, 'happy')

  // Main badge
  ctx.setFillStyle('#de5a32')
  ctx.setFontSize(140)
  ctx.fillText(streak, 313, 720)

  ctx.setFillStyle('#7f7467')
  ctx.setFontSize(36)
  ctx.fillText('天', 430, 720)

  ctx.setFillStyle('#5f4830')
  ctx.setFontSize(32)
  ctx.fillText('持续记录班味状态', 313, 800)

  // Subtext based on streak
  var copy = '才刚刚开始，继续坚持'
  if (streak >= 100) copy = '牛马中的王者，佩服！'
  else if (streak >= 30) copy = '已经养成习惯，你很棒'
  else if (streak >= 7) copy = '坚持了一周，是个好的开始'

  ctx.setFillStyle('#8f8172')
  ctx.setFontSize(26)
  ctx.fillText(copy, 313, 850)

  ctx.setFillStyle('#4a3a2c')
  ctx.setFontSize(28)
  ctx.fillText('“先记录，先冷静，再出发”', 313, 910)
  ctx.setTextAlign('left')
}

function drawWishCardContent(ctx, wish) {
  ctx.setFillStyle('#fffdf8')
  ctx.fillRect(58, 492, 510, 432)

  characterDrawer.fillRoundRect(ctx, 207, 499, 212, 47, 23, '#eef4d8')
  ctx.setTextAlign('center')
  ctx.setFontSize(28)
  ctx.setFillStyle('#3f6f37')
  ctx.fillText('退路愿望清单', 313, 531)

  ctx.setFillStyle('#253b36')
  ctx.setFontSize(44)
  ctx.fillText(wish.title, 313, 620)

  // Character looking at the wish
  characterDrawer.drawCow(ctx, 160, 680, 0.5, 'happy')
  characterDrawer.drawHorse(ctx, 466, 680, 0.5, 'happy')

  ctx.setFillStyle('#7f7467')
  ctx.setFontSize(26)
  ctx.fillText(wish.categoryLabel || '退路愿望', 313, 670)

  characterDrawer.fillRoundRect(ctx, 92, 710, 442, 110, 16, '#f3faf6')
  ctx.setFillStyle('#5f4830')
  ctx.setFontSize(24)
  ctx.fillText('迈出第一步', 313, 745)
  ctx.setFillStyle('#253b36')
  ctx.setFontSize(28)
  ctx.fillText(wish.firstStep || '还没想好，先记下愿望', 313, 785)

  ctx.setFillStyle('#8f8172')
  ctx.setFontSize(26)
  ctx.fillText('“为未来留个退路，哪怕还在路上”', 313, 890)
  ctx.setTextAlign('left')
}

function drawCalmCardContent(ctx, result, pressurePercent) {
  ctx.setFillStyle('#fffdf8')
  ctx.fillRect(58, 492, 510, 432)

  characterDrawer.fillRoundRect(ctx, 207, 499, 212, 47, 23, '#f5efdf')
  ctx.setTextAlign('center')
  ctx.setFontSize(28)
  ctx.setFillStyle('#5f4830')
  ctx.fillText('离职冷静结论', 313, 531)

  ctx.setFillStyle('#de5a32')
  ctx.setFontSize(42)
  ctx.fillText(result.title, 313, 620)

  ctx.setFillStyle('#7f7467')
  ctx.setFontSize(26)
  ctx.fillText('高压检测指数: ' + pressurePercent + '%', 313, 670)

  characterDrawer.fillRoundRect(ctx, 92, 710, 442, 130, 16, '#fdf2e9')
  ctx.setFillStyle('#5f4830')
  ctx.setFontSize(24)
  ctx.fillText('冷静建议', 313, 745)

  // Multi-line wrap for suggestion
  ctx.setFillStyle('#253b36')
  ctx.setFontSize(28)
  var text = result.copy
  if (text.length > 15) {
    ctx.fillText(text.slice(0, 15), 313, 785)
    ctx.fillText(text.slice(15), 313, 825)
  } else {
    ctx.fillText(text, 313, 785)
  }

  ctx.setFillStyle('#8f8172')
  ctx.setFontSize(26)
  ctx.fillText('先记录，先冷静。再做最终决定。', 313, 900)
  ctx.setTextAlign('left')
}

function drawReportBackground(ctx) {
  // Base Paper color
  ctx.setFillStyle('#fcfaf2')
  ctx.fillRect(0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)

  // Subtle grid/texture pattern
  ctx.setStrokeStyle('rgba(143, 129, 114, 0.08)')
  ctx.setLineWidth(1)
  for (var i = 0; i < config.POSTER_WIDTH; i += 40) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, config.CARD_HEIGHT)
    ctx.stroke()
  }
  for (var j = 0; j < config.CARD_HEIGHT; j += 40) {
    ctx.beginPath()
    ctx.moveTo(0, j)
    ctx.lineTo(config.POSTER_WIDTH, j)
    ctx.stroke()
  }

  // Accent decorations
  ctx.setFillStyle('rgba(37, 59, 54, 0.03)')
  ctx.beginPath()
  ctx.arc(config.POSTER_WIDTH, 0, 300, 0, Math.PI * 2)
  ctx.fill()

  ctx.setStrokeStyle('#253b36')
  ctx.setLineWidth(4)
  ctx.beginPath()
  ctx.moveTo(40, 40)
  ctx.lineTo(100, 40)
  ctx.moveTo(40, 40)
  ctx.lineTo(40, 100)
  ctx.stroke()
}

function renderMoodCard(page, visual) {
  return getImageInfo(config.MOOD_TEMPLATE_IMAGE.display)
    .then(function (templateInfo) {
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)

      ctx.drawImage(templateInfo.path, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)
      drawMoodScene(ctx, visual)
      drawStatusPill(ctx, visual)

      return new Promise(function (resolve) {
        ctx.draw(false, function () {
          resolve()
        })
      })
    })
    .then(function () {
      return canvasToCardTempFilePath(page)
    })
}

function renderIncomeCard(page) {
  return getImageInfo(config.CARD_IMAGES.income.display)
    .then(function (templateInfo) {
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)

      ctx.drawImage(templateInfo.path, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)
      drawIncomeCardContent(ctx)

      return new Promise(function (resolve) {
        ctx.draw(false, function () {
          resolve()
        })
      })
    })
    .then(function () {
      return canvasToCardTempFilePath(page)
    })
}

function renderWeeklyCard(page, summary) {
  return getImageInfo(config.CARD_IMAGES.weekly.display)
    .then(function (templateInfo) {
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)
      ctx.drawImage(templateInfo.path, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)
      drawWeeklyCardContent(ctx, summary)
      return new Promise(function (resolve) {
        ctx.draw(false, function () { resolve() })
      })
    })
    .catch(function () {
      // Fallback: If report-card.jpg doesn't exist, draw a beautiful 'new' background via Canvas
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)
      drawReportBackground(ctx)
      drawWeeklyCardContent(ctx, summary)
      return new Promise(function (resolve) {
        ctx.draw(false, function () { resolve() })
      })
    })
    .then(function () {
      return canvasToCardTempFilePath(page)
    })
}

function renderMonthlyCard(page, summary, year, month) {
  return getImageInfo(config.CARD_IMAGES.monthly.display)
    .then(function (templateInfo) {
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)
      ctx.drawImage(templateInfo.path, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)
      drawMonthlyCardContent(ctx, summary, year, month)
      return new Promise(function (resolve) {
        ctx.draw(false, function () { resolve() })
      })
    })
    .catch(function () {
      // Fallback to beautiful 'new' Canvas background
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)
      drawReportBackground(ctx)
      drawMonthlyCardContent(ctx, summary, year, month)
      return new Promise(function (resolve) {
        ctx.draw(false, function () { resolve() })
      })
    })
    .then(function () {
      return canvasToCardTempFilePath(page)
    })
}

function renderStreakCard(page, streak) {
  return getImageInfo(config.CARD_IMAGES.streak.display)
    .then(function (templateInfo) {
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)

      ctx.drawImage(templateInfo.path, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)
      drawStreakCardContent(ctx, streak)

      return new Promise(function (resolve) {
        ctx.draw(false, function () {
          resolve()
        })
      })
    })
    .then(function () {
      return canvasToCardTempFilePath(page)
    })
}

function renderWishCard(page, wish) {
  return getImageInfo(config.CARD_IMAGES.wish.display)
    .then(function (templateInfo) {
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)

      ctx.drawImage(templateInfo.path, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)
      drawWishCardContent(ctx, wish)

      return new Promise(function (resolve) {
        ctx.draw(false, function () {
          resolve()
        })
      })
    })
    .then(function () {
      return canvasToCardTempFilePath(page)
    })
}

function renderCalmCard(page, result, pressurePercent) {
  return getImageInfo(config.CARD_IMAGES.calm.display)
    .then(function (templateInfo) {
      var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)

      ctx.drawImage(templateInfo.path, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)
      drawCalmCardContent(ctx, result, pressurePercent)

      return new Promise(function (resolve) {
        ctx.draw(false, function () {
          resolve()
        })
      })
    })
    .then(function () {
      return canvasToCardTempFilePath(page)
    })
}

function drawSharePoster(page, cardPath, appCodePath) {
  var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)
  var settings = storage.getSettings()
  var showNickname = settings.showNicknameOnShare
  var posterTitle = showNickname ? ((settings.nickname || '匿名打工人') + ' 的班味状态') : '我的班味状态'

  ctx.setFillStyle('#fff7e8')
  ctx.fillRect(0, 0, config.POSTER_WIDTH, config.POSTER_HEIGHT)
  ctx.drawImage(cardPath, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)

  ctx.setFillStyle('#fffdf8')
  ctx.fillRect(0, config.CARD_HEIGHT, config.POSTER_WIDTH, config.POSTER_FOOTER_HEIGHT)

  ctx.setFillStyle('#2d2822')
  ctx.setFontSize(28)
  ctx.setTextAlign('left')
  ctx.fillText(posterTitle, 42, config.CARD_HEIGHT + 64)

  ctx.setFillStyle('#6f6254')
  ctx.setFontSize(22)
  ctx.fillText('打开留马日记，先记一下今天的牛马状态', 42, config.CARD_HEIGHT + 104)
  ctx.drawImage(appCodePath, config.POSTER_WIDTH - config.QR_SIZE - 42, config.CARD_HEIGHT + 24, config.QR_SIZE, config.QR_SIZE)

  return new Promise(function (resolve) {
    ctx.draw(false, function () {
      resolve()
    })
  }).then(function () {
    return canvasToTempFilePath(page)
  })
}

module.exports = {
  getImageInfo: getImageInfo,
  renderMoodCard: renderMoodCard,
  renderIncomeCard: renderIncomeCard,
  renderWeeklyCard: renderWeeklyCard,
  renderMonthlyCard: renderMonthlyCard,
  renderStreakCard: renderStreakCard,
  renderWishCard: renderWishCard,
  renderCalmCard: renderCalmCard,
  drawSharePoster: drawSharePoster
}
