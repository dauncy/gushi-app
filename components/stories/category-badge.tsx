import { memo } from "react";
import { Text, View } from "react-native";
import { Circle } from "../ui/icons/circle-icon";
import { CategoryToColor, CategoryToIcon } from "./category-utils";

export const CategoryBadge = memo(({ categoryName }: { categoryName: string }) => {
	const color = CategoryToColor[categoryName.toLowerCase() as keyof typeof CategoryToColor] ?? {
		background: "#0395ff",
		foreground: "#fffbf3",
	};
	const Icon = CategoryToIcon[categoryName.toLowerCase() as keyof typeof CategoryToIcon] ?? Circle;
	return (
		<View
			className="flex flex-row items-center gap-x-1 py-0.5 px-1 rounded-md"
			style={{ backgroundColor: color.background, borderColor: color.foreground, borderWidth: 1 }}
		>
			<Icon color={color.foreground} size={16} />
			<Text className="text-sm font-medium" style={{ color: color.foreground }}>
				{categoryName}
			</Text>
		</View>
	);
});

CategoryBadge.displayName = "CategoryBadge";
