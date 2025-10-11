import { SecondaryHeader } from "@/components/nav/secondary-header";
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
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { sanitizeStorageUrl } from "@/lib/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlaylistIdPage() {
	const params = useLocalSearchParams();
	const playlistId = params.playlistId as Id<"playlists">;
	return (
		<View className="flex-1 relative bg-foreground/10">
			<SecondaryHeader
				dismissTo={"/playlists"}
				rightNode={
					<View className="flex-row flex items-center gap-x-2">
						<AddStoryButton playlistId={params.playlistId as string} />
						<PlaylistDropDownMenu />
					</View>
				}
			/>
			<View style={{ flex: 1 }} className="relative flex-col px-0">
				<PlaylistContent playlistId={playlistId} />
			</View>
		</View>
	);
}

const PlaylistDropDownMenu = () => {
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
				<Pressable className="size-[34px] flex items-center justify-center active:bg-foreground/10 rounded-full">
					<EllipsisVertical className="size-[24px] text-foreground" />
				</Pressable>
			</PopoverTrigger>
			<PopoverContent
				insets={contentInsets}
				sideOffset={2}
				alignOffset={-16}
				className="w-54 bg-background rounded-xl border-[0.5px] flex flex-col p-0"
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
				<Pressable className="flex flex-row items-center gap-2 p-4 w-full active:bg-foreground/10 rounded-t-md">
					<TextCursorInput className="text-foreground" size={20} />
					<Text className="text-foreground font-medium text-xl">Edit Playlist</Text>
				</Pressable>
				<Separator className="h-[0.5px]" />
				<Pressable className="flex flex-row items-center gap-2 p-4 w-full active:bg-foreground/10 rounded-b-md">
					<Trash2 className="text-destructive" size={20} />
					<Text className="text-destructive font-medium text-xl">Delete Playlist</Text>
				</Pressable>
			</PopoverContent>
		</Popover>
	);
};

const AddStoryButton = ({ playlistId }: { playlistId: string }) => {
	const router = useRouter();
	const pressRef = useRef(false);
	const handlePress = useCallback(() => {
		if (pressRef.current) return;
		pressRef.current = true;
		router.push(`/playlists/${playlistId}/add-songs`);
		setTimeout(() => {
			pressRef.current = false;
		}, 500);
	}, [router, playlistId]);
	return (
		<Pressable
			onPress={handlePress}
			className="size-[34px] flex  items-center justify-center rounded-full active:bg-foreground/10"
		>
			<Plus className="text-border" size={24} strokeWidth={2.5} />
		</Pressable>
	);
};

const PlaylistContent = ({ playlistId }: { playlistId: Id<"playlists"> }) => {
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
		await Promise.all([refetchPlaylist(), refresh()]);
	}, [refetchPlaylist, refresh]);

	return (
		<DraggableFlatList
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ff78e5" />}
			showsVerticalScrollIndicator={false}
			contentContainerClassName="h-full"
			contentContainerStyle={{ paddingTop: 16 }}
			data={stories}
			keyExtractor={(item) => item._id}
			renderItem={({ item }) => <View></View>}
			onDragEnd={({ data }) => {
				console.log(data);
			}}
			ListHeaderComponent={listHeader}
			ListEmptyComponent={listEmptyComponent}
		/>
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
			<Text className="text-foreground font-semibold text-4xl mt-3" allowFontScaling={false}>
				{playlist.name}
			</Text>

			<Pressable
				disabled={playlist.numStories === 0}
				className="disabled:opacity-50 border-2 border-border p-3 w-3/4 rounded-md mt-2.5 bg-secondary flex flex-row items-center  justify-center gap-x-2"
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
			<Skeleton className="size-[56px] rounded-lg bg-foreground/20" />
			<View className="flex flex-col gap-y-1 flex-1 mt-1">
				<Skeleton className="h-4 w-32 rounded-md bg-foreground/20" />
				<Skeleton className="h-3 w-16 rounded-md bg-foreground/20" />
			</View>
			<View className="flex items-center justify-start">
				<Skeleton className="size-[34px] rounded-full bg-foreground/20" />
			</View>
		</View>
	);
};
