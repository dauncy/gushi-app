import { SecondaryHeader } from "@/components/nav/secondary-header";
import { PlaylistCard, PlaylistCardLoading } from "@/components/playlists/playlist-card";
import { Headphones } from "@/components/ui/icons/headphones-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Playlist } from "@/components/ui/icons/playlist-icon";
import { Plus } from "@/components/ui/icons/plus-icon";
import { api } from "@/convex/_generated/api";
import { PlaylistPreview } from "@/convex/playlists/schema";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";

export default function PlaylistsListPage() {
	const [isReordering, setIsReordering] = useState(false);
	const reorderPlaylist = useConvexMutation(api.playlists.mutations.reorderPlaylist);
	const [localResults, setLocalResults] = useState<PlaylistPreview[]>([]);
	const { isLoading, refreshing, refresh, loadMore, results, status } = useConvexPaginatedQuery(
		api.playlists.queries.getUserPlaylists,
		{},
		{
			initialNumItems: 10,
		},
	);

	const handleReorder = useCallback(
		async (data: PlaylistPreview[]) => {
			setLocalResults(data);
			setIsReordering(true);
			const playlistOrders = data.map((playlist, index) => ({
				playlistId: playlist._id,
				order: index + 1,
			}));

			await reorderPlaylist({ playlistOrders });
			setTimeout(() => {
				setIsReordering(false);
			}, 500);
		},
		[reorderPlaylist, setIsReordering, setLocalResults],
	);

	useEffect(() => {
		if (!isReordering) {
			setLocalResults(results);
		}
	}, [results, setLocalResults, isReordering]);

	const onEndReached = useCallback(() => {
		if (status === "CanLoadMore") {
			loadMore(10);
		}
	}, [loadMore, status]);

	return (
		<View className="flex-1 relative bg-foreground/10">
			<SecondaryHeader title="Playlists" />
			<View style={{ flex: 1 }} className="relative flex-col px-0">
				<DraggableFlatList
					contentContainerClassName=" h-full"
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#ff78e5" />}
					onEndReached={onEndReached}
					onDragEnd={({ data }) => {
						handleReorder(data);
					}}
					data={localResults}
					keyExtractor={(item) => item._id}
					renderItem={({ item, isActive, drag }) => (
						<PlaylistCard key={item._id} playlist={item} drag={drag} isActive={isActive} />
					)}
					ListEmptyComponent={
						isLoading || refreshing || (localResults.length === 0 && results.length >= 0) ? (
							<PlaylistsLoading />
						) : (
							<EmptyState />
						)
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
			<Link asChild href="/playlists/create">
				<Pressable
					className="size-[44px] bg-border absolute bottom-4 right-4 rounded-xl flex items-center justify-center"
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
