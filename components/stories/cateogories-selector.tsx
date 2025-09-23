import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { BedSingle } from "../ui/icons/bed-single";
import { GraduationCap } from "../ui/icons/graduation-cap-icon";
import { Grid2X2Plus } from "../ui/icons/grid-2-plus-icon";
import { Rocket } from "../ui/icons/rocket-icon";

interface Category {
	name: string;
	icon: LucideIcon;
	id: string;
	soon?: boolean;
}

const categories: Category[] = [
	{
		name: "Bedtime",
		icon: BedSingle,
		id: "bedtime",
	},
	{
		name: "Lesson",
		icon: GraduationCap,
		id: "lesson",
	},
	{
		name: "Adventure",
		icon: Rocket,
		id: "adventure",
	},
	{
		name: "Create your own",
		icon: Grid2X2Plus,
		id: "create-your-own",
		soon: true,
	},
];

export const CategoriesSelector = () => {
	const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

	return (
		<View className="w-full p-1 bg-white/20 rounded-3xl  flex flex-row justify-between ">
			{categories.map((category) => {
				const selected = category.id === currentCategory?.id;
				return (
					<TouchableOpacity
						disabled={category.soon}
						activeOpacity={0.8}
						onPress={() => {
							if (category.soon) {
								return;
							}
							setCurrentCategory(category);
						}}
						key={category.id}
						className={cn(
							"flex flex-col gap-y-1 items-center p-2 px-4 rounded-3xl border border-black/0",
							selected && "bg-black/40 border-white border",
						)}
					>
						<category.icon
							className={cn("text-[#e0f2fe]/50", selected && "text-white/80", category.soon && "opacity-50")}
							size={28}
						/>
						<Text
							className={cn(
								"text-[#e0f2fe]/50 text-sm font-medium mt-auto",
								selected && "text-white/80 font-semibold",
								category.soon && "opacity-50",
							)}
						>
							{category.name}
						</Text>
						{category.soon && (
							<>
								<View className="absolute inset-0 bg-black/30 opacity-50 z-10 rounded-2xl"></View>
								<View
									className="p-1 px-2 rounded-md bg-amber-300 absolute top-1 right-2 z-20 border border-rose-500"
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
									<Text className="text-rose-500 text-[8px] font-bold mt-auto">Soon</Text>
								</View>
							</>
						)}
					</TouchableOpacity>
				);
			})}
		</View>
	);
};
