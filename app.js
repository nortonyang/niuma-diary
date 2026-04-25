const cloudConfig = require('./utils/cloud-config')

App({
  onLaunch: function () {
    if (cloudConfig.isConfigured() && wx.cloud) {
      wx.cloud.init({
        env: cloudConfig.CLOUD_CONFIG.envId,
        traceUser: true
      })
    }
  },

  globalData: {
    appName: '留马'
  }
})
