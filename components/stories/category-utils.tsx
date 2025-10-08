import { Lightbulb } from "../ui/icons/lightbulb-icon";
import { Moon } from "../ui/icons/moon-icon";
import { Rocket } from "../ui/icons/rocket-icon";

export const CategoryToIcon = {
	bedtime: Moon,
	lesson: Lightbulb,
	adventure: Rocket,
};

export const CategoryToColor = {
	bedtime: {
		background: "#ff2d01",
		foreground: "#fffbf3",
	},
	lesson: {
		background: "#0395ff",
		foreground: "#fffbf3",
	},
	adventure: {
		background: "#ceef32",
		foreground: "#0395ff",
	},
};
