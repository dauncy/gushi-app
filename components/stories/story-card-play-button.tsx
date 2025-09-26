import { useAudio } from "@/context/AudioContext";
import { StoryPreview } from "@/convex/stories/schema";
import { sanitizeStorageUrl } from "@/lib/utils";
import { memo, useCallback, useMemo } from "react";
import { GestureResponderEvent } from "react-native";
import { Button } from "../ui/button";
import { Play } from "../ui/icons/play-icon";
import { Stop } from "../ui/icons/stop-icon";

export const StoryCardPlayButton = memo(({ story }: { story: StoryPreview }) => {
	const { play, setStory, isPlaying, storyId: playingId, stop } = useAudio();
	const { _id: storyId, audioUrl, title, imageUrl } = story;

	const isCurrentStory = useMemo(() => {
		return storyId === playingId;
	}, [storyId, playingId]);

	const handleStop = useCallback(
		(e: GestureResponderEvent) => {
			e.stopPropagation();
			e.preventDefault();
			stop();
		},
		[stop],
	);

	const handleResume = useCallback(
		(e: GestureResponderEvent) => {
			e.stopPropagation();
			e.preventDefault();
			play();
		},
		[play],
	);

	const handleStartAndPlay = useCallback(
		(e: GestureResponderEvent) => {
			e.stopPropagation();
			e.preventDefault();
			if (!audioUrl) {
				return;
			}
			setStory({
				storyUrl: sanitizeStorageUrl(audioUrl),
				storyId,
				storyImage: sanitizeStorageUrl(imageUrl ?? ""),
				storyTitle: title,
				autoPlay: true,
			});
		},
		[setStory, audioUrl, storyId, imageUrl, title],
	);

	return (
		<>
			{isPlaying && isCurrentStory ? (
				<Button
					onPress={handleStop}
					size="icon"
					className="bg-transparent border-transparent active:bg-[#0D3311]/20 rounded-full z-20"
				>
					<Stop className="text-[#ff78e5] fill-[#ff78e5]" size={20} />
				</Button>
			) : isCurrentStory ? (
				<Button
					onPress={handleResume}
					size="icon"
					className="bg-transparent border-transparent active:bg-[#0D3311]/20 rounded-full"
				>
					<Play className="text-[#ff78e5] fill-[#ff78e5]" size={20} />
				</Button>
			) : (
				<Button
					size="icon"
					className="bg-[#ff78e5] active:bg-[#ff78e5]/80 border-white border rounded-full p-1"
					onPress={handleStartAndPlay}
				>
					<Play className="text-white fill-white" size={20} />
				</Button>
			)}
		</>
	);
});

StoryCardPlayButton.displayName = "StoryCardPlayButton";
