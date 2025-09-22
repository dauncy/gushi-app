import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { StoryCard, StoryCardLoading } from "@/components/stories/story-card";
import { BedSingle } from "@/components/ui/icons/bed-single";
import { ChevronUp } from "@/components/ui/icons/chevron-up-icon";
import { GraduationCap } from "@/components/ui/icons/graduation-cap-icon";
import { Grid2X2Plus } from "@/components/ui/icons/grid-2-plus-icon";
import { Rocket } from "@/components/ui/icons/rocket-icon";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { StoryPreview } from "@/convex/stories";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { sanitizeStorageUrl } from "@/lib/utils";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { memo, useCallback, useMemo, useRef } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

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
		<View className="flex-1">
			<FlashList
				numColumns={2}
				refreshControl={<RefreshControl tintColor="#8b5cf6" refreshing={refreshing} onRefresh={refresh} />}
				onEndReached={onEndReached}
				extraData={{ isLoading, refreshing, status, hasSubscription, listItems, freeStories }}
				data={[...freeStories, ...listItems]}
				keyExtractor={(item) => item._id}
				renderItem={({ item, index: idx }) => (
					<StoryCard story={item} onCardPress={() => onCardPress(item)} margin={idx % 2 === 0 ? "right" : "left"} />
				)}
				contentContainerStyle={{
					paddingBottom: 80,
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
		<View style={{ flex: 1 }} className="relative bg-neutral-950 px-2 flex flex-col">
			<View className="w-full" style={{ marginTop: 46, paddingTop: 12, paddingBottom: 12 }}>
				<ScrollView
					contentContainerStyle={{ gap: 12 }}
					horizontal
					showsHorizontalScrollIndicator={false}
					alwaysBounceHorizontal={false}
					className="w-full p-1 bg-slate-900 rounded-3xl border border-2 border-slate-800 flex flex-row "
				>
					<View className="flex flex-col gap-y-1 items-center py-2 px-4 rounded-3xl bg-teal-600 w-[96px]">
						<BedSingle className="text-slate-200" size={24} />
						<Text className="text-slate-200 text-xs font-semibold mt-auto">Bedtime</Text>
					</View>
					<View className="flex flex-col gap-y-1 items-center py-2 px-4 p-2 rounded-2xl w-[96px]">
						<GraduationCap className="text-slate-600" size={24} />
						<Text className="text-slate-600 text-xs font-medium mt-auto">Lesson</Text>
					</View>
					<View className="flex flex-col gap-y-1 items-center py-2 px-4 p-2 rounded-2xl w-[96px]">
						<Rocket className="text-slate-600" size={24} />
						<Text className="text-slate-600 text-xs font-medium mt-auto">Adventure</Text>
					</View>
					<View className="flex flex-col gap-y-1 items-center py-2  rounded-2xl w-[112px] relative">
						<Grid2X2Plus className="text-slate-600" size={24} />
						<Text className="text-slate-600 text-xs font-medium mt-auto">Create your own</Text>
						<View className="absolute inset-0 bg-black/40 opacity-50 z-10 rounded-2xl"></View>
						<View
							className="p-1 px-2 rounded-2xl bg-amber-400 absolute top-0 right-4 z-20"
							style={{
								shadowColor: "#ffffff",
								shadowOffset: {
									width: 0.5,
									height: 1.5,
								},
								shadowOpacity: 0.25,
								shadowRadius: 8,
							}}
						>
							<Text className="text-white text-xs font-bold mt-auto">Soon</Text>
						</View>
					</View>
				</ScrollView>
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
