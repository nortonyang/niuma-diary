const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async function (event) {
  const page = event.page || 'pages/today/today'
  const scene = event.scene || 'share'
  const result = await cloud.openapi.wxacode.getUnlimited({
    page: page,
    scene: scene,
    checkPath: false,
    width: 280
  })
  const upload = await cloud.uploadFile({
    cloudPath: 'app-codes/share-' + Date.now() + '.png',
    fileContent: result.buffer
  })

  return {
    fileID: upload.fileID
  }
}
