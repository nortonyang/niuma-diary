function getModulo(seed) {
  if (seed === 0) return 0
  if (!seed) return null

  var text = String(seed).trim()
  var numeric = Number(text)
  var total = 0
  var i

  if (text && isFinite(numeric)) {
    return Math.abs(Math.floor(numeric)) % 2
  }

  if (!text) return null

  for (i = 0; i < text.length; i += 1) {
    total = (total + text.charCodeAt(i) * (i + 1)) % 100000
  }

  return total % 2
}

function getAvatarType(seed) {
  var modulo = getModulo(seed)

  if (modulo === 0) return 'horse'
  if (modulo === 1) return 'cow'
  return 'pair'
}

function buildAvatarState(seed) {
  var type = getAvatarType(seed)
  var animals = type === 'pair' ? [
    { type: 'cow' },
    { type: 'horse' }
  ] : [
    { type: type }
  ]
  var labels = {
    horse: '默认头像：马',
    cow: '默认头像：牛',
    pair: '默认头像：牛和马'
  }

  return {
    avatarType: type,
    avatarLabel: labels[type],
    avatarAnimals: animals
  }
}

module.exports = {
  getAvatarType: getAvatarType,
  buildAvatarState: buildAvatarState
}
