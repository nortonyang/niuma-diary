const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
const PLACEHOLDER_TEMPLATE_ID = 'REPLACE_WITH_YOUR_TEMPLATE_ID'

/**
 * sendDailyReminder Cloud Function
 *
 * Scheduled task to send check-in reminders to users.
 * Matches users by their reminderTime (HH:mm).
 */
exports.main = async (event, context) => {
  // Use current time or test time from event
  // Note: Cloud functions usually run in UTC.
  // We need to ensure we are checking against UTC+8 (China Standard Time).
  const now = event.testTime ? new Date(event.testTime) : new Date()

  // Basic UTC+8 conversion (suitable for cloud environment)
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  const date8 = new Date(utcTime + (3600000 * 8))

  const currentHour = date8.getHours()
  const currentMinute = date8.getMinutes()

  // Format HH:mm for matching
  const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`

  console.log(`Checking reminders for time (UTC+8): ${timeStr}`)

  try {
    // 1. Find users who:
    // - Have reminders enabled
    // - Have a valid template ID (not empty)
    // - Reminder time matches current HH:mm
    const usersRes = await db.collection('user_settings').where({
      reminderEnabled: true,
      reminderTime: timeStr,
      reminderAuthorizedAt: _.gt(0)
    }).get()

    const users = (usersRes.data || []).filter(user => {
      return user._openid &&
        user.reminderTemplateId &&
        user.reminderTemplateId !== PLACEHOLDER_TEMPLATE_ID
    })
    console.log(`Found ${users.length} users with reminder time ${timeStr}`)

    const results = {
      total: users.length,
      success: 0,
      fail: 0,
      errors: []
    }

    // 2. Send reminders
    for (const user of users) {
      try {
        // Template fields must match the actual configured template in WeChat Console.
        // We use common generic field names like 'thing1' and 'thing2'.
        await cloud.openapi.subscribeMessage.send({
          touser: user._openid,
          templateId: user.reminderTemplateId,
          page: 'pages/today/today',
          data: {
            thing1: {
              value: '今日状态打卡'
            },
            thing2: {
              value: '今天还没记录，花 30 秒记一下状态'
            }
          }
        })
        results.success++
      } catch (err) {
        results.fail++
        results.errors.push({
          openid: user._openid,
          error: err.message
        })
        console.error(`Failed to send reminder to ${user._openid}:`, err)
      }
    }

    return {
      success: true,
      timeChecked: timeStr,
      results: results
    }
  } catch (err) {
    console.error('sendDailyReminder execution failed', err)
    return {
      success: false,
      error: err.message
    }
  }
}
