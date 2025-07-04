import { Header } from "@/components/nav/Header";
import { StoryCard, StoryCardLoading } from "@/components/stories/story-card";
import { ChevronUp } from "@/components/ui/icons/chevron-up-icon";
import { useAudio } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, RefreshControl, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
	return (
		<SafeAreaView className="bg-slate-900 flex-1" edges={["top"]} mode="padding">
			<StatusBar barStyle={"light-content"} />
			<View style={{ flex: 1 }} className="relative bg-neutral-950 px-2">
				<Header />
				<StoryList />
				<UpgradeSection />
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
	const router = useRouter();
	return (
		<Pressable
			onPress={() => router.push("/upgrade")}
			className="flex absolute bottom-0 right-0 left-0 border-t border-slate-800 bg-slate-900 p-4 h-20 flex-row items-start justify-between"
		>
			<View className="flex flex-col gap-y-2 flex-1">
				<Text className="text-slate-200 font-semibold">Want to listen to more stories?</Text>
			</View>
			<ChevronUp className="text-slate-200" size={24} />
		</Pressable>
	);
};

// const AudioPreviewPlayer = ({
// 	story,
// 	setCurrentStory,
// }: {
// 	story: StoryPreview;
// 	setCurrentStory: (story: StoryPreview | null) => void;
// }) => {
// 	const { isPlaying, play, pause, stop } = useAudio();

// 	return (
// 		<Animated.View
// 			entering={FadeInDown.delay(50).duration(50).springify()}
// 			exiting={FadeOutDown.delay(50).duration(150).springify()}
// 			style={{
// 				shadowColor: "#f8fafc",
// 				shadowOffset: {
// 					width: 0.5,
// 					height: 1.5,
// 				},
// 				shadowOpacity: 0.25,
// 				shadowRadius: 4,
// 			}}
// 			className="flex w-full p-3 rounded-xl bg-slate-900 p-4 flex-row  w-full gap-4 border border-slate-800 absolute bottom-24 left-0 right-0 ml-2"
// 		>
// 			<StoryImage imageUrl={story.imageUrl} />
// 			<View className="flex flex-col gap-y-1 flex-1 mt-0.5">
// 				<Text className="text-slate-300 text-lg font-semibold" numberOfLines={1} ellipsizeMode="tail">
// 					{story.title}
// 				</Text>
// 			</View>
// 			<View className="flex items-center justify-center flex-row gap-2">
// 				<Pressable
// 					className="size-10 rounded-full flex items-center justify-center p-2 active:bg-slate-800"
// 					onPress={() => {}}
// 				>
// 					{isPlaying ? (
// 						<Pause className="text-slate-200 fill-slate-200" size={20} />
// 					) : (
// 						<Play className="text-slate-200 fill-slate-200" size={20} />
// 					)}
// 				</Pressable>

// 				<Pressable
// 					className="size-10 rounded-full flex items-center justify-center p-2 active:bg-slate-800"
// 					onPress={() => {
// 						setCurrentStory(null);
// 					}}
// 				>
// 					<Stop className="text-slate-200 fill-slate-200" size={20} />
// 				</Pressable>
// 			</View>
// 		</Animated.View>
// 	);
// };
