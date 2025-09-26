import { useCallback } from "react";

export const useShareStory = () => {
	const shareStory = useCallback(() => {
		console.log("shareStory");
	}, []);

	return {
		shareStory,
	};
};
