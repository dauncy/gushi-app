import { memo } from "react";
import { View } from "react-native";
import { CategoryToColor, CategoryToIcon } from "./category-utils";

export const CategoryBadge = memo(({ categoryName }: { categoryName: string }) => {
	const color = CategoryToColor[categoryName.toLowerCase() as keyof typeof CategoryToColor] ?? {
		background: "#0395ff",
		foreground: "#fffbf3",
	};
	const Icon = CategoryToIcon[categoryName.toLowerCase() as keyof typeof CategoryToIcon] ?? null;
	return (
		<View
			className="flex flex-row items-center gap-x-1 p-1 rounded-md"
			style={{ backgroundColor: color.background, borderColor: color.foreground, borderWidth: 0.5 }}
		>
			<Icon fill={color.foreground} size={16} stroke={color.foreground} />
		</View>
	);
});

CategoryBadge.displayName = "CategoryBadge";
