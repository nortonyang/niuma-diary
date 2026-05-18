const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

function countHighPressureDays() {
  var records = storage.getDailyRecords()
  var today = new Date()
  today.setHours(0, 0, 0, 0)
  var count = 0
  Object.keys(records).forEach(function (dateText) {
    var date = dateUtil.parseDate(dateText)
    var diff = today.getTime() - date.getTime()
    var inRange = diff >= 0 && diff <= 13 * 24 * 60 * 60 * 1000
    if (inRange && Number(records[dateText].quitIndex) >= 80) {
      count += 1
    }
  })
  return count
}

function buildPressureSummary(highPressureDays) {
  if (!highPressureDays) {
    return '最近还没有连续爆表，先把状态记下来。'
  }
  if (highPressureDays < 4) {
    return '最近已经有几天明显高压，但还没到持续失控。'
  }
  if (highPressureDays < 7) {
    return '压力已经开始连续累积，值得认真看一眼。'
  }
  return '这段时间的高压已经比较明显，别只靠硬扛。'
}

Page({
  data: {
    durationOptions: ['刚刚发生', '持续几天', '超过两周', '超过一个月'],
    runwayOptions: ['不到 1 个月', '1-3 个月', '3-6 个月', '6 个月以上'],
    durationIndex: 0,
    runwayIndex: 1,
    hasNextIncome: false,
    hasPendingBenefits: true,
    resumeUpdated: false,
    clearPlan: false,
    suddenEvent: true,
    hasNextIncomeClass: '',
    hasNextIncomeText: '否',
    hasPendingBenefitsClass: 'active warn',
    hasPendingBenefitsText: '有',
    resumeUpdatedClass: '',
    resumeUpdatedText: '否',
    clearPlanClass: '',
    clearPlanText: '否',
    suddenEventClass: 'active warn',
    suddenEventText: '是',
    highPressureDays: 0,
    pressurePercent: 0,
    pressureSummary: '最近还没有连续爆表，先把状态记下来。',
    result: {
      title: '先冷静 24 小时',
      copy: '今天情绪很满，先不要把临时冲动当成最终决定。'
    }
  },

  onShow: function () {
    var highPressureDays = countHighPressureDays()
    this.setData({
      highPressureDays: highPressureDays,
      pressurePercent: Math.min(100, Math.round(highPressureDays / 14 * 100)),
      pressureSummary: buildPressureSummary(highPressureDays)
    })
    this.updateResult()
  },

  onDurationChange: function (event) {
    this.setData({
      durationIndex: Number(event.detail.value) || 0
    })
    this.updateResult()
  },

  onRunwayChange: function (event) {
    this.setData({
      runwayIndex: Number(event.detail.value) || 0
    })
    this.updateResult()
  },

  toggleFlag: function (event) {
    var key = event.currentTarget.dataset.key
    var value = {}
    value[key] = !this.data[key]
    this.setData(value)
    this.updateResult()
  },

  buildSwitchMeta: function () {
    return {
      hasNextIncomeClass: this.data.hasNextIncome ? 'active' : '',
      hasNextIncomeText: this.data.hasNextIncome ? '是' : '否',
      hasPendingBenefitsClass: this.data.hasPendingBenefits ? 'active warn' : '',
      hasPendingBenefitsText: this.data.hasPendingBenefits ? '有' : '无',
      resumeUpdatedClass: this.data.resumeUpdated ? 'active' : '',
      resumeUpdatedText: this.data.resumeUpdated ? '是' : '否',
      clearPlanClass: this.data.clearPlan ? 'active' : '',
      clearPlanText: this.data.clearPlan ? '是' : '否',
      suddenEventClass: this.data.suddenEvent ? 'active warn' : '',
      suddenEventText: this.data.suddenEvent ? '是' : '否'
    }
  },

  updateResult: function () {
    var result
    if (this.data.suddenEvent || this.data.durationIndex === 0) {
      result = {
        title: '先冷静 24 小时',
        copy: '这次更像被突发事件点燃。先睡一觉，明天再看这条记录。'
      }
    } else if (this.data.runwayIndex < 2) {
      result = {
        title: '建议先攒到 3 个月生活费',
        copy: '退路还不够厚，先把存款、社保和支出盘清楚。'
      }
    } else if (this.data.hasPendingBenefits) {
      result = {
        title: '先处理关键权益',
        copy: '年终奖、绩效、期权或竞业事项会影响离职时点，先逐项确认。'
      }
    } else if (this.data.highPressureDays >= 7) {
      result = {
        title: '值得认真审视当前工作',
        copy: '最近连续高压已经比较明显，可以开始做更完整的离职准备。'
      }
    } else if (this.data.resumeUpdated && this.data.clearPlan && (this.data.hasNextIncome || this.data.runwayIndex >= 2)) {
      result = {
        title: '可以开始制定离职计划',
        copy: '你已经有一定准备，下一步是把时间点、交接和预算写清楚。'
      }
    } else {
      result = {
        title: '适合开始更新简历',
        copy: '先把选择权拿回来，再决定什么时候离开。'
      }
    }

    this.setData(Object.assign({
      result: result
    }, this.buildSwitchMeta()))
  },

  openChecklist: function () {
    wx.navigateTo({
      url: '/pages/checklist/checklist'
    })
  },

  shareResult: function () {
    wx.navigateTo({
      url: '/pages/share/share?type=calm&title=' + encodeURIComponent(this.data.result.title) + '&copy=' + encodeURIComponent(this.data.result.copy) + '&pressure=' + this.data.pressurePercent
    })
  },

  onShareAppMessage: function () {
    return {
      title: '离职前先冷静一下',
      path: '/pages/calm/calm'
    }
  }
})
