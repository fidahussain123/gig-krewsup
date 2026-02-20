/**
 * Expo config plugin: force Android to allow HTTP (cleartext) traffic
 * so the app can connect to http://51.21.245.127:3001
 */
const { withAndroidManifest } = require('expo/config-plugins');

function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const applications = manifest.manifest?.application;
    if (Array.isArray(applications)) {
      applications.forEach((app) => {
        if (app.$) {
          app.$['android:usesCleartextTraffic'] = 'true';
        }
      });
    }
    return config;
  });
}

module.exports = withCleartextTraffic;
