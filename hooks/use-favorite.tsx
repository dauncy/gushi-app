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
		isFetching: isFavoriteFetching,
		isRefetching: isFavoriteRefetching,
	} = useConvexQuery(
		api.favorites.queries.getFavoriteStatusByStoryId,
		{ storyId },
		{
			refetchOnMount: true,
			staleTime: 0,
			refetchOnWindowFocus: true,
			refetchOnReconnect: true,
		},
	);

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
			isFavoriteFetching,
			isFavoriteRefetching,
		};
	}, [isLoading, handleToggleFavorite, favorite, isFavoriteLoading, isFavoriteFetching, isFavoriteRefetching]);
};
