import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { Header } from "@/components/nav/Header";
import { StoryCard, StoryCardLoading } from "@/components/stories/story-card";
import { ChevronUp } from "@/components/ui/icons/chevron-up-icon";
import { useAudio } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { presentPaywall } from "@/lib/revenue-cat";
import { FlashList } from "@shopify/flash-list";
import { Redirect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
	const { hasSubscription } = useSubscription();
	if (hasSubscription) {
		return <Redirect href="/(app)/(protected)/stories" withAnchor />;
	}

	return (
		<SafeAreaView className="bg-slate-900 flex-1" edges={["top", "bottom"]} mode="padding">
			<StatusBar barStyle={"light-content"} />
			<View style={{ flex: 1 }} className="relative bg-neutral-950 px-2">
				<Header />
				<StoryList />
				<UpgradeSection />
				<AudioPreviewPlayer />
			</View>
		</SafeAreaView>
	);
}

const StoryList = () => {
	const { play, setStory } = useAudio();
	const { isLoading, refreshing, refresh, loadMore, results, status } = useConvexPaginatedQuery(
		api.stories.getStories,
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
				extraData={{ isLoading, refreshing, status }}
				data={results}
				keyExtractor={(item) => item._id}
				renderItem={({ item }) => (
					<StoryCard
						story={item}
						onCardPress={() => {
							if (item.audioUrl) {
								setStory({ storyUrl: item.audioUrl, storyId: item._id });
								play();
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

const UpgradeSection = () => {
	return (
		<Pressable
			onPress={presentPaywall}
			className="flex absolute bottom-0 right-0 left-0 border-t border-slate-800 bg-slate-900 p-4 h-20 flex-row items-start justify-between"
		>
			<View className="flex flex-col gap-y-2 flex-1">
				<Text className="text-slate-200 font-semibold">Want to listen to more stories?</Text>
			</View>
			<ChevronUp className="text-slate-200" size={24} />
		</Pressable>
	);
};
