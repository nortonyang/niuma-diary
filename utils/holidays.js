const HOLIDAY_PERIODS = [
  { name: '元旦', start: [2026, 1, 1], end: [2026, 1, 3] },
  { name: '春节', start: [2026, 2, 15], end: [2026, 2, 23] },
  { name: '清明节', start: [2026, 4, 4], end: [2026, 4, 6] },
  { name: '劳动节', start: [2026, 5, 1], end: [2026, 5, 5] },
  { name: '端午节', start: [2026, 6, 19], end: [2026, 6, 21] },
  { name: '中秋节', start: [2026, 9, 25], end: [2026, 9, 27] },
  { name: '国庆节', start: [2026, 10, 1], end: [2026, 10, 7] },
  { name: '元旦', start: [2027, 1, 1], end: [2027, 1, 3] },
  { name: '春节', start: [2027, 2, 6], end: [2027, 2, 12] },
  { name: '清明节', start: [2027, 4, 3], end: [2027, 4, 5] },
  { name: '劳动节', start: [2027, 5, 1], end: [2027, 5, 5] },
  { name: '端午节', start: [2027, 6, 8], end: [2027, 6, 10] },
  { name: '中秋节', start: [2027, 9, 15], end: [2027, 9, 17] },
  { name: '国庆节', start: [2027, 10, 1], end: [2027, 10, 7] },
  { name: '元旦', start: [2028, 1, 1], end: [2028, 1, 3] }
]

const SPRING_FESTIVAL_DATES = [
  { year: 2026, parts: [2026, 2, 17] },
  { year: 2027, parts: [2027, 2, 6] },
  { year: 2028, parts: [2028, 1, 26] },
  { year: 2029, parts: [2029, 2, 13] }
]

function createLocalDate(parts) {
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
}

function createNextDay(parts) {
  return new Date(parts[0], parts[1] - 1, parts[2] + 1, 0, 0, 0, 0)
}

function pad(number) {
  return number < 10 ? '0' + number : '' + number
}

function formatFullCountdown(milliseconds) {
  if (milliseconds <= 0) {
    return '0天00小时00分00秒'
  }

  var totalSeconds = Math.floor(milliseconds / 1000)
  var days = Math.floor(totalSeconds / 86400)
  var hours = Math.floor(totalSeconds % 86400 / 3600)
  var minutes = Math.floor(totalSeconds % 3600 / 60)
  var seconds = totalSeconds % 60

  return days + '天' + pad(hours) + '小时' + pad(minutes) + '分' + pad(seconds) + '秒'
}

function formatTargetHint(date, name, ongoing) {
  if (ongoing) {
    return name + '进行中'
  }

  return name + ' · ' + (date.getMonth() + 1) + '月' + date.getDate() + '日 00:00'
}

function getWeekendTarget(now) {
  var day = now.getDay()
  if (day === 6 || day === 0) {
    return {
      target: now,
      ongoing: true
    }
  }

  return {
    target: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - day), 0, 0, 0, 0),
    ongoing: false
  }
}

function getNextHolidayTarget(now) {
  var index

  for (index = 0; index < HOLIDAY_PERIODS.length; index += 1) {
    var current = HOLIDAY_PERIODS[index]
    var startDate = createLocalDate(current.start)
    var endDate = createNextDay(current.end)

    if (now >= startDate && now < endDate) {
      return {
        name: current.name,
        target: now,
        ongoing: true
      }
    }

    if (startDate > now) {
      return {
        name: current.name,
        target: startDate,
        ongoing: false
      }
    }
  }

  return null
}

function getNextSpringFestivalTarget(now) {
  var index

  for (index = 0; index < SPRING_FESTIVAL_DATES.length; index += 1) {
    var current = SPRING_FESTIVAL_DATES[index]
    var target = createLocalDate(current.parts)
    if (target > now) {
      return {
        name: '春节',
        target: target
      }
    }
  }

  return {
    name: '春节',
    target: createLocalDate(SPRING_FESTIVAL_DATES[SPRING_FESTIVAL_DATES.length - 1].parts)
  }
}

function buildCountdownItems(now) {
  var weekend = getWeekendTarget(now)
  var holiday = getNextHolidayTarget(now)
  var springFestival = getNextSpringFestivalTarget(now)

  if (!holiday) {
    holiday = {
      name: springFestival.name,
      target: springFestival.target,
      ongoing: false
    }
  }

  return [
    {
      key: 'weekend',
      title: '离周末还有',
      hint: weekend.ongoing ? '周末进行中' : '周六 00:00 开始',
      value: formatFullCountdown(weekend.target.getTime() - now.getTime())
    },
    {
      key: 'holiday',
      title: '离最近一个假日还有',
      hint: formatTargetHint(holiday.target, holiday.name, holiday.ongoing),
      value: formatFullCountdown(holiday.target.getTime() - now.getTime())
    },
    {
      key: 'spring-festival',
      title: '离过年还有',
      hint: formatTargetHint(springFestival.target, springFestival.name, false),
      value: formatFullCountdown(springFestival.target.getTime() - now.getTime())
    }
  ]
}

function buildHolidayCard(now) {
  var holiday = getNextHolidayTarget(now)

  if (!holiday) {
    holiday = getNextSpringFestivalTarget(now)
    holiday.ongoing = false
  }

  return {
    holidayCardTitle: holiday.ongoing ? holiday.name + '进行中' : '离最近假期还有',
    holidayCardValue: formatFullCountdown(holiday.target.getTime() - now.getTime()),
    holidayCardHint: formatTargetHint(holiday.target, holiday.name, holiday.ongoing),
    holidayCardBadge: holiday.name
  }
}

module.exports = {
  buildCountdownItems: buildCountdownItems,
  buildHolidayCard: buildHolidayCard
}
