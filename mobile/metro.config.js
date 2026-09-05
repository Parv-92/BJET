const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'expo-pdf-page-renderer': path.resolve(__dirname, 'modules/expo-pdf-page-renderer'),
};

module.exports = config;
