import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { cn } from "@/lib/utils";
import { selectedCategoryState, useSelectedCategory } from "@/stores/category-store";
import * as Haptics from "expo-haptics";
import { LucideIcon } from "lucide-react-native";
import { memo, useCallback, useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Circle } from "../ui/icons/circle-icon";
import { Grid2X2Plus } from "../ui/icons/grid-2-plus-icon";
import { Skeleton } from "../ui/skeleton";
import { CategoryToIcon } from "./category-utils";

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
			className="w-full p-1 bg-black/20 rounded-3xl "
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
	const { categoryId } = useSelectedCategory();
	const selected = categoryId === categoryData.id;

	const handleSelect = useCallback(() => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		selectedCategoryState.categoryId = categoryData.id as Id<"categories">;
	}, [categoryData.id]);

	return (
		<TouchableOpacity
			disabled={categoryData.soon}
			activeOpacity={0.8}
			onPress={() => {
				handleSelect();
			}}
			key={categoryData.id}
			className={cn(
				"flex flex-col gap-y-1 items-center p-2 px-3.5 rounded-3xl border-2 border-transparent active:bg-[#ceef32] active:border-[#0395ff] active:border-2",
				selected && "bg-[#ceef32] border-[#0395ff] border-2",
			)}
		>
			<categoryData.icon className={cn("text-[#0395ff]", categoryData.soon && "opacity-50")} size={28} />
			<Text
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
						<Text className="text-[#ff2d01] text-[8px] font-bold mt-auto">Launching soon</Text>
					</View>
				</>
			)}
		</TouchableOpacity>
	);
});

CategoryPill.displayName = "CategoryPill";
