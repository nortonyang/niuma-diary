const constants = require('./constants')

function getVersionInfo() {
  try {
    var value = wx.getStorageSync(constants.STORAGE_KEYS.SCHEMA_VERSION_INFO)
    if (value && typeof value === 'object') {
      return value
    }
  } catch (error) {
    // ignore
  }
  return null
}

function saveVersionInfo(version) {
  wx.setStorageSync(constants.STORAGE_KEYS.SCHEMA_VERSION_INFO, {
    version: version,
    updatedAt: Date.now()
  })
}

function migrate() {
  var info = getVersionInfo()
  var currentVersion = info ? info.version : 0
  var targetVersion = constants.CURRENT_SCHEMA_VERSION

  if (currentVersion >= targetVersion) {
    return
  }

  if (currentVersion < 1) {
    runMigrationV1()
  }

  saveVersionInfo(targetVersion)
  console.log('[Migration] Migrated storage from v' + currentVersion + ' to v' + targetVersion)
}

function runMigrationV1() {
  var now = Date.now()

  // 1. Migrate Daily Records
  try {
    var recordsKey = constants.STORAGE_KEYS.DAILY_RECORDS
    var records = wx.getStorageSync(recordsKey) || {}
    var recordsChanged = false
    
    Object.keys(records).forEach(function (date) {
      var record = records[date]
      if (!record.createdAt || !record.updatedAt || !record.source) {
        record.source = record.source || 'manual'
        record.createdAt = record.createdAt || now
        record.updatedAt = record.updatedAt || now
        recordsChanged = true
      }
    })
    
    if (recordsChanged) {
      wx.setStorageSync(recordsKey, records)
    }
  } catch (e) {
    console.error('[Migration] Failed to migrate records', e)
  }

  // 2. Migrate User Settings
  try {
    var settingsKey = constants.STORAGE_KEYS.USER_SETTINGS
    var settings = wx.getStorageSync(settingsKey)
    if (settings && typeof settings === 'object' && !settings.updatedAt) {
      settings.updatedAt = now
      wx.setStorageSync(settingsKey, settings)
    }
  } catch (e) {
    console.error('[Migration] Failed to migrate settings', e)
  }

  // 3. Migrate Wishes
  try {
    var wishesKey = constants.STORAGE_KEYS.AFTER_QUIT_WISHES
    var wishes = wx.getStorageSync(wishesKey) || []
    var wishesChanged = false
    
    if (Array.isArray(wishes)) {
      wishes.forEach(function (wish) {
        if (!wish.createdAt || !wish.updatedAt) {
          wish.createdAt = wish.createdAt || now
          wish.updatedAt = wish.updatedAt || now
          wishesChanged = true
        }
      })
      
      if (wishesChanged) {
        wx.setStorageSync(wishesKey, wishes)
      }
    }
  } catch (e) {
    console.error('[Migration] Failed to migrate wishes', e)
  }

  // 4. Migrate Checklist Items
  try {
    var checklistKey = constants.STORAGE_KEYS.CHECKLIST_ITEMS
    var items = wx.getStorageSync(checklistKey)
    var itemsChanged = false
    
    if (Array.isArray(items)) {
      items.forEach(function (item) {
        if (!item.createdAt || !item.updatedAt || !item.stage) {
          item.stage = item.stage || 'cool_down'
          item.createdAt = item.createdAt || now
          item.updatedAt = item.updatedAt || now
          itemsChanged = true
        }
        if (typeof item.sort === 'undefined') {
          item.sort = 0
          itemsChanged = true
        }
      })
      
      if (itemsChanged) {
        wx.setStorageSync(checklistKey, items)
      }
    }
  } catch (e) {
    console.error('[Migration] Failed to migrate checklist', e)
  }
}

module.exports = {
  migrate: migrate
}
