const cloudConfig = require('./utils/cloud-config')
const migration = require('./utils/migration')
const sync = require('./utils/sync')

App({
  onLaunch: function () {
    migration.migrate()

    if (cloudConfig.isConfigured() && wx.cloud) {
      wx.cloud.init({
        env: cloudConfig.CLOUD_CONFIG.envId,
        traceUser: true
      })
      
      // RF-002: Process queue after cloud init
      sync.processPendingQueue().catch(function(err) {
        console.warn('Initial sync failed:', err)
      })
    }
  },

  onShow: function () {
    if (cloudConfig.isConfigured() && wx.cloud) {
      sync.processPendingQueue().catch(function(err) {
        console.warn('Background sync failed:', err)
      })
    }
  },

  globalData: {
    appName: '留马日记'
  }
})
