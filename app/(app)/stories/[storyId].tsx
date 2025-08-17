import { Marquee } from "@/components/Marquee";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/icons/calendar-icon";
import { Headphones } from "@/components/ui/icons/headphones-icon";
import { LetterText } from "@/components/ui/icons/letters-text-icon";
import { Pause } from "@/components/ui/icons/pause-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Share } from "@/components/ui/icons/share-icon";
import { Star } from "@/components/ui/icons/star-icon";
import { Image } from "@/components/ui/image";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudio } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SegmentTranscript, StoryExtended } from "@/convex/stories/schema";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { BLUR_HASH } from "@/lib/constants";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import { FlashList, ListRenderItemInfo, type FlashListRef } from "@shopify/flash-list";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { formatDistanceToNow } from "date-fns";
import { BlurView } from "expo-blur";
import { Redirect, useLocalSearchParams } from "expo-router";
import { debounce } from "lodash";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Platform,
	PlatformIOSStatic,
	Pressable,
	Share as RNShare,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import Animated, {
	interpolate,
	LinearTransition,
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Helpers
 */
const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * PAGE
 * ────────────────────────────────────────────────────────────────────────────────
 */

export default function StoryPage() {
	const { storyId } = useLocalSearchParams();
	const { data, error, isLoading } = useConvexQuery(api.stories.queries.getStory, {
		storyId: storyId as Id<"stories">,
	});
	const padeContent = useMemo(() => {
		if (Platform.OS === "ios") {
			const platformIOS = Platform as PlatformIOSStatic;
			if (platformIOS.isPad) {
				if (isLoading || !data) {
					return <StoryTabletLoading />;
				}
				return <StoryContentTablet story={data} />;
			}
		}
		if (isLoading || !data) {
			return <StoryLoading />;
		}
		return <StoryContent story={data} />;
	}, [data, isLoading]);

	if (error && error instanceof ConvexError) {
		if (error.data === "No Subscription") {
			return <Redirect href={"/"} />;
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-slate-900 flex">
			<View className="flex-1 flex-col py-12 px-8 flex relative">{padeContent}</View>
		</SafeAreaView>
	);
}

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * STORY CONTENT
 * ────────────────────────────────────────────────────────────────────────────────
 */

const StoryContent = ({ story }: { story: StoryExtended }) => {
	const [showClosedCaption, setShowClosedCaption] = useState(false);
	const { pause, play, isPlaying, currentTime, duration } = useAudio();
	const [uiTime, setUiTime] = useState(0);

	useAnimatedReaction(
		() => currentTime.value,
		(val, prev) => {
			if (Math.floor(val) !== Math.floor(prev ?? -1)) {
				runOnJS(setUiTime)(val);
			}
		},
		[currentTime],
	);
	const togglePlay = useCallback(() => {
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	}, [isPlaying, pause, play]);

	return (
		<View className="flex flex-1 flex-col items-center relative">
			<StoryHeader story={story} isCollapsed={showClosedCaption} />
			{showClosedCaption && <ClosedCaption transcript={story.transcript} currentTime={uiTime} />}

			{/* ─── PLAYER BAR ──────────────────────────────────────────────────────── */}
			<View className="absolute bottom-0 left-0 right-0 w-full flex flex-col bg-slate-900" style={{ zIndex: 1000 }}>
				<Progress
					value={duration > 0 ? (uiTime / duration) * 100 : 0}
					className="h-2 bg-slate-800 w-full"
					indicatorClassName="bg-slate-500"
				/>

				<View className="flex w-full flex-row justify-between mt-3">
					<Text className="text-slate-400 text-xs">{formatTime(uiTime)}</Text>
					<Text className="text-slate-400 text-xs">{formatTime(duration)}</Text>
				</View>

				<View className="flex w-full flex-col items-center py-4">
					<Pressable
						onPress={togglePlay}
						className="size-20 active:bg-slate-800 rounded-full flex items-center justify-center"
					>
						{isPlaying ? (
							<Pause className="text-white fill-white" size={36} />
						) : (
							<Play className="text-white fill-white" size={36} />
						)}
					</Pressable>
				</View>

				{/* CC Toggle */}
				<View className="flex w-full flex-col items-start pb-6 pl-2">
					<Button
						className={cn("bg-slate-900 rounded-xl border border-slate-900", showClosedCaption && "bg-slate-500")}
						onPress={() => setShowClosedCaption((p) => !p)}
					>
						<LetterText
							className={cn("text-slate-500 size-6", showClosedCaption && "text-slate-900")}
							strokeWidth={2}
							size={20}
						/>
					</Button>
				</View>
			</View>
		</View>
	);
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * CLOSED CAPTION (virtualised + memoised)
 * ────────────────────────────────────────────────────────────────────────────────
 */
const ClosedCaption = ({ transcript, currentTime }: { transcript: SegmentTranscript[]; currentTime: number }) => {
	const listRef = useRef<FlashListRef<SegmentTranscript>>(null);
	const lastKnownIndex = useRef(-1);
	const { duration } = useAudio();

	/** Determine the active segment */
	const currentIndex = useMemo(() => {
		/**
		 * Binary search over *sorted* transcript array.
		 *  – O(log n) instead of O(n)
		 *  – Handles gaps by returning the last segment whose end_time < currentTime.
		 */
		let lo = 0;
		let hi = transcript.length - 1;
		let match = -1;

		while (lo <= hi) {
			const mid = (lo + hi) >> 1; // same as Math.floor((lo+hi)/2)
			const seg = transcript[mid];
			const start = seg?.start_time ?? 0;
			const end = seg?.end_time ?? duration;
			if (currentTime < start) {
				hi = mid - 1;
			} else if (currentTime > end) {
				lo = mid + 1;
			} else {
				match = mid; // we are inside this segment
				break;
			}
		}

		// If no exact match, use the closest *previous* segment so CC doesn’t jump backwards
		const idx = match !== -1 ? match : hi;
		if (idx >= 0) {
			lastKnownIndex.current = idx;
			return idx;
		}
		return lastKnownIndex.current;
	}, [transcript, currentTime, duration]);

	/** Auto‑scroll */
	useEffect(() => {
		if (currentIndex >= 0) {
			listRef.current?.scrollToIndex({ index: currentIndex, animated: true, viewPosition: 0 });
		}
	}, [currentIndex]);

	/** Row renderer (memoised) */
	const renderItem = useCallback(
		({ item, index }: ListRenderItemInfo<SegmentTranscript>) => (
			<TranscriptRow
				key={item.start_time}
				segment={item}
				index={index}
				currentIndex={currentIndex}
				currentTime={currentTime}
			/>
		),
		[currentIndex, currentTime],
	);

	return (
		<View className="flex-1 w-full pt-8">
			<FlashList
				ref={listRef}
				data={transcript}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 16 }}
				// this is for auto-scrolling on last segment... hacky but meh
				ListFooterComponent={() => <View style={{ height: 248 }} />}
			/>

			{/* Top & bottom fade */}
			<BlurView
				intensity={25}
				tint="dark"
				className="absolute top-0 left-0 right-0"
				style={{ zIndex: 1000, height: 64 }}
			/>
			<BlurView
				intensity={12}
				tint="dark"
				className="absolute bottom-40 left-0 right-0"
				style={{ zIndex: 1000, height: 124 }}
			/>
		</View>
	);
};

/**
 * Transcript row – *only* re‑renders when its own status changes
 */
interface TranscriptRowProps {
	segment: SegmentTranscript;
	index: number;
	currentIndex: number;
	currentTime: number;
}

const TranscriptRow = memo<TranscriptRowProps>(
	({ segment, index, currentIndex, currentTime }) => {
		const status = index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming";
		const isGap = index === currentIndex && !(currentTime >= segment.start_time && currentTime <= segment.end_time);

		return (
			<View className={cn("w-full my-20 px-1", status === "upcoming" && "bg-transparent")}>
				<View className="flex flex-row flex-wrap">
					{segment.words.map((word, wIdx) => {
						let textColor = "text-slate-600";
						let fontWeight: "font-normal" | "font-medium" | "font-bold" | "font-semibold" = "font-normal";
						let textShadow = false;

						if (status === "completed") {
							textColor = "text-slate-400";
						} else if (status === "current") {
							const isPrevious = currentTime > word.end_time;
							const isCurrent = currentTime >= word.start_time && currentTime <= word.end_time;

							if (isCurrent) {
								textColor = "text-white";
								fontWeight = "font-semibold";
								textShadow = true;
							} else if (isPrevious || isGap) {
								textColor = "text-slate-200";
								fontWeight = "font-medium";
							} else {
								textColor = "text-slate-500";
							}
						}

						return (
							<Text
								key={`${segment.start_time}-${wIdx}`}
								className={cn("text-2xl", textColor, fontWeight)}
								style={{
									textShadowColor: textShadow ? "rgba(255,255,255,0.4)" : "transparent",
									textShadowOffset: { width: 0, height: 1 },
									textShadowRadius: 3,
								}}
							>
								{word.text}
							</Text>
						);
					})}
				</View>
			</View>
		);
	},
	(prev, next) => prev.currentIndex === next.currentIndex && prev.currentTime === next.currentTime,
);

TranscriptRow.displayName = "TranscriptRow";

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * STORY HEADER (minor perf tweaks)
 * ────────────────────────────────────────────────────────────────────────────────
 */
const StoryHeader = ({ story, isCollapsed }: { story: StoryExtended; isCollapsed: boolean }) => {
	const progress = useSharedValue(isCollapsed ? 1 : 0);

	// Animate collapse / expand
	useEffect(() => {
		progress.value = withTiming(isCollapsed ? 1 : 0, { duration: 250 });
	}, [isCollapsed, progress]);

	const handleShare = useCallback(async () => {
		try {
			await RNShare.share(
				{
					message: `Check out this story on Gushi: ${story.title}`,
					url: `${process.env.EXPO_PUBLIC_WEB_URL}/stories/${story._id}`,
					title: `Share ${story.title}`,
				},
				{ dialogTitle: `Share ${story.title}` },
			);
		} catch (e) {
			console.warn("[StoryHeader] Error sharing story", e);
		}
	}, [story]);

	const { width: screenW } = useWindowDimensions();
	const imgStyle = useAnimatedStyle(() => {
		const size = interpolate(progress.value, [0, 1], [screenW - 48, 80]);
		return { width: size, height: size };
	});

	const titleStyle = useAnimatedStyle(() => {
		return {
			marginTop: interpolate(progress.value, [0, 1], [48, 0]),
			// Use explicit width instead of flex to avoid layout conflicts
			width: isCollapsed ? screenW - 80 - 48 - 16 : "100%", // account for image + gaps
		};
	});

	// ... sharing & favourite handlers remain the same

	return (
		<Animated.View
			layout={LinearTransition.springify().duration(250).stiffness(150).damping(12)}
			style={{
				flexDirection: isCollapsed ? "row" : "column",
				alignItems: "center",
				width: "100%",
				gap: isCollapsed ? 16 : 0,
			}}
		>
			<Animated.View style={[imgStyle, { borderRadius: 16, overflow: "hidden" }]}>
				<StoryImage imageUrl={story.imageUrl} disableAnimation={isCollapsed} />
			</Animated.View>

			{/* Use explicit width calculation instead of flex */}
			<Animated.View
				style={[
					titleStyle,
					{
						flexDirection: "row",
						alignItems: "center",
					},
				]}
			>
				<View className="flex overflow-hidden flex-1 mr-4 flex-col">
					<Marquee speed={0.5} spacing={48} style={{ maxWidth: isCollapsed ? 150 : undefined }}>
						<Text className="text-slate-200 text-2xl font-bold">{story.title}</Text>
					</Marquee>
					<View className="flex flex-row gap-x-2 items-center mt-2">
						<Calendar className="text-slate-400 size-4" strokeWidth={1} />
						<Text className="text-slate-400 text-xs font-medium " numberOfLines={2}>
							{formatDistanceToNow(story.updatedAt, { addSuffix: true })}
						</Text>
					</View>
				</View>

				{/* Fixed width for buttons to prevent them from being cut off */}
				<View className="flex flex-row gap-x-4 items-center" style={{ width: 88 }}>
					<FavoriteButton story={story} />

					<Button
						onPress={handleShare}
						size="icon"
						variant="ghost"
						className="bg-slate-800 rounded-full border border-slate-600"
					>
						<Share className="text-slate-500 size-6" strokeWidth={1.5} size={20} />
					</Button>
				</View>
			</Animated.View>
		</Animated.View>
	);
};

const FavoriteButton = ({ story }: { story: StoryExtended }) => {
	const toggleFavorite = useMutation(api.favorites.mutations.toggleFavorite);
	const [isFavorite, setIsFavorite] = useState(!!story.favorite);

	const debounceToggle = debounce(async (favorite: boolean) => {
		await toggleFavorite({ storyId: story._id, favorite });
	}, 250);

	const handleToggleFavorite = useCallback(async () => {
		if (isFavorite) {
			debounceToggle(false);
		} else {
			debounceToggle(true);
		}
		setIsFavorite((p) => !p);
	}, [isFavorite, debounceToggle, setIsFavorite]);

	return (
		<Button
			size="icon"
			variant="ghost"
			className={cn("bg-slate-800 rounded-full border border-slate-600", isFavorite && "bg-slate-500")}
			onPress={handleToggleFavorite}
		>
			<Star
				className={cn("text-slate-500 size-6", isFavorite && "text-amber-500 fill-amber-500")}
				strokeWidth={1.5}
				size={20}
			/>
		</Button>
	);
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * STORY IMAGE (simpler shadow, single blur)
 * ────────────────────────────────────────────────────────────────────────────────
 */
const StoryImage = ({ imageUrl, disableAnimation }: { imageUrl: string | null; disableAnimation?: boolean }) => {
	const [error, setError] = useState(false);
	const showFallback = error || !imageUrl;
	const { isPlaying } = useAudio();

	const scale = useSharedValue(1);

	useEffect(() => {
		if (disableAnimation) return;
		scale.value = withSpring(isPlaying ? 1 : 0.75, {
			damping: 15,
			stiffness: 150,
		});
	}, [isPlaying, disableAnimation, scale]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	if (showFallback) {
		return (
			<View className="aspect-square w-full rounded-xl bg-slate-800 flex items-center justify-center border border-zinc-700">
				<Headphones className="text-zinc-700" strokeWidth={0.5} />
			</View>
		);
	}

	return (
		<Animated.View style={[animatedStyle, { width: "100%", height: "100%" }]}>
			<View className="w-full h-full rounded-xl bg-slate-800">
				<Image
					source={{ uri: sanitizeStorageUrl(imageUrl) }}
					className="w-full h-full rounded-xl"
					onError={() => setError(true)}
					placeholder={{ blurhash: BLUR_HASH }}
					cachePolicy={"memory-disk"}
					transition={150}
				/>
			</View>
		</Animated.View>
	);
};

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * LOADING SKELETON (unchanged)
 * ────────────────────────────────────────────────────────────────────────────────
 */
const StoryLoading = () => (
	<View className="flex flex-1 flex-col items-center">
		<Skeleton className="aspect-square w-full rounded-xl bg-slate-800" />
		<View className="flex w-full mt-12 flex-row gap-x-8">
			<View className="flex flex-col flex-1">
				<Skeleton className="h-6 w-full rounded-xl bg-slate-800" />
				<Skeleton className="h-4 w-2/5 rounded-xl bg-slate-800 mt-2" />
			</View>
			<View className="flex gap-x-4 flex-row items-center">
				<Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
				<Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
			</View>
		</View>
		<View className="flex w-full mt-12 flex-col">
			<Skeleton className="h-3 w-full rounded-full bg-slate-800" />
			<View className="flex w-full flex-row justify-between mt-3">
				<Skeleton className="h-1 w-16 flex rounded-full bg-slate-800 flex" />
				<Skeleton className="h-1 w-16 flex rounded-full bg-slate-800 flex" />
			</View>
		</View>

		<View className="flex w-full mt-12 flex-col items-center">
			<Skeleton className="size-20 rounded-full bg-slate-800" />
		</View>

		<View className="flex w-full mt-12 flex-col ">
			<Skeleton className="w-20 h-9 rounded-full bg-slate-800" />
		</View>
	</View>
);

const StoryContentTablet = ({ story }: { story: StoryExtended }) => {
	const [showClosedCaption, setShowClosedCaption] = useState(false);
	const { pause, play, isPlaying, currentTime, duration } = useAudio();
	const [uiTime, setUiTime] = useState(0);

	useAnimatedReaction(
		() => currentTime.value,
		(val, prev) => {
			if (Math.floor(val) !== Math.floor(prev ?? -1)) {
				runOnJS(setUiTime)(val);
			}
		},
		[currentTime],
	);
	const togglePlay = useCallback(() => {
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	}, [isPlaying, pause, play]);

	return (
		<View className="flex flex-1 flex-col items-center relative w-2/3 mx-auto">
			<StoryHeaderTablet story={story} isCollapsed={showClosedCaption} />
			{showClosedCaption && <ClosedCaption transcript={story.transcript} currentTime={uiTime} />}

			{/* ─── PLAYER BAR ──────────────────────────────────────────────────────── */}
			<View className="absolute bottom-0 left-0 right-0 w-full flex flex-col bg-slate-900" style={{ zIndex: 1000 }}>
				<Progress
					value={duration > 0 ? (uiTime / duration) * 100 : 0}
					className="h-2 bg-slate-800 w-full"
					indicatorClassName="bg-slate-500"
				/>

				<View className="flex w-full flex-row justify-between mt-3">
					<Text className="text-slate-400 text-xs">{formatTime(uiTime)}</Text>
					<Text className="text-slate-400 text-xs">{formatTime(duration)}</Text>
				</View>

				<View className="flex w-full flex-col items-center py-4">
					<Pressable
						onPress={togglePlay}
						className="size-20 active:bg-slate-800 rounded-full flex items-center justify-center"
					>
						{isPlaying ? (
							<Pause className="text-white fill-white" size={36} />
						) : (
							<Play className="text-white fill-white" size={36} />
						)}
					</Pressable>
				</View>

				{/* CC Toggle */}
				<View className="flex w-full flex-col items-start pb-6 pl-2">
					<Button
						className={cn("bg-slate-900 rounded-xl border border-slate-900", showClosedCaption && "bg-slate-500")}
						onPress={() => setShowClosedCaption((p) => !p)}
					>
						<LetterText
							className={cn("text-slate-500 size-6", showClosedCaption && "text-slate-900")}
							strokeWidth={2}
							size={20}
						/>
					</Button>
				</View>
			</View>
		</View>
	);
};

const StoryTabletLoading = () => {
	return (
		<View className="flex flex-1 flex-col items-center">
			<Skeleton className="aspect-square w-2/3 rounded-xl bg-slate-800" />
			<View className="flex w-2/3 mt-12 flex-row gap-x-8 mx-auto">
				<View className="flex flex-col flex-1">
					<Skeleton className="h-6 w-1/5 rounded-xl bg-slate-800" />
					<Skeleton className="h-4 w-2/5 rounded-xl bg-slate-800 mt-2" />
				</View>
				<View className="flex gap-x-4 flex-row items-center">
					<Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
					<Skeleton className="h-10 w-10 rounded-full bg-slate-800" />
				</View>
			</View>
		</View>
	);
};

const StoryHeaderTablet = ({ story, isCollapsed }: { story: StoryExtended; isCollapsed: boolean }) => {
	const progress = useSharedValue(isCollapsed ? 1 : 0);

	// Animate collapse / expand
	useEffect(() => {
		progress.value = withTiming(isCollapsed ? 1 : 0, { duration: 250 });
	}, [isCollapsed, progress]);

	const handleShare = useCallback(async () => {
		try {
			await RNShare.share(
				{
					message: `Check out this story on Gushi: ${story.title}`,
					url: `${process.env.EXPO_PUBLIC_WEB_URL}/stories/${story._id}`,
					title: `Share ${story.title}`,
				},
				{ dialogTitle: `Share ${story.title}` },
			);
		} catch (e) {
			console.warn("[StoryHeader] Error sharing story", e);
		}
	}, [story]);

	const imgStyle = useAnimatedStyle(() => {
		const size = interpolate(progress.value, [0, 1], [248, 80]);
		return { width: size, height: size };
	});

	const titleStyle = useAnimatedStyle(() => {
		return {
			marginTop: interpolate(progress.value, [0, 1], [48, 0]),
			// Use explicit width instead of flex to avoid layout conflicts
			width: isCollapsed ? 48 - 16 : "100%", // account for image + gaps
		};
	});

	// ... sharing & favourite handlers remain the same

	return (
		<Animated.View
			layout={LinearTransition.springify().duration(250).stiffness(150).damping(12)}
			style={{
				flexDirection: isCollapsed ? "row" : "column",
				alignItems: "center",
				width: "100%",
				gap: isCollapsed ? 16 : 0,
			}}
		>
			<Animated.View style={[imgStyle, { borderRadius: 16, overflow: "hidden" }]}>
				<StoryImage imageUrl={story.imageUrl} disableAnimation={isCollapsed} />
			</Animated.View>

			{/* Use explicit width calculation instead of flex */}
			<Animated.View
				style={[
					titleStyle,
					{
						flexDirection: "row",
						alignItems: "center",
					},
				]}
			>
				<View className="flex overflow-hidden flex-1 mr-4 flex-col">
					<Marquee speed={0.5} spacing={48} style={{ maxWidth: isCollapsed ? 150 : undefined }}>
						<Text className="text-slate-200 text-2xl font-bold">{story.title}</Text>
					</Marquee>
					<View className="flex flex-row gap-x-2 items-center mt-2">
						<Calendar className="text-slate-400 size-4" strokeWidth={1} />
						<Text className="text-slate-400 text-xs font-medium " numberOfLines={2}>
							{formatDistanceToNow(story.updatedAt, { addSuffix: true })}
						</Text>
					</View>
				</View>

				{/* Fixed width for buttons to prevent them from being cut off */}
				<View className="flex flex-row gap-x-4 items-center" style={{ width: 88 }}>
					<FavoriteButton story={story} />

					<Button
						onPress={handleShare}
						size="icon"
						variant="ghost"
						className="bg-slate-800 rounded-full border border-slate-600"
					>
						<Share className="text-slate-500 size-6" strokeWidth={1.5} size={20} />
					</Button>
				</View>
			</Animated.View>
		</Animated.View>
	);
};
