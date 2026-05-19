const constants = require('./constants')

function readStorage(key, fallback) {
  try {
    var value = wx.getStorageSync(key)
    if (value === '' || value === null || typeof value === 'undefined') {
      return fallback
    }
    return value
  } catch (error) {
    return fallback
  }
}

function writeStorage(key, value) {
  wx.setStorageSync(key, value)
}

function normalizeSettings(raw) {
  var source = raw || {}
  return {
    userId: source.userId || source._id || source._openid || source.openid || source.openId || '',
    nickname: source.nickname || '',
    monthlySalary: source.monthlySalary || '',
    workDaysPerMonth: Number(source.workDaysPerMonth) || constants.DEFAULT_SETTINGS.workDaysPerMonth,
    workHoursPerDay: Number(source.workHoursPerDay) || constants.DEFAULT_SETTINGS.workHoursPerDay,
    updatedAt: source.updatedAt || 0
  }
}

function getDailyRecords() {
  var records = readStorage(constants.STORAGE_KEYS.DAILY_RECORDS, {})
  if (!records || Array.isArray(records) || typeof records !== 'object') {
    return {}
  }
  return records
}

function getDailyRecord(date) {
  return getDailyRecords()[date] || null
}

function getDailyDrafts() {
  var drafts = readStorage(constants.STORAGE_KEYS.DAILY_DRAFTS, {})
  if (!drafts || Array.isArray(drafts) || typeof drafts !== 'object') {
    return {}
  }
  return drafts
}

function getDailyDraft(date) {
  return getDailyDrafts()[date] || null
}

function saveDailyDraft(draft) {
  var drafts = getDailyDrafts()
  var now = Date.now()
  var nextDraft = Object.assign({}, draft, {
    quitIndex: Number(draft.quitIndex) || 0,
    reasons: draft.reasons || [],
    note: draft.note || '',
    updatedAt: now
  })

  drafts[nextDraft.date] = nextDraft
  writeStorage(constants.STORAGE_KEYS.DAILY_DRAFTS, drafts)
  return nextDraft
}

function clearDailyDraft(date) {
  var drafts = getDailyDrafts()
  if (!drafts[date]) return
  delete drafts[date]
  writeStorage(constants.STORAGE_KEYS.DAILY_DRAFTS, drafts)
}

function saveDailyRecord(record) {
  var records = getDailyRecords()
  var now = Date.now()
  var existed = records[record.date]
  var nextRecord = Object.assign({}, record, {
    quitIndex: Number(record.quitIndex) || 0,
    reasons: record.reasons || [],
    note: record.note || '',
    createdAt: existed ? existed.createdAt : now,
    updatedAt: now
  })

  records[nextRecord.date] = nextRecord
  writeStorage(constants.STORAGE_KEYS.DAILY_RECORDS, records)
  return nextRecord
}

function getWishes() {
  var wishes = readStorage(constants.STORAGE_KEYS.AFTER_QUIT_WISHES, [])
  return Array.isArray(wishes) ? wishes : []
}

function getWishEditorDraft() {
  var draft = readStorage(constants.STORAGE_KEYS.WISH_EDITOR_DRAFT, null)
  if (!draft || Array.isArray(draft) || typeof draft !== 'object') {
    return null
  }
  return draft
}

function saveWishEditorDraft(draft) {
  var nextDraft = Object.assign({}, draft, {
    id: draft.id || '',
    title: draft.title || '',
    editorTitle: draft.editorTitle || '新增愿望',
    category: draft.category || constants.WISH_CATEGORIES[0].value,
    categoryIndex: Number(draft.categoryIndex) || 0,
    estimatedCost: draft.estimatedCost || '',
    firstStep: draft.firstStep || '',
    createdAt: draft.createdAt,
    updatedAt: Date.now()
  })
  writeStorage(constants.STORAGE_KEYS.WISH_EDITOR_DRAFT, nextDraft)
  return nextDraft
}

function clearWishEditorDraft() {
  wx.removeStorageSync(constants.STORAGE_KEYS.WISH_EDITOR_DRAFT)
}

function normalizeWish(wish) {
  var createdAt = Number(wish.createdAt) || 0
  var updatedAt = Number(wish.updatedAt) || createdAt || 0
  return {
    id: wish.id || '',
    title: wish.title || '',
    category: wish.category || constants.WISH_CATEGORIES[0].value,
    estimatedCost: wish.estimatedCost || '',
    firstStep: wish.firstStep || '',
    progressStatus: wish.progressStatus || 'todo',
    pinned: !!wish.pinned,
    createdAt: createdAt,
    updatedAt: updatedAt
  }
}

function saveWish(wish) {
  var wishes = getWishes()
  var now = Date.now()
  
  // RF-007: Ensure we normalize but keep/set timestamps for local save
  var nextWish = normalizeWish(wish)
  nextWish.id = nextWish.id || 'wish_' + now
  nextWish.createdAt = nextWish.createdAt || now
  nextWish.updatedAt = now // Always update time on local save
  
  // REQ-1401: If pinning this wish, unpin others
  if (nextWish.pinned) {
    wishes.forEach(function (item) {
      if (item.id !== nextWish.id) {
        item.pinned = false
        item.updatedAt = now
      }
    })
  }

  var existed = false
  var nextWishes = wishes.map(function (item) {
    if (item.id === nextWish.id) {
      existed = true
      return nextWish
    }
    return item
  })

  if (!existed) {
    nextWishes.unshift(nextWish)
  }

  writeStorage(constants.STORAGE_KEYS.AFTER_QUIT_WISHES, nextWishes.slice(0, 3))
  return nextWish
}

function mergeWishes(items) {
  var localWishes = getWishes()
  var mergedMap = {}

  localWishes.forEach(function (wish) {
    mergedMap[wish.id] = normalizeWish(wish)
  })

  ;(items || []).forEach(function (cloudWish) {
    var normalizedCloud = normalizeWish(cloudWish)
    var localWish = mergedMap[normalizedCloud.id]
    
    // RF-007: Compare using stable timestamps. Cloud 0 will not overwrite local > 0.
    if (!localWish || (normalizedCloud.updatedAt > (localWish.updatedAt || 0))) {
      mergedMap[normalizedCloud.id] = normalizedCloud
    }
  })

  var merged = Object.keys(mergedMap).map(function (id) {
    return mergedMap[id]
  })

  // RF-006: Sort by updatedAt desc and keep top 3
  merged.sort(function (a, b) {
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  })

  var nextWishes = merged.slice(0, 3)
  writeStorage(constants.STORAGE_KEYS.AFTER_QUIT_WISHES, nextWishes)
  return nextWishes
}

function writeWishes(wishes) {
  var nextWishes = Array.isArray(wishes) ? wishes.slice(0, 3).map(normalizeWish) : []
  writeStorage(constants.STORAGE_KEYS.AFTER_QUIT_WISHES, nextWishes)
  return nextWishes
}

function deleteWish(id) {
  var nextWishes = getWishes().filter(function (wish) {
    return wish.id !== id
  })
  writeStorage(constants.STORAGE_KEYS.AFTER_QUIT_WISHES, nextWishes)
}

function toggleWishPin(id) {
  var now = Date.now()
  var wishes = getWishes().map(function (wish) {
    if (wish.id === id) {
      return Object.assign({}, wish, {
        pinned: !wish.pinned,
        updatedAt: now
      })
    }
    // If we are pinning a new one, unpin others
    return Object.assign({}, wish, {
      pinned: false,
      updatedAt: wish.pinned ? now : wish.updatedAt
    })
  })
  writeStorage(constants.STORAGE_KEYS.AFTER_QUIT_WISHES, wishes)
  return wishes
}

function normalizeChecklistItem(item) {
  var createdAt = Number(item.createdAt) || 0
  var updatedAt = Number(item.updatedAt) || createdAt || 0
  return {
    id: item.id,
    title: item.title || '',
    stage: item.stage || constants.CHECKLIST_STAGES[0].value,
    completed: !!item.completed,
    custom: !!item.custom,
    sort: Number(item.sort) || 0,
    sourceWishId: item.sourceWishId || '',
    createdAt: createdAt,
    updatedAt: updatedAt
  }
}

function getDefaultChecklistItems() {
  return constants.DEFAULT_CHECKLIST_ITEMS.map(function (item) {
    return normalizeChecklistItem(Object.assign({}, item, {
      completed: false,
      custom: false
    }))
  })
}

function getChecklistItems() {
  var items = readStorage(constants.STORAGE_KEYS.CHECKLIST_ITEMS, null)
  if (!Array.isArray(items)) {
    return getDefaultChecklistItems()
  }
  return items.map(normalizeChecklistItem)
}

function writeChecklistItems(items) {
  writeStorage(constants.STORAGE_KEYS.CHECKLIST_ITEMS, items.map(normalizeChecklistItem))
}

function mergeChecklistItems(items) {
  var mergedMap = {}
  var merged = []

  getChecklistItems().forEach(function (item) {
    mergedMap[item.id] = normalizeChecklistItem(item)
  })

  ;(items || []).forEach(function (item) {
    var cloudItem = normalizeChecklistItem(item)
    var localItem = mergedMap[cloudItem.id]

    // RF-007: Use stable timestamps for conflict resolution.
    if (!localItem || (cloudItem.updatedAt > (localItem.updatedAt || 0))) {
      mergedMap[cloudItem.id] = cloudItem
    }
  })

  constants.CHECKLIST_STAGES.forEach(function (stage) {
    var stageItems = []
    Object.keys(mergedMap).forEach(function (id) {
      if (mergedMap[id].stage === stage.value) {
        stageItems.push(mergedMap[id])
      }
    })
    stageItems.sort(function (a, b) {
      return a.sort - b.sort
    }).forEach(function (item) {
      merged.push(item)
    })
  })

  writeChecklistItems(merged)
  return merged
}

function toggleChecklistItem(id) {
  var items = getChecklistItems().map(function (item) {
    if (item.id !== id) return item
    return Object.assign({}, item, {
      completed: !item.completed,
      updatedAt: Date.now()
    })
  })
  writeChecklistItems(items)
  return items
}

function saveChecklistItem(item) {
  var items = getChecklistItems()
  var now = Date.now()
  
  // RF-007: Use stable normalization
  var nextItem = normalizeChecklistItem(item)
  nextItem.id = nextItem.id || 'check_' + now
  nextItem.custom = typeof item.custom === 'boolean' ? item.custom : true
  nextItem.sort = typeof item.sort === 'number' ? item.sort : (item.id ? 0 : now)
  nextItem.createdAt = nextItem.createdAt || now
  nextItem.updatedAt = now
  
  var existed = false
  var nextItems = items.map(function (candidate) {
    if (candidate.id === nextItem.id) {
      existed = true
      return nextItem
    }
    return candidate
  })
  if (!existed) {
    nextItems.push(nextItem)
  }
  writeChecklistItems(nextItems)
  return nextItem
}

function deleteChecklistItem(id) {
  writeChecklistItems(getChecklistItems().filter(function (item) {
    return item.id !== id
  }))
}

function getCalmHistory() {
  var history = readStorage(constants.STORAGE_KEYS.CALM_HISTORY, [])
  if (!Array.isArray(history)) {
    return []
  }
  return history
}

function saveCalmHistoryItem(item) {
  var history = getCalmHistory()
  var now = Date.now()
  var nextItem = Object.assign({}, item, {
    id: item.id || 'calm_' + now,
    createdAt: item.createdAt || now,
    updatedAt: now
  })
  history.unshift(nextItem)
  // Keep last 50 records to avoid storage bloat
  writeStorage(constants.STORAGE_KEYS.CALM_HISTORY, history.slice(0, 50))
  return nextItem
}

function deleteCalmHistoryItem(id) {
  var nextHistory = getCalmHistory().filter(function (item) {
    return item.id !== id
  })
  writeStorage(constants.STORAGE_KEYS.CALM_HISTORY, nextHistory)
}

function getSettings() {
  return normalizeSettings(readStorage(constants.STORAGE_KEYS.USER_SETTINGS, constants.DEFAULT_SETTINGS))
}

function saveSettings(settings) {
  var current = getSettings()
  // RF-003: Use provided updatedAt (from cloud) or current time (local change)
  var nextSettings = normalizeSettings(Object.assign({}, current, settings))
  if (!settings.updatedAt) {
    nextSettings.updatedAt = Date.now()
  }
  writeStorage(constants.STORAGE_KEYS.USER_SETTINGS, nextSettings)
  return nextSettings
}

function getSyncStatus() {
  var status = readStorage('niuma_sync_status', null)
  if (!status || typeof status !== 'object') {
    return {
      lastSyncAt: 0,
      lastError: '',
      pendingCount: 0
    }
  }
  return status
}

function saveSyncStatus(status) {
  var current = getSyncStatus()
  var nextStatus = Object.assign({}, current, status)
  writeStorage('niuma_sync_status', nextStatus)
  return nextStatus
}

function getStorageDebugSummary() {
  var dailyRecords = getDailyRecords()
  var dailyDrafts = getDailyDrafts()
  var wishes = getWishes()
  var wishEditorDraft = getWishEditorDraft()
  var settings = getSettings()
  var checklistItems = getChecklistItems()
  var calmHistory = getCalmHistory()
  var checklistDoneCount = checklistItems.filter(function (item) {
    return item.completed
  }).length
  var info

  try {
    info = wx.getStorageInfoSync()
  } catch (error) {
    info = {
      keys: [],
      currentSize: 0,
      limitSize: 0
    }
  }

  return {
    usageText: '已用 ' + info.currentSize + ' KB / ' + info.limitSize + ' KB',
    keyCountText: (info.keys || []).length + ' 个 key',
    items: [
      {
        label: '打卡记录',
        key: constants.STORAGE_KEYS.DAILY_RECORDS,
        countText: Object.keys(dailyRecords).length + ' 天',
        statusText: Object.keys(dailyRecords).length ? '最近记录已写入' : '暂无记录'
      },
      {
        label: '今日草稿',
        key: constants.STORAGE_KEYS.DAILY_DRAFTS,
        countText: Object.keys(dailyDrafts).length + ' 份',
        statusText: Object.keys(dailyDrafts).length ? '存在未正式提交内容' : '无草稿'
      },
      {
        label: '愿望列表',
        key: constants.STORAGE_KEYS.AFTER_QUIT_WISHES,
        countText: wishes.length + ' 个',
        statusText: wishes.length ? '最多保留 3 个' : '暂无愿望'
      },
      {
        label: '愿望编辑草稿',
        key: constants.STORAGE_KEYS.WISH_EDITOR_DRAFT,
        countText: wishEditorDraft ? '1 份' : '0 份',
        statusText: wishEditorDraft ? '存在弹窗编辑草稿' : '无草稿'
      },
      {
        label: '本地设置',
        key: constants.STORAGE_KEYS.USER_SETTINGS,
        countText: '1 份',
        statusText: settings.monthlySalary ? '月薪已填写' : '月薪未填写'
      },
      {
        label: '准备清单',
        key: constants.STORAGE_KEYS.CHECKLIST_ITEMS,
        countText: checklistItems.length + ' 项',
        statusText: checklistDoneCount + '/' + checklistItems.length + ' 已完成'
      },
      {
        label: '冷静器历史',
        key: constants.STORAGE_KEYS.CALM_HISTORY,
        countText: calmHistory.length + ' 条',
        statusText: calmHistory.length ? '记录已存档' : '暂无历史'
      }
    ]
  }
}

function getStorageDebugSnapshot() {
  var info

  try {
    info = wx.getStorageInfoSync()
  } catch (error) {
    info = {
      keys: [],
      currentSize: 0,
      limitSize: 0
    }
  }

  return {
    exportedAt: Date.now(),
    summary: getStorageDebugSummary(),
    storageInfo: info,
    data: {
      dailyRecords: getDailyRecords(),
      dailyDrafts: getDailyDrafts(),
      wishes: getWishes(),
      wishEditorDraft: getWishEditorDraft(),
      settings: getSettings(),
      checklistItems: getChecklistItems(),
      calmHistory: getCalmHistory()
    }
  }
}

function clearAllData() {
  wx.removeStorageSync(constants.STORAGE_KEYS.DAILY_RECORDS)
  wx.removeStorageSync(constants.STORAGE_KEYS.DAILY_DRAFTS)
  wx.removeStorageSync(constants.STORAGE_KEYS.WISH_EDITOR_DRAFT)
  wx.removeStorageSync(constants.STORAGE_KEYS.AFTER_QUIT_WISHES)
  wx.removeStorageSync(constants.STORAGE_KEYS.USER_SETTINGS)
  wx.removeStorageSync(constants.STORAGE_KEYS.CHECKLIST_ITEMS)
  wx.removeStorageSync(constants.STORAGE_KEYS.CALM_HISTORY)
  
  // RF-009: Also clear sync queue and status to prevent ghost updates
  wx.removeStorageSync('niuma_pending_sync_queue')
  wx.removeStorageSync('niuma_sync_status')
}

module.exports = {
  getDailyRecords: getDailyRecords,
  getDailyRecord: getDailyRecord,
  getDailyDrafts: getDailyDrafts,
  getDailyDraft: getDailyDraft,
  saveDailyDraft: saveDailyDraft,
  clearDailyDraft: clearDailyDraft,
  saveDailyRecord: saveDailyRecord,
  getWishEditorDraft: getWishEditorDraft,
  saveWishEditorDraft: saveWishEditorDraft,
  clearWishEditorDraft: clearWishEditorDraft,
  getWishes: getWishes,
  saveWish: saveWish,
  writeWishes: writeWishes,
  mergeWishes: mergeWishes,
  deleteWish: deleteWish,
  toggleWishPin: toggleWishPin,
  getChecklistItems: getChecklistItems,
  writeChecklistItems: writeChecklistItems,
  mergeChecklistItems: mergeChecklistItems,
  toggleChecklistItem: toggleChecklistItem,
  saveChecklistItem: saveChecklistItem,
  deleteChecklistItem: deleteChecklistItem,
  getCalmHistory: getCalmHistory,
  saveCalmHistoryItem: saveCalmHistoryItem,
  deleteCalmHistoryItem: deleteCalmHistoryItem,
  getSettings: getSettings,
  saveSettings: saveSettings,
  getSyncStatus: getSyncStatus,
  saveSyncStatus: saveSyncStatus,
  getStorageDebugSummary: getStorageDebugSummary,
  getStorageDebugSnapshot: getStorageDebugSnapshot,
  clearAllData: clearAllData
}
