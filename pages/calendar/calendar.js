const constants = require('../../utils/constants')
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')
const calculations = require('../../utils/calculations')
const characterDrawer = require('../../utils/character-drawer')

function enrichRecord(record) {
  if (!record) return null
  var reasonLabels = (record.reasons || []).map(function (reason) {
    return constants.findLabel(constants.REASONS, reason)
  }).filter(Boolean)

  return Object.assign({}, record, {
    moodLabel: constants.findLabel(constants.MOODS, record.mood),
    reasonText: reasonLabels.length ? reasonLabels.join('、') : '未选择原因',
    noteText: record.note || '这天没有写吐槽。'
  })
}

function monthSubtitle(summary) {
  if (!summary.count) {
    return '这个月还没开始记'
  }
  return '这个月已记 ' + summary.count + ' 天'
}

Page({
  data: {
    activeTab: 'month', // 'month' | 'week'
    year: 0,
    month: 0,
    monthTitle: '',
    monthSubtitle: '',
    weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    cells: [],
    summary: calculations.summarizeMonth({}, 2026, 1),
    weeklySummary: calculations.summarizeRecentDays({}, 7, {}),
    selectedDate: '',
    selectedDisplayDate: '',
    selectedRecord: null
  },

  onShow: function () {
    var now = new Date()
    var year = this.data.year || now.getFullYear()
    var month = this.data.month || now.getMonth() + 1
    this.setData({
      year: year,
      month: month
    })
    this.renderCalendar()
    this.renderWeeklySummary()
    this.drawEmptyStates()
  },

  drawEmptyStates: function () {
    if (this.data.activeTab === 'month' && this.data.summary.count === 0) {
      this.drawRestingCharacters('emptyMonthCanvas')
    } else if (this.data.activeTab === 'week' && this.data.weeklySummary.count === 0) {
      this.drawRestingCharacters('emptyWeekCanvas')
    }
  },

  drawRestingCharacters: function (canvasId) {
    var ctx = wx.createCanvasContext(canvasId, this)
    ctx.setFillStyle('rgba(37, 59, 54, 0.03)')
    characterDrawer.drawRoundRectPath(ctx, 30, 60, 100, 15, 8)
    ctx.fill()
    characterDrawer.drawCow(ctx, 45, 55, 0.8, 'sleepy')
    characterDrawer.drawHorse(ctx, 115, 60, 0.8, 'sleepy')
    ctx.draw()
  },

  renderCalendar: function () {
    var records = storage.getDailyRecords()
    var settings = storage.getSettings()
    var today = dateUtil.getToday()
    var selectedDate = this.data.selectedDate
    var summary = calculations.summarizeMonth(records, this.data.year, this.data.month, settings)

    if (!selectedDate && dateUtil.isInMonth(today, this.data.year, this.data.month) && records[today]) {
      selectedDate = today
    }

    var cells = dateUtil.buildMonthCells(this.data.year, this.data.month).map(function (cell) {
      var record = cell.date ? records[cell.date] : null
      return Object.assign({}, cell, {
        record: record,
        levelClass: record ? calculations.classForQuitIndex(record.quitIndex) : 'level-0',
        todayClass: cell.date === today ? 'is-today' : '',
        selectedClass: cell.date && cell.date === selectedDate ? 'selected' : '',
        hasRecordClass: record ? 'has-record' : ''
      })
    })

    this.setData({
      selectedDate: selectedDate,
      monthTitle: this.data.year + ' 年 ' + this.data.month + ' 月',
      monthSubtitle: monthSubtitle(summary),
      cells: cells,
      summary: summary,
      selectedRecord: selectedDate ? enrichRecord(records[selectedDate]) : null,
      selectedDisplayDate: selectedDate ? dateUtil.formatDisplayDate(selectedDate) : ''
    })
  },

  renderWeeklySummary: function () {
    var records = storage.getDailyRecords()
    var settings = storage.getSettings()
    var weeklySummary = calculations.summarizeRecentDays(records, 7, settings)
    this.setData({
      weeklySummary: weeklySummary
    })
  },

  switchTab: function (event) {
    var tab = event.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return
    this.setData({
      activeTab: tab
    })
    setTimeout(function () {
      this.drawEmptyStates()
    }.bind(this), 50)
  },

  prevMonth: function () {
    var next = dateUtil.addMonths(this.data.year, this.data.month, -1)
    this.setData({
      year: next.year,
      month: next.month,
      selectedDate: ''
    })
    this.renderCalendar()
  },

  nextMonth: function () {
    var next = dateUtil.addMonths(this.data.year, this.data.month, 1)
    this.setData({
      year: next.year,
      month: next.month,
      selectedDate: ''
    })
    this.renderCalendar()
  },

  selectDate: function (event) {
    var date = event.currentTarget.dataset.date
    if (!date) return
    this.setData({
      selectedDate: date
    })
    this.renderCalendar()
  },

  goToToday: function () {
    wx.switchTab({
      url: '/pages/today/today'
    })
  },

  shareWeeklyReport: function () {
    wx.navigateTo({
      url: '/pages/share/share?type=weekly'
    })
  },

  shareMonthlyReport: function () {
    wx.navigateTo({
      url: '/pages/share/share?type=monthly&year=' + this.data.year + '&month=' + this.data.month
    })
  },

  onShareAppMessage: function () {
    return {
      title: '我的班味日历',
      path: '/pages/calendar/calendar'
    }
  }
})
