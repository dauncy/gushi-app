import {
	audioStore,
	setAudioStoryData,
	setAudioUrl,
	useAudio,
	useIsBuffering,
	useIsPlaying,
} from "@/context/AudioContext";
import { Id } from "@/convex/_generated/dataModel";
import { sanitizeStorageUrl } from "@/lib/utils";
import { useStore } from "@tanstack/react-store";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export const usePlayInFullscreen = () => {
	const { play, loadAudio } = useAudio();
	const isPlaying = useIsPlaying();
	const isBuffering = useIsBuffering();
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
