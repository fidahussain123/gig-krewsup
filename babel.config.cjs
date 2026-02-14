module.exports = function (api) {
  api.cache(true);
  
  // Workaround for worklets plugin error during Expo config serialization
  // The plugin is auto-included by babel-preset-expo, so we need to handle it
  const reanimatedPlugin = require('react-native-reanimated/plugin');
  
  // Wrap the plugin to handle undefined state during config serialization
  const safeReanimatedPlugin = function(...args) {
    try {
      return reanimatedPlugin(...args);
    } catch (error) {
      // During config serialization, state might be undefined
      // Return a no-op plugin in that case
      if (error.message && error.message.includes('workletNumber')) {
        return {
          visitor: {}
        };
      }
      throw error;
    }
  };
  
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      safeReanimatedPlugin, // Must be last
    ],
  };
};
