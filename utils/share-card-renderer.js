const config = require('./share-card-config')

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

function drawSharePoster(page, cardPath, appCodePath) {
  var ctx = wx.createCanvasContext(config.POSTER_CANVAS_ID, page)

  ctx.setFillStyle('#fff7e8')
  ctx.fillRect(0, 0, config.POSTER_WIDTH, config.POSTER_HEIGHT)
  ctx.drawImage(cardPath, 0, 0, config.POSTER_WIDTH, config.CARD_HEIGHT)

  ctx.setFillStyle('#fffdf8')
  ctx.fillRect(0, config.CARD_HEIGHT, config.POSTER_WIDTH, config.POSTER_FOOTER_HEIGHT)
  ctx.setFillStyle('#2d2822')
  ctx.setFontSize(28)
  ctx.setTextAlign('left')
  ctx.fillText('长按识别小程序码', 42, config.CARD_HEIGHT + 64)
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
  drawSharePoster: drawSharePoster
}
