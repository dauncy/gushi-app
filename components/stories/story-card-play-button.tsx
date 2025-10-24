import { useAudio, useAudioPlayState, useIsStoryActive } from "@/context/AudioContext";
import { StoryPreview } from "@/convex/stories/schema";
import { sanitizeStorageUrl } from "@/lib/utils";
import { memo, useCallback, useMemo } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { State } from "react-native-track-player";
import { Play } from "../ui/icons/play-icon";
import { Stop } from "../ui/icons/stop-icon";

export const StoryCardPlayButton = memo(({ story }: { story: StoryPreview }) => {
	const { play, stop, setQueue } = useAudio();
	const { currentPlayState } = useAudioPlayState();
	const isBuffering = currentPlayState === State.Ended;
	const isPlaying = currentPlayState === State.Playing;
	const storyActive = useIsStoryActive({ storyId: story._id });
	const storyIsPlaying = isPlaying && storyActive;
	const { _id: storyId, audioUrl, title, imageUrl } = story;

	const handleStop = useCallback(() => {
		stop();
	}, [stop]);

	const handleResume = useCallback(() => {
		play();
	}, [play]);

	const handleStartAndPlay = useCallback(async () => {
		if (!audioUrl) {
			return;
		}
		await setQueue(
			[
				{
					id: storyId,
					title,
					imageUrl: sanitizeStorageUrl(imageUrl ?? ""),
					url: sanitizeStorageUrl(audioUrl),
				},
			],
			0,
			true,
		);
	}, [audioUrl, setQueue, storyId, title, imageUrl]);

	const playButtonTapGesture = useMemo(() => {
		return Gesture.Tap()
			.onStart(() => {
				"worklet";
				if (storyIsPlaying) {
					runOnJS(handleStop)();
				} else if (storyActive && !isBuffering) {
					runOnJS(handleResume)();
				} else {
					runOnJS(handleStartAndPlay)();
				}
			})
			.shouldCancelWhenOutside(false)
			.runOnJS(true);
	}, [storyIsPlaying, storyActive, isBuffering, handleStop, handleResume, handleStartAndPlay]);

	return (
		<GestureDetector gesture={playButtonTapGesture}>
			{storyIsPlaying ? (
				<Pressable className="bg-transparent border-transparent active:bg-[#0D3311]/20 rounded-full z-20 size-10 flex items-center justify-center">
					<Stop className="text-[#ff78e5] fill-[#ff78e5]" size={20} />
				</Pressable>
			) : storyActive ? (
				<Pressable className="bg-transparent border-transparent active:bg-[#0D3311]/20 rounded-full size-10 flex items-center justify-center">
					{isBuffering && storyActive ? (
						<ActivityIndicator size={20} color="#ff78e5" />
					) : (
						<Play className="text-[#ff78e5] fill-[#ff78e5]" size={20} />
					)}
				</Pressable>
			) : (
				<Pressable className="bg-[#ff78e5] active:bg-[#ff78e5]/80 border-white border rounded-full p-1 size-10 flex items-center justify-center">
					{isBuffering && storyActive ? (
						<ActivityIndicator size={20} color="#ffffff" />
					) : (
						<Play className="text-white fill-white" size={20} />
					)}
				</Pressable>
			)}
		</GestureDetector>
	);
});

StoryCardPlayButton.displayName = "StoryCardPlayButton";
