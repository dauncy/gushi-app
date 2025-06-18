// eslint.config.js
const expoConfig = require("eslint-config-expo/flat");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");

module.exports = defineConfig([
	...expoConfig,
	// your other config
	{
		plugins: {
			"@typescript-eslint": tseslint.plugin,
		},
		linterOptions: {
			reportUnusedDisableDirectives: "off",
		},
		rules: {
			"@typescript-eslint/no-non-null-assertion": "error",
		},
	},
]);
