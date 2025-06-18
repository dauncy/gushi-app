/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */

module.exports = {
	"*.{js,jsx,ts,tsx}": (files) => {
		// filter out files that are in the convex/_generated directory
		const filteredMatches = files.filter((file) => !file.includes("convex/_generated"));
		const joined = filteredMatches.join(" ");
		return ["eslint --fix " + joined, "prettier --write " + joined];
	},
	"*.{json,md,css}": (files) => {
		// filter out files that are in the convex/_generated directory
		const filteredMatches = files.filter((file) => !file.includes("convex/_generated"));
		if (filteredMatches.length === 0) return [];
		return ["prettier --write " + filteredMatches.join(" ")];
	},
};
