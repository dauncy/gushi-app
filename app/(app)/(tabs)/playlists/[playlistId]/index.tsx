import { SecondaryHeader } from "@/components/nav/secondary-header";
import { StoryImagePreview } from "@/components/stories/story-image";
import { EllipsisVertical } from "@/components/ui/icons/ellipsis-vertical";
import { Play } from "@/components/ui/icons/play-icon";
import { Playlist } from "@/components/ui/icons/playlist-icon";
import { Plus } from "@/components/ui/icons/plus-icon";
import { Scroll } from "@/components/ui/icons/scroll-icon";
import { TextCursorInput } from "@/components/ui/icons/text-cursor-input";
import { Trash2 } from "@/components/ui/icons/trash-icon";
import { Image } from "@/components/ui/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PlaylistPreview } from "@/convex/playlists/schema";
import { StoryPreview } from "@/convex/stories/schema";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import { useConvexMutation } from "@convex-dev/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { runOnJS, SharedValue, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import ReorderableList, {
	ReorderableListCellAnimations,
	ReorderableListDragEndEvent,
	ReorderableListDragStartEvent,
	ReorderableListReorderEvent,
	reorderItems,
	useReorderableDrag,
} from "react-native-reorderable-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlaylistIdPage() {
	const params = useLocalSearchParams();
	const clickRef = useRef(false);
	const [deleting, setDeleting] = useState(false);
	const deletePlaylist = useConvexMutation(api.playlists.mutations.deletePlaylist);

	const router = useRouter();
	const playlistId = params.playlistId as Id<"playlists">;

	const handleDelete = useCallback(async () => {
		if (clickRef.current) return;
		clickRef.current = true;
		setDeleting(true);
		await deletePlaylist({ playlistId });
		setDeleting(false);
		router.dismissTo("/playlists");
	}, [playlistId, deletePlaylist, setDeleting, router]);

	if (!playlistId) {
		return null;
	}

	return (
		<View className="flex-1 relative bg-foreground/10">
			<SecondaryHeader
				dismissTo={"/playlists"}
				rightNode={
					<View className="flex-row flex items-center gap-x-2">
						<AddStoryButton playlistId={params.playlistId as string} pressRef={clickRef} disabled={deleting} />
						<PlaylistDropDownMenu
							deleting={deleting}
							playlistId={playlistId}
							pressRef={clickRef}
							onDeletePress={handleDelete}
						/>
					</View>
				}
			/>
			<View style={{ flex: 1 }} className="relative flex-col px-0">
				<PlaylistContent playlistId={playlistId} disabled={deleting} />
			</View>
		</View>
	);
}

const PlaylistDropDownMenu = ({
	deleting = false,
	playlistId,
	pressRef,
	onDeletePress,
}: {
	deleting: boolean;
	playlistId: Id<"playlists">;
	pressRef: RefObject<boolean>;
	onDeletePress: () => Promise<void>;
}) => {
	const router = useRouter();

	const handleEditPress = useCallback(() => {
		if (pressRef.current) return;
		if (deleting) return;
		pressRef.current = true;
		router.push(`/playlists/${playlistId}/edit`);
		setTimeout(() => {
			pressRef.current = false;
		}, 500);
	}, [pressRef, deleting, router, playlistId]);

	const insets = useSafeAreaInsets();
	const contentInsets = {
		top: insets.top,
		bottom: insets.bottom,
		left: 4,
		right: 4,
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Pressable
					disabled={deleting}
					className="size-[34px] flex items-center justify-center active:bg-foreground/10 rounded-full disabled:opacity-50"
				>
					<EllipsisVertical className="size-[24px] text-foreground" />
				</Pressable>
			</PopoverTrigger>
			<PopoverContent
				insets={contentInsets}
				sideOffset={2}
				alignOffset={-16}
				className={cn("w-54 bg-background rounded-xl border-[0.5px] flex flex-col p-0", deleting && "opacity-50")}
				align="end"
				style={{
					shadowColor: "#000",
					shadowOffset: {
						width: 1.25,
						height: 2.75,
					},
					shadowOpacity: 0.4,
					shadowRadius: 3.84,
				}}
			>
				<PopoverTrigger asChild>
					<Pressable
						disabled={deleting}
						onPress={handleEditPress}
						className="flex flex-row items-center gap-2 p-4 w-full active:bg-foreground/10 rounded-t-md"
					>
						<TextCursorInput className="text-foreground" size={20} />
						<Text className="text-foreground font-medium text-xl">Edit Playlist</Text>
					</Pressable>
				</PopoverTrigger>
				<Separator className="h-[0.5px]" />
				<Pressable
					disabled={deleting}
					className="flex flex-row items-center gap-2 p-4 w-full active:bg-foreground/10 rounded-b-md disabled:opacity-50"
					onPress={onDeletePress}
				>
					{deleting ? (
						<ActivityIndicator size={20} color="#ff78e5" />
					) : (
						<Trash2 className="text-destructive" size={20} />
					)}
					<Text className="text-destructive font-medium text-xl">Delete Playlist</Text>
				</Pressable>
			</PopoverContent>
		</Popover>
	);
};

const AddStoryButton = ({
	playlistId,
	pressRef,
	disabled = false,
}: {
	playlistId: string;
	pressRef: RefObject<boolean>;
	disabled: boolean;
}) => {
	const router = useRouter();
	const handlePress = useCallback(() => {
		if (pressRef.current || disabled) return;
		pressRef.current = true;
		router.push(`/playlists/${playlistId}/add-stories`);
		setTimeout(() => {
			pressRef.current = false;
		}, 500);
	}, [router, playlistId, pressRef, disabled]);
	return (
		<Pressable
			disabled={disabled}
			onPress={handlePress}
			className="size-[34px] flex  items-center justify-center rounded-full active:bg-foreground/10 disabled:opacity-50"
		>
			<Plus className="text-border" size={24} strokeWidth={2.5} />
		</Pressable>
	);
};

const PlaylistContent = ({ playlistId, disabled = false }: { playlistId: Id<"playlists">; disabled: boolean }) => {
	const [isReordering, setIsReordering] = useState(false);
	const scale = useSharedValue(1);
	const shadowOpacity = useSharedValue(0);
	const shadowRadius = useSharedValue(0);
	const backgroundColor = useSharedValue("transparent");

	const reorderPlaylistStories = useConvexMutation(api.playlists.mutations.reorderPlaylistStories);
	const {
		data: playlist,
		isLoading: playlistLoading,
		refetch: refetchPlaylist,
		isRefetching: isRefetchingPlaylist,
	} = useConvexQuery(api.playlists.queries.getPlaylist, { playlistId });
	const {
		results: stories,
		isLoading: storiesLoading,
		refreshing,
		loadMore,
		status,
		refresh,
	} = useConvexPaginatedQuery(
		api.playlists.queries.getPlaylistStories,
		{
			playlistId: playlistId,
		},
		{
			initialNumItems: 10,
		},
	);

	const [localStories, setLocalStories] = useState<{ playlistStoryId: Id<"playlistStories">; story: StoryPreview }[]>(
		[],
	);

	const dragStartHaptic = useCallback(async () => {
		if (disabled) return;
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}, [disabled]);

	const dragEndHaptic = useCallback(async () => {
		if (disabled) return;
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
	}, [disabled]);

	const handleDragStart = (_: ReorderableListDragStartEvent) => {
		"worklet";

		runOnJS(dragStartHaptic)();

		scale.value = withSpring(1.05, {
			stiffness: 200,
			duration: 300,
		});

		shadowOpacity.value = withSpring(0.4, {
			stiffness: 200,
			duration: 300,
		});

		shadowRadius.value = withSpring(8, {
			stiffness: 200,
			duration: 300,
		});

		backgroundColor.value = withSpring("#fffbf3", {
			stiffness: 200,
			duration: 300,
		});
	};

	const handleDragEnd = (_: ReorderableListDragEndEvent) => {
		"worklet";

		runOnJS(dragEndHaptic)();

		scale.value = withSpring(1, {
			stiffness: 200,
			duration: 300,
		});

		shadowOpacity.value = withSpring(0, {
			stiffness: 200,
			duration: 300,
		});

		shadowRadius.value = withSpring(0, {
			stiffness: 200,
			duration: 300,
		});

		backgroundColor.value = withSpring("transparent", {
			stiffness: 200,
			duration: 300,
		});
	};

	const cellAnimations = useMemo(
		() => ({
			opacity: 1,
			transform: [{ scale }],
			shadowOpacity,
			shadowRadius,
			shadowColor: "#000000",
			shadowOffset: { width: 1.25, height: 2.75 },
			backgroundColor,
		}),
		[scale, shadowOpacity, shadowRadius, backgroundColor],
	);

	const handleReorder = useCallback(
		async ({ from, to }: ReorderableListReorderEvent) => {
			if (disabled) return;
			setIsReordering(true);
			const data = reorderItems(localStories, from, to);
			setLocalStories(data);
			const playlistOrders = data.map((playlist, index) => ({
				playlistStoryId: playlist.playlistStoryId,
				order: index + 1,
			}));

			await reorderPlaylistStories({ playlistId, storyOrders: playlistOrders });
			setIsReordering(false);
		},
		[disabled, localStories, reorderPlaylistStories, playlistId],
	);

	useEffect(() => {
		if (disabled) return;
		if (!isReordering) {
			setLocalStories(stories);
		}
	}, [stories, setLocalStories, isReordering, disabled]);

	const onEndReached = useCallback(() => {
		if (disabled) return;
		if (isReordering) return;
		if (status === "CanLoadMore") {
			loadMore(10);
		}
	}, [disabled, isReordering, status, loadMore]);

	const listHeader = useMemo(() => {
		if (playlistLoading || isRefetchingPlaylist || storiesLoading || refreshing) {
			return <PlaylistHeaderSkeleton />;
		}
		if (!playlist) {
			return null;
		}
		return <PlaylistHeader playlist={playlist} />;
	}, [playlist, playlistLoading, isRefetchingPlaylist, storiesLoading, refreshing]);

	const listEmptyComponent = useMemo(() => {
		if (storiesLoading || refreshing || isRefetchingPlaylist || playlistLoading) {
			return <PlaylistStoriesLoading />;
		}
		return <PlaylistEmptyState />;
	}, [storiesLoading, refreshing, isRefetchingPlaylist, playlistLoading]);

	const handleRefresh = useCallback(async () => {
		if (disabled) return;
		await Promise.all([refetchPlaylist(), refresh()]);
	}, [disabled, refetchPlaylist, refresh]);

	const renderItem = useCallback(
		({ item }: { item: { playlistStoryId: Id<"playlistStories">; story: StoryPreview } }) => {
			return <PlaylistStoryCard story={item.story} disabled={disabled} />;
		},
		[disabled],
	);

	return (
		<ReorderableList
			dragEnabled={!disabled}
			onReorder={handleReorder}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff78e5" />}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ paddingTop: 16 }}
			data={localStories}
			keyExtractor={(item) => item.playlistStoryId}
			renderItem={renderItem}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			cellAnimations={cellAnimations as ReorderableListCellAnimations}
			ListHeaderComponent={listHeader}
			ListEmptyComponent={listEmptyComponent}
			onEndReached={onEndReached}
			ListFooterComponent={
				status === "LoadingMore" ? (
					<View className="flex flex-row items-center justify-center px-4 py-1.5">
						<ActivityIndicator size="small" color="#ff78e5" />
					</View>
				) : null
			}
		/>
	);
};

const PlaylistStoryCard = ({ story, disabled = false }: { story: StoryPreview; disabled: boolean }) => {
	const drag = useReorderableDrag();
	const [isSwiping, setIsSwiping] = useState(false);

	return (
		<View className={cn("overflow-hidden", isSwiping && "bg-background/80 relative", disabled && "opacity-50")}>
			<ReanimatedSwipeable
				enabled={!disabled}
				onSwipeableOpenStartDrag={() => setIsSwiping(true)}
				onSwipeableCloseStartDrag={() => setIsSwiping(false)}
				onSwipeableOpen={() => setIsSwiping(true)}
				onSwipeableClose={() => setIsSwiping(false)}
				friction={2}
				rightThreshold={10}
				overshootRight={true}
				overshootFriction={8}
				renderRightActions={(progress, drag, methods) => <RightAction drag={drag} onPress={() => methods.close()} />}
			>
				<Pressable onLongPress={drag} className={cn("flex flex-row gap-x-4 w-full p-4")}>
					<StoryImagePreview imageUrl={story.imageUrl} blurHash={story.blurHash ?? undefined} size="sm" />
					<View className="flex flex-col gap-y-2 flex-1">
						<Text
							className="text-foreground text-xl font-semibold"
							numberOfLines={2}
							ellipsizeMode="tail"
							maxFontSizeMultiplier={1.2}
						>
							{story.title}
						</Text>
					</View>
				</Pressable>
			</ReanimatedSwipeable>
		</View>
	);
};

const RightAction = ({ drag, onPress }: { drag: SharedValue<number>; onPress: () => void }) => {
	const move = useAnimatedStyle(() => ({
		transform: [{ translateX: drag.value + 48 }],
	}));

	return (
		<View style={{ width: 48, height: "100%" }} className="items-center justify-center">
			<Animated.View className="bg-destructive w-[54px] h-full" style={[move]}>
				<Pressable
					onPress={onPress}
					className="flex flex-row items-center justify-center gap-x-2"
					style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
				>
					<Trash2 size={20} className="text-background" strokeWidth={2} />
				</Pressable>
			</Animated.View>
		</View>
	);
};

const PlaylistHeader = ({ playlist }: { playlist: PlaylistPreview }) => {
	const [imageError, setImageError] = useState(false);
	return (
		<View className="flex flex-col items-center px-4">
			<View
				className="size-[224px] rounded-3xl bg-foreground/20 flex items-center justify-center"
				style={{
					shadowColor: "#000000",
					shadowOffset: { width: 2.75, height: 4 },
					shadowOpacity: 0.25,
					shadowRadius: 10,
				}}
			>
				{playlist.image && !imageError ? (
					<Image
						source={{ uri: sanitizeStorageUrl(playlist.image) }}
						onError={() => setImageError(true)}
						className="size-full rounded-3xl"
					/>
				) : (
					<Playlist
						className="text-foreground/40 fill-foreground/40"
						strokeWidth={0.5}
						strokeLinecap="round"
						strokeLinejoin="round"
						size={116}
					/>
				)}
			</View>
			<Text
				style={{ fontFamily: "Baloo", fontWeight: "bold", fontSize: 32, lineHeight: 48 }}
				className="text-foreground mt-3"
				allowFontScaling={false}
			>
				{playlist.name}
			</Text>

			<Pressable
				disabled={playlist.numStories === 0}
				className="disabled:opacity-50 border-2 border-border p-3 w-3/4 rounded-full mt-2.5 bg-secondary flex flex-row items-center  justify-center gap-x-2"
			>
				<Play className="text-border fill-border" size={24} />
				<Text className="text-border font-bold text-2xl">Play Playlist</Text>
			</Pressable>

			<View className="w-full flex items-start justify-start mt-6">
				<Text className="text-foreground/80 font-medium text-lg">{playlist.name}</Text>
			</View>
		</View>
	);
};

const PlaylistHeaderSkeleton = () => {
	return (
		<View className="flex flex-col items-center px-4">
			<Skeleton className="size-[224px] rounded-3xl bg-foreground/20 flex items-center justify-center" />
			<Skeleton className="h-8 w-40 rounded-md bg-foreground/20 mt-4" />

			<Skeleton className="h-11 w-3/4 rounded-md bg-foreground/20 mt-4" />

			<View className="w-full flex items-start justify-start mt-6">
				<Skeleton className="h-4 w-24 rounded-md bg-foreground/20 mt-4" />
			</View>
		</View>
	);
};

const PlaylistEmptyState = () => {
	return (
		<View className="flex-1  flex items-center justify-center flex-col gap-y-2 w-full p-8">
			<View className="flex flex-row items-end gap-x-1">
				<View className="flex rounded-full bg-background size-[34px] items-center justify-center">
					<Play size={24} className="text-foreground/60 fill-foreground/60" />
				</View>
				<View className="flex rounded-full bg-background size-[56px] items-center justify-center">
					<Scroll size={34} className="text-border fill-border" />
				</View>
				<View className="flex rounded-full bg-background size-[34px] items-center justify-center">
					<Playlist size={24} className="text-destructive/60 fill-destructive/60" />
				</View>
			</View>
			<View className="flex flex-col gap-y-0 w-full items-center justify-center">
				<Text
					style={{ letterSpacing: 0.5, fontFamily: "Baloo", fontWeight: "bold", fontSize: 28 }}
					className="text-foreground/80"
					maxFontSizeMultiplier={1.2}
				>
					{"No stories added"}
				</Text>
				<Text className="-mt-3 text-foreground text-lg text-center" maxFontSizeMultiplier={1.2}>
					{"Add stories to your playlist to get started."}
				</Text>
			</View>
		</View>
	);
};

const PlaylistStoriesLoading = () => {
	return (
		<View className="flex flex-col w-full px-4 pt-2">
			{Array.from({ length: 10 }).map((_, index) => (
				<PlaylistStoryLoading key={`playlist-story-loading-${index}`} />
			))}
		</View>
	);
};

const PlaylistStoryLoading = () => {
	return (
		<View className="flex flex-row gap-x-4 w-full py-4">
			<Skeleton className="size-10 rounded-lg bg-foreground/20" />
			<View className="flex flex-col gap-y-1 flex-1 mt-1">
				<Skeleton className="h-3 w-32 rounded-md bg-foreground/20" />
				<Skeleton className="h-3 w-16 rounded-md bg-foreground/20" />
			</View>
			<View className="flex items-center justify-start">
				<Skeleton className="size-[34px] rounded-full bg-foreground/20" />
			</View>
		</View>
	);
};
