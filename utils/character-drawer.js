/**
 * Utility for drawing Cow and Horse characters and related scene elements on Canvas.
 * Used for share cards, interactive feedback, and empty states.
 */

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

function drawCow(ctx, x, y, scale, emotion) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  // Body
  fillRoundRect(ctx, -20, 0, 40, 30, 8, '#ffffff')
  ctx.setStrokeStyle('#261f19')
  ctx.setLineWidth(2)
  drawRoundRectPath(ctx, -20, 0, 40, 30, 8)
  ctx.stroke()

  // Head
  fillRoundRect(ctx, -15, -25, 30, 25, 10, '#ffffff')
  drawRoundRectPath(ctx, -15, -25, 30, 25, 10)
  ctx.stroke()

  // Horns
  ctx.beginPath()
  ctx.moveTo(-10, -25)
  ctx.lineTo(-15, -35)
  ctx.moveTo(10, -25)
  ctx.lineTo(15, -35)
  ctx.stroke()

  // Ears
  fillRoundRect(ctx, -22, -20, 8, 12, 4, '#ffffff')
  fillRoundRect(ctx, 14, -20, 8, 12, 4, '#ffffff')
  drawRoundRectPath(ctx, -22, -20, 8, 12, 4)
  ctx.stroke()
  drawRoundRectPath(ctx, 14, -20, 8, 12, 4)
  ctx.stroke()

  // Eyes
  ctx.setFillStyle('#261f19')
  if (emotion === 'tired' || emotion === 'sleepy') {
    ctx.fillRect(-8, -15, 6, 2)
    ctx.fillRect(2, -15, 6, 2)
  } else if (emotion === 'explode' || emotion === 'angry') {
    ctx.setFontSize(10)
    ctx.fillText('>', -10, -10)
    ctx.fillText('<', 4, -10)
  } else {
    ctx.beginPath()
    ctx.arc(-5, -14, 2, 0, Math.PI * 2)
    ctx.arc(5, -14, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Nose/Snout
  fillRoundRect(ctx, -10, -10, 20, 12, 6, '#f8d7da')
  ctx.beginPath()
  ctx.arc(-3, -4, 1.5, 0, Math.PI * 2)
  ctx.arc(3, -4, 1.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawHorse(ctx, x, y, scale, emotion) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)

  // Body
  fillRoundRect(ctx, -18, 0, 36, 35, 10, '#f5efdf')
  ctx.setStrokeStyle('#261f19')
  ctx.setLineWidth(2)
  drawRoundRectPath(ctx, -18, 0, 36, 35, 10)
  ctx.stroke()

  // Neck
  fillRoundRect(ctx, -12, -15, 15, 20, 5, '#f5efdf')
  drawRoundRectPath(ctx, -12, -15, 15, 20, 5)
  ctx.stroke()

  // Head
  fillRoundRect(ctx, -12, -35, 28, 22, 8, '#f5efdf')
  drawRoundRectPath(ctx, -12, -35, 28, 22, 8)
  ctx.stroke()

  // Mane
  ctx.setFillStyle('#8b4513')
  ctx.beginPath()
  ctx.moveTo(-12, -35)
  ctx.bezierCurveTo(-18, -45, -10, -50, -5, -40)
  ctx.lineTo(-5, -15)
  ctx.lineTo(-12, -15)
  ctx.closePath()
  ctx.fill()

  // Ears
  ctx.beginPath()
  ctx.moveTo(-5, -35)
  ctx.lineTo(-8, -45)
  ctx.lineTo(-1, -38)
  ctx.moveTo(10, -35)
  ctx.lineTo(13, -45)
  ctx.lineTo(16, -38)
  ctx.stroke()

  // Eyes
  ctx.setFillStyle('#261f19')
  if (emotion === 'tired' || emotion === 'sleepy') {
    ctx.beginPath()
    ctx.moveTo(0, -25)
    ctx.lineTo(6, -25)
    ctx.moveTo(14, -25)
    ctx.lineTo(20, -25)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(6, -26, 2, 0, Math.PI * 2)
    ctx.arc(16, -26, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
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

module.exports = {
  drawRoundRectPath: drawRoundRectPath,
  fillRoundRect: fillRoundRect,
  drawCow: drawCow,
  drawHorse: drawHorse,
  drawCloud: drawCloud,
  drawHill: drawHill,
  drawRain: drawRain,
  drawLightning: drawLightning
}
