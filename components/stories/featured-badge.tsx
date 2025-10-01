import { cn } from "@/lib/utils";
import { memo } from "react";
import { Text, View } from "react-native";

export const FeaturedBadge = memo(({ className = "" }: { className?: string }) => {
	return (
		<View
			className={cn("absolute top-2 right-2 bg-[#fffbf3] z-20 w-24 rounded-md p-1 border border-[#ff2d01]", className)}
			style={{
				shadowColor: "#f8fafc",
				shadowOffset: {
					width: 0.5,
					height: 1.5,
				},
				shadowOpacity: 0.25,
				shadowRadius: 4,
			}}
		>
			<Text className="text-[#ff2d01] text-center text-xs font-bold">FEATURED</Text>
		</View>
	);
});

FeaturedBadge.displayName = "FeaturedBadge";
