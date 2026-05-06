const CLOUD_CONFIG = {
  // Fill this after creating a CloudBase environment in WeChat DevTools.
  // Example: envId: 'niuma-prod-xxxxxx'
  envId: 'cloud1-d1gvcraj65afdd1c7'
}

function isConfigured() {
  return !!CLOUD_CONFIG.envId
}

module.exports = {
  CLOUD_CONFIG: CLOUD_CONFIG,
  isConfigured: isConfigured
}
