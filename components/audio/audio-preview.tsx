import { Pause } from "@/components/ui/icons/pause-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Stop } from "@/components/ui/icons/stop-icon";
import { useAudio } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { StoryImagePreview } from "../stories/story-image";

export const AudioPreviewPlayer = () => {
	const { isPlaying, play, pause, stop, storyId } = useAudio();

	const { data: story } = useConvexQuery(
		api.stories.getStory,
		{
			storyId: storyId as Id<"stories">,
		},
		{ enabled: !!storyId },
	);

	if (!storyId || !story) {
		return null;
	}

	return (
		<Animated.View
			entering={FadeInDown.delay(50).duration(50).springify()}
			exiting={FadeOutDown.delay(50).duration(150).springify()}
			style={{
				shadowColor: "#f8fafc",
				shadowOffset: {
					width: 0.5,
					height: 1.5,
				},
				shadowOpacity: 0.25,
				shadowRadius: 4,
			}}
			className="items-center flex  p-3 rounded-xl bg-slate-900  flex-row  gap-4 border border-slate-800 absolute bottom-24 inset-x-0 mx-2"
		>
			<StoryImagePreview imageUrl={story.imageUrl} size="sm" />
			<View className="flex flex-col">
				<Text className="text-slate-300 text-base font-semibold" numberOfLines={1} ellipsizeMode="tail">
					{story.title}
				</Text>
			</View>
			<View className="flex items-center justify-center flex-row gap-2 ml-auto">
				<Pressable
					className="size-8 rounded-full flex items-center justify-center p-2 active:bg-slate-800"
					onPress={() => {
						if (isPlaying) {
							pause();
						} else {
							play();
						}
					}}
				>
					{isPlaying ? (
						<Pause className="text-slate-200 fill-slate-200" size={16} />
					) : (
						<Play className="text-slate-200 fill-slate-200" size={16} />
					)}
				</Pressable>

				<Pressable
					className="size-8 rounded-full flex items-center justify-center p-2 active:bg-slate-800"
					onPress={() => {
						stop();
					}}
				>
					<Stop className="text-slate-200 fill-slate-200" size={16} />
				</Pressable>
			</View>
		</Animated.View>
	);
};
