import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { cn } from "@/lib/utils";
import { updateCategoryId, useSelectedCategory } from "@/stores/category-store";
import * as Haptics from "expo-haptics";
import { LucideIcon } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Circle } from "../ui/icons/circle-icon";
import { Grid2X2Plus } from "../ui/icons/grid-2-plus-icon";
import { Skeleton } from "../ui/skeleton";
import { CategoryToColor, CategoryToIcon } from "./category-utils";

interface Category {
	name: string;
	icon: LucideIcon;
	id: string;
	soon?: boolean;
}

export const CategoriesSelector = memo(() => {
	const { data: categories, isLoading } = useConvexQuery(api.stories.queries.getFeaturedCategories, {});
	const sanitizedCatgeories = useMemo(() => {
		if (!categories || categories.length === 0) {
			return [];
		}
		const sanitized = categories?.map((category) => {
			const icon = CategoryToIcon[category.name.toLowerCase() as keyof typeof CategoryToIcon] ?? Circle;
			return {
				name: category.name,
				id: category._id,
				icon,
				soon: false,
			};
		});
		return [
			...sanitized,
			{
				name: "Create your own",
				id: "create-your-own",
				icon: Grid2X2Plus,
				soon: true,
			},
		];
	}, [categories]);

	return (
		<View
			style={{
				flexDirection: "row",
				justifyContent: "space-between",
				display: "flex",
			}}
			className="w-full p-1 bg-black/20 rounded-3xl overflow-hidden"
		>
			{isLoading ? (
				<>
					{Array.from({ length: 4 }).map((_, index) => (
						<LoadingCategory key={index} />
					))}
				</>
			) : (
				<>
					{sanitizedCatgeories.map((category) => (
						<CategoryPill key={category.id} categoryData={category} />
					))}
				</>
			)}
		</View>
	);
});

CategoriesSelector.displayName = "CategoriesSelector";

const LoadingCategory = () => {
	return (
		<View className="flex flex-col p-2 px-3.5 items-center gap-y-1">
			<Skeleton className="w-10 h-10 rounded-full bg-black/30" />
			<Skeleton className="w-16 h-4 rounded-md bg-black/30" />
		</View>
	);
};

const CategoryPill = memo(({ categoryData }: { categoryData: Category }) => {
	const categoryId = useSelectedCategory();
	const selected = categoryId === categoryData.id;

	const handleSelect = useCallback(() => {
		if (selected) {
			updateCategoryId(null);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
			return;
		}
		updateCategoryId(categoryData.id as Id<"categories">);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
	}, [categoryData.id, selected]);

	const color = CategoryToColor[categoryData.name.toLowerCase() as keyof typeof CategoryToColor] ?? {
		background: "#0395ff",
		foreground: "#fffbf3",
	};

	const style = { ...(selected ? { backgroundColor: color.background, borderColor: color.foreground } : {}) };
	const textStyle = { ...(selected ? { color: color.foreground } : {}) };
	const iconcolor = selected ? color.foreground : "#0395ff";
	return (
		<TouchableOpacity
			disabled={categoryData.soon}
			activeOpacity={0.8}
			onPressIn={() => {
				handleSelect();
			}}
			key={categoryData.id}
			style={style}
			className={cn("flex flex-col gap-y-1 items-center p-1 px-2.5 rounded-3xl border-2 border-transparent min-h-18")}
		>
			<categoryData.icon className={cn("", categoryData.soon && "opacity-50")} size={28} color={iconcolor} />
			<Text
				allowFontScaling={false}
				style={textStyle}
				className={cn(
					"text-[#0395ff] text-sm font-medium mt-auto capitalize",
					selected && "font-semibold",
					categoryData.soon && "opacity-50",
				)}
			>
				{categoryData.name}
			</Text>
			{categoryData.soon && (
				<>
					<View className="absolute inset-0 bg-black/30 opacity-50 z-10 rounded-2xl"></View>
					<View
						className="p-1 px-2 rounded-md bg-[#fffbf3] absolute top-1 right-2 z-20 border border-[#ff2d01]"
						style={{
							shadowColor: "#ffffff",
							shadowOffset: {
								width: 0.5,
								height: 1.5,
							},
							shadowOpacity: 0.25,
							shadowRadius: 8,
						}}
					>
						<Text className="text-[#ff2d01] text-[8px] font-bold mt-auto" allowFontScaling={false}>
							Launching soon
						</Text>
					</View>
				</>
			)}
		</TouchableOpacity>
	);
});

CategoryPill.displayName = "CategoryPill";
