import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { CategoriesSelector } from "@/components/stories/cateogories-selector";
import { EnhancedStoryCard } from "@/components/stories/enhanced-story-card";
import { StoryCardLoading } from "@/components/stories/story-card";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { StoryPreview } from "@/convex/stories";
import { useCategorySelect } from "@/hooks/use-category-select";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { sanitizeStorageUrl } from "@/lib/utils";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

export default function Home() {
	const { hasSubscription } = useSubscription();
	if (hasSubscription) {
		return <CustomerHomePage />;
	}
	return <AnonymousHomePage />;
}

const StoryListComp = ({ onCardPress }: { onCardPress: (story: StoryPreview) => void }) => {
	const { hasSubscription } = useSubscription();
	const { category } = useCategorySelect();
	const { isLoading, refreshing, refresh, loadMore, results, status } = useConvexPaginatedQuery(
		api.stories.queries.getStories,
		{ categoryId: category ?? undefined },
		{
			initialNumItems: 10,
		},
	);

	const {
		data: featuredStory,
		isLoading: isFeaturedStoryLoading,
		refetch: refetchFeaturedStory,
	} = useConvexQuery(api.stories.queries.getFeaturedStory, {}, {});

	const onEndReached = useCallback(() => {
		if (status === "CanLoadMore") {
			loadMore(10);
		}
	}, [loadMore, status]);

	const listItems = useMemo(() => {
		if (hasSubscription) {
			return results;
		}
		return results.filter((story) => story.subscription_required === true);
	}, [hasSubscription, results]);

	const freeStories = useMemo(() => {
		return results.filter((story) => story.subscription_required === false);
	}, [results]);

	const handleListRefetch = useCallback(async () => {
		await Promise.all([refetchFeaturedStory(), refresh()]);
	}, [refetchFeaturedStory, refresh]);

	const listData = useMemo(() => {
		const data: StoryPreview[] = [];
		if (hasSubscription) {
			if (featuredStory && !isFeaturedStoryLoading && !isLoading && !refreshing) {
				data.push(featuredStory);
			}
			data.push(...listItems);
		} else {
			data.push(...freeStories);
			if (featuredStory && !isFeaturedStoryLoading && !isLoading && !refreshing) {
				data.push(featuredStory);
			}
			data.push(...listItems);
		}
		return data;
	}, [hasSubscription, featuredStory, isFeaturedStoryLoading, isLoading, refreshing, listItems, freeStories]);

	return (
		<View className="flex-1 bg-black/10 px-2">
			<FlashList
				showsVerticalScrollIndicator={false}
				numColumns={2}
				refreshControl={<RefreshControl tintColor="#ff78e5" refreshing={refreshing} onRefresh={handleListRefetch} />}
				onEndReached={onEndReached}
				extraData={{ isLoading, refreshing, status, hasSubscription, listItems, freeStories, isFeaturedStoryLoading }}
				data={listData}
				keyExtractor={(item) => item._id}
				renderItem={({ item, index: idx }) => (
					<EnhancedStoryCard
						story={item}
						onCardPress={() => onCardPress(item)}
						margin={idx % 2 === 0 ? "right" : "left"}
					/>
				)}
				contentContainerStyle={{
					paddingBottom: 80,
					paddingTop: 8,
					flex: isLoading ? 1 : undefined,
				}}
				ListEmptyComponent={
					<>
						{isLoading ? (
							<View style={{ flexWrap: "wrap", display: "flex", flexDirection: "row" }}>
								{Array.from({ length: 10 }).map((_, idx) => (
									<StoryCardLoading key={`loading-${idx}`} />
								))}
							</View>
						) : (
							<View className="flex flex-col gap-y-3 mt-24">
								<Text className="text-slate-200 text-center">No stories found</Text>
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

const StoryList = memo(StoryListComp);
StoryList.displayName = "StoryList";

const AnonymousHomePage = () => {
	const { setStory } = useAudio();
	return (
		<View style={{ flex: 1 }} className="relative bg-[#fffbf3] flex flex-col">
			<View className="w-full px-2" style={{ marginTop: 46, paddingTop: 12, paddingBottom: 12 }}>
				<CategoriesSelector />
			</View>
			<StoryList
				onCardPress={(story) => {
					if (story.audioUrl) {
						setStory({
							storyUrl: sanitizeStorageUrl(story.audioUrl),
							storyId: story._id,
							storyImage: sanitizeStorageUrl(story.imageUrl ?? ""),
							storyTitle: story.title,
							autoPlay: true,
						});
					}
				}}
			/>
			<AudioPreviewPlayer />
		</View>
	);
};

const CustomerHomePage = () => {
	const { play, setStory, isPlaying, storyId } = useAudio();
	const router = useRouter();

	return (
		<View style={{ flex: 1 }} className="relative px-2">
			<StoryList
				onCardPress={(story) => {
					if (story.audioUrl) {
						if (storyId !== story._id) {
							setStory({
								storyUrl: sanitizeStorageUrl(story.audioUrl),
								storyId: story._id,
								storyImage: sanitizeStorageUrl(story.imageUrl ?? ""),
								storyTitle: story.title,
								autoPlay: true,
							});
							router.push(`/stories/${story._id}`);
						} else {
							if (!isPlaying) {
								play();
							}
							router.push(`/stories/${story._id}`);
						}
					}
				}}
			/>
			<AudioPreviewPlayer
				className="bottom-2"
				onCardPress={(id) => {
					router.push(`/stories/${id}`);
				}}
			/>
		</View>
	);
};
