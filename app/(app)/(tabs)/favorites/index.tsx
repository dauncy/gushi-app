import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { EnhancedStoryCard } from "@/components/stories/enhanced-story-card";
import { StoryCardLoading } from "@/components/stories/story-card";
import { Sparkles } from "@/components/ui/icons/sparkles-icon";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { usePlayInFullscreen } from "@/hooks/use-play-in-fullscreen";
import { FlashList } from "@shopify/flash-list";
import { Link, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

export default function FavoritesListPage() {
	const router = useRouter();
	return (
		<View style={{ flex: 1 }} className="relative">
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
	const { hasSubscription } = useSubscription();
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

	const { playInFullscreen } = usePlayInFullscreen();

	return (
		<View style={{ flex: 1 }} className="relative bg-[#fffbf3] flex flex-col px-0 pt-4">
			<View className="flex-1 bg-black/10 px-2" style={{ paddingTop: 12, paddingBottom: 12 }}>
				<FlashList
					showsVerticalScrollIndicator={false}
					numColumns={2}
					refreshControl={<RefreshControl tintColor="#ff78e5" refreshing={refreshing} onRefresh={refresh} />}
					onEndReached={onEndReached}
					extraData={{ isLoading, refreshing, status, hasSubscription, results }}
					data={results}
					keyExtractor={(item) => item._id}
					renderItem={({ item, index: idx }) => (
						<EnhancedStoryCard
							story={item}
							onCardPress={() =>
								playInFullscreen({
									storyData: { _id: item._id, title: item.title, imageUrl: item.imageUrl, audioUrl: item.audioUrl },
								})
							}
							margin={idx % 2 === 0 ? "right" : "left"}
						/>
					)}
					contentContainerStyle={{
						paddingBottom: results.length === 0 ? 8 : 80,
						paddingTop: 8,
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
								<View className="flex flex-col flex-1 items-center justify-center px-4 mt-60">
									<View className="flex w-full border-2 border-[#ff2d01] bg-background rounded-xl p-4 flex flex-col gap-y-2">
										<View className="flex w-full flex flex-row items-center gap-x-2">
											<Sparkles size={20} className="text-[#ff2d01]" />
											<Text className="text-[#ff2d01] font-semibold text-center">No favs found</Text>
										</View>
										<Text className="text-foreground">
											{"You can add favorites anytime by tapping the star icon on each story."}
										</Text>

										<Link href={"/"} className="mt-5 bg-[#ceef32] border-[#0395ff] border-2 rounded-xl p-3 ">
											<Text className="text-[#0395ff] font-semibold text-center">{"Explore stories"}</Text>
										</Link>
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
		</View>
	);
};
