import { memo } from "react";
import { View } from "react-native";
import { CategoryToColor, CategoryToIcon, SelectedCategoryIcon } from "./category-utils";

export const CategoryBadge = memo(({ categoryName }: { categoryName: string }) => {
	const color = CategoryToColor[categoryName.toLowerCase() as keyof typeof CategoryToColor] ?? {
		background: "#0395ff",
		foreground: "#fffbf3",
	};
	const Icon = CategoryToIcon[categoryName.toLowerCase() as keyof typeof CategoryToIcon] ?? null;
	const SelectedIcon = SelectedCategoryIcon[categoryName.toLowerCase() as keyof typeof SelectedCategoryIcon] ?? null;
	return (
		<View
			className="flex flex-row items-center gap-x-1 p-1 rounded"
			style={{ backgroundColor: color.background, borderColor: color.foreground, borderWidth: 0.5 }}
		>
			{SelectedIcon ? <SelectedIcon size={16} /> : <Icon fill={color.foreground} size={16} stroke={color.foreground} />}
		</View>
	);
});

CategoryBadge.displayName = "CategoryBadge";
