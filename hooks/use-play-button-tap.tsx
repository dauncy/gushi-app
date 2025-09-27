import { useAudio } from "@/context/AudioContext";
import { Id } from "@/convex/_generated/dataModel";
import { sanitizeStorageUrl } from "@/lib/utils";
import { useCallback, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

export const usePlayButtonTap = ({
	storyId,
	audioUrl,
	imageUrl,
	title,
}: {
	storyId: Id<"stories">;
	audioUrl: string | null;
	imageUrl: string | null;
	title: string;
}) => {
	const { setStory, play, stop, isPlaying, storyId: currentPlayingStoryId } = useAudio();
	const isActive = currentPlayingStoryId === storyId;
	const storyIsPlaying = isActive && isPlaying;
	const handleStop = useCallback(() => {
		stop();
	}, [stop]);

	const handleResume = useCallback(() => {
		play();
	}, [play]);

	const handleStartAndPlay = useCallback(() => {
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
	}, [setStory, audioUrl, storyId, imageUrl, title]);

	const playButtonTapGesture = useMemo(() => {
		return Gesture.Tap()
			.onStart(() => {
				"worklet";
				if (storyIsPlaying) {
					console.log("usePlayButtonTap: --- handleStop --- ");
					runOnJS(handleStop)();
				} else if (isActive) {
					console.log("usePlayButtonTap: --- handleResume --- ");
					runOnJS(handleResume)();
				} else {
					console.log("usePlayButtonTap: --- handleStartAndPlay --- ");
					runOnJS(handleStartAndPlay)();
				}
			})
			.shouldCancelWhenOutside(false)
			.runOnJS(true);
	}, [storyIsPlaying, isActive, handleStop, handleResume, handleStartAndPlay]);

	return {
		playButtonTapGesture,
	};
};
