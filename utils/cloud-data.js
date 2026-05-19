const cloudConfig = require('./cloud-config')
const storage = require('./storage')

const COLLECTIONS = {
  DAILY_RECORDS: 'daily_records',
  USER_SETTINGS: 'user_settings',
  WISHES: 'wishes',
  CHECKLIST_ITEMS: 'checklist_items'
}

function isCloudEnabled() {
  return cloudConfig.isConfigured() && typeof wx !== 'undefined' && !!wx.cloud
}

function skippedResult(data) {
  return Promise.resolve({
    skipped: true,
    data: data || null
  })
}

function database() {
  return wx.cloud.database()
}

// --- Sync Status & Queue ---

function getPendingQueue() {
  try {
    var queue = wx.getStorageSync('niuma_pending_sync_queue')
    return Array.isArray(queue) ? queue : []
  } catch (error) {
    return []
  }
}

function savePendingQueue(queue) {
  wx.setStorageSync('niuma_pending_sync_queue', queue)
  storage.saveSyncStatus({
    pendingCount: queue.length
  })
}

function addToPendingQueue(collection, action, payload, error) {
  var queue = getPendingQueue()
  var id = collection + '_' + (payload.id || payload.date || Date.now())
  
  var nextQueue = queue.filter(function (item) {
    return !(item.collection === collection && (item.payload.id === payload.id || item.payload.date === payload.date))
  })

  nextQueue.push({
    id: id,
    collection: collection,
    action: action,
    payload: payload,
    createdAt: Date.now(),
    retryCount: 0,
    lastError: error || ''
  })

  savePendingQueue(nextQueue)
}

function updateSyncStatus(update) {
  storage.saveSyncStatus(Object.assign({ lastSyncAt: Date.now() }, update))
}

function processPendingQueue() {
  if (!isCloudEnabled()) return Promise.resolve()

  var queue = getPendingQueue()
  if (!queue.length) return Promise.resolve()

  var tasks = queue.map(function (item) {
    var collection = item.collection
    var action = item.action
    var payload = item.payload

    if (collection === COLLECTIONS.DAILY_RECORDS) {
      return saveDailyRecord(payload)
    }
    if (collection === COLLECTIONS.USER_SETTINGS) {
      return saveSettings(payload)
    }
    if (collection === COLLECTIONS.WISHES) {
      return action === 'delete' ? deleteWish(payload.id) : saveWish(payload)
    }
    if (collection === COLLECTIONS.CHECKLIST_ITEMS) {
      return action === 'delete' ? deleteChecklistItem(payload.id) : saveChecklistItem(payload)
    }
    return Promise.resolve({ skipped: true })
  })

  return Promise.allSettled(tasks).then(function (results) {
    var nextQueue = []
    var successCount = 0
    var lastErrorMessage = ''

    results.forEach(function (res, index) {
      if (res.status === 'fulfilled') {
        successCount++
      } else {
        var failedItem = queue[index]
        failedItem.retryCount++
        failedItem.lastError = res.reason ? (res.reason.message || String(res.reason)) : 'Unknown error'
        lastErrorMessage = failedItem.lastError
        
        if (failedItem.retryCount < 5) {
          nextQueue.push(failedItem)
        }
      }
    })

    savePendingQueue(nextQueue)
    
    var statusUpdate = {}
    if (nextQueue.length > 0) {
      statusUpdate.lastError = successCount > 0 ? '部分同步成功，剩余: ' + nextQueue.length : (lastErrorMessage || '同步失败')
    } else {
      statusUpdate.lastError = ''
    }
    updateSyncStatus(statusUpdate)
  })
}

// --- Normalizers ---

function normalizeDailyRecord(raw) {
  if (!raw) return null
  var createdAt = Number(raw.createdAt) || 0
  var updatedAt = Number(raw.updatedAt) || createdAt || 0
  return {
    _id: raw._id,
    date: raw.recordDate || raw.date,
    quitIndex: Number(raw.quitIndex) || 0,
    mood: raw.mood || 'annoyed',
    reasons: raw.reasons || [],
    note: raw.note || '',
    createdAt: createdAt,
    updatedAt: updatedAt
  }
}

function normalizeSettings(raw) {
  raw = raw || {}
  var updatedAt = Number(raw.updatedAt) || 0
  return {
    _id: raw._id,
    userId: raw.userId || raw._id || raw._openid || '',
    nickname: raw.nickname || '',
    monthlySalary: raw.monthlySalary || '',
    workDaysPerMonth: Number(raw.workDaysPerMonth) || 21.75,
    workHoursPerDay: Number(raw.workHoursPerDay) || 8,
    updatedAt: updatedAt
  }
}

function normalizeWish(raw) {
  if (!raw) return null
  var createdAt = Number(raw.createdAt) || 0
  var updatedAt = Number(raw.updatedAt) || createdAt || 0
  return {
    _id: raw._id,
    id: raw.localId || raw.id || raw._id,
    title: raw.title || '',
    category: raw.category || 'rest',
    estimatedCost: raw.estimatedCost || '',
    firstStep: raw.firstStep || '',
    progressStatus: raw.progressStatus || 'todo',
    pinned: !!raw.pinned,
    createdAt: createdAt,
    updatedAt: updatedAt
  }
}

function normalizeChecklistItem(raw) {
  if (!raw) return null
  var createdAt = Number(raw.createdAt) || 0
  var updatedAt = Number(raw.updatedAt) || createdAt || 0
  return {
    _id: raw._id,
    id: raw.localId || raw.id || raw._id,
    title: raw.title || '',
    stage: raw.stage || 'cool_down',
    completed: !!raw.completed,
    custom: !!raw.custom,
    sort: Number(raw.sort) || 0,
    sourceWishId: raw.sourceWishId || '',
    createdAt: createdAt,
    updatedAt: updatedAt
  }
}

// --- Generic Operations ---

function fetchOne(collectionName, query) {
  if (!isCloudEnabled()) return skippedResult(null)

  var collection = database().collection(collectionName)
  var request = query ? collection.where(query) : collection

  return request.limit(1).get().then(function (res) {
    return {
      skipped: false,
      data: res.data && res.data[0] || null
    }
  })
}

function fetchAll(collectionName, query, orderBy, limit) {
  if (!isCloudEnabled()) return skippedResult([])

  var collection = database().collection(collectionName)
  var request = query ? collection.where(query) : collection

  if (orderBy) {
    request = request.orderBy(orderBy.field, orderBy.direction || 'asc')
  }

  if (limit) {
    request = request.limit(limit)
  }

  return request.get().then(function (res) {
    return {
      skipped: false,
      data: res.data || []
    }
  })
}

function upsertItem(collectionName, query, payload, normalizer) {
  if (!isCloudEnabled()) return skippedResult(payload)

  var collection = database().collection(collectionName)
  return fetchOne(collectionName, query).then(function (res) {
    var existed = res.data
    var payloadUpdatedAt = Number(payload.updatedAt) || 0
    var now = Date.now()
    var finalPayload = Object.assign({}, payload, {
      updatedAt: payload.updatedAt || now
    })

    if (existed) {
      var existedUpdatedAt = Number(existed.updatedAt) || 0
      
      // RF-010: Protect against overwriting newer cloud data with older local data
      if (payloadUpdatedAt > 0 && payloadUpdatedAt <= existedUpdatedAt) {
        return {
          skipped: true,
          data: normalizer(existed)
        }
      }

      return collection.doc(existed._id).update({
        data: finalPayload
      }).then(function () {
        return {
          skipped: false,
          data: normalizer(Object.assign({}, existed, finalPayload))
        }
      })
    }

    return collection.add({
      data: Object.assign({}, finalPayload, {
        createdAt: finalPayload.createdAt || now
      })
    }).then(function (addRes) {
      return {
        skipped: false,
        data: normalizer(Object.assign({}, finalPayload, {
          _id: addRes._id,
          createdAt: finalPayload.createdAt || now
        }))
      }
    })
  })
}

function removeItem(collectionName, query) {
  if (!isCloudEnabled()) return skippedResult(null)

  var collection = database().collection(collectionName)
  return fetchOne(collectionName, query).then(function (res) {
    var existed = res.data
    if (!existed) {
      return { skipped: false, data: null }
    }
    return collection.doc(existed._id).remove().then(function () {
      return { skipped: false, data: null }
    })
  })
}

// --- Public APIs ---

function getDailyRecord(date) {
  return fetchOne(COLLECTIONS.DAILY_RECORDS, { recordDate: date }).then(function (res) {
    res.data = normalizeDailyRecord(res.data)
    return res
  })
}

function saveDailyRecord(record) {
  var payload = {
    recordDate: record.date,
    quitIndex: Number(record.quitIndex) || 0,
    mood: record.mood || 'annoyed',
    reasons: record.reasons || [],
    note: record.note || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
  return upsertItem(COLLECTIONS.DAILY_RECORDS, { recordDate: record.date }, payload, normalizeDailyRecord)
}

function getSettings() {
  return fetchOne(COLLECTIONS.USER_SETTINGS, null).then(function (res) {
    res.data = normalizeSettings(res.data)
    return res
  })
}

function saveSettings(settings) {
  var payload = {
    userId: settings.userId || '',
    nickname: settings.nickname || '',
    monthlySalary: settings.monthlySalary || '',
    workDaysPerMonth: Number(settings.workDaysPerMonth) || 21.75,
    workHoursPerDay: Number(settings.workHoursPerDay) || 8,
    updatedAt: settings.updatedAt
  }
  return upsertItem(COLLECTIONS.USER_SETTINGS, null, payload, normalizeSettings)
}

function getWishes() {
  return fetchAll(COLLECTIONS.WISHES, null, { field: 'updatedAt', direction: 'desc' }, 3).then(function (res) {
    res.data = (res.data || []).map(normalizeWish).filter(Boolean)
    return res
  })
}

function getWish(id) {
  return fetchOne(COLLECTIONS.WISHES, { localId: id }).then(function (res) {
    res.data = normalizeWish(res.data)
    return res
  })
}

function saveWish(wish) {
  var localId = wish.id || 'wish_' + Date.now()
  var payload = {
    localId: localId,
    title: wish.title || '',
    category: wish.category || 'rest',
    estimatedCost: wish.estimatedCost || '',
    firstStep: wish.firstStep || '',
    progressStatus: wish.progressStatus || 'todo',
    pinned: !!wish.pinned,
    createdAt: wish.createdAt,
    updatedAt: wish.updatedAt
  }
  return upsertItem(COLLECTIONS.WISHES, { localId: localId }, payload, normalizeWish)
}

function deleteWish(id) {
  return removeItem(COLLECTIONS.WISHES, { localId: id })
}

function getChecklistItems() {
  return fetchAll(COLLECTIONS.CHECKLIST_ITEMS, null, { field: 'sort', direction: 'asc' }).then(function (res) {
    res.data = (res.data || []).map(normalizeChecklistItem).filter(Boolean)
    return res
  })
}

function getChecklistItem(id) {
  return fetchOne(COLLECTIONS.CHECKLIST_ITEMS, { localId: id }).then(function (res) {
    res.data = normalizeChecklistItem(res.data)
    return res
  })
}

function saveChecklistItem(item) {
  var localId = item.id || 'check_' + Date.now()
  var payload = {
    localId: localId,
    title: item.title || '',
    stage: item.stage || 'cool_down',
    completed: !!item.completed,
    custom: !!item.custom,
    sort: Number(item.sort) || 0,
    sourceWishId: item.sourceWishId || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
  return upsertItem(COLLECTIONS.CHECKLIST_ITEMS, { localId: localId }, payload, normalizeChecklistItem)
}

function deleteChecklistItem(id) {
  return removeItem(COLLECTIONS.CHECKLIST_ITEMS, { localId: id })
}

function clearAllCloudData() {
  if (!isCloudEnabled()) return skippedResult(null)

  // RF-004: Use cloud function for secure and complete data clearing
  return wx.cloud.callFunction({
    name: 'clearUserData'
  }).then(function (res) {
    var result = res.result || {}
    if (result.success) {
      return { skipped: false, data: true }
    }
    throw new Error(result.error || 'Clear cloud data failed')
  })
}

module.exports = {
  COLLECTIONS: COLLECTIONS,
  database: database,
  isCloudEnabled: isCloudEnabled,
  getPendingQueue: getPendingQueue,
  addToPendingQueue: addToPendingQueue,
  processPendingQueue: processPendingQueue,
  updateSyncStatus: updateSyncStatus,
  getDailyRecord: getDailyRecord,
  saveDailyRecord: saveDailyRecord,
  getSettings: getSettings,
  saveSettings: saveSettings,
  getWishes: getWishes,
  getWish: getWish,
  saveWish: saveWish,
  deleteWish: deleteWish,
  getChecklistItems: getChecklistItems,
  getChecklistItem: getChecklistItem,
  saveChecklistItem: saveChecklistItem,
  deleteChecklistItem: deleteChecklistItem,
  clearAllCloudData: clearAllCloudData
}
