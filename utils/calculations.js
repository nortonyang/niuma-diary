const dateUtil = require('./date')
const constants = require('./constants')

function money(value) {
  var number = Number(value)
  if (!number || number < 0) {
    return '0'
  }
  return number.toFixed(number >= 100 ? 0 : 2)
}

function calculateIncome(settings, monthCheckinDays) {
  var salary = Number(settings.monthlySalary)
  var workDays = Number(settings.workDaysPerMonth) || 21.75
  var workHours = Number(settings.workHoursPerDay) || 8

  if (!salary || salary <= 0) {
    return {
      hasSalary: false,
      dailyIncome: 0,
      hourlyIncome: 0,
      monthIncome: 0,
      dailyIncomeText: '',
      hourlyIncomeText: '',
      monthIncomeText: ''
    }
  }

  var dailyIncome = salary / workDays
  var hourlyIncome = dailyIncome / workHours
  var monthIncome = dailyIncome * monthCheckinDays

  return {
    hasSalary: true,
    dailyIncome: dailyIncome,
    hourlyIncome: hourlyIncome,
    monthIncome: monthIncome,
    dailyIncomeText: money(dailyIncome),
    hourlyIncomeText: money(hourlyIncome),
    monthIncomeText: money(monthIncome)
  }
}

function getMonthRecords(records, year, month) {
  return Object.keys(records)
    .filter(function (date) {
      return dateUtil.isInMonth(date, year, month)
    })
    .sort()
    .map(function (date) {
      return records[date]
    })
}

function summarizeMonth(records, year, month, settings) {
  var dates = Object.keys(records)
    .filter(function (date) {
      return dateUtil.isInMonth(date, year, month)
    })
    .sort()

  var reasonCounts = {}
  var totalIndex = 0
  var maxIndex = 0
  var maxIndexDate = ''

  var currentConsecutive = 0
  var maxConsecutive = 0

  // To calculate consecutive days correctly, we need to consider all days in the month
  var daysInMonth = dateUtil.getDaysInMonth(year, month)
  for (var i = 1; i <= daysInMonth; i++) {
    var dateKey = dateUtil.formatDate(new Date(year, month - 1, i))
    var record = records[dateKey]

    if (record) {
      var index = Number(record.quitIndex) || 0
      totalIndex += index

      if (index >= maxIndex) {
        maxIndex = index
        maxIndexDate = dateKey
      }

      if (index >= 85) {
        currentConsecutive++
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      } else {
        currentConsecutive = 0
      }

      ;(record.reasons || []).forEach(function (reason) {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
      })
    } else {
      currentConsecutive = 0
    }
  }

  var topReasons = Object.keys(reasonCounts)
    .sort(function (left, right) {
      return reasonCounts[right] - reasonCounts[left]
    })
    .slice(0, 3)
    .map(function (reason) {
      return constants.findLabel(constants.REASONS, reason)
    })
    .filter(Boolean)

  var income = settings ? calculateIncome(settings, dates.length) : null

  return {
    count: dates.length,
    averageIndex: dates.length ? Math.round(totalIndex / dates.length) : 0,
    maxIndex: maxIndex,
    maxIndexDate: maxIndexDate,
    maxIndexDateText: maxIndexDate ? dateUtil.formatDisplayDate(maxIndexDate) : '',
    maxConsecutiveHighPressure: maxConsecutive,
    topReasons: topReasons,
    topReasonsText: topReasons.length ? topReasons.join('、') : '暂无',
    income: income
  }
}

function summarizeRecentDays(records, days, settings) {
  var dates = dateUtil.getRecentDates(days)
  var recentRecords = dates.map(function (date) {
    return records[date]
  }).filter(Boolean)

  var totalIndex = 0
  var maxIndex = 0
  var highPressureCount = 0
  var reasonCounts = {}

  recentRecords.forEach(function (record) {
    var index = Number(record.quitIndex) || 0
    totalIndex += index
    maxIndex = Math.max(maxIndex, index)
    if (index >= 85) {
      highPressureCount++
    }
    ;(record.reasons || []).forEach(function (reason) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    })
  })

  var topReasons = Object.keys(reasonCounts)
    .sort(function (a, b) {
      return reasonCounts[b] - reasonCounts[a]
    })
    .slice(0, 3)
    .map(function (reason) {
      return constants.findLabel(constants.REASONS, reason)
    })
    .filter(Boolean)

  var income = calculateIncome(settings, recentRecords.length)

  return {
    count: recentRecords.length,
    averageIndex: recentRecords.length ? Math.round(totalIndex / recentRecords.length) : 0,
    maxIndex: maxIndex,
    highPressureCount: highPressureCount,
    topReasons: topReasons,
    topReasonsText: topReasons.length ? topReasons.join('、') : '暂无',
    income: income
  }
}

function classForQuitIndex(index) {
  var value = Number(index) || 0
  if (value >= 85) return 'level-4'
  if (value >= 65) return 'level-3'
  if (value >= 35) return 'level-2'
  if (value > 0) return 'level-1'
  return 'level-0'
}

function calculateStreak(records, today) {
  var streak = 0
  var currentDate = dateUtil.parseDate(today)

  // Check today
  if (records[today]) {
    streak++
  } else {
    // If no record today, check if there was a record yesterday to keep the streak alive
    var yesterday = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
    var yesterdayKey = dateUtil.formatDate(yesterday)
    if (!records[yesterdayKey]) {
      return 0
    }
  }

  // Iterate backwards starting from yesterday
  var checkDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
  while (true) {
    var key = dateUtil.formatDate(checkDate)
    if (records[key]) {
      streak++
      checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000)
    } else {
      break
    }
    // Safety break
    if (streak > 3650) break
  }

  return streak
}

module.exports = {
  money: money,
  calculateIncome: calculateIncome,
  getMonthRecords: getMonthRecords,
  summarizeMonth: summarizeMonth,
  summarizeRecentDays: summarizeRecentDays,
  classForQuitIndex: classForQuitIndex,
  calculateStreak: calculateStreak
}
