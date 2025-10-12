import { FormHeader } from "@/components/nav/form-header";
import { StoryImagePreview } from "@/components/stories/story-image";
import { CircleCheckBig } from "@/components/ui/icons/circle-check-big";
import { CirclePlus } from "@/components/ui/icons/circle-plus";
import { ScanSearch } from "@/components/ui/icons/scan-search";
import { Search } from "@/components/ui/icons/search-icon";
import { X } from "@/components/ui/icons/x-icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toastConfig } from "@/components/ui/toast";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StoryPreview } from "@/convex/stories";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { usePreventFormDismiss } from "@/hooks/use-prevent-form-dismiss";
import { cn } from "@/lib/utils";
import { FlashList } from "@shopify/flash-list";
import { useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
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
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Toast from "react-native-toast-message";

const ALERT_TITLE = "Discard Changes";
const ALERT_MESSAGE = "These stories will not be added to the playlist.";

export default function AddStoriesPage() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const playlistId = params.playlistId as Id<"playlists">;
	const search = params.search as string | undefined;
	const [selectedStoryIds, setSelectedStoryIds] = useState<Id<"stories">[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [searchInput, setSearchInput] = useState("");
	const searchRef = useRef<TextInput>(null);
	const addStoriesToPlaylist = useMutation(api.playlists.mutations.addStoriesToPlaylist);

	const hasSearch = useMemo(() => search && search.trim().length > 0, [search]);

	const {
		isLoading: loadingDefault,
		results: defaultStories,
		status: defaultStatus,
		refreshing: defaultRefreshing,
		refresh: refreshDefault,
		loadMore: loadMoreDefault,
	} = useConvexPaginatedQuery(api.stories.queries.getStories, hasSearch ? "skip" : { includeFeatured: true }, {
		initialNumItems: 10,
	});

	const {
		isLoading: loadingSearched,
		results: searchedStories,
		status: searchedStatus,
		loadMore: loadMoreSearched,
		refreshing: searchedRefreshing,
		refresh: refreshSearched,
	} = useConvexPaginatedQuery(
		api.stories.queries.searchStories,
		hasSearch
			? {
					search: search ?? "",
				}
			: "skip",
		{
			initialNumItems: 10,
		},
	);

	const listData = useMemo(() => {
		if (hasSearch) {
			if (loadingSearched) {
				return [];
			}
			return searchedStories;
		}
		if (loadingDefault) {
			return [];
		}
		return defaultStories;
	}, [hasSearch, defaultStories, searchedStories, loadingSearched, loadingDefault]);

	const emptyComponent = useMemo(() => {
		if (hasSearch) {
			if (loadingSearched) {
				return <LoadingList />;
			}
			if (searchedStories.length === 0) {
				return <SearchEmpty query={search ?? ""} />;
			}
		}
		if (loadingDefault) {
			return <LoadingList />;
		}
		return null;
	}, [hasSearch, loadingDefault, loadingSearched, search, searchedStories.length]);

	const handleLoadMore = useCallback(() => {
		if (hasSearch) {
			if (searchedStatus === "CanLoadMore") {
				loadMoreSearched(10);
			}
		} else {
			if (defaultStatus === "CanLoadMore") {
				loadMoreDefault(10);
			}
		}
	}, [hasSearch, loadMoreSearched, loadMoreDefault, searchedStatus, defaultStatus]);

	const handleRefresh = useCallback(async () => {
		if (hasSearch) {
			await refreshSearched();
		} else {
			await refreshDefault();
		}
	}, [hasSearch, refreshSearched, refreshDefault]);

	const refreshing = useMemo(() => {
		if (hasSearch) {
			return searchedRefreshing;
		}
		return defaultRefreshing;
	}, [hasSearch, searchedRefreshing, defaultRefreshing]);

	const debouncedSearch = useMemo(
		() =>
			debounce((search: string) => {
				router.setParams({ search });
			}, 350),
		[router],
	);

	const handleInputChange = useCallback(
		(text: string) => {
			setSearchInput(text);
			debouncedSearch(text);
		},
		[debouncedSearch, setSearchInput],
	);

	const clearSearch = useCallback(() => {
		setSearchInput("");
		searchRef.current?.clear();
		router.setParams({ search: undefined });
	}, [router]);

	const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		searchRef.current?.blur();
	}, []);

	const toggleStory = useCallback((storyId: Id<"stories">) => {
		setSelectedStoryIds((prev) => {
			if (prev.includes(storyId)) {
				return prev.filter((id) => id !== storyId);
			}
			return [...prev, storyId];
		});
	}, []);

	usePreventFormDismiss({ isDirty: selectedStoryIds.length > 0, alertTitle: ALERT_TITLE, alertMessage: ALERT_MESSAGE });

	const handleSubmit = useCallback(async () => {
		setSubmitting(true);
		await addStoriesToPlaylist({ playlistId, storyIds: selectedStoryIds });
		setSubmitting(false);
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		Toast.show({ type: "success", text1: "Stories added", text2: "Your stories have been added to your playlist" });
		router.dismissTo(`/playlists/${playlistId}`);
	}, [addStoriesToPlaylist, playlistId, selectedStoryIds, router]);

	const listFooterComponent = useMemo(() => {
		if (hasSearch) {
			if (searchedStatus === "CanLoadMore") {
				return (
					<View className="flex flex-row items-center justify-center px-4 py-1.5">
						<ActivityIndicator size="small" color="#ff78e5" />
					</View>
				);
			}
		}

		if (defaultStatus === "CanLoadMore") {
			return (
				<View className="flex flex-row items-center justify-center px-4 py-1.5">
					<ActivityIndicator size="small" color="#ff78e5" />
				</View>
			);
		}
		return null;
	}, [defaultStatus, hasSearch, searchedStatus]);

	if (!playlistId) {
		return <Redirect href="/playlists" />;
	}

	return (
		<>
			<KeyboardAvoidingView behavior={"padding"} keyboardVerticalOffset={0} className="flex-1 bg-background">
				<FormHeader
					isDirty={selectedStoryIds.length > 0}
					submitDisabled={selectedStoryIds.length === 0}
					backDisabled={submitting}
					dismissTo={`/playlists/${playlistId}`}
					formTitle="Add Stories"
					alertTitle={ALERT_TITLE}
					alertMessage={ALERT_MESSAGE}
					submitText="Add Stories"
					onSubmit={handleSubmit}
				/>
				<View className="px-2 w-full bg-background pb-4 flex flex-col gap-y-2">
					<View className="relative flex flex-row items-center w-full">
						<Search className="absolute left-2 text-black/30 size-5" color="red" />
						<Input
							ref={searchRef}
							placeholder="Search stories"
							className="px-10 w-full"
							onChangeText={handleInputChange}
							autoFocus={false}
							autoCorrect={false}
						/>
						{searchInput && searchInput.trim() !== "" && (
							<Pressable
								style={{
									shadowColor: "#000",
									shadowOffset: { width: 0.75, height: 1.5 },
									shadowOpacity: 0.4,
									shadowRadius: 3.25,
								}}
								onPress={clearSearch}
								className={"size-7 rounded-full bg-foreground/20 flex items-center justify-center absolute right-2 "}
							>
								<X className="text-background size-3" size={16} />
							</Pressable>
						)}
					</View>
				</View>
				<View className="flex-1">
					<FlashList
						refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff78e5" />}
						data={listData}
						renderItem={({ item }) => (
							<BasicStoryCard
								story={item}
								toggleStory={toggleStory}
								selected={selectedStoryIds.includes(item._id)}
								disabled={submitting}
							/>
						)}
						ListEmptyComponent={emptyComponent}
						scrollEventThrottle={250}
						onScroll={handleScroll}
						onEndReached={handleLoadMore}
						onEndReachedThreshold={0.5}
						ListFooterComponent={listFooterComponent}
					/>
				</View>
			</KeyboardAvoidingView>
			<Toast config={toastConfig} position={"top"} topOffset={48} />
		</>
	);
}

const LoadingList = () => {
	return (
		<View className="w-full flex flex-col">
			{Array.from({ length: 10 }).map((_, idx) => (
				<View className="w-full flex flex-row gap-x-4 px-2 py-4 items-center" key={`add-stories-loading-${idx}`}>
					<Skeleton className="size-10 rounded-md bg-foreground/20" />
					<View className="flex flex-col gap-y-2 flex-1 w-full">
						<Skeleton className="w-2/3 h-6 rounded-md bg-foreground/20" />
					</View>
				</View>
			))}
		</View>
	);
};

const BasicStoryCard = ({
	story,
	toggleStory,
	selected,
	disabled = false,
}: {
	story: StoryPreview;
	toggleStory: (storyId: Id<"stories">) => void;
	selected: boolean;
	disabled: boolean;
}) => {
	const animatedValue = useSharedValue(selected ? 1 : 0);

	useEffect(() => {
		animatedValue.value = withSpring(selected ? 1 : 0, {
			damping: 15,
			stiffness: 150,
		});
	}, [animatedValue, selected]);

	const animatedIconStyle = useAnimatedStyle(() => {
		const rotate = interpolate(
			animatedValue.value,
			[0, 1],
			[0, 180], // Half rotation twist
		);

		const scale = interpolate(
			animatedValue.value,
			[0, 0.5, 1],
			[1, 1.05, 1], // Pop effect in the middle
		);

		return {
			transform: [{ rotateY: `${rotate}deg` }, { scale }],
		};
	});

	const handlePress = useCallback(async () => {
		if (disabled) return;
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		toggleStory(story._id);
	}, [disabled, toggleStory, story._id]);

	return (
		<Pressable
			disabled={disabled}
			onPress={handlePress}
			className={cn(
				"w-full flex flex-row gap-x-4 px-2 py-4 items-center",
				selected && "bg-foreground/10",
				disabled && "opacity-50",
			)}
		>
			<StoryImagePreview imageUrl={story.imageUrl} blurHash={story.blurHash ?? undefined} size="sm" />
			<View className="flex flex-col gap-y-2 flex-1 w-full">
				<Text
					className="text-foreground text-2xl font-semibold"
					numberOfLines={2}
					ellipsizeMode="tail"
					maxFontSizeMultiplier={1.2}
				>
					{story.title}
				</Text>
			</View>
			<View className="flex items-center justify-center">
				<Pressable
					onPress={handlePress}
					className="size-[34px] flex items-center justify-center rounded-full active:bg-foreground/10"
				>
					<Animated.View style={animatedIconStyle}>
						{selected ? (
							<CircleCheckBig
								className="text-border"
								style={{ transform: [{ rotateY: "180deg" }] }}
								size={20}
								strokeWidth={2.5}
							/>
						) : (
							<CirclePlus className="text-primary" size={20} strokeWidth={2.5} />
						)}
					</Animated.View>
				</Pressable>
			</View>
		</Pressable>
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
