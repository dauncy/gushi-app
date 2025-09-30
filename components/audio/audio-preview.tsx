import { Pause } from "@/components/ui/icons/pause-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Stop } from "@/components/ui/icons/stop-icon";
import { audioStore, useAudio, useIsAudioInState } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { cn } from "@/lib/utils";
import { useStore } from "@tanstack/react-store";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { State } from "react-native-track-player";
import { StoryImagePreview } from "../stories/story-image";

export const AudioPreviewPlayer = ({
	onCardPress,
	className = "",
}: {
	onCardPress?: (storyId: Id<"stories">) => void;
	className?: string;
}) => {
	const { play, pause, stop } = useAudio();
	const isPlaying = useIsAudioInState({ state: State.Playing });
	const storyId = useStore(audioStore, (state) => state.story.id);

	const { data: story } = useConvexQuery(
		api.stories.queries.getStory,
		{
			storyId: storyId as Id<"stories">,
		},
		{ enabled: !!storyId },
	);

	const handlePress = useCallback(() => {
		if (!onCardPress) {
			return;
		}
		if (storyId) {
			onCardPress(storyId);
		}
	}, [onCardPress, storyId]);

	if (!storyId || !story) {
		return null;
	}

	return (
		<Animated.View
			entering={FadeInDown.delay(50).duration(50).springify()}
			exiting={FadeOutDown.delay(50).duration(50).springify()}
		>
			<Pressable
				disabled={onCardPress === undefined}
				onPress={handlePress}
				style={{
					shadowColor: "#000000",
					shadowOffset: {
						width: 0.5,
						height: 1.5,
					},
					shadowOpacity: 0.25,
					shadowRadius: 6,
				}}
				className={cn(
					"items-center flex  p-3 rounded-xl bg-secondary  flex-row  gap-4 border-2 border-border absolute bottom-2 inset-x-0 mx-2",
				)}
			>
				<StoryImagePreview imageUrl={story.imageUrl} size="sm" />
				<View className="flex flex-col">
					<Text className="text-border text-base font-bold" numberOfLines={1} ellipsizeMode="tail">
						{story.title}
					</Text>
				</View>
				<View className="flex items-center justify-center flex-row gap-2 ml-auto">
					<Pressable
						className="size-8 rounded-full flex items-center justify-center p-2 active:bg-black/10"
						onPress={() => {
							if (isPlaying) {
								pause();
							} else {
								play();
							}
						}}
					>
						{isPlaying ? (
							<Pause className="text-border fill-border" size={16} />
						) : (
							<Play className="text-border fill-border" size={16} />
						)}
					</Pressable>

					<Pressable
						className="size-8 rounded-full flex items-center justify-center p-2 active:bg-black/10"
						onPress={() => {
							stop();
						}}
					>
						<Stop className="text-border fill-border" size={16} />
					</Pressable>
				</View>
			</Pressable>
		</Animated.View>
	);
};
