import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { CategoriesSelector } from "@/components/stories/cateogories-selector";
import { EnhancedStoryCard } from "@/components/stories/enhanced-story-card";
import { StoryCardLoading } from "@/components/stories/story-card";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { StoryPreview } from "@/convex/stories";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { useIsIpad } from "@/hooks/use-is-ipad";
import { usePlayInFullscreen } from "@/hooks/use-play-in-fullscreen";
import { usePresentPaywall } from "@/hooks/use-present-paywall";
import { useSelectedCategory } from "@/stores/category-store";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

export default function Home() {
	return <HomePage />;
}

const StoryListComp = ({ onCardPress }: { onCardPress: (story: StoryPreview) => void }) => {
	const scrollEnd = useRef(false);
	const initRef = useRef(false);
	const storyListRef = useRef<FlashListRef<StoryPreview>>(null);
	const { hasSubscription } = useSubscription();
	const categoryId = useSelectedCategory();
	const { isLoading, refreshing, refresh, loadMore, results, status } = useConvexPaginatedQuery(
		api.stories.queries.getStories,
		{ categoryId: categoryId ?? undefined },
		{
			initialNumItems: 10,
		},
	);

	const {
		data: featuredStory,
		isLoading: isFeaturedStoryLoading,
		refetch: refetchFeaturedStory,
	} = useConvexQuery(
		api.stories.queries.getFeaturedStory,
		{},
		{
			enabled: !categoryId,
		},
	);

	const onEndReached = useCallback(() => {
		if (status === "CanLoadMore") {
			scrollEnd.current = true;
			loadMore(10);
			setTimeout(() => {
				scrollEnd.current = false;
			}, 750);
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
			if (featuredStory && !isFeaturedStoryLoading && !isLoading && !refreshing && !categoryId) {
				data.push(featuredStory);
			}
			data.push(...listItems);
		} else {
			data.push(...freeStories);
			if (featuredStory && !isFeaturedStoryLoading && !isLoading && !refreshing && !categoryId) {
				data.push(featuredStory);
			}
			data.push(...listItems);
		}
		return data;
	}, [
		hasSubscription,
		featuredStory,
		isFeaturedStoryLoading,
		isLoading,
		refreshing,
		listItems,
		freeStories,
		categoryId,
	]);

	useEffect(() => {
		if (!initRef.current) {
			initRef.current = true;
			return;
		}
		if (scrollEnd.current) return;
		if (isLoading) {
			storyListRef.current?.scrollToTop({ animated: false });
		}
		if (isLoading || refreshing) return;
		storyListRef.current?.scrollToIndex({ index: 0, animated: false, viewOffset: -8 });
	}, [categoryId, isLoading, refreshing]);

	useFocusEffect(
		useCallback(() => {
			storyListRef.current?.scrollToIndex({ index: 0, animated: false, viewOffset: -8 });
		}, []),
	);

	const isIpad = useIsIpad();
	const calcMargin = useCallback(
		(idx: number) => {
			if (!isIpad) {
				return idx % 2 === 0 ? "right" : "left";
			}
			return "right";
		},
		[isIpad],
	);
	return (
		<View className="flex-1 bg-foreground/10 px-2">
			<FlashList
				ref={storyListRef}
				showsVerticalScrollIndicator={false}
				numColumns={isIpad ? 4 : 2}
				refreshControl={<RefreshControl tintColor="#ff78e5" refreshing={refreshing} onRefresh={handleListRefetch} />}
				onEndReached={onEndReached}
				extraData={{
					isLoading,
					refreshing,
					status,
					hasSubscription,
					listItems,
					freeStories,
					isFeaturedStoryLoading,
					categoryId,
				}}
				data={listData}
				keyExtractor={(item) => item._id}
				renderItem={({ item, index: idx }) => (
					<EnhancedStoryCard story={item} onCardPress={() => onCardPress(item)} margin={calcMargin(idx)} />
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
					status === "LoadingMore" ? (
						<View className="flex flex-row items-center justify-center px-4 py-1.5">
							<ActivityIndicator size="small" color="#ff78e5" />
						</View>
					) : null
				}
			/>
		</View>
	);
};

const StoryList = memo(StoryListComp);
StoryList.displayName = "StoryList";

const HomePage = () => {
	const { playInFullscreen } = usePlayInFullscreen();
	const { hasSubscription } = useSubscription();
	const unlocked = ({
		subscription_required,
		audioUrl,
	}: {
		subscription_required: boolean;
		audioUrl: string | null;
	}) => {
		if (hasSubscription) {
			return !!audioUrl;
		}
		return !subscription_required && !!audioUrl;
	};
	const { presentPaywall } = usePresentPaywall();
	const router = useRouter();
	return (
		<View style={{ flex: 1 }} className="relative bg-[#fffbf3] flex flex-col">
			<View className="w-full px-2" style={{ paddingTop: 12, paddingBottom: 12 }}>
				<CategoriesSelector />
			</View>
			<StoryList
				onCardPress={(story) => {
					if (unlocked(story)) {
						playInFullscreen({
							storyData: { _id: story._id, title: story.title, imageUrl: story.imageUrl, audioUrl: story.audioUrl },
						});
					} else {
						presentPaywall();
					}
				}}
			/>
			<AudioPreviewPlayer
				onCardPress={(id) => {
					router.push(`/stories/${id}`);
				}}
			/>
		</View>
	);
};
