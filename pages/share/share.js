const config = require('../../utils/share-card-config')
const renderer = require('../../utils/share-card-renderer')
const shareCode = require('../../utils/share-code')

function saveToAlbum(filePath, successTitle) {
  return new Promise(function (resolve, reject) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: function () {
        wx.showToast({
          title: successTitle || '已保存',
          icon: 'success'
        })
        resolve()
      },
      fail: reject
    })
  })
}

Page({
  data: Object.assign({
    type: 'mood',
    actionLoading: false
  }, config.buildTypeState('mood')),

  onLoad: function (options) {
    var requestedType = options && options.type
    var type = requestedType === 'income' ? 'income' : 'mood'
    this.setType(type)
  },

  setType: function (type, callback) {
    this.setData(Object.assign({
      type: type
    }, config.buildTypeState(type)), function () {
      if (type === 'mood') {
        this.renderDynamicMoodCard(callback)
        return
      }
      if (type === 'income') {
        this.renderDynamicIncomeCard(callback)
        return
      }
      if (callback) callback()
    }.bind(this))
  },

  renderDynamicMoodCard: function (callback) {
    return renderer.renderMoodCard(this, this.data.moodVisual)
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function (err) {
        console.error('Mood card dynamic render failed', err)
        wx.showToast({
          title: '动态图生成失败，已降级',
          icon: 'none'
        })
        // Fallback to static template
        var defaultPath = config.CARD_IMAGES.mood.display
        this.setData({
          cardFile: defaultPath
        })
        if (callback) callback(defaultPath)
      }.bind(this))
  },

  renderDynamicIncomeCard: function (callback) {
    return renderer.renderIncomeCard(this)
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function (err) {
        console.error('Income card dynamic render failed', err)
        wx.showToast({
          title: '动态图生成失败，已降级',
          icon: 'none'
        })
        // Fallback to static template
        var defaultPath = config.CARD_IMAGES.income.display
        this.setData({
          cardFile: defaultPath
        })
        if (callback) callback(defaultPath)
      }.bind(this))
  },

  prepareCurrentCard: function () {
    if (this.data.type === 'income') {
      return this.renderDynamicIncomeCard()
    }

    if (this.data.type === 'mood') {
      return this.renderDynamicMoodCard()
    }

    return Promise.resolve()
  },

  saveImage: function (successTitle) {
    return renderer.getImageInfo(this.data.cardFile)
      .then(function (info) {
        return saveToAlbum(info.path, successTitle)
      })
      .catch(function () {
        wx.showModal({
          title: '需要相册权限',
          content: '由于无法访问相册，保存失败。是否前往设置页面开启权限？',
          confirmText: '去设置',
          cancelText: '取消',
          confirmColor: '#de5a32',
          success: function (res) {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      })
  },

  sharePoster: function () {
    if (this.data.actionLoading) return

    if (!wx.showShareImageMenu) {
      this.setData({
        actionLoading: true
      })
      this.prepareCurrentCard()
        .then(function () {
          return this.saveImage(this.data.type === 'income' ? '已保存赚钱卡' : '已保存指数卡')
        }.bind(this))
        .then(function () {
          this.setData({
            actionLoading: false
          })
        }.bind(this), function () {
          this.setData({
            actionLoading: false
          })
        }.bind(this))
      return
    }

    this.setData({
      actionLoading: true
    })

    var prepareCard = this.prepareCurrentCard()

    prepareCard
      .then(function () {
        return Promise.all([
          renderer.getImageInfo(this.data.cardFile),
          shareCode.callGetAppCode()
        ])
      }.bind(this))
      .then(function (res) {
        return renderer.drawSharePoster(this, res[0].path, res[1])
      }.bind(this))
      .then(function (posterPath) {
        wx.showShareImageMenu({
          path: posterPath,
          fail: function () {
            saveToAlbum(posterPath, '已保存分享图')
          }
        })
      })
      .catch(function (err) {
        wx.showToast({
          title: '降级基础卡片',
          icon: 'none'
        })
        setTimeout(function () {
          this.saveImage(this.data.type === 'income' ? '已保存赚钱卡' : '已保存指数卡')
        }.bind(this), 500)
      }.bind(this))
      .then(function () {
        this.setData({
          actionLoading: false
        })
      }.bind(this), function () {
        this.setData({
          actionLoading: false
        })
      }.bind(this))
  },

  handlePrimaryAction: function () {
    if (this.data.type === 'income') {
      if (this.data.actionLoading) return
      this.setData({
        actionLoading: true
      })
      this.renderDynamicIncomeCard()
        .then(function () {
          return this.saveImage('已保存赚钱卡')
        }.bind(this))
        .then(function () {
          this.setData({
            actionLoading: false
          })
        }.bind(this), function () {
          this.setData({
            actionLoading: false
          })
        }.bind(this))
      return
    }

    this.sharePoster()
  },

  redrawMood: function () {
    this.setType('mood')
  },

  redrawIncome: function () {
    this.setType('income')
  },

  onShareAppMessage: function () {
    return {
      title: this.data.type === 'income'
        ? '留马日记：今天没裸辞，牛马续航中。'
        : '留马日记：' + (this.data.moodVisual ? this.data.moodVisual.shareTitle : '我的今日班味状态'),
      path: '/pages/today/today'
    }
  }
})
