import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { SecondaryHeader } from "@/components/nav/secondary-header";
import { EnhancedStoryCard } from "@/components/stories/enhanced-story-card";
import { StoryCardLoading } from "@/components/stories/story-card";
import { Headphones } from "@/components/ui/icons/headphones-icon";
import { Sparkles } from "@/components/ui/icons/sparkles-icon";
import { Star } from "@/components/ui/icons/star-icon";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { usePlayInFullscreen } from "@/hooks/use-play-in-fullscreen";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, RefreshControl, Text, View, ViewStyle } from "react-native";

export default function FavoritesListPage() {
	const router = useRouter();
	return (
		<View style={{ flex: 1 }} className="relative">
			<SecondaryHeader title="Favorites" />
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

	const contentContainerStyle: ViewStyle | undefined = useMemo(() => {
		if (isLoading) {
			return {
				paddingTop: 8,
				display: "contents",
			};
		}
		if (refreshing) {
			return {
				paddingTop: 8,
				display: "contents",
			};
		}
		if (results.length > 0) {
			return {
				paddingBottom: 80,
				paddingTop: 8,
				display: "contents",
			};
		}
		return {
			paddingTop: 0,
			paddingBottom: 0,
			display: "flex",
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
		};
	}, [isLoading, refreshing, results.length]);
	return (
		<View style={{ flex: 1 }} className="relative bg-[#fffbf3] flex flex-col px-0">
			<View className="flex-1 bg-black/10 px-2">
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
					contentContainerStyle={contentContainerStyle}
					ListEmptyComponent={
						<>
							{isLoading ? (
								<View style={{ flexWrap: "wrap", display: "flex", flexDirection: "row" }}>
									{Array.from({ length: 10 }).map((_, idx) => (
										<StoryCardLoading key={`loading-${idx}`} />
									))}
								</View>
							) : (
								<EmptyState />
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
		</View>
	);
};

const EmptyState = () => {
	return (
		<View className="flex-1 flex items-center justify-center flex-col gap-y-2 w-full p-8">
			<View className="flex flex-row items-end gap-x-1">
				<View className="flex rounded-full bg-background size-[34px] items-center justify-center">
					<Headphones size={24} className="text-foreground/60" />
				</View>
				<View className="flex rounded-full bg-background size-[56px] items-center justify-center">
					<Star size={34} className="text-border fill-border" />
				</View>
				<View className="flex rounded-full bg-background size-[34px] items-center justify-center">
					<Sparkles size={24} className="text-destructive/60 fill-destructive/60" />
				</View>
			</View>
			<View className="flex flex-col gap-y-0 w-full items-center justify-center">
				<Text
					style={{ letterSpacing: 0.5, fontFamily: "Baloo", fontWeight: "bold", fontSize: 28 }}
					className="text-foreground/80"
					maxFontSizeMultiplier={1.2}
				>
					{"No favorites yet"}
				</Text>
				<Text className="-mt-3 text-foreground text-lg text-center" maxFontSizeMultiplier={1.2}>
					{"Your favorite stories will show up here."}
				</Text>
			</View>
		</View>
	);
};
