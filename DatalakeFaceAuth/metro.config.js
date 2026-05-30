const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    assetExts: [...assetExts, "tflite", "lite", "task", "bin"],
    sourceExts: [...sourceExts, "ts", "tsx", "js", "jsx"],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: { experimentalImportSupport: false, inlineRequires: true },
    }),
  },
});
