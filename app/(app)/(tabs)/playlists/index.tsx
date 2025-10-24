import { AudioPreviewPlayer } from "@/components/audio/audio-preview";
import { SecondaryHeader } from "@/components/nav/secondary-header";
import { PlaylistCard, PlaylistCardLoading } from "@/components/playlists/playlist-card";
import { Headphones } from "@/components/ui/icons/headphones-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Playlist } from "@/components/ui/icons/playlist-icon";
import { Plus } from "@/components/ui/icons/plus-icon";
import { useHasActiveQueue } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { PlaylistPreview } from "@/convex/playlists/schema";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { useConvexMutation } from "@convex-dev/react-query";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text, View, ViewStyle } from "react-native";
import Animated, { Easing, runOnJS, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import ReorderableList, {
	ReorderableListCellAnimations,
	ReorderableListDragEndEvent,
	ReorderableListDragStartEvent,
	ReorderableListReorderEvent,
	reorderItems,
	useReorderableDrag,
} from "react-native-reorderable-list";

export default function PlaylistsListPage() {
	const router = useRouter();
	const scale = useSharedValue(1);
	const shadowOpacity = useSharedValue(0);
	const shadowRadius = useSharedValue(0);
	const backgroundColor = useSharedValue("transparent");
	const [isReordering, setIsReordering] = useState(false);
	const reorderPlaylists = useConvexMutation(api.playlists.mutations.reorderPlaylists);
	const [localResults, setLocalResults] = useState<PlaylistPreview[]>([]);
	const { isLoading, refreshing, refresh, loadMore, results, status } = useConvexPaginatedQuery(
		api.playlists.queries.getUserPlaylists,
		{},
		{
			initialNumItems: 10,
		},
	);

	const dragStartHaptic = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}, []);

	const dragEndHaptic = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
	}, []);

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
			setIsReordering(true);
			const data = reorderItems(localResults, from, to);
			setLocalResults(data);
			const playlistOrders = data.map((playlist, index) => ({
				playlistId: playlist._id,
				order: index,
			}));

			await reorderPlaylists({ playlistOrders });
			setIsReordering(false);
		},
		[localResults, reorderPlaylists],
	);

	useEffect(() => {
		if (!isReordering) {
			setLocalResults(results);
		}
	}, [results, setLocalResults, isReordering]);

	const onEndReached = useCallback(() => {
		if (isReordering) return;
		if (status === "CanLoadMore") {
			loadMore(10);
		}
	}, [loadMore, status, isReordering]);

	const renderItem = useCallback(({ item }: { item: PlaylistPreview }) => {
		return <DraggableCard item={item} />;
	}, []);

	const listEmptyComponent = useMemo(() => {
		if (isLoading || refreshing) {
			return <PlaylistsLoading />;
		}

		if (localResults.length === 0 && results.length > 0) {
			return <PlaylistsLoading />;
		}

		return <EmptyState />;
	}, [isLoading, refreshing, localResults, results]);

	const contentContainerStyle: ViewStyle | undefined = useMemo(() => {
		if (isLoading) {
			return {
				paddingTop: 0,
				display: "contents",
			};
		}
		if (refreshing) {
			return {
				paddingTop: 0,
				display: "contents",
			};
		}

		if (localResults.length === 0 && results.length > 0) {
			return {
				paddingTop: 0,
				display: "contents",
			};
		}

		if (results.length > 0 && localResults.length > 0) {
			return {
				paddingBottom: 80,
				paddingTop: 8,
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
	}, [isLoading, localResults.length, refreshing, results.length]);

	return (
		<View className="flex-1 relative bg-foreground/10">
			<SecondaryHeader title="Playlists" />
			<View style={{ flex: 1 }} className="relative flex-col px-0">
				<ReorderableList
					showsVerticalScrollIndicator={false}
					contentContainerStyle={contentContainerStyle}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#ff78e5" />}
					onReorder={handleReorder}
					data={localResults}
					keyExtractor={(item) => item._id}
					renderItem={renderItem}
					onEndReached={onEndReached}
					cellAnimations={cellAnimations as ReorderableListCellAnimations}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
					ListEmptyComponent={listEmptyComponent}
					ListFooterComponent={
						status === "LoadingMore" ? (
							<View className="flex flex-row items-center justify-center px-4 py-1.5">
								<ActivityIndicator size="small" color="#ff78e5" />
							</View>
						) : null
					}
				/>
			</View>
			<AddPlaylistButton />
			<AudioPreviewPlayer
				onCardPress={(id) => {
					router.push(`/stories/${id}`);
				}}
			/>
		</View>
	);
}

const PlaylistsLoading = () => {
	return (
		<View className="flex-col">
			{Array.from({ length: 10 }).map((_, index) => (
				<PlaylistCardLoading key={`playlist-card-loading-${index}`} />
			))}
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
					<Playlist size={34} className="text-border fill-border" />
				</View>
				<View className="flex rounded-full bg-background size-[34px] items-center justify-center">
					<Play size={24} className="text-destructive/60 fill-destructive/60" />
				</View>
			</View>
			<View className="flex flex-col gap-y-0 w-full items-center justify-center">
				<Text
					style={{ letterSpacing: 0.5, fontFamily: "Baloo", fontWeight: "bold", fontSize: 28 }}
					className="text-foreground/80"
					maxFontSizeMultiplier={1.2}
				>
					{"No playlists yet"}
				</Text>
				<Text className="-mt-3 text-foreground text-lg text-center" maxFontSizeMultiplier={1.2}>
					{"Create playlists and let bedtime run itself."}
				</Text>
			</View>
		</View>
	);
};

const DraggableCard = ({ item }: { item: PlaylistPreview }) => {
	const drag = useReorderableDrag();
	return <PlaylistCard playlist={item} drag={drag} />;
};

const AddPlaylistButton = () => {
	const hasActiveQueue = useHasActiveQueue();

	const bottomPosition = useSharedValue(16);
	useEffect(() => {
		if (hasActiveQueue) {
			bottomPosition.value = withDelay(
				0,
				withTiming(72, {
					duration: 250,
					easing: Easing.out(Easing.cubic),
				}),
			);
		} else {
			bottomPosition.value = withDelay(
				100,
				withTiming(16, {
					duration: 250,
					easing: Easing.out(Easing.cubic),
				}),
			);
		}
	}, [hasActiveQueue, bottomPosition]);

	return (
		<Animated.View style={{ position: "absolute", bottom: bottomPosition, right: 16 }}>
			<Link asChild href="/playlists/create">
				<Pressable
					className="size-[44px] bg-border rounded-xl flex items-center justify-center"
					style={{
						shadowColor: "#0395ff",
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 3.84,
						elevation: 5,
					}}
				>
					<Plus size={24} className="text-background" />
				</Pressable>
			</Link>
		</Animated.View>
	);
};
