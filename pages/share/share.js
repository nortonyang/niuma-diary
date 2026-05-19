const config = require('../../utils/share-card-config')
const renderer = require('../../utils/share-card-renderer')
const shareCode = require('../../utils/share-code')
const storage = require('../../utils/storage')
const calculations = require('../../utils/calculations')
const dateUtil = require('../../utils/date')
const constants = require('../../utils/constants')

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
    year: 0,
    month: 0,
    actionLoading: false
  }, config.buildTypeState('mood')),

  onLoad: function (options) {
    var requestedType = options && options.type
    var type = 'mood'
    if (requestedType === 'income') type = 'income'
    if (requestedType === 'weekly') type = 'weekly'
    if (requestedType === 'streak') type = 'streak'
    if (requestedType === 'wish') {
      type = 'wish'
      this.setData({
        wishId: options.id || ''
      })
    }
    if (requestedType === 'calm') {
      type = 'calm'
      this.setData({
        calmResult: {
          title: options.title || '',
          copy: options.copy || ''
        },
        pressurePercent: Number(options.pressure) || 0
      })
    }
    if (requestedType === 'monthly') {
      type = 'monthly'
      var now = new Date()
      this.setData({
        year: Number(options.year) || now.getFullYear(),
        month: Number(options.month) || (now.getMonth() + 1)
      })
    }
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
      if (type === 'weekly') {
        this.renderDynamicWeeklyCard(callback)
        return
      }
      if (type === 'monthly') {
        this.renderDynamicMonthlyCard(callback)
        return
      }
      if (type === 'streak') {
        this.renderDynamicStreakCard(callback)
        return
      }
      if (type === 'wish') {
        this.renderDynamicWishCard(callback)
        return
      }
      if (type === 'calm') {
        this.renderDynamicCalmCard(callback)
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

  renderDynamicWeeklyCard: function (callback) {
    var records = storage.getDailyRecords()
    var settings = storage.getSettings()
    var summary = calculations.summarizeRecentDays(records, 7, settings)

    return renderer.renderWeeklyCard(this, summary)
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function (err) {
        console.error('Weekly card dynamic render failed', err)
        wx.showToast({
          title: '动态图生成失败，已降级',
          icon: 'none'
        })
        var defaultPath = config.CARD_IMAGES.weekly.display
        this.setData({
          cardFile: defaultPath
        })
        if (callback) callback(defaultPath)
      }.bind(this))
  },

  renderDynamicMonthlyCard: function (callback) {
    var records = storage.getDailyRecords()
    var settings = storage.getSettings()
    var summary = calculations.summarizeMonth(records, this.data.year, this.data.month, settings)

    return renderer.renderMonthlyCard(this, summary, this.data.year, this.data.month)
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function (err) {
        console.error('Monthly card dynamic render failed', err)
        wx.showToast({
          title: '动态图生成失败，已降级',
          icon: 'none'
        })
        var defaultPath = config.CARD_IMAGES.monthly.display
        this.setData({
          cardFile: defaultPath
        })
        if (callback) callback(defaultPath)
      }.bind(this))
  },

  renderDynamicStreakCard: function (callback) {
    var records = storage.getDailyRecords()
    var today = dateUtil.getToday()
    var streak = calculations.calculateStreak(records, today)

    return renderer.renderStreakCard(this, streak)
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function (err) {
        console.error('Streak card dynamic render failed', err)
        wx.showToast({
          title: '动态图生成失败，已降级',
          icon: 'none'
        })
        var defaultPath = config.CARD_IMAGES.streak.display
        this.setData({
          cardFile: defaultPath
        })
        if (callback) callback(defaultPath)
      }.bind(this))
  },

  renderDynamicWishCard: function (callback) {
    var wishes = storage.getWishes()
    var wish = wishes.find(function (item) {
      return item.id === this.data.wishId
    }.bind(this)) || wishes[0]

    if (!wish) {
      if (callback) callback()
      return Promise.resolve()
    }

    var enrichedWish = Object.assign({}, wish, {
      categoryLabel: constants.findLabel(constants.WISH_CATEGORIES, wish.category)
    })

    return renderer.renderWishCard(this, enrichedWish)
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function (err) {
        console.error('Wish card dynamic render failed', err)
        wx.showToast({
          title: '动态图生成失败，已降级',
          icon: 'none'
        })
        var defaultPath = config.CARD_IMAGES.wish.display
        this.setData({
          cardFile: defaultPath
        })
        if (callback) callback(defaultPath)
      }.bind(this))
  },

  renderDynamicCalmCard: function (callback) {
    return renderer.renderCalmCard(this, this.data.calmResult, this.data.pressurePercent)
      .then(function (cardPath) {
        this.setData({
          cardFile: cardPath
        })
        if (callback) callback(cardPath)
      }.bind(this))
      .catch(function (err) {
        console.error('Calm card dynamic render failed', err)
        wx.showToast({
          title: '动态图生成失败，已降级',
          icon: 'none'
        })
        var defaultPath = config.CARD_IMAGES.calm.display
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

    if (this.data.type === 'weekly') {
      return this.renderDynamicWeeklyCard()
    }

    if (this.data.type === 'monthly') {
      return this.renderDynamicMonthlyCard()
    }

    if (this.data.type === 'streak') {
      return this.renderDynamicStreakCard()
    }

    if (this.data.type === 'wish') {
      return this.renderDynamicWishCard()
    }

    if (this.data.type === 'calm') {
      return this.renderDynamicCalmCard()
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
          var title = '已保存分享卡'
          if (this.data.type === 'income') title = '已保存赚钱卡'
          if (this.data.type === 'mood') title = '已保存指数卡'
          if (this.data.type === 'weekly') title = '已保存周复盘'
          if (this.data.type === 'monthly') title = '已保存月复盘'
          if (this.data.type === 'streak') title = '已保存连续打卡卡'
          if (this.data.type === 'wish') title = '已保存愿望卡'
          if (this.data.type === 'calm') title = '已保存冷静结论卡'
          return this.saveImage(title)
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
          var title = '已保存分享卡'
          if (this.data.type === 'income') title = '已保存赚钱卡'
          if (this.data.type === 'mood') title = '已保存指数卡'
          if (this.data.type === 'weekly') title = '已保存周复盘'
          if (this.data.type === 'monthly') title = '已保存月复盘'
          if (this.data.type === 'streak') title = '已保存连续打卡卡'
          if (this.data.type === 'wish') title = '已保存愿望卡'
          if (this.data.type === 'calm') title = '已保存冷静结论卡'
          this.saveImage(title)
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
    this.sharePoster()
  },

  redrawMood: function () {
    this.setType('mood')
  },

  redrawIncome: function () {
    this.setType('income')
  },

  redrawWeekly: function () {
    this.setType('weekly')
  },

  redrawMonthly: function () {
    this.setType('monthly')
  },

  redrawStreak: function () {
    this.setType('streak')
  },

  redrawWish: function () {
    this.setType('wish')
  },

  redrawCalm: function () {
    this.setType('calm')
  },

  onShareAppMessage: function () {
    var title = '留马日记：我的今日班味状态'
    if (this.data.type === 'income') title = '留马日记：今天没裸辞，牛马续航中。'
    if (this.data.type === 'weekly') title = '留马日记：我最近 7 天的班味复盘'
    if (this.data.type === 'streak') title = '留马日记：我已连续记录班味 ' + calculations.calculateStreak(storage.getDailyRecords(), dateUtil.getToday()) + ' 天'
    if (this.data.type === 'monthly') title = '留马日记：' + this.data.year + ' 年 ' + this.data.month + ' 月班味复盘'
    if (this.data.type === 'wish') title = '留马日记：离开后最想做的事，我先记下了'
    if (this.data.type === 'calm') title = '留马日记：这次是真的想走吗？先冷静看一眼'
    if (this.data.type === 'mood' && this.data.moodVisual) title = '留马日记：' + this.data.moodVisual.shareTitle

    return {
      title: title,
      path: '/pages/calendar/calendar'
    }
  }
})
