import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useCallback, useMemo, useState } from "react";
import { useConvexQuery } from "./use-convexQuery";

export const useFavorite = ({ storyId }: { storyId: Id<"stories"> }) => {
	const [isLoading, setIsLoading] = useState(false);
	const toggleFavorite = useConvexMutation(api.favorites.mutations.toggleFavorite);
	const {
		isLoading: isFavoriteLoading,
		data: favorite,
		refetch: refetchFavorite,
	} = useConvexQuery(api.favorites.queries.getFavoriteStatusByStoryId, { storyId });

	const handleToggleFavorite = useCallback(
		async (favorite: boolean) => {
			setIsLoading(true);
			await toggleFavorite({ storyId, favorite });
			await refetchFavorite();
			setIsLoading(false);
		},
		[storyId, toggleFavorite, refetchFavorite],
	);

	return useMemo(() => {
		return {
			mutating: isLoading,
			favorite,
			isLoading: isFavoriteLoading,
			handleToggleFavorite,
		};
	}, [isLoading, handleToggleFavorite, favorite, isFavoriteLoading]);
};
