import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { SecondaryHeader } from "@/components/nav/secondary-header";
import { EnhancedStorySearchCard } from "@/components/stories/story-search-card";
import { ScanSearch } from "@/components/ui/icons/scan-search";
import { Search } from "@/components/ui/icons/search-icon";
import { X } from "@/components/ui/icons/x-icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { StoryPreview } from "@/convex/stories/schema";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { usePlayInFullscreen } from "@/hooks/use-play-in-fullscreen";
import { usePresentPaywall } from "@/hooks/use-present-paywall";
import { eventRegister, EVENTS } from "@/lib/events";
import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { debounce } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	RefreshControl,
	Text,
	TextInput,
	View,
} from "react-native";

export default function SearchPge() {
	const searchRef = useRef<TextInput>(null);
	const params = useLocalSearchParams();
	const router = useRouter();
	const [input, setInput] = useState("");

	const debouncedSearch = useMemo(
		() =>
			debounce((search: string) => {
				router.setParams({ search });
			}, 350),
		[router],
	);

	const handleInputChange = useCallback(
		(text: string) => {
			setInput(text);
			debouncedSearch(text);
		},
		[debouncedSearch, setInput],
	);

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

	const clearSearch = useCallback(() => {
		setInput("");
		searchRef.current?.clear();
		router.setParams({ search: undefined });
	}, [router]);

	const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		searchRef.current?.blur();
	}, []);

	useEffect(() => {
		const handleSearchTabPress = () => {
			if (!searchRef.current?.isFocused()) {
				searchRef.current?.focus();
			}
		};
		eventRegister.on(EVENTS.SEARCH_TAB_PRESS, handleSearchTabPress);
		return () => {
			eventRegister.off(EVENTS.SEARCH_TAB_PRESS, handleSearchTabPress);
		};
	}, []);

	useFocusEffect(
		useCallback(() => {
			// Small delay to ensure the screen transition is complete
			const timeoutId = setTimeout(() => {
				searchRef.current?.focus();
			}, 100);

			return () => clearTimeout(timeoutId);
		}, []),
	);

	return (
		<>
			<View className="flex-1 relative bg-background">
				<SecondaryHeader title="Search" className="border-b-0" />
				<KeyboardAvoidingView behavior={"padding"} keyboardVerticalOffset={0} className="flex-1">
					<View className="px-2 w-full bg-background pb-4  border-b border-black/20 flex flex-col gap-y-2">
						<View className="relative flex flex-row items-center w-full">
							<Search className="absolute left-2 text-black/30 size-5" color="red" />
							<Input
								ref={searchRef}
								placeholder="Search stories"
								className="px-10 w-full"
								onChangeText={handleInputChange}
								autoFocus={true}
								autoCorrect={false}
							/>
							{input && input.trim() !== "" && (
								<Pressable
									style={{
										shadowColor: "#000",
										shadowOffset: { width: 0.75, height: 1.5 },
										shadowOpacity: 0.4,
										shadowRadius: 3.25,
									}}
									onPress={clearSearch}
									className={"size-7 rounded-full bg-black/20 flex items-center justify-center absolute right-2 "}
								>
									<X className="text-background size-3" size={16} />
								</Pressable>
							)}
						</View>
					</View>
					<View className="flex-1 bg-black/10">
						<FlashList
							refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#ff78e5" />}
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
								status === "LoadingMore" ? (
									<View className="flex flex-row items-center justify-center px-4 py-1.5">
										<ActivityIndicator size="small" color="#ff78e5" />
									</View>
								) : null
							}
							onEndReached={onEndReached}
							keyboardShouldPersistTaps={"handled"}
							onScroll={handleScroll}
							scrollEventThrottle={250}
						/>
					</View>
				</KeyboardAvoidingView>
			</View>
			<AudioPreviewPlayer
				onCardPress={(id) => {
					router.push(`/stories/${id}`);
				}}
			/>
		</>
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
