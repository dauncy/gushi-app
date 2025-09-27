import { useAudio } from "@/context/AudioContext";
import { StoryPreview } from "@/convex/stories/schema";
import { usePlayButtonTap } from "@/hooks/use-play-button-tap";
import { memo } from "react";
import { Pressable } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { Play } from "../ui/icons/play-icon";
import { Stop } from "../ui/icons/stop-icon";

export const StoryCardPlayButton = memo(({ story }: { story: StoryPreview }) => {
	const { storyId: currentPlayingStoryId, isPlaying } = useAudio();

	const { _id: storyId, audioUrl, title, imageUrl } = story;

	const isActive = currentPlayingStoryId === storyId;
	const storyIsPlaying = isActive && isPlaying;
	const { playButtonTapGesture } = usePlayButtonTap({ storyId, audioUrl, imageUrl, title });

	return (
		<GestureDetector gesture={playButtonTapGesture}>
			{storyIsPlaying ? (
				<Pressable className="bg-transparent border-transparent active:bg-[#0D3311]/20 rounded-full z-20 size-10 flex items-center justify-center">
					<Stop className="text-[#ff78e5] fill-[#ff78e5]" size={20} />
				</Pressable>
			) : isActive ? (
				<Pressable className="bg-transparent border-transparent active:bg-[#0D3311]/20 rounded-full size-10 flex items-center justify-center">
					<Play className="text-[#ff78e5] fill-[#ff78e5]" size={20} />
				</Pressable>
			) : (
				<Pressable className="bg-[#ff78e5] active:bg-[#ff78e5]/80 border-white border rounded-full p-1 size-10 flex items-center justify-center">
					<Play className="text-white fill-white" size={20} />
				</Pressable>
			)}
		</GestureDetector>
	);
});

StoryCardPlayButton.displayName = "StoryCardPlayButton";
