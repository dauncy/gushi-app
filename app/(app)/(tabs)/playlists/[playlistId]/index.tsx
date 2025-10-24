import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { SecondaryHeader } from "@/components/nav/secondary-header";
import { PlaylistStoryCard, PlaylistStoryLoading } from "@/components/playlists/playlist-story-card";
import { EllipsisVertical } from "@/components/ui/icons/ellipsis-vertical";
import { Play } from "@/components/ui/icons/play-icon";
import { Playlist } from "@/components/ui/icons/playlist-icon";
import { Plus } from "@/components/ui/icons/plus-icon";
import { Scroll } from "@/components/ui/icons/scroll-icon";
import { Stop } from "@/components/ui/icons/stop-icon";
import { TextCursorInput } from "@/components/ui/icons/text-cursor-input";
import { Trash2 } from "@/components/ui/icons/trash-icon";
import { Image } from "@/components/ui/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudio, useHasActiveQueue, useIsPlaylistActive } from "@/context/AudioContext";
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
import { ActivityIndicator, Alert, Pressable, RefreshControl, Text, View, ViewStyle } from "react-native";
import { runOnJS, useSharedValue, withSpring } from "react-native-reanimated";
import ReorderableList, {
	ReorderableListCellAnimations,
	ReorderableListDragEndEvent,
	ReorderableListDragStartEvent,
	ReorderableListReorderEvent,
	reorderItems,
} from "react-native-reorderable-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlaylistIdPage() {
	const params = useLocalSearchParams();
	const clickRef = useRef(false);
	const [deleting, setDeleting] = useState(false);
	const deletePlaylist = useConvexMutation(api.playlists.mutations.deletePlaylist);
	const { clearQueue } = useAudio();
	const router = useRouter();
	const playlistId = params.playlistId as Id<"playlists">;

	const handleDelete = useCallback(async () => {
		if (clickRef.current) return;
		clickRef.current = true;
		setDeleting(true);
		await deletePlaylist({ playlistId });
		await clearQueue();
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		setDeleting(false);
		router.dismissTo("/playlists");
	}, [playlistId, deletePlaylist, setDeleting, router, clearQueue]);

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
				<AudioPreviewPlayer
					onCardPress={(id) => {
						router.push(`/stories/${id}`);
					}}
				/>
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
				className={cn("w-54 bg-background rounded-xl border-2 flex flex-col p-0", deleting && "opacity-50")}
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
						<Text className="text-foreground font-medium text-xl" maxFontSizeMultiplier={1.2}>
							Edit Playlist
						</Text>
					</Pressable>
				</PopoverTrigger>
				<Separator className="h-[2px]" />
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
					<Text className="text-destructive font-medium text-xl" maxFontSizeMultiplier={1.2}>
						Delete Playlist
					</Text>
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
	const hasAudioPlayer = useHasActiveQueue();
	const [isReordering, setIsReordering] = useState(false);
	const scale = useSharedValue(1);
	const shadowOpacity = useSharedValue(0);
	const shadowRadius = useSharedValue(0);
	const backgroundColor = useSharedValue("transparent");
	const { setQueue } = useAudio();

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
				order: index,
			}));

			await reorderPlaylistStories({ playlistId, storyOrders: playlistOrders });
			setIsReordering(false);
		},
		[disabled, localStories, reorderPlaylistStories, playlistId],
	);

	useEffect(() => {
		if (disabled) return;
		if (!isReordering) {
			let isDifferent = false;
			if (stories.length !== localStories.length) {
				isDifferent = true;
			}
			for (let i = 0; i < stories.length; i++) {
				const story = stories[i];
				const localStory = localStories[i];
				if (!story || !localStory) {
					continue;
				}
				if (story.playlistStoryId !== localStory.playlistStoryId) {
					isDifferent = true;
					break;
				}
			}
			if (isDifferent) {
				setLocalStories(stories);
			}
		}
	}, [stories, setLocalStories, isReordering, disabled, localStories]);

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
		if (localStories.length === 0 && stories.length > 0) {
			return <PlaylistStoriesLoading />;
		}
		return <PlaylistEmptyState />;
	}, [storiesLoading, refreshing, isRefetchingPlaylist, playlistLoading, localStories.length, stories.length]);

	const handleRefresh = useCallback(async () => {
		if (disabled) return;
		await Promise.all([refetchPlaylist(), refresh()]);
	}, [disabled, refetchPlaylist, refresh]);

	const startPlaylistAtIndex = useCallback(
		async (playlistStoryId: Id<"playlistStories">) => {
			if (disabled) return;
			const index = localStories.findIndex((story) => story.playlistStoryId === playlistStoryId);
			if (index < 0) return;
			await setQueue(
				localStories.map((story) => ({
					playlistStoryId: story.playlistStoryId,
					playlistId: playlistId,
					id: story.story._id,
					title: story.story.title ?? "",
					imageUrl: sanitizeStorageUrl(story.story.imageUrl ?? ""),
					url: sanitizeStorageUrl(story.story.audioUrl ?? ""),
				})),
				index,
				true,
			);
		},
		[disabled, setQueue, localStories, playlistId],
	);

	const renderItem = useCallback(
		({ item }: { item: { playlistStoryId: Id<"playlistStories">; story: StoryPreview } }) => {
			return (
				<PlaylistStoryCard
					startPlaylistAtIndex={startPlaylistAtIndex}
					story={item.story}
					disabled={disabled}
					playlistStoryId={item.playlistStoryId}
					playlistId={playlistId}
				/>
			);
		},
		[disabled, playlistId, startPlaylistAtIndex],
	);

	const contentContainerStyle: ViewStyle | undefined = useMemo(() => {
		if (hasAudioPlayer) {
			return { paddingTop: 16, paddingBottom: 80 };
		}
		return { paddingTop: 16, paddingBottom: 0 };
	}, [hasAudioPlayer]);

	return (
		<ReorderableList
			dragEnabled={!disabled}
			onReorder={handleReorder}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff78e5" />}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={contentContainerStyle}
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

const PlaylistHeader = ({ playlist }: { playlist: PlaylistPreview }) => {
	const [imageError, setImageError] = useState(false);
	const isPlaylistActive = useIsPlaylistActive({ playlistId: playlist._id });
	const { setQueue, stop, addTracks } = useAudio();
	const { data: queue, isLoading } = useConvexQuery(api.playlists.queries.getPlaylistAsQueue, {
		playlistId: playlist._id,
	});
	const [loadingQueue, setLoadingQueue] = useState(false);
	const [localQueue, setLocalQueue] = useState<
		{
			id: Id<"stories">;
			title: string;
			imageUrl: string | null;
			audioUrl: string;
			playlistStoryId: Id<"playlistStories">;
		}[]
	>([]);

	useEffect(() => {
		if (!queue) {
			return;
		}
		if (localQueue.length === 0) {
			setLocalQueue(queue ?? []);
			return;
		}

		let isDifferent = false;
		if (localQueue.length > queue.length) {
			isDifferent = true;
		}
		for (let i = 0; i < localQueue.length; i++) {
			const localStory = localQueue[i];
			const story = queue[i];
			if (!story) {
				isDifferent = true;
				break;
			}
			if (localStory?.playlistStoryId !== story.playlistStoryId) {
				isDifferent = true;
				break;
			}
		}
		if (isDifferent && isPlaylistActive) {
			Alert.alert("Playlist changed", "Do you want to restart the playlist?", [
				{ text: "Cancel", style: "cancel" },
				{
					text: "Restart",
					onPress: async () => {
						setLocalQueue(queue ?? []);
						await setQueue(
							queue.map((story) => ({
								playlistStoryId: story.playlistStoryId,
								playlistId: playlist._id,
								id: story.id,
								title: story.title,
								imageUrl: sanitizeStorageUrl(story.imageUrl ?? ""),
								url: sanitizeStorageUrl(story.audioUrl),
							})),
							0,
							true,
						);
					},
				},
			]);
			setLocalQueue(queue ?? []);
			return;
		}
		if (isDifferent && !isPlaylistActive) {
			setLocalQueue(queue ?? []);
			return;
		}

		if (queue.length > localQueue.length) {
			addTracks(
				queue.slice(localQueue.length).map((story) => ({
					playlistStoryId: story.playlistStoryId,
					playlistId: playlist._id,
					id: story.id,
					title: story.title,
					imageUrl: sanitizeStorageUrl(story.imageUrl ?? ""),
					url: sanitizeStorageUrl(story.audioUrl),
				})),
			).then(() => {
				setLocalQueue(queue ?? []);
			});
		}
	}, [queue, setLocalQueue, localQueue, isPlaylistActive, playlist._id, setQueue, addTracks]);
	const handlePlayPress = useCallback(async () => {
		if (isLoading || !queue || queue.length === 0) return;
		if (isPlaylistActive) {
			await stop();
			return;
		}
		setLoadingQueue(true);
		await setQueue(
			queue.map((story) => ({
				playlistStoryId: story.playlistStoryId,
				playlistId: playlist._id,
				id: story.id,
				title: story.title,
				imageUrl: sanitizeStorageUrl(story.imageUrl ?? ""),
				url: sanitizeStorageUrl(story.audioUrl),
			})),
			0,
			true,
		);
		setLoadingQueue(false);
	}, [isLoading, isPlaylistActive, playlist._id, queue, setQueue, stop]);
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
				onPress={handlePlayPress}
				disabled={isLoading || !queue || queue.length === 0 || loadingQueue}
				className={cn(
					"disabled:opacity-50 border-2 border-border p-3 w-3/4 rounded-full mt-2.5 bg-secondary flex flex-row items-center  justify-center gap-x-2",
					isPlaylistActive && "border-destructive bg-background",
				)}
			>
				{loadingQueue ? (
					<ActivityIndicator size={24} color="#0395ff" />
				) : isPlaylistActive ? (
					<Stop className="text-destructive fill-destructive" size={24} />
				) : (
					<Play className="text-border fill-border" size={24} />
				)}
				<Text
					className={cn("font-bold text-2xl", isPlaylistActive ? "text-destructive" : "text-border")}
					allowFontScaling={false}
				>
					{loadingQueue ? "Loading playlist..." : isPlaylistActive ? "Stop Playlist" : "Play Playlist"}
				</Text>
			</Pressable>

			<View className="w-full flex items-start justify-start mt-6">
				<Text className="text-foreground/80 font-medium text-lg" maxFontSizeMultiplier={1.2}>
					{playlist.name}
				</Text>
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
