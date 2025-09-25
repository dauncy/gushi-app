import { BedSingle } from "../ui/icons/bed-single";
import { GraduationCap } from "../ui/icons/graduation-cap-icon";
import { Rocket } from "../ui/icons/rocket-icon";

export const CategoryToIcon = {
	bedtime: BedSingle,
	lesson: GraduationCap,
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
