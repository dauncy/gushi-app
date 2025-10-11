import { Fullscreen } from "@/components/ui/icons/full-screen-icon";
import { LockKeyholeOpen } from "@/components/ui/icons/lock-keyhole-open-icon";
import { Pause } from "@/components/ui/icons/pause-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Share } from "@/components/ui/icons/share-icon";
import { Sprout } from "@/components/ui/icons/sprout-icon";
import { Stop } from "@/components/ui/icons/stop-icon";
import { Separator } from "@/components/ui/separator";
import { setAudioStoryData, setAudioUrl, useAudio, useAudioPlayState, useIsStoryActive } from "@/context/AudioContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { Id } from "@/convex/_generated/dataModel";
import { StoryPreview } from "@/convex/stories/schema";
import { useFavorite } from "@/hooks/use-favorite";
import { usePlayInFullscreen } from "@/hooks/use-play-in-fullscreen";
import { useShareStory } from "@/hooks/use-share-story";
import { NAV_THEME } from "@/lib/constants";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { debounce } from "lodash";
import { Star } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { State } from "react-native-track-player";

const DescriptionRow = ({ description }: { description: string }) => {
	return (
		<View className="flex flex-col gap-y-1 p-3 px-4 w-full">
			<View className="flex flex-row gap-x-2 items-center">
				<Sprout className="size-4 text-foreground" size={16} />
				<Text
					className="text-foreground font-medium"
					style={{ fontSize: 14, lineHeight: 16 }}
					maxFontSizeMultiplier={1.2}
				>
					Story seed
				</Text>
			</View>

			<View className="flex-row flex gap-x-2 items-start">
				<View className="w-4 h-4" style={{ minWidth: 16 }} />
				<Text className="text-foreground/80 text-sm font-normal flex-1" maxFontSizeMultiplier={1.2}>
					{description}
				</Text>
			</View>
		</View>
	);
};

const ShareButton = ({ storyId, storyTitle }: { storyId: Id<"stories">; storyTitle: string }) => {
	const { shareStory } = useShareStory();
	const handleShare = useCallback(async () => {
		shareStory({ storyId, storyTitle });
	}, [shareStory, storyId, storyTitle]);
	return (
		<Pressable
			onPress={handleShare}
			className="p-3 px-4 w-full flex flex-row items-center gap-x-2 active:bg-foreground/10"
		>
			<Share className="size-4 text-foreground" size={16} />
			<Text
				className="text-foreground font-medium"
				style={{ fontSize: 14, lineHeight: 16 }}
				maxFontSizeMultiplier={1.2}
			>
				Share this story
			</Text>
		</Pressable>
	);
};

const AddToFavoritesButton = ({ storyId }: { storyId: Id<"stories"> }) => {
	const { handleToggleFavorite, favorite, isLoading, mutating } = useFavorite({ storyId });
	const [fav, setFav] = useState(!!favorite);

	const toggleFavoriteThrottled = debounce(async (favorite: boolean) => {
		handleToggleFavorite(favorite);
	}, 250);

	const toggleFavorite = useCallback(async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const nextFav = !fav;
		toggleFavoriteThrottled(nextFav);
		setFav(nextFav);
	}, [fav, toggleFavoriteThrottled, setFav]);

	const text = useMemo(() => {
		return fav ? "Remove from favorites" : "Add to favorites";
	}, [fav]);

	return (
		<Pressable
			disabled={isLoading || mutating}
			onPress={toggleFavorite}
			className={cn(
				"p-3 px-4 w-full flex flex-row items-center gap-x-2 active:bg-foreground/10",
				isLoading && "opacity-50",
			)}
		>
			<Star className={cn("size-4 text-foreground", fav && "fill-foreground")} size={16} />
			<Text
				className="text-foreground font-medium"
				style={{ fontSize: 14, lineHeight: 16 }}
				maxFontSizeMultiplier={1.2}
			>
				{text}
			</Text>
		</Pressable>
	);
};

const FullscreenButton = ({
	addCloseCallback,
	story,
	triggerClose,
}: {
	addCloseCallback: (name: string, callback: (...args: any[]) => void) => void;
	story: StoryPreview;
	triggerClose: () => void;
}) => {
	const pressRef = useRef<boolean>(null);
	const { _id: storyId, title: storyTitle, imageUrl: storyImageUrl, audioUrl: storyAudioUrl } = story;
	const { playInFullscreen } = usePlayInFullscreen();
	const handleFullScreen = useCallback(() => {
		if (pressRef.current) {
			return;
		}
		pressRef.current = true;
		addCloseCallback("fullscreen", () => {
			pressRef.current = false;
			playInFullscreen({
				storyData: { _id: storyId, title: storyTitle, imageUrl: storyImageUrl, audioUrl: storyAudioUrl },
			});
		});
		triggerClose();
	}, [addCloseCallback, playInFullscreen, storyAudioUrl, storyId, storyImageUrl, storyTitle, triggerClose]);

	return (
		<Pressable
			onPress={handleFullScreen}
			className="p-3 px-4 w-full flex flex-row items-center gap-x-2 active:bg-foreground/10"
		>
			<Fullscreen className="size-4 text-foreground" size={16} />
			<Text
				className="text-foreground font-medium"
				style={{ fontSize: 14, lineHeight: 16 }}
				maxFontSizeMultiplier={1.2}
			>
				Play in fullscreen
			</Text>
		</Pressable>
	);
};

const Collapsible = ({
	open,
	children,
	duration = 250,
	collapsedTranslate = -8, // collapses upward into the row above
}: {
	open: boolean;
	children: React.ReactNode;
	duration?: number;
	collapsedTranslate?: number;
}) => {
	const [contentHeight, setContentHeight] = useState(0);
	const progress = useSharedValue(0);

	// Drive the animation
	useEffect(() => {
		progress.value = withTiming(open ? 1 : 0, {
			duration,
			easing: Easing.out(Easing.cubic),
		});
	}, [duration, open, progress]);

	// Animate height/opacity/translateY based on measured height
	const visibleStyle = useAnimatedStyle(() => {
		return {
			height: contentHeight * progress.value,
			opacity: progress.value,
			transform: [{ translateY: (1 - progress.value) * collapsedTranslate }],
			overflow: "hidden",
		};
	});

	/**
	 * Hidden measurer:
	 * - Lives outside the animated height constraint (absolute, opacity:0).
	 * - Always lays out at natural height so onLayout fires even when closed.
	 */
	const hiddenMeasure = useMemo(
		() => (
			<View
				// Off-flow so it doesn't push layout; invisible but measurable
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					opacity: 0,
					// Ensure it can't block touches
					pointerEvents: "none",
				}}
				onLayout={(e) => {
					const h = Math.ceil(e.nativeEvent.layout.height);
					if (h && h !== contentHeight) setContentHeight(h);
				}}
			>
				{children}
			</View>
		),
		[children, contentHeight],
	);

	return (
		<View style={{ width: "100%" }}>
			{/* Hidden measurer (does not render visually) */}
			{hiddenMeasure}

			{/* Visible, animated container */}
			<Animated.View
				style={visibleStyle}
				// Disable touches while closed
				pointerEvents={open ? "auto" : "none"}
			>
				{/* We render children again here; the above copy is invisible/measuring only */}
				<View>{children}</View>
			</Animated.View>
		</View>
	);
};

const AudioControlsRow = ({ story }: { story: StoryPreview }) => {
	const [loading, setLoading] = useState(false);
	const { play, pause, stop, loadAudio } = useAudio();

	const { currentPlayState } = useAudioPlayState();
	const isBuffering = currentPlayState === State.Ended;
	const isPlaying = currentPlayState === State.Playing;
	const storyActive = useIsStoryActive({ storyId: story._id });
	const storyIsPlaying = isPlaying && storyActive;

	const handleStop = useCallback(() => {
		stop();
	}, [stop]);

	const handlePlayOrPause = useCallback(async () => {
		if (!story.audioUrl) {
			return;
		}
		if (loading || (isBuffering && storyActive)) {
			return;
		}
		if (storyIsPlaying) {
			pause();
			return;
		}
		if (storyActive) {
			play();
			return;
		}

		setLoading(true);
		setAudioStoryData({
			id: story._id,
			title: story.title,
			imageUrl: sanitizeStorageUrl(story.imageUrl ?? ""),
		});
		setAudioUrl({
			url: sanitizeStorageUrl(story.audioUrl ?? ""),
		});
		await loadAudio(true);
		setTimeout(() => {
			setLoading(false);
		}, 250);
	}, [
		story.audioUrl,
		story._id,
		story.title,
		story.imageUrl,
		loading,
		isBuffering,
		storyActive,
		storyIsPlaying,
		loadAudio,
		pause,
		play,
	]);

	const playOrPauseIcon = useMemo(() => {
		if (loading) {
			return <ActivityIndicator size={16} color={NAV_THEME.dark.text} />;
		}
		if (storyIsPlaying) {
			return <Pause className="size-4 text-foreground fill-foreground" size={16} />;
		}
		return <Play className="size-4 text-foreground fill-foreground" size={16} />;
	}, [loading, storyIsPlaying]);

	const playOrPauseText = useMemo(() => {
		if (loading) {
			return "loading story audio...";
		}
		if (storyIsPlaying) {
			return "pause audio";
		}
		return "play audio";
	}, [loading, storyIsPlaying]);

	return (
		<>
			<Pressable
				disabled={loading}
				onPress={handlePlayOrPause}
				className={cn(
					"p-3 px-4 w-full flex flex-row items-center gap-x-2 active:bg-foreground/10",
					loading && "bg-foreground/10",
				)}
			>
				{playOrPauseIcon}
				<Text
					className={cn("text-foreground font-medium", loading && "text-foreground/80")}
					style={{ fontSize: 14, lineHeight: 16 }}
					maxFontSizeMultiplier={1.2}
				>
					{playOrPauseText}
				</Text>
			</Pressable>

			<Collapsible open={storyActive}>
				<Separator className="h-[2px]" />
				<Pressable
					onPress={handleStop}
					className="p-3 px-4 w-full flex flex-row items-center gap-x-2 active:bg-foreground/10 bg-background rounded-b-xl"
				>
					<Stop className="size-4 text-foreground fill-foreground" size={16} />
					<Text
						className="text-foreground font-medium"
						style={{ fontSize: 14, lineHeight: 16 }}
						maxFontSizeMultiplier={1.2}
					>
						Stop
					</Text>
				</Pressable>
			</Collapsible>
		</>
	);
};

const UnlockButton = ({
	storyId,
	addCloseCallback,
	triggerClose,
}: {
	storyId: Id<"stories">;
	addCloseCallback: (name: string, callback: (...args: any[]) => void) => void;
	triggerClose: () => void;
}) => {
	const pressRef = useRef<boolean>(null);
	const handleUnlock = useCallback(() => {
		if (pressRef.current) {
			return;
		}
		pressRef.current = true;
		addCloseCallback("unlock", () => {
			pressRef.current = false;
			router.push(`/upgrade`);
		});
		triggerClose();
	}, [addCloseCallback, triggerClose]);
	return (
		<Pressable
			onPress={handleUnlock}
			className="p-3 px-4 w-full flex flex-row items-center gap-x-2 active:bg-foreground/10"
		>
			<LockKeyholeOpen className="size-4 text-foreground" size={16} />
			<Text
				className="text-foreground font-medium"
				style={{ fontSize: 14, lineHeight: 16 }}
				maxFontSizeMultiplier={1.2}
			>
				Unlock this story
			</Text>
		</Pressable>
	);
};

const LockedStoryContextMenu = ({
	story,
	addCloseCallback,
	triggerClose,
}: {
	story: StoryPreview;
	addCloseCallback: (name: string, callback: (...args: any[]) => void) => void;
	triggerClose: () => void;
}) => {
	return (
		<View className="bg-background w-full rounded-xl border-2 border-border">
			{story.description && <DescriptionRow description={story.description} />}
			{story.description && <Separator className="h-[2px]" />}
			<ShareButton storyId={story._id} storyTitle={story.title} />
			<Separator className="h-[2px]" />
			<UnlockButton storyId={story._id} addCloseCallback={addCloseCallback} triggerClose={triggerClose} />
		</View>
	);
};

const UnlockedStoryContextMenu = ({
	story,
	addCloseCallback,
	triggerClose,
}: {
	story: StoryPreview;
	addCloseCallback: (name: string, callback: (...args: any[]) => void) => void;
	triggerClose: () => void;
}) => {
	return (
		<View className="bg-background w-full rounded-xl border-2 border-border">
			{story.description && <DescriptionRow description={story.description} />}
			{story.description && <Separator className="h-[2px]" />}
			<ShareButton storyId={story._id} storyTitle={story.title} />
			<Separator className="h-[2px]" />
			<AddToFavoritesButton storyId={story._id} />
			<Separator className="h-[2px]" />
			<FullscreenButton addCloseCallback={addCloseCallback} story={story} triggerClose={triggerClose} />
			<Separator className="h-[2px]" />
			<AudioControlsRow story={story} />
		</View>
	);
};

export const StoryContextMenu = ({
	story,
	addCloseCallback,
	triggerClose,
}: {
	story: StoryPreview;
	addCloseCallback: (name: string, callback: (...args: any[]) => void) => void;
	triggerClose: () => void;
}) => {
	const { hasSubscription } = useSubscription();

	const locked = useMemo(() => {
		if (!story.audioUrl) {
			return true;
		}
		if (!story.subscription_required) {
			return false;
		}
		return !hasSubscription;
	}, [story.audioUrl, story.subscription_required, hasSubscription]);

	if (locked) {
		return <LockedStoryContextMenu addCloseCallback={addCloseCallback} story={story} triggerClose={triggerClose} />;
	}

	return <UnlockedStoryContextMenu addCloseCallback={addCloseCallback} story={story} triggerClose={triggerClose} />;
};
