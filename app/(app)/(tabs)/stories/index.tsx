import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { StoryCard, StoryCardLoading } from "@/components/stories/story-card";
import { useAudio } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { sanitizeStorageUrl } from "@/lib/utils";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

export default function StoriesListPage() {
	const router = useRouter();
	return (
		<View style={{ flex: 1 }} className="relative px-2">
			<StoryList />
			<AudioPreviewPlayer
				className="bottom-2"
				onCardPress={(id) => {
					router.push(`/stories/${id}`);
				}}
			/>
		</View>
	);
}

const StoryList = () => {
	const router = useRouter();
	const { play, setStory, storyId, isPlaying } = useAudio();
	const { isLoading, refreshing, refresh, loadMore, results, status } = useConvexPaginatedQuery(
		api.stories.queries.getStories,
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
									setStory({ storyUrl: sanitizeStorageUrl(item.audioUrl), storyId: item._id });
									play();
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
				estimatedItemSize={100}
				ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
				contentContainerStyle={{
					paddingBottom: 80,
					paddingTop: 12,
				}}
				ListEmptyComponent={
					<>
						{isLoading ? (
							<View className="flex flex-col gap-y-3 mt-16">
								{Array.from({ length: 10 }).map((_, index) => (
									<StoryCardLoading key={`loading-${index}`} />
								))}
							</View>
						) : (
							<View className="flex flex-col gap-y-3 mt-16">
								<Text>No stories found</Text>
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
