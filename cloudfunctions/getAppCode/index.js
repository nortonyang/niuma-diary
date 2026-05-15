const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const CACHE_COLLECTION = 'app_codes'

/**
 * getAppCode Cloud Function
 * 
 * Fix REQ-1003: AppCode Caching.
 * Uses a database collection 'app_codes' to track generated QR codes.
 * This is more reliable than checking Cloud Storage directly.
 */
exports.main = async function (event) {
  const page = event.page || 'pages/today/today'
  const scene = event.scene || 'share'

  // Create a stable hash for the combination of page and scene
  const hash = crypto.createHash('md5').update(`${page}-${scene}`).digest('hex')
  const cloudPath = `app-codes/acode-${hash}.png`

  // 1. Try to fetch from database cache
  try {
    const cacheRes = await db.collection(CACHE_COLLECTION).where({
      hash: hash
    }).limit(1).get()

    if (cacheRes.data && cacheRes.data.length > 0) {
      const cached = cacheRes.data[0]
      
      // Double check if file info is present
      if (cached.fileID) {
        // We trust the DB cache. If the file was manually deleted from Storage,
        // the client will fail to download and we can handle it there or let
        // the next regeneration fix it.
        return {
          fileID: cached.fileID,
          cached: true
        }
      }
    }
  } catch (e) {
    // If collection doesn't exist or other DB error, just log and proceed
    console.warn('Cache check skipped or failed:', e.message)
  }

  // 2. Not in cache, generate new AppCode
  const result = await cloud.openapi.wxacode.getUnlimited({
    page: page,
    scene: scene,
    checkPath: false,
    width: 280
  })

  if (result.errCode !== 0) {
    console.error('wxacode.getUnlimited failed', result)
    return result
  }

  // 3. Upload to Cloud Storage
  // Using a stable cloudPath ensures we don't leak files, 
  // though uploadFile will overwrite if it exists.
  const upload = await cloud.uploadFile({
    cloudPath: cloudPath,
    fileContent: result.buffer
  })

  if (!upload.fileID) {
    throw new Error('Cloud storage upload failed')
  }

  // 4. Update database cache asynchronously
  try {
    // Upsert logic to prevent duplicate hashes in DB
    const existing = await db.collection(CACHE_COLLECTION).where({ hash: hash }).get()
    if (existing.data && existing.data.length > 0) {
      await db.collection(CACHE_COLLECTION).doc(existing.data[0]._id).update({
        data: {
          fileID: upload.fileID,
          updatedAt: db.serverDate()
        }
      })
    } else {
      await db.collection(CACHE_COLLECTION).add({
        data: {
          hash: hash,
          fileID: upload.fileID,
          page: page,
          scene: scene,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      })
    }
  } catch (e) {
    console.error('Failed to update cache DB:', e.message)
  }

  return {
    fileID: upload.fileID,
    cached: false
  }
}
