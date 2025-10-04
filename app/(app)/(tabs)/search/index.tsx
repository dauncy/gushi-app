import { EnhancedStorySearchCard } from "@/components/stories/story-search-card";
import { ScanSearch } from "@/components/ui/icons/scan-search";
import { Search } from "@/components/ui/icons/search-icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { StoryPreview } from "@/convex/stories/schema";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { usePlayInFullscreen } from "@/hooks/use-play-in-fullscreen";
import { usePresentPaywall } from "@/hooks/use-present-paywall";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, useRouter } from "expo-router";
import { debounce } from "lodash";
import { useCallback } from "react";
import { ActivityIndicator, KeyboardAvoidingView, RefreshControl, Text, View } from "react-native";

export default function SearchPge() {
	const params = useLocalSearchParams();
	const router = useRouter();

	const debouncedSearch = debounce((search: string) => {
		router.setParams({ search });
	}, 250);

	const search = params.search as string;

	const { isLoading, results, refreshing, refresh, loadMore, status } = useConvexPaginatedQuery(
		api.stories.queries.searchStories,
		search && search.trim() !== ""
			? {
					search,
				}
			: "skip",
		{
			initialNumItems: 10,
		},
	);

	const onEndReached = useCallback(() => {
		if (status === "CanLoadMore") {
			loadMore(10);
		}
	}, [loadMore, status]);

	const { presentPaywall } = usePresentPaywall();
	const { playInFullscreen } = usePlayInFullscreen();
	const { hasSubscription } = useSubscription();

	const unlocked = useCallback(
		({ subscription_required, audioUrl }: { subscription_required: boolean; audioUrl: string | null }) => {
			if (hasSubscription) {
				return !!audioUrl;
			}
			return !subscription_required && !!audioUrl;
		},
		[hasSubscription],
	);

	const onCardPress = useCallback(
		(story: StoryPreview) => {
			if (unlocked(story)) {
				playInFullscreen({
					storyData: { _id: story._id, title: story.title, imageUrl: story.imageUrl, audioUrl: story.audioUrl },
				});
			} else {
				presentPaywall();
			}
		},
		[presentPaywall, playInFullscreen, unlocked],
	);

	return (
		<View style={{ flex: 1 }} className="relative flex-col px-0 bg-background">
			<View className="flex-1 bg-black/10" style={{ marginTop: 46 }}>
				<KeyboardAvoidingView behavior={"padding"} keyboardVerticalOffset={0} className="flex-1">
					<View className="px-2 w-full bg-background py-4 pt-8 border-b border-black/20">
						<View className="relative flex flex-row items-center w-full">
							<Search className="absolute left-2 text-black/30 size-5" color="red" />
							<Input
								placeholder="Search stories"
								className="pl-10 w-full"
								onChangeText={debouncedSearch}
								autoFocus={true}
							/>
						</View>
					</View>
					<FlashList
						refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#ff78e5" />}
						contentContainerStyle={{
							display: results.length === 0 && search && search.trim() !== "" && !refreshing ? "flex" : undefined,
							flex: results.length === 0 && search && search.trim() !== "" && !refreshing ? 1 : undefined,
							justifyContent:
								results.length === 0 && search && search.trim() !== "" && !refreshing ? "center" : undefined,
						}}
						extraData={{ isLoading, refreshing, search }}
						data={results}
						renderItem={({ item }) => <EnhancedStorySearchCard story={item} onCardPress={() => onCardPress(item)} />}
						ListEmptyComponent={
							<>
								{(isLoading || refreshing) && search && search.trim() !== "" ? (
									<SearchLoading />
								) : search && search.trim() !== "" ? (
									<SearchEmpty query={search} />
								) : null}
							</>
						}
						ListFooterComponent={
							<>
								{status === "LoadingMore" ? (
									<View className="flex flex-row items-center justify-center px-4 py-1.5">
										<ActivityIndicator size={16} color="#ff78e5" />
									</View>
								) : null}
							</>
						}
						onEndReached={onEndReached}
						keyboardShouldPersistTaps="handled"
					/>
				</KeyboardAvoidingView>
			</View>
		</View>
	);
}

const SearchLoading = () => {
	return (
		<View className="flex w-full gap-y-0 flex-col">
			{Array.from({ length: 10 }).map((_, idx) => (
				<View
					key={`search-loading-${idx}`}
					className="w-full border-b border-border p-2 py-4 pb-6  flex-row gap-x-4 items-start"
				>
					<Skeleton className="size-24 rounded-md bg-black/20 flex" />
					<View className="flex flex-col gap-y-2 flex-1 mt-1 w-full">
						<View className="flex flex-col gap-y-1 flex-1 mt-1">
							<Skeleton className="w-2/5 h-6 rounded-md bg-black/20" />
							<View className="flex flex-row gap-x-2 items-center">
								<Skeleton className="size-4 rounded-full bg-black/20" />
								<Skeleton className="w-16 h-3 rounded-md bg-black/20" />
							</View>
						</View>
						<View className="flex flex-col gap-y-1">
							<Skeleton className="w-[92%] h-2 rounded-md bg-black/20" />
							<Skeleton className="w-[86%] h-2 rounded-md bg-black/20" />
						</View>
					</View>
				</View>
			))}
		</View>
	);
};

const SearchEmpty = ({ query }: { query: string }) => {
	return (
		<View className="flex items-center flex-1">
			<View className="flex w-full p-4 flex flex-col gap-y-2 items-center">
				<ScanSearch size={48} className="text-[#ff2d01]/80" strokeWidth={1} />
				<View className="flex w-full max-w-[280px]">
					<Text className="text-foreground/80 text-center font-medium">
						{`No stories found with "`}
						<Text className="text-foreground font-semibold">{`${query}`}</Text>
						{`" Try again with something different.`}
					</Text>
				</View>
			</View>
		</View>
	);
};
