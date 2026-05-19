const STORAGE_KEYS = {
  DAILY_RECORDS: 'niuma_daily_records',
  DAILY_DRAFTS: 'niuma_daily_drafts',
  WISH_EDITOR_DRAFT: 'niuma_wish_editor_draft',
  AFTER_QUIT_WISHES: 'niuma_after_quit_wishes',
  USER_SETTINGS: 'niuma_user_settings',
  CHECKLIST_ITEMS: 'niuma_checklist_items',
  CALM_HISTORY: 'niuma_calm_history',
  REMINDER_SETTINGS: 'niuma_reminder_settings',
  SCHEMA_VERSION_INFO: 'niuma_schema_version_info'
}

const CURRENT_SCHEMA_VERSION = 1

const DEFAULT_SETTINGS = {
  userId: '',
  nickname: '',
  avatarUrl: '',
  showNicknameOnShare: false,
  monthlySalary: '',
  workDaysPerMonth: 21.75,
  workHoursPerDay: 8
}

const DEFAULT_REMINDER_SETTINGS = {
  enabled: false,
  time: '20:00',
  templateId: 'REPLACE_WITH_YOUR_TEMPLATE_ID'
}

const MOODS = [
  { value: 'ok', label: '还能忍', shortLabel: '能忍' },
  { value: 'annoyed', label: '有点烦', shortLabel: '烦' },
  { value: 'want_quit', label: '很想走', shortLabel: '想走' },
  { value: 'explode', label: '立刻想裸辞', shortLabel: '爆表' }
]

const REASONS = [
  { value: 'low_salary', label: '钱少' },
  { value: 'overtime', label: '加班' },
  { value: 'boss', label: '老板' },
  { value: 'coworker', label: '同事' },
  { value: 'client', label: '客户' },
  { value: 'commute', label: '通勤' },
  { value: 'no_growth', label: '没成长' },
  { value: 'pua', label: '被 PUA' },
  { value: 'meaningless', label: '工作无意义' },
  { value: 'health', label: '身体吃不消' },
  { value: 'other', label: '其他' }
]

const WISH_CATEGORIES = [
  { value: 'rest', label: '休息' },
  { value: 'travel', label: '旅行' },
  { value: 'study', label: '学习' },
  { value: 'side_project', label: '副业' },
  { value: 'career_change', label: '转行' },
  { value: 'startup', label: '创业' },
  { value: 'family', label: '陪家人' },
  { value: 'nothing', label: '什么都不干' },
  { value: 'other', label: '其他' }
]

const WISH_STATUSES = [
  { value: 'todo', label: '未开始' },
  { value: 'doing', label: '准备中' },
  { value: 'done', label: '已完成' },
  { value: 'paused', label: '暂时放下' }
]

const DAILY_COPY = [
  '今天又是努力不裸辞的一天。',
  '先记录，再决定。',
  '今天没裸辞，也算一种胜利。',
  '我不是在忍，我是在给退路攒预算。',
  '班味可以很重，退路也要慢慢攒。'
]

const SHARE_COPY = [
  '今日班味状态已记录。',
  '今天又把裸辞按钮按住了。',
  '班味浓度检测完成。',
  '先把情绪记下来，明天再看一遍。'
]

const CHECKLIST_STAGES = [
  { value: 'cool_down', label: '先冷静' },
  { value: 'save_money', label: '先攒钱' },
  { value: 'find_next', label: '先找下家' },
  { value: 'resign_ready', label: '准备提离职' },
  { value: 'recover', label: '离职后恢复' }
]

const DEFAULT_CHECKLIST_ITEMS = [
  { id: 'resume', stage: 'find_next', title: '更新简历', sort: 10 },
  { id: 'portfolio', stage: 'find_next', title: '整理作品集', sort: 20 },
  { id: 'savings', stage: 'save_money', title: '盘点存款', sort: 30 },
  { id: 'insurance', stage: 'save_money', title: '计算社保和公积金影响', sort: 40 },
  { id: 'bonus', stage: 'resign_ready', title: '确认年终奖和绩效发放时间', sort: 50 },
  { id: 'non_compete', stage: 'resign_ready', title: '查看竞业协议', sort: 60 },
  { id: 'backup', stage: 'resign_ready', title: '备份个人资料', sort: 70 },
  { id: 'handover', stage: 'resign_ready', title: '梳理工作交接', sort: 80 },
  { id: 'first_month', stage: 'recover', title: '规划离职后第一个月安排', sort: 90 },
  { id: 'sleep_on_it', stage: 'cool_down', title: '隔 24 小时再看一次决定', sort: 100 }
]

function findLabel(list, value) {
  var item = list.find(function (candidate) {
    return candidate.value === value
  })
  return item ? item.label : ''
}

module.exports = {
  STORAGE_KEYS: STORAGE_KEYS,
  DEFAULT_SETTINGS: DEFAULT_SETTINGS,
  DEFAULT_REMINDER_SETTINGS: DEFAULT_REMINDER_SETTINGS,
  MOODS: MOODS,
  REASONS: REASONS,
  WISH_CATEGORIES: WISH_CATEGORIES,
  WISH_STATUSES: WISH_STATUSES,
  CHECKLIST_STAGES: CHECKLIST_STAGES,
  DEFAULT_CHECKLIST_ITEMS: DEFAULT_CHECKLIST_ITEMS,
  DAILY_COPY: DAILY_COPY,
  SHARE_COPY: SHARE_COPY,
  CURRENT_SCHEMA_VERSION: CURRENT_SCHEMA_VERSION,
  findLabel: findLabel
}
