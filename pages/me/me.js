const storage = require('../../utils/storage')
const cloudData = require('../../utils/cloud-data')
const calculations = require('../../utils/calculations')
const sync = require('../../utils/sync')

function buildProfileState(settings) {
  var income = calculations.calculateIncome(settings, 0)
  var cloudEnabled = cloudData.isCloudEnabled()

  return {
    isCloudEnabled: cloudEnabled,
    profileName: settings.nickname || '匿名打工人',
    profileCopy: cloudEnabled
      ? (income.hasSalary
        ? '日均约 ' + income.dailyIncomeText + ' 元，正式数据可同步到云端。'
        : '不强制登录；启用云开发后，正式数据可同步到云端。')
      : (income.hasSalary
        ? '日均约 ' + income.dailyIncomeText + ' 元，数据默认保存在本机。'
        : '数据默认保存在本机，不强制登录。'),
    incomeSummaryTitle: income.hasSalary
      ? '日均约 ' + income.dailyIncomeText + ' 元'
      : '设置月薪后可换算今日收入',
    incomeSummaryCopy: income.hasSalary
      ? '用于计算今日收入，开启云同步后会同步到云端。分享图默认不展示。'
      : '用于计算今日收入，数据仅在您开启云同步后上传。分享图不展示。'
  }
}

function pad(number) {
  return number < 10 ? '0' + number : '' + number
}

function formatExportTime(timestamp) {
  if (!timestamp) return '无'
  var date = new Date(timestamp)
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
    pad(date.getHours()) + ':' + pad(date.getMinutes())
}

function buildSyncState() {
  var status = storage.getSyncStatus()
  return {
    lastSyncTimeText: status.lastSyncAt ? formatExportTime(status.lastSyncAt) : '尚未同步',
    syncPendingCount: status.pendingCount || 0,
    syncLastError: status.lastError || ''
  }
}

function buildStorageState(snapshot) {
  var source = snapshot || storage.getStorageDebugSnapshot()
  var dailyRecords = source.data.dailyRecords || {}
  var dailyDrafts = source.data.dailyDrafts || {}
  var wishes = source.data.wishes || []
  var checklistItems = source.data.checklistItems || []
  var checklistDone = checklistItems.filter(function (item) {
    return item.completed
  }).length
  var cloudEnabled = cloudData.isCloudEnabled()

  return {
    storageModeTitle: cloudEnabled ? '支持云端同步' : '默认只存在本机',
    storageModeCopy: cloudEnabled
      ? '已配置云开发时，正式数据会同步到云端，草稿仍只保存在本机。'
      : '打卡、愿望和设置默认本地存储，不强制登录。',
    exportSummaryText: source.summary.usageText + ' · ' + source.summary.keyCountText,
    recordCountText: Object.keys(dailyRecords).length + ' 天',
    draftCountText: Object.keys(dailyDrafts).length + ' 份',
    wishCountText: wishes.length + ' 个',
    checklistCountText: checklistDone + '/' + checklistItems.length
  }
}

function buildExportPayload(snapshot) {
  return {
    appName: '留马日记',
    exportVersion: 'local-snapshot-v1',
    exportedAt: snapshot.exportedAt,
    exportedAtText: formatExportTime(snapshot.exportedAt),
    cloudEnabled: cloudData.isCloudEnabled(),
    snapshot: snapshot
  }
}

Page({
  data: {
    settings: {},
    reminder: {
      enabled: false,
      time: '20:00'
    },
    avatarSrc: '/assets/images/default-avatar.png',
    profileName: '匿名打工人',
    profileCopy: '数据默认保存在本机，不强制登录。',
    incomeSummaryTitle: '设置月薪后可换算今日收入',
    incomeSummaryCopy: '用于计算今日收入，数据仅在您开启云同步后上传。分享图不展示。',
    storageModeTitle: '默认只存在本机',
    storageModeCopy: '打卡、愿望和设置默认本地存储，不强制登录。',
    exportSummaryText: '已用 0 KB / 0 KB · 0 个 key',
    recordCountText: '0 天',
    draftCountText: '0 份',
    wishCountText: '0 个',
    checklistCountText: '0/0',
    lastExportText: '',
    cloudSyncText: '',
    isCloudEnabled: false,
    lastSyncTimeText: '尚未同步',
    syncPendingCount: 0,
    syncLastError: '',
    form: {
      nickname: '',
      monthlySalary: '',
      workDaysPerMonth: 21.75,
      workHoursPerDay: 8
    }
  },

  onShow: function () {
    this.loadSettings()
  },

  loadSettings: function () {
    var settings = storage.getSettings()
    var reminder = storage.getReminderSettings()
    var profileState = buildProfileState(settings)
    var storageState = buildStorageState()
    var syncState = buildSyncState()
    this.setData(Object.assign({
      settings: settings,
      reminder: reminder,
      avatarSrc: settings.avatarUrl || '/assets/images/default-avatar.png',
      form: Object.assign({}, settings)
    }, profileState, storageState, syncState))
    this.syncSettingsFromCloud()
  },

  onChooseAvatar: function (event) {
    var avatarUrl = event.detail.avatarUrl
    var self = this

    if (this.data.isCloudEnabled) {
      wx.showLoading({ title: '正在上传头像...' })
      // RA-20260519-004: Infer extension from temp path
      var ext = 'png'
      var parts = avatarUrl.split('.')
      if (parts.length > 1) {
        ext = parts[parts.length - 1].toLowerCase()
        // Basic safety for common image extensions
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].indexOf(ext) === -1) {
          ext = 'png'
        }
      }
      var cloudPath = 'avatars/' + Date.now() + '.' + ext
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: avatarUrl,
        success: function (res) {
          wx.hideLoading()
          self.updateAvatar(res.fileID)
        },
        fail: function (err) {
          wx.hideLoading()
          console.error('Upload avatar failed', err)
          // RA-20260519-004: Don't overwrite existing stable avatar with temp path on fail
          var currentAvatar = self.data.settings.avatarUrl
          if (currentAvatar && currentAvatar.indexOf('cloud://') === 0) {
            wx.showModal({
              title: '上传失败',
              content: '头像上传到云端失败，已保留原头像。您可以稍后重试。',
              showCancel: false
            })
          } else {
            wx.showToast({ title: '上传失败，仅本次预览可用', icon: 'none' })
            self.previewAvatar(avatarUrl)
          }
        }
      })
    } else {
      wx.showToast({ title: '头像仅本次预览，保存需开启云端', icon: 'none' })
      this.previewAvatar(avatarUrl)
    }
  },

  onNicknameOnShareChange: function (event) {
    this.setData({
      'form.showNicknameOnShare': event.detail.value
    })
  },

  updateAvatar: function (url) {
    this.setData({
      avatarSrc: url,
      'form.avatarUrl': url
    })
    // Auto save when avatar changes
    this.saveSettings()
  },

  previewAvatar: function (url) {
    this.setData({
      avatarSrc: url
    })
  },

  onNicknameBlur: function (event) {
    this.setData({
      'form.nickname': event.detail.value
    })
  },

  onReminderChange: function (event) {
    var enabled = event.detail.value
    var self = this

    if (enabled) {
      // Request subscription message authorization
      var templateId = storage.getReminderSettings().templateId
      if (templateId && templateId !== 'REPLACE_WITH_YOUR_TEMPLATE_ID') {
        wx.requestSubscribeMessage({
          tmplIds: [templateId],
          success: function (res) {
            if (res[templateId] === 'accept') {
              self.updateReminder({ enabled: true })
              wx.showToast({ title: '已开启提醒', icon: 'success' })
            } else {
              wx.showToast({ title: '授权后才能接收提醒', icon: 'none' })
              self.setData({ 'reminder.enabled': false })
            }
          },
          fail: function (err) {
            console.error('Subscribe message failed', err)
            wx.showToast({ title: '授权失败', icon: 'none' })
            self.setData({ 'reminder.enabled': false })
          }
        })
      } else {
        // Fallback if no template ID is configured
        // RA-20260519-002: Clearly state this is a local preference
        this.updateReminder({ enabled: true })
        wx.showToast({ title: '已开启本地提醒偏好', icon: 'success' })
      }
    } else {
      this.updateReminder({ enabled: false })
      wx.showToast({ title: '已关闭提醒', icon: 'success' })
    }
  },

  onReminderTimeChange: function (event) {
    var time = event.detail.value
    this.updateReminder({ time: time })
    wx.showToast({ title: '提醒时间已更新', icon: 'success' })
  },

  updateReminder: function (patch) {
    var nextReminder = storage.saveReminderSettings(patch)
    this.setData({
      reminder: nextReminder
    })
  },

  retryCloudSync: function () {
    if (!this.data.isCloudEnabled) return
    wx.showLoading({ title: '同步中...' })
    
    // Process pending failed tasks first
    sync.processPendingQueue()
      .then(function() {
        // Then sync current settings
        return sync.syncSettings(this.data.settings)
      }.bind(this))
      .then(function () {
        wx.hideLoading()
        this.loadSettings() // Reload everything to update UI
        wx.showToast({ title: '同步完成', icon: 'success' })
      }.bind(this))
      .catch(function() {
        wx.hideLoading()
        this.setData(buildSyncState())
        wx.showToast({ title: '同步部分失败', icon: 'none' })
      }.bind(this))
  },

  syncSettingsFromCloud: function () {
    cloudData.getSettings()
      .then(function (res) {
        if (res.skipped || !res.data) return

        // Use sync utility logic for settings if needed, or just manual compare
        var local = storage.getSettings()
        var cloud = res.data
        if ((cloud.updatedAt || 0) > (local.updatedAt || 0)) {
          var settings = storage.saveSettings(cloud)
          var profileState = buildProfileState(settings)
          var storageState = buildStorageState()

          this.setData(Object.assign({
            settings: settings,
            form: Object.assign({}, settings),
            avatarSrc: settings.avatarUrl || '/assets/images/default-avatar.png',
            cloudSyncText: '云端设置已同步'
          }, profileState, storageState))
        }
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云端设置同步失败，当前使用本地设置'
        })
      }.bind(this))
  },

  onNicknameInput: function (event) {
    this.setData({
      'form.nickname': event.detail.value
    })
  },

  onSalaryInput: function (event) {
    this.setData({
      'form.monthlySalary': event.detail.value
    })
  },

  onWorkDaysInput: function (event) {
    this.setData({
      'form.workDaysPerMonth': event.detail.value
    })
  },

  onWorkHoursInput: function (event) {
    this.setData({
      'form.workHoursPerDay': event.detail.value
    })
  },

  saveSettings: function () {
    var settings = storage.saveSettings(this.data.form)
    var profileState = buildProfileState(settings)
    var storageState = buildStorageState()
    this.setData(Object.assign({
      settings: settings,
      cloudSyncText: cloudData.isCloudEnabled() ? '正在同步云端...' : '当前仅保存在本机'
    }, profileState, storageState))
    wx.showToast({
      title: '已保存',
      icon: 'success'
    })
    sync.syncSettings(settings)
      .then(function (res) {
        if (!res.skipped && res.data) {
          if (res.source === 'cloud') {
            this.loadSettings()
            return
          }
          this.setData({
            cloudSyncText: '已同步到云端'
          })
          return
        }

        this.setData({
          cloudSyncText: '当前仅保存在本机'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云同步失败，已加入待处理队列'
        })
      }.bind(this))
  },

  openPrivacy: function () {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  },

  openAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  },

  openChecklist: function () {
    wx.navigateTo({
      url: '/pages/checklist/checklist'
    })
  },

  openCalm: function () {
    wx.navigateTo({
      url: '/pages/calm/calm'
    })
  },

  exportData: function () {
    wx.showModal({
      title: '导出数据确认',
      content: '导出内容包含您的打卡记录、愿望、清单、设置和月薪。数据将复制到剪贴板，请妥善保管。',
      confirmText: '确认导出',
      confirmColor: '#de5a32',
      success: function (res) {
        if (!res.confirm) return

        var snapshot = storage.getStorageDebugSnapshot()
        var payload = buildExportPayload(snapshot)
        var exportText = JSON.stringify(payload, null, 2)
        var sizeKb = Math.max(1, Math.round(exportText.length / 1024))

        wx.setClipboardData({
          data: exportText,
          success: function () {
            this.setData(Object.assign({
              lastExportText: '最近导出：' + payload.exportedAtText
            }, buildStorageState(snapshot)))

            wx.showToast({
              title: '导出已复制',
              icon: 'success'
            })
          }.bind(this),
          fail: function () {
            wx.showToast({
              title: '复制失败',
              icon: 'none'
            })
          }
        })
      }.bind(this)
    })
  },

  clearLocalData: function () {
    wx.showModal({
      title: '清空本地数据',
      content: '这会删除本机上的记录、愿望和设置，不影响云端。确定要清空吗？',
      confirmText: '确定清空',
      confirmColor: '#c84524',
      success: function (result) {
        if (!result.confirm) return
        storage.clearAllData()
        this.loadSettings()
        wx.showToast({
          title: '已清空本地',
          icon: 'success'
        })
      }.bind(this)
    })
  },

  clearCloudData: function () {
    wx.showModal({
      title: '清空云端数据',
      content: '这将永久删除您在云端存储的所有正式记录。确定要清空吗？',
      confirmText: '确定删除',
      confirmColor: '#c84524',
      success: function (result) {
        if (!result.confirm) return

        wx.showLoading({ title: '清理中...' })
        cloudData.clearAllCloudData()
          .then(function () {
            wx.hideLoading()
            wx.showModal({
              title: '云端已清空',
              content: '云端数据已删除。建议您同时也清空本地数据以保持一致。',
              confirmText: '清空本地',
              cancelText: '保留本地',
              success: function (res) {
                if (res.confirm) {
                  storage.clearAllData()
                  this.loadSettings()
                }
              }.bind(this)
            })
          }.bind(this))
          .catch(function (err) {
            wx.hideLoading()
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            })
            console.error('Clear cloud data failed', err)
          })
      }.bind(this)
    })
  },

  onShareAppMessage: function () {
    return {
      title: '留马日记：每天都想走，但先记一下',
      path: '/pages/today/today'
    }
  }
})
