import { Id } from "@/convex/_generated/dataModel";
import { useCallback } from "react";
import { Share as RNShare } from "react-native";

export const useShareStory = () => {
	const shareStory = useCallback(async ({ storyId, storyTitle }: { storyId: Id<"stories">; storyTitle: string }) => {
		try {
			await RNShare.share(
				{
					message: `Check out this story on Gushi: ${storyTitle}`,
					url: `${process.env.EXPO_PUBLIC_WEB_URL}/stories/${storyId}`,
					title: `Share ${storyTitle}`,
				},
				{ dialogTitle: `Share ${storyTitle}` },
			);
		} catch (e) {
			console.warn("[@/hooks/use-share-story.tsx] Error sharing story", e);
		}
	}, []);

	return {
		shareStory,
	};
};
