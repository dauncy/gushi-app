import { useActiveQueueItem, useAudio, useAudioPlayState } from "@/context/AudioContext";
import { Id } from "@/convex/_generated/dataModel";
import { sanitizeStorageUrl } from "@/lib/utils";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { State } from "react-native-track-player";

export const usePlayInFullscreen = () => {
	const { play, setQueue } = useAudio();
	const { currentPlayState } = useAudioPlayState();
	const isPlaying = currentPlayState === State.Playing;
	const isBuffering = currentPlayState === State.Ended;
	const activeQueueItem = useActiveQueueItem();
	const storyId = activeQueueItem?.id ?? null;
	const router = useRouter();

	const playInFullscreen = useCallback(
		async ({
			playAtIndex,
			playlistStoryId,
			storyData,
		}: {
			playAtIndex?: (playlistStoryId: Id<"playlistStories">) => Promise<void>;
			playlistStoryId?: Id<"playlistStories">;
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
			if (playlistStoryId && playAtIndex) {
				await playAtIndex(playlistStoryId);
				router.push(`/stories/${_id}`);
				return;
			}
			setQueue(
				[
					{
						id: _id,
						title,
						imageUrl: sanitizeStorageUrl(imageUrl ?? ""),
						url: sanitizeStorageUrl(audioUrl),
					},
				],
				0,
				true,
			).then(async () => {
				router.push(`/stories/${_id}`);
			});
		},
		[storyId, setQueue, isPlaying, isBuffering, router, play],
	);

	return {
		playInFullscreen,
	};
};
