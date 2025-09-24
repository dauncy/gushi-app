import { api } from "@/convex/_generated/api";
import { useCategorySelect } from "@/hooks/use-category-select";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { cn } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { LucideIcon } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { BedSingle } from "../ui/icons/bed-single";
import { Circle } from "../ui/icons/circle-icon";
import { GraduationCap } from "../ui/icons/graduation-cap-icon";
import { Grid2X2Plus } from "../ui/icons/grid-2-plus-icon";
import { Rocket } from "../ui/icons/rocket-icon";
import { Skeleton } from "../ui/skeleton";

interface Category {
	name: string;
	icon: LucideIcon;
	id: string;
	soon?: boolean;
}

const NameToIcon = {
	bedtime: BedSingle,
	lesson: GraduationCap,
	adventure: Rocket,
	"create-your-own": Grid2X2Plus,
};

export const CategoriesSelector = () => {
	const { data: categories, isLoading } = useConvexQuery(api.stories.queries.getFeaturedCategories, {});
	const sanitizedCatgeories = useMemo(() => {
		if (!categories || categories.length === 0) {
			return [];
		}
		const sanitized = categories?.map((category) => {
			const icon = NameToIcon[category.name.toLowerCase() as keyof typeof NameToIcon] ?? Circle;
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
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			alwaysBounceHorizontal={false}
			contentContainerStyle={{
				flexDirection: "row",
				justifyContent: "space-between",
				display: "flex",
				gap: 2,
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
		</ScrollView>
	);
};

const LoadingCategory = () => {
	return (
		<View className="flex flex-col p-2 px-4 items-center gap-y-1">
			<Skeleton className="w-10 h-10 rounded-full bg-black/30" />
			<Skeleton className="w-16 h-4 rounded-md bg-black/30" />
		</View>
	);
};

const CategoryPill = ({ categoryData }: { categoryData: Category }) => {
	const { category, handleCategorySelect } = useCategorySelect();
	const [instantSelect, setInstantSelect] = useState(false);

	useEffect(() => {
		if (category === categoryData.id) {
			setInstantSelect(true);
		} else {
			setInstantSelect(false);
		}
	}, [category, categoryData.id, setInstantSelect]);

	useEffect(() => {
		if (instantSelect) {
			handleCategorySelect(categoryData.id);
		}
	}, [instantSelect, handleCategorySelect, categoryData.id]);

	const selected = useMemo(() => {
		return category === categoryData.id;
	}, [category, categoryData.id]);

	const handlePress = useCallback(() => {
		setInstantSelect(true);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
	}, [setInstantSelect]);

	return (
		<TouchableOpacity
			disabled={categoryData.soon}
			activeOpacity={0.8}
			onPress={handlePress}
			key={categoryData.id}
			className={cn(
				"flex flex-col gap-y-1 items-center p-2 px-4 rounded-3xl border-2 border-transparent",
				(instantSelect || selected) && "bg-[#ceef32] border-[#0395ff] border-2",
			)}
		>
			<categoryData.icon className={cn("text-[#0395ff]", categoryData.soon && "opacity-50")} size={28} />
			<Text
				className={cn(
					"text-[#0395ff] text-sm font-medium mt-auto",
					(instantSelect || selected) && "font-semibold",
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
};
