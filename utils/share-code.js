function callGetAppCode() {
  if (!wx.cloud || !wx.cloud.callFunction) {
    return Promise.reject(new Error('cloud unavailable'))
  }

  return wx.cloud.callFunction({
    name: 'getAppCode',
    data: {
      page: 'pages/today/today',
      scene: 'share'
    }
  }).then(function (res) {
    var result = res.result || {}

    if (!result.fileID) {
      return Promise.reject(new Error('empty app code'))
    }

    return wx.cloud.downloadFile({
      fileID: result.fileID
    }).then(function (downloadRes) {
      return downloadRes.tempFilePath
    })
  })
}

module.exports = {
  callGetAppCode: callGetAppCode
}
