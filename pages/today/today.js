const constants = require('../../utils/constants')
const storage = require('../../utils/storage')
const cloudData = require('../../utils/cloud-data')
const dateUtil = require('../../utils/date')
const calculations = require('../../utils/calculations')
const holidays = require('../../utils/holidays')
const sync = require('../../utils/sync')

const QUICK_REASON_VALUES = ['low_salary', 'overtime', 'boss', 'commute']
const CHARACTER_IMAGES = {
  relaxed: '/assets/images/characters/today-character-relaxed.png',
  neutral: '/assets/images/characters/today-character-neutral.png',
  tired: '/assets/images/characters/today-character-tired.png',
  angry: '/assets/images/characters/today-character-angry.png',
  explode: '/assets/images/characters/today-character-explode.png'
}

function formatHeaderDate(dateText) {
  return dateUtil.formatHeaderDateWithLunar(dateText)
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

function getCharacterImage(quitIndex) {
  var index = Number(quitIndex) || 0
  if (index >= 90) return CHARACTER_IMAGES.explode
  if (index >= 75) return CHARACTER_IMAGES.angry
  if (index >= 55) return CHARACTER_IMAGES.tired
  if (index >= 30) return CHARACTER_IMAGES.neutral
  return CHARACTER_IMAGES.relaxed
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
    currentCharacterImage: CHARACTER_IMAGES.neutral,
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
    showSuccessModal: false,
    successImage: '/assets/images/share-cards/success_cheer.jpg',
    countdownItems: [],
    holidayCardTitle: '离最近假期还有',
    holidayCardValue: '',
    holidayCardHint: '',
    holidayCardBadge: '',
    income: calculations.calculateIncome(constants.DEFAULT_SETTINGS, 0),
    incomeCardLabel: '设置月薪后',
    incomeCardCopy: '这里会自动算出今天没裸辞约赚了多少',
    streak: 0
  },

  onShow: function () {
    this.loadToday()
    this.startPageTimer()
  },

  onHide: function () {
    this.forcePersistDraft()
    this.stopAllTimers()
  },

  onUnload: function () {
    this.forcePersistDraft()
    this.stopAllTimers()
  },

  loadToday: function () {
    var today = dateUtil.getToday()
    var record = storage.getDailyRecord(today)
    var draft = storage.getDailyDraft(today)
    var settings = storage.getSettings()
    var now = new Date()
    var records = storage.getDailyRecords()
    var summary = calculations.summarizeMonth(records, now.getFullYear(), now.getMonth() + 1)
    var streak = calculations.calculateStreak(records, today)

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
    var holidayCard = holidays.buildHolidayCard(now)
    var hiddenSelectedCount = selectedReasons.filter(function (value) {
      return QUICK_REASON_VALUES.indexOf(value) < 0
    }).length
    var showNoteEditor = !!note
    var wishes = storage.getWishes()
    var pinnedWish = wishes.find(function (w) { return w.pinned })

    this.setData({
      today: today,
      headerDate: formatHeaderDate(today),
      dailyCopy: pickDailyCopy(today),
      heroLine: buildHeroLine(quitIndex, mood),
      quitIndex: quitIndex,
      currentCharacterImage: getCharacterImage(quitIndex),
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
      incomeCardCopy: incomeCard.copy,
      streak: streak,
      pinnedWish: pinnedWish || null
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
    this.setData({
      draftStatusText: '草稿保存中...'
    })
    if (this.draftTimer) {
      clearTimeout(this.draftTimer)
    }
    this.draftTimer = setTimeout(function () {
      this.forcePersistDraft()
    }.bind(this), 500)
  },

  forcePersistDraft: function () {
    if (this.draftTimer) {
      clearTimeout(this.draftTimer)
      this.draftTimer = null
    }

    // REQ-1102: Avoid re-creating draft if it's identical to the saved record for today
    var record = storage.getDailyRecord(this.data.today)
    var draftData = buildDraftPayload(this)
    if (record && 
        record.quitIndex === draftData.quitIndex && 
        record.mood === draftData.mood && 
        JSON.stringify(record.reasons || []) === JSON.stringify(draftData.reasons || []) && 
        record.note === draftData.note) {
      // If matches saved record, clear any lingering draft and don't save new one
      storage.clearDailyDraft(this.data.today)
      return
    }

    storage.saveDailyDraft(draftData)
    this.setData({
      draftStatusText: '草稿已自动保存'
    })
  },

  updatePageTimer: function () {
    var now = new Date()
    var holidayCard = holidays.buildHolidayCard(now)
    this.setData({
      holidayCardTitle: holidayCard.holidayCardTitle,
      holidayCardValue: holidayCard.holidayCardValue,
      holidayCardHint: holidayCard.holidayCardHint,
      holidayCardBadge: holidayCard.holidayCardBadge
    })
  },

  updateModalTimer: function () {
    var now = new Date()
    this.setData({
      countdownItems: holidays.buildCountdownItems(now)
    })
  },

  startPageTimer: function () {
    this.stopPageTimer()
    this.updatePageTimer()
    // Home page holiday card updates every minute
    this.pageTimer = setInterval(function () {
      this.updatePageTimer()
    }.bind(this), 60000)
  },

  stopPageTimer: function () {
    if (this.pageTimer) {
      clearInterval(this.pageTimer)
      this.pageTimer = null
    }
  },

  startModalTimer: function () {
    this.stopModalTimer()
    this.updateModalTimer()
    // Modal countdown updates every second
    this.modalTimer = setInterval(function () {
      this.updateModalTimer()
    }.bind(this), 1000)
  },

  stopModalTimer: function () {
    if (this.modalTimer) {
      clearInterval(this.modalTimer)
      this.modalTimer = null
    }
  },

  stopAllTimers: function () {
    this.stopPageTimer()
    this.stopModalTimer()
  },

  openCountdownModal: function () {
    this.setData({
      showCountdownModal: true
    })
    this.startModalTimer()
  },

  closeCountdownModal: function () {
    this.stopModalTimer()
    this.setData({
      showCountdownModal: false
    })
  },

  closeSuccessModal: function () {
    this.setData({
      showSuccessModal: false
    })
  },

  noop: function () {},

  onIndexChanging: function (event) {
    var quitIndex = Number(event.detail.value) || 0
    this.setData({
      quitIndex: quitIndex,
      currentCharacterImage: getCharacterImage(quitIndex),
      heroLine: buildHeroLine(quitIndex, this.data.mood)
    })
  },

  onIndexChange: function (event) {
    var quitIndex = Number(event.detail.value) || 0
    this.setData({
      quitIndex: quitIndex,
      currentCharacterImage: getCharacterImage(quitIndex),
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
    this.forcePersistDraft()
    var recordData = {
      date: this.data.today || dateUtil.getToday(),
      quitIndex: this.data.quitIndex,
      mood: this.data.mood,
      reasons: this.data.selectedReasons,
      note: this.data.note
    }

    // 1. Save locally first
    var record = storage.saveDailyRecord(recordData)
    storage.clearDailyDraft(record.date)

    // 2. Update UI immediately for local success
    this.setData({
      savedRecord: record,
      savedLabel: '已记录',
      saveButtonText: '更新今日打卡',
      draftStatusText: '',
      cloudSyncText: cloudData.isCloudEnabled() ? '云端同步中...' : '已保存本机',
      streak: calculations.calculateStreak(storage.getDailyRecords(), this.data.today)
    })

    wx.showToast({
      title: '已保存',
      icon: 'success'
    })

    // 4. Show success cheer modal
    setTimeout(function() {
      this.setData({
        showSuccessModal: true
      })
    }.bind(this), 500)

    // 5. Trigger cloud sync if enabled
    if (cloudData.isCloudEnabled()) {
      sync.syncRecord(record)
        .then(function (res) {
          if (res.source === 'cloud') {
            this.loadToday() // Reload if cloud data was newer and updated local
          }
          this.setData({
            cloudSyncText: res.skipped ? '已保存本机' : '云端已同步'
          })
        }.bind(this))
        .catch(function () {
          this.setData({
            cloudSyncText: '云同步失败，已加入待处理队列'
          })
        }.bind(this))
    }
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

  openWishes: function () {
    wx.navigateTo({
      url: '/pages/wishes/wishes'
    })
  },

  onShareAppMessage: function () {
    return {
      title: '留马日记：每天都想走，但先记一下',
      path: '/pages/today/today'
    }
  }
})
