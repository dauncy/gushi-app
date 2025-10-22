import { useSubscription } from "@/context/SubscriptionContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { StoryPreview } from "@/convex/stories/schema";
import { usePresentPaywall } from "@/hooks/use-present-paywall";
import { cn } from "@/lib/utils";
import { useConvexMutation } from "@convex-dev/react-query";
import { TriggerRef } from "@rn-primitives/popover";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useReorderableDrag } from "react-native-reorderable-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StoryContextMenu } from "../stories/story-context-menu";
import { StoryImagePreview } from "../stories/story-image";
import { EllipsisVertical } from "../ui/icons/ellipsis-vertical";
import { LockKeyhole } from "../ui/icons/lock-icon";
import { Trash2 } from "../ui/icons/trash-icon";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Skeleton } from "../ui/skeleton";

const LockedPlaylistStoryCard = ({
	story,
	drag,
	playlistId,
	playlistStoryId,
}: {
	story: StoryPreview;
	drag: () => void;
	playlistId?: Id<"playlists">;
	playlistStoryId?: Id<"playlistStories">;
}) => {
	const { presentPaywall } = usePresentPaywall();
	const handlePress = useCallback(() => {
		presentPaywall();
	}, [presentPaywall]);
	return (
		<Pressable onPress={handlePress} onLongPress={drag} className={cn("flex flex-row gap-x-4 w-full p-4 relative")}>
			<StoryImagePreview
				transition={0}
				imageUrl={story.imageUrl}
				blurHash={story.blurHash ?? undefined}
				size="sm"
				recyclingKey={story._id}
			/>
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
			<View className="flex items-center justify-center relative ">
				<View className="absolute right-0 " style={{ zIndex: 4 }}>
					<PlayistStoryContextMenu story={story} playlistId={playlistId} playlistStoryId={playlistStoryId} />
				</View>
			</View>

			<View className="absolute inset-0  bg-black opacity-20 overflow-hidden" style={{ zIndex: 1 }} />
			<View className="absolute inset-0 items-center justify-center overflow-hidden" style={{ zIndex: 3 }}>
				<View
					style={{
						shadowColor: "#ffffff",
						shadowOffset: {
							width: 0.5,
							height: 1.5,
						},
						shadowOpacity: 0.5,
						shadowRadius: 14,
					}}
					className="flex flex-row items-center justify-center size-8 rounded-full bg-foreground p-1"
				>
					<LockKeyhole className="text-background" size={16} />
				</View>
			</View>
			<BlurView
				intensity={4}
				tint="dark"
				className="absolute inset-0 rounded-xl bg-black overflow-hidden"
				style={{ zIndex: 2, borderRadius: 12 }}
			/>
		</Pressable>
	);
};

const UnlockedPlaylistStoryCard = ({
	story,
	drag,
	playlistId,
	playlistStoryId,
}: {
	story: StoryPreview;
	drag: () => void;
	playlistId?: Id<"playlists">;
	playlistStoryId?: Id<"playlistStories">;
}) => {
	return (
		<Pressable onLongPress={drag} className={cn("flex flex-row gap-x-4 w-full p-4")}>
			<StoryImagePreview
				transition={0}
				imageUrl={story.imageUrl}
				blurHash={story.blurHash ?? undefined}
				size="sm"
				recyclingKey={story._id}
			/>
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
			<View className="flex items-center justify-center">
				<PlayistStoryContextMenu story={story} playlistId={playlistId} playlistStoryId={playlistStoryId} />
			</View>
		</Pressable>
	);
};

export const PlaylistStoryCard = ({
	story,
	playlistId,
	playlistStoryId,
	disabled = false,
}: {
	story: StoryPreview;
	playlistId: Id<"playlists">;
	playlistStoryId: Id<"playlistStories">;
	disabled: boolean;
}) => {
	const { hasSubscription } = useSubscription();
	const drag = useReorderableDrag();
	const [isSwiping, setIsSwiping] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const removePlaylistStoryFromPlaylist = useConvexMutation(api.playlists.mutations.removePlaylistStoryFromPlaylist);

	const handleDelete = useCallback(
		async (onDelete: () => void) => {
			if (deleting) return;
			setDeleting(true);
			await removePlaylistStoryFromPlaylist({ playlistId, playlistStoryId: playlistStoryId });
			onDelete();
			setDeleting(false);
			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		},
		[deleting, playlistId, playlistStoryId, removePlaylistStoryFromPlaylist],
	);

	const locked = useMemo(() => {
		if (!story.audioUrl) {
			return true;
		}
		if (!story.subscription_required) {
			return false;
		}
		return !hasSubscription;
	}, [hasSubscription, story.subscription_required, story.audioUrl]);

	return (
		<View
			className={cn(
				"overflow-hidden",
				isSwiping && "bg-background/80 relative",
				disabled && "opacity-50",
				deleting && "opacity-50",
			)}
		>
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
				renderRightActions={(progress, drag, methods) => (
					<RightAction drag={drag} onPress={async () => await handleDelete(() => methods.close())} loading={deleting} />
				)}
			>
				{locked ? (
					<LockedPlaylistStoryCard
						story={story}
						drag={drag}
						playlistId={playlistId}
						playlistStoryId={playlistStoryId}
					/>
				) : (
					<UnlockedPlaylistStoryCard
						story={story}
						drag={drag}
						playlistId={playlistId}
						playlistStoryId={playlistStoryId}
					/>
				)}
			</ReanimatedSwipeable>
		</View>
	);
};

const PlayistStoryContextMenu = ({
	story,
	playlistId,
	playlistStoryId,
}: {
	story: StoryPreview;
	playlistId?: Id<"playlists">;
	playlistStoryId?: Id<"playlistStories">;
}) => {
	const onCloseCallbacsk = useRef<Map<string, () => void>>(new Map());
	const popoverTriggerRef = useRef<TriggerRef>(null);
	const insets = useSafeAreaInsets();
	const contentInsets = {
		top: insets.top,
		bottom: insets.bottom,
		left: 4,
		right: 4,
	};
	return (
		<Popover>
			<PopoverTrigger asChild ref={popoverTriggerRef}>
				<Pressable className="flex items-center justify-center size-[34px] rounded-full active:bg-foreground/10">
					<EllipsisVertical className="size-[24px] text-foreground/60" />
				</Pressable>
			</PopoverTrigger>
			<PopoverContent
				style={{
					shadowColor: "#000",
					shadowOffset: { width: 1.25, height: 2.75 },
					shadowOpacity: 0.25,
					shadowRadius: 3.84,
				}}
				insets={contentInsets}
				className="rounded-xl p-0 bg-background"
				align="end"
				alignOffset={-16}
				side="bottom"
			>
				<StoryContextMenu
					currentPlaylistId={playlistId}
					onSharePress={() => popoverTriggerRef.current?.close()}
					story={story}
					addCloseCallback={(name, callback) => {
						onCloseCallbacsk.current.set(name, callback);
					}}
					triggerClose={() => {
						popoverTriggerRef.current?.close();
						onCloseCallbacsk.current.forEach((callback) => callback());
						onCloseCallbacsk.current.clear();
					}}
					playlistStoryId={playlistStoryId}
				/>
			</PopoverContent>
		</Popover>
	);
};

const RightAction = ({
	drag,
	onPress,
	loading = false,
}: {
	drag: SharedValue<number>;
	onPress: () => Promise<void>;
	loading: boolean;
}) => {
	const move = useAnimatedStyle(() => ({
		transform: [{ translateX: drag.value + 48 }],
	}));

	return (
		<View style={{ width: 48, height: "100%" }} className="items-center justify-center">
			<Animated.View className="bg-destructive w-[54px] h-full" style={[move]}>
				<Pressable
					disabled={loading}
					onPress={onPress}
					className="flex flex-row items-center justify-center gap-x-2"
					style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
				>
					{loading ? (
						<ActivityIndicator size={20} color="#ff78e5" />
					) : (
						<Trash2 size={20} className="text-background" strokeWidth={2} />
					)}
				</Pressable>
			</Animated.View>
		</View>
	);
};

export const PlaylistStoryLoading = () => {
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
