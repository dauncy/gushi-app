import { Apple } from "../ui/icons/apple-icon";
import { Lightbulb } from "../ui/icons/lightbulb-icon";
import { Moon } from "../ui/icons/moon-icon";

export const CategoryToIcon = {
	["calm & cozy"]: Moon,
	["gentle lessons"]: Apple,
	["curious minds"]: Lightbulb,
};

export const CategoryToColor = {
	["gentle lessons"]: {
		background: "#ff2d01",
		foreground: "#fffbf3",
	},
	["calm & cozy"]: {
		background: "#0395ff",
		foreground: "#fffbf3",
	},
	["curious minds"]: {
		background: "#7a64ee",
		foreground: "#fffbf3",
	},
};
