const CLOUD_CONFIG = {
  // Fill this after creating a CloudBase environment in WeChat DevTools.
  // Example: envId: 'niuma-prod-xxxxxx'
  envId: 'prod-d8g4h00i9b7cf9e7a'
}

function isConfigured() {
  return !!CLOUD_CONFIG.envId
}

module.exports = {
  CLOUD_CONFIG: CLOUD_CONFIG,
  isConfigured: isConfigured
}
