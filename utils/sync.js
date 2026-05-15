const storage = require('./storage')
const cloudData = require('./cloud-data')

/**
 * Generic sync function for a single item
 */
function syncItem(options) {
  var collection = options.collection
  var localItem = options.localItem
  var fetchCloud = options.fetchCloud
  var saveCloud = options.saveCloud
  var saveLocal = options.saveLocal
  var normalizer = options.normalizer

  if (!cloudData.isCloudEnabled()) return Promise.resolve({ skipped: true, data: localItem })

  return fetchCloud().then(function (res) {
    var cloudItem = normalizer(res.data)

    if (!cloudItem) {
      // Not in cloud, push local to cloud
      if (!localItem) return { skipped: false, data: null, source: 'sync' }
      return saveCloud(localItem).then(function (cloudRes) {
        return { skipped: false, data: cloudRes.data, source: 'local' }
      })
    }

    var localUpdatedAt = localItem ? (Number(localItem.updatedAt) || 0) : 0
    var cloudUpdatedAt = Number(cloudItem.updatedAt) || 0

    if (cloudUpdatedAt > localUpdatedAt) {
      // Cloud is newer, update local
      saveLocal(cloudItem)
      return { skipped: false, data: cloudItem, source: 'cloud' }
    } else if (localUpdatedAt > cloudUpdatedAt) {
      // Local is newer, update cloud
      return saveCloud(localItem).then(function (cloudRes) {
        return { skipped: false, data: cloudRes.data, source: 'local' }
      })
    }

    // Already in sync
    return { skipped: false, data: cloudItem, source: 'sync' }
  }).catch(function (err) {
    if (localItem) {
      cloudData.addToPendingQueue(collection, 'save', localItem, err.message || String(err))
    }
    throw err
  })
}

function syncRecord(record) {
  return syncItem({
    collection: cloudData.COLLECTIONS.DAILY_RECORDS,
    localItem: record,
    fetchCloud: function () { return cloudData.getDailyRecord(record.date) },
    saveCloud: function (item) { return cloudData.saveDailyRecord(item) },
    saveLocal: function (item) { return storage.saveDailyRecord(item) },
    normalizer: function (data) { return data }, 
  }).then(function (res) {
    cloudData.updateSyncStatus({ lastError: '' })
    return res
  })
}

function syncSettings(settings) {
  return syncItem({
    collection: cloudData.COLLECTIONS.USER_SETTINGS,
    localItem: settings,
    fetchCloud: function () { return cloudData.getSettings() },
    saveCloud: function (item) { return cloudData.saveSettings(item) },
    saveLocal: function (item) { return storage.saveSettings(item) },
    normalizer: function (data) { return data },
  }).then(function (res) {
    cloudData.updateSyncStatus({ lastError: '' })
    return res
  })
}

function syncWish(wish, isDelete) {
  if (isDelete) {
    if (!cloudData.isCloudEnabled()) return Promise.resolve({ skipped: true })
    return cloudData.deleteWish(wish.id)
      .catch(function (err) {
        cloudData.addToPendingQueue(cloudData.COLLECTIONS.WISHES, 'delete', wish, err.message || String(err))
        throw err
      })
  }

  return syncItem({
    collection: cloudData.COLLECTIONS.WISHES,
    localItem: wish,
    fetchCloud: function () { return cloudData.getWish(wish.id) },
    saveCloud: function (item) { return cloudData.saveWish(item) },
    saveLocal: function (item) { return storage.saveWish(item) },
    normalizer: function (data) { return data },
  }).then(function (res) {
    cloudData.updateSyncStatus({ lastError: '' })
    return res
  })
}

function syncChecklistItem(item, isDelete) {
  if (isDelete) {
    if (!cloudData.isCloudEnabled()) return Promise.resolve({ skipped: true })
    return cloudData.deleteChecklistItem(item.id)
      .catch(function (err) {
        cloudData.addToPendingQueue(cloudData.COLLECTIONS.CHECKLIST_ITEMS, 'delete', item, err.message || String(err))
        throw err
      })
  }

  return syncItem({
    collection: cloudData.COLLECTIONS.CHECKLIST_ITEMS,
    localItem: item,
    fetchCloud: function () { return cloudData.getChecklistItem(item.id) },
    saveCloud: function (i) { return cloudData.saveChecklistItem(i) },
    saveLocal: function (i) { return storage.saveChecklistItem(i) },
    normalizer: function (data) { return data },
  }).then(function (res) {
    cloudData.updateSyncStatus({ lastError: '' })
    return res
  })
}

function processPendingQueue() {
  return cloudData.processPendingQueue()
}

module.exports = {
  syncRecord: syncRecord,
  syncSettings: syncSettings,
  syncWish: syncWish,
  syncChecklistItem: syncChecklistItem,
  processPendingQueue: processPendingQueue
}
