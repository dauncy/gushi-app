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
				name: "Personalize",
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
			className="w-full p-1 bg-foreground/20 rounded-3xl overflow-hidden max-w-[468px]"
		>
			{isLoading ? (
				<>
					{Array.from({ length: 4 }).map((_, index) => (
						<LoadingCategory key={index} last={index === 3} />
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

const LoadingCategory = ({ last }: { last: boolean }) => {
	return (
		<View className="flex flex-col p-1 px-1 rounded-3xl items-center gap-y-2.5">
			<Skeleton className=" rounded-full bg-foreground/20 w-[28px] h-[28px]" />
			<Skeleton className={cn("w-[72px] h-3 rounded-md bg-foreground/20")} />
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

	const colors = CategoryToColor[categoryData.name.toLowerCase() as keyof typeof CategoryToColor] ?? {
		background: "#0395ff",
		foreground: "#fffbf3",
	};

	const color = colors.background;

	const textStyle = { ...(selected ? { color, borderColor: colors.foreground } : {}) };
	const iconcolor = selected ? colors.background : "#0D331140";
	return (
		<TouchableOpacity
			disabled={categoryData.soon}
			activeOpacity={0.8}
			onPressIn={() => {
				handleSelect();
			}}
			key={categoryData.id}
			className={cn("flex flex-col gap-y-1 items-center p-1 px-1.5")}
		>
			<categoryData.icon
				className={cn("", categoryData.soon && "opacity-60")}
				size={28}
				color={iconcolor}
				fill={selected ? "#fffbf3" : "none"}
			/>
			<Text
				allowFontScaling={false}
				style={textStyle}
				className={cn(
					"text-foreground/40 text-sm font-medium mt-auto capitalize text-center",
					selected && "font-semibold",
					categoryData.soon && "opacity-60",
				)}
			>
				{categoryData.name}
			</Text>

			{categoryData.soon && (
				<>
					<View className="absolute inset-0 bg-black/20 opacity-50 z-10 rounded-2xl"></View>
					<View
						className="p-1 px-1 rounded-md bg-[#fffbf3] absolute top-1 right-1 z-20 border border-[#ff2d01]"
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
						<Text className="text-[#ff2d01] text-[8px] font-semibold mt-auto" allowFontScaling={false}>
							Coming soon
						</Text>
					</View>
				</>
			)}
		</TouchableOpacity>
	);
});

CategoryPill.displayName = "CategoryPill";
