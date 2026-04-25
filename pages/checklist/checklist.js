const constants = require('../../utils/constants')
const storage = require('../../utils/storage')
const cloudData = require('../../utils/cloud-data')

function buildStageGroups(items) {
  return constants.CHECKLIST_STAGES.map(function (stage) {
    var stageItems = items.filter(function (item) {
      return item.stage === stage.value
    }).map(function (item) {
      return Object.assign({}, item, {
        completedClass: item.completed ? 'completed' : '',
        checkText: item.completed ? '✓' : ''
      })
    })
    var done = stageItems.filter(function (item) {
      return item.completed
    }).length
    var empty = stageItems.length === 0
    return Object.assign({}, stage, {
      items: stageItems,
      done: done,
      total: stageItems.length,
      empty: empty,
      summaryText: empty ? '这个阶段还没有事项' : '已完成 ' + done + ' 项'
    })
  })
}

function buildProgressCopy(done, total) {
  if (!total) {
    return '先从一项最容易完成的开始，准备不需要一步到位。'
  }
  if (!done) {
    return '还没开始也没关系，先把第一件事做掉。'
  }
  if (done === total) {
    return '清单已经全部完成，接下来只需要决定时点。'
  }
  return '已经完成 ' + done + ' 项，继续把退路补扎实。'
}

Page({
  data: {
    items: [],
    stageGroups: [],
    stageLabels: constants.CHECKLIST_STAGES.map(function (stage) {
      return stage.label
    }),
    newTitle: '',
    newStageIndex: 0,
    progressPercent: 0,
    progressCountText: '0 / 0',
    progressCopy: '先从一项最容易完成的开始，准备不需要一步到位。',
    cloudSyncText: ''
  },

  onShow: function () {
    this.loadItems()
  },

  loadItems: function () {
    var items = storage.getChecklistItems()
    var done = items.filter(function (item) {
      return item.completed
    }).length
    this.setData({
      items: items,
      stageGroups: buildStageGroups(items),
      progressPercent: items.length ? Math.round(done / items.length * 100) : 0,
      progressCountText: done + ' / ' + items.length,
      progressCopy: buildProgressCopy(done, items.length)
    })
    this.syncChecklistFromCloud()
  },

  loadItemsWithoutCloud: function () {
    var items = storage.getChecklistItems()
    var done = items.filter(function (item) {
      return item.completed
    }).length
    this.setData({
      items: items,
      stageGroups: buildStageGroups(items),
      progressPercent: items.length ? Math.round(done / items.length * 100) : 0,
      progressCountText: done + ' / ' + items.length,
      progressCopy: buildProgressCopy(done, items.length)
    })
  },

  syncChecklistFromCloud: function () {
    cloudData.getChecklistItems()
      .then(function (res) {
        if (res.skipped || !res.data || !res.data.length) return
        storage.mergeChecklistItems(res.data)
        this.loadItemsWithoutCloud()
        this.setData({
          cloudSyncText: '云端清单已同步'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云端清单同步失败，当前使用本地数据'
        })
      }.bind(this))
  },

  onNewTitleInput: function (event) {
    this.setData({
      newTitle: event.detail.value
    })
  },

  onStageChange: function (event) {
    this.setData({
      newStageIndex: Number(event.detail.value) || 0
    })
  },

  addItem: function () {
    var title = (this.data.newTitle || '').trim()
    if (!title) {
      wx.showToast({
        title: '先写事项',
        icon: 'none'
      })
      return
    }
    var savedItem = storage.saveChecklistItem({
      title: title,
      stage: constants.CHECKLIST_STAGES[this.data.newStageIndex].value,
      completed: false,
      custom: true
    })
    this.setData({
      newTitle: '',
      cloudSyncText: cloudData.isCloudEnabled() ? '正在同步云端...' : '当前仅保存在本机'
    })
    this.loadItemsWithoutCloud()
    cloudData.saveChecklistItem(savedItem)
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

  toggleItem: function (event) {
    var id = event.currentTarget.dataset.id
    var items = storage.toggleChecklistItem(id)
    var item = items.find(function (candidate) {
      return candidate.id === id
    })
    this.setData({
      cloudSyncText: cloudData.isCloudEnabled() ? '正在同步云端...' : '当前仅保存在本机'
    })
    this.loadItemsWithoutCloud()
    cloudData.saveChecklistItem(item)
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

  deleteItem: function (event) {
    var id = event.currentTarget.dataset.id
    storage.deleteChecklistItem(id)
    this.setData({
      cloudSyncText: cloudData.isCloudEnabled() ? '正在同步云端...' : '当前仅删除本机数据'
    })
    this.loadItemsWithoutCloud()
    cloudData.deleteChecklistItem(id)
      .then(function (res) {
        this.setData({
          cloudSyncText: res.skipped ? '当前仅删除本机数据' : '云端已同步删除'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云端删除失败，本机已删除'
        })
      }.bind(this))
  },

  onShareAppMessage: function () {
    return {
      title: '我的离职准备清单',
      path: '/pages/checklist/checklist'
    }
  }
})
