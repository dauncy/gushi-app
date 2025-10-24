import { Marquee } from "@/components/Marquee";
import { Button } from "@/components/ui/button";
import { FastForward } from "@/components/ui/icons/fast-forward-icon";
import { Headphones } from "@/components/ui/icons/headphones-icon";
import { LetterText } from "@/components/ui/icons/letters-text-icon";
import { Pause } from "@/components/ui/icons/pause-icon";
import { Play } from "@/components/ui/icons/play-icon";
import { Rewind } from "@/components/ui/icons/rewind-icon";
import { Share } from "@/components/ui/icons/share-icon";
import { Star } from "@/components/ui/icons/star-icon";
import { Image } from "@/components/ui/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useAudio, useAudioCurrentTime, useAudioDuration, useHasNext, useIsAudioInState } from "@/context/AudioContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SegmentTranscript, StoryExtended } from "@/convex/stories/schema";
import { useConvexQuery } from "@/hooks/use-convexQuery";
import { useFavorite } from "@/hooks/use-favorite";
import { useShareStory } from "@/hooks/use-share-story";
import { BLUR_HASH } from "@/lib/constants";
import { cn, sanitizeStorageUrl } from "@/lib/utils";
import { FlashList, ListRenderItemInfo, type FlashListRef } from "@shopify/flash-list";
import { ConvexError } from "convex/values";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { debounce } from "lodash";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	LayoutChangeEvent,
	Platform,
	PlatformIOSStatic,
	Pressable,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
import { State } from "react-native-track-player";

const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export default function StoryPage() {
	const { storyId } = useLocalSearchParams();
	const { data, error, isLoading } = useConvexQuery(api.stories.queries.getStory, {
		storyId: storyId as Id<"stories">,
	});
	const isAudioLoading = useIsAudioInState({ state: State.Loading });
	const pageContent = useMemo(() => {
		if (Platform.OS === "ios") {
			const platformIOS = Platform as PlatformIOSStatic;
			if (platformIOS.isPad) {
				if (isLoading || !data || isAudioLoading) {
					return <StoryTabletLoading />;
				}
				return <StoryContentTablet story={data} />;
			}
		}
		if (isLoading || !data || isAudioLoading) {
			return <StoryLoading />;
		}
		return <StoryContent story={data} />;
	}, [data, isLoading, isAudioLoading]);

	if (error && error instanceof ConvexError) {
		if (error.data === "No Subscription") {
			return <Redirect href={"/"} />;
		}
	}

	return (
		<SafeAreaView className="flex-1 bg-background flex">
			<View className="flex-1 flex-col py-12 px-8 flex relative">{pageContent}</View>
		</SafeAreaView>
	);
}

const ScrubbableProgress = ({
	duration,
	uiTime,
	onPreview,
	onCommit,
	className,
	indicatorClassName,
}: {
	duration: number;
	uiTime: number;
	onPreview: (time: number) => void;
	onCommit: (time: number) => void;
	className?: string;
	indicatorClassName?: string;
}) => {
	// width used by JS, but we also mirror it into a SharedValue for UI worklets
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_, setBarWidth] = useState(1);
	const barWidthSV = useSharedValue(1);

	const isScrubbing = useSharedValue(false);
	const progress = useSharedValue(0); // 0..1

	// Keep progress in sync with uiTime when NOT scrubbing (on JS thread)
	useEffect(() => {
		if (!isScrubbing.value && duration > 0) {
			progress.value = uiTime / duration;
		}
	}, [uiTime, duration, isScrubbing, progress]);

	const onBarLayout = (e: LayoutChangeEvent) => {
		const w = Math.max(1, e.nativeEvent.layout.width);
		setBarWidth(w);
		barWidthSV.value = w;
	};

	const handleHaptics = async () => {
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	// Gesture handlers (UI thread worklets) – no JS helpers!
	const pan = Gesture.Pan()
		.onBegin((e) => {
			"worklet";
			runOnJS(handleHaptics)();
			isScrubbing.value = true;

			const w = barWidthSV.value;
			const p = Math.max(0, Math.min(1, e.x / (w || 1)));
			progress.value = p;
			runOnJS(onPreview)(p * duration);
		})
		.onChange(async (e) => {
			"worklet";
			const w = barWidthSV.value;
			const p = Math.max(0, Math.min(1, e.x / (w || 1)));
			progress.value = p;
			runOnJS(onPreview)(p * duration);
		})
		.onFinalize(() => {
			"worklet";
			const p = progress.value;
			isScrubbing.value = false;
			runOnJS(onCommit)(p * duration);
		});

	const tap = Gesture.Tap()
		.maxDuration(250)
		.onStart(async (e) => {
			"worklet";
			const w = barWidthSV.value;
			const p = Math.max(0, Math.min(1, e.x / (w || 1)));
			progress.value = p;
			runOnJS(onPreview)(p * duration);
		})
		.onEnd(() => {
			"worklet";
			const p = progress.value;
			runOnJS(onCommit)(p * duration);
		});

	const gesture = Gesture.Simultaneous(pan, tap);

	const indicatorStyle = useAnimatedStyle(() => {
		"worklet";
		const pct = Math.max(0, Math.min(1, progress.value)) * 100;
		return { width: `${pct}%` };
	});

	return (
		<GestureDetector gesture={gesture}>
			<View className="py-2">
				<View
					onLayout={onBarLayout}
					className={className ?? "h-2 bg-foreground/10 w-full rounded-full overflow-hidden"}
					style={{ position: "relative" }}
				>
					<Animated.View className={indicatorClassName ?? "bg-foreground/80 h-full"} style={indicatorStyle} />

					<View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: -12, bottom: -12 }} />
				</View>
			</View>
		</GestureDetector>
	);
};

const StoryContent = ({ story }: { story: StoryExtended }) => {
	const pressRef = useRef(false);
	const [showClosedCaption, setShowClosedCaption] = useState(false);
	const { pause, play, seek, gotoNext, gotoPrev } = useAudio();
	const [uiTime, setUiTime] = useState(0);
	const currentTime = useSharedValue(0);
	const audioCurrentTime = useAudioCurrentTime();
	const isPlaying = useIsAudioInState({ state: State.Playing });
	const duration = useAudioDuration();
	const hasPrev = true;
	const hasNext = useHasNext();
	const router = useRouter();

	const handlePrev = useCallback(async () => {
		if (!hasPrev) return;
		if (pressRef.current) return;
		pressRef.current = true;
		await gotoPrev((item) => {
			router.setParams({ storyId: item.id });
			setTimeout(() => {
				pressRef.current = false;
			}, 350);
		});
	}, [gotoPrev, router, hasPrev]);

	const handleNext = useCallback(async () => {
		if (!hasNext) return;
		if (pressRef.current) return;
		pressRef.current = true;
		await gotoNext((item) => {
			router.setParams({ storyId: item.id });
			setTimeout(() => {
				pressRef.current = false;
			}, 350);
		});
	}, [gotoNext, router, hasNext]);

	useEffect(() => {
		currentTime.value = audioCurrentTime;
	}, [audioCurrentTime, currentTime]);

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

	// While scrubbing, preview the time in the UI without moving audio yet
	const handlePreview = useCallback(
		(t: number) => {
			setUiTime(t);
		},
		[setUiTime],
	);

	// On release/tap, commit the seek to the audio engine
	const handleCommit = useCallback(
		async (t: number) => {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
			setUiTime(t);
			seek(t);
		},
		[setUiTime, seek],
	);

	return (
		<>
			<StatusBar style="light" />
			<View className="flex flex-1 flex-col items-center relative bg-background">
				<StoryHeader story={story} isCollapsed={showClosedCaption} />
				{showClosedCaption && <ClosedCaption transcript={story.transcript} currentTime={uiTime} />}

				{/* ─── PLAYER BAR ──────────────────────────────────────────────────────── */}
				<View
					className="absolute bottom-0 left-0 right-0 w-full flex flex-col bg-background pt-4"
					style={{ zIndex: 1000 }}
				>
					<ScrubbableProgress
						duration={duration || 0}
						uiTime={uiTime}
						onPreview={handlePreview}
						onCommit={handleCommit}
						className="h-2 bg-foreground/10 w-full rounded-full overflow-hidden"
						indicatorClassName="bg-foreground/80 h-full"
					/>

					<View className="flex w-full flex-row justify-between mt-3">
						<Text className="text-foreground/80 text-xs">{formatTime(uiTime)}</Text>
						<Text className="text-foreground/80 text-xs">{formatTime(duration)}</Text>
					</View>

					<View className="flex w-full flex-row items-center py-4 gap-x-2 justify-center">
						<Pressable
							onPress={handlePrev}
							disabled={!hasPrev}
							className="disabled:opacity-50 flex size-[44px] rounded-full active:bg-foreground/10 items-center justify-center"
						>
							<Rewind className="text-foreground/80 fill-foreground/80" size={24} />
						</Pressable>
						<Pressable
							onPress={togglePlay}
							className="size-20 active:bg-foreground/10 rounded-full flex items-center justify-center"
						>
							{isPlaying ? (
								<Pause className="text-foreground/80 fill-foreground/80" size={36} />
							) : (
								<Play className="text-foreground/80 fill-foreground/80" size={36} />
							)}
						</Pressable>

						<Pressable
							onPress={handleNext}
							disabled={!hasNext}
							className="disabled:opacity-50 flex size-[44px] rounded-full active:bg-foreground/10 items-center justify-center"
						>
							<FastForward className="text-foreground/80 fill-foreground/80" size={24} />
						</Pressable>
					</View>

					{/* CC Toggle */}
					<View className="flex w-full flex-col items-start pb-6 pl-2 bg-background">
						<Button
							className={cn("bg-background rounded-xl border border-foreground", showClosedCaption && "bg-foreground")}
							onPress={() => setShowClosedCaption((p) => !p)}
						>
							<LetterText
								className={cn("text-foreground/80 size-6", showClosedCaption && "text-background")}
								strokeWidth={2}
								size={20}
							/>
						</Button>
					</View>
				</View>
			</View>
		</>
	);
};

const ClosedCaption = ({ transcript, currentTime }: { transcript: SegmentTranscript[]; currentTime: number }) => {
	const listRef = useRef<FlashListRef<SegmentTranscript>>(null);
	const lastKnownIndex = useRef(-1);
	const duration = useAudioDuration();

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
			if (currentIndex === transcript.length - 1) {
				listRef.current?.scrollToEnd({ animated: true });
				return;
			}
			listRef.current?.scrollToIndex({ index: currentIndex, animated: true, viewPosition: -0.15 });
		}
	}, [currentIndex, transcript]);

	/** Row renderer (memoised) */
	const renderItem = useCallback(
		({ item, index }: ListRenderItemInfo<SegmentTranscript>) => (
			<TranscriptRow
				key={item.start_time}
				segment={item}
				isLast={index === transcript.length - 1}
				index={index}
				currentIndex={currentIndex}
				currentTime={currentTime}
			/>
		),
		[currentIndex, currentTime, transcript],
	);

	return (
		<View className="flex-1 w-full pt-8">
			<FlashList
				ref={listRef}
				data={transcript}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				// this is for auto-scrolling on last segment... hacky but meh
				ListFooterComponent={() => <View style={{ height: 248 }} />}
			/>

			{/* Top & bottom fade */}
			<BlurView
				intensity={25}
				tint="light"
				className="absolute top-0 left-0 right-0"
				style={{ zIndex: 1000, height: 64 }}
			/>
			<BlurView
				intensity={12}
				tint="light"
				className="absolute bottom-40 left-0 right-0"
				style={{ zIndex: 1000, height: 124 }}
			/>
		</View>
	);
};

interface TranscriptRowProps {
	segment: SegmentTranscript;
	index: number;
	currentIndex: number;
	currentTime: number;
	isLast: boolean;
}

const TranscriptRow = memo<TranscriptRowProps>(
	({ segment, index, currentIndex, currentTime, isLast }) => {
		const status = index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming";
		const isGap = index === currentIndex && !(currentTime >= segment.start_time && currentTime <= segment.end_time);

		return (
			<View
				className={cn("w-full  px-1 min-h-[228px]", status === "upcoming" && "bg-transparent", isLast ? "" : "my-20")}
			>
				<View className="flex flex-row flex-wrap">
					{segment.words.map((word, wIdx) => {
						let textColor = "text-foreground/80";
						let fontWeight: "font-normal" | "font-medium" | "font-bold" | "font-semibold" = "font-normal";
						let textShadow = false;

						if (status === "completed") {
							textColor = "text-foreground/80";
						} else if (status === "current") {
							const isPrevious = currentTime > word.end_time;
							const isCurrent = currentTime >= word.start_time && currentTime <= word.end_time;

							if (isCurrent) {
								textColor = "text-primary";
								fontWeight = "font-semibold";
								textShadow = true;
							} else if (isPrevious || isGap) {
								textColor = "text-foreground/80";
								fontWeight = "font-medium";
							} else {
								textColor = "text-foreground/60";
							}
						}

						return (
							<Text
								key={`${segment.start_time}-${wIdx}`}
								className={cn("text-3xl", textColor, fontWeight)}
								style={{
									textShadowColor: textShadow ? "#0395ff" : "transparent",
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

const StoryHeader = ({ story, isCollapsed }: { story: StoryExtended; isCollapsed: boolean }) => {
	const progress = useSharedValue(isCollapsed ? 1 : 0);
	const { shareStory } = useShareStory();
	useEffect(() => {
		progress.value = withTiming(isCollapsed ? 1 : 0, { duration: 250 });
	}, [isCollapsed, progress]);

	const handleShare = useCallback(async () => {
		await shareStory({ storyId: story._id, storyTitle: story.title });
	}, [story._id, story.title, shareStory]);

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

	return (
		<Animated.View
			layout={LinearTransition.springify().duration(250).stiffness(150).damping(12)}
			style={{
				flexDirection: isCollapsed ? "row" : "column",
				alignItems: isCollapsed ? "flex-start" : "center",
				width: "100%",
				gap: isCollapsed ? 16 : 0,
			}}
		>
			<Animated.View style={[imgStyle, { borderRadius: 16, overflow: "hidden" }]}>
				<StoryImage imageUrl={story.imageUrl} disableAnimation={isCollapsed} blurHash={story.blurHash ?? undefined} />
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
						<Text className="text-foreground/80 text-2xl font-bold">{story.title}</Text>
					</Marquee>
				</View>

				{/* Fixed width for buttons to prevent them from being cut off */}
				<View className="flex flex-row gap-x-4 items-center justify-center h-full" style={{ width: 88 }}>
					<FavoriteButton story={story} />

					<Button
						onPress={handleShare}
						size="icon"
						variant="ghost"
						className="bg-foreground/10 rounded-full border border-foreground"
					>
						<Share className="text-foreground size-6" strokeWidth={1.5} size={20} />
					</Button>
				</View>
			</Animated.View>
		</Animated.View>
	);
};

const FavoriteButton = ({ story }: { story: StoryExtended }) => {
	const { handleToggleFavorite, favorite, isLoading } = useFavorite({ storyId: story._id });
	const [isFavorite, setIsFavorite] = useState(!!favorite);

	const debounceToggle = debounce(async (favorite: boolean) => {
		await handleToggleFavorite(favorite);
	}, 250);

	const toggleFavorite = useCallback(async () => {
		if (isFavorite) {
			debounceToggle(false);
		} else {
			debounceToggle(true);
		}
		setIsFavorite((p) => !p);
	}, [isFavorite, debounceToggle, setIsFavorite]);

	if (isLoading) {
		return <Skeleton className="size-10 rounded-full bg-foreground/20" />;
	}

	return (
		<Button
			disabled={isLoading}
			size="icon"
			variant="ghost"
			className={cn(
				"bg-foreground/10 rounded-full border border-foreground",
				isFavorite && "bg-secondary border-border",
			)}
			onPress={toggleFavorite}
		>
			<Star
				className={cn("text-foreground size-6", isFavorite && "text-border fill-border")}
				strokeWidth={1.5}
				size={20}
			/>
		</Button>
	);
};

const StoryImage = ({
	imageUrl,
	disableAnimation,
	blurHash = BLUR_HASH,
}: {
	imageUrl: string | null;
	disableAnimation?: boolean;
	blurHash?: string;
}) => {
	const [error, setError] = useState(false);
	const showFallback = error || !imageUrl;
	const isPaused = useIsAudioInState({ state: State.Paused });

	const scale = useSharedValue(1);

	useEffect(() => {
		if (disableAnimation) return;
		scale.value = withSpring(!isPaused ? 1 : 0.75, {
			damping: 15,
			stiffness: 150,
		});
	}, [isPaused, disableAnimation, scale]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	if (showFallback) {
		return (
			<View className="aspect-square w-full rounded-xl bg-foreground/10 flex items-center justify-center border border-border">
				<Headphones className="text-border" strokeWidth={0.5} />
			</View>
		);
	}

	return (
		<Animated.View style={[animatedStyle, { width: "100%", height: "100%" }]}>
			<View className="w-full h-full rounded-xl bg-foreground/20">
				<Image
					source={{ uri: sanitizeStorageUrl(imageUrl) }}
					className="w-full h-full rounded-xl"
					onError={() => setError(true)}
					placeholder={{ blurhash: blurHash }}
					cachePolicy={"memory-disk"}
					transition={100}
				/>
			</View>
		</Animated.View>
	);
};

const StoryLoading = () => (
	<View className="flex flex-1 flex-col items-center">
		<Skeleton className="aspect-square w-full rounded-xl bg-foreground/20" />
		<View className="flex w-full mt-12 flex-row gap-x-8 justify-center">
			<View className="flex flex-col flex-1 justify-center">
				<Skeleton className="h-8 w-full rounded-xl bg-foreground/20" />
			</View>
			<View className="flex gap-x-4 flex-row items-center">
				<Skeleton className="h-10 w-10 rounded-full bg-foreground/20" />
				<Skeleton className="h-10 w-10 rounded-full bg-foreground/20" />
			</View>
		</View>
		<View className="flex w-full mt-12 flex-col">
			<Skeleton className="h-3 w-full rounded-full bg-foreground/20" />
			<View className="flex w-full flex-row justify-between mt-3">
				<Skeleton className="h-1 w-16 flex rounded-full bg-foreground/20 flex" />
				<Skeleton className="h-1 w-16 flex rounded-full bg-foreground/20 flex" />
			</View>
		</View>

		<View className="flex w-full mt-12 flex-col items-center">
			<Skeleton className="size-20 rounded-full bg-foreground/20" />
		</View>

		<View className="flex w-full mt-12 flex-col ">
			<Skeleton className="w-20 h-9 rounded-full bg-foreground/20" />
		</View>
	</View>
);

const StoryContentTablet = ({ story }: { story: StoryExtended }) => {
	const [showClosedCaption, setShowClosedCaption] = useState(false);
	const { pause, play, seek } = useAudio();
	const [uiTime, setUiTime] = useState(0);
	const currentTime = useSharedValue(0);
	const audioCurrentTime = useAudioCurrentTime();
	const isPlaying = useIsAudioInState({ state: State.Playing });
	const duration = useAudioDuration();

	useEffect(() => {
		currentTime.value = audioCurrentTime;
	}, [audioCurrentTime, currentTime]);

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

	// While scrubbing, preview the time in the UI without moving audio yet
	const handlePreview = useCallback(
		(t: number) => {
			setUiTime(t);
		},
		[setUiTime],
	);

	// On release/tap, commit the seek to the audio engine
	const handleCommit = useCallback(
		async (t: number) => {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
			setUiTime(t);
			seek(t);
		},
		[setUiTime, seek],
	);

	return (
		<View className="flex flex-1 flex-col items-center relative w-2/3 mx-auto">
			<StoryHeaderTablet story={story} isCollapsed={showClosedCaption} />
			{showClosedCaption && <ClosedCaption transcript={story.transcript} currentTime={uiTime} />}

			{/* ─── PLAYER BAR ──────────────────────────────────────────────────────── */}
			<View className="absolute bottom-0 left-0 right-0 w-full flex flex-col bg-background" style={{ zIndex: 1000 }}>
				<ScrubbableProgress
					duration={duration || 0}
					uiTime={uiTime}
					onPreview={handlePreview}
					onCommit={handleCommit}
					className="h-2 bg-foreground/10 w-full rounded-full overflow-hidden"
					indicatorClassName="bg-foreground/80 h-full"
				/>

				<View className="flex w-full flex-row justify-between mt-3">
					<Text className="text-foreground/80 text-xs">{formatTime(uiTime)}</Text>
					<Text className="text-foreground/80 text-xs">{formatTime(duration)}</Text>
				</View>

				<View className="flex w-full flex-col items-center py-4">
					<Pressable
						onPress={togglePlay}
						className="size-20 active:bg-foreground/10 rounded-full flex items-center justify-center"
					>
						{isPlaying ? (
							<Pause className="text-foreground/80 fill-foreground/80" size={36} />
						) : (
							<Play className="text-foreground/80 fill-foreground/80" size={36} />
						)}
					</Pressable>
				</View>

				{/* CC Toggle */}
				<View className="flex w-full flex-col items-start pb-6 pl-2">
					<Button
						className={cn("bg-foreground/10 rounded-xl border border-foreground", showClosedCaption && "bg-foreground")}
						onPress={() => setShowClosedCaption((p) => !p)}
					>
						<LetterText
							className={cn("text-foreground/80 size-6", showClosedCaption && "text-background")}
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
			<Skeleton className="aspect-square w-2/3 rounded-xl bg-foreground/20" />
			<View className="flex w-2/3 mt-12 flex-row gap-x-8 mx-auto">
				<View className="flex flex-col flex-1">
					<Skeleton className="h-6 w-1/5 rounded-xl bg-foreground/20" />
					<Skeleton className="h-4 w-2/5 rounded-xl bg-foreground/20 mt-2" />
				</View>
				<View className="flex gap-x-4 flex-row items-center">
					<Skeleton className="h-10 w-10 rounded-full bg-foreground/20" />
					<Skeleton className="h-10 w-10 rounded-full bg-foreground/20" />
				</View>
			</View>
		</View>
	);
};

const StoryHeaderTablet = ({ story, isCollapsed }: { story: StoryExtended; isCollapsed: boolean }) => {
	const progress = useSharedValue(isCollapsed ? 1 : 0);
	const { shareStory } = useShareStory();

	// Animate collapse / expand
	useEffect(() => {
		progress.value = withTiming(isCollapsed ? 1 : 0, { duration: 250 });
	}, [isCollapsed, progress]);

	const handleShare = useCallback(async () => {
		await shareStory({ storyId: story._id, storyTitle: story.title });
	}, [story._id, story.title, shareStory]);

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
				<StoryImage imageUrl={story.imageUrl} disableAnimation={isCollapsed} blurHash={story.blurHash ?? undefined} />
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
						<Text className="text-foreground/80 text-2xl font-bold">{story.title}</Text>
					</Marquee>
				</View>

				{/* Fixed width for buttons to prevent them from being cut off */}
				<View className="flex flex-row gap-x-4 items-center" style={{ width: 88 }}>
					<FavoriteButton story={story} />

					<Button
						onPress={handleShare}
						size="icon"
						variant="ghost"
						className="bg-foreground/10 rounded-full border border-foreground"
					>
						<Share className="text-foreground/80 size-6" strokeWidth={1.5} size={20} />
					</Button>
				</View>
			</Animated.View>
		</Animated.View>
	);
};
