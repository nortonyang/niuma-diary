const constants = require('../../utils/constants')
const storage = require('../../utils/storage')
const cloudData = require('../../utils/cloud-data')
const sync = require('../../utils/sync')

function categoryIndex(value) {
  var index = constants.WISH_CATEGORIES.findIndex(function (item) {
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
    form: emptyForm()
  },

  onShow: function () {
    this.loadWishes()
  },

  loadWishes: function () {
    var wishes = storage.getWishes().map(function (wish) {
      return Object.assign({}, wish, {
        categoryLabel: constants.findLabel(constants.WISH_CATEGORIES, wish.category),
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
        estimatedCost: wish.estimatedCost || '',
        firstStep: wish.firstStep || '',
        createdAt: wish.createdAt
      }
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
