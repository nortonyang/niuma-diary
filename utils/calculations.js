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

function summarizeMonth(records, year, month) {
  var monthRecords = getMonthRecords(records, year, month)
  var reasonCounts = {}
  var totalIndex = 0
  var maxIndex = 0

  monthRecords.forEach(function (record) {
    var index = Number(record.quitIndex) || 0
    totalIndex += index
    maxIndex = Math.max(maxIndex, index)
    ;(record.reasons || []).forEach(function (reason) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
    })
  })

  var topReasons = Object.keys(reasonCounts)
    .sort(function (left, right) {
      return reasonCounts[right] - reasonCounts[left]
    })
    .slice(0, 3)
    .map(function (reason) {
      return constants.findLabel(constants.REASONS, reason)
    })
    .filter(Boolean)

  return {
    count: monthRecords.length,
    averageIndex: monthRecords.length ? Math.round(totalIndex / monthRecords.length) : 0,
    maxIndex: maxIndex,
    topReasons: topReasons,
    topReasonsText: topReasons.length ? topReasons.join('、') : '暂无'
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

module.exports = {
  money: money,
  calculateIncome: calculateIncome,
  getMonthRecords: getMonthRecords,
  summarizeMonth: summarizeMonth,
  classForQuitIndex: classForQuitIndex
}
