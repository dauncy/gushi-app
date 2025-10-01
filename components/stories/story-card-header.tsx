import { secondsToMinuteString } from "@/lib/utils";
import { memo } from "react";
import { Text, View } from "react-native";
import { Clock } from "../ui/icons/clock-icon";

export const StoryCardHeader = memo(({ title, duration }: { title: string; duration: number }) => {
	return (
		<View className="flex-1 flex flex-col gap-y-1">
			<Text className="text-[#0D3311] text-lg font-medium" style={{ fontSize: 16, lineHeight: 20 }}>
				{title}
			</Text>
			<View className="flex flex-row items-center gap-x-2">
				<Clock className="size-4 text-[#0D3311]/80" size={16} />
				<Text className="text-[#0D3311]/80 text-sm font-medium">{secondsToMinuteString(duration)}</Text>
			</View>
		</View>
	);
});

StoryCardHeader.displayName = "StoryCardHeader";
