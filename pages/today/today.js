const constants = require('../../utils/constants')
const storage = require('../../utils/storage')
const cloudData = require('../../utils/cloud-data')
const dateUtil = require('../../utils/date')
const calculations = require('../../utils/calculations')

const QUICK_REASON_VALUES = ['low_salary', 'overtime', 'boss', 'commute']
const HOLIDAY_PERIODS = [
  { name: '元旦', start: [2026, 1, 1], end: [2026, 1, 3] },
  { name: '春节', start: [2026, 2, 15], end: [2026, 2, 23] },
  { name: '清明节', start: [2026, 4, 4], end: [2026, 4, 6] },
  { name: '劳动节', start: [2026, 5, 1], end: [2026, 5, 5] },
  { name: '端午节', start: [2026, 6, 19], end: [2026, 6, 21] },
  { name: '中秋节', start: [2026, 9, 25], end: [2026, 9, 27] },
  { name: '国庆节', start: [2026, 10, 1], end: [2026, 10, 7] },
  { name: '元旦', start: [2027, 1, 1], end: [2027, 1, 1] }
]
const SPRING_FESTIVAL_DATES = [
  { year: 2026, parts: [2026, 2, 17] },
  { year: 2027, parts: [2027, 2, 6] },
  { year: 2028, parts: [2028, 1, 26] },
  { year: 2029, parts: [2029, 2, 13] }
]

function formatHeaderDate(dateText) {
  return dateUtil.formatHeaderDateWithLunar(dateText)
}

function createLocalDate(parts) {
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
}

function createNextDay(parts) {
  return new Date(parts[0], parts[1] - 1, parts[2] + 1, 0, 0, 0, 0)
}

function pad(number) {
  return number < 10 ? '0' + number : '' + number
}

function formatFullCountdown(milliseconds) {
  if (milliseconds <= 0) {
    return '0天00小时00分00秒'
  }

  var totalSeconds = Math.floor(milliseconds / 1000)
  var days = Math.floor(totalSeconds / 86400)
  var hours = Math.floor(totalSeconds % 86400 / 3600)
  var minutes = Math.floor(totalSeconds % 3600 / 60)
  var seconds = totalSeconds % 60

  return days + '天' + pad(hours) + '小时' + pad(minutes) + '分' + pad(seconds) + '秒'
}

function formatTargetHint(date, name, ongoing) {
  if (ongoing) {
    return name + '进行中'
  }

  return name + ' · ' + (date.getMonth() + 1) + '月' + date.getDate() + '日 00:00'
}

function getWeekendTarget(now) {
  var day = now.getDay()
  if (day === 6 || day === 0) {
    return {
      target: now,
      ongoing: true
    }
  }

  return {
    target: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - day), 0, 0, 0, 0),
    ongoing: false
  }
}

function getNextHolidayTarget(now) {
  var index

  for (index = 0; index < HOLIDAY_PERIODS.length; index += 1) {
    var current = HOLIDAY_PERIODS[index]
    var startDate = createLocalDate(current.start)
    var endDate = createNextDay(current.end)

    if (now >= startDate && now < endDate) {
      return {
        name: current.name,
        target: now,
        ongoing: true
      }
    }

    if (startDate > now) {
      return {
        name: current.name,
        target: startDate,
        ongoing: false
      }
    }
  }

  return null
}

function getNextSpringFestivalTarget(now) {
  var index

  for (index = 0; index < SPRING_FESTIVAL_DATES.length; index += 1) {
    var current = SPRING_FESTIVAL_DATES[index]
    var target = createLocalDate(current.parts)
    if (target > now) {
      return {
        name: '春节',
        target: target
      }
    }
  }

  return {
    name: '春节',
    target: createLocalDate(SPRING_FESTIVAL_DATES[SPRING_FESTIVAL_DATES.length - 1].parts)
  }
}

function buildCountdownItems(now) {
  var weekend = getWeekendTarget(now)
  var holiday = getNextHolidayTarget(now)
  var springFestival = getNextSpringFestivalTarget(now)

  if (!holiday) {
    holiday = {
      name: springFestival.name,
      target: springFestival.target,
      ongoing: false
    }
  }

  return [
    {
      key: 'weekend',
      title: '离周末还有',
      hint: weekend.ongoing ? '周末进行中' : '周六 00:00 开始',
      value: formatFullCountdown(weekend.target.getTime() - now.getTime())
    },
    {
      key: 'holiday',
      title: '离最近一个假日还有',
      hint: formatTargetHint(holiday.target, holiday.name, holiday.ongoing),
      value: formatFullCountdown(holiday.target.getTime() - now.getTime())
    },
    {
      key: 'spring-festival',
      title: '离过年还有',
      hint: formatTargetHint(springFestival.target, springFestival.name, false),
      value: formatFullCountdown(springFestival.target.getTime() - now.getTime())
    }
  ]
}

function buildHolidayCard(now) {
  var holiday = getNextHolidayTarget(now)

  if (!holiday) {
    holiday = getNextSpringFestivalTarget(now)
    holiday.ongoing = false
  }

  return {
    holidayCardTitle: holiday.ongoing ? holiday.name + '进行中' : '离最近假期还有',
    holidayCardValue: formatFullCountdown(holiday.target.getTime() - now.getTime()),
    holidayCardHint: formatTargetHint(holiday.target, holiday.name, holiday.ongoing),
    holidayCardBadge: holiday.name
  }
}

function buildMoodOptions(activeValue) {
  return constants.MOODS.map(function (item) {
    var active = item.value === activeValue
    return Object.assign({}, item, {
      active: active,
      activeClass: active ? 'active' : ''
    })
  })
}

function buildReasonList(reasonValues, selectedValues) {
  var selected = selectedValues || []
  return constants.REASONS
    .filter(function (item) {
      return reasonValues.indexOf(item.value) >= 0
    })
    .map(function (item) {
      var active = selected.indexOf(item.value) >= 0
      return Object.assign({}, item, {
        active: active,
        activeClass: active ? 'active' : ''
      })
    })
}

function pickDailyCopy(today) {
  var score = today.split('').reduce(function (total, char) {
    return total + char.charCodeAt(0)
  }, 0)
  return constants.DAILY_COPY[score % constants.DAILY_COPY.length]
}

function buildHeroLine(quitIndex, mood) {
  var index = Number(quitIndex) || 0
  if (mood === 'explode' || index >= 85) {
    return '先冷静 24 小时'
  }
  if (mood === 'want_quit' || index >= 65) {
    return '今天先不裸辞'
  }
  if (mood === 'annoyed' || index >= 35) {
    return '今天先把情绪记下'
  }
  return '今天还能稳住'
}

function buildReasonSummary(selectedReasons) {
  if (!selectedReasons || !selectedReasons.length) {
    return '可多选'
  }
  return '已选 ' + selectedReasons.length + ' 项'
}

function buildIncomeCardData(income) {
  if (!income.hasSalary) {
    return {
      label: '设置月薪后',
      copy: '这里会自动算出今天没裸辞约赚了多少'
    }
  }
  return {
    label: '今天没裸辞',
    copy: '约赚 ' + income.dailyIncomeText + ' 元'
  }
}

function buildReasonToggleText(hiddenSelectedCount, showAllReasons) {
  if (showAllReasons) {
    return '收起'
  }
  return hiddenSelectedCount ? '更多 · ' + hiddenSelectedCount : '更多'
}

function buildDraftPayload(page) {
  return {
    date: page.data.today || dateUtil.getToday(),
    quitIndex: page.data.quitIndex,
    mood: page.data.mood,
    reasons: page.data.selectedReasons,
    note: page.data.note
  }
}

Page({
  data: {
    today: '',
    headerDate: '',
    dailyCopy: '',
    heroLine: '',
    quitIndex: 50,
    mood: 'annoyed',
    moods: buildMoodOptions('annoyed'),
    quickReasons: buildReasonList(QUICK_REASON_VALUES, []),
    moreReasons: buildReasonList(
      constants.REASONS
        .filter(function (item) {
          return QUICK_REASON_VALUES.indexOf(item.value) < 0
        })
        .map(function (item) {
          return item.value
        }),
      []
    ),
    selectedReasons: [],
    showAllReasons: false,
    reasonToggleText: '更多',
    moreReasonsActiveClass: '',
    reasonSummary: '可多选',
    note: '',
    noteLength: 0,
    showNoteEditor: false,
    noteToggleText: '可选',
    savedRecord: null,
    savedLabel: '待记录',
    saveButtonText: '保存今日打卡',
    draftStatusText: '',
    cloudSyncText: '',
    showCountdownModal: false,
    countdownItems: [],
    holidayCardTitle: '离最近假期还有',
    holidayCardValue: '',
    holidayCardHint: '',
    holidayCardBadge: '',
    income: calculations.calculateIncome(constants.DEFAULT_SETTINGS, 0),
    incomeCardLabel: '设置月薪后',
    incomeCardCopy: '这里会自动算出今天没裸辞约赚了多少'
  },

  onShow: function () {
    this.loadToday()
    this.startCountdownTimer()
  },

  onHide: function () {
    this.stopCountdownTimer()
  },

  onUnload: function () {
    this.stopCountdownTimer()
  },

  loadToday: function () {
    var today = dateUtil.getToday()
    var record = storage.getDailyRecord(today)
    var draft = storage.getDailyDraft(today)
    var settings = storage.getSettings()
    var now = new Date()
    var records = storage.getDailyRecords()
    var summary = calculations.summarizeMonth(records, now.getFullYear(), now.getMonth() + 1)

    if (draft && record && (draft.updatedAt || 0) <= (record.updatedAt || 0)) {
      storage.clearDailyDraft(today)
      draft = null
    }

    var source = draft || record
    var quitIndex = source ? source.quitIndex : 50
    var mood = source ? source.mood : 'annoyed'
    var selectedReasons = source ? source.reasons || [] : []
    var note = source ? source.note || '' : ''
    var income = calculations.calculateIncome(settings, summary.count)
    var incomeCard = buildIncomeCardData(income)
    var holidayCard = buildHolidayCard(now)
    var hiddenSelectedCount = selectedReasons.filter(function (value) {
      return QUICK_REASON_VALUES.indexOf(value) < 0
    }).length
    var showNoteEditor = !!note

    this.setData({
      today: today,
      headerDate: formatHeaderDate(today),
      dailyCopy: pickDailyCopy(today),
      heroLine: buildHeroLine(quitIndex, mood),
      quitIndex: quitIndex,
      mood: mood,
      moods: buildMoodOptions(mood),
      selectedReasons: selectedReasons,
      quickReasons: buildReasonList(QUICK_REASON_VALUES, selectedReasons),
      moreReasons: buildReasonList(
        constants.REASONS
          .filter(function (item) {
            return QUICK_REASON_VALUES.indexOf(item.value) < 0
          })
          .map(function (item) {
            return item.value
          }),
        selectedReasons
      ),
      showAllReasons: false,
      reasonToggleText: buildReasonToggleText(hiddenSelectedCount, false),
      moreReasonsActiveClass: hiddenSelectedCount ? 'active' : '',
      reasonSummary: buildReasonSummary(selectedReasons),
      note: note,
      noteLength: note.length,
      showNoteEditor: showNoteEditor,
      noteToggleText: note ? '已填写' : '可选',
      savedRecord: record,
      savedLabel: record ? '已记录' : '待记录',
      saveButtonText: record ? '更新今日打卡' : '保存今日打卡',
      draftStatusText: draft ? '草稿已自动保存' : '',
      holidayCardTitle: holidayCard.holidayCardTitle,
      holidayCardValue: holidayCard.holidayCardValue,
      holidayCardHint: holidayCard.holidayCardHint,
      holidayCardBadge: holidayCard.holidayCardBadge,
      income: income,
      incomeCardLabel: incomeCard.label,
      incomeCardCopy: incomeCard.copy
    })
    this.syncTodayFromCloud(today)
  },

  syncTodayFromCloud: function (today) {
    cloudData.getDailyRecord(today)
      .then(function (res) {
        if (res.skipped || !res.data) return

        var draft = storage.getDailyDraft(today)
        var localRecord = storage.getDailyRecord(today)
        var cloudRecord = res.data
        var localUpdatedAt = localRecord ? localRecord.updatedAt || 0 : 0

        if (cloudRecord.updatedAt <= localUpdatedAt) {
          return
        }

        storage.saveDailyRecord(cloudRecord)

        if (draft && (draft.updatedAt || 0) > (cloudRecord.updatedAt || 0)) {
          this.setData({
            cloudSyncText: '云端记录已同步，本地草稿仍优先展示'
          })
          return
        }

        this.loadToday()
        this.setData({
          cloudSyncText: '云端记录已同步'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云端同步失败，当前使用本地数据'
        })
      }.bind(this))
  },

  persistDraft: function () {
    storage.saveDailyDraft(buildDraftPayload(this))
    this.setData({
      draftStatusText: '草稿已自动保存'
    })
  },

  updateCountdownModal: function () {
    var now = new Date()
    var holidayCard = buildHolidayCard(now)
    this.setData({
      countdownItems: buildCountdownItems(now),
      holidayCardTitle: holidayCard.holidayCardTitle,
      holidayCardValue: holidayCard.holidayCardValue,
      holidayCardHint: holidayCard.holidayCardHint,
      holidayCardBadge: holidayCard.holidayCardBadge
    })
  },

  startCountdownTimer: function () {
    this.stopCountdownTimer()
    this.updateCountdownModal()
    this.countdownTimer = setInterval(function () {
      this.updateCountdownModal()
    }.bind(this), 1000)
  },

  stopCountdownTimer: function () {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
      this.countdownTimer = null
    }
  },

  openCountdownModal: function () {
    this.setData({
      showCountdownModal: true
    })
    this.startCountdownTimer()
  },

  closeCountdownModal: function () {
    this.stopCountdownTimer()
    this.setData({
      showCountdownModal: false
    })
  },

  noop: function () {},

  onIndexChanging: function (event) {
    var quitIndex = Number(event.detail.value) || 0
    this.setData({
      quitIndex: quitIndex,
      heroLine: buildHeroLine(quitIndex, this.data.mood)
    })
  },

  onIndexChange: function (event) {
    var quitIndex = Number(event.detail.value) || 0
    this.setData({
      quitIndex: quitIndex,
      heroLine: buildHeroLine(quitIndex, this.data.mood)
    })
    this.persistDraft()
  },

  pickMood: function (event) {
    var value = event.currentTarget.dataset.value
    this.setData({
      mood: value,
      moods: buildMoodOptions(value),
      heroLine: buildHeroLine(this.data.quitIndex, value)
    })
    this.persistDraft()
  },

  toggleReason: function (event) {
    var value = event.currentTarget.dataset.value
    var selected = this.data.selectedReasons.slice()
    var index = selected.indexOf(value)

    if (index >= 0) {
      selected.splice(index, 1)
    } else {
      selected.push(value)
    }

    var hiddenSelectedCount = selected.filter(function (reason) {
      return QUICK_REASON_VALUES.indexOf(reason) < 0
    }).length

    this.setData({
      selectedReasons: selected,
      quickReasons: buildReasonList(QUICK_REASON_VALUES, selected),
      moreReasons: buildReasonList(
        constants.REASONS
          .filter(function (item) {
            return QUICK_REASON_VALUES.indexOf(item.value) < 0
          })
          .map(function (item) {
            return item.value
          }),
        selected
      ),
      reasonSummary: buildReasonSummary(selected),
      reasonToggleText: buildReasonToggleText(hiddenSelectedCount, this.data.showAllReasons),
      moreReasonsActiveClass: hiddenSelectedCount || this.data.showAllReasons ? 'active' : ''
    })
    this.persistDraft()
  },

  toggleMoreReasons: function () {
    var nextShowAll = !this.data.showAllReasons
    var hiddenSelectedCount = this.data.selectedReasons.filter(function (reason) {
      return QUICK_REASON_VALUES.indexOf(reason) < 0
    }).length
    this.setData({
      showAllReasons: nextShowAll,
      reasonToggleText: buildReasonToggleText(hiddenSelectedCount, nextShowAll),
      moreReasonsActiveClass: hiddenSelectedCount || nextShowAll ? 'active' : ''
    })
  },

  toggleNoteEditor: function () {
    var next = !this.data.showNoteEditor
    this.setData({
      showNoteEditor: next,
      noteToggleText: this.data.note ? '已填写' : next ? '已展开' : '可选'
    })
  },

  onNoteInput: function (event) {
    var value = event.detail.value || ''
    this.setData({
      note: value,
      noteLength: value.length,
      noteToggleText: value ? '已填写' : '可选'
    })
    this.persistDraft()
  },

  saveRecord: function () {
    var record = storage.saveDailyRecord({
      date: this.data.today || dateUtil.getToday(),
      quitIndex: this.data.quitIndex,
      mood: this.data.mood,
      reasons: this.data.selectedReasons,
      note: this.data.note
    })

    wx.showToast({
      title: '已保存',
      icon: 'success'
    })

    storage.clearDailyDraft(record.date)

    this.setData({
      savedRecord: record,
      savedLabel: '已记录',
      saveButtonText: '更新今日打卡',
      draftStatusText: '',
      cloudSyncText: cloudData.isCloudEnabled() ? '正在同步云端...' : '当前仅保存在本机'
    })
    this.loadToday()
    setTimeout(function () {
      wx.navigateTo({
        url: '/pages/share/share?type=mood'
      })
    }, 500)
    cloudData.saveDailyRecord(record)
      .then(function (res) {
        this.setData({
          cloudSyncText: res.skipped ? '当前仅保存在本机' : '已同步到云端'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云同步失败，已保存在本机'
        })
      }.bind(this))
  },

  handleIncomeTap: function () {
    if (!this.data.income.hasSalary) {
      this.openSettings()
      return
    }
    if (!this.data.savedRecord) {
      wx.showToast({
        title: '先保存打卡',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/share/share?type=income'
    })
  },

  openSettings: function () {
    wx.switchTab({
      url: '/pages/me/me'
    })
  },

  openShare: function (event) {
    var type = event.currentTarget.dataset.type || 'index'
    if (!this.data.savedRecord) {
      wx.showToast({
        title: '先保存打卡',
        icon: 'none'
      })
      return
    }
    if (type === 'income' && !this.data.income.hasSalary) {
      wx.showToast({
        title: '先设置月薪',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/share/share?type=' + type
    })
  },

  openCalm: function () {
    wx.navigateTo({
      url: '/pages/calm/calm'
    })
  },

  openChecklist: function () {
    wx.navigateTo({
      url: '/pages/checklist/checklist'
    })
  },

  onShareAppMessage: function () {
    return {
      title: '留马日记：每天都想走，但先记一下',
      path: '/pages/today/today'
    }
  }
})
