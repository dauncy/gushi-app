const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

// Base Expo Metro configuration
const config = getDefaultConfig(__dirname);

// Enable NativeWind (Tailwind) support
const nativewindConfig = withNativeWind(config, {
	input: "./global.css",
});

// Wrap with Reanimated's Metro config to support worklets and animations
module.exports = wrapWithReanimatedMetroConfig(nativewindConfig);
