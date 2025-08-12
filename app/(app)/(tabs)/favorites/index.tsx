import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { StoryCard, StoryCardLoading } from "@/components/stories/story-card";
import { Sparkles } from "@/components/ui/icons/sparkles-icon";
import { useAudio } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { useDbUser } from "@/hooks/use-dbUser";
import { sanitizeStorageUrl } from "@/lib/utils";
import { FlashList } from "@shopify/flash-list";
import { Redirect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

export default function FavoritesListPage() {
	const router = useRouter();
	return (
		<View style={{ flex: 1 }} className="relative px-2">
			<FavoritesList />
			<AudioPreviewPlayer
				className="bottom-2"
				onCardPress={(id) => {
					router.push(`/stories/${id}`);
				}}
			/>
		</View>
	);
}

const FavoritesList = () => {
	const router = useRouter();
	const { dbUser, isLoading: isDbUserLoading } = useDbUser();
	const { play, setStory, storyId, isPlaying } = useAudio();
	const { isLoading, refreshing, refresh, loadMore, results, status } = useConvexPaginatedQuery(
		api.favorites.queries.getUserFavorites,
		{},
		{
			initialNumItems: 10,
		},
	);

	const onEndReached = useCallback(() => {
		if (status === "CanLoadMore") {
			loadMore(10);
		}
	}, [loadMore, status]);

	if (!isDbUserLoading && !dbUser?.subscriptionType) {
		return <Redirect href={"/"} />;
	}

	return (
		<View className="flex-1" style={{ marginTop: 44 }}>
			<FlashList
				refreshControl={<RefreshControl tintColor="#8b5cf6" refreshing={refreshing} onRefresh={refresh} />}
				onEndReached={onEndReached}
				extraData={{ isLoading, refreshing, status, storyId, isPlaying }}
				data={results}
				keyExtractor={(item) => item._id}
				renderItem={({ item }) => (
					<StoryCard
						story={item}
						onCardPress={() => {
							if (item.audioUrl) {
								if (storyId !== item._id) {
									setStory({
										storyUrl: sanitizeStorageUrl(item.audioUrl),
										storyId: item._id,
										storyImage: sanitizeStorageUrl(item.imageUrl ?? ""),
										storyTitle: item.title,
										autoPlay: true,
									});
									router.push(`/stories/${item._id}`);
								} else {
									if (!isPlaying) {
										play();
									}
									router.push(`/stories/${item._id}`);
								}
							}
						}}
					/>
				)}
				ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
				contentContainerStyle={{
					paddingBottom: 80,
					paddingTop: 12,
					...(results.length === 0 ? { flex: 1 } : {}),
				}}
				ListEmptyComponent={
					<>
						{isLoading ? (
							<View className="flex flex-col gap-y-3">
								{Array.from({ length: 10 }).map((_, index) => (
									<StoryCardLoading key={`loading-${index}`} />
								))}
							</View>
						) : (
							<View className="flex flex-col gap-y-3 items-center justify-center flex-1 mt-auto">
								<View className="flex flex-row gap-x-2 items-center">
									<Sparkles className="w-size-6 text-slate-400" />
									<Text className="text-slate-400 text-lg font-medium">No favorites yet</Text>
								</View>
								<View className="flex flex-row gap-x-2 items-center px-4 mx-auto max-w-[240px]">
									<Text className="text-slate-400 text-sm text-center">
										Add some stories to your favorites to get started
									</Text>
								</View>
							</View>
						)}
					</>
				}
				ListFooterComponent={
					<>
						{status === "LoadingMore" ? (
							<View className="flex flex-row items-center justify-center">
								<ActivityIndicator size="small" color="#8b5cf6" />
							</View>
						) : null}
					</>
				}
			/>
		</View>
	);
};
