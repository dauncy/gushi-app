import { FormHeader } from "@/components/nav/form-header";
import { PlaylistImage } from "@/components/playlists/playlist-card";
import { CircleCheckBig } from "@/components/ui/icons/circle-check-big";
import { CirclePlus } from "@/components/ui/icons/circle-plus";
import { Headphones } from "@/components/ui/icons/headphones-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Playlist } from "@/components/ui/icons/playlist-icon";
import { Plus } from "@/components/ui/icons/plus-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PlaylistPreview } from "@/convex/playlists/schema";
import { useConvexPaginatedQuery } from "@/hooks/use-convex-paginated-query";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { usePreventFormDismiss } from "@/hooks/use-prevent-form-dismiss";
import { eventRegister, EVENTS } from "@/lib/events";
import { cn } from "@/lib/utils";
import { useConvexMutation } from "@convex-dev/react-query";
import { FlashList } from "@shopify/flash-list";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, Text, View, ViewStyle } from "react-native";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function AddToPlaylistPage() {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const [selectedPlaylists, setSelectedPlaylists] = useState<Id<"playlists">[]>([]);
	const storyId = useLocalSearchParams<{ storyId: Id<"stories"> }>().storyId;
	const togglePlaylist = useCallback((playlistId: Id<"playlists">) => {
		setSelectedPlaylists((prev) => {
			if (prev.includes(playlistId)) {
				return prev.filter((id) => id !== playlistId);
			}
			return [...prev, playlistId];
		});
	}, []);

	const addStoryToPlaylists = useConvexMutation(api.playlists.mutations.addStoryToPlaylists);

	const { refresh, results, status, loadMore, refreshing, isLoading } = useConvexPaginatedQuery(
		api.playlists.queries.getUserPlaylists,
		{},
		{
			initialNumItems: 10,
		},
	);

	const handleSubmit = useCallback(async () => {
		setSubmitting(true);
		await addStoryToPlaylists({ storyId, playlistIds: selectedPlaylists });
		setSubmitting(false);
		await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		Toast.show({ type: "success", text1: "Stories added", text2: "Your stories have been added to your playlists" });
		if (router.canGoBack()) {
			router.back();
		} else {
			router.dismissTo("/");
		}
	}, [addStoryToPlaylists, storyId, selectedPlaylists, router]);

	const handleReachEnd = useCallback(() => {
		if (status === "CanLoadMore") {
			loadMore(10);
		}
	}, [loadMore, status]);

	usePreventFormDismiss({
		isDirty: selectedPlaylists.length > 0,
		alertTitle: "Discard changes",
		alertMessage: "Are you sure you want to discard these changes?",
	});

	const contentContainerStyle: ViewStyle = useMemo(() => {
		if (results.length === 0 && !refreshing && !isLoading) {
			return {
				paddingBottom: 80,
				paddingTop: 0,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				flex: 1,
			};
		}
		if (results.length > 0) {
			return {
				paddingBottom: 80,
				paddingTop: 0,
			};
		}
		return {
			paddingBottom: 80,
			paddingTop: 0,
		};
	}, [results.length, refreshing, isLoading]);

	if (!storyId) {
		return null;
	}

	return (
		<SafeAreaView edges={["bottom"]} className="flex-1 flex flex-col w-full">
			<View className="flex-1 flex flex-col w-full">
				<FormHeader
					isDirty={selectedPlaylists.length > 0}
					submitDisabled={selectedPlaylists.length === 0 || submitting}
					backDisabled={submitting}
					dismissTo={"/"}
					formTitle={"Add to playlist"}
					alertTitle={"Discard changes"}
					alertMessage={"Are you sure you want to discard these changes?"}
					onSubmit={handleSubmit}
					submitText={"Add"}
				/>
				<View
					className={cn("flex-1 relative", results.length === 0 && !refreshing && !isLoading && "bg-foreground/10")}
				>
					<FlashList
						contentContainerStyle={contentContainerStyle}
						showsVerticalScrollIndicator={false}
						refreshing={refreshing}
						refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#ff78e5" />}
						data={results}
						onEndReached={handleReachEnd}
						onEndReachedThreshold={0.5}
						ListEmptyComponent={
							<>
								{isLoading || refreshing ? (
									<View className="w-full flex flex-col">
										{Array.from({ length: 10 }).map((_, index) => (
											<PlaylistPreviewCardLoading key={index} />
										))}
									</View>
								) : (
									<EmptyState />
								)}
							</>
						}
						ListFooterComponent={
							<>
								{status === "LoadingMore" ? (
									<View className="flex flex-row items-center justify-center px-4 py-1.5">
										<ActivityIndicator size="small" color="#ff78e5" />
									</View>
								) : null}
							</>
						}
						renderItem={({ item }) => (
							<PlaylistPreviewCard
								selected={selectedPlaylists.includes(item._id)}
								storyId={storyId}
								togglePlaylist={togglePlaylist}
								disabled={false}
								playlist={item}
							/>
						)}
					/>
					<View className="absolute bottom-0 w-full bg-background p-4 flex justify-end flex-row">
						<Pressable
							onPress={() => {
								router.setParams({ storyId });
								eventRegister.emit(EVENTS.CREATE_PLAYLIST_PRESS);
								setTimeout(() => {
									router.dismiss();
								}, 250);
							}}
							disabled={submitting}
							className={cn(" flex flex-row items-center justify-center gap-x-2 p-2", submitting && "opacity-50")}
						>
							<Plus className="text-border" strokeWidth={2.5} size={20} strokeLinejoin="round" strokeLinecap="round" />
							<Text className="text-border text-lg font-semibold" maxFontSizeMultiplier={1.2} allowFontScaling={false}>
								{"Create Playlist"}
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const PlaylistPreviewCard = ({
	playlist,
	selected,
	storyId,
	togglePlaylist,
	disabled,
}: {
	playlist: PlaylistPreview;
	selected: boolean;
	storyId: Id<"stories">;
	togglePlaylist: (playlistId: Id<"playlists">) => void;
	disabled: boolean;
}) => {
	const { data: inPlaylist, isLoading: checkingInPlaylist } = useConvexQuery(
		api.playlists.queries.checkStoryInPlaylist,
		{ playlistId: playlist._id, storyId },
	);
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
		if (disabled || checkingInPlaylist) return;
		if (inPlaylist) {
			Alert.alert(
				"Story already in playlist",
				"This story is already in your playlist. Would you like to add it again?",
				[
					{
						text: "Add again",
						style: "destructive",
						onPress: async () => {
							await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							togglePlaylist(playlist._id);
						},
					},
					{
						text: "Cancel",
						style: "cancel",
					},
				],
			);
			return;
		}
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		togglePlaylist(playlist._id);
	}, [disabled, checkingInPlaylist, inPlaylist, togglePlaylist, playlist._id]);

	return (
		<Pressable
			disabled={disabled || checkingInPlaylist}
			onPress={handlePress}
			className={cn(
				"w-full flex flex-row gap-x-4 px-2 py-4 items-center",
				selected && "bg-foreground/10",
				disabled && "opacity-50",
			)}
		>
			<PlaylistImage imageUrl={playlist.image} size="sm" />
			<View className="flex flex-col gap-y-2 flex-1 w-full">
				<Text
					className="text-foreground text-2xl font-semibold"
					numberOfLines={2}
					ellipsizeMode="tail"
					maxFontSizeMultiplier={1.2}
					allowFontScaling={false}
				>
					{playlist.name}
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

const PlaylistPreviewCardLoading = () => {
	return (
		<View className="w-full flex flex-row gap-x-4 px-2 py-4 items-center">
			<Skeleton className="size-10 rounded-lg" />
			<View className="flex flex-col gap-y-2 flex-1 w-full">
				<Skeleton className="w-2/3 h-6 rounded-md" />
			</View>
			<View className="flex items-center justify-center">
				<Skeleton className="size-[34px] rounded-full" />
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
