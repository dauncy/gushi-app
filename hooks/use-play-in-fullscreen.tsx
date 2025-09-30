import { audioStore, setAudioStoryData, setAudioUrl, useAudio, useAudioPlayState } from "@/context/AudioContext";
import { Id } from "@/convex/_generated/dataModel";
import { sanitizeStorageUrl } from "@/lib/utils";
import { useStore } from "@tanstack/react-store";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { State } from "react-native-track-player";

export const usePlayInFullscreen = () => {
	const { play, loadAudio } = useAudio();
	const { currentPlayState } = useAudioPlayState();
	const isPlaying = currentPlayState === State.Playing;
	const isBuffering = currentPlayState === State.Ended;
	const storyId = useStore(audioStore, (state) => state.story.id);
	const router = useRouter();

	const playInFullscreen = useCallback(
		({
			storyData,
		}: {
			storyData: {
				_id: Id<"stories">;
				title: string;
				imageUrl: string | null;
				audioUrl: string | null;
			};
		}) => {
			const { _id, title, imageUrl, audioUrl } = storyData;
			if (!audioUrl) {
				return;
			}

			if (storyId === _id) {
				if (!isPlaying && !isBuffering) {
					play();
				}
				router.push(`/stories/${_id}`);
				return;
			}

			setAudioStoryData({
				id: _id,
				title,
				imageUrl: sanitizeStorageUrl(imageUrl ?? ""),
			});
			setAudioUrl({
				url: sanitizeStorageUrl(audioUrl),
			});
			loadAudio(true).then(async () => {
				router.push(`/stories/${_id}`);
			});
		},
		[isPlaying, isBuffering, loadAudio, play, router, storyId],
	);

	return {
		playInFullscreen,
	};
};
