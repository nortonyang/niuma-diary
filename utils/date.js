function pad(number) {
  return number < 10 ? '0' + number : '' + number
}

function formatDate(date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
}

function parseDate(dateText) {
  var parts = dateText.split('-').map(function (part) {
    return Number(part)
  })
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function getToday() {
  return formatDate(new Date())
}

function getMonthKey(year, month) {
  return year + '-' + pad(month)
}

function isInMonth(dateText, year, month) {
  return dateText.indexOf(getMonthKey(year, month)) === 0
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function buildMonthCells(year, month) {
  var days = getDaysInMonth(year, month)
  var firstDay = new Date(year, month - 1, 1).getDay()
  var leading = (firstDay + 6) % 7
  var cells = []
  var i

  for (i = 0; i < leading; i += 1) {
    cells.push({ key: 'blank-' + i, day: '', date: '', inMonth: false })
  }

  for (i = 1; i <= days; i += 1) {
    cells.push({
      key: formatDate(new Date(year, month - 1, i)),
      day: i,
      date: formatDate(new Date(year, month - 1, i)),
      inMonth: true
    })
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: 'tail-' + cells.length, day: '', date: '', inMonth: false })
  }

  return cells
}

function addMonths(year, month, diff) {
  var next = new Date(year, month - 1 + diff, 1)
  return {
    year: next.getFullYear(),
    month: next.getMonth() + 1
  }
}

function formatDisplayDate(dateText) {
  var date = parseDate(dateText)
  return (date.getMonth() + 1) + '月' + date.getDate() + '日'
}

var LUNAR_DAY_NAMES = [
  '',
  '初一',
  '初二',
  '初三',
  '初四',
  '初五',
  '初六',
  '初七',
  '初八',
  '初九',
  '初十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '廿一',
  '廿二',
  '廿三',
  '廿四',
  '廿五',
  '廿六',
  '廿七',
  '廿八',
  '廿九',
  '三十'
]

function normalizeLunarMonth(monthText) {
  var isLeap = monthText.indexOf('闰') === 0
  var text = isLeap ? monthText.slice(1) : monthText

  if (text === '一月') {
    text = '正月'
  } else if (text === '十一月') {
    text = '冬月'
  } else if (text === '十二月') {
    text = '腊月'
  }

  return isLeap ? '闰' + text : text
}

function formatLunarDay(dayText) {
  var day = Number(dayText)
  if (day >= 1 && day <= 30) {
    return LUNAR_DAY_NAMES[day]
  }

  return dayText.replace('日', '')
}

function normalizeLunarText(text) {
  return text
    .replace('十一月', '冬月')
    .replace('十二月', '腊月')
    .replace('一月', '正月')
    .replace(/(\d{1,2})日/g, function (match, dayText) {
      return formatLunarDay(dayText)
    })
}

function formatLunarDate(date) {
  try {
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) {
      return ''
    }

    var formatter = new Intl.DateTimeFormat('zh-u-ca-chinese', {
      month: 'long',
      day: 'numeric'
    })

    if (typeof formatter.formatToParts === 'function') {
      var parts = formatter.formatToParts(date)
      var monthText = ''
      var dayText = ''

      parts.forEach(function (part) {
        if (part.type === 'month') {
          monthText = part.value
        } else if (part.type === 'day') {
          dayText = part.value
        }
      })

      if (monthText && dayText) {
        return normalizeLunarMonth(monthText) + formatLunarDay(dayText)
      }
    }

    return normalizeLunarText(formatter.format(date))
  } catch (error) {
    return ''
  }
}

function formatHeaderDateWithLunar(dateText) {
  var date = parseDate(dateText)
  var weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  var solarText = (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + weekMap[date.getDay()]
  var lunarText = formatLunarDate(date)

  return lunarText ? solarText + '\n农历' + lunarText : solarText
}

module.exports = {
  formatDate: formatDate,
  parseDate: parseDate,
  getToday: getToday,
  getMonthKey: getMonthKey,
  isInMonth: isInMonth,
  getDaysInMonth: getDaysInMonth,
  buildMonthCells: buildMonthCells,
  addMonths: addMonths,
  formatDisplayDate: formatDisplayDate,
  formatLunarDate: formatLunarDate,
  formatHeaderDateWithLunar: formatHeaderDateWithLunar
}
