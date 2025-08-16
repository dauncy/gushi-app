import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { FeaturedStoryCard } from "@/components/stories/featured-card";
import { StoryCard, StoryCardLoading } from "@/components/stories/story-card";
import { ChevronUp } from "@/components/ui/icons/chevron-up-icon";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { StoryPreview } from "@/convex/stories";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { sanitizeStorageUrl } from "@/lib/utils";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from "react-native";

export default function Home() {
	const { hasSubscription } = useSubscription();
	if (hasSubscription) {
		return <CustomerHomePage />;
	}
	return <AnonymousHomePage />;
}

const StoryListComp = ({ onCardPress }: { onCardPress: (story: StoryPreview) => void }) => {
	const { hasSubscription } = useSubscription();
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

	const listItems = useMemo(() => {
		if (hasSubscription) {
			return results;
		}
		return results.filter((story) => story.subscription_required === true);
	}, [hasSubscription, results]);

	const freeStories = useMemo(() => {
		return results.filter((story) => story.subscription_required === false);
	}, [results]);

	return (
		<View className="flex-1" style={{ marginTop: 44 }}>
			<FlashList
				refreshControl={<RefreshControl tintColor="#8b5cf6" refreshing={refreshing} onRefresh={refresh} />}
				onEndReached={onEndReached}
				extraData={{ isLoading, refreshing, status, hasSubscription, listItems, freeStories }}
				data={listItems}
				keyExtractor={(item) => item._id}
				renderItem={({ item }) => <StoryCard story={item} onCardPress={() => onCardPress(item)} />}
				ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
				contentContainerStyle={{
					paddingBottom: 80,
					paddingTop: 12,
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
							<View className="flex flex-col gap-y-3 mt-24">
								<Text className="text-slate-200 text-center">No stories found</Text>
							</View>
						)}
					</>
				}
				ListHeaderComponent={<ListHeader onCardPress={onCardPress} freeStories={freeStories} />}
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

const ListHeaderComp = ({
	onCardPress,
	freeStories,
}: {
	onCardPress: (story: StoryPreview) => void;
	freeStories: StoryPreview[];
}) => {
	const { hasSubscription } = useSubscription();
	if (hasSubscription) {
		return <FeaturedStoryCard onCardPress={(story) => onCardPress(story)} />;
	}
	return (
		<View className="flex flex-col gap-y-4">
			{freeStories.map((story) => (
				<StoryCard key={story._id} story={story} onCardPress={() => onCardPress(story)} />
			))}
			<FeaturedStoryCard onCardPress={(story) => onCardPress(story)} />
		</View>
	);
};

const ListHeader = memo(ListHeaderComp);
ListHeader.displayName = "ListHeader";

const UpgradeSection = () => {
	const router = useRouter();
	const clickable = useRef(true);

	const handlePress = useCallback(() => {
		if (clickable.current) {
			clickable.current = false;
			router.push("/upgrade");
		}
		setTimeout(() => {
			clickable.current = true;
		}, 350);
	}, [router]);

	return (
		<Pressable
			onPress={handlePress}
			className="flex absolute bottom-0 right-0 left-0 border-t border-slate-800 bg-slate-900 p-4 h-20 flex-row items-start justify-between"
		>
			<View className="flex flex-col gap-y-2 flex-1">
				<Text className="text-slate-200 font-semibold">Want to listen to more stories?</Text>
			</View>
			<ChevronUp className="text-slate-200" size={24} />
		</Pressable>
	);
};

const AnonymousHomePage = () => {
	const { setStory } = useAudio();
	return (
		<View style={{ flex: 1 }} className="relative bg-neutral-950 px-2">
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
			<UpgradeSection />
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
