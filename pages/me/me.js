const storage = require('../../utils/storage')
const cloudData = require('../../utils/cloud-data')
const calculations = require('../../utils/calculations')

function buildProfileState(settings) {
  var income = calculations.calculateIncome(settings, 0)
  var cloudEnabled = cloudData.isCloudEnabled()

  return {
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
      ? '按每月 ' + settings.workDaysPerMonth + ' 天、每天 ' + settings.workHoursPerDay + ' 小时估算'
      : '只影响你自己的本地换算和分享卡，不会上传'
  }
}

function pad(number) {
  return number < 10 ? '0' + number : '' + number
}

function formatExportTime(timestamp) {
  var date = new Date(timestamp)
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
    pad(date.getHours()) + ':' + pad(date.getMinutes())
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
    avatarSrc: '/assets/images/default-avatar.png',
    profileName: '匿名打工人',
    profileCopy: '数据默认保存在本机，不强制登录。',
    incomeSummaryTitle: '设置月薪后可换算今日收入',
    incomeSummaryCopy: '只影响你自己的本地换算和分享卡，不会上传',
    storageModeTitle: '默认只存在本机',
    storageModeCopy: '打卡、愿望和设置默认本地存储，不强制登录。',
    exportSummaryText: '已用 0 KB / 0 KB · 0 个 key',
    recordCountText: '0 天',
    draftCountText: '0 份',
    wishCountText: '0 个',
    checklistCountText: '0/0',
    lastExportText: '',
    cloudSyncText: '',
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
    var profileState = buildProfileState(settings)
    var storageState = buildStorageState()
    this.setData(Object.assign({
      settings: settings,
      form: Object.assign({}, settings)
    }, profileState, storageState))
    this.syncSettingsFromCloud()
  },

  syncSettingsFromCloud: function () {
    cloudData.getSettings()
      .then(function (res) {
        if (res.skipped || !res.data) return

        var settings = storage.saveSettings(res.data)
        var profileState = buildProfileState(settings)
        var storageState = buildStorageState()

        this.setData(Object.assign({
          settings: settings,
          form: Object.assign({}, settings),
          cloudSyncText: '云端设置已同步'
        }, profileState, storageState))
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
    cloudData.saveSettings(settings)
      .then(function (res) {
        if (!res.skipped && res.data) {
          var syncedSettings = storage.saveSettings(res.data)
          var syncedProfileState = buildProfileState(syncedSettings)
          var syncedStorageState = buildStorageState()
          this.setData(Object.assign({
            settings: syncedSettings,
            form: Object.assign({}, syncedSettings),
            cloudSyncText: '已同步到云端'
          }, syncedProfileState, syncedStorageState))
          return
        }

        this.setData({
          cloudSyncText: '当前仅保存在本机'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云同步失败，已保存在本机'
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

        wx.showModal({
          title: '导出数据已复制',
          content: '已复制约 ' + sizeKb + ' KB 的 JSON 快照，包含打卡、草稿、愿望、设置和清单，可直接粘贴保存。',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#de5a32'
        })
      }.bind(this),
      fail: function () {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  clearData: function () {
    wx.showModal({
      title: '清空本地数据',
      content: '这会删除本机上的打卡、愿望和设置。',
      confirmText: '清空',
      confirmColor: '#c84524',
      success: function (result) {
        if (!result.confirm) return
        storage.clearAllData()
        this.loadSettings()
        wx.showToast({
          title: '已清空',
          icon: 'success'
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
