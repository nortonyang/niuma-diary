const cloudConfig = require('./cloud-config')

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

function normalizeDailyRecord(raw) {
  if (!raw) return null
  return {
    _id: raw._id,
    date: raw.recordDate || raw.date,
    quitIndex: Number(raw.quitIndex) || 0,
    mood: raw.mood || 'annoyed',
    reasons: raw.reasons || [],
    note: raw.note || '',
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now()
  }
}

function normalizeSettings(raw) {
  raw = raw || {}
  return {
    _id: raw._id,
    userId: raw.userId || raw._id || raw._openid || '',
    nickname: raw.nickname || '',
    monthlySalary: raw.monthlySalary || '',
    workDaysPerMonth: Number(raw.workDaysPerMonth) || 21.75,
    workHoursPerDay: Number(raw.workHoursPerDay) || 8,
    updatedAt: raw.updatedAt || Date.now()
  }
}

function normalizeWish(raw) {
  if (!raw) return null
  return {
    _id: raw._id,
    id: raw.localId || raw.id || raw._id,
    title: raw.title || '',
    category: raw.category || 'rest',
    estimatedCost: raw.estimatedCost || '',
    firstStep: raw.firstStep || '',
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now()
  }
}

function normalizeChecklistItem(raw) {
  if (!raw) return null
  return {
    _id: raw._id,
    id: raw.localId || raw.id || raw._id,
    title: raw.title || '',
    stage: raw.stage || 'cool_down',
    completed: !!raw.completed,
    custom: !!raw.custom,
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now()
  }
}

function getDailyRecord(date) {
  if (!isCloudEnabled()) {
    return skippedResult(null)
  }

  return database()
    .collection(COLLECTIONS.DAILY_RECORDS)
    .where({
      recordDate: date
    })
    .limit(1)
    .get()
    .then(function (res) {
      return {
        skipped: false,
        data: normalizeDailyRecord(res.data && res.data[0])
      }
    })
}

function saveDailyRecord(record) {
  if (!isCloudEnabled()) {
    return skippedResult(record)
  }

  var now = Date.now()
  var payload = {
    recordDate: record.date,
    quitIndex: Number(record.quitIndex) || 0,
    mood: record.mood || 'annoyed',
    reasons: record.reasons || [],
    note: record.note || '',
    updatedAt: now
  }
  var collection = database().collection(COLLECTIONS.DAILY_RECORDS)

  return collection
    .where({
      recordDate: record.date
    })
    .limit(1)
    .get()
    .then(function (res) {
      var existed = res.data && res.data[0]
      if (existed) {
        return collection.doc(existed._id).update({
          data: payload
        }).then(function () {
          return {
            skipped: false,
            data: normalizeDailyRecord(Object.assign({}, existed, payload))
          }
        })
      }

      return collection.add({
        data: Object.assign({}, payload, {
          createdAt: record.createdAt || now
        })
      }).then(function (addRes) {
        return {
          skipped: false,
          data: normalizeDailyRecord(Object.assign({}, payload, {
            _id: addRes._id,
            createdAt: record.createdAt || now
          }))
        }
      })
    })
}

function getSettings() {
  if (!isCloudEnabled()) {
    return skippedResult(null)
  }

  return database()
    .collection(COLLECTIONS.USER_SETTINGS)
    .limit(1)
    .get()
    .then(function (res) {
      var settings = res.data && res.data[0]
      return {
        skipped: false,
        data: settings ? normalizeSettings(settings) : null
      }
    })
}

function saveSettings(settings) {
  if (!isCloudEnabled()) {
    return skippedResult(settings)
  }

  var now = Date.now()
  var payload = {
    userId: settings.userId || '',
    nickname: settings.nickname || '',
    monthlySalary: settings.monthlySalary || '',
    workDaysPerMonth: Number(settings.workDaysPerMonth) || 21.75,
    workHoursPerDay: Number(settings.workHoursPerDay) || 8,
    updatedAt: now
  }
  var collection = database().collection(COLLECTIONS.USER_SETTINGS)

  return collection
    .limit(1)
    .get()
    .then(function (res) {
      var existed = res.data && res.data[0]
      if (existed) {
        return collection.doc(existed._id).update({
          data: payload
        }).then(function () {
          return {
            skipped: false,
            data: normalizeSettings(Object.assign({}, existed, payload))
          }
        })
      }

      return collection.add({
        data: Object.assign({}, payload, {
          createdAt: now
        })
      }).then(function (addRes) {
        return {
          skipped: false,
          data: normalizeSettings(Object.assign({}, payload, {
            _id: addRes._id,
            createdAt: now
          }))
        }
      })
    })
}

function getWishes() {
  if (!isCloudEnabled()) {
    return skippedResult([])
  }

  return database()
    .collection(COLLECTIONS.WISHES)
    .orderBy('updatedAt', 'desc')
    .limit(3)
    .get()
    .then(function (res) {
      return {
        skipped: false,
        data: (res.data || []).map(normalizeWish).filter(Boolean)
      }
    })
}

function saveWish(wish) {
  if (!isCloudEnabled()) {
    return skippedResult(wish)
  }

  var now = Date.now()
  var localId = wish.id || 'wish_' + now
  var payload = {
    localId: localId,
    title: wish.title || '',
    category: wish.category || 'rest',
    estimatedCost: wish.estimatedCost || '',
    firstStep: wish.firstStep || '',
    updatedAt: now
  }
  var collection = database().collection(COLLECTIONS.WISHES)

  return collection
    .where({
      localId: localId
    })
    .limit(1)
    .get()
    .then(function (res) {
      var existed = res.data && res.data[0]
      if (existed) {
        return collection.doc(existed._id).update({
          data: payload
        }).then(function () {
          return {
            skipped: false,
            data: normalizeWish(Object.assign({}, existed, payload))
          }
        })
      }

      return collection.add({
        data: Object.assign({}, payload, {
          createdAt: wish.createdAt || now
        })
      }).then(function (addRes) {
        return {
          skipped: false,
          data: normalizeWish(Object.assign({}, payload, {
            _id: addRes._id,
            createdAt: wish.createdAt || now
          }))
        }
      })
    })
}

function deleteWish(id) {
  if (!isCloudEnabled()) {
    return skippedResult(null)
  }

  var collection = database().collection(COLLECTIONS.WISHES)
  return collection
    .where({
      localId: id
    })
    .limit(1)
    .get()
    .then(function (res) {
      var existed = res.data && res.data[0]
      if (!existed) {
        return {
          skipped: false,
          data: null
        }
      }
      return collection.doc(existed._id).remove().then(function () {
        return {
          skipped: false,
          data: null
        }
      })
    })
}

function getChecklistItems() {
  if (!isCloudEnabled()) {
    return skippedResult([])
  }

  return database()
    .collection(COLLECTIONS.CHECKLIST_ITEMS)
    .orderBy('updatedAt', 'desc')
    .get()
    .then(function (res) {
      return {
        skipped: false,
        data: (res.data || []).map(normalizeChecklistItem).filter(Boolean)
      }
    })
}

function saveChecklistItem(item) {
  if (!isCloudEnabled()) {
    return skippedResult(item)
  }

  var now = Date.now()
  var localId = item.id || 'check_' + now
  var payload = {
    localId: localId,
    title: item.title || '',
    stage: item.stage || 'cool_down',
    completed: !!item.completed,
    custom: !!item.custom,
    updatedAt: now
  }
  var collection = database().collection(COLLECTIONS.CHECKLIST_ITEMS)

  return collection
    .where({
      localId: localId
    })
    .limit(1)
    .get()
    .then(function (res) {
      var existed = res.data && res.data[0]
      if (existed) {
        return collection.doc(existed._id).update({
          data: payload
        }).then(function () {
          return {
            skipped: false,
            data: normalizeChecklistItem(Object.assign({}, existed, payload))
          }
        })
      }

      return collection.add({
        data: Object.assign({}, payload, {
          createdAt: item.createdAt || now
        })
      }).then(function (addRes) {
        return {
          skipped: false,
          data: normalizeChecklistItem(Object.assign({}, payload, {
            _id: addRes._id,
            createdAt: item.createdAt || now
          }))
        }
      })
    })
}

function deleteChecklistItem(id) {
  if (!isCloudEnabled()) {
    return skippedResult(null)
  }

  var collection = database().collection(COLLECTIONS.CHECKLIST_ITEMS)
  return collection
    .where({
      localId: id
    })
    .limit(1)
    .get()
    .then(function (res) {
      var existed = res.data && res.data[0]
      if (!existed) {
        return {
          skipped: false,
          data: null
        }
      }
      return collection.doc(existed._id).remove().then(function () {
        return {
          skipped: false,
          data: null
        }
      })
    })
}

module.exports = {
  COLLECTIONS: COLLECTIONS,
  isCloudEnabled: isCloudEnabled,
  getDailyRecord: getDailyRecord,
  saveDailyRecord: saveDailyRecord,
  getSettings: getSettings,
  saveSettings: saveSettings,
  getWishes: getWishes,
  saveWish: saveWish,
  deleteWish: deleteWish,
  getChecklistItems: getChecklistItems,
  saveChecklistItem: saveChecklistItem,
  deleteChecklistItem: deleteChecklistItem
}
