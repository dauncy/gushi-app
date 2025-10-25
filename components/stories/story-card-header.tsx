import { StoryPreview } from "@/convex/stories/schema";
import { secondsToMinuteString } from "@/lib/utils";
import { memo } from "react";
import { Text, View } from "react-native";
import { Clock } from "../ui/icons/clock-icon";
import { StoryCardPlayButton } from "./story-card-play-button";

export const StoryCardHeader = memo(
	({ story, hasPlayButton = false }: { story: StoryPreview; hasPlayButton?: boolean }) => {
		const { title, duration } = story;
		return (
			<View className="flex flex-col gap-y-1 flex-1 grow stretch">
				<Text
					className="text-foreground text-lg font-medium"
					maxFontSizeMultiplier={1.2}
					style={{ fontSize: 18, lineHeight: 22.5, fontFamily: "Baloo" }}
				>
					{title}
				</Text>
				{story.tags && story.tags.length > 0 && (
					<View className="w-full flex flex-row gap-[1.5px] items-start flex-wrap pb-1 -mt-0.5">
						{story.tags.map((t) => (
							<Text
								key={t}
								className="p-1 rounded-md bg-[#9cbff1] text-[9px] text-[#1e397c] font-medium"
								allowFontScaling={false}
							>
								{t}
							</Text>
						))}
					</View>
				)}
				<View className="w-full flex flex-row gap-x-2 items-center mt-auto">
					<View className="flex flex-row items-center gap-x-2 flex-1">
						<Clock className="size-4 text-[#0D3311]/80" size={16} />
						<Text className="text-[#0D3311]/80 text-sm font-medium" allowFontScaling={false}>
							{secondsToMinuteString(duration)}
						</Text>
					</View>
					{hasPlayButton && (
						<View className="flex items-center justify-center">
							<StoryCardPlayButton story={story} />
						</View>
					)}
				</View>
			</View>
		);
	},
);

StoryCardHeader.displayName = "StoryCardHeader";
