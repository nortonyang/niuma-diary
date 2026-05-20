const constants = require('../../utils/constants')
const storage = require('../../utils/storage')
const cloudData = require('../../utils/cloud-data')
const sync = require('../../utils/sync')
const characterDrawer = require('../../utils/character-drawer')

function categoryIndex(value) {
  var index = constants.WISH_CATEGORIES.findIndex(function (item) {
    return item.value === value
  })
  return index >= 0 ? index : 0
}

function statusIndex(value) {
  var index = constants.WISH_STATUSES.findIndex(function (item) {
    return item.value === value
  })
  return index >= 0 ? index : 0
}

function emptyForm() {
  return {
    id: '',
    title: '',
    editorTitle: '新增愿望',
    category: constants.WISH_CATEGORIES[0].value,
    categoryIndex: 0,
    progressStatus: 'todo',
    statusIndex: 0,
    pinned: false,
    estimatedCost: '',
    firstStep: ''
  }
}

function buildHeroHint(count) {
  if (!count) {
    return '先写最想做的一件事，也不代表今天就要辞。'
  }
  if (count < 3) {
    return '还可以再记 ' + (3 - count) + ' 个，把最想要的退路先留下。'
  }
  return '已经写满 3 个，先保留你现在最想做的几件事。'
}

Page({
  data: {
    wishes: [],
    limitReached: false,
    hasWishes: false,
    addButtonText: '新增愿望',
    heroHint: '',
    wishCountText: '0 / 3',
    cloudSyncText: '',
    showEditor: false,
    categoryLabels: constants.WISH_CATEGORIES.map(function (item) {
      return item.label
    }),
    statusLabels: constants.WISH_STATUSES.map(function (item) {
      return item.label
    }),
    form: emptyForm(),
    showGenerator: false,
    generatedItems: [],
    selectedWish: null
  },

  onShow: function () {
    this.loadWishes()
    this.drawEmptyState()
  },

  drawEmptyState: function () {
    if (this.data.wishes.length > 0) return

    var ctx = wx.createCanvasContext('emptyWishCanvas', this)
    ctx.setFillStyle('rgba(37, 59, 54, 0.03)')
    characterDrawer.drawRoundRectPath(ctx, 40, 70, 100, 15, 8)
    ctx.fill()
    characterDrawer.drawCow(ctx, 55, 65, 0.8, 'happy')
    characterDrawer.drawHorse(ctx, 125, 70, 0.8, 'happy')
    ctx.draw()
  },

  loadWishes: function () {
    var wishes = storage.getWishes().map(function (wish) {
      return Object.assign({}, wish, {
        categoryLabel: constants.findLabel(constants.WISH_CATEGORIES, wish.category),
        statusLabel: constants.findLabel(constants.WISH_STATUSES, wish.progressStatus),
        costText: wish.estimatedCost ? '预计花费：' + wish.estimatedCost + ' 元' : '预算先不急，之后再补',
        stepText: wish.firstStep ? '第一小步：' + wish.firstStep : '第一小步还没写，可以后面再补'
      })
    })
    var count = wishes.length

    this.setData({
      wishes: wishes,
      limitReached: count >= 3,
      hasWishes: count > 0,
      addButtonText: count >= 3 ? '最多记录 3 个愿望' : '新增愿望',
      heroHint: buildHeroHint(count),
      wishCountText: count + ' / 3'
    })
    this.syncWishesFromCloud()
  },

  syncWishesFromCloud: function () {
    cloudData.getWishes()
      .then(function (res) {
        if (res.skipped || !res.data || !res.data.length) return
        storage.mergeWishes(res.data)
        this.loadWishesWithoutCloud()
        this.setData({
          cloudSyncText: '云端愿望已同步'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云端愿望同步失败，当前使用本地数据'
        })
      }.bind(this))
  },

  loadWishesWithoutCloud: function () {
    var wishes = storage.getWishes().map(function (wish) {
      return Object.assign({}, wish, {
        categoryLabel: constants.findLabel(constants.WISH_CATEGORIES, wish.category),
        statusLabel: constants.findLabel(constants.WISH_STATUSES, wish.progressStatus),
        costText: wish.estimatedCost ? '预计花费：' + wish.estimatedCost + ' 元' : '预算先不急，之后再补',
        stepText: wish.firstStep ? '第一小步：' + wish.firstStep : '第一小步还没写，可以后面再补'
      })
    })
    var count = wishes.length

    this.setData({
      wishes: wishes,
      limitReached: count >= 3,
      hasWishes: count > 0,
      addButtonText: count >= 3 ? '最多记录 3 个愿望' : '新增愿望',
      heroHint: buildHeroHint(count),
      wishCountText: count + ' / 3'
    })
  },

  openCreate: function () {
    if (this.data.limitReached) {
      wx.showToast({
        title: '最多 3 个',
        icon: 'none'
      })
      return
    }
    this.setData({
      showEditor: true,
      form: emptyForm()
    })
  },

  openEdit: function (event) {
    var id = event.currentTarget.dataset.id
    var wish = this.data.wishes.find(function (item) {
      return item.id === id
    })
    if (!wish) return
    this.setData({
      showEditor: true,
      form: {
        id: wish.id,
        title: wish.title,
        editorTitle: '编辑愿望',
        category: wish.category,
        categoryIndex: categoryIndex(wish.category),
        progressStatus: wish.progressStatus || 'todo',
        statusIndex: statusIndex(wish.progressStatus || 'todo'),
        pinned: !!wish.pinned,
        estimatedCost: wish.estimatedCost || '',
        firstStep: wish.firstStep || '',
        createdAt: wish.createdAt
      }
    })
  },

  shareWish: function (event) {
    var id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/share/share?type=wish&id=' + id
    })
  },

  closeEditor: function () {
    this.setData({
      showEditor: false
    })
  },

  noop: function () {},

  onTitleInput: function (event) {
    this.setData({
      'form.title': event.detail.value
    })
  },

  onCategoryChange: function (event) {
    var index = Number(event.detail.value) || 0
    this.setData({
      'form.categoryIndex': index,
      'form.category': constants.WISH_CATEGORIES[index].value
    })
  },

  onStatusChange: function (event) {
    var index = Number(event.detail.value) || 0
    this.setData({
      'form.statusIndex': index,
      'form.progressStatus': constants.WISH_STATUSES[index].value
    })
  },

  onCostInput: function (event) {
    this.setData({
      'form.estimatedCost': event.detail.value
    })
  },

  onStepInput: function (event) {
    this.setData({
      'form.firstStep': event.detail.value
    })
  },

  convertToChecklist: function (event) {
    var id = event.currentTarget.dataset.id
    var wish = this.data.wishes.find(function (item) {
      return item.id === id
    })
    if (!wish) return

    // Check for duplicates
    var existingItems = storage.getChecklistItems()
    var isDuplicate = existingItems.some(function (item) {
      return item.sourceWishId === id
    })

    if (isDuplicate) {
      wx.showModal({
        title: '提示',
        content: '该愿望已经生成过清单项了。',
        showCancel: false
      })
      return
    }

    var suggestions = this.generateChecklistItems(wish)
    this.setData({
      selectedWish: wish,
      generatedItems: suggestions.map(function (title) {
        return { title: title }
      }),
      showGenerator: true
    })
  },

  generateChecklistItems: function (wish) {
    var templates = {
      travel: ['查攻略和路线', '订机票或酒店', '准备行李清单', '安排行程时间', '预留旅行费用'],
      study: ['搜索相关课程', '购买学习资料', '制定学习计划', '寻找学习伙伴', '准备学习环境'],
      career_change: ['梳理核心技能', '修改针对性简历', '调研目标行业', '准备面试作品', '盘点转行存款'],
      side_project: ['调研市场需求', '确定最小原型', '寻找合作伙伴', '申请必要账号', '制定上线计划'],
      rest: ['放下电子设备', '补觉恢复体力', '盘点生活开销', '规划休息安排', '告诉亲友决定'],
      startup: ['完善商业计划', '寻找合伙人', '注册公司/账号', '筹集初始资金', '调研竞争对手'],
      family: ['推掉不必要社交', '规划陪伴时间', '准备家庭礼物', '协调家庭事务', '记录相处瞬间']
    }
    var suggestions = templates[wish.category] || ['具体化行动步骤', '盘点所需资源', '预留充足时间', '迈出第一小步', '完成后的小奖励']

    // Add first step if exists as a suggestion
    if (wish.firstStep) {
      suggestions.unshift(wish.firstStep)
    }

    return suggestions.slice(0, 5)
  },

  closeGenerator: function () {
    this.setData({
      showGenerator: false,
      selectedWish: null,
      generatedItems: []
    })
  },

  onGeneratedItemInput: function (event) {
    var index = event.currentTarget.dataset.index
    var value = event.detail.value
    var items = this.data.generatedItems.slice()
    items[index].title = value
    this.setData({
      generatedItems: items
    })
  },

  saveGeneratedItems: function () {
    var wish = this.data.selectedWish
    var itemsToSave = this.data.generatedItems.filter(function (item) {
      return item.title.trim() !== ''
    })

    if (itemsToSave.length === 0) {
      wx.showToast({
        title: '请至少保留一项',
        icon: 'none'
      })
      return
    }

    var now = Date.now()
    var defaultStage = constants.CHECKLIST_STAGES[0].value

    itemsToSave.forEach(function (item, index) {
      var nextItem = {
        title: item.title.trim(),
        stage: defaultStage,
        completed: false,
        custom: true,
        sourceWishId: wish.id,
        sort: now + index
      }
      var saved = storage.saveChecklistItem(nextItem)
      sync.syncChecklistItem(saved)
    })

    wx.showToast({
      title: '已加入清单',
      icon: 'success'
    })

    this.setData({
      showGenerator: false,
      selectedWish: null,
      generatedItems: []
    })
  },

  saveWish: function () {
    var title = (this.data.form.title || '').trim()
    if (!title) {
      wx.showToast({
        title: '先写标题',
        icon: 'none'
      })
      return
    }

    var savedWish = storage.saveWish(Object.assign({}, this.data.form, {
      title: title
    }))

    wx.showToast({
      title: '已保存',
      icon: 'success'
    })

    this.setData({
      showEditor: false,
      cloudSyncText: cloudData.isCloudEnabled() ? '正在同步云端...' : '当前仅保存在本机'
    })
    this.loadWishesWithoutCloud()
    sync.syncWish(savedWish)
      .then(function (res) {
        if (res.source === 'cloud') {
          this.loadWishesWithoutCloud()
        }
        this.setData({
          cloudSyncText: res.skipped ? '当前仅保存在本机' : '已同步到云端'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云同步失败，已加入待处理队列'
        })
      }.bind(this))
  },

  togglePin: function (event) {
    var id = event.currentTarget.dataset.id
    storage.toggleWishPin(id)
    this.loadWishesWithoutCloud()

    // Sync all wishes to cloud because pinning affects all (unpinning others)
    var nextWishes = storage.getWishes()
    this.setData({
      cloudSyncText: '正在同步云端...'
    })

    Promise.all(nextWishes.map(function (wish) {
      return sync.syncWish(wish)
    }))
      .then(function () {
        this.setData({
          cloudSyncText: '云端同步成功'
        })
      }.bind(this))
      .catch(function () {
        this.setData({
          cloudSyncText: '云端同步失败，已加入待处理队列'
        })
      }.bind(this))
  },

  removeWish: function (event) {
    var id = event.currentTarget.dataset.id
    var wish = this.data.wishes.find(function (item) { return item.id === id })
    if (!wish) return

    wx.showModal({
      title: '删除愿望',
      content: '删除后只会清掉本地记录。',
      confirmText: '删除',
      confirmColor: '#c84524',
      success: function (result) {
        if (result.confirm) {
          storage.deleteWish(id)
          this.setData({
            cloudSyncText: cloudData.isCloudEnabled() ? '正在同步云端...' : '当前仅删除本机数据'
          })
          this.loadWishesWithoutCloud()
          sync.syncWish(wish, true)
            .then(function (res) {
              this.setData({
                cloudSyncText: res.skipped ? '当前仅删除本机数据' : '云端已同步删除'
              })
            }.bind(this))
            .catch(function () {
              this.setData({
                cloudSyncText: '云端删除失败，已加入待处理队列'
              })
            }.bind(this))
        }
      }.bind(this)
    })
  },

  onShareAppMessage: function () {
    return {
      title: '离开后第一件事，我先记下了',
      path: '/pages/wishes/wishes'
    }
  }
})
