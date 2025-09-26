import { useAudio } from "@/context/AudioContext";
import { Id } from "@/convex/_generated/dataModel";
import { sanitizeStorageUrl } from "@/lib/utils";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export const usePlayInFullscreen = () => {
	const { storyId, isPlaying, play, setStory } = useAudio();
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
				if (!isPlaying) {
					play();
				}
				router.push(`/stories/${_id}`);
				return;
			}

			setStory({
				storyUrl: sanitizeStorageUrl(audioUrl),
				storyId: _id,
				storyImage: sanitizeStorageUrl(imageUrl ?? ""),
				storyTitle: title,
				autoPlay: true,
			});
			router.push(`/stories/${_id}`);
		},
		[isPlaying, play, router, setStory, storyId],
	);

	return {
		playInFullscreen,
	};
};
