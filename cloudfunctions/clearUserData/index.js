const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * clearUserData Cloud Function
 * 
 * Securely deletes all data for the current user based on their OPENID.
 * This is more reliable and secure than client-side deletion.
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  
  if (!OPENID) {
    return {
      success: false,
      error: 'OPENID not found'
    }
  }

  const collections = [
    'daily_records',
    'user_settings',
    'wishes',
    'checklist_items'
  ]

  const results = {}
  
  try {
    for (const collectionName of collections) {
      // In cloud context, we use where({ _openid: OPENID }) to ensure we only delete current user's data.
      // Even if collection permissions are "Only creator can read/write", 
      // explicit filtering in cloud functions is a best practice.
      const res = await db.collection(collectionName).where({
        _openid: OPENID
      }).remove()
      
      results[collectionName] = res.stats.removed
    }

    return {
      success: true,
      results: results
    }
  } catch (e) {
    console.error('Clear user data failed', e)
    return {
      success: false,
      error: e.message
    }
  }
}
